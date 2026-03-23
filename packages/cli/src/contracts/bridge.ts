export const BRIDGE_PATHS = {
  ping: "/ping",
  send: "/chat",
  chat: "/chat",
  action: "/action",
  listCascades: "/list-cascades",
  artifacts: "/artifacts",
  conversation: (conversationId: string) => `/conversation/${conversationId}`,
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

export interface SendResponse {
  success?: boolean;
  conversation_id?: string;
}

export interface CascadeStatusEntry {
  status?: string;
}

export type CascadeStatusMap = Record<string, CascadeStatusEntry | undefined>;
