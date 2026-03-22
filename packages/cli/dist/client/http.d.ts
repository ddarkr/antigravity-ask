import { type BridgeAction, type CascadeStatusMap, type SendResponse } from "../contracts/bridge";
import type { ConversationData } from "../contracts/conversation";
export interface BridgeRequestOptions {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
}
export interface BridgeHttpClient {
    request: <T>(path: string, options?: BridgeRequestOptions) => Promise<T>;
    ping: () => Promise<unknown>;
    send: (text: string) => Promise<SendResponse>;
    listCascades: () => Promise<CascadeStatusMap>;
    getConversation: (conversationId: string) => Promise<ConversationData>;
    runAction: (type: BridgeAction) => Promise<unknown>;
}
export declare function createBridgeHttpClient(baseUrl: string): BridgeHttpClient;
//# sourceMappingURL=http.d.ts.map