import { SuiGrpcClient } from "@mysten/sui/grpc";
import { blake2b256Hex, canonicalBytes, toHex } from "@/lib/blake";
import { DEFAULT_NETWORK, netCfg, type Network } from "@/lib/networks";

export type ManifestEntry = { memoryId: string; namespace: string; walrusRef: string };

export type Manifest = {
  schema: string;
  policy: string;
  memoryNetwork?: string;
  memoryAggregator?: string;
  createdAt: string;
  memories: ManifestEntry[];
};

export type RecoveredMemory = ManifestEntry & { content: string | null; resolved: boolean };

export type VaultRecovery = {
  found: boolean;
  network: Network;
  vaultId: string;
  owner: string;
  policy: string;
  manifestBlob: string;
  manifestVersion: number;
  updatedAtMs: number;
  manifestDigestHex: string;
  manifestIntact: boolean;
  memories: RecoveredMemory[];
  memoryAggregator: string;
  error?: string;
};

const EMPTY: Omit<VaultRecovery, "network" | "error"> = {
  found: false,
  vaultId: "",
  owner: "",
  policy: "",
  manifestBlob: "",
  manifestVersion: 0,
  updatedAtMs: 0,
  manifestDigestHex: "",
  manifestIntact: false,
  memories: [],
  memoryAggregator: "",
};

function base64ToHex(v: unknown): string {
  if (Array.isArray(v)) return toHex(Uint8Array.from(v as number[]));
  if (typeof v === "string") {
    try {
      return toHex(Uint8Array.from(Buffer.from(v, "base64")));
    } catch {
      return "";
    }
  }
  return "";
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * Rebuild the vault from chain and Walrus alone — the wallet owns the vault, the
 * vault names the manifest and its digest, and the manifest names the memory
 * blobs. Nothing here reads local state, which is the point: this is what a
 * second device sees. The manifest is only trusted once it re-hashes to the
 * digest the chain recorded.
 */
export async function recoverVault(network: Network = DEFAULT_NETWORK): Promise<VaultRecovery> {
  const cfg = netCfg(network);
  const base = { ...EMPTY, network, vaultId: cfg.carryVault };
  if (!cfg.carryVault) return { ...base, error: "no vault configured for this network" };

  try {
    const client = new SuiGrpcClient({ baseUrl: cfg.grpcUrl, network });
    const { object } = await client.getObject({ objectId: cfg.carryVault, include: { json: true } });
    const f = object?.json as Record<string, unknown> | undefined;
    if (!f) return { ...base, error: "vault not found" };

    const manifestBlob = String(f.manifest_blob ?? "");
    const manifestDigestHex = base64ToHex(f.manifest_digest);
    const found = {
      ...base,
      found: true,
      owner: String(f.owner ?? ""),
      policy: String(f.policy ?? ""),
      manifestBlob,
      manifestVersion: Number(f.manifest_version ?? 0),
      updatedAtMs: Number(f.updated_at_ms ?? 0),
      manifestDigestHex,
    };

    const raw = await fetchText(`${cfg.walrusAggregator}/v1/blobs/${manifestBlob}`);
    if (!raw) return { ...found, error: "manifest blob did not resolve" };

    let manifest: Manifest;
    try {
      manifest = JSON.parse(raw) as Manifest;
    } catch {
      return { ...found, error: "manifest is not valid JSON" };
    }

    const manifestIntact = blake2b256Hex(canonicalBytes(manifest)) === manifestDigestHex;
    const memoryAggregator = manifest.memoryAggregator || cfg.walrusAggregator;

    // A manifest that does not match the digest is not trusted enough to fetch from.
    if (!manifestIntact) return { ...found, manifestIntact, memoryAggregator };

    const memories = await Promise.all(
      (manifest.memories ?? []).map(async (m) => {
        const body = m.walrusRef ? await fetchText(`${memoryAggregator}/v1/blobs/${m.walrusRef}`) : null;
        let content: string | null = null;
        if (body) {
          try {
            const parsed = JSON.parse(body) as { content?: string };
            content = typeof parsed.content === "string" ? parsed.content : body;
          } catch {
            content = body;
          }
        }
        return { ...m, content, resolved: body !== null };
      })
    );

    return { ...found, manifestIntact, memoryAggregator, memories };
  } catch (e) {
    return { ...base, error: (e as Error).message };
  }
}
