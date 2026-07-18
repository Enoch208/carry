"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon, VerifiedIcon, CheckIcon, BlockedIcon, AnchorIcon, MemoryIcon } from "@/components/icons";
import { anchorReceipt, anchorOnSui } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { AnswerReceipt } from "@carry/core";

const shortRef = (r: string) => (r.length > 16 ? `${r.slice(0, 8)}…${r.slice(-6)}` : r);

type AnchorState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; blobId: string }
  | { status: "error" };

type SuiState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; digest: string; allAuthorized: boolean; url: string; verifyPath: string }
  | { status: "error" };

export function ProofStrip({ receipt }: { receipt: AnswerReceipt }) {
  const used = receipt.usedMemories;
  const blocked = receipt.blockedNamespaces;
  const allVerified = used.length > 0 && used.every((m) => m.verified);
  const [anchor, setAnchor] = useState<AnchorState>({ status: "idle" });
  const [sui, setSui] = useState<SuiState>({ status: "idle" });

  async function handleAnchor() {
    if (anchor.status === "pending" || anchor.status === "done") return;
    setAnchor({ status: "pending" });
    try {
      const { blobId } = await anchorReceipt(receipt);
      setAnchor({ status: "done", blobId });
    } catch {
      setAnchor({ status: "error" });
    }
  }

  async function handleSui() {
    if (sui.status === "pending" || sui.status === "done") return;
    setSui({ status: "pending" });
    try {
      const r = await anchorOnSui(receipt);
      if (r.txDigest) setSui({ status: "done", digest: r.txDigest, allAuthorized: !!r.allAuthorized, url: r.suiscanUrl!, verifyPath: r.verifyPath ?? "" });
      else setSui({ status: "error" });
    } catch {
      setSui({ status: "error" });
    }
  }

  return (
    <div className="rounded-card border border-border-strong bg-elevated/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Answer Receipt</p>
        {allVerified ? (
          <Badge variant="success">
            <Icon icon={VerifiedIcon} size={12} aria-hidden />
            Verified on Walrus
          </Badge>
        ) : blocked.length > 0 ? (
          <Badge variant="danger">
            <Icon icon={BlockedIcon} size={12} aria-hidden />
            Blocked before retrieval
          </Badge>
        ) : null}
      </div>

      <div className="space-y-1.5 px-4 py-3">
        {used.map((m) => (
          <div key={m.memoryId} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="flex items-center gap-2">
              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-accent">{m.namespace}</span>
              <span className="text-muted">answered from your vault</span>
            </span>
            <span className={cn("flex items-center gap-1.5 font-mono", m.verified ? "text-success" : "text-faint")}>
              {m.verified && <Icon icon={CheckIcon} size={12} aria-hidden />}
              walrus:{shortRef(m.walrusRef)}
            </span>
          </div>
        ))}

        {blocked.map((ns) => (
          <div key={ns} className="flex items-center gap-2 text-[12px] text-fg">
            <Icon icon={BlockedIcon} size={13} className="text-danger" aria-hidden />
            <span className="font-mono text-danger">{ns}</span>
            <span className="text-muted">was never fetched — the gate ran before Aria saw it</span>
          </div>
        ))}

        {used.length === 0 && blocked.length === 0 && (
          <p className="text-[12px] text-faint">No stored memory was used for this reply.</p>
        )}
      </div>

      {used.length > 0 && (
        <div className="space-y-2 border-t border-border px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => void handleAnchor()}
              disabled={anchor.status === "pending" || anchor.status === "done"}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent disabled:opacity-60"
            >
              <Icon icon={MemoryIcon} size={13} aria-hidden />
              {anchor.status === "pending" ? "Anchoring…" : anchor.status === "done" ? "On Walrus ✓" : "Anchor on Walrus"}
            </button>
            <button
              type="button"
              onClick={() => void handleSui()}
              disabled={sui.status === "pending" || sui.status === "done"}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent disabled:opacity-60"
            >
              <Icon icon={AnchorIcon} size={13} aria-hidden />
              {sui.status === "pending" ? "Anchoring on Sui…" : sui.status === "done" ? "On Sui ✓" : "Anchor on Sui"}
            </button>
          </div>

          {anchor.status === "done" && (
            <p className="font-mono text-[11px] text-success">walrus:{shortRef(anchor.blobId)}</p>
          )}
          {sui.status === "done" && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className={cn("inline-flex items-center gap-1 font-medium", sui.allAuthorized ? "text-success" : "text-danger")}>
                <Icon icon={sui.allAuthorized ? CheckIcon : BlockedIcon} size={12} aria-hidden />
                consensus: {sui.allAuthorized ? "all authorized" : "NOT authorized"}
              </span>
              <a href={sui.url} target="_blank" rel="noopener noreferrer" className="font-mono text-muted underline decoration-dotted underline-offset-2 hover:text-accent">
                tx:{shortRef(sui.digest)} ↗
              </a>
              {sui.verifyPath && (
                <a href={sui.verifyPath} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline decoration-dotted underline-offset-2">
                  verify proof ↗
                </a>
              )}
            </div>
          )}
          {(anchor.status === "error" || sui.status === "error") && (
            <p className="text-[11px] text-faint">
              {sui.status === "error"
                ? "on-chain anchoring runs in the local demo (needs the Sui CLI)"
                : "anchor failed — try again"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
