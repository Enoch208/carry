// Runnable demo (no API key): shows the middleware gating memory + emitting a
// receipt, without calling a real LLM. Run: npx tsx packages/carry-vercel-ai/example.ts
import { carryMiddleware, createMemoryStore, type CarryReceipt } from "./src/index.js";

const store = createMemoryStore({
  memories: [
    { id: "m1", namespace: "health", content: "Allergic to penicillin", walrusRef: "oHJRrapc…" },
    { id: "m2", namespace: "billing", content: "Card ending 4242", walrusRef: "z9x…" },
  ],
  policy: { aria: { billing: false } }, // aria may NOT read billing
});

let receipt: CarryReceipt | undefined;
const mw = carryMiddleware({ store, agent: "aria", onReceipt: (r) => (receipt = r) });

const ask = async (text: string) => {
  const out = await mw.transformParams({ params: { prompt: [{ role: "user", content: [{ type: "text", text }] }] } });
  const injected = out.prompt.find((m) => m.role === "system");
  console.log(`\n? "${text}"`);
  console.log("  injected memory:", injected ? "yes" : "none");
  console.log("  used:", receipt?.used.map((m) => m.namespace) ?? []);
  console.log("  blocked:", receipt?.blockedNamespaces ?? []);
};

await ask("Am I allergic to anything?"); //   → health injected, nothing blocked
await ask("What's my billing card ending?"); // → billing revoked: never injected, reported blocked
