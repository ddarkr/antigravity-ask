import { describe, expect, it, vi } from "vitest";
import type { BridgeHttpClient } from "./http";
import { waitForAskResponse } from "./ask";

describe("waitForAskResponse", () => {
  it("returns once the conversation is finished", async () => {
    const client = createClient({
      sendVisible: vi.fn(async () => ({
        success: true,
        conversation_id: "convo-1",
      })),
      getConversation: vi.fn(async () => ({
        trajectory: {
          steps: [
            { type: "CORTEX_STEP_TYPE_USER_INPUT" },
            { type: "CORTEX_STEP_TYPE_MODEL_RESPONSE", modelResponse: { text: "done" } },
          ],
        },
      })),
      listCascades: vi.fn(async () => ({
        "convo-1": { status: "CASCADE_RUN_STATUS_IDLE" },
      })),
    });

    const result = await waitForAskResponse(client, "hello", {
      pollIntervalMs: 1,
      sleep: async () => {},
    });

    expect(result.conversationId).toBe("convo-1");
    expect(result.text).toBe("done");
  });

  it("keeps polling until the conversation becomes finished", async () => {
    const sendVisible = vi.fn(async () => ({
      success: true,
      conversation_id: "convo-1",
    }));
    const getConversation = vi
      .fn<BridgeHttpClient["getConversation"]>()
      .mockResolvedValueOnce({
        trajectory: {
          steps: [{ type: "CORTEX_STEP_TYPE_USER_INPUT" }],
        },
      })
      .mockResolvedValueOnce({
        trajectory: {
          steps: [
            { type: "CORTEX_STEP_TYPE_USER_INPUT" },
            { type: "CORTEX_STEP_TYPE_NOTIFY_USER", notifyUser: { notificationContent: "ready" } },
          ],
        },
      })
      .mockResolvedValueOnce({
        trajectory: {
          steps: [
            { type: "CORTEX_STEP_TYPE_USER_INPUT" },
            { type: "CORTEX_STEP_TYPE_NOTIFY_USER", notifyUser: { notificationContent: "ready" } },
          ],
        },
      });
    const listCascades = vi
      .fn<BridgeHttpClient["listCascades"]>()
      .mockResolvedValueOnce({
        "convo-1": { status: "CASCADE_RUN_STATUS_RUNNING" },
      })
      .mockResolvedValueOnce({
        "convo-1": { status: "CASCADE_RUN_STATUS_IDLE" },
      });

    const client = createClient({ sendVisible, getConversation, listCascades });

    const result = await waitForAskResponse(client, "hello", {
      pollIntervalMs: 1,
      sleep: async () => {},
    });

    expect(sendVisible).toHaveBeenCalledTimes(1);
    expect(getConversation).toHaveBeenCalledTimes(3);
    expect(listCascades).toHaveBeenCalledTimes(2);
    expect(result.text).toBe("ready");
  });

  it("fails immediately when visible send does not provide a conversation id", async () => {
    const client = createClient({
      sendVisible: vi.fn(async () => ({
        success: true,
        conversation_id: null,
      })),
    });

    await expect(waitForAskResponse(client, "hello", {
      pollIntervalMs: 1,
      pollTimeoutMs: 50,
      sleep: async () => {},
    })).rejects.toThrow("Failed to obtain conversation_id after sending via visible chat");
  });

  it("times out when the visible conversation never becomes idle and finished", async () => {
    const client = createClient({
      sendVisible: vi.fn(async () => ({
        success: true,
        conversation_id: "convo-1",
      })),
      getConversation: vi.fn(async () => ({
        trajectory: {
          steps: [{ type: "CORTEX_STEP_TYPE_USER_INPUT" }],
        },
      })),
      listCascades: vi.fn(async () => ({
        "convo-1": { status: "CASCADE_RUN_STATUS_RUNNING" },
      })),
    });

    await expect(waitForAskResponse(client, "hello", {
      pollIntervalMs: 1,
      pollTimeoutMs: 5,
      sleep: async () => {},
    })).rejects.toThrow("Timed out waiting for final agent response");
  });
});

function createClient(overrides: Partial<BridgeHttpClient>): BridgeHttpClient {
  return {
    request: vi.fn(),
    ping: vi.fn(),
    send: vi.fn(),
    sendVisible: vi.fn(async () => ({ success: true, conversation_id: "convo-1" })),
    chat: vi.fn(async () => ({ success: true, job_id: "job-1" })),
    getJobStatus: vi.fn(),
    listCascades: vi.fn(),
    getConversation: vi.fn(async () => ({ trajectory: { steps: [] } })),
    runAction: vi.fn(),
    ...overrides,
  };
}
