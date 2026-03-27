export const MODEL_VARIANTS = {
  flash: "MODEL_GOOGLE_GEMINI_RIFTRUNNER",
  pro: "MODEL_GOOGLE_GEMINI_RIFTRUNNER_THINKING_HIGH",
  "pro-low": "MODEL_GOOGLE_GEMINI_RIFTRUNNER_THINKING_LOW",
  sonnet: "MODEL_CLAUDE_4_SONNET",
  opus: "MODEL_CLAUDE_4_OPUS_THINKING",
  "gpt-oss": "MODEL_OPENAI_GPT_OSS_120B_MEDIUM",
} as const;

export type ModelVariant = keyof typeof MODEL_VARIANTS;

export function parseModelVariant(rawVariant?: string): string | number | undefined {
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
