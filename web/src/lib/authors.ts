// Who writes the agent guides (/agents/<slug>) and the blog (/blog/<slug>). Owner, 2026-11-19:
// every cash page and post is by Sayan Chowdhury, with his photo, linking to his profile on
// kalarislabs.com. The photo is a 256 px local copy of https://kalarislabs.com/founders/sayan-chowdhury.jpg
// so the byline never depends on another site being up.
import photo from '../assets/authors/sayan-chowdhury-256.jpg';

export const AUTHOR = {
  name: 'Sayan Chowdhury',
  role: 'Founder & Research Lead, Kalaris Labs',
  url: 'https://kalarislabs.com/team/sayan-chowdhury',
  x: 'https://x.com/sayanchowdhuryai',
  photo,
  bio: 'Sayan founded Kalaris Labs and leads its research on agentic AI: the harnesses, protocols and infrastructure agents need before they can be trusted with real work. He builds and maintains open agent tooling, including Research Agent Skills and the MCP server behind these guides.',
};

/** schema.org Person for JSON-LD. `image` must be an absolute URL. */
export const authorLd = (image: string) => ({
  '@type': 'Person',
  name: AUTHOR.name,
  url: AUTHOR.url,
  image,
  jobTitle: 'Founder & Research Lead',
  worksFor: { '@type': 'Organization', name: 'Kalaris Labs', url: 'https://kalarislabs.com' },
  sameAs: [AUTHOR.url, AUTHOR.x],
});
