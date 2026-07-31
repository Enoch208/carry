import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { Launch, LAUNCH } from "./scenes/Launch";
import { Update, UPDATE } from "./scenes/Update";
import { T } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CarryPromo" component={Main} durationInFrames={T.total} fps={T.fps} width={1920} height={1080} />
    <Composition id="CarryLaunch" component={Launch} durationInFrames={LAUNCH.total} fps={30} width={1920} height={1080} />
    <Composition
      id="CarryUpdate"
      component={Update}
      durationInFrames={UPDATE.total}
      fps={UPDATE.fps}
      width={1920}
      height={1080}
    />
  </>
);
