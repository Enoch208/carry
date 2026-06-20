import type { AgentId } from "./types";
import { MockLLM, type LLMProvider } from "./llm";
import { OpenAIProvider, AnthropicProvider } from "./llm-providers";

export function getLLM(agentId: AgentId): LLMProvider {
  if (process.env.CARRY_MODE === "mock") return new MockLLM();
  if (agentId === "agent-a") {
    return process.env.OPENAI_API_KEY ? new OpenAIProvider() : new MockLLM();
  }
  return process.env.ANTHROPIC_API_KEY ? new AnthropicProvider() : new MockLLM();
}
