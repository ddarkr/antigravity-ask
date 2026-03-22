"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForAskResponse = waitForAskResponse;
const conversation_1 = require("../contracts/conversation");
async function waitForAskResponse(client, text, options = {}) {
    const sendResult = await client.send(text);
    if (!sendResult.success || !sendResult.conversation_id) {
        throw new Error("Failed to obtain conversation_id after sending.");
    }
    const conversationId = sendResult.conversation_id;
    const pollIntervalMs = options.pollIntervalMs ?? 3000;
    while (true) {
        await delay(pollIntervalMs);
        options.onPoll?.();
        try {
            const cascades = await client.listCascades();
            if (!(0, conversation_1.isCascadeIdle)(cascades, conversationId)) {
                continue;
            }
            const conversation = await client.getConversation(conversationId);
            if (!(0, conversation_1.isConversationFinished)(conversation)) {
                continue;
            }
            return {
                conversationId,
                conversation,
                text: (0, conversation_1.extractConversationText)(conversation),
            };
        }
        catch (error) {
            options.onPollError?.(error);
        }
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=ask.js.map