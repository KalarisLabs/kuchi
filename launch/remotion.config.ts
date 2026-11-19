import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setTimeoutInMilliseconds(180000);
Config.setConcurrency(3);
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: (() => {
      // Bundler maps "remotion" to the package's ESM entry; keep that file as "remotion-real"
      // and send every plain "remotion" import through src/remotion-shim.ts (see TimeRemap).
      const base = { ...((config.resolve?.alias ?? {}) as Record<string, string>) };
      const real = base.remotion;
      delete base.remotion;
      return { ...base, "remotion-real": real, remotion$: path.join(process.cwd(), "src", "remotion-shim.ts"), "@": path.join(process.cwd(), "src") };
    })(),
  },
}));
