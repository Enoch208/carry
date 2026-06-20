import { describe, it, expect } from "vitest";
import { recall } from "../gate";
import type { Memory, Policy } from "../types";

const mem = (memoryId: string, namespace: Memory["namespace"], content: string): Memory => ({
  memoryId, namespace, content, sourceAgent: "agent-a", walrusRef: "0xref", createdAt: "t",
});

const memories: Memory[] = [
  mem("m1", "diet", "Prefers vegan meals"),
  mem("m2", "health", "Allergic to penicillin"),
  mem("m3", "project", "Building Carry"),
];

const allow: Policy = {
  "agent-a": { diet: true, health: true, project: true, billing: false },
  "agent-b": { diet: true, health: false, project: true, billing: false },
};

describe("recall (gate before generation)", () => {
  it("returns only allowed memories and never fetches blocked ones", () => {
    const r = recall("agent-b", "penicillin allergy", memories, allow);
    expect(r.memories.map((m) => m.memoryId)).not.toContain("m2");
    expect(r.blockedNamespaces).toContain("health");
  });
  it("does not block a namespace with no matching memory", () => {
    const r = recall("agent-b", "vegan dinner", memories, allow);
    expect(r.blockedNamespaces).not.toContain("health");
    expect(r.memories.map((m) => m.memoryId)).toContain("m1");
  });
  it("agent-a with full access has no blocked namespaces for the same query", () => {
    const r = recall("agent-a", "penicillin allergy", memories, allow);
    expect(r.blockedNamespaces).toHaveLength(0);
    expect(r.memories.map((m) => m.memoryId)).toContain("m2");
  });
});
