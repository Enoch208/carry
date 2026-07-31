# @usecarry/agents

Proof-carrying memory for any agent framework.

An agent should only read the memory it was granted, and you should be able to
prove which memory an answer used. This package gates memory **before**
generation — a blocked namespace is never fetched, rather than fetched and
filtered — and hands back a receipt describing what the model could actually see.

Nothing here imports a framework, so adding Carry never drags in a peer
dependency.

```bash
npm i @usecarry/agents
```

## Hosted Carry

Point it at a gateway and the gate runs server-side against the policy on Sui.

```ts
import { createGatewayStore } from "@usecarry/agents";

const store = createGatewayStore({
  baseUrl: "https://usecarry.xyz",
  apiKey: process.env.CARRY_API_KEY!,
});
```

A failed call returns no memories rather than falling back to ungated recall —
an outage must not quietly become an access-control bypass.

## LangGraph

```ts
import { carryLangGraphNode } from "@usecarry/agents";

graph.addNode("memory", carryLangGraphNode({ store, agent: "support-agent" }));
graph.addEdge("memory", "model");
```

It returns only the messages to append, which is the update shape LangGraph's
message reducers expect, so it drops into an existing graph untouched.

## OpenAI Agents SDK

```ts
import { carryInstructions } from "@usecarry/agents";

const agent = new Agent({
  name: "support",
  instructions: carryInstructions("You are a support agent.", { store, agent: "support-agent" }),
});
```

Your base instructions always survive; authorized memory is appended beneath them.

## Anything else

Every adapter is a wrapper around one primitive:

```ts
import { gateMemory } from "@usecarry/agents";

const { systemPrompt, memories, blockedNamespaces, receipt } = await gateMemory(question, {
  store,
  agent: "support-agent",
  onReceipt: (r) => console.log(r.used, r.blockedNamespaces),
});
```

`systemPrompt` is `null` when nothing was authorized — which is the correct
outcome, not an error.

## Default-deny

`createMemoryStore` (for local development and tests) grants nothing until the
policy says so, matching the on-chain gate:

```ts
const store = createMemoryStore({
  memories,
  policy: { "support-agent": { support: true, billing: true } },
});
```

An agent nobody configured reads nothing, and a namespace nobody mentioned is not
readable. A permissive default is how an unconfigured agent ends up reading
everything.

## Verify it

Answers anchored through a Carry gateway get a `/verify/<id>` page that reads the
receipt from Sui, re-hashes the Walrus blob and recomputes the verdict — with no
wallet, trusting nobody's servers. See [usecarry.xyz](https://usecarry.xyz).

MIT.
