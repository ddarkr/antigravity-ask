import { describe, expect, it } from "vitest";
import {
  parseLatestLanguageServerPort,
  parseLsProcessLine,
} from "./ls-bridge.parsers";

describe("ls-bridge.parsers", () => {
  it("uses the latest HTTPS port when multiple logs exist", () => {
    const result = parseLatestLanguageServerPort([
      "Language server listening on random port at 8123 for HTTP",
      "Language server listening on fixed port at 9443 for HTTPS",
      "Language server listening on fixed port at 9555 for HTTPS",
    ].join("\n"));

    expect(result).toEqual({ port: 9555, useTls: true });
  });

  it("parses macOS and linux style process output", () => {
    const result = parseLsProcessLine(
      "12345 language_server --csrf_token abc-123 --server_port 9443",
      "darwin",
    );

    expect(result).toEqual({
      pid: 12345,
      csrfToken: "abc-123",
      extPort: 9443,
      useTls: true,
    });
  });

  it("parses windows process output with extension port fallback", () => {
    const result = parseLsProcessLine(
      "4321|language_server --csrf_token win-token --extension_server_port 8080",
      "win32",
    );

    expect(result).toEqual({
      pid: 4321,
      csrfToken: "win-token",
      extPort: 8080,
      useTls: false,
    });
  });
});
