export const MODEL_VARIANTS = {
  flash: 1018,
  pro: 1165,
  "pro-low": 1164,
  sonnet: 1163,
  opus: 1154,
  "gpt-oss": 342,
} as const;

export type ModelVariant = keyof typeof MODEL_VARIANTS;

export function parseModelVariant(rawVariant?: string): number | undefined {
  if (!rawVariant) {
    return undefined;
  }

  const normalizedVariant = rawVariant.trim().toLowerCase() as ModelVariant;
  const model = MODEL_VARIANTS[normalizedVariant];

  if (model === undefined) {
    throw new Error(
      `Unknown --variant value: ${rawVariant}. Supported variants: ${Object.keys(MODEL_VARIANTS).join(", ")}`,
    );
  }

  return model;
}
