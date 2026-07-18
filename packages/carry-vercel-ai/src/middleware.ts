import type { CarryMemory, CarryReceipt, CarryStore } from "./store.js";

// Minimal structural types for the Vercel AI SDK call params we touch. Kept
// local so the adapter isn't coupled to a specific ai-SDK major's exact type
// export names (which have churned across v4/v5/v6).
export type CarryTextPart = { type: "text"; text: string };
export type CarryPromptMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | CarryTextPart[] };
export type CarryCallParams = { prompt: CarryPromptMessage[] } & Record<string, unknown>;

export type CarryLanguageModelMiddleware = {
  transformParams: (options: { params: CarryCallParams }) => Promise<CarryCallParams>;
};

export type CarryMiddlewareOptions = {
  store: CarryStore;
  agent?: string;
  onReceipt?: (receipt: CarryReceipt) => void;
};

function lastUserText(prompt: CarryPromptMessage[]): string {
  for (let i = prompt.length - 1; i >= 0; i--) {
    const m = prompt[i];
    if (m.role !== "user") continue;
    if (typeof m.content === "string") return m.content.trim();
    return m.content
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .trim();
  }
  return "";
}

function memoryBlock(memories: CarryMemory[]): string {
  const facts = memories.map((m) => `- (${m.namespace}) ${m.content}`).join("\n");
  return `You have access to the user's authorized memory. Use ONLY these facts; they are the only memories you are permitted to access. Do not invent or recall anything outside them.\n\n${facts}`;
}

/**
 * Vercel AI SDK middleware that gates the user's memory *before* generation:
 * it recalls only authorized memory for the agent, injects it as a system
 * message, and emits an Answer Receipt (used + blocked) via `onReceipt`.
 */
export function carryMiddleware(opts: CarryMiddlewareOptions): CarryLanguageModelMiddleware {
  const agent = opts.agent ?? "agent";
  return {
    async transformParams({ params }) {
      const query = lastUserText(params.prompt);
      const { memories, blockedNamespaces } = await opts.store.recall(agent, query);
      const receipt: CarryReceipt = {
        agent,
        query,
        used: memories.map((m) => ({ ...m, authorized: true as const })),
        blockedNamespaces,
        createdAt: new Date().toISOString(),
      };
      opts.onReceipt?.(receipt);
      if (memories.length === 0) return params;
      const system: CarryPromptMessage = { role: "system", content: memoryBlock(memories) };
      return { ...params, prompt: [system, ...params.prompt] };
    },
  };
}
