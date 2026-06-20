import { Icon, MemoryIcon, AnchorIcon } from "@/components/icons";
import type { Memory } from "@carry/core";

type MemoryCardProps = {
  memory: Memory;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-dashed border-white/20 bg-[#050505] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon icon={MemoryIcon} size={15} aria-hidden />
          </span>
          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-accent">
            {memory.namespace}
          </span>
        </div>
        <span className="text-[11px] text-faint">{formatDate(memory.createdAt)}</span>
      </div>

      <p className="text-sm leading-relaxed text-fg">{memory.content}</p>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[11px] text-faint">
        <span>{memory.sourceAgent}</span>
        <span className="flex items-center gap-1 font-mono">
          <Icon icon={AnchorIcon} size={12} aria-hidden />
          walrus:{memory.walrusRef}
        </span>
      </div>
    </div>
  );
}
