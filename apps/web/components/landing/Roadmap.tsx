import { Eyebrow } from "@/components/ui/Eyebrow";
import { GradientButton, OutlineButton } from "@/components/ui/Buttons";
import { Icon, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const tiers = [
  {
    phase: "Now",
    title: "Live today",
    desc: "Working end-to-end in the demo.",
    highlight: false,
    badge: null as string | null,
    features: [
      "Gate before generation",
      "Answer Receipts under every answer",
      "Walrus-anchored receipts",
      "Cross-model: GPT-4o ↔ Claude",
    ],
    cta: { kind: "outline" as const, label: "Launch the demo", href: "#cta" },
  },
  {
    phase: "Next",
    title: "On the roadmap",
    desc: "In active progress.",
    highlight: true,
    badge: "In progress",
    features: [
      "Seal per-agent enforcement",
      "Receipts anchored by default",
      "Full audit log",
      "Live policy editor",
    ],
    cta: { kind: "gradient" as const, label: "Follow along", href: "https://github.com/Enoch208/carry" },
  },
  {
    phase: "Vision",
    title: "Where it goes",
    desc: "The long-term frontier.",
    highlight: false,
    badge: null,
    features: [
      "Multi-agent coordination",
      "Drop-in SDK / adapter",
      "Mainnet deployment",
      "User-owned memory",
    ],
    cta: { kind: "outline" as const, label: "Read the vision", href: "#how" },
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="mx-auto w-full max-w-7xl border-x border-t border-dashed border-white/20 bg-[#050505]">
      <div className="border-b border-dashed border-white/20 px-6 py-24 md:px-12">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2 lg:gap-32">
          <div className="flex flex-col space-y-10">
            <Eyebrow number="06">Roadmap</Eyebrow>
            <h2 className="text-4xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
              From proof to
              <br />
              <span className="text-white/50">platform</span>
            </h2>
          </div>
          <div className="lg:pt-24">
            <p className="max-w-md text-lg font-light leading-relaxed text-gray-400">
              We are precise about what is live today versus what is on the
              roadmap. Here is exactly where Carry is headed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {tiers.map((tier, index) => (
          <div
            key={tier.phase}
            className={cn(
              "group relative flex flex-col overflow-hidden border-dashed border-white/20 p-8 md:p-12",
              index < 2 && "border-b lg:border-b-0 lg:border-r",
              tier.highlight && "bg-white/[0.02]"
            )}
          >
            <div
              aria-hidden
              className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:6px_6px] opacity-50"
            />
            <div
              aria-hidden
              className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 shadow-[0_0_15px_rgba(77,162,255,0.6)] transition-opacity duration-700 group-hover:opacity-100"
            />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                  {tier.phase}
                </span>
                {tier.badge && (
                  <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
                    {tier.badge}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-normal tracking-tight text-white">
                {tier.title}
              </h3>
              <p className="mb-8 mt-2 text-sm text-gray-400">{tier.desc}</p>

              {tier.cta.kind === "gradient" ? (
                <GradientButton href={tier.cta.href} size="sm" className="w-full">
                  {tier.cta.label}
                </GradientButton>
              ) : (
                <OutlineButton href={tier.cta.href} className="w-full justify-center py-4">
                  {tier.cta.label}
                </OutlineButton>
              )}

              <ul className="mt-8 flex flex-col gap-4">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <Icon
                      icon={CheckIcon}
                      size={18}
                      className={cn(
                        "mt-0.5 shrink-0",
                        tier.highlight ? "text-accent" : "text-white/40"
                      )}
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
