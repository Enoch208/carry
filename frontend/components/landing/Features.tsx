import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextButton } from "@/components/ui/Buttons";
import { cn } from "@/lib/cn";

function CardShell({
  glow,
  title,
  body,
  children,
}: {
  glow: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex aspect-square flex-col overflow-hidden bg-[#050505] p-8">
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:6px_6px] opacity-50 [animation:carry-grid-shimmer_6s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-20 -right-20 size-64 rounded-full blur-[80px] [animation:carry-ambient-drift_12s_ease-in-out_infinite]",
          glow
        )}
      />
      <div className="relative z-10 mb-6">
        <h3 className="mb-2 text-xl font-normal tracking-tight text-white">
          {title}
        </h3>
        <p className="text-sm font-light leading-relaxed text-gray-400">{body}</p>
      </div>
      <div className="relative z-10 flex w-full flex-1 flex-col">{children}</div>
    </div>
  );
}

const pill =
  "rounded-lg border border-white/10 bg-gradient-to-b from-[#222] to-[#111] px-3 py-1.5 text-xs text-gray-300 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] whitespace-nowrap";

const badge =
  "flex h-11 items-center gap-3 whitespace-nowrap rounded-2xl border border-white/10 bg-gradient-to-b from-[#2a2a2a] to-[#111] px-5 shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] [animation:carry-badge-glow_4s_ease-in-out_infinite]";

function Check() {
  return (
    <span className="grid size-4 place-items-center rounded-full border border-accent/30 bg-accent/15 text-accent">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function GateCard() {
  return (
    <CardShell
      glow="bg-blue-500/10"
      title="Gate before generation"
      body="Access is enforced at retrieval. The model only ever sees memory it is allowed to use — receipts are honest by construction."
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className={pill}>health</span>
          <span className={pill}>billing</span>
        </div>
        <div className="flex w-48 items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/40" />
          <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-accent shadow-[0_0_12px_rgba(77,162,255,0.25)]">
            gate
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/40" />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(pill, "flex items-center gap-2")}>
            diet <Check />
          </span>
          <span className={cn(pill, "flex items-center gap-2")}>
            project <Check />
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <span className={badge}>
          <span className="text-xs tracking-wide text-gray-300">Leaked to model</span>
          <span className="rounded-md border border-white/5 bg-black/40 px-2 py-0.5 text-xs font-semibold text-accent">
            0%
          </span>
        </span>
      </div>
    </CardShell>
  );
}

function AgentBox({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-gradient-to-br from-[#222] to-[#111] p-2.5 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
      <span className="whitespace-nowrap border-b border-white/10 pb-1 text-[9px] uppercase tracking-widest text-white/50">
        {name}
      </span>
      {["diet", "project"].map((label) => (
        <span
          key={label}
          className="flex items-center gap-1.5 rounded-md border border-black/50 bg-gradient-to-b from-[#1a1a1a] to-[#050505] px-2 py-1 text-[11px] text-gray-300 shadow-inner"
        >
          <span className="size-1.5 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />
          {label}
        </span>
      ))}
    </div>
  );
}

function CrossModelCard() {
  return (
    <CardShell
      glow="bg-sky-500/10"
      title="Cross-model memory"
      body="Teach one agent and recall from another — even on a different provider. Memory follows the user, not the vendor."
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#2a2a2a] to-[#111] text-sky-400 shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] [animation:carry-node-float_6s_ease-in-out_infinite]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14a9 3 0 0 0 18 0V5" />
            <path d="M3 12a9 3 0 0 0 18 0" />
          </svg>
        </div>
        <span className="h-3 w-px bg-white/15" />
        <div className="relative h-3 w-44">
          <span className="absolute left-7 right-7 top-0 h-px bg-white/15" />
          <span className="absolute left-7 top-0 h-3 w-px bg-white/15" />
          <span className="absolute right-7 top-0 h-3 w-px bg-white/15" />
        </div>
        <div className="flex justify-center gap-3">
          <AgentBox name="Agent A · GPT-4o" />
          <AgentBox name="Agent B · Claude" />
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <span className={badge}>
          <span className="text-xs tracking-wide text-gray-300">Vendor lock-in</span>
          <span className="rounded-md border border-white/5 bg-black/40 px-2 py-0.5 text-xs font-semibold text-sky-400">
            0%
          </span>
        </span>
      </div>
    </CardShell>
  );
}

const receipts = [
  { time: "14:41:59 UTC", agent: "agent-b · claude", ref: "0x7d3e…ff90", opacity: "" },
  { time: "14:35:12 UTC", agent: "agent-a · gpt-4o", ref: "0x41b8…0c3d", opacity: "opacity-70" },
  { time: "14:32:01 UTC", agent: "agent-a · gpt-4o", ref: "0x9f2c…a7e1", opacity: "opacity-40" },
];

function ReceiptsCard() {
  return (
    <CardShell
      glow="bg-emerald-500/10"
      title="Answer Receipts"
      body="Every memory-based answer carries a receipt — memories used, namespaces, source agent, and a Walrus reference, verified."
    >
      <div className="relative flex flex-1 flex-col justify-center gap-2">
        <span
          aria-hidden
          className="absolute left-[5px] top-3 bottom-3 w-px bg-gradient-to-b from-emerald-500/50 via-white/15 to-transparent"
        />
        {receipts.map((entry) => (
          <div key={entry.ref} className={cn("relative pl-5", entry.opacity)}>
            <span className="absolute left-0 top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-[#050505] bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-gradient-to-b from-[#222] to-[#111] p-2 shadow-[0_6px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/50">
                <span className="font-mono text-emerald-400/80">{entry.time}</span>
                <span>{entry.agent}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-200">Receipt anchored</span>
                <span className="rounded border border-white/5 bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-gray-400 shadow-inner">
                  {entry.ref}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <span className={badge}>
          <span className="grid size-4 place-items-center text-emerald-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="text-xs tracking-wide text-gray-300">Walrus-anchored</span>
        </span>
      </div>
    </CardShell>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="mx-auto flex w-full max-w-7xl flex-col border-x border-dashed border-white/20 bg-[#050505]"
    >
      <div className="grid grid-cols-1 items-start gap-16 border-t border-dashed border-white/20 px-6 py-24 md:px-12 lg:grid-cols-2 lg:gap-32">
        <div className="flex flex-col space-y-10">
          <Eyebrow number="01">Verifiable memory</Eyebrow>
          <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
            Engineered for
            <br />
            <span className="text-white/50">verifiable memory</span>
          </h2>
        </div>
        <div className="flex flex-col items-start lg:pt-24">
          <p className="mb-12 max-w-md text-lg font-light leading-relaxed text-gray-400">
            Carry is designed from the ground up so every answer can be traced to
            the exact memory it used — and proven against what it was never
            allowed to touch.
          </p>
          <div className="flex items-center gap-8">
            <TextButton href="#cta">Launch demo</TextButton>
            <a
              href="#proof"
              className="text-sm font-medium text-white/40 transition-colors hover:text-white/60"
            >
              See the receipt
            </a>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 divide-y divide-dashed divide-white/20 border-y border-dashed border-white/20 md:grid-cols-3 md:divide-x md:divide-y-0">
        <GateCard />
        <CrossModelCard />
        <ReceiptsCard />
      </div>
    </section>
  );
}
