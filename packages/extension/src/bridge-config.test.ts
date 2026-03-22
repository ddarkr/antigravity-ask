import { describe, expect, it } from "vitest";
import {
  createBridgeConfig,
  getBridgeStatusPresentation,
} from "./bridge-config";

describe("bridge-config", () => {
  it("uses the default enabled and port values", () => {
    expect(createBridgeConfig({})).toEqual({
      enabled: true,
      httpPort: 5820,
      wsPort: 5821,
    });
  });

  it("preserves explicit enabled and port overrides", () => {
    expect(createBridgeConfig({ enabled: false, httpPort: 6000, wsPort: 6001 })).toEqual({
      enabled: false,
      httpPort: 6000,
      wsPort: 6001,
    });
  });

  it("returns a disabled status presentation when bridge is off", () => {
    const presentation = getBridgeStatusPresentation({
      enabled: false,
      httpPort: 6000,
      wsPort: 6001,
    });

    expect(presentation.text).toContain("Disabled");
    expect(presentation.tooltip).toContain("HTTP :6000");
    expect(presentation.startMessage).toContain("disabled");
  });
});
