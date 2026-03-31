import {
  type BridgeAction,
  BRIDGE_PATHS,
  type CascadeStatusMap,
  type SendResponse,
  type ChatJobResponse,
} from "../contracts/bridge";
import type { ConversationData } from "../contracts/conversation";

export interface BridgeRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

export interface BridgeHttpClient {
  request: <T>(path: string, options?: BridgeRequestOptions) => Promise<T>;
  ping: () => Promise<unknown>;
  send: (text: string, model?: string | number) => Promise<SendResponse>;
  sendVisible: (text: string) => Promise<SendResponse>;
  chat: (text: string, model?: string | number) => Promise<SendResponse>;
  getJobStatus: (jobId: string) => Promise<ChatJobResponse>;
  listCascades: () => Promise<CascadeStatusMap>;
  getConversation: (conversationId: string) => Promise<ConversationData>;
  runAction: (type: BridgeAction) => Promise<unknown>;
}

export function createBridgeHttpClient(baseUrl: string): BridgeHttpClient {
  async function request<T>(
    path: string,
    options: BridgeRequestOptions = {},
  ): Promise<T> {
    const requestInit: RequestInit = {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    if (options.body !== undefined) {
      requestInit.body = options.body;
    }

    const response = await fetch(`${baseUrl}${path}`, requestInit);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return response.text() as T;
  }

  return {
    request,
    ping: () => request(BRIDGE_PATHS.ping),
    send: (text, model) => request<SendResponse>(BRIDGE_PATHS.chat, {
      method: "POST",
      body: JSON.stringify({ text, model }),
    }),
    sendVisible: (text) => request<SendResponse>(BRIDGE_PATHS.visibleSend, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
    chat: (text, model) => request<SendResponse>(BRIDGE_PATHS.chat, {
      method: "POST",
      body: JSON.stringify({ text, model }),
    }),
    getJobStatus: (jobId) => request<ChatJobResponse>(BRIDGE_PATHS.chatJob(jobId)),
    listCascades: () => request<CascadeStatusMap>(BRIDGE_PATHS.listCascades),
    getConversation: (conversationId) =>
      request<ConversationData>(BRIDGE_PATHS.conversation(conversationId)),
    runAction: (type) => request(BRIDGE_PATHS.action, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  };
}
