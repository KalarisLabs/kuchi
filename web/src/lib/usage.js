// Real usage numbers for the hero counter, counted in PostHog (project 539141).
//
//   agents  MCP sessions opened by a real agent client ($mcp_initialize). Directory
//           probes, health checks, scanners and our own checks are left out by client name.
//   visits  page views on this website (source "web"), test traffic left out.
//
// /stats.json asks PostHog for the live totals; the page renders USAGE_BASELINE at build
// time, so the hero always has a true number even when the live query is unavailable.
// Plain JS (not TS) so the tests can import it.

/** Counted in PostHog on 2026-11-19 with USAGE_QUERY. Raise it when it falls far behind. */
export const USAGE_BASELINE = Object.freeze({ agents: 213, visits: 88, asOf: '2026-11-19' });

const PROBE_CLIENTS = 'probe|check|health|verif|scan|index|catalog|census|collector|watch|monitor|directory|trust|bench|registry|crawl|kuchi';

export const USAGE_QUERY = `SELECT
  countIf(event = '$mcp_initialize'
    AND toString(properties.$mcp_client_name) != ''
    AND NOT match(lower(toString(properties.$mcp_client_name)), '${PROBE_CLIENTS}')) AS agents,
  countIf(event = '$pageview' AND properties.source = 'web' AND properties.is_test != true) AS visits
FROM events
WHERE properties.app = 'kuchi' AND event IN ('$mcp_initialize', '$pageview')`;

const count = (value) => (Number.isSafeInteger(value) && value >= 0 ? value : null);

/**
 * Reads the totals out of a PostHog HogQL query response ({ results: [[agents, visits]] }).
 * Returns null when the response is not the expected shape.
 */
export function readUsage(body) {
  const row = Array.isArray(body?.results) ? body.results[0] : null;
  if (!Array.isArray(row)) return null;
  const agents = count(Number(row[0]));
  const visits = count(Number(row[1]));
  return agents === null || visits === null ? null : { agents, visits };
}

/** Totals only ever grow: never show less than the baseline the page was built with. */
export function atLeastBaseline(usage) {
  return {
    agents: Math.max(usage?.agents ?? 0, USAGE_BASELINE.agents),
    visits: Math.max(usage?.visits ?? 0, USAGE_BASELINE.visits),
  };
}
