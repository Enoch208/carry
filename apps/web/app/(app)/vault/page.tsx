import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { recoverVault } from "@/lib/vault";
import { netCfg, resolveNetwork } from "@/lib/networks";
import { Icon, CheckIcon, BlockedIcon, ArrowUpRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Vault Recovery",
  description: "Rebuild a Carry vault from Sui and Walrus alone — no wallet, no local state.",
};

export const dynamic = "force-dynamic";

const short = (r: string) => (r && r.length > 20 ? `${r.slice(0, 10)}…${r.slice(-8)}` : r);

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-2.5 text-[13px]">
      <span className="text-faint">{k}</span>
      <span className="text-right font-mono text-fg">{children}</span>
    </div>
  );
}

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const sp = await searchParams;
  const network = resolveNetwork(sp.network);
  const cfg = netCfg(network);
  const v = await recoverVault(network);

  return (
    <div className="px-8 py-9">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Vault recovery</h1>
            <p className="text-[12px] text-faint">
              no wallet · no local state · {network} · rebuilt from Sui &amp; Walrus
            </p>
          </div>
        </header>

        {!v.found ? (
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">{v.error ?? "No vault found"}</p>
            <p className="mt-1 break-all font-mono text-[12px] text-faint">{v.vaultId || "—"}</p>
          </div>
        ) : (
          <>
            <div
              className={`mb-6 flex items-center gap-3 rounded-card border p-5 ${
                v.manifestIntact ? "border-success/40 bg-success/[0.07]" : "border-danger/40 bg-danger/[0.07]"
              }`}
            >
              <span
                className={`grid size-10 place-items-center rounded-full ${
                  v.manifestIntact ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
              >
                <Icon icon={v.manifestIntact ? CheckIcon : BlockedIcon} size={22} aria-hidden />
              </span>
              <div>
                <p className={`text-sm font-semibold ${v.manifestIntact ? "text-success" : "text-danger"}`}>
                  {v.manifestIntact
                    ? "Manifest intact — recovered from chain and Walrus"
                    : "Manifest does not match the digest on chain"}
                </p>
                <p className="text-[12px] text-muted">
                  {v.memories.filter((m) => m.resolved).length}/{v.memories.length} memories resolved · manifest v
                  {v.manifestVersion}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-card border border-border bg-surface px-5 py-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
                The recovery chain
              </p>
              <Row k="owner (wallet)">{short(v.owner)}</Row>
              <Row k="vault">
                <a
                  href={`${cfg.suiscan}/object/${v.vaultId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent underline decoration-dotted"
                >
                  {short(v.vaultId)} <Icon icon={ArrowUpRightIcon} size={12} aria-hidden />
                </a>
              </Row>
              <Row k="manifest version">v{v.manifestVersion}</Row>
              <Row k="manifest blob">
                <a
                  href={`${cfg.walrusAggregator}/v1/blobs/${v.manifestBlob}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline decoration-dotted"
                >
                  {short(v.manifestBlob)} ↗
                </a>
              </Row>
              <Row k="manifest digest">{short(v.manifestDigestHex)}</Row>
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              Recovered memories
            </p>
            <div className="space-y-2">
              {v.memories.map((m) => (
                <div
                  key={m.memoryId}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <Icon
                    icon={m.resolved ? CheckIcon : BlockedIcon}
                    size={16}
                    className={m.resolved ? "text-success" : "text-danger"}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-fg">
                      <span className="mr-2 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted">
                        {m.namespace}
                      </span>
                      {m.content ?? <span className="text-faint">blob did not resolve</span>}
                    </p>
                    <a
                      href={`${v.memoryAggregator}/v1/blobs/${m.walrusRef}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-faint underline decoration-dotted hover:text-accent"
                    >
                      walrus:{short(m.walrusRef)}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-faint">
              This page holds no state. It read the vault from Sui, fetched the manifest from Walrus, checked it
              re-hashes to the digest the chain recorded, and only then fetched the memory blobs — which is exactly
              what a second device does.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
