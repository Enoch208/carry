import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, MONO } from "../theme";
import { Stage, Eyebrow } from "../bits";

export const LAUNCH = {
  total: 310,
  s1: { from: 0, to: 60 },
  s2: { from: 60, to: 144 },
  s3: { from: 144, to: 240 },
  s4: { from: 240, to: 310 },
  audio: { lv1: 6, lv2: 66, lv3: 148, lv4: 252 },
};

const Exit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - exit,
        transform: `translateY(${exit * -36}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame: frame - 2, fps, config: { damping: 200, stiffness: 130 } });
  const text = spring({ frame: frame - 10, fps, config: { damping: 200, stiffness: 120 } });
  return (
    <Exit>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <Img
          src={staticFile("carry_mark.png")}
          style={{ height: 120, opacity: mark, transform: `scale(${0.9 + mark * 0.1})` }}
        />
        <span
          style={{
            fontSize: 112,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: C.fg,
            opacity: text,
            transform: `translateY(${(1 - text) * 30}px)`,
          }}
        >
          Carry is <span style={{ color: C.accent }}>live.</span>
        </span>
      </div>
    </Exit>
  );
};

const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 4, fps, config: { damping: 200, stiffness: 120 } });
  const pill = spring({ frame: frame - 20, fps, config: { damping: 200, stiffness: 130 } });
  return (
    <Exit>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 52 }}>
        <span
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: C.fg,
            opacity: head,
            transform: `translateY(${(1 - head) * 28}px)`,
          }}
        >
          The <span style={{ color: C.accent }}>proof layer</span> for AI memory.
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            border: `1.5px solid ${C.border}`,
            backgroundColor: C.surface,
            borderRadius: 999,
            padding: "22px 52px",
            opacity: pill,
            transform: `translateY(${(1 - pill) * 34}px)`,
            boxShadow: `0 0 70px ${C.accentGlow}`,
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: C.success }} />
          <span style={{ fontFamily: MONO, fontSize: 40, color: C.fg, letterSpacing: "0.04em" }}>usecarry.xyz</span>
        </div>
      </div>
    </Exit>
  );
};

const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 120 } });
  const a = card(8);
  const b = card(18);
  const cardStyle = (s: number): React.CSSProperties => ({
    width: 620,
    border: `1.5px solid ${C.border}`,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: "34px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    opacity: s,
    transform: `translateY(${(1 - s) * 44}px)`,
  });
  return (
    <Exit>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
        <Eyebrow opacity={head} color={C.muted}>
          Everything shipped
        </Eyebrow>
        <div style={{ display: "flex", gap: 36 }}>
          <div style={cardStyle(a)}>
            <span style={{ fontSize: 25, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>DOCS</span>
            <span style={{ fontFamily: MONO, fontSize: 35, color: C.accent }}>docs.usecarry.xyz</span>
            <span style={{ fontSize: 23, color: C.faint }}>Architecture · on-chain proofs · guides</span>
          </div>
          <div style={cardStyle(b)}>
            <span style={{ fontSize: 25, fontWeight: 700, color: C.muted, letterSpacing: "0.06em" }}>NPM</span>
            <span style={{ fontFamily: MONO, fontSize: 35, color: C.fg }}>
              <span style={{ color: C.faint }}>$ </span>npx @usecarry/cli
            </span>
            <span style={{ fontSize: 23, color: C.faint }}>The CLI · MCP server · AI SDK adapter</span>
          </div>
        </div>
      </div>
    </Exit>
  );
};

const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = spring({ frame: frame - 2, fps, config: { damping: 200, stiffness: 110 } });
  const word = interpolate(frame, [10, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const tag = interpolate(frame, [34, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 42% 34% at 50% 46%, rgba(77,162,255,${0.2 * mark}), transparent 70%)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Img
            src={staticFile("carry_mark.png")}
            style={{ height: 116, opacity: mark, transform: `scale(${0.92 + mark * 0.08})` }}
          />
          <span
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: C.fg,
              letterSpacing: `${0.3 - word * 0.16}em`,
              opacity: word,
            }}
          >
            ARRY
          </span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 500, color: C.muted, opacity: tag }}>
          Memory you can <span style={{ color: C.accent, fontWeight: 700 }}>prove.</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.12em", color: C.faint, opacity: tag }}>
          usecarry.xyz · docs.usecarry.xyz · npm: @usecarry
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Launch: React.FC = () => (
  <Stage>
    <Sequence from={LAUNCH.s1.from} durationInFrames={LAUNCH.s1.to - LAUNCH.s1.from}>
      <S1 />
    </Sequence>
    <Sequence from={LAUNCH.s2.from} durationInFrames={LAUNCH.s2.to - LAUNCH.s2.from}>
      <S2 />
    </Sequence>
    <Sequence from={LAUNCH.s3.from} durationInFrames={LAUNCH.s3.to - LAUNCH.s3.from}>
      <S3 />
    </Sequence>
    <Sequence from={LAUNCH.s4.from} durationInFrames={LAUNCH.total - LAUNCH.s4.from}>
      <S4 />
    </Sequence>

    <Audio
      src={staticFile("audio/launch-bed.mp3")}
      volume={(f) =>
        interpolate(f, [0, 12, 286, 308], [0, 0.15, 0.15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      }
    />
    <Sequence from={LAUNCH.audio.lv1}>
      <Audio src={staticFile("audio/lv1.mp3")} volume={0.95} />
    </Sequence>
    <Sequence from={LAUNCH.audio.lv2}>
      <Audio src={staticFile("audio/lv2.mp3")} volume={0.95} />
    </Sequence>
    <Sequence from={LAUNCH.audio.lv3}>
      <Audio src={staticFile("audio/lv3.mp3")} volume={0.95} />
    </Sequence>
    <Sequence from={LAUNCH.audio.lv4}>
      <Audio src={staticFile("audio/lv4.mp3")} volume={0.95} />
    </Sequence>
  </Stage>
);
