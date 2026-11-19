// Render stills at given frames: node scripts-stills.mjs 10 200 400 ...
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.resolve("src") } } }),
});
const composition = await selectComposition({ serveUrl, id: "KuchiLaunch" });
for (const frame of frames) {
  await renderStill({ serveUrl, composition, frame, output: `out/${process.env.DIR ?? "stills"}/f${String(frame).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 80, scale: 0.5 });
  console.log("frame", frame);
}
