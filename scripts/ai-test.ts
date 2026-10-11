import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { getProvider } from "../src/lib/ai/adapter";
import { aiExtractionSchema } from "../src/lib/ai/schema";

async function runSmokeTest() {
  const provider = getProvider();
  console.log(`\n======================================================`);
  console.log(`🤖 ContractLens AI Provider Smoke Test`);
  console.log(`======================================================`);
  console.log(`Provider Name : ${provider.name}`);
  console.log(`Model         : ${provider.model}`);

  const sampleContract = `
MASTER SERVICES AGREEMENT
This Agreement is entered into on January 1, 2025 by and between Alpha Corp ("Client") and Beta Inc ("Provider").
Term: The initial term is one (1) year.
Notice: Written non-renewal notice must be delivered 60 days before expiration.
Payment: Invoices must be paid within 30 days.
  `.trim();

  console.log(`\nSending 1 sample contract extraction request...`);
  try {
    const result = await provider.extract({ contractText: sampleContract });
    console.log(`\nLatency       : ${result.latencyMs} ms`);
    if (result.usage) {
      console.log(`Token Usage   : Total = ${result.usage.totalTokens} (Prompt: ${result.usage.promptTokens}, Completion: ${result.usage.completionTokens})`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.rawJson);
      console.log(`JSON Format   : VALID JSON output received ✅`);
    } catch {
      console.error(`JSON Format   : INVALID JSON output ❌`);
      console.error(`Raw Output    :`, result.rawJson);
      process.exit(1);
    }

    const zodResult = aiExtractionSchema.safeParse(parsed);
    if (zodResult.success) {
      console.log(`Schema Match  : PASSED Zod schema validation ✅`);
      console.log(`Parties Found : ${zodResult.data.parties.length}`);
      console.log(`Findings Found: ${zodResult.data.findings.length}`);
      console.log(`\n✅ SMOKE TEST PASSED! Exactly 1 AI call executed successfully.`);
      process.exit(0);
    } else {
      console.error(`Schema Match  : FAILED Zod validation ❌`);
      console.error(JSON.stringify(zodResult.error.format(), null, 2));
      console.log(`Parsed Object :`, JSON.stringify(parsed, null, 2));
      process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Extraction failed:`, message);
    if (provider.name === "openrouter") {
      console.log(`\n💡 Tip: You can test locally with 0 API tokens using:`);
      console.log(`   AI_PROVIDER=mock pnpm ai:test`);
    }
    process.exit(1);
  }
}

runSmokeTest();
