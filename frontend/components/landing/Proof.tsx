import { ReceiptCard } from "./ReceiptCard";
import { Icon, ReceiptIcon } from "@/components/icons";

export function Proof() {
  return (
    <section
      id="proof"
      className="mx-auto grid w-full max-w-7xl grid-cols-1 border-x border-t border-dashed border-white/20 bg-[#050505] lg:grid-cols-2"
    >
      <div className="relative flex flex-col justify-center border-b border-dashed border-white/20 p-8 md:p-12 lg:border-b-0 lg:border-r lg:p-16 xl:p-20">
        <div
          aria-hidden
          className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-white/10 to-transparent opacity-50"
        />
        <span className="mb-8 inline-flex w-fit items-center gap-2 rounded-none border border-white/20 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-gray-300">
          <Icon icon={ReceiptIcon} size={15} aria-hidden />
          The Answer Receipt
        </span>
        <h3 className="mb-5 text-3xl font-normal leading-tight tracking-tight text-white md:text-4xl">
          Every answer carries
          <br className="hidden xl:block" /> its proof.
        </h3>
        <p className="max-w-md text-base leading-relaxed text-gray-400">
          Stop trusting that an agent used the right memory. Carry renders a
          structured receipt under every answer — the memories it used, and the
          namespaces it was never allowed to touch.
        </p>
      </div>

      <div className="group relative flex items-center justify-center overflow-hidden bg-[#0c0c0c] p-8 md:p-12 lg:p-16 xl:p-20">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-900"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-[0.12] mix-blend-overlay"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_55%)]"
        />
        <div className="relative z-10 w-full max-w-md transition-transform duration-700 ease-out group-hover:-translate-y-2">
          <ReceiptCard />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 left-1/2 h-20 w-3/4 -translate-x-1/2 bg-blue-500/20 blur-[100px]"
        />
      </div>
    </section>
  );
}
