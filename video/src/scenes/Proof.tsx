import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, MONO, T } from "../theme";
import { Check, Cross, Eyebrow } from "../bits";

const REVOKE = T.proof.revokeAt - T.proof.from; // local frame of the flip

const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const outA = interpolate(frame, [REVOKE - 8, REVOKE + 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inB = interpolate(frame, [REVOKE + 2, REVOKE + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const inA = interpolate(frame, [4, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", height: 92, width: "100%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          opacity: outA * inA,
          transform: `translateY(${(1 - inA) * 22 + (1 - outA) * -18}px)`,
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em", color: C.fg }}>
          Every answer carries its <span style={{ color: C.accent }}>proof.</span>
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          opacity: inB,
          transform: `translateY(${(1 - inB) * 22}px)`,
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em", color: C.fg }}>
          Revoked? <span style={{ color: C.danger }}>Never fetched.</span>
        </span>
      </div>
    </div>
  );
};

const Toggle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [REVOKE, REVOKE + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const track = interpolateColors(t, [0, 1], [C.accent, "rgba(248,113,113,0.75)"]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontFamily: MONO, fontSize: 21, color: t > 0.5 ? C.danger : C.accent }}>health</span>
      <div style={{ position: "relative", width: 74, height: 40, borderRadius: 999, backgroundColor: track }}>
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4 + (1 - t) * 34,
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: "#fff",
          }}
        />
      </div>
    </div>
  );
};

const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const popIn = spring({ frame: frame - 96, fps, config: { damping: 200, stiffness: 160 } });
  const swap = interpolate(frame, [REVOKE + 2, REVOKE + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pill = (label: string, color: string, icon: React.ReactNode, opacity: number, scale: number) => (
    <div
      style={{
        position: "absolute",
        right: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `1.5px solid ${color}`,
        borderRadius: 999,
        padding: "10px 22px",
        color,
        fontSize: 22,
        fontWeight: 700,
        opacity,
        transform: `scale(${scale})`,
        whiteSpace: "nowrap",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      {icon}
      {label}
    </div>
  );
  return (
    <div style={{ position: "relative", width: 340, height: 52 }}>
      {pill("Verified on Walrus", C.success, <Check size={22} />, popIn * (1 - swap), 0.92 + popIn * 0.08)}
      {pill("Blocked before retrieval", C.danger, <Cross size={22} />, swap, 0.94 + swap * 0.06)}
    </div>
  );
};

const MemoryRow: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const swap = interpolate(frame, [REVOKE + 4, REVOKE + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rowBg = interpolateColors(swap, [0, 1], ["rgba(255,255,255,0.03)", "rgba(248,113,113,0.07)"]);
  const rowBorder = interpolateColors(swap, [0, 1], ["rgba(255,255,255,0.10)", "rgba(248,113,113,0.45)"]);
  return (
    <div
      style={{
        border: `1.5px solid ${rowBorder}`,
        borderRadius: 16,
        backgroundColor: rowBg,
        padding: "26px 30px",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 18}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 21,
              color: swap > 0.5 ? C.danger : C.accent,
              backgroundColor: "rgba(255,255,255,0.05)",
              padding: "6px 16px",
              borderRadius: 10,
            }}
          >
            health
          </span>
          <span style={{ fontSize: 27, color: C.fg, fontWeight: 500 }}>Allergic to penicillin</span>
        </div>
        <div style={{ position: "relative", width: 420, height: 34 }}>
          <div
            style={{
              position: "absolute",
              right: 0,
              display: "flex",
              alignItems: "center",
              gap: 22,
              opacity: 1 - swap,
              color: C.success,
              fontSize: 22,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={20} /> authorized
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={20} /> verified
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: swap,
              color: C.danger,
              fontSize: 22,
            }}
          >
            <Cross size={20} /> never fetched
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: MONO,
          fontSize: 19,
          color: C.faint,
          opacity: interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        walrus:oHJRrapc1dfU…XSylVs&nbsp;&nbsp;·&nbsp;&nbsp;sui:carry::access
      </div>
    </div>
  );
};

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardIn = spring({ frame: frame - 10, fps, config: { damping: 200, stiffness: 110 } });
  const exit = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const glowPulse = interpolate(frame, [REVOKE, REVOKE + 10, REVOKE + 34], [0, 0.55, 0.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardBorder = interpolateColors(
    interpolate(frame, [REVOKE + 2, REVOKE + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    [0, 1],
    ["rgba(255,255,255,0.14)", "rgba(248,113,113,0.5)"]
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - exit }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
          transform: `translateY(${exit * 30}px) scale(${1 - exit * 0.03})`,
          width: 1180,
        }}
      >
        <Headline />
        <div
          style={{
            width: "100%",
            borderRadius: 22,
            border: `1.5px solid ${cardBorder}`,
            backgroundColor: C.surface,
            boxShadow: `0 0 90px ${glowPulse > 0 ? `rgba(248,113,113,${glowPulse * 0.45})` : "transparent"}, 0 30px 80px rgba(0,0,0,0.6)`,
            opacity: cardIn,
            transform: `translateY(${(1 - cardIn) * 64}px)`,
            padding: "34px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 26,
              borderBottom: `1px solid ${C.borderFaint}`,
              marginBottom: 26,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <Eyebrow color={C.muted}>Answer receipt</Eyebrow>
              <Toggle />
            </div>
            <Badge />
          </div>
          <MemoryRow />
        </div>
      </div>
    </AbsoluteFill>
  );
};
