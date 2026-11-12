import {createMcpHandler} from 'agents/mcp/server';
import {loadArchive, cachedLoader, record, filters, SITE_URL} from './catalog.mjs';
import {createServer, VERSION} from './server.mjs';
import {guardRequest} from './request-guard.mjs';

export {VERSION};
// One catalog cache per isolate, shared by every request.
const load = cachedLoader(() => loadArchive());
const CLAUDE_CONNECT_URL = 'https://claude.ai/customize/connectors?' + new URLSearchParams({modal:'add-custom-connector', connectorName:'Kuchi', connectorUrl:`${SITE_URL}/mcp`});
const MCP_OPTIONS = {route:'/mcp', legacy:'stateless', allowedHostnames:['kuchi.kalarislabs.com', 'localhost', '127.0.0.1'], allowedOriginHostnames:'*'};

// The setup skill people install in their agent. The full workflow stays live
// on the server, so this file rarely needs to change.
export const SKILL = `---
name: kuchi
description: Find real product-launch videos to use as inspiration templates, then plan a remake for the user's own product with their own assets. Use when the user is planning or making a launch video, product demo, teaser or feature announcement, even if they don't name Kuchi.
---

# Kuchi

Kuchi is a library of real launch videos. Each one is an inspiration template: borrow its pacing, transitions, layout and motion, never its brand, footage, music or copy.

Connect the Kuchi MCP server: ${SITE_URL}/mcp (Streamable HTTP, no sign-in). In Claude, add it as a custom connector (or open ${SITE_URL}/agent/connect/claude). In ChatGPT, add it as a custom MCP app with no authentication. Never ask the user for credentials.

1. Find references with kuchi_search_videos and show the user each poster and Kuchi link. Choose by fit, not popularity.
2. Call kuchi_plan_remake with the user's product name, details and assets. Ask for anything in missing_inputs (logo, screenshots or recordings, features, call to action) before building.
3. Build with your own tools, using only the user's assets and claims. Compare with the reference before delivering.

Without MCP, read ${SITE_URL}/agent/catalog.json and ${SITE_URL}/agent/workflow.md.
`;

const HEADERS = {'Cache-Control':'no-store, max-age=0', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'};
function response(body, type = 'application/json', status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {status, headers:{...HEADERS, 'Content-Type':`${type}; charset=utf-8`}});
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    // Liveness probe, outside the rate limit.
    if (path === '/mcp/health') {
      if (!['GET', 'HEAD'].includes(request.method)) return response({error:'Method not allowed'}, 'application/json', 405);
      const health = response({status:'ok', product:'Kuchi', version:VERSION});
      return request.method === 'HEAD' ? new Response(null, {status:200, headers:health.headers}) : health;
    }
    const guarded = await guardRequest(request, env);
    if (guarded.response) return guarded.response;
    request = guarded.request;

    if (path === '/mcp') return createMcpHandler(() => createServer(load), MCP_OPTIONS)(request, env, ctx);
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:{'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type'}});
    if (!['GET', 'HEAD'].includes(request.method)) return response({error:'Method not allowed'}, 'application/json', 405);
    if (path === '/agent/connect/claude') return new Response(null, {status:302, headers:{...HEADERS, Location:CLAUDE_CONNECT_URL}});
    if (path === '/agent' || path === '/agent/') return Response.redirect(`${SITE_URL}/#connect`, 302);
    if (path === '/agent/SKILL.md') return response(request.method === 'HEAD' ? '' : SKILL, 'text/markdown');
    if (!['/agent/manifest.json', '/agent/catalog.json', '/agent/workflow.md'].includes(path)) return response({error:'Not found'}, 'application/json', 404);
    try {
      const archive = await load();
      const data = path.endsWith('workflow.md') ? response(archive.workflow, 'text/markdown')
        : path.endsWith('catalog.json') ? response({source_revision:archive.sourceRevision, fetched_at:archive.fetchedAt, ...filters(archive), videos:archive.videos.map(v => record(archive, v))})
        : response({...archive.manifest, version:VERSION, source_revision:archive.sourceRevision});
      return request.method === 'HEAD' ? new Response(null, {status:200, headers:data.headers}) : data;
    } catch (error) {
      console.error(JSON.stringify({event:'catalog_unavailable', path, message:error.message}));
      return response({error:"Kuchi's catalog is temporarily unavailable. Retry in a minute."}, 'application/json', 503);
    }
  }
};
