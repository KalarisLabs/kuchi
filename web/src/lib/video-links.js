// Links and copy for one launch video, shared by the Astro pages (build time) and the
// gallery script (browser). Plain JavaScript so the script tests can load it.
//
// Every video has its own indexable page at /videos/<slug>. The remake brief still links
// /#video-<id>: that is the link form the Kuchi MCP resolves (findVideo in
// agent-service/catalog.mjs), so a brief pasted into any agent keeps working. The home
// page forwards /#video-<id> to the video's page for people.
export const SITE_URL = 'https://kuchi.kalarislabs.com';

/** @param {{slug?: string, id: number}} video */
export const videoPath = (video) => `/videos/${video.slug || video.id}`;

/** @param {{id: number, source: string}} video */
export const agentLink = (video) => `${SITE_URL}/#video-${video.id}`;

/** The prompt a visitor copies into their agent to remake a video. */
export const remakeBrief = (video) => `Use this Kuchi video as the template for my launch video: ${agentLink(video)}\nRemake its motion and vibe for my product, with my own logo, screens and copy. Original post: ${video.source}`;
