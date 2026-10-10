import { AiProvider, ExtractionInput, ExtractionOutput } from "./adapter";
import { SYSTEM_PROMPT, buildExtractionPrompt } from "./prompt";

export class OpenRouterProvider implements AiProvider {
  name = "openrouter";
  model: string;
  private apiKey: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    const userPrompt = buildExtractionPrompt(input.contractText, input.policyText);
    const startTime = Date.now();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://github.com/Subiksha1705/contractlens",
        "X-Title": "ContractLens",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        reasoning: { effort: "none" },
      }),
      signal: AbortSignal.timeout(45000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `OpenRouter request failed with status ${response.status}: ${errText.slice(0, 300)}`
      );
    }

    const data = await response.json();
    const rawJson = data.choices?.[0]?.message?.content ?? "";

    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      rawJson,
      usage,
      latencyMs,
    };
  }
}
