import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C } from "../theme";
import { Eyebrow } from "../bits";

const WORDS = ["Your", "AI", "remembers", "everything."];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exit = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const eyebrowIn = interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - exit,
        transform: `translateY(${exit * -46}px)`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 42 }}>
        <Eyebrow opacity={eyebrowIn}>01 · The problem</Eyebrow>
        <div style={{ display: "flex", gap: 26 }}>
          {WORDS.map((w, i) => {
            const s = spring({ frame: frame - 6 - i * 5, fps, config: { damping: 200, stiffness: 120 } });
            return (
              <span
                key={w}
                style={{
                  fontSize: 108,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: i === 3 ? C.accent : C.fg,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 34}px)`,
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
