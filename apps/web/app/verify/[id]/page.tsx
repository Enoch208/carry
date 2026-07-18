import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { verifyReceipt } from "@/lib/verify";
import { suiscanObject } from "@/lib/sui";
import { Icon, CheckIcon, BlockedIcon, ArrowUpRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Proof Verifier",
  description: "Independently verify a Carry Proof against Sui and Walrus — no wallet, read-only.",
};

const AGG = process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";
const short = (r: string) => (r && r.length > 20 ? `${r.slice(0, 10)}…${r.slice(-8)}` : r);

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-2.5 text-[13px]">
      <span className="text-faint">{k}</span>
      <span className="text-right font-mono text-fg">{children}</span>
    </div>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { found, receipt, checks, allOk } = await verifyReceipt(id);

  return (
    <div className="min-h-dvh bg-[#050505] px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 flex items-center gap-3">
          <Image src="/carry_mark.png" alt="" width={594} height={662} className="h-5 w-auto" />
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Proof Verifier</h1>
            <p className="text-[12px] text-faint">no wallet · read-only · recomputed against Sui &amp; Walrus</p>
          </div>
          <Link href="/companion" className="text-[12px] text-faint transition-colors hover:text-accent">
            Carry ↗
          </Link>
        </header>

        {!found ? (
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">No Carry Proof object found at</p>
            <p className="mt-1 break-all font-mono text-[12px] text-faint">{id}</p>
          </div>
        ) : (
          <>
            <div
              className={`mb-6 flex items-center gap-3 rounded-card border p-5 ${
                allOk ? "border-success/40 bg-success/[0.07]" : "border-danger/40 bg-danger/[0.07]"
              }`}
            >
              <span className={`grid size-10 place-items-center rounded-full ${allOk ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                <Icon icon={allOk ? CheckIcon : BlockedIcon} size={22} aria-hidden />
              </span>
              <div>
                <p className={`text-sm font-semibold ${allOk ? "text-success" : "text-danger"}`}>
                  {allOk ? "Verified — all three checks pass" : "Verification failed — a check did not pass"}
                </p>
                <p className="text-[12px] text-muted">Carry Proof #{receipt!.seq} · agent “{receipt!.agent}”</p>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              {checks.map((c) => (
                <div key={c.label} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                  <Icon icon={c.ok ? CheckIcon : BlockedIcon} size={16} className={c.ok ? "text-success" : "text-danger"} aria-hidden />
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium ${c.ok ? "text-fg" : "text-danger"}`}>{c.label}</p>
                    <p className="font-mono text-[11px] text-faint">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-card border border-border bg-surface px-5 py-3">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">On-chain receipt</p>
              <Row k="all_authorized">
                <span className={receipt!.allAuthorized ? "text-success" : "text-danger"}>{String(receipt!.allAuthorized)}</span>
              </Row>
              <Row k="used namespaces">{receipt!.usedNamespaces.join(", ") || "—"}</Row>
              <Row k="blocked namespaces">{receipt!.blockedNamespaces.join(", ") || "—"}</Row>
              <Row k="digest">{short(receipt!.digestHex)}</Row>
              <Row k="chain_digest">{short(receipt!.chainDigestHex)}</Row>
              <Row k="walrus blob">
                <a href={`${AGG}/v1/blobs/${receipt!.walrusBlob}`} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-dotted">
                  {short(receipt!.walrusBlob)} ↗
                </a>
              </Row>
              <Row k="object">
                <a href={suiscanObject(id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline decoration-dotted">
                  {short(id)} <Icon icon={ArrowUpRightIcon} size={12} aria-hidden />
                </a>
              </Row>
            </div>

            <p className="mt-4 text-center text-[11px] text-faint">
              This page read the object from Sui, re-hashed the Walrus blob, and recomputed the verdict — none of it trusts Carry’s servers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
