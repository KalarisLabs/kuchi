// Catalog watchUrls use https://kuchi.kalarislabs.com/assets/<id>.mp4, but the
// files live in R2 behind the media domain. Redirect so every published link
// (README, llms.txt, agent results) plays.
import type { APIRoute } from 'astro';

const MEDIA_URL = 'https://kuchi-media.kalarislabs.com';

export const GET: APIRoute = ({ params }) => {
  const file = params.file ?? '';
  if (!/^[0-9]+\.mp4$/.test(file)) return new Response('Not found', { status: 404 });
  return new Response(null, {
    status: 301,
    headers: { Location: `${MEDIA_URL}/assets/${file}`, 'Cache-Control': 'public, max-age=86400' },
  });
};
