export const BRIDGE_PATHS = {
  ping: "/ping",
  conversations: "/conversations",
  conversationJob: (jobId: string) => `/conversations/jobs/${jobId}`,
  conversation: (conversationId: string) => `/conversations/${conversationId}`,
  conversationFocus: (conversationId: string) =>
    `/conversations/${conversationId}/focus`,
  conversationOpen: (conversationId: string) =>
    `/conversations/${conversationId}/open`,
  action: "/action",
  artifacts: "/artifacts",
  artifact: (conversationId: string, artifactPath: string) =>
    `/artifacts/${conversationId}?path=${encodeURIComponent(artifactPath)}`,
} as const;

export const BRIDGE_ACTIONS = {
  startNewChat: "start_new_chat",
  focusChat: "focus_chat",
  acceptStep: "accept_step",
  allow: "allow",
  rejectStep: "reject_step",
  terminalRun: "terminal_run",
  switchChat: "switch_chat",
} as const;

export type BridgeAction = (typeof BRIDGE_ACTIONS)[keyof typeof BRIDGE_ACTIONS];

export function isBridgeAction(value: string): value is BridgeAction {
  return Object.values(BRIDGE_ACTIONS).includes(value as BridgeAction);
}

export interface ConversationCreateResponse {
  success?: boolean;
  job_id?: string;
  conversation_id?: string | null;
}

export interface ConversationJobResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  conversation_id?: string;
  error?: string;
  created_at?: string;
}

export interface ConversationStatusEntry {
  status?: string;
}

export type ConversationStatusMap = Record<string, ConversationStatusEntry | undefined>;
