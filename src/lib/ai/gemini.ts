import { AiProvider, ExtractionInput, ExtractionOutput } from "./adapter";
import { SYSTEM_PROMPT, buildExtractionPrompt } from "./prompt";

export class GeminiProvider implements AiProvider {
  name = "gemini";
  model: string;
  private apiKey: string;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    const userPrompt = buildExtractionPrompt(input.contractText, input.policyText);
    const startTime = Date.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(45000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini API request failed with status ${response.status}: ${errText.slice(0, 300)}`
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const rawJson = candidate?.content?.parts?.[0]?.text ?? "";

    const usageMeta = data.usageMetadata;
    const usage = usageMeta
      ? {
          promptTokens: usageMeta.promptTokenCount,
          completionTokens: usageMeta.candidatesTokenCount,
          totalTokens: usageMeta.totalTokenCount,
        }
      : undefined;

    return {
      rawJson,
      usage,
      latencyMs,
    };
  }
}
