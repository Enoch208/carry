import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, MONO } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markIn = spring({ frame: frame - 4, fps, config: { damping: 200, stiffness: 100 } });
  const wordIn = interpolate(frame, [16, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const tagIn = interpolate(frame, [46, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const urlIn = interpolate(frame, [66, 82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame, [4, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 42% 34% at 50% 44%, rgba(77,162,255,${0.2 * glow}), transparent 70%)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 38 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Img
            src={staticFile("carry_mark.png")}
            style={{
              height: 128,
              opacity: markIn,
              transform: `scale(${0.92 + markIn * 0.08})`,
            }}
          />
          <span
            style={{
              fontSize: 132,
              fontWeight: 900,
              color: C.fg,
              letterSpacing: `${0.34 - wordIn * 0.2}em`,
              opacity: wordIn,
            }}
          >
            ARRY
          </span>
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 500,
            color: C.muted,
            opacity: tagIn,
            transform: `translateY(${(1 - tagIn) * 16}px)`,
          }}
        >
          Memory you can <span style={{ color: C.accent, fontWeight: 700 }}>prove.</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 25, letterSpacing: "0.14em", color: C.faint, opacity: urlIn }}>
          usecarry.xyz&nbsp;&nbsp;·&nbsp;&nbsp;built on Sui × Walrus
        </div>
      </div>
    </AbsoluteFill>
  );
};
