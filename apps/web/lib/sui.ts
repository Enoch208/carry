import { randomUUID } from "node:crypto";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { bcs } from "@mysten/sui/bcs";
import { toHex, fromHex } from "@/lib/blake";
import { DEFAULT_NETWORK, netCfg, type Network } from "@/lib/networks";

const CLOCK = "0x6";
const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Default-network convenience exports (kept for existing callers).
export const PKG = netCfg(DEFAULT_NETWORK).packageId;
export const POLICY = netCfg(DEFAULT_NETWORK).accessPolicy;

const clients: Partial<Record<Network, SuiGrpcClient>> = {};
function clientFor(network: Network): SuiGrpcClient {
  const cfg = netCfg(network);
  clients[network] ??= new SuiGrpcClient({ baseUrl: cfg.grpcUrl, network });
  return clients[network]!;
}

export const suiscanTx = (d: string, network: Network = DEFAULT_NETWORK) => `${netCfg(network).suiscan}/tx/${d}`;
export const suiscanObject = (id: string, network: Network = DEFAULT_NETWORK) => `${netCfg(network).suiscan}/object/${id}`;

// ── anchoring (write, SDK-native with a server-held signer) ──────────────────

export type OnchainAnchor = {
  txDigest: string;
  receiptId: string;
  allAuthorized: boolean;
  suiscanUrl: string;
  verifyPath: string;
};

/**
 * The anchoring key holds no OwnerCap on purpose: `anchor_receipt` is callable
 * by anyone, so this signer can append proofs but can never change the gate.
 * Compromising it cannot widen what an agent may read.
 */
function anchorSigner(): Ed25519Keypair {
  const key = process.env.CARRY_SIGNER_KEY;
  if (!key) throw new Error("CARRY_SIGNER_KEY is not set — on-chain anchoring needs a server signer");
  return Ed25519Keypair.fromSecretKey(key.trim());
}

export async function anchorOnChain(
  args: { answerId: string; agent: string; used: string[]; blocked: string[]; digestHex: string; walrusBlob: string },
  network: Network = DEFAULT_NETWORK
): Promise<OnchainAnchor> {
  const cfg = netCfg(network);
  const client = clientFor(network);
  const signer = anchorSigner();

  const policyVersion = await readPolicyVersion(cfg.accessPolicy, network);
  if (policyVersion === null) throw new Error("could not read the live policy version");

  const nonce = `${args.answerId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const expiresAtMs = BigInt(Date.now() + 10 * 60 * 1000);

  const tx = new Transaction();
  tx.moveCall({
    target: `${cfg.packageId}::access::anchor_receipt`,
    arguments: [
      tx.object(cfg.accessPolicy),
      tx.pure.string(args.answerId),
      tx.pure.string(args.agent),
      tx.pure.vector("string", args.used),
      tx.pure.vector("string", args.blocked),
      tx.pure.vector("u8", Array.from(fromHex(args.digestHex))),
      tx.pure.string(args.walrusBlob),
      tx.pure.u64(BigInt(policyVersion)),
      tx.pure.string(nonce),
      tx.pure.u64(expiresAtMs),
      tx.object(CLOCK),
    ],
  });

  const res = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    include: { effects: true, events: true, objectTypes: true },
  });

  if (res.$kind !== "Transaction") {
    const err = (res as { FailedTransaction?: { status?: { error?: { message?: string } } } }).FailedTransaction;
    throw new Error(`anchor_receipt rejected on-chain: ${err?.status?.error?.message ?? "unknown error"}`);
  }

  const t = res.Transaction as unknown as {
    digest?: string;
    events?: { json?: Record<string, unknown> }[];
  };
  const digest = t.digest ?? "";
  const event = (t.events ?? []).find((e) => e.json && "all_authorized" in e.json);
  const receiptId = String(event?.json?.receipt ?? "");
  const verifyQuery = network === "testnet" ? "" : `?network=${network}`;

  return {
    txDigest: digest,
    receiptId,
    allAuthorized: Boolean(event?.json?.all_authorized),
    suiscanUrl: suiscanTx(digest, network),
    verifyPath: receiptId ? `/verify/${receiptId}${verifyQuery}` : "",
  };
}

// ── reads (work anywhere — read-only RPC, no wallet, no CLI) ─────────────────

export async function readIsAllowed(
  agent: string,
  namespace: string,
  policyId: string,
  network: Network = DEFAULT_NETWORK,
  packageId?: string
): Promise<boolean> {
  try {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId || netCfg(network).packageId}::access::is_allowed`,
      arguments: [tx.object(policyId), tx.pure.string(agent), tx.pure.string(namespace)],
    });
    tx.setSender(ZERO);
    const res = await clientFor(network).simulateTransaction({
      transaction: tx,
      include: { commandResults: true },
    });
    const ret = res.commandResults?.[0]?.returnValues?.[0]?.bcs;
    if (!ret) return false; // fail-closed
    return bcs.Bool.parse(Uint8Array.from(ret)) === true;
  } catch {
    return false;
  }
}

/** The policy's live version — a receipt is only current while these agree. */
export async function readPolicyVersion(
  policyId: string,
  network: Network = DEFAULT_NETWORK,
  _packageId?: string
): Promise<number | null> {
  try {
    const { object } = await clientFor(network).getObject({ objectId: policyId, include: { json: true } });
    const v = (object?.json as Record<string, unknown> | undefined)?.policy_version;
    return v == null ? null : Number(v);
  } catch {
    return null;
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
  /// The package this receipt was minted by — older receipts live in earlier
  /// packages, and the verdict must be recomputed against their own gate.
  packageId: string;
  policyVersion: number | null;
  nonce: string;
  expiresAtMs: number;
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
    const { object } = await clientFor(network).getObject({
      objectId: id,
      include: { json: true, objectTypes: true },
    });
    const f = object?.json as Record<string, unknown> | undefined;
    if (!f) return null;
    const objectType = (object as { type?: string }).type ?? "";
    return {
      id,
      packageId: objectType.includes("::") ? objectType.split("::")[0] : netCfg(network).packageId,
      policyVersion: f.policy_version == null ? null : Number(f.policy_version),
      nonce: f.nonce == null ? "" : String(f.nonce),
      expiresAtMs: f.expires_at_ms == null ? 0 : Number(f.expires_at_ms),
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
