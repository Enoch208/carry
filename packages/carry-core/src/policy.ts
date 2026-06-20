import type { AgentId, NamespaceId, Policy } from "./types";

export const NAMESPACES: NamespaceId[] = ["diet", "health", "project", "billing"];

export function isAllowed(agent: AgentId, ns: NamespaceId, policy: Policy): boolean {
  return policy[agent]?.[ns] === true;
}

export function allowedNamespaces(agent: AgentId, policy: Policy): NamespaceId[] {
  return NAMESPACES.filter((ns) => isAllowed(agent, ns, policy));
}
