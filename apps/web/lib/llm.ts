import type { AgentId, Memory } from "@carry/core";

export interface LLMProvider {
  name: string;
  complete(args: { agentId: AgentId; query: string; memories: Memory[]; persona?: string }): Promise<string>;
}

export class MockLLM implements LLMProvider {
  name = "mock";
  async complete({ memories }: { agentId: AgentId; query: string; memories: Memory[]; persona?: string }) {
    if (memories.length === 0) {
      return "I cannot access the memory needed to answer that — it was not authorized for this agent.";
    }
    const facts = memories.map((m) => m.content).join("; ");
    return `Based on what I remember (${facts}), here is the answer.`;
  }
}
