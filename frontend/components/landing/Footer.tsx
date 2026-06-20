import Image from "next/image";
import { Icon, ArrowRightIcon } from "@/components/icons";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "The receipt", href: "#proof" },
      { label: "Features", href: "#features" },
      { label: "Launch demo", href: "#cta" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "GitHub", href: "https://github.com" },
      { label: "Walrus", href: "https://www.walrus.xyz" },
      { label: "Seal", href: "#" },
      { label: "MemWal", href: "#" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Sui Overflow", href: "https://sui.io" },
      { label: "Roadmap", href: "#" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#" },
    ],
  },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <a
        href={href}
        className="group/link flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <span className="font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover/link:opacity-100">
          &#10095;
        </span>
        {label}
      </a>
    </li>
  );
}

export function Footer() {
  return (
    <footer className="flex w-full flex-col border-t border-dashed border-white/20 bg-[#050505] text-white">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col overflow-hidden border-x border-dashed border-white/20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:12px_12px] opacity-40"
        />

        <div className="relative z-10 flex flex-col divide-y divide-dashed divide-white/20 border-b border-dashed border-white/20 lg:flex-row lg:divide-x lg:divide-y-0">
          <div className="group relative flex min-h-[400px] flex-col justify-between p-8 md:p-12 lg:w-2/5 lg:p-16">
            <div className="relative z-10 mb-12">
              <div className="mb-6 flex items-center gap-2.5">
                <Image
                  src="/carry_logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md ring-1 ring-white/15"
                />
                <span className="flex items-baseline text-xl tracking-tight text-white">
                  <span className="font-black">C</span>
                  <span className="font-thin">arry</span>
                  <span className="ml-1.5 size-1.5 bg-accent shadow-[0_0_8px_rgba(77,162,255,0.8)]" />
                </span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-gray-400">
                The proof layer for AI memory. Control what every agent can use —
                and prove it on every answer.
              </p>
            </div>
            <a
              href="#cta"
              className="inline-flex w-fit items-center gap-3 border border-white/20 bg-white/[0.03] px-6 py-3 text-sm font-medium tracking-wide backdrop-blur-md transition-colors hover:border-accent/50 hover:bg-accent/10"
            >
              <span className="font-mono text-[10px] uppercase text-accent">
                Launch //
              </span>
              Open the demo
              <Icon icon={ArrowRightIcon} size={16} aria-hidden />
            </a>
          </div>

          <div className="grid grid-cols-2 divide-x divide-dashed divide-white/20 md:grid-cols-3 lg:w-3/5">
            {columns.map((column, index) => (
              <div
                key={column.title}
                className={cnFooterCol(index)}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {column.title}
                </span>
                <ul className="flex flex-col gap-4">
                  {column.links.map((link) => (
                    <FooterLink key={link.label} {...link} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex w-full items-center justify-center overflow-hidden border-b border-dashed border-white/20 px-4 pt-32 pb-16 md:pt-44 md:pb-24">
          <div
            aria-hidden
            className="flex select-none items-center justify-center leading-[0.7]"
          >
            <Image
              src="/carry_mark.png"
              alt=""
              width={594}
              height={662}
              className="h-[14.5vw] w-auto lg:h-[138px] xl:h-[158px] [mask-image:linear-gradient(to_bottom,#000,rgba(0,0,0,0.85)_50%,rgba(0,0,0,0.1))] [-webkit-mask-image:linear-gradient(to_bottom,#000,rgba(0,0,0,0.85)_50%,rgba(0,0,0,0.1))]"
            />
            <span className="ml-[1.6vw] bg-gradient-to-b from-white via-white/85 to-white/10 bg-clip-text text-[20vw] font-black tracking-[0.05em] text-transparent mix-blend-screen lg:ml-5 lg:text-[180px] xl:ml-7 xl:text-[210px]">
              ARRY
            </span>
          </div>
        </div>

        <div className="relative z-20 flex flex-col items-center justify-between gap-4 px-8 py-6 font-mono text-[10px] uppercase tracking-widest text-gray-500 md:flex-row md:px-12 lg:px-16">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute size-full animate-ping bg-accent opacity-70" />
              <span className="relative size-1.5 bg-accent shadow-[0_0_8px_rgba(77,162,255,0.8)]" />
            </span>
            Built for Sui Overflow 2026
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms
            </a>
            <span>© 2026 Carry</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function cnFooterCol(index: number) {
  return [
    "flex flex-col gap-6 p-8 md:p-12",
    index === 2 ? "col-span-2 border-t border-dashed border-white/20 md:col-span-1 md:border-t-0" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
