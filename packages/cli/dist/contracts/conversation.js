"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORTEX_STEP_TYPE_NOTIFY_USER = exports.CORTEX_STEP_TYPE_MODEL_RESPONSE = exports.CORTEX_STEP_TYPE_PLANNER_RESPONSE = exports.CORTEX_STEP_TYPE_USER_INPUT = exports.CASCADE_RUN_STATUS_IDLE = void 0;
exports.getConversationSteps = getConversationSteps;
exports.isConversationFinished = isConversationFinished;
exports.isCascadeIdle = isCascadeIdle;
exports.extractConversationText = extractConversationText;
exports.CASCADE_RUN_STATUS_IDLE = "CASCADE_RUN_STATUS_IDLE";
exports.CORTEX_STEP_TYPE_USER_INPUT = "CORTEX_STEP_TYPE_USER_INPUT";
exports.CORTEX_STEP_TYPE_PLANNER_RESPONSE = "CORTEX_STEP_TYPE_PLANNER_RESPONSE";
exports.CORTEX_STEP_TYPE_MODEL_RESPONSE = "CORTEX_STEP_TYPE_MODEL_RESPONSE";
exports.CORTEX_STEP_TYPE_NOTIFY_USER = "CORTEX_STEP_TYPE_NOTIFY_USER";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function hasCascadeStatusEntry(value) {
    return isRecord(value) && (value.status === undefined || typeof value.status === "string");
}
function getConversationSteps(data) {
    return data.trajectory?.steps ?? [];
}
function isConversationFinished(data) {
    const steps = getConversationSteps(data);
    const lastStep = steps.at(-1);
    return Boolean(lastStep && lastStep.type !== exports.CORTEX_STEP_TYPE_USER_INPUT);
}
function isCascadeIdle(listData, conversationId) {
    if (!isRecord(listData)) {
        return false;
    }
    const entry = listData[conversationId];
    if (!hasCascadeStatusEntry(entry)) {
        return false;
    }
    return entry.status === exports.CASCADE_RUN_STATUS_IDLE;
}
function extractConversationText(data) {
    const steps = getConversationSteps(data);
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (step.type === exports.CORTEX_STEP_TYPE_PLANNER_RESPONSE) {
            return step.plannerResponse?.modifiedResponse ?? step.plannerResponse?.response ?? null;
        }
        if (step.type === exports.CORTEX_STEP_TYPE_MODEL_RESPONSE) {
            return step.modelResponse?.text ?? null;
        }
        if (step.type === exports.CORTEX_STEP_TYPE_NOTIFY_USER) {
            return step.notifyUser?.notificationContent ?? null;
        }
    }
    return null;
}
//# sourceMappingURL=conversation.js.map