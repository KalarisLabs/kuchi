// /r/registry.json: the index of every installable component (no source inlined).
import type { APIRoute } from 'astro';
import { items, SITE } from '../../lib/components-catalog';

export const prerender = true;

export const GET: APIRoute = () => {
  const body = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'kuchi',
    homepage: `${SITE}/components`,
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      categories: [item.category],
      dependencies: item.dependencies,
      registryDependencies: item.registryDependencies.map((dep) => `${SITE}/r/${dep}.json`),
      files: item.files.map((file) => ({ path: file.target, type: file.type, target: file.target })),
    })),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
