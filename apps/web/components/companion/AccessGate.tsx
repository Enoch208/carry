"use client";

import { Icon, GateIcon, RevokeIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function AccessGate({ granted, busy, onToggle }: { granted: boolean; busy?: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors duration-300",
        granted ? "border-border bg-white/[0.02]" : "border-danger/40 bg-danger/[0.06]"
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
          granted ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
        )}
      >
        <Icon icon={granted ? GateIcon : RevokeIcon} size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight text-fg">health</p>
        <p className="truncate text-[11px] text-muted">
          {granted ? "readable by Aria" : "revoked — gated before retrieval"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={granted}
        aria-label="Toggle Aria's access to the health namespace"
        onClick={onToggle}
        disabled={busy}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-70",
          granted ? "bg-accent" : "bg-danger/60"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform duration-200",
            granted ? "translate-x-[1.375rem]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
