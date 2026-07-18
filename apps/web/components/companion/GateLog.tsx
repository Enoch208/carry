"use client";

import { cn } from "@/lib/cn";

export type LogTone = "req" | "ok" | "blocked" | "muted";
export type LogLine = { id: string; text: string; tone: LogTone };

const TONE: Record<LogTone, string> = {
  req: "text-accent",
  ok: "text-success",
  blocked: "text-danger",
  muted: "text-faint",
};

export function GateLog({ lines }: { lines: LogLine[] }) {
  return (
    <div className="flex flex-col gap-1 font-mono text-[11px] leading-relaxed">
      {lines.length === 0 ? (
        <p className="text-faint">
          <span className="text-success">●</span> gate idle — waiting for a recall
        </p>
      ) : (
        lines.map((l) => (
          <p key={l.id} className={cn("animate-[carry-log-in_240ms_ease-out]", TONE[l.tone])}>
            {l.text}
          </p>
        ))
      )}
    </div>
  );
}
