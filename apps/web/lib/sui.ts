import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { toHex } from "@/lib/blake";
import { DEFAULT_NETWORK, netCfg, type Network } from "@/lib/networks";

const pexec = promisify(execFile);

const CLOCK = "0x6";
const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Default-network convenience exports (kept for existing callers).
export const PKG = netCfg(DEFAULT_NETWORK).packageId;
export const POLICY = netCfg(DEFAULT_NETWORK).accessPolicy;

const clients: Partial<Record<Network, SuiJsonRpcClient>> = {};
function clientFor(network: Network): SuiJsonRpcClient {
  const cfg = netCfg(network);
  clients[network] ??= new SuiJsonRpcClient({ url: cfg.rpcUrl, network });
  return clients[network]!;
}

export const suiscanTx = (d: string, network: Network = DEFAULT_NETWORK) => `${netCfg(network).suiscan}/tx/${d}`;
export const suiscanObject = (id: string, network: Network = DEFAULT_NETWORK) => `${netCfg(network).suiscan}/object/${id}`;

// ── anchoring (write, server-side via the Sui CLI on its active env) ─────────

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

export async function anchorOnChain(
  args: { answerId: string; agent: string; used: string[]; blocked: string[]; digestHex: string; walrusBlob: string },
  network: Network = DEFAULT_NETWORK
): Promise<OnchainAnchor> {
  const cfg = netCfg(network);
  const stdout = await runSui([
    "client", "call",
    "--package", cfg.packageId, "--module", "access", "--function", "anchor_receipt",
    "--args", cfg.accessPolicy, args.answerId, args.agent,
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
  const verifyQuery = network === "testnet" ? "" : `?network=${network}`;
  return {
    txDigest: parsed.digest ?? "",
    receiptId,
    allAuthorized: event?.parsedJson?.all_authorized ?? false,
    suiscanUrl: suiscanTx(parsed.digest ?? "", network),
    verifyPath: receiptId ? `/verify/${receiptId}${verifyQuery}` : "",
  };
}

// ── reads (work anywhere — read-only RPC, no wallet, no CLI) ─────────────────

export async function readIsAllowed(
  agent: string,
  namespace: string,
  policyId: string,
  network: Network = DEFAULT_NETWORK
): Promise<boolean> {
  try {
    const tx = new Transaction();
    tx.moveCall({
      target: `${netCfg(network).packageId}::access::is_allowed`,
      arguments: [tx.object(policyId), tx.pure.string(agent), tx.pure.string(namespace)],
    });
    const res = await clientFor(network).devInspectTransactionBlock({ transactionBlock: tx, sender: ZERO });
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

export async function getReceipt(id: string, network: Network = DEFAULT_NETWORK): Promise<OnchainReceipt | null> {
  try {
    const res = await clientFor(network).getObject({ id, options: { showContent: true } });
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
