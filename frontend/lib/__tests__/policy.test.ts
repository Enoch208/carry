import { describe, it, expect } from "vitest";
import { allowedNamespaces, isAllowed, NAMESPACES } from "../policy";
import type { Policy } from "../types";

const policy: Policy = {
  "agent-a": { diet: true, health: true, project: true, billing: false },
  "agent-b": { diet: true, health: false, project: true, billing: false },
};

describe("policy", () => {
  it("lists allowed namespaces for an agent", () => {
    expect(allowedNamespaces("agent-b", policy).sort()).toEqual(["diet", "project"]);
  });
  it("answers isAllowed per agent/namespace", () => {
    expect(isAllowed("agent-b", "health", policy)).toBe(false);
    expect(isAllowed("agent-a", "health", policy)).toBe(true);
  });
  it("exposes the canonical namespace list", () => {
    expect(NAMESPACES).toContain("health");
  });
});
