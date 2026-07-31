import { describe, expect, it } from "vitest";
import { buildSealed, openSealed, newSalt } from "../sealed";

const base = {
  answerId: "ans-1",
  agent: "aria",
  model: "gpt-4o",
  query: "am I allergic to anything?",
  answer: "You are allergic to penicillin.",
  memories: [
    { memoryId: "m2", namespace: "health", content: "Allergic to penicillin" },
    { memoryId: "m1", namespace: "diet", content: "Prefers vegan meals" },
  ],
  blockedNamespaces: ["billing"],
  allAuthorized: true,
  policyVersion: 4,
  expiresAtMs: 0,
};

describe("sealed answer receipts", () => {
  it("keeps the public receipt free of memory content", () => {
    const { receipt } = buildSealed(base);
    const json = JSON.stringify(receipt);
    expect(json).not.toContain("penicillin");
    expect(json).not.toContain("vegan");
    expect(json).not.toContain(base.query);
    expect(json).not.toContain(base.answer);
    // what a verifier still needs is present
    expect(receipt.usedNamespaces).toEqual(["diet", "health"]);
    expect(receipt.blockedNamespaces).toEqual(["billing"]);
    expect(receipt.allAuthorized).toBe(true);
    expect(receipt.policyVersion).toBe(4);
  });

  it("opens for an auditor holding the payload", () => {
    const { receipt, payload } = buildSealed(base);
    const opened = openSealed({ ...receipt, sealed: { mode: "none", ref: "" } }, payload);
    expect(opened.ok).toBe(true);
    expect(opened.checks.every((c) => c.ok)).toBe(true);
  });

  it("is binding — a changed answer no longer opens", () => {
    const { receipt, payload } = buildSealed(base);
    const tampered = { ...payload, answer: "You have no allergies." };
    const opened = openSealed({ ...receipt, sealed: { mode: "none", ref: "" } }, tampered);
    expect(opened.ok).toBe(false);
    expect(opened.checks.find((c) => c.label.startsWith("Answer"))!.ok).toBe(false);
  });

  it("is binding — swapping a memory's content no longer opens", () => {
    const { receipt, payload } = buildSealed(base);
    const tampered = {
      ...payload,
      memories: [{ ...payload.memories[0], content: "Allergic to nothing" }, payload.memories[1]],
    };
    expect(openSealed({ ...receipt, sealed: { mode: "none", ref: "" } }, tampered).ok).toBe(false);
  });

  it("is hiding — the same answer commits differently under a fresh salt", () => {
    const a = buildSealed(base);
    const b = buildSealed(base);
    expect(a.receipt.answerCommitment).not.toBe(b.receipt.answerCommitment);
    // and identical inputs under one salt are reproducible
    const salt = newSalt();
    expect(buildSealed({ ...base, salt }).receipt.answerCommitment).toBe(
      buildSealed({ ...base, salt }).receipt.answerCommitment
    );
  });

  it("does not leak a short namespace value through an unsalted hash", () => {
    const { receipt, payload } = buildSealed(base);
    // guessing the content without the salt must not reproduce the commitment
    const guessed = buildSealed({ ...base, salt: "00".repeat(32) });
    expect(guessed.receipt.memoryCommitments).not.toEqual(receipt.memoryCommitments);
    expect(payload.salt).not.toBe("00".repeat(32));
  });
});
