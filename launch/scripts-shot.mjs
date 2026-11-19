// node scripts-shot.mjs <shot-id> <dir> f1 f2 ... : stills of one shot's composition
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
const [, , ...args] = process.argv;
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.resolve("src") } } }),
});
// groups: id:dir:f,f,f
for (const g of args) {
  const [id, dir, list] = g.split(":");
  const composition = await selectComposition({ serveUrl, id: `shot-${id}` });
  for (const frame of list.split(",").map(Number)) {
    await renderStill({ serveUrl, composition, frame, output: `out/${dir}/${id.slice(0, 2)}-${String(frame).padStart(3, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 75, scale: 0.4 });
  }
  console.log("done", id);
}
