export declare const BRIDGE_PATHS: {
    readonly ping: "/ping";
    readonly send: "/send";
    readonly chat: "/chat";
    readonly action: "/action";
    readonly listCascades: "/list-cascades";
    readonly artifacts: "/artifacts";
    readonly conversation: (conversationId: string) => string;
    readonly artifact: (conversationId: string, artifactPath: string) => string;
};
export declare const BRIDGE_ACTIONS: {
    readonly startNewChat: "start_new_chat";
    readonly focusChat: "focus_chat";
    readonly acceptStep: "accept_step";
    readonly allow: "allow";
    readonly rejectStep: "reject_step";
    readonly terminalRun: "terminal_run";
    readonly switchChat: "switch_chat";
};
export type BridgeAction = (typeof BRIDGE_ACTIONS)[keyof typeof BRIDGE_ACTIONS];
export declare function isBridgeAction(value: string): value is BridgeAction;
export interface SendResponse {
    success?: boolean;
    conversation_id?: string;
}
export interface CascadeStatusEntry {
    status?: string;
}
export type CascadeStatusMap = Record<string, CascadeStatusEntry | undefined>;
//# sourceMappingURL=bridge.d.ts.map