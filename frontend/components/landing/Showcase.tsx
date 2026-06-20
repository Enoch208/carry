import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon, BlockedIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const tiles = [
  {
    n: "01",
    dots: 3,
    title: "Live revoke",
    body: "Flip an agent’s namespace off and it truly loses access — the gate returns nothing.",
    className: "border-b md:border-r",
  },
  {
    n: "02",
    dots: 2,
    title: "Access matrix",
    body: "A simple agent × namespace grid that controls what every agent can touch.",
    className: "border-b",
  },
  {
    n: "03",
    dots: 2,
    title: "Walrus-anchored",
    body: "Receipts resolve and verify against Walrus blobs. Tamper-evident provenance.",
    className: "border-b md:border-b-0 md:border-r",
  },
  {
    n: "04",
    dots: 3,
    title: "User-owned",
    body: "Memory belongs to the user, not the model. Portable, auditable, revocable.",
    className: "",
  },
];

function ChatMock() {
  return (
    <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-[#444] via-[#222] to-black p-px shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
      <div className="rounded-[15px] bg-[#0c0c0c] p-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_rgba(77,162,255,0.8)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Agent B · Claude
          </span>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-accent/15 px-3 py-2 text-xs text-white">
            Am I allergic to anything?
          </div>
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-gray-300">
            I cannot access your Health memory — it was revoked.
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/[0.07] px-3 py-2 text-[11px] text-gray-300">
            <Icon icon={BlockedIcon} size={14} className="text-danger" aria-hidden />
            <span className="font-mono">health</span> blocked by policy
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  n,
  dots,
  title,
  body,
  className,
}: {
  n: string;
  dots: number;
  title: string;
  body: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex min-h-[280px] flex-col justify-between overflow-hidden border-dashed border-white/20 p-8 transition-colors hover:bg-white/[0.03]",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:6px_6px] opacity-50"
      />
      <div className="relative z-10 flex items-start justify-between">
        <span className="font-mono text-xs text-accent/80">{n}/</span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "size-1 rounded-full",
                i < dots
                  ? "bg-accent shadow-[0_0_5px_rgba(77,162,255,0.8)]"
                  : "bg-white/20"
              )}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10 space-y-4">
        <h3 className="text-lg font-bold uppercase tracking-tight text-white">
          {title}
        </h3>
        <p className="font-mono text-xs uppercase leading-relaxed tracking-wide text-gray-400">
          {body}
        </p>
      </div>
      <span
        aria-hidden
        className="absolute -bottom-1.5 -right-1.5 z-20 font-mono text-xs text-white/20"
      >
        +
      </span>
    </div>
  );
}

export function Showcase() {
  return (
    <section className="relative mx-auto w-full max-w-7xl border-x border-t border-dashed border-white/20 bg-[#050505]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col border-b border-dashed border-white/20 lg:border-b-0 lg:border-r">
          <div className="relative flex min-h-[260px] flex-col justify-between border-b border-dashed border-white/20 p-8 md:p-12">
            <Eyebrow number="05">The product</Eyebrow>
            <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
              What you can
              <br />
              <span className="text-white/50">verify</span>
            </h2>
            <span
              aria-hidden
              className="absolute -bottom-1.5 -right-1.5 hidden font-mono text-xs text-white/20 lg:block"
            >
              +
            </span>
          </div>
          <div className="relative flex min-h-[560px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-sky-400 to-blue-900 p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-[0.12] mix-blend-overlay"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]"
            />
            <div className="relative z-10">
              <ChatMock />
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="relative flex min-h-[260px] items-end border-b border-dashed border-white/20 bg-white/[0.01] p-8 md:p-12">
            <p className="max-w-md font-mono text-sm uppercase leading-relaxed tracking-wide text-gray-400 md:text-base">
              A verifiable memory layer: gate-before-generation, answer receipts,
              and Walrus-anchored provenance for cross-model AI agents.
            </p>
            <span
              aria-hidden
              className="absolute -bottom-1.5 -left-1.5 hidden font-mono text-xs text-white/20 lg:block"
            >
              +
            </span>
          </div>
          <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
            {tiles.map((tile) => (
              <Tile key={tile.n} {...tile} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
