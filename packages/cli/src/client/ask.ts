import {
  extractConversationText,
  isCascadeIdle,
  isConversationFinished,
  type ConversationData,
} from "../contracts/conversation";
import type { BridgeHttpClient } from "./http";

export interface AskOptions {
  model?: number;
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

  if (!sendResult.success || !sendResult.conversation_id) {
    throw new Error("Failed to obtain conversation_id after sending.");
  }

  const conversationId = sendResult.conversation_id;
  const pollIntervalMs = options.pollIntervalMs ?? 3000;

  while (true) {
    await delay(pollIntervalMs);
    options.onPoll?.();

    try {
      const cascades = await client.listCascades();
      if (!isCascadeIdle(cascades, conversationId)) {
        continue;
      }

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
