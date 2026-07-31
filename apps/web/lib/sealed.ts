import { randomBytes } from "node:crypto";
import { blake2b256Hex, canonicalBytes, toHex } from "@/lib/blake";

/**
 * A Carry Proof is public: anyone can fetch the Walrus blob it binds to. That is
 * what makes it verifiable without a wallet, and it is also why the blob must
 * not carry the memory itself — publishing an audit trail should not publish the
 * user's health records along with it.
 *
 * A sealed receipt keeps the parts a verifier needs in the clear (which agent,
 * which namespaces, the verdict, the policy version) and replaces everything
 * revealing with a salted commitment. The salt lives only in the sealed payload,
 * so a reader cannot brute-force short values like "diabetes" out of a hash,
 * while an auditor who can open the payload recomputes every commitment and
 * proves the receipt describes exactly the answer that was given.
 */

export type SealedReceipt = {
  schema: "carry.receipt.sealed/2";
  answerId: string;
  agent: string;
  model: string;
  policyVersion: number | null;
  allAuthorized: boolean;
  /** Namespaces are policy-level and already public on chain. */
  usedNamespaces: string[];
  blockedNamespaces: string[];
  queryCommitment: string;
  answerCommitment: string;
  memoryCommitments: string[];
  /** Where the openable evidence lives, and how it was protected. */
  sealed: { mode: "seal" | "none"; ref: string };
  createdAt: string;
  expiresAtMs: number;
};

export type SealedPayload = {
  schema: "carry.receipt.payload/2";
  salt: string;
  query: string;
  answer: string;
  memories: { memoryId: string; namespace: string; content: string }[];
};

export type UsedMemoryInput = { memoryId: string; namespace: string; content: string };

const commit = (salt: string, ...parts: string[]) => blake2b256Hex(canonicalBytes([salt, ...parts]));

export function newSalt(): string {
  return toHex(new Uint8Array(randomBytes(32)));
}

export function buildSealed(input: {
  answerId: string;
  agent: string;
  model: string;
  query: string;
  answer: string;
  memories: UsedMemoryInput[];
  blockedNamespaces: string[];
  allAuthorized: boolean;
  policyVersion: number | null;
  expiresAtMs: number;
  salt?: string;
}): { receipt: Omit<SealedReceipt, "sealed">; payload: SealedPayload } {
  const salt = input.salt ?? newSalt();
  return {
    receipt: {
      schema: "carry.receipt.sealed/2",
      answerId: input.answerId,
      agent: input.agent,
      model: input.model,
      policyVersion: input.policyVersion,
      allAuthorized: input.allAuthorized,
      usedNamespaces: [...new Set(input.memories.map((m) => m.namespace))].sort(),
      blockedNamespaces: [...input.blockedNamespaces].sort(),
      queryCommitment: commit(salt, "query", input.query),
      answerCommitment: commit(salt, "answer", input.answer),
      memoryCommitments: input.memories
        .map((m) => commit(salt, "memory", m.memoryId, m.namespace, m.content))
        .sort(),
      createdAt: new Date(0).toISOString(),
      expiresAtMs: input.expiresAtMs,
    },
    payload: {
      schema: "carry.receipt.payload/2",
      salt,
      query: input.query,
      answer: input.answer,
      memories: input.memories,
    },
  };
}

export type OpenResult = {
  ok: boolean;
  checks: { label: string; ok: boolean }[];
};

/**
 * What an authorized auditor runs after decrypting the payload: recompute every
 * commitment and confirm the public receipt describes this exact evidence. A
 * receipt that verifies publicly but fails here would mean the commitments were
 * built from something other than the answer that was given.
 */
export function openSealed(receipt: SealedReceipt, payload: SealedPayload): OpenResult {
  const { salt } = payload;
  const memories = payload.memories
    .map((m) => commit(salt, "memory", m.memoryId, m.namespace, m.content))
    .sort();
  const namespaces = [...new Set(payload.memories.map((m) => m.namespace))].sort();

  const checks = [
    { label: "Query commitment matches", ok: commit(salt, "query", payload.query) === receipt.queryCommitment },
    { label: "Answer commitment matches", ok: commit(salt, "answer", payload.answer) === receipt.answerCommitment },
    {
      label: "Every used memory is committed",
      ok:
        memories.length === receipt.memoryCommitments.length &&
        memories.every((c, i) => c === receipt.memoryCommitments[i]),
    },
    {
      label: "Namespaces agree with the sealed memories",
      ok:
        namespaces.length === receipt.usedNamespaces.length &&
        namespaces.every((n, i) => n === receipt.usedNamespaces[i]),
    },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}
