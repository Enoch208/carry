import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allMetrics, type NetworkMetrics } from "@/lib/metrics";
import { netCfg } from "@/lib/networks";

export const metadata: Metadata = {
  title: "Carry — Live Metrics",
  description: "Traction read straight from Sui and Walrus. No self-reported numbers.",
};

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className="mt-1 font-mono text-2xl text-fg">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

function Pills({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-border py-2.5 text-[13px]">
      <span className="w-36 shrink-0 text-faint">{label}</span>
      <span className="flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((i) => (
            <span key={i} className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted">
              {i}
            </span>
          ))
        ) : (
          <span className="text-faint">—</span>
        )}
      </span>
    </div>
  );
}

function NetworkCard({ m }: { m: NetworkMetrics }) {
  const cfg = netCfg(m.network);
  if (m.error) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-fg">{m.network}</p>
        <p className="mt-1 text-[12px] text-faint">{m.error}</p>
      </div>
    );
  }
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Sui {m.network}</h2>
        <a
          href={`${cfg.suiscan}/object/${m.policyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-accent underline decoration-dotted"
        >
          policy ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Receipts" value={m.receiptsAnchored} hint="policy counter" />
        <Stat label="Authorized" value={m.authorized} />
        <Stat label="Blocked" value={m.blocked} hint="caught on-chain" />
        <Stat label="Walrus-bound" value={`${m.walrusResolvable}/${m.boundToWalrus}`} hint="blobs resolvable" />
      </div>

      <div className="mt-4">
        <Pills label="agents" items={m.agents} />
        <Pills label="namespaces used" items={m.namespacesUsed} />
        <Pills label="namespaces blocked" items={m.namespacesBlocked} />
      </div>
    </div>
  );
}

export default async function MetricsPage() {
  const metrics = await allMetrics();
  const total = metrics.reduce((n, m) => n + m.receiptsAnchored, 0);
  const blocked = metrics.reduce((n, m) => n + m.blocked, 0);

  return (
    <div className="min-h-dvh bg-[#050505] px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center gap-3">
          <Image src="/carry_mark.png" alt="" width={594} height={662} className="h-5 w-auto" />
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Live metrics</h1>
            <p className="text-[12px] text-faint">
              read from Sui and Walrus on every request · nothing self-reported
            </p>
          </div>
          <Link href="/companion" className="text-[12px] text-faint transition-colors hover:text-accent">
            Carry ↗
          </Link>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <Stat label="Proofs anchored" value={total} hint="across both networks" />
          <Stat label="Claims refused" value={blocked} hint="gate caught them on-chain" />
        </div>

        <div className="space-y-4">
          {metrics.map((m) => (
            <NetworkCard key={m.network} m={m} />
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">
          Receipt totals come from each policy&apos;s own on-chain counter; the breakdown enumerates the
          Receipt objects it minted, and every Walrus blob is re-fetched to confirm it still resolves.
        </p>
      </div>
    </div>
  );
}
