export type NamespaceId = "diet" | "health" | "project" | "billing";
export type AgentId = "agent-a" | "agent-b";

export type Memory = {
  memoryId: string;
  namespace: NamespaceId;
  content: string;
  sourceAgent: AgentId;
  walrusRef: string;
  createdAt: string;
};

export type Policy = Record<AgentId, Record<NamespaceId, boolean>>;

export type UsedMemory = {
  memoryId: string;
  namespace: NamespaceId;
  snippet: string;
  sourceAgent: AgentId;
  walrusRef: string;
  authorized: boolean;
  verified: boolean;
};

export type AnswerReceipt = {
  answerId: string;
  agentId: AgentId;
  usedMemories: UsedMemory[];
  blockedNamespaces: NamespaceId[];
  createdAt: string;
};
