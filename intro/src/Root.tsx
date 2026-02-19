import React from "react";
import { Composition } from "remotion";
import { CatCallIntro } from "./CatCallIntro";

export const Root: React.FC = () => (
  <Composition
    id="CatCallIntro"
    component={CatCallIntro}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
);
