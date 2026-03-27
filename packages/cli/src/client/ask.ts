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
  onPoll?: () => void;
  onPollError?: (error: unknown) => void;
}

export interface AskResult {
  conversationId: string;
  conversation: ConversationData;
  text: string | null;
}

export async function waitForAskResponse(
  client: BridgeHttpClient,
  text: string,
  options: AskOptions = {},
): Promise<AskResult> {
  const sendResult = await client.chat(text, options.model);

  if (!sendResult.success || !sendResult.job_id) {
    throw new Error("Failed to obtain job_id after sending.");
  }

  const jobId = sendResult.job_id;
  const pollIntervalMs = options.pollIntervalMs ?? 3000;

  while (true) {
    await delay(pollIntervalMs);
    options.onPoll?.();

    try {
      const jobStatus = await client.getJobStatus(jobId);
      
      if (jobStatus.status === "failed") {
        throw new Error(`Job failed: ${jobStatus.error}`);
      }
      
      if (jobStatus.status !== "completed" || !jobStatus.conversation_id) {
        continue;
      }

      const conversationId = jobStatus.conversation_id;
      const conversation = await client.getConversation(conversationId);
      
      if (!isConversationFinished(conversation)) {
        continue;
      }

      return {
        conversationId,
        conversation,
        text: extractConversationText(conversation),
      };
    } catch (error) {
      options.onPollError?.(error);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
