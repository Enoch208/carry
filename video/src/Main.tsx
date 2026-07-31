import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import "./fonts";
import { T } from "./theme";
import { Stage } from "./bits";
import { Hook } from "./scenes/Hook";
import { Proof } from "./scenes/Proof";
import { Outro } from "./scenes/Outro";

export const Main: React.FC = () => {
  return (
    <Stage>
      <Sequence from={T.hook.from} durationInFrames={T.hook.to - T.hook.from}>
        <Hook />
      </Sequence>
      <Sequence from={T.proof.from} durationInFrames={T.proof.to - T.proof.from}>
        <Proof />
      </Sequence>
      <Sequence from={T.outro.from} durationInFrames={T.total - T.outro.from}>
        <Outro />
      </Sequence>

      <Audio
        src={staticFile("audio/bed.mp3")}
        volume={(f) =>
          interpolate(f, [0, 20, 405, 448], [0, 0.13, 0.13, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sequence from={T.audio.whoosh}>
        <Audio src={staticFile("audio/whoosh.mp3")} volume={0.3} />
      </Sequence>
      <Sequence from={T.audio.lock}>
        <Audio src={staticFile("audio/lock.mp3")} volume={0.55} />
      </Sequence>
      <Sequence from={T.audio.vo1}>
        <Audio src={staticFile("audio/vo1.mp3")} volume={0.95} />
      </Sequence>
      <Sequence from={T.audio.vo2}>
        <Audio src={staticFile("audio/vo2.mp3")} volume={0.95} />
      </Sequence>
      <Sequence from={T.audio.vo3}>
        <Audio src={staticFile("audio/vo3.mp3")} volume={0.95} />
      </Sequence>
      <Sequence from={T.audio.vo4}>
        <Audio src={staticFile("audio/vo4.mp3")} volume={0.95} />
      </Sequence>
    </Stage>
  );
};
