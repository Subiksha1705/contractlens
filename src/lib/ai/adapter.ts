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
