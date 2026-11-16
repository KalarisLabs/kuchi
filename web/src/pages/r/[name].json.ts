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

// Shown by the shadcn CLI after install. The components draw on a transparent layer, so a
// bare render is black unless the composition supplies a background.
const NOTE =
  'Needs a Remotion project. These components draw on a transparent layer, so a render is black unless you put a background behind them, e.g. <AbsoluteFill style={{ background: "#faf9f6" }}><Component /></AbsoluteFill>. Pass mode="dark" for dark frames.';

const source = (vendored: string) => {
  const hit = sources[`../../registry/${vendored}`];
  if (hit === undefined) throw new Error(`missing vendored file: ${vendored}`);
  return hit;
};

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
    docs: NOTE,
    ...(item.devDependencies.length ? { devDependencies: item.devDependencies } : {}),
    ...(item.registryDependencies.length
      ? { registryDependencies: item.registryDependencies.map((dep) => `${SITE}/r/${dep}.json`) }
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
