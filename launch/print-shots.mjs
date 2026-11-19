import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.resolve("src") } } }) });
const c = await selectComposition({ serveUrl, id: "KuchiLaunch" });
console.log("DURATION", c.durationInFrames, (c.durationInFrames / 30).toFixed(2) + "s");
