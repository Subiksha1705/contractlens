import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  AI_PROVIDER: z.enum(["openrouter", "gemini", "mock"]).default("mock"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct:free"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  MAX_INPUT_CHARS: z.coerce.number().default(60000),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const rawEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    AI_PROVIDER: process.env.AI_PROVIDER ?? "mock",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || process.env.API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    MAX_INPUT_CHARS: process.env.MAX_INPUT_CHARS ?? 60000,
    MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB ?? 5,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[ContractLens Environment Configuration Error]:\n${errorDetails}\nPlease check your .env or .env.local file.`
    );
  }

  // Extra provider validation
  if (result.data.AI_PROVIDER === "openrouter" && !result.data.OPENROUTER_API_KEY) {
    throw new Error(
      "[ContractLens Configuration Error]: AI_PROVIDER is set to 'openrouter', but OPENROUTER_API_KEY is not defined in your environment."
    );
  }

  if (result.data.AI_PROVIDER === "gemini" && !result.data.GEMINI_API_KEY) {
    throw new Error(
      "[ContractLens Configuration Error]: AI_PROVIDER is set to 'gemini', but GEMINI_API_KEY is not defined in your environment."
    );
  }

  parsedEnv = result.data;
  return parsedEnv;
}
