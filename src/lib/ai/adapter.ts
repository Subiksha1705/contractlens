import { getEnv } from "../env";
import { MockProvider } from "./mock";
import { OpenRouterProvider } from "./openrouter";
import { GeminiProvider } from "./gemini";

export interface ExtractionInput {
  contractText: string;
  policyText?: string;
}

export interface ExtractionOutput {
  rawJson: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
}

export interface AiProvider {
  name: string;
  model: string;
  extract(input: ExtractionInput): Promise<ExtractionOutput>;
}

export function getProvider(overrideProvider?: string): AiProvider {
  const env = getEnv();
  const provider = overrideProvider ?? env.AI_PROVIDER;

  switch (provider) {
    case "gemini":
      return new GeminiProvider(env.GEMINI_API_KEY!, env.GEMINI_MODEL);
    case "openrouter":
      return new OpenRouterProvider(env.OPENROUTER_API_KEY!, env.OPENROUTER_MODEL);
    case "mock":
    default:
      return new MockProvider();
  }
}

/**
 * Returns true if an error indicates rate limiting, quota exhaustion, or credit depletion.
 */
export function isRateLimitOrQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  return (
    msg.includes("429") ||
    msg.includes("402") ||
    msg.includes("rate limit") ||
    msg.includes("ratelimit") ||
    msg.includes("rate-limit") ||
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("resource exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("credits") ||
    msg.includes("insufficient_quota") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("overloaded") ||
    msg.includes("capacity")
  );
}

/**
 * Resolves the configured or auto-detected backup AI provider.
 */
export function getBackupProvider(overrideBackupProvider?: string): AiProvider | null {
  const env = getEnv();
  const backupType = overrideBackupProvider ?? env.BACKUP_AI_PROVIDER;

  // If no explicit BACKUP_AI_PROVIDER is set, auto-fallback:
  // If primary is openrouter and GEMINI_API_KEY is present, default backup is gemini
  if (!backupType) {
    if (env.AI_PROVIDER === "openrouter" && env.GEMINI_API_KEY) {
      return new GeminiProvider(env.GEMINI_API_KEY, env.BACKUP_AI_MODEL ?? env.GEMINI_MODEL);
    }
    if (env.AI_PROVIDER === "gemini" && env.OPENROUTER_API_KEY) {
      return new OpenRouterProvider(env.OPENROUTER_API_KEY, env.BACKUP_AI_MODEL ?? env.OPENROUTER_MODEL);
    }
    return null;
  }

  if (backupType === "none") {
    return null;
  }

  switch (backupType) {
    case "gemini":
      return env.GEMINI_API_KEY
        ? new GeminiProvider(env.GEMINI_API_KEY, env.BACKUP_AI_MODEL ?? env.GEMINI_MODEL)
        : null;
    case "openrouter":
      return env.OPENROUTER_API_KEY
        ? new OpenRouterProvider(env.OPENROUTER_API_KEY, env.BACKUP_AI_MODEL ?? env.OPENROUTER_MODEL)
        : null;
    case "mock":
      return new MockProvider();
    default:
      return null;
  }
}

