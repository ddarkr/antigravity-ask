import { describe, expect, it } from "vitest";
import {
  createLsProcessLookupCommand,
  createPortLookupCommand,
} from "./ls-bridge.platform";

describe("ls-bridge.platform", () => {
  it("builds a PowerShell lookup command on Windows", () => {
    const command = createLsProcessLookupCommand("win32");

    expect(command.command.startsWith("powershell -NoProfile -EncodedCommand ")).toBe(true);
  });

  it("builds a pgrep lookup command on unix-like systems", () => {
    expect(createLsProcessLookupCommand("darwin")).toEqual({
      command: "pgrep -lf language_server",
    });
  });

  it("builds platform-specific port discovery commands", () => {
    expect(createPortLookupCommand("win32", 123).command).toContain("findstr \"123\"");
    expect(createPortLookupCommand("linux", 456).command).toContain("pid=456");
  });
});
