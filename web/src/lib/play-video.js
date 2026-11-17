// One entry point for playing any video on the site in the shared animated player
// (components/KuchiPlayer.tsx, mounted once in SiteHeader). Plain scripts call
// playVideo(); requests made before the player has hydrated are queued and played
// as soon as it mounts. Plain JavaScript so the gallery script tests can load it.
// The request shape is PlayVideoRequest in components/KuchiPlayer.tsx.

/** @param {import('../components/KuchiPlayer').PlayVideoRequest} request */
export function playVideo(request) {
  // Stop any other player on the page before the modal opens.
  for (const video of document.querySelectorAll('video')) {
    if (!video.closest('.media-01')) video.pause();
  }
  if (window.kuchiPlay) {
    window.kuchiPlay(request);
  } else {
    (window.__kuchiPlayQueue ??= []).push(request);
  }
}
