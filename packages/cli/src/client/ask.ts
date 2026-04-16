import {
  extractConversationText,
  isCascadeIdle,
  isConversationFinished,
  type ConversationData,
} from "../contracts/conversation";
import type { BridgeHttpClient } from "./http";

export interface AskOptions {
  model?: string | number;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
  signal?: AbortSignal;
  onPoll?: () => void;
  onPollError?: (error: unknown) => void;
  sleep?: (milliseconds: number) => Promise<void>;
  /** Number of retry attempts for MODEL_CAPACITY_EXHAUSTED errors (default: 3) */
  maxRetries?: number;
  /** Base delay in ms between retries (default: 5000) */
  retryBaseDelayMs?: number;
  /** Called when a retry is about to happen */
  onRetry?: (attempt: number, delayMs: number, reason: string) => void;
}

export interface AskResult {
  conversationId: string;
  conversation: ConversationData;
  text: string | null;
}

const RETRYABLE_SUBSTRING = "MODEL_CAPACITY_EXHAUSTED";

/** Error with a volatile `retryable` flag used to communicate non-retryable
 *  intermediate states (e.g. "conversation not finished yet") up through
 *  the retry wrapper. */
interface RetryableError extends Error {
  retryable: boolean;
}

/**
 * Checks whether an HTTP error message contains a MODEL_CAPACITY_EXHAUSTED
 * error. This is a transient backend error that should be retried.
 */
function isCapacityExhaustedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes(RETRYABLE_SUBSTRING);
}

/**
 * Determines whether an error is non-retryable and should abort polling immediately.
 */
function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    // HTTP 4xx client errors — do not retry (5xx may be transient)
    if (/^HTTP 4\d\d:/.test(msg)) return true;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an operation with exponential backoff when a retryable error is
 * detected. Jitter is applied to avoid thundering herd.
 *
 * Operations that are still in-progress (not yet failed) should throw an
 * error with `retryable = false` so that withRetry re-raises it without
 * counting it as a retry attempt.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: AskOptions,
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.retryBaseDelayMs ?? 5000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      const isExplicitlyNonRetryable =
        (err as RetryableError).retryable === false;
      const isRetryable =
        !isExplicitlyNonRetryable && isCapacityExhaustedError(err);
      const isLastAttempt = attempt > maxRetries;

      if (!isRetryable || isLastAttempt) {
        throw err;
      }

      // Exponential backoff with full jitter (0 – 2× baseDelayMs × 2^(attempt-1))
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = exponentialDelay * Math.random();
      const delayMs = Math.min(jitter, 60_000);

      options.onRetry?.(attempt, Math.round(delayMs), RETRYABLE_SUBSTRING);
      await (options.sleep ?? delay)(delayMs);
    }
  }

  // Unreachable, but satisfies TypeScript
  throw lastError;
}

/**
 * Creates a headless conversation, retrying on MODEL_CAPACITY_EXHAUSTED errors.
 */
async function createConversationWithRetry(
  client: BridgeHttpClient,
  text: string,
  options: AskOptions,
): Promise<string> {
  return withRetry(async () => {
    const createResult = await client.createConversation(text, options.model);
    const jobId = createResult.job_id;

    if (!createResult.success || !jobId) {
      throw new Error(
        "Failed to obtain job_id after creating a conversation.",
      );
    }

    return jobId;
  }, options);
}

/**
 * Polls the conversation until it is finished and idle. Intermediate "not ready"
 * states throw with `retryable = false` so the outer polling loop keeps waiting
 * without consuming retry budget.
 */
async function pollWithRetry(
  client: BridgeHttpClient,
  conversationId: string,
  options: AskOptions,
): Promise<ConversationData> {
  return withRetry(async () => {
    const conversation = await client.getConversation(conversationId);

    if (!isConversationFinished(conversation)) {
      const err = new Error("conversation not finished") as RetryableError;
      err.retryable = false;
      throw err;
    }

    const conversations = await client.listConversations();
    if (!isCascadeIdle(conversations, conversationId)) {
      const err = new Error("cascade not idle") as RetryableError;
      err.retryable = false;
      throw err;
    }

    return conversation;
  }, options);
}

export async function waitForAskResponse(
  client: BridgeHttpClient,
  text: string,
  options: AskOptions = {},
): Promise<AskResult> {
  const pollIntervalMs = options.pollIntervalMs ?? 3000;
  const pollTimeoutMs = options.pollTimeoutMs ?? 120000;
  const sleep = options.sleep ?? delay;
  const deadline = Date.now() + pollTimeoutMs;

  // Check abort signal before starting
  if (options.signal?.aborted) {
    throw new Error("Aborted before starting");
  }

  const jobId = await createConversationWithRetry(client, text, options);

  while (true) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(
        `Timed out waiting for final agent response after ${pollTimeoutMs}ms.`,
      );
    }

    const sleepTime = Math.min(pollIntervalMs, remaining);
    await sleep(sleepTime);

    if (options.signal?.aborted) {
      throw new Error("Aborted during polling");
    }

    options.onPoll?.();

    try {
      const job = await client.getConversationJob(jobId);

      if (job.status === "failed") {
        throw new Error(job.error ?? "Conversation job failed");
      }

      if (!job.conversation_id) {
        const err = new Error("conversation job not completed") as RetryableError;
        err.retryable = false;
        throw err;
      }

      const conversationId = job.conversation_id;
      const conversation = await pollWithRetry(client, conversationId, options);

      return {
        conversationId,
        conversation,
        text: extractConversationText(conversation),
      };
    } catch (error) {
      options.onPollError?.(error);

      if (isNonRetryableError(error)) {
        throw error;
      }
    }
  }
}
