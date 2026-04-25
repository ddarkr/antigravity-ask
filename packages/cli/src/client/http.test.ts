import { afterEach, describe, expect, it, vi } from "vitest";
import { createBridgeHttpClient } from "./http";

describe("createBridgeHttpClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits model from create conversation requests when no model is provided", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ success: true, job_id: "job-1" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createBridgeHttpClient("http://localhost:5820");
    await client.createConversation("hello");

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit?.body).toBe(JSON.stringify({ text: "hello" }));
  });

  it("includes model only when the caller explicitly provides one", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ success: true, job_id: "job-1" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createBridgeHttpClient("http://localhost:5820");
    await client.createConversation("hello", 1018);

    const requestInit = fetchMock.mock.calls[0]?.[1];
    expect(requestInit?.body).toBe(
      JSON.stringify({ text: "hello", model: 1018 }),
    );
  });
});
