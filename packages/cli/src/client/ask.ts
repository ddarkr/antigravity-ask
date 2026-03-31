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
}

export interface AskResult {
  conversationId: string;
  conversation: ConversationData;
  text: string | null;
}

class TerminalAskPollingError extends Error {}

export async function waitForAskResponse(
  client: BridgeHttpClient,
  text: string,
  options: AskOptions = {},
): Promise<AskResult> {
  const sendResult = await client.sendVisible(text);

  if (!sendResult.success || !sendResult.conversation_id) {
    throw new Error("Failed to obtain conversation_id after sending via visible chat.");
  }

  const conversationId = sendResult.conversation_id;
  const pollIntervalMs = options.pollIntervalMs ?? 3000;
  const pollTimeoutMs = options.pollTimeoutMs ?? 120000;
  const sleep = options.sleep ?? delay;
  const deadline = Date.now() + pollTimeoutMs;

  while (Date.now() < deadline) {
    await sleep(pollIntervalMs);
    options.onPoll?.();

    try {
      const conversation = await client.getConversation(conversationId);
      
      if (!isConversationFinished(conversation)) {
        continue;
      }

      const cascades = await client.listCascades();
      if (!isCascadeIdle(cascades, conversationId)) {
        continue;
      }

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

  throw new Error(`Timed out waiting for final agent response after ${pollTimeoutMs}ms.`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
