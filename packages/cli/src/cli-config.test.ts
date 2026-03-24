import { describe, expect, it } from "vitest";
import { resolveCliConfig } from "./cli-config";

describe("cli-config", () => {
  it("uses the default bridge url with no overrides", () => {
    expect(resolveCliConfig(["ping"], {})).toEqual({
      args: ["ping"],
      explicitBaseUrl: undefined,
    });
  });

  it("uses AG_BRIDGE_URL when present", () => {
    expect(resolveCliConfig(["ping"], { AG_BRIDGE_URL: "http://127.0.0.1:6000/" })).toEqual({
      args: ["ping"],
      explicitBaseUrl: "http://127.0.0.1:6000",
    });
  });

  it("uses the explicit http port override", () => {
    expect(resolveCliConfig(["ping", "--http-port", "6000"], {})).toEqual({
      args: ["ping"],
      explicitBaseUrl: "http://localhost:6000",
    });
  });

  it("uses the explicit url override", () => {
    expect(resolveCliConfig(["--url", "http://127.0.0.1:7000/", "ping"], { AG_BRIDGE_URL: "http://localhost:6000" })).toEqual({
      args: ["ping"],
      explicitBaseUrl: "http://127.0.0.1:7000",
    });
  });

  it("prefers the explicit url override over http port", () => {
    expect(resolveCliConfig(["ping", "--url", "http://localhost:7000", "--http-port", "7001"], {})).toEqual({
      args: ["ping"],
      explicitBaseUrl: "http://localhost:7000",
    });
  });

  it("rejects an invalid port value", () => {
    expect(() => resolveCliConfig(["ping", "--http-port", "abc"], {})).toThrow(
      "Invalid --http-port value: abc",
    );
  });
});
