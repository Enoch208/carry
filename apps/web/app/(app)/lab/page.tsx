import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { runLab, exposureOf, ONCHAIN_REJECTIONS, SUPERSEDED } from "@/lib/lab";
import { netCfg, resolveNetwork } from "@/lib/networks";
import { Icon, CheckIcon, BlockedIcon, ArrowUpRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Attack Lab",
  description: "Attacks run live against Carry's on-chain gate. Every number is measured, not claimed.",
};

export const dynamic = "force-dynamic";

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${good ? "border-success/40 bg-success/[0.06]" : "border-danger/40 bg-danger/[0.06]"}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${good ? "text-success" : "text-danger"}`}>{value}</p>
    </div>
  );
}

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const sp = await searchParams;
  const network = resolveNetwork(sp.network);
  const cfg = netCfg(network);
  const [r, before] = await Promise.all([
    runLab(network),
    exposureOf(SUPERSEDED.packageId, SUPERSEDED.accessPolicy, network),
  ]);
  const clean = r.unauthorisedExposures === 0 && r.passed === r.total;

  return (
    <div className="px-8 py-9">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Attack lab</h1>
            <p className="text-[12px] text-faint">
              every row is a real is_allowed call against the live {network} policy
            </p>
          </div>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Unauthorized exposure" value={`${(r.exposureRate * 100).toFixed(0)}%`} good={r.unauthorisedExposures === 0} />
          <Stat label="Attacks refused" value={`${r.total - 1 - r.unauthorisedExposures}/${r.total - 1}`} good={r.unauthorisedExposures === 0} />
          <Stat label="Probes passing" value={`${r.passed}/${r.total}`} good={clean} />
        </div>

        <p className="mb-4 text-[12px] text-muted">
          These run on every page load, simulated against the deployed policy{" "}
          <a
            href={`${cfg.suiscan}/object/${r.policyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-dotted"
          >
            on chain ↗
          </a>
          , so they cost nothing and cannot be faked here. The first row is a control: it must pass, or the gate
          would just be denying everything and the zero above would mean nothing.
        </p>

        <div className="mb-10 space-y-2">
          {r.probes.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <Icon
                icon={p.passed ? CheckIcon : BlockedIcon}
                size={16}
                className={`mt-0.5 shrink-0 ${p.passed ? "text-success" : "text-danger"}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-fg">{p.attack}</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">
                  is_allowed({p.agent || "″″"}, {p.namespace || "″″"}) = {String(p.actual)} · expected{" "}
                  {String(p.expected)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{p.why}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                  p.expected ? "bg-accent/15 text-accent" : p.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
              >
                {p.expected ? "control" : p.passed ? "refused" : "EXPOSED"}
              </span>
            </div>
          ))}
        </div>

        {network === "mainnet" ? (
          <div className="mb-10 rounded-card border border-border bg-surface p-5">
            <h2 className="mb-1 text-sm font-semibold text-fg">The same probes against the previous gate</h2>
            <p className="mb-4 text-[12px] text-muted">
              Until today the gate was default-allow: an entry that did not exist read as permitted. That package
              is still deployed, so the identical attacks can be run against both and compared — this is measured
              live, not a claim that things improved.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-danger/40 bg-danger/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-faint">{SUPERSEDED.label}</p>
                <p className="mt-1 font-mono text-2xl text-danger">
                  {before.exposed}/{before.of}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">attacks exposed memory</p>
              </div>
              <div className="rounded-lg border border-success/40 bg-success/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-faint">v4 — default-deny</p>
                <p className="mt-1 font-mono text-2xl text-success">
                  {r.unauthorisedExposures}/{r.total - 1}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">attacks exposed memory</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-faint">
              Both policies are public:{" "}
              <a
                href={`${cfg.suiscan}/object/${SUPERSEDED.accessPolicy}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-dotted"
              >
                the old one ↗
              </a>{" "}
              and{" "}
              <a
                href={`${cfg.suiscan}/object/${r.policyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-dotted"
              >
                the current one ↗
              </a>
              .
            </p>
          </div>
        ) : null}

        <h2 className="mb-1 text-sm font-semibold text-fg">Write-path attacks</h2>
        <p className="mb-4 text-[12px] text-muted">
          These change chain state, so they cannot be simulated for free. Each was executed for real against
          mainnet and rejected by consensus.
        </p>
        <div className="space-y-2">
          {ONCHAIN_REJECTIONS.map((o) => (
            <div key={o.attack} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <Icon icon={CheckIcon} size={16} className="mt-0.5 shrink-0 text-success" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-fg">{o.attack}</p>
                <p className="mt-0.5 font-mono text-[11px] text-success">{o.result}</p>
                <p className="mt-0.5 text-[11px] text-muted">{o.why}</p>
              </div>
              {o.tx ? (
                <a
                  href={`https://suiscan.xyz/mainnet/tx/${o.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] text-accent underline decoration-dotted"
                >
                  tx <Icon icon={ArrowUpRightIcon} size={11} aria-hidden />
                </a>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">
          Run these yourself: every probe is one <span className="font-mono">is_allowed</span> call on the public
          policy object, and every write-path result is a transaction you can open on Suiscan.
        </p>
      </div>
    </div>
  );
}
