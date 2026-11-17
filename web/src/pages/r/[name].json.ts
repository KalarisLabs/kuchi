// /r/<name>.json: one component as a shadcn registry item, with its source inlined,
// so `npx shadcn@latest add https://kuchi.kalarislabs.com/r/<name>.json` installs it.
// Built once at build time from the vendored files in src/registry.
import type { APIRoute, GetStaticPaths } from 'astro';
import { items, SITE } from '../../lib/components-catalog';

export const prerender = true;

const sources = import.meta.glob('../../registry/files/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Shown by the shadcn CLI after install. Some components draw on a transparent layer, so a
// bare render can be black unless the composition supplies a background.
const NOTE =
  'Needs a Remotion project. If a frame renders black, the component is drawing on a transparent layer: put a background behind it, e.g. <AbsoluteFill style={{ background: "#faf9f6" }}><Component /></AbsoluteFill>.';
const MODE_NOTE = ' Pass mode="dark" for dark frames.';
// Only components that take a light/dark `mode` prop get the mode hint.
const HAS_MODE = /\bmode\?:\s*["']light["']\s*\|\s*["']dark["']/;

const source = (vendored: string) => {
  const hit = sources[`../../registry/${vendored}`];
  if (hit === undefined) throw new Error(`missing vendored file: ${vendored}`);
  return hit;
};

// Kuchi items are linked by URL. Any other name (e.g. `utils`, the shadcn item behind `cn`)
// stays bare so the CLI resolves it from the default registry.
const KUCHI = new Set(items.map((item) => item.name));

export const getStaticPaths = (() =>
  items.map((item) => ({ params: { name: item.name }, props: { item } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { item } = props as { item: (typeof items)[number] };
  const body = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    docs: HAS_MODE.test(source(item.files[0].vendored)) ? NOTE + MODE_NOTE : NOTE,
    ...(item.devDependencies.length ? { devDependencies: item.devDependencies } : {}),
    ...(item.registryDependencies.length
      ? { registryDependencies: item.registryDependencies.map((dep) => (KUCHI.has(dep) ? `${SITE}/r/${dep}.json` : dep)) }
      : {}),
    files: item.files.map((file) => ({
      path: file.target,
      type: file.type,
      target: file.target,
      content: source(file.vendored),
    })),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
