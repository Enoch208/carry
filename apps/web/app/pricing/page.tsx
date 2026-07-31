import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon, CheckIcon, BlockedIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Pricing",
  description: "Proof-carrying memory for AI agents. Priced by what it protects.",
};

type Tier = {
  name: string;
  price: string;
  cadence?: string;
  who: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Open source",
    price: "Free",
    who: "Solo developers and self-hosters",
    features: [
      "CLI and MCP server, unlimited local memory",
      "The gate, Answer Receipts and the walletless verifier",
      "Anchor to Sui yourself — you pay the gas",
      "Bring your own Walrus storage",
    ],
    cta: "npm i -g @usecarry/cli",
    href: "https://www.npmjs.com/package/@usecarry/cli",
  },
  {
    name: "Developer",
    price: "$29",
    cadence: "/month",
    who: "One product, one team, real users",
    features: [
      "Hosted vault and receipt API — no keys to run",
      "10,000 protected recalls and 1,000 anchored receipts",
      "Walrus storage and gas included",
      "Receipt history and audit export",
    ],
    cta: "Start building",
    href: "/companion",
    featured: true,
  },
  {
    name: "Team",
    price: "$199",
    cadence: "/month",
    who: "Several agents under one policy",
    features: [
      "Organizations, multiple agents, shared namespaces",
      "100,000 recalls and 25,000 receipts",
      "Webhooks when a retrieval is refused",
      "SSO and role-based policy administration",
    ],
    cta: "Talk to us",
    href: "mailto:hello@usecarry.xyz?subject=Carry%20Team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    who: "Regulated agents and private deployments",
    features: [
      "Private deployment or your own Sui and Walrus",
      "Compliance retention and legal-hold exports",
      "Sealed receipts — prove without revealing",
      "Security review support and an SLA",
    ],
    cta: "Talk to us",
    href: "mailto:hello@usecarry.xyz?subject=Carry%20Enterprise",
  },
];

const METERS = [
  ["Protected recalls", "every answer the gate runs before the model sees memory"],
  ["Anchored receipts", "proofs written to Sui — the on-chain cost is real and passed through"],
  ["Encrypted storage", "Walrus bytes held on your behalf, priced per GB-month"],
  ["Active agents", "distinct agent identities under policy"],
  ["Audit retention", "how long receipt history stays queryable"],
];

const STATE: [string, boolean, string][] = [
  ["The retrieval gate, default-deny", true, "enforced on Sui mainnet"],
  ["Answer Receipts and the walletless verifier", true, "four checks, live"],
  ["Portable vault and recovery", true, "rebuilds from Sui and Walrus alone"],
  ["CLI, MCP server and AI SDK adapter", true, "published on npm"],
  ["Hosted vault and receipt API", false, "designed, not yet shipped"],
  ["Organizations, SSO and webhooks", false, "designed, not yet shipped"],
  ["Sealed receipts (prove without revealing)", false, "in progress"],
  ["Metered billing", false, "not yet shipped"],
];

function TierCard({ t }: { t: Tier }) {
  return (
    <div
      className={`flex flex-col rounded-card border p-5 ${
        t.featured ? "border-accent/50 bg-accent/[0.04]" : "border-border bg-surface"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-faint">{t.name}</p>
      <p className="mt-2 font-sans text-3xl font-light tracking-tight text-fg">
        {t.price}
        {t.cadence ? <span className="text-[13px] text-faint">{t.cadence}</span> : null}
      </p>
      <p className="mt-1 text-[12px] text-muted">{t.who}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {t.features.map((f) => (
          <li key={f} className="flex gap-2 text-[13px] text-muted">
            <Icon icon={CheckIcon} size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={t.href}
        className={`mt-5 rounded-lg px-4 py-2 text-center text-[13px] font-medium transition-colors ${
          t.featured
            ? "bg-accent text-[#050505] hover:bg-accent-hover"
            : "border border-border text-fg hover:border-border-strong"
        }`}
      >
        {t.cta}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-[#050505] px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-10 flex items-center gap-3">
          <Image src="/carry_mark.png" alt="" width={594} height={662} className="h-5 w-auto" />
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Pricing</h1>
            <p className="text-[12px] text-faint">proof-carrying memory, priced by what it protects</p>
          </div>
          <Link href="/companion" className="text-[12px] text-faint transition-colors hover:text-accent">
            Carry ↗
          </Link>
        </header>

        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <TierCard key={t.name} t={t} />
          ))}
        </div>

        <p className="mb-10 text-center text-[12px] text-faint">
          The protocol is MIT-licensed and always will be. What is paid for is running it for you — keys, gas,
          storage and audit history.
        </p>

        <div className="mb-10 rounded-card border border-border bg-surface p-5">
          <h2 className="mb-1 text-sm font-semibold text-fg">What usage means</h2>
          <p className="mb-4 text-[12px] text-muted">
            Anchoring a proof costs roughly 0.005 SUI on mainnet, and a receipt blob costs about 0.3 WAL to store
            for two years. Those are real costs we pay per proof, so metering follows them rather than seat count.
          </p>
          {METERS.map(([k, v]) => (
            <div key={k} className="flex items-start gap-4 border-t border-border py-2.5 text-[13px]">
              <span className="w-44 shrink-0 text-fg">{k}</span>
              <span className="text-muted">{v}</span>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-1 text-sm font-semibold text-fg">What is actually built today</h2>
          <p className="mb-4 text-[12px] text-muted">
            Carry is a hackathon project becoming a product. Everything below is stated as it is — the paid tiers
            describe where this is going, and the ticks are what you can use and verify right now.
          </p>
          {STATE.map(([label, done, note]) => (
            <div key={label} className="flex items-start gap-3 border-t border-border py-2.5 text-[13px]">
              <Icon
                icon={done ? CheckIcon : BlockedIcon}
                size={15}
                className={`mt-0.5 shrink-0 ${done ? "text-success" : "text-faint"}`}
                aria-hidden
              />
              <span className={done ? "text-fg" : "text-faint"}>{label}</span>
              <span className="ml-auto text-right text-[12px] text-faint">{note}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">
          Every claim on this page is checkable — see{" "}
          <Link href="/metrics" className="text-accent underline decoration-dotted">
            live metrics
          </Link>{" "}
          and{" "}
          <Link href="/vault?network=mainnet" className="text-accent underline decoration-dotted">
            vault recovery
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
