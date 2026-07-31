import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "./theme";

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 450], [0, -28]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.borderFaint} 1px, transparent 1px), linear-gradient(90deg, ${C.borderFaint} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          transform: `translateY(${drift}px)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${C.accentGlow}, transparent 70%)`,
          opacity: 0.55,
        }}
      />
      {children}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />
    </AbsoluteFill>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; opacity?: number; color?: string }> = ({
  children,
  opacity = 1,
  color = C.faint,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: "0.32em",
      textTransform: "uppercase",
      color,
      opacity,
    }}
  >
    {children}
  </div>
);

export const Check: React.FC<{ color?: string; size?: number }> = ({ color = C.success, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
    <path d="M8 12.5L10.5 15L16 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Cross: React.FC<{ color?: string; size?: number }> = ({ color = C.danger, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
    <path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
