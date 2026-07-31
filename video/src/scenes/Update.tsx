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
import { Stage, Eyebrow, Check } from "../bits";

// 40 s at 30 fps. Scene bounds are set by the narration, so a line never runs
// past the beat it belongs to.
export const UPDATE = {
  fps: 30,
  total: 1200,
  intro: { from: 0, to: 190 },
  lab: { from: 190, to: 340 },
  measured: { from: 340, to: 510 },
  gate: { from: 510, to: 700 },
  shipped: { from: 700, to: 960 },
  verify: { from: 960, to: 1200 },
  vo: { uv1: 20, uv2: 200, uv3: 350, uv4: 530, uv5: 730, uv6: 990 },
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

/** 01 — what Carry is, and where it now runs. */
const Intro: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow color={C.accent}>Proof-carrying memory for AI agents</Eyebrow>
    </Rise>
    <Rise delay={12}>
      <Headline>Carry is live on Sui mainnet.</Headline>
    </Rise>
    <Rise delay={34}>
      <Sub>Memory an agent can use only where it is allowed — and prove it on every answer.</Sub>
    </Rise>
  </Centered>
);

/** 02 — the research, stated as research. */
const Lab: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow>Adversarial lab</Eyebrow>
    </Rise>
    <Rise delay={12}>
      <Headline size={76}>We measured what permissive memory access costs.</Headline>
    </Rise>
    <Rise delay={34}>
      <Sub>Nine attacks: unknown agents, undefined namespaces, name guessing, separator injection.</Sub>
    </Rise>
  </Centered>
);

const Score: React.FC<{ value: string; label: string; color: string; glow: string }> = ({
  value,
  label,
  color,
  glow,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      padding: "48px 76px",
      border: `1px solid ${color}55`,
      borderRadius: 20,
      background: glow,
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 132, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: FONT, fontSize: 26, color: C.muted }}>{label}</div>
  </div>
);

/** 03 — the finding. */
const Measured: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(interpolate(ease(frame, fps, 26), [0, 1], [0, 8]));
  return (
    <Centered>
      <Rise>
        <Eyebrow color={C.danger}>Against a permissive default</Eyebrow>
      </Rise>
      <Rise delay={12}>
        <Score
          value={`${count}/9`}
          label="reached memory they should never have touched"
          color={C.danger}
          glow="rgba(248,113,113,0.07)"
        />
      </Rise>
    </Centered>
  );
};

/** 04 — the design decision, and the same measurement. */
const Gate: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow color={C.success}>Carry&rsquo;s gate is default-deny, enforced on chain</Eyebrow>
    </Rise>
    <Rise delay={12}>
      <Score value="0/9" label="the same nine attacks" color={C.success} glow="rgba(52,211,153,0.07)" />
    </Rise>
    <Rise delay={64}>
      <Sub>Both contracts are deployed, so you can run the comparison yourself.</Sub>
    </Rise>
  </Centered>
);

const Row: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => (
  <Rise delay={delay}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "22px 30px",
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        background: C.surface,
        width: 1120,
      }}
    >
      <Check size={26} />
      <span style={{ fontFamily: FONT, fontSize: 30, color: C.fg, fontWeight: 500 }}>{children}</span>
    </div>
  </Rise>
);

/** 05 — the rest of what shipped. */
const Shipped: React.FC = () => (
  <Centered>
    <Rise>
      <Eyebrow>Shipped</Eyebrow>
    </Rise>
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
      <Row delay={14}>Sealed receipts — verify an answer without revealing it</Row>
      <Row delay={44}>Portable vault — memory rebuilt from chain and Walrus alone</Row>
      <Row delay={74}>Policy versioning, single-use nonces, receipt expiry</Row>
      <Row delay={104}>Migrated to gRPC the day legacy RPC retired</Row>
    </div>
  </Centered>
);

/** 06 — the ask. */
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
          {["/lab", "/vault", "/metrics", "/enterprise"].map((p) => (
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
  const bed = interpolate(frame, [0, 40, 1120, 1200], [0, 0.16, 0.16, 0], {
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
    <Beat span={UPDATE.intro}>
      <Intro />
    </Beat>
    <Beat span={UPDATE.lab}>
      <Lab />
    </Beat>
    <Beat span={UPDATE.measured}>
      <Measured />
    </Beat>
    <Beat span={UPDATE.gate}>
      <Gate />
    </Beat>
    <Beat span={UPDATE.shipped}>
      <Shipped />
    </Beat>
    <Beat span={UPDATE.verify}>
      <Verify />
    </Beat>
  </Stage>
);
