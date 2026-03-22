import { describe, expect, it } from "vitest";
import {
  CORTEX_STEP_TYPE_MODEL_RESPONSE,
  CORTEX_STEP_TYPE_NOTIFY_USER,
  CORTEX_STEP_TYPE_PLANNER_RESPONSE,
  CORTEX_STEP_TYPE_USER_INPUT,
  extractConversationText,
  isCascadeIdle,
  isConversationFinished,
} from "./conversation";

describe("conversation contracts", () => {
  it("prefers planner modified response over earlier model output", () => {
    const text = extractConversationText({
      trajectory: {
        steps: [
          { type: CORTEX_STEP_TYPE_MODEL_RESPONSE, modelResponse: { text: "old" } },
          {
            type: CORTEX_STEP_TYPE_PLANNER_RESPONSE,
            plannerResponse: { modifiedResponse: "final", response: "fallback" },
          },
        ],
      },
    });

    expect(text).toBe("final");
  });

  it("falls back to notify user content when needed", () => {
    const text = extractConversationText({
      trajectory: {
        steps: [
          {
            type: CORTEX_STEP_TYPE_NOTIFY_USER,
            notifyUser: { notificationContent: "notify" },
          },
        ],
      },
    });

    expect(text).toBe("notify");
  });

  it("treats a non-user last step as finished", () => {
    const finished = isConversationFinished({
      trajectory: {
        steps: [{ type: CORTEX_STEP_TYPE_USER_INPUT }, { type: CORTEX_STEP_TYPE_MODEL_RESPONSE }],
      },
    });

    expect(finished).toBe(true);
  });

  it("detects idle cascade status from list data", () => {
    expect(isCascadeIdle({ convo: { status: "CASCADE_RUN_STATUS_IDLE" } }, "convo")).toBe(true);
    expect(isCascadeIdle({ convo: { status: "CASCADE_RUN_STATUS_RUNNING" } }, "convo")).toBe(false);
  });
});
