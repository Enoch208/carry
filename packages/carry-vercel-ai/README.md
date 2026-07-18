# @carry/vercel-ai

**Drop-in proof-carrying memory for the [Vercel AI SDK](https://sdk.vercel.ai).**

Wrap any model in one line. Carry gates the user's memory *before* generation — the model only ever sees authorized memory — and emits an **Answer Receipt** (what was used, what was blocked) on every call.

```ts
import { withCarryMemory, createMemoryStore } from "@carry/vercel-ai";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const store = createMemoryStore({
  memories: [
    { id: "m1", namespace: "health", content: "Allergic to penicillin" },
    { id: "m2", namespace: "billing", content: "Card ending 4242" },
  ],
  policy: { aria: { billing: false } }, // revoke billing for this agent
});

const model = withCarryMemory(openai("gpt-4o"), {
  store,
  agent: "aria",
  onReceipt: (r) => console.log(r.used, r.blockedNamespaces), // proof of what it used
});

const { text } = await generateText({ model, prompt: "Am I allergic to anything?" });
// → recalls only `health`, injects it, answers. `billing` is never fetched.
```

That's the whole integration. Works with `generateText`, `streamText`, `generateObject` — anything that takes a model.

## Why

A raw vector-DB memory layer hands your model *everything* it retrieves and hopes for the best. Carry enforces an **agent × namespace** policy at retrieval, so a revoked namespace is never injected into the prompt — and every generation carries a receipt proving exactly what memory reached the model.

## API

- **`withCarryMemory(model, opts)`** — wraps a model with the Carry middleware. Returns the same model type.
- **`carryMiddleware(opts)`** — the raw `LanguageModelMiddleware` if you compose your own `wrapLanguageModel`.
- **`createMemoryStore({ memories, policy })`** — an in-memory Carry vault (default-allow; `policy[agent][ns] = false` revokes).
- **`CarryStore`** — implement `recall(agent, query)` to back it with your own store (Walrus, a DB, the [`carry` CLI](https://www.npmjs.com/package/@carry/cli) vault, …).

Options: `{ store, agent?, onReceipt? }`. `onReceipt(receipt)` fires on every call with `{ agent, query, used, blockedNamespaces, createdAt }`.

Part of [Carry](https://carrysui.vercel.app) — proof-carrying memory for AI agents, stored on Walrus, enforced on Sui.

MIT © Carry
