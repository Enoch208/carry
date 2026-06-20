import type { AgentId } from "./types";
import { MockLLM, type LLMProvider } from "./llm";

export function getLLM(_agentId: AgentId): LLMProvider {
  return new MockLLM();
}
