"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRIDGE_ACTIONS = exports.BRIDGE_PATHS = void 0;
exports.isBridgeAction = isBridgeAction;
exports.BRIDGE_PATHS = {
    ping: "/ping",
    send: "/send",
    chat: "/chat",
    action: "/action",
    listCascades: "/list-cascades",
    artifacts: "/artifacts",
    conversation: (conversationId) => `/conversation/${conversationId}`,
    artifact: (conversationId, artifactPath) => `/artifacts/${conversationId}?path=${encodeURIComponent(artifactPath)}`,
};
exports.BRIDGE_ACTIONS = {
    startNewChat: "start_new_chat",
    focusChat: "focus_chat",
    acceptStep: "accept_step",
    allow: "allow",
    rejectStep: "reject_step",
    terminalRun: "terminal_run",
    switchChat: "switch_chat",
};
function isBridgeAction(value) {
    return Object.values(exports.BRIDGE_ACTIONS).includes(value);
}
//# sourceMappingURL=bridge.js.map