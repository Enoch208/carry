import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AGENT_LABELS } from "./agents";
import type { LLMProvider } from "./llm";
import type { AgentId, Memory } from "@carry/core";

export const REFUSAL =
  "I cannot access the memory needed to answer that — it was not authorized for this agent.";

function systemPrompt(agentId: AgentId, memories: Memory[]): string {
  const facts = memories.map((m) => `- (${m.namespace}) ${m.content}`).join("\n");
  return `You are ${AGENT_LABELS[agentId]}, an AI assistant with access to the user's memory. Answer the user's question using ONLY the facts below — they are the only memories you are authorized to access. If the facts do not contain the answer, say you cannot access the relevant memory; never guess or use outside knowledge. Keep answers to 1-2 sentences.\n\nKnown facts:\n${facts}`;
}

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client = new OpenAI();

  async complete({ agentId, query, memories }: { agentId: AgentId; query: string; memories: Memory[] }): Promise<string> {
    if (memories.length === 0) return REFUSAL;
    const res = await this.client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt(agentId, memories) },
        { role: "user", content: query },
      ],
    });
    return (res.choices[0]?.message?.content ?? REFUSAL).trim();
  }
}

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client = new Anthropic();

  async complete({ agentId, query, memories }: { agentId: AgentId; query: string; memories: Memory[] }): Promise<string> {
    if (memories.length === 0) return REFUSAL;
    const res = await this.client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      system: systemPrompt(agentId, memories),
      messages: [{ role: "user", content: query }],
    });
    if (res.stop_reason === "refusal") return REFUSAL;
    const block = res.content.find((b) => b.type === "text");
    if (block?.type === "text") return block.text.trim();
    return REFUSAL;
  }
}
