import { describe, expect, it } from "vitest";
import { MODEL_VARIANTS, parseModelVariant } from "./model-variant";

describe("model-variant", () => {
  it("returns undefined when no variant is provided", () => {
    expect(parseModelVariant()).toBeUndefined();
  });

  it("maps known variants to model ids", () => {
    expect(parseModelVariant("flash")).toBe(MODEL_VARIANTS.flash);
    expect(parseModelVariant("pro")).toBe(MODEL_VARIANTS.pro);
    expect(parseModelVariant("pro-low")).toBe(MODEL_VARIANTS["pro-low"]);
    expect(parseModelVariant("sonnet")).toBe(MODEL_VARIANTS.sonnet);
    expect(parseModelVariant("opus")).toBe(MODEL_VARIANTS.opus);
    expect(parseModelVariant("gpt-oss")).toBe(MODEL_VARIANTS["gpt-oss"]);
  });

  it("normalizes case and whitespace", () => {
    expect(parseModelVariant(" Pro ")).toBe(MODEL_VARIANTS.pro);
  });

  it("rejects unknown variants", () => {
    expect(() => parseModelVariant("claude")).toThrow(
      "Unknown --variant value: claude. Supported variants: flash, pro, pro-low, sonnet, opus, gpt-oss",
    );
  });
});
