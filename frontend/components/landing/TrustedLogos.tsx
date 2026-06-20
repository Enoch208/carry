function SuiMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M17.636 10.009a7.16 7.16 0 0 1 1.565 4.474 7.2 7.2 0 0 1-1.608 4.53l-.087.106-.023-.135a7 7 0 0 0-.07-.349c-.502-2.21-2.142-4.106-4.84-5.642-1.823-1.034-2.866-2.278-3.14-3.693-.177-.915-.046-1.834.209-2.62.254-.787.631-1.446.953-1.843l1.05-1.284a.46.46 0 0 1 .713 0l5.28 6.456zm1.66-1.283L12.26.123a.336.336 0 0 0-.52 0L4.704 8.726l-.023.029a9.33 9.33 0 0 0-2.07 5.872C2.612 19.803 6.816 24 12 24s9.388-4.197 9.388-9.373a9.32 9.32 0 0 0-2.07-5.871zM6.389 9.981l.63-.77.018.142q.023.17.055.34c.408 2.136 1.862 3.917 4.294 5.297 2.114 1.203 3.345 2.586 3.7 4.103a5.3 5.3 0 0 1 .109 1.801l-.004.034-.03.014A7.2 7.2 0 0 1 12 21.67c-3.976 0-7.2-3.218-7.2-7.188 0-1.705.594-3.27 1.587-4.503z" />
    </svg>
  );
}

const stack = [
  { name: "Sui", mark: true },
  { name: "Walrus", mark: false },
  { name: "Seal", mark: false },
  { name: "Mysten Labs", mark: false },
  { name: "MemWal", mark: false },
];

export function TrustedLogos() {
  return (
    <section className="mx-auto w-full max-w-7xl border-x border-t border-dashed border-white/20 bg-[#050505]/50">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 px-6 py-8 md:justify-between md:px-12">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/40">
          Built on
        </span>
        {stack.map((item) => (
          <span
            key={item.name}
            className="flex items-center gap-2 text-white/55 transition-colors duration-300 hover:text-white"
          >
            {item.mark && <SuiMark />}
            <span className="text-lg font-semibold tracking-tight">
              {item.name}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
