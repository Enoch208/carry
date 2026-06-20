import { GradientButton, TextButton } from "@/components/ui/Buttons";
import { UnicornBackground } from "./UnicornBackground";

export function Hero() {
  return (
    <main
      id="top"
      className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center border-x border-dashed border-white/20 px-6 pt-16 pb-24 text-center md:pt-32 md:pb-32"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[840px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.05),transparent)] blur-3xl" />
        <UnicornBackground className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 z-[-1] h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-white/5 blur-[100px]"
        />
        <h1 className="mb-6 text-5xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl lg:text-[4.5rem]">
          The proof layer for AI memory
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl font-light leading-relaxed text-gray-400">
          Carry lets AI agents share memory across models — and gives users a
          verifiable receipt for every answer: what memory it used, whether it
          was allowed, and where it lives on Walrus.
        </p>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <GradientButton href="/chat-a">Launch the demo</GradientButton>
          <TextButton href="#how">See how it works</TextButton>
        </div>
      </div>
    </main>
  );
}
