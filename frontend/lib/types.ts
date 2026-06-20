export type UsedMemory = {
  memoryId: string;
  snippet: string;
  namespace: string;
  sourceAgent: string;
  walrusRef: string;
  authorized: boolean;
  verified: boolean;
};

export type AnswerReceipt = {
  answerId: string;
  agentId: string;
  usedMemories: UsedMemory[];
  blockedNamespaces: string[];
  createdAt: string;
};
