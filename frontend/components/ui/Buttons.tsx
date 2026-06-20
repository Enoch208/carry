import { cn } from "@/lib/cn";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  size?: "sm" | "lg";
};

export function GradientButton({
  href,
  children,
  className,
  target,
  rel,
  onClick,
  size = "lg",
}: ButtonProps) {
  const pad =
    size === "sm"
      ? "px-7 py-3 text-[11px] tracking-[0.15em]"
      : "px-10 py-4 text-sm tracking-[0.2em]";
  const classes = cn(
    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-none bg-transparent font-bold uppercase text-white transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]",
    pad,
    className
  );
  const content = (
    <>
      <span className="absolute inset-0 rounded-none bg-gradient-to-r from-blue-900 via-blue-500 to-sky-400 p-px shadow-[0_0_20px_-5px_rgba(77,162,255,0.5)] transition-shadow duration-500 group-hover:shadow-[0_0_35px_-5px_rgba(77,162,255,0.85)]">
        <span className="block size-full rounded-none bg-gradient-to-b from-blue-950 to-black backdrop-blur-xl" />
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 -right-4 size-24 -translate-y-1/2 bg-blue-600/20 blur-3xl transition-all duration-700 group-hover:bg-blue-500/40"
      />
      <span className="relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} target={target} rel={rel} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
}

export function OutlineButton({
  href,
  children,
  className,
  target,
  rel,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border border-white/20 bg-white/5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-white/15",
    className
  );
  if (href) {
    return (
      <a href={href} className={classes} target={target} rel={rel} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

export function TextButton({ href, children, className }: ButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-white/70",
        className
      )}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover:translate-x-1"
        aria-hidden
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </a>
  );
}
