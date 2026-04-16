import {
  type BridgeAction,
  BRIDGE_PATHS,
  type ConversationCreateResponse,
  type ConversationJobResponse,
  type ConversationStatusMap,
} from "../contracts/bridge";
import type { ConversationData } from "../contracts/conversation";

export interface BridgeRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface BridgeHttpClient {
  request: <T>(path: string, options?: BridgeRequestOptions) => Promise<T>;
  ping: () => Promise<unknown>;
  createConversation: (
    text: string,
    model?: string | number,
  ) => Promise<ConversationCreateResponse>;
  getConversationJob: (jobId: string) => Promise<ConversationJobResponse>;
  listConversations: () => Promise<ConversationStatusMap>;
  getConversation: (conversationId: string) => Promise<ConversationData>;
  focusConversation: (conversationId: string) => Promise<unknown>;
  openConversation: (conversationId: string) => Promise<unknown>;
  runAction: (type: BridgeAction) => Promise<unknown>;
}

export function createBridgeHttpClient(baseUrl: string): BridgeHttpClient {
  const DEFAULT_TIMEOUT_MS = 30_000;

  async function request<T>(
    path: string,
    options: BridgeRequestOptions = {},
  ): Promise<T> {
    const timeoutMs = DEFAULT_TIMEOUT_MS;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    const signal = options.signal
      ? mergeSignal(options.signal, ac.signal)
      : ac.signal;

    try {
      const requestInit: RequestInit = {
        method: options.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body,
        signal,
      };

      const response = await fetch(`${baseUrl}${path}`, requestInit);
      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          return await response.json() as Promise<T>;
        } catch (parseError) {
          throw new Error(
            `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
        }
      }

      return response.text() as T;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request to ${path} timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  function mergeSignal(a: AbortSignal, b: AbortSignal): AbortSignal {
    const ac = new AbortController();
    a.addEventListener("abort", () => ac.abort());
    b.addEventListener("abort", () => ac.abort());
    return ac.signal;
  }

  return {
    request,
    ping: () => request(BRIDGE_PATHS.ping),
    createConversation: (text, model) =>
      request<ConversationCreateResponse>(BRIDGE_PATHS.conversations, {
        method: "POST",
        body: JSON.stringify({ text, model }),
      }),
    getConversationJob: (jobId) =>
      request<ConversationJobResponse>(BRIDGE_PATHS.conversationJob(jobId)),
    listConversations: () =>
      request<ConversationStatusMap>(BRIDGE_PATHS.conversations),
    getConversation: (conversationId) =>
      request<ConversationData>(BRIDGE_PATHS.conversation(conversationId)),
    focusConversation: (conversationId) =>
      request(BRIDGE_PATHS.conversationFocus(conversationId), {
        method: "POST",
      }),
    openConversation: (conversationId) =>
      request(BRIDGE_PATHS.conversationOpen(conversationId), {
        method: "POST",
      }),
    runAction: (type) => request(BRIDGE_PATHS.action, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  };
}
