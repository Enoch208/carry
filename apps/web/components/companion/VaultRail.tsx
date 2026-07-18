"use client";

import { Icon, MemoryIcon, GateIcon, TerminalIcon, LockIcon } from "@/components/icons";
import { AccessGate } from "@/components/companion/AccessGate";
import { GateLog, type LogLine } from "@/components/companion/GateLog";
import { cn } from "@/lib/cn";
import type { Memory } from "@carry/core";

const shortRef = (r: string) => (r.length > 16 ? `${r.slice(0, 8)}…${r.slice(-6)}` : r);

function SectionLabel({ icon, children }: { icon: typeof MemoryIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
      <Icon icon={icon} size={13} aria-hidden />
      {children}
    </div>
  );
}

export function VaultRail({
  memories,
  healthGranted,
  busy,
  onToggle,
  logLines,
}: {
  memories: Memory[];
  healthGranted: boolean;
  busy: boolean;
  onToggle: () => void;
  logLines: LogLine[];
}) {
  const scoped = memories.filter((m) => m.namespace === "health" || m.namespace === "diet");

  return (
    <aside className="hidden w-[340px] shrink-0 flex-col border-l border-dashed border-white/20 bg-[#070707] lg:flex">
      <div className="border-b border-dashed border-white/20 px-5 py-4">
        <SectionLabel icon={MemoryIcon}>Memory vault</SectionLabel>
        <div className="mt-3 space-y-2">
          {scoped.map((m) => {
            const locked = m.namespace === "health" && !healthGranted;
            return (
              <div
                key={m.memoryId}
                className={cn(
                  "rounded-lg border px-3 py-2.5 transition-all duration-300",
                  locked ? "border-danger/30 bg-danger/[0.05]" : "border-border bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("font-mono text-[11px]", locked ? "text-danger" : "text-accent")}>
                    {m.namespace}
                  </span>
                  {locked ? (
                    <span className="flex items-center gap-1 text-[10px] text-danger animate-[carry-lock_260ms_ease-out]">
                      <Icon icon={LockIcon} size={11} aria-hidden /> gated
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-success">
                      <span className="size-1.5 rounded-full bg-success" /> on Walrus
                    </span>
                  )}
                </div>
                <p className={cn("mt-1 text-[12px] leading-snug", locked ? "text-faint" : "text-gray-300")}>
                  {m.content}
                </p>
                <p className="mt-1 font-mono text-[10px] text-faint">walrus:{shortRef(m.walrusRef)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-b border-dashed border-white/20 px-5 py-4">
        <SectionLabel icon={GateIcon}>Access gate</SectionLabel>
        <div className="mt-3">
          <AccessGate granted={healthGranted} busy={busy} onToggle={onToggle} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
        <SectionLabel icon={TerminalIcon}>Gate log</SectionLabel>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <GateLog lines={logLines} />
        </div>
      </div>
    </aside>
  );
}
