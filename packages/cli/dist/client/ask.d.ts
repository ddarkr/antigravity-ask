import { type ConversationData } from "../contracts/conversation";
import type { BridgeHttpClient } from "./http";
export interface AskOptions {
    pollIntervalMs?: number;
    onPoll?: () => void;
    onPollError?: (error: unknown) => void;
}
export interface AskResult {
    conversationId: string;
    conversation: ConversationData;
    text: string | null;
}
export declare function waitForAskResponse(client: BridgeHttpClient, text: string, options?: AskOptions): Promise<AskResult>;
//# sourceMappingURL=ask.d.ts.map