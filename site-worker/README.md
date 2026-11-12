# Gallery delivery

The gallery Worker owns collection data, media, the gallery UI (`site/`) and
static legal/setup pages.

Run from this repository root:

```sh
python3 scripts/build_site.py
python3 scripts/sync_media_r2.py
node --test site-worker/worker.test.mjs
npx wrangler deploy --config site-worker/wrangler.json
```

MP4s are served from the `kuchi-media` R2 bucket, which slices
byte ranges natively. Slicing the bundled asset in JS used 20-300 ms CPU per
request, past the Workers Free 10 ms limit. `sync_media_r2.py` uploads new or
changed MP4s; a video not yet in R2 still plays from the bundled asset.

The build validates canonical media and runtime module dependencies, generates
`site-worker/asset-sizes.json`, and stages the gallery in `site-public/` (MP4s in its `assets/`).
`daily-stats.json` also contains timestamped catalog observations from the main
history (last 48 hours plus a preceding state). Build from a Git checkout with
that history available. The UI compares the current catalog to its state 24 hours
ago; dated end-of-day snapshots are retained for historical consumers only.
The asset layer serves every file directly except the HTML entries and MP4s
listed in `run_worker_first`: MP4s need the Worker for byte ranges, which the
asset layer does not support. Direct asset requests are free and do not count
toward the Workers daily request limit.
Media is hardlinked where supported, otherwise copied. Treat generated assets as
read-only. References hosted elsewhere remain external.

By default the Worker serves the collection and consent HTML from this
repository's `site/` build. To serve them from a separate HTML origin instead,
set the `UI_ORIGIN` variable in `wrangler.json`; the Worker then fetches the
extensionless entries (`/launch`, `/consent`, `/sharing`) from that origin
without forwarding cookies, authorization headers or query strings. Original
browser URLs and OAuth parameters remain available to the client. An
unavailable external origin returns 503.

Keep the existing more-specific MCP routes and authentication Worker intact.
After publication, verify `/`, `/videos.json`, a video
byte-range request and `/consent.html`. Use normal Chrome to check
search, filters, grid/table, details, playback, seeking and the shared header.
A local inert consent preview does not certify live OAuth acceptance.

For daily video additions, use this checked-in configuration; do not publish an
older standalone HTML bundle over the shared frontend.
