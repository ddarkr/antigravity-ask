export const CASCADE_RUN_STATUS_IDLE = "CASCADE_RUN_STATUS_IDLE";
export const CORTEX_STEP_TYPE_USER_INPUT = "CORTEX_STEP_TYPE_USER_INPUT";
export const CORTEX_STEP_TYPE_PLANNER_RESPONSE = "CORTEX_STEP_TYPE_PLANNER_RESPONSE";
export const CORTEX_STEP_TYPE_MODEL_RESPONSE = "CORTEX_STEP_TYPE_MODEL_RESPONSE";
export const CORTEX_STEP_TYPE_NOTIFY_USER = "CORTEX_STEP_TYPE_NOTIFY_USER";

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

type CascadeStatusEntry = {
  status?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasCascadeStatusEntry(value: unknown): value is CascadeStatusEntry {
  return isRecord(value) && (value.status === undefined || typeof value.status === "string");
}

export function getConversationSteps(data: ConversationData): ConversationStep[] {
  return data.trajectory?.steps ?? [];
}

export function isConversationFinished(data: ConversationData): boolean {
  const steps = getConversationSteps(data);
  const lastStep = steps.at(-1);

  return Boolean(lastStep && lastStep.type !== CORTEX_STEP_TYPE_USER_INPUT);
}

export function isCascadeIdle(
  listData: unknown,
  conversationId: string,
): boolean {
  if (!isRecord(listData)) {
    return false;
  }

  const entry = listData[conversationId];
  if (!hasCascadeStatusEntry(entry)) {
    return false;
  }

  return entry.status === CASCADE_RUN_STATUS_IDLE;
}

export function extractConversationText(data: ConversationData): string | null {
  const steps = getConversationSteps(data);

  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];

    if (step.type === CORTEX_STEP_TYPE_PLANNER_RESPONSE) {
      return step.plannerResponse?.modifiedResponse ?? step.plannerResponse?.response ?? null;
    }

    if (step.type === CORTEX_STEP_TYPE_MODEL_RESPONSE) {
      return step.modelResponse?.text ?? null;
    }

    if (step.type === CORTEX_STEP_TYPE_NOTIFY_USER) {
      return step.notifyUser?.notificationContent ?? null;
    }
  }

  return null;
}
