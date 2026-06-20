import { Eyebrow } from "@/components/ui/Eyebrow";

const steps = [
  { t: "Teach", d: "Agent A captures facts into namespaces as you chat." },
  { t: "Gate", d: "A policy check runs before retrieval: agent × namespace." },
  { t: "Prove", d: "The answer renders with a receipt of what it used." },
  { t: "Anchor", d: "Store the receipt as a Walrus blob — verifiable from then on." },
];

function TrustCore() {
  return (
    <div className="group relative w-full max-w-md">
      <div className="relative rounded-2xl bg-gradient-to-br from-[#444] via-[#222] to-black p-px shadow-[0_60px_100px_-30px_black,inset_0_1px_2px_rgba(255,255,255,0.2)]">
        <div className="rounded-[15px] bg-[#0c0c0c] p-6 shadow-[inset_0_4px_40px_rgba(0,0,0,0.8)]">
          <div className="mb-6 flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 rounded-md border border-white/10 bg-black px-3 py-1.5 shadow-[0_4px_10px_black]">
              <span className="relative size-2">
                <span className="absolute inset-0 animate-pulse rounded-full bg-accent" />
                <span className="absolute inset-0 rounded-full bg-sky-400 blur-[4px]" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400">
                Carry.Gate_Active
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-700">
                Gate
              </span>
              <div className="relative h-5 w-10 rounded-full border border-white/5 bg-[#050505] p-1 shadow-inner">
                <span className="absolute right-1 top-1 size-3 animate-pulse rounded-full bg-gradient-to-t from-blue-600 to-sky-400 shadow-[0_0_10px_rgba(77,162,255,0.5)]" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border-[3px] border-black bg-[#020202] shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_0_80px_black]">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-2.5 font-mono text-[9px]">
              <span className="flex items-center gap-2 uppercase tracking-widest text-sky-300/50">
                <span className="animate-pulse text-accent">●</span>
                Live_gate_feed
              </span>
              <span className="text-white/20">
                policy: <span className="text-white/40">agent-b</span>
              </span>
            </div>
            <div className="flex flex-col gap-5 p-8 font-mono text-xs text-gray-500">
              <div className="flex items-center justify-between rounded-lg border border-accent/10 bg-accent/[0.03] p-4">
                <span className="tracking-tighter text-white/30">RETRIEVAL_GATE</span>
                <span className="animate-pulse rounded bg-accent/10 px-2 py-0.5 text-[10px] font-black text-accent">
                  ACTIVE
                </span>
              </div>
              <div className="space-y-3 border-l-2 border-accent/20 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-gray-600">Allowed</span>
                  <span className="text-[10px] text-white/80">diet, project</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-gray-600">Unauthorized reach</span>
                  <span className="text-[10px] font-bold text-accent">0.00%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-gray-700">
                  <span>Verification</span>
                  <span>WALRUS</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black">
                  <div className="h-full bg-gradient-to-r from-blue-950 via-blue-500 to-sky-400 shadow-[0_0_15px_rgba(77,162,255,0.4)] [animation:carry-progress-loop_8s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between px-1">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
              Carry Trust Core
            </span>
            <span className="font-mono text-[8px] uppercase tracking-tighter text-white/20">
              S/N: 2026-CRY
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-4 w-44 rounded-2xl bg-gradient-to-br from-[#888] via-[#222] to-[#111] p-px shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform duration-700 ease-out group-hover:-translate-y-4 group-hover:-translate-x-2">
        <div className="relative overflow-hidden rounded-[15px] border border-black/40 bg-[#0d0d0d] p-4 shadow-[inset_0_2px_20px_black]">
          <div className="absolute -right-6 -top-6 size-20 rounded-full bg-sky-600/10 blur-3xl" />
          <div className="flex items-center gap-3">
            <span className="relative size-3">
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-500 opacity-20" />
              <span className="absolute inset-0 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]" />
            </span>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-sky-400">
                Receipt verified
              </span>
              <span className="mt-1 font-mono text-[9px] text-white/30">
                blob:0x7d3e…ff90
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Vision() {
  return (
    <section
      id="how"
      className="mx-auto grid w-full max-w-7xl grid-cols-1 border-x border-t border-dashed border-white/20 bg-[#050505] lg:grid-cols-2"
    >
      <div className="flex min-h-[600px] flex-col justify-between border-b border-dashed border-white/20 p-8 md:p-12 lg:border-b-0 lg:border-r lg:p-20">
        <div className="mb-12">
          <Eyebrow number="03" className="mb-8">
            How it works
          </Eyebrow>
          <h2 className="mb-6 text-4xl font-light uppercase leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
            Memory you
            <br />
            can prove
          </h2>
          <p className="max-w-md text-base font-light leading-relaxed text-gray-400">
            No black boxes. The whole loop is built around one principle: enforce
            access before the model ever sees a thing.
          </p>
        </div>
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li
              key={step.t}
              className={`group flex items-center justify-between gap-6 border-t border-dashed border-white/20 py-6 ${index === steps.length - 1 ? "border-b" : ""}`}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-accent">0{index + 1}</span>
                <div>
                  <span className="text-lg font-medium tracking-tight text-white">
                    {step.t}
                  </span>
                  <p className="mt-1 text-sm text-gray-500">{step.d}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col bg-[#0a0a0a]">
        <div className="group relative flex flex-grow items-center justify-center overflow-hidden bg-gradient-to-br from-sky-400 to-blue-900 p-8 md:p-12 lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-[0.12] mix-blend-overlay"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]"
          />
          <div className="relative z-10">
            <TrustCore />
          </div>
        </div>
        <div className="relative border-t-4 border-[#0a0a0a] bg-[#050505] p-8 shadow-[inset_0_10px_30px_black] md:p-12 lg:p-16">
          <p className="border-l-2 border-accent/30 pl-6 text-lg font-light italic leading-relaxed text-gray-300 md:text-xl">
            “We believe AI memory should be owned, auditable, and provable by the
            people who actually live with it — not locked inside a model.”
          </p>
        </div>
      </div>
    </section>
  );
}
