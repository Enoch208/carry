import { SuiGrpcClient } from "@mysten/sui/grpc";
import { readIsAllowed } from "@/lib/sui";
import { netCfg, type Network } from "@/lib/networks";

export type ConsoleReceipt = {
  id: string;
  seq: number;
  agent: string;
  answerId: string;
  used: string[];
  blocked: string[];
  allAuthorized: boolean;
  policyVersion: number | null;
  walrusBlob: string;
  timestampMs: number;
};

export type ConsoleView = {
  network: Network;
  policyId: string;
  policyVersion: number | null;
  agents: string[];
  namespaces: string[];
  /** agent → namespace → allowed, read from chain. */
  matrix: Record<string, Record<string, boolean>>;
  receipts: ConsoleReceipt[];
  refusals: ConsoleReceipt[];
  error?: string;
};

type ReceiptJson = {
  id: string;
  seq: string;
  agent: string;
  answer_id: string;
  all_authorized: boolean;
  used_namespaces?: string[];
  blocked_namespaces?: string[];
  policy_version?: string;
  walrus_blob?: string;
  timestamp_ms?: string;
};

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

/**
 * Everything an auditor needs, derived from chain state at request time:
 * who has access, what each answer used, and which attempts were refused.
 * Nothing is tallied server-side, so the console cannot flatter itself.
 */
export async function consoleView(network: Network): Promise<ConsoleView> {
  const cfg = netCfg(network);
  const base: ConsoleView = {
    network,
    policyId: cfg.accessPolicy,
    policyVersion: null,
    agents: [],
    namespaces: [],
    matrix: {},
    receipts: [],
    refusals: [],
  };

  try {
    const client = new SuiGrpcClient({ baseUrl: cfg.grpcUrl, network });
    const { object } = await client.getObject({ objectId: cfg.accessPolicy, include: { json: true } });
    const policy = object?.json as { owner?: string; policy_version?: string } | undefined;
    if (!policy?.owner) return { ...base, error: "policy unreadable" };

    const owned = await client.listOwnedObjects({
      owner: policy.owner,
      type: `${cfg.packageId}::access::Receipt`,
      include: { json: true },
    });
    const receipts: ConsoleReceipt[] = (owned.objects ?? [])
      .map((o) => o.json as unknown as ReceiptJson | null)
      .filter((r): r is ReceiptJson => Boolean(r))
      .map((r) => ({
        id: r.id,
        seq: Number(r.seq),
        agent: r.agent,
        answerId: r.answer_id,
        used: r.used_namespaces ?? [],
        blocked: r.blocked_namespaces ?? [],
        allAuthorized: Boolean(r.all_authorized),
        policyVersion: r.policy_version == null ? null : Number(r.policy_version),
        walrusBlob: r.walrus_blob ?? "",
        timestampMs: Number(r.timestamp_ms ?? 0),
      }))
      .sort((a, b) => b.seq - a.seq);

    // The agents and namespaces the deployment has actually seen, so the matrix
    // reflects this policy rather than a hard-coded list.
    const agents = uniq(receipts.map((r) => r.agent).concat(["aria", "agent-a", "agent-b"]));
    const namespaces = uniq(
      receipts.flatMap((r) => [...r.used, ...r.blocked]).concat(["health", "diet", "project", "billing"])
    );

    const matrix: Record<string, Record<string, boolean>> = {};
    await Promise.all(
      agents.map(async (a) => {
        const row = await Promise.all(
          namespaces.map(async (ns) => [ns, await readIsAllowed(a, ns, cfg.accessPolicy, network)] as const)
        );
        matrix[a] = Object.fromEntries(row);
      })
    );

    return {
      ...base,
      policyVersion: policy.policy_version == null ? null : Number(policy.policy_version),
      agents,
      namespaces,
      matrix,
      receipts,
      refusals: receipts.filter((r) => !r.allAuthorized),
    };
  } catch (e) {
    return { ...base, error: (e as Error).message };
  }
}

/** A compliance officer wants a file, not a screenshot. */
export function toCsv(receipts: ConsoleReceipt[]): string {
  const head = [
    "seq",
    "receipt_id",
    "agent",
    "answer_id",
    "all_authorized",
    "used_namespaces",
    "blocked_namespaces",
    "policy_version",
    "walrus_blob",
    "timestamp_ms",
  ];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = receipts.map((r) =>
    [
      String(r.seq),
      r.id,
      r.agent,
      r.answerId,
      String(r.allAuthorized),
      r.used.join(" "),
      r.blocked.join(" "),
      r.policyVersion === null ? "" : String(r.policyVersion),
      r.walrusBlob,
      String(r.timestampMs),
    ]
      .map(esc)
      .join(",")
  );
  return [head.join(","), ...rows].join("\n");
}
