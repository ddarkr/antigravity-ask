import { describe, expect, it } from "vitest";
import { parseModelVariant } from "./model-variant";

describe("model-variant", () => {
  it("returns undefined when no variant is provided", () => {
    expect(parseModelVariant()).toBeUndefined();
  });

  it("accepts known variants without forcing a model id", () => {
    expect(parseModelVariant("flash")).toBeUndefined();
    expect(parseModelVariant("pro")).toBeUndefined();
    expect(parseModelVariant("pro-low")).toBeUndefined();
    expect(parseModelVariant("sonnet")).toBeUndefined();
    expect(parseModelVariant("opus")).toBeUndefined();
    expect(parseModelVariant("gpt-oss")).toBeUndefined();
  });

  it("normalizes case and whitespace", () => {
    expect(parseModelVariant(" Pro ")).toBeUndefined();
  });

  it("rejects unknown variants", () => {
    expect(() => parseModelVariant("claude")).toThrow(
      "Unknown --variant value: claude. Supported variants: flash, pro, pro-low, sonnet, opus, gpt-oss",
    );
  });
});
