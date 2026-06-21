import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { MockWalrus, WalrusHttp, type WalrusClient } from "@carry/walrus";

export type Memory = {
  memoryId: string;
  namespace: string;
  content: string;
  walrusRef: string;
  createdAt: string;
};

export type UsedMemory = Memory & { authorized: true; verified: boolean };

export type Receipt = {
  query: string;
  usedMemories: UsedMemory[];
  blockedNamespaces: string[];
  createdAt: string;
};

type State = { memories: Memory[]; policy: Record<string, boolean>; seq: number };

const STORE_PATH = process.env.CARRY_STORE || `${homedir()}/.carry/store.json`;
const live = Boolean(process.env.WALRUS_PUBLISHER && process.env.WALRUS_AGGREGATOR);
const walrus: WalrusClient = live ? new WalrusHttp() : new MockWalrus();

function load(): State {
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as State;
  } catch {
    return { memories: [], policy: {}, seq: 0 };
  }
}
function persist(s: State) {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(s, null, 2));
}

const state = load();

export const backend = () => (live ? "Walrus testnet" : "mock");
export const storePath = () => STORE_PATH;

// Default-allow: a namespace is accessible unless it has been explicitly revoked.
export const isAllowed = (ns: string) => state.policy[ns] !== false;

function matches(content: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = new Set(content.toLowerCase().split(/\W+/).filter(Boolean));
  return q.split(/\W+/).filter(Boolean).some((w) => words.has(w));
}

export async function remember(content: string, namespace: string): Promise<Memory> {
  const createdAt = new Date().toISOString();
  const { blobId } = await walrus.store({ namespace, content, createdAt });
  const memory: Memory = { memoryId: `m${++state.seq}`, namespace, content, walrusRef: blobId, createdAt };
  state.memories.push(memory);
  persist(state);
  return memory;
}

// Gate before generation: only allowed namespaces are returned; blocked ones are never fetched.
export async function recall(query: string): Promise<Receipt> {
  const relevant = state.memories.filter((m) => matches(m.content, query));
  const allowed = relevant.filter((m) => isAllowed(m.namespace));
  const blockedNamespaces = [...new Set(relevant.filter((m) => !isAllowed(m.namespace)).map((m) => m.namespace))];
  const checks = await Promise.all(allowed.map((m) => walrus.verify(m.walrusRef).catch(() => false)));
  return {
    query,
    usedMemories: allowed.map((m, i) => ({ ...m, authorized: true, verified: checks[i] })),
    blockedNamespaces,
    createdAt: new Date().toISOString(),
  };
}

export function setAccess(namespace: string, allowed: boolean) {
  state.policy[namespace] = allowed;
  persist(state);
}

export const listMemories = () => state.memories;
export const policy = () => state.policy;

export async function anchor(receipt: Receipt): Promise<{ blobId: string; verified: boolean }> {
  const { blobId } = await walrus.store(receipt);
  return { blobId, verified: await walrus.verify(blobId) };
}
