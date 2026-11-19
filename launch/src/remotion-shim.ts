// Every `import ... from "remotion"` in this project resolves here (remotion.config.ts).
// It is the real package, except useVideoConfig: inside <TimeRemap> it reports the authored
// frame rate (30) so frame/fps maths in the components stays correct at 60 fps output.
import { useContext } from "react";
import { Internals, useVideoConfig as useRealVideoConfig } from "remotion-real";
import { RemapContext } from "./lib/remap-context";

export * from "remotion-real";
export { useRealVideoConfig };

export const useVideoConfig: typeof useRealVideoConfig = () => {
  const config = useRealVideoConfig();
  const factor = useContext(RemapContext);
  if (factor === 1) return config;
  return {
    ...config,
    fps: config.fps / factor,
    durationInFrames:
      config.durationInFrames > 1890
        ? Math.ceil(config.durationInFrames / factor)
        : config.durationInFrames,
  };
};
