import type { APIRoute } from 'astro';
import { WORKFLOW_MD } from '../../lib/skill-data';

export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(WORKFLOW_MD, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export const HEAD: APIRoute = () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
