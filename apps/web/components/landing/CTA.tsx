import { GradientButton, OutlineButton } from "@/components/ui/Buttons";

export function CTA() {
  return (
    <section
      id="cta"
      className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center overflow-hidden border-x border-t border-dashed border-white/20 bg-[#050505] px-6 py-32 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-1/2 w-3/4 -translate-x-1/2 rounded-t-full bg-white/5 blur-[120px]"
      />
      <h2 className="relative z-10 mb-6 text-4xl font-light tracking-tight text-white md:text-5xl lg:text-6xl">
        See memory you can prove
      </h2>
      <p className="relative z-10 mb-10 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
        Walk the live demo: teach an agent, switch models, revoke a namespace,
        and watch the receipt tell the truth.
      </p>
      <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row">
        <GradientButton href="/chat-a">Launch the demo</GradientButton>
        <OutlineButton href="https://github.com/Enoch208/carry" target="_blank" rel="noreferrer">
          View on GitHub
        </OutlineButton>
      </div>
    </section>
  );
}
