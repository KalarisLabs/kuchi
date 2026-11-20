// Catalog links come from repository data; only https URLs are ever placed in an href.
export const safeUrl = (value) => {
  try { return new URL(String(value)).protocol === 'https:' ? String(value) : '#'; } catch { return '#'; }
};
