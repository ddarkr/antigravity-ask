export declare const CASCADE_RUN_STATUS_IDLE = "CASCADE_RUN_STATUS_IDLE";
export declare const CORTEX_STEP_TYPE_USER_INPUT = "CORTEX_STEP_TYPE_USER_INPUT";
export declare const CORTEX_STEP_TYPE_PLANNER_RESPONSE = "CORTEX_STEP_TYPE_PLANNER_RESPONSE";
export declare const CORTEX_STEP_TYPE_MODEL_RESPONSE = "CORTEX_STEP_TYPE_MODEL_RESPONSE";
export declare const CORTEX_STEP_TYPE_NOTIFY_USER = "CORTEX_STEP_TYPE_NOTIFY_USER";
export interface ConversationStep {
    type?: string;
    plannerResponse?: {
        modifiedResponse?: string;
        response?: string;
    };
    modelResponse?: {
        text?: string;
    };
    notifyUser?: {
        notificationContent?: string;
    };
}
export interface ConversationData {
    trajectory?: {
        steps?: ConversationStep[];
    };
}
export declare function getConversationSteps(data: ConversationData): ConversationStep[];
export declare function isConversationFinished(data: ConversationData): boolean;
export declare function isCascadeIdle(listData: unknown, conversationId: string): boolean;
export declare function extractConversationText(data: ConversationData): string | null;
//# sourceMappingURL=conversation.d.ts.map