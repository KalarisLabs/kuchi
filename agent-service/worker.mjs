import {McpServer} from '@modelcontextprotocol/server';
import {createMcpHandler} from 'agents/mcp/server';
import {z} from 'zod';
import {loadArchive, context, publicManifest, search, record, findVideo} from './catalog.mjs';
import {guardRequest} from './request-guard.mjs';
import {measureMcpRequest,taskIdSchema} from './analytics.mjs';

const BASE = '';
export const VERSION = '0.2.0';
const CLAUDE_CONNECT_URL = 'https://claude.ai/customize/connectors?' + new URLSearchParams({modal:'add-custom-connector',connectorName:'Kuchi',connectorUrl:'https://kuchi.kalarislabs.com/mcp'});
export const LIST_CACHE_HINTS = Object.freeze({
  'server/discover':{ttlMs:60*60*1000, cacheScope:'private'},
  'tools/list':{ttlMs:60*60*1000, cacheScope:'private'}
});
const annotations = {readOnlyHint:true, destructiveHint:false, idempotentHint:true, openWorldHint:true};
const result = value => ({content:[{type:'text',text:JSON.stringify(value)}], structuredContent:value});
const task_id = taskIdSchema.optional().describe('Optional client-chosen UUID to group calls for one task. Omit for browsing.');
const guarded = (load, fn, tool, observe) => async args => {
  const started = Date.now();
  const completed = properties => {
    try { observe?.({tool,task_id:args.task_id,duration_ms:Math.max(0,Date.now()-started),...properties}); }
    catch { console.warn(JSON.stringify({event:'analytics_capture_failed'})); }
  };
  try {
    const value = await fn(await load(),args);
    completed({outcome:'success',...(tool === 'get_launch_video' ? {reference_found:value.found,reference_id:value.video?.id} : {}),...(tool === 'search_launch_videos' ? {query_length:args.query?.length ?? 0,result_count:value.totalMatches,category:args.category,style:args.style} : {})});
    return result(value);
  } catch (error) {
    completed({outcome:'error'});
    console.error(JSON.stringify({event:'archive_source_unavailable',message:error.message}));
    return {isError:true,content:[{type:'text',text:'The current published archive is unavailable. Retry later; no cached catalog was returned.'}]};
  }
};

export function createServer(load = loadArchive, observe) {
  const server = new McpServer({name:'launch-archive', title:'Kuchi', version:VERSION}, {
    instructions:'Before each launch-video task, call get_launch_context and follow the workflow it returns.',
    // Without hints the SDK stamps ttlMs:0 ("immediately stale") on 2026-era
    // discover and tools/list results, so clients such as claude.ai re-run
    // server/discover + tools/list before every use. Both only change on deploy.
    cacheHints:LIST_CACHE_HINTS
  });
  server.registerTool('get_launch_context', {
    title:'Browse current launch-video collection',
    description:'Start here for product launch, demo, teaser or feature-announcement videos and motion-design inspiration. Get the live collection, workflow and searchable styles.',
    inputSchema:z.object({task_id}), annotations:{...annotations,title:'Browse current launch-video collection'}
  }, guarded(load, archive => context(archive),'get_launch_context',observe));
  server.registerTool('search_launch_videos', {
    title:'Search launch-video references',
    description:'Find real launch, demo and teaser references by brand, product, pacing, transitions or animation style. Returns playable videos, Kuchi preview links and notes. Keyword order is not a product-fit recommendation; no popularity ranking or metrics.',
    inputSchema:z.object({query:z.string().max(300).optional(), style:z.string().max(100).optional(), category:z.string().max(100).optional(), ratio:z.string().max(30).optional(), sort:z.enum(['relevance','newest']).optional(), limit:z.number().int().min(1).max(12).optional(), task_id}), annotations:{...annotations,title:'Search launch-video references'}
  }, guarded(load, (archive,args) => ({...context(archive), ...search(archive,args)}),'search_launch_videos',observe));
  server.registerTool('get_launch_video', {
    title:'Get launch-video reference details',
    description:'Get a reference by ID, slug or X/Twitter URL: MP4, descriptive metadata, notes and clone prompt. Catalog references only; no popularity metrics or legacy scores.',
    inputSchema:z.object({reference:z.string().min(1).max(500), task_id}), annotations:{...annotations,title:'Get launch-video reference details'}
  }, guarded(load, (archive,{reference}) => {
    const video = findVideo(archive,reference);
    return {...context(archive), found:!!video, video:video ? record(video,true,archive.sourceRevision) : null};
  },'get_launch_video',observe));
  return server;
}

const bootstrap = `---
name: kuchi
description: Find real video references for product launches, demos, teasers and feature announcements, or inspiration for pacing, transitions, motion design and vibe. Use when planning or making these videos, even if the user does not name Kuchi.
---

# Kuchi

Search the Kuchi video collection and share playable Kuchi links. Before each relevant task, call get_launch_context and follow its live workflow; keep creative decisions with the agent.

Use the existing MCP server: https://kuchi.kalarislabs.com/mcp (Streamable HTTP, open: no sign-in, no tokens). Never request credentials in chat or package a downloadable skill. If setup is needed, offer one connect link: for Claude, [Connect Kuchi](https://kuchi.kalarislabs.com/agent/connect/claude); otherwise the client's shortest setup path. Confirm connection only after initialize, tools/list and get_launch_context succeed.

If MCP is unavailable, the same live catalog is at https://kuchi.kalarislabs.com/agent/catalog.json and the workflow at https://kuchi.kalarislabs.com/agent/workflow.md. Keep the catalog and workflow live rather than embedding them in permanent instructions.
`;

function skillResponse(request) {
  const acceptsHtml = (request.headers.get('accept') ?? '').split(',').some(value =>
    value.trim().split(';')[0].toLowerCase() === 'text/html' && !/;\s*q=0(?:\.0*)?(?:\s*;|\s*$)/i.test(value));
  const html = acceptsHtml && new URL(request.url).searchParams.get('raw') !== '1';
  const escaped = html ? bootstrap.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) : '';
  const body = html ? `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kuchi — Setup guide</title>
<link rel="icon" href="/favicon-32.png?v=popcorn-1" type="image/png" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=popcorn-1">
<link rel="alternate" type="text/markdown" title="Raw Markdown" href="?raw=1">
<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/shared/site-header.css">
<script src="/shared/site-header.js" defer></script>
<style>.skill-document{padding-top:32px;padding-bottom:64px}.skill-document h1{font-size:26px;margin:0}.skill-source{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.8 var(--mono);margin:24px 0 0}</style></head>
<body><header class="masthead site-header" data-site-header data-site-page="launch-videos"><div class="brand"><a class="logo" href="/">Kalaris Labs</a></div><nav class="meta" aria-label="Page navigation"><a href="/">Collection ↗</a></nav></header>
<main class="document skill-document"><div class="section-heading"><h1>Agent setup</h1><a href="?raw=1">Raw Markdown ↗</a></div><pre class="skill-source">${escaped}</pre></main></body></html>` : bootstrap;
  const result = response(request.method === 'HEAD' ? '' : body, html ? 'text/html' : 'text/markdown');
  result.headers.set('Vary','Accept');
  return result;
}

function response(body, type = 'application/json', status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {status,headers:{'Content-Type':`${type}; charset=utf-8`, 'Cache-Control':'no-store, max-age=0', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'}});
}

const MCP_OPTIONS = {route:`${BASE}/mcp`,legacy:'stateless',allowedHostnames:['kuchi.kalarislabs.com','localhost','127.0.0.1'],allowedOriginHostnames:'*'};
export default {
  async fetch(request,env,ctx) {
    // Public, unauthenticated liveness probe (WHITELABEL.md section 8).
    if(new URL(request.url).pathname===`${BASE}/mcp/health`){
      if(!['GET','HEAD'].includes(request.method)) return response({error:'Method not allowed'},'application/json',405);
      const health=response({status:'ok',product:'Kuchi',version:VERSION});
      return request.method==='HEAD'?new Response(null,{status:200,headers:health.headers}):health;
    }
    if(new URL(request.url).pathname===`${BASE}/mcp`)
      return measureMcpRequest(request,env,ctx,observe=>handleRequest(request,env,ctx,observe));
    return handleRequest(request,env,ctx);
  }
};

// Kuchi's MCP server and agent routes are open: no accounts, no OAuth.
// Abuse protection is the per-IP throttle in guardRequest.
async function handleRequest(request,env,ctx,observeRequest=()=>{}) {
    const guarded = await guardRequest(request, env);
    if (guarded.response) return guarded.response;
    request = guarded.request;
    const path = new URL(request.url).pathname;
    if (path === `${BASE}/mcp`) {
      observeRequest(undefined);
      const mcp = createMcpHandler(() => createServer(loadArchive),MCP_OPTIONS);
      return mcp(request,env,ctx);
    }
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
    if (!['GET','HEAD'].includes(request.method)) return response({error:'Method not allowed'},'application/json',405);
    if (path === `${BASE}/agent/connect/claude`) return new Response(null,{status:302,headers:{Location:CLAUDE_CONNECT_URL,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
    if (path === `${BASE}/agent` || path === `${BASE}/agent/`) return Response.redirect('https://kuchi.kalarislabs.com/#connect',302);
    if (path === `${BASE}/agent/SKILL.md`) return skillResponse(request);
    const endpoints = [`${BASE}/agent/manifest.json`,`${BASE}/agent/catalog.json`,`${BASE}/agent/workflow.md`];
    if (!endpoints.includes(path)) return response({error:'Not found'},'application/json',404);
    try {
      const archive = await loadArchive();
      let data;
      if (path.endsWith('/workflow.md')) data = response(archive.workflow,'text/markdown');
      else if (path.endsWith('/catalog.json')) data = response({...context(archive), videos:archive.videos.map(v => record(v,true,archive.sourceRevision))});
      else data = response(publicManifest(archive));
      data.headers.set('X-Launch-Archive-Version',archive.version);
      return request.method === 'HEAD' ? new Response(null,data) : data;
    } catch (error) { console.error(JSON.stringify({event:'archive_source_unavailable',message:error.message})); return response({error:'Current published archive unavailable. No cached catalog returned.'},'application/json',503); }
}
