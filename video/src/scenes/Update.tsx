import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, MONO } from "../theme";
import { Stage, Eyebrow } from "../bits";

// 42 s at 30 fps. Scene bounds are set by the narration, so a line never runs
// past the beat it belongs to.
export const UPDATE = {
  fps: 30,
  total: 1260,
  hook: { from: 0, to: 180 },
  mainnet: { from: 180, to: 370 },
  gate: { from: 370, to: 520 },
  lab: { from: 520, to: 770 },
  proofs: { from: 770, to: 1020 },
  verify: { from: 1020, to: 1260 },
  vo: { uv1: 15, uv2: 190, uv3: 380, uv4: 535, uv5: 785, uv6: 1045 },
};

const ease = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });

const Rise: React.FC<{ delay?: number; children: React.ReactNode }> = ({ delay = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = ease(frame, fps, delay);
  return <div style={{ opacity: s, transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)` }}>{children}</div>;
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26, padding: 120 }}
  >
    {children}
  </AbsoluteFill>
);

const Headline: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 84 }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: "-0.03em",
      color: C.fg,
      textAlign: "center",
      lineHeight: 1.08,
      maxWidth: 1440,
    }}
  >
    {children}
  </div>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 32,
      fontWeight: 500,
      color: C.muted,
      textAlign: "center",
      lineHeight: 1.45,
      maxWidth: 1180,
    }}
  >
    {children}
  </div>
);

/** 01 — the question nobody can answer today. */
const Hook: React.FC = () => (
  <Centered>
    <Rise>
      <Headline>Your AI remembers everything you tell it.</Headline>
    </Rise>
    <Rise delay={30}>
      <Sub>But can it prove which memories it used — and what it was never allowed to touch?</Sub>
    </Rise>
  </Centered>
);

/** 02 — what Carry is, and that it is deployed. */
const Mainnet: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow color={C.accent}>Proof-carrying memory for AI agents</Eyebrow>
    </Rise>
    <Rise delay={12}>
      <Headline>Live on Sui mainnet.</Headline>
    </Rise>
    <Rise delay={34}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          color: C.muted,
          padding: "16px 26px",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          background: C.surface,
        }}
      >
        carry::access · 0xeaf4e6e4…4032d8
      </div>
    </Rise>
  </Centered>
);

/** 03 — the rule that makes a receipt worth anything. */
const Gate: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow>Gate before generation</Eyebrow>
    </Rise>
    <Rise delay={12}>
      <Headline size={76}>Restricted memory never enters the model&rsquo;s context.</Headline>
    </Rise>
    <Rise delay={34}>
      <Sub>Not filtered after the answer. Enforced at retrieval, on-chain.</Sub>
    </Rise>
  </Centered>
);

const Score: React.FC<{ value: string; label: string; sub: string; color: string; glow: string }> = ({
  value,
  label,
  sub,
  color,
  glow,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: "40px 68px",
      border: `1px solid ${color}55`,
      borderRadius: 20,
      background: glow,
      minWidth: 420,
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: "0.16em", color: C.faint }}>{label}</div>
    <div style={{ fontFamily: MONO, fontSize: 118, fontWeight: 700, color, lineHeight: 1.05 }}>{value}</div>
    <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted }}>{sub}</div>
  </div>
);

/** 04 — the benchmark, side by side. */
const Lab: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow>Adversarial lab · nine attack classes</Eyebrow>
    </Rise>
    <div style={{ display: "flex", gap: 26, marginTop: 6 }}>
      <Rise delay={14}>
        <Score
          label="PERMISSIVE BASELINE"
          value="8/9"
          sub="reached memory"
          color={C.danger}
          glow="rgba(248,113,113,0.07)"
        />
      </Rise>
      <Rise delay={44}>
        <Score label="CARRY" value="0/9" sub="default-deny" color={C.success} glow="rgba(52,211,153,0.07)" />
      </Rise>
    </div>
    <Rise delay={86}>
      <Sub>Run it yourself — it executes against mainnet on every page load.</Sub>
    </Rise>
  </Centered>
);

const Card: React.FC<{ delay: number; title: string; body: string }> = ({ delay, title, body }) => (
  <Rise delay={delay}>
    <div
      style={{
        width: 1100,
        padding: "26px 32px",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.surface,
      }}
    >
      <p style={{ fontFamily: FONT, fontSize: 32, fontWeight: 600, color: C.fg, margin: 0 }}>{title}</p>
      <p style={{ fontFamily: FONT, fontSize: 25, color: C.muted, margin: "8px 0 0" }}>{body}</p>
    </div>
  </Rise>
);

/** 05 — the two proofs that are hard to argue with. */
const Proofs: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow>Two things a receipt can prove</Eyebrow>
    </Rise>
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
      <Card
        delay={14}
        title="Sealed receipts"
        body="Prove what an answer used without revealing it — the public blob carries salted commitments, not your memories."
      />
      <Card
        delay={52}
        title="A refusal is proof too"
        body="An agent claimed a namespace it was never granted. The receipt verifies — as an authentic record of the denial."
      />
    </div>
  </Centered>
);

/** 06 — the ask: go and check it. */
const Verify: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = interpolate(Math.sin((frame / fps) * 2.2), [-1, 1], [0.25, 0.5]);
  return (
    <Centered>
      <Rise>
        <Eyebrow color={C.accent}>No wallet. Nothing to install.</Eyebrow>
      </Rise>
      <Rise delay={12}>
        <Headline size={72}>Every claim is one click from proof.</Headline>
      </Rise>
      <Rise delay={34}>
        <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 27, color: C.muted }}>
          {["/lab", "/vault", "/metrics", "/console"].map((p) => (
            <span
              key={p}
              style={{ padding: "12px 22px", border: `1px solid ${C.border}`, borderRadius: 999, background: C.surface }}
            >
              {p}
            </span>
          ))}
        </div>
      </Rise>
      <Rise delay={58}>
        <div
          style={{
            marginTop: 22,
            fontFamily: FONT,
            fontSize: 62,
            fontWeight: 700,
            color: C.accent,
            letterSpacing: "-0.02em",
            textShadow: `0 0 ${60 * glow}px rgba(77,162,255,${glow})`,
          }}
        >
          usecarry.xyz
        </div>
      </Rise>
    </Centered>
  );
};

const Fade: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 14, to - 16, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Beat: React.FC<{ span: { from: number; to: number }; children: React.ReactNode }> = ({ span, children }) => (
  <Fade from={span.from} to={span.to}>
    <Sequence from={span.from} durationInFrames={span.to - span.from}>
      {children}
    </Sequence>
  </Fade>
);

/** Narration sits well above the bed, which ducks under it and fades out clean. */
const Track: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 40, 1180, 1260], [0, 0.16, 0.16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <Audio src={staticFile("audio/update-bed.mp3")} volume={bed} />
      {Object.entries(UPDATE.vo).map(([name, at]) => (
        <Sequence key={name} from={at}>
          <Audio src={staticFile(`audio/${name}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};

export const Update: React.FC = () => (
  <Stage>
    <Track />
    <Beat span={UPDATE.hook}>
      <Hook />
    </Beat>
    <Beat span={UPDATE.mainnet}>
      <Mainnet />
    </Beat>
    <Beat span={UPDATE.gate}>
      <Gate />
    </Beat>
    <Beat span={UPDATE.lab}>
      <Lab />
    </Beat>
    <Beat span={UPDATE.proofs}>
      <Proofs />
    </Beat>
    <Beat span={UPDATE.verify}>
      <Verify />
    </Beat>
  </Stage>
);
