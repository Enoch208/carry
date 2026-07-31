export const C = {
  bg: "#050505",
  surface: "#0c0c0c",
  elevated: "#18181b",
  border: "rgba(255,255,255,0.12)",
  borderFaint: "rgba(255,255,255,0.07)",
  fg: "#FAFAFA",
  muted: "#A1A1AA",
  faint: "#71717A",
  accent: "#4DA2FF",
  accentGlow: "rgba(77,162,255,0.16)",
  success: "#34D399",
  danger: "#F87171",
  dangerGlow: "rgba(248,113,113,0.14)",
};

export const FONT = "Satoshi, -apple-system, BlinkMacSystemFont, sans-serif";
export const MONO = "'SF Mono', 'Geist Mono', Menlo, monospace";

// ── global timeline (30 fps · 450 frames · 15 s) ────────────────────────────
export const T = {
  fps: 30,
  total: 450,
  hook: { from: 0, to: 84 },
  proof: { from: 84, to: 345, revokeAt: 252 },
  outro: { from: 345, to: 450 },
  audio: { vo1: 6, whoosh: 82, vo2: 92, vo3: 228, lock: 252, vo4: 366 },
};
