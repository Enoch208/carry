import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { toHex } from "@/lib/blake";

const pexec = promisify(execFile);

export const PKG = process.env.CARRY_PACKAGE_ID || "0xf7acc10ee3de95ed5bb4560e48d5bf4a4e24f7c4003b892b56632c7ff398b6f9";
export const POLICY = process.env.CARRY_ACCESS_POLICY || "0x7bac6b5168a646d7ef06a05fcdebb1526a831bae91c42bb1fd295f976af2cd51";
const NETWORK = process.env.SUI_NETWORK || "testnet";
// The public fullnode.<net>.sui.io endpoints no longer serve raw JSON-RPC; use a working public RPC.
const RPC_URL = process.env.SUI_RPC_URL || "https://sui-testnet-rpc.publicnode.com";
const CLOCK = "0x6";
const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

const client = new SuiJsonRpcClient({ url: RPC_URL, network: NETWORK });

export const suiscanTx = (d: string) => `https://suiscan.xyz/${NETWORK}/tx/${d}`;
export const suiscanObject = (id: string) => `https://suiscan.xyz/${NETWORK}/object/${id}`;

// ── anchoring (write, server-side via the Sui CLI) ──────────────────────────

export type OnchainAnchor = {
  txDigest: string;
  receiptId: string;
  allAuthorized: boolean;
  suiscanUrl: string;
  verifyPath: string;
};

async function runSui(args: string[]): Promise<string> {
  const bins = [process.env.SUI_BIN, "sui", "/opt/homebrew/bin/sui"].filter(Boolean) as string[];
  let lastErr: unknown;
  for (const bin of bins) {
    try {
      const { stdout } = await pexec(bin, args, { maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
      return stdout;
    } catch (e) {
      lastErr = e;
      if ((e as { code?: string }).code !== "ENOENT") throw e;
    }
  }
  throw lastErr ?? new Error("sui CLI not found");
}

export async function anchorOnChain(args: {
  answerId: string;
  agent: string;
  used: string[];
  blocked: string[];
  digestHex: string;
  walrusBlob: string;
}): Promise<OnchainAnchor> {
  const stdout = await runSui([
    "client", "call",
    "--package", PKG, "--module", "access", "--function", "anchor_receipt",
    "--args", POLICY, args.answerId, args.agent,
    JSON.stringify(args.used), JSON.stringify(args.blocked),
    "0x" + args.digestHex.replace(/^0x/, ""), args.walrusBlob, CLOCK,
    "--gas-budget", "100000000", "--json",
  ]);
  const parsed = JSON.parse(stdout) as {
    digest?: string;
    events?: { parsedJson?: { all_authorized?: boolean } }[];
    objectChanges?: { type?: string; objectType?: string; objectId?: string }[];
  };
  const event = parsed.events?.find((e) => e.parsedJson && "all_authorized" in e.parsedJson);
  const created = parsed.objectChanges?.find(
    (c) => c.type === "created" && (c.objectType ?? "").endsWith("::access::Receipt")
  );
  const receiptId = created?.objectId ?? "";
  return {
    txDigest: parsed.digest ?? "",
    receiptId,
    allAuthorized: event?.parsedJson?.all_authorized ?? false,
    suiscanUrl: suiscanTx(parsed.digest ?? ""),
    verifyPath: receiptId ? `/verify/${receiptId}` : "",
  };
}

// ── reads (work anywhere — read-only RPC, no wallet, no CLI) ─────────────────

export async function readIsAllowed(agent: string, namespace: string, policyId = POLICY): Promise<boolean> {
  try {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PKG}::access::is_allowed`,
      arguments: [tx.object(policyId), tx.pure.string(agent), tx.pure.string(namespace)],
    });
    const res = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: ZERO });
    const ret = res.results?.[0]?.returnValues?.[0];
    if (!ret) return false; // fail-closed
    return bcs.Bool.parse(Uint8Array.from(ret[0])) === true;
  } catch {
    return false;
  }
}

function u8ToHex(field: unknown): string {
  if (Array.isArray(field)) return toHex(Uint8Array.from(field as number[]));
  if (typeof field === "string") {
    try {
      return toHex(Uint8Array.from(Buffer.from(field, "base64")));
    } catch {
      return "";
    }
  }
  return "";
}

export type OnchainReceipt = {
  id: string;
  policy: string;
  seq: number;
  answerId: string;
  agent: string;
  usedNamespaces: string[];
  blockedNamespaces: string[];
  allAuthorized: boolean;
  digestHex: string;
  prevDigestHex: string;
  chainDigestHex: string;
  walrusBlob: string;
  timestampMs: number;
};

export async function getReceipt(id: string): Promise<OnchainReceipt | null> {
  try {
    const res = await client.getObject({ id, options: { showContent: true } });
    const content = res.data?.content as { dataType?: string; fields?: Record<string, unknown> } | undefined;
    if (!content || content.dataType !== "moveObject" || !content.fields) return null;
    const f = content.fields;
    return {
      id,
      policy: String(f.policy),
      seq: Number(f.seq),
      answerId: String(f.answer_id),
      agent: String(f.agent),
      usedNamespaces: (f.used_namespaces as string[]) ?? [],
      blockedNamespaces: (f.blocked_namespaces as string[]) ?? [],
      allAuthorized: Boolean(f.all_authorized),
      digestHex: u8ToHex(f.digest),
      prevDigestHex: u8ToHex(f.prev_digest),
      chainDigestHex: u8ToHex(f.chain_digest),
      walrusBlob: String(f.walrus_blob),
      timestampMs: Number(f.timestamp_ms),
    };
  } catch {
    return null;
  }
}
