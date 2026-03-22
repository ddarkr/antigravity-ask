"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const conversation_1 = require("./conversation");
(0, vitest_1.describe)("conversation contracts", () => {
    (0, vitest_1.it)("prefers planner modified response over earlier model output", () => {
        const text = (0, conversation_1.extractConversationText)({
            trajectory: {
                steps: [
                    { type: conversation_1.CORTEX_STEP_TYPE_MODEL_RESPONSE, modelResponse: { text: "old" } },
                    {
                        type: conversation_1.CORTEX_STEP_TYPE_PLANNER_RESPONSE,
                        plannerResponse: { modifiedResponse: "final", response: "fallback" },
                    },
                ],
            },
        });
        (0, vitest_1.expect)(text).toBe("final");
    });
    (0, vitest_1.it)("falls back to notify user content when needed", () => {
        const text = (0, conversation_1.extractConversationText)({
            trajectory: {
                steps: [
                    {
                        type: conversation_1.CORTEX_STEP_TYPE_NOTIFY_USER,
                        notifyUser: { notificationContent: "notify" },
                    },
                ],
            },
        });
        (0, vitest_1.expect)(text).toBe("notify");
    });
    (0, vitest_1.it)("treats a non-user last step as finished", () => {
        const finished = (0, conversation_1.isConversationFinished)({
            trajectory: {
                steps: [{ type: conversation_1.CORTEX_STEP_TYPE_USER_INPUT }, { type: conversation_1.CORTEX_STEP_TYPE_MODEL_RESPONSE }],
            },
        });
        (0, vitest_1.expect)(finished).toBe(true);
    });
    (0, vitest_1.it)("detects idle cascade status from list data", () => {
        (0, vitest_1.expect)((0, conversation_1.isCascadeIdle)({ convo: { status: "CASCADE_RUN_STATUS_IDLE" } }, "convo")).toBe(true);
        (0, vitest_1.expect)((0, conversation_1.isCascadeIdle)({ convo: { status: "CASCADE_RUN_STATUS_RUNNING" } }, "convo")).toBe(false);
    });
});
//# sourceMappingURL=conversation.test.js.map