import { getReceipt } from "@/lib/sui";
import { NETWORKS, isDeployed, netCfg, type Network } from "@/lib/networks";
import { SuiGrpcClient } from "@mysten/sui/grpc";

export type NetworkMetrics = {
  network: Network;
  packageId: string;
  policyId: string;
  receiptsAnchored: number;
  authorized: number;
  blocked: number;
  boundToWalrus: number;
  walrusResolvable: number;
  agents: string[];
  namespacesUsed: string[];
  namespacesBlocked: string[];
  chainHeadHex: string;
  error?: string;
};

type ReceiptJson = {
  id: string;
  seq: string;
  agent: string;
  all_authorized: boolean;
  used_namespaces?: string[];
  blocked_namespaces?: string[];
  walrus_blob?: string;
};

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

async function resolves(aggregator: string, blobId: string): Promise<boolean> {
  try {
    const res = await fetch(`${aggregator}/v1/blobs/${blobId}`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Every number here is read from chain state at request time — the policy's own
 * receipt counter, and the Receipt objects it minted. Nothing is tallied server-side.
 */
export async function networkMetrics(network: Network): Promise<NetworkMetrics> {
  const cfg = netCfg(network);
  const base: NetworkMetrics = {
    network,
    packageId: cfg.packageId,
    policyId: cfg.accessPolicy,
    receiptsAnchored: 0,
    authorized: 0,
    blocked: 0,
    boundToWalrus: 0,
    walrusResolvable: 0,
    agents: [],
    namespacesUsed: [],
    namespacesBlocked: [],
    chainHeadHex: "",
  };
  if (!isDeployed(network)) return { ...base, error: "not deployed" };

  try {
    const client = new SuiGrpcClient({ baseUrl: cfg.grpcUrl, network });
    const { object } = await client.getObject({ objectId: cfg.accessPolicy, include: { json: true } });
    const policy = object?.json as { receipt_count?: string; owner?: string; chain_head?: string } | undefined;
    if (!policy?.owner) return { ...base, error: "policy unreadable" };

    const owned = await client.listOwnedObjects({
      owner: policy.owner,
      type: `${cfg.packageId}::access::Receipt`,
      include: { json: true },
    });
    const receipts = (owned.objects ?? [])
      .map((o) => o.json as unknown as ReceiptJson | null)
      .filter((r): r is ReceiptJson => Boolean(r));

    // Receipts can share a blob, so resolve each distinct blob once and then count
    // receipts — mixing the two units would misreport the ratio.
    const withBlob = receipts.filter((r) => r.walrus_blob);
    const distinct = uniq(withBlob.map((r) => r.walrus_blob!));
    const checked = await Promise.all(distinct.map((b) => resolves(cfg.walrusAggregator, b)));
    const live = new Set(distinct.filter((_, i) => checked[i]));

    return {
      ...base,
      receiptsAnchored: Number(policy.receipt_count ?? receipts.length),
      authorized: receipts.filter((r) => r.all_authorized).length,
      blocked: receipts.filter((r) => !r.all_authorized).length,
      boundToWalrus: withBlob.length,
      walrusResolvable: withBlob.filter((r) => live.has(r.walrus_blob!)).length,
      agents: uniq(receipts.map((r) => r.agent)),
      namespacesUsed: uniq(receipts.flatMap((r) => r.used_namespaces ?? [])),
      namespacesBlocked: uniq(receipts.flatMap((r) => r.blocked_namespaces ?? [])),
      chainHeadHex: typeof policy.chain_head === "string" ? policy.chain_head : "",
    };
  } catch (e) {
    return { ...base, error: (e as Error).message };
  }
}

export async function allMetrics(): Promise<NetworkMetrics[]> {
  return Promise.all((Object.keys(NETWORKS) as Network[]).map(networkMetrics));
}

export { getReceipt };
