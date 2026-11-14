// Formatting helpers shared by the Astro components (build time) and the gallery
// script (browser), so server-rendered values and client updates always agree.
// Ported unchanged from site/app.js.
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pad = (value) => String(value).padStart(3, '0');
export const full = (value) => value == null ? '—' : value.toLocaleString('en-US');
export const compact = (value) => value == null ? '—' : value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(1)}K` : String(value);
export const timecode = (seconds) => {
  const total = Math.round(seconds);
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
};
export const launchDate = value => new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
export const displayDuration = (video) => `${timecode(video.clipSeconds)}${video.excerpt ? ` excerpt / ${timecode(video.originalSeconds)} original` : ''}`;
