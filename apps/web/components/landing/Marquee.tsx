const defaultItems = [
  "Gate before generation",
  "Verifiable receipts",
  "Cross-model memory",
  "Walrus-anchored",
  "User-owned",
  "Honest by construction",
];

export function Marquee({ items = defaultItems }: { items?: string[] }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden border-x border-t border-dashed border-white/20 bg-[#050505]/50 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050505] via-[#050505]/70 to-transparent"
      />
      <div className="flex w-max animate-marquee whitespace-nowrap text-sm text-white/40">
        {[0, 1].map((dup) => (
          <div key={dup} aria-hidden={dup === 1} className="flex items-center">
            {items.map((item) => (
              <span key={item} className="flex items-center">
                <span className="mx-6">{item}</span>
                <span className="opacity-40">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
