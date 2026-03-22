"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBridgeHttpClient = createBridgeHttpClient;
const bridge_1 = require("../contracts/bridge");
function createBridgeHttpClient(baseUrl) {
    async function request(path, options = {}) {
        const requestInit = {
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
            return response.json();
        }
        return response.text();
    }
    return {
        request,
        ping: () => request(bridge_1.BRIDGE_PATHS.ping),
        send: (text) => request(bridge_1.BRIDGE_PATHS.send, {
            method: "POST",
            body: JSON.stringify({ text }),
        }),
        listCascades: () => request(bridge_1.BRIDGE_PATHS.listCascades),
        getConversation: (conversationId) => request(bridge_1.BRIDGE_PATHS.conversation(conversationId)),
        runAction: (type) => request(bridge_1.BRIDGE_PATHS.action, {
            method: "POST",
            body: JSON.stringify({ type }),
        }),
    };
}
//# sourceMappingURL=http.js.map