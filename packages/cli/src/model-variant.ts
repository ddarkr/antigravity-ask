export const MODEL_VARIANTS = {
  flash: undefined,
  pro: undefined,
  "pro-low": undefined,
  sonnet: undefined,
  opus: undefined,
  "gpt-oss": undefined,
} as const;

export type ModelVariant = keyof typeof MODEL_VARIANTS;

export function parseModelVariant(rawVariant?: string): string | number | undefined {
  if (!rawVariant) {
    return undefined;
  }

  const normalizedVariant = rawVariant.trim().toLowerCase() as ModelVariant;
  const isKnownVariant = Object.prototype.hasOwnProperty.call(
    MODEL_VARIANTS,
    normalizedVariant,
  );

  if (!isKnownVariant) {
    throw new Error(
      `Unknown --variant value: ${rawVariant}. Supported variants: ${Object.keys(MODEL_VARIANTS).join(", ")}`,
    );
  }

  return undefined;
}
