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

// Sentinel error thrown by the SDK poll loop to halt polling immediately
class TerminalAskPollingError extends Error {}

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
function isCapacityExhaustedError(error: unknown): error is RetryableError {
  if (!(error instanceof Error)) return false;
  return error.message.includes(RETRYABLE_SUBSTRING);
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
      const isRetryable = !isExplicitlyNonRetryable && isCapacityExhaustedError(err);
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
 * Sends the user text via the visible-chat endpoint, retrying on
 * MODEL_CAPACITY_EXHAUSTED errors.
 */
async function sendWithRetry(
  client: BridgeHttpClient,
  text: string,
  options: AskOptions,
): Promise<string> {
  return withRetry(async () => {
    const sendResult = await client.sendVisible(text);
    if (!sendResult.success || !sendResult.conversation_id) {
      throw new Error(
        "Failed to obtain conversation_id after sending via visible chat.",
      );
    }
    return sendResult.conversation_id;
  }, options);
}

/**
 * Polls for conversation completion, retrying on MODEL_CAPACITY_EXHAUSTED
 * errors. Intermediate "not finished yet" states throw with
 * `retryable = false` so the retry loop continues normally without consuming
 * a retry attempt.
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

    const cascades = await client.listCascades();
    if (!isCascadeIdle(cascades, conversationId)) {
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

  // Send with retry on MODEL_CAPACITY_EXHAUSTED
  const conversationId = await sendWithRetry(client, text, options);

  while (Date.now() < deadline) {
    await sleep(pollIntervalMs);
    options.onPoll?.();

    try {
      const conversation = await pollWithRetry(client, conversationId, options);

      return {
        conversationId,
        conversation,
        text: extractConversationText(conversation),
      };
    } catch (error) {
      options.onPollError?.(error);
      if (error instanceof TerminalAskPollingError) {
        throw error;
      }
    }
  }

  throw new Error(
    `Timed out waiting for final agent response after ${pollTimeoutMs}ms.`,
  );
}
