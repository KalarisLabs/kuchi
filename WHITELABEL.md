# Kuchi — White-Label & Fork Audit

> This document is the single source of truth for **how Kuchi differs from the
> upstream Serena Launch collection**, what was changed, what must **not** be
> copied, and the gates that must pass before any publish.

| Field | Value |
|---|---|
| Upstream | github.com/serenakeyitan/awesome-ai-clonable-launch-videos |
| Upstream product | Serena Launch (serenatan.org) |
| Downstream | Kuchi (kuchi.kalarislabs.com) |
| Maintainer | Kalaris Labs |
| Enforcement | `scripts/audit.sh` (CI gate) + `scripts/rebrand.sh` |

---

## 1. Purpose & scope

Kuchi is a **fork**, not a mirror. This document:

- Records every user-visible change from upstream → Kuchi.
- Flags assets that **cannot** be redistributed.
- Defines the domain/URL policy.
- Specifies the rebrand and audit scripts.
- Lists the sign-off gates before publish.

## 2. What we forked

| Item | Upstream state | Kuchi state |
|---|---|---|
| Corpus | 83 videos, MP4s in `videos/` | Metadata + analysis; `video_url: null` by default |
| MCP | `serenatan.org/launchvideo/mcp` | `kuchi.kalarislabs.com/mcp` (self-hosted) |
| Prompts | Serena-worded remake prompts | Re-authored in Kuchi voice (`prompts/*.v1.md`) |
| Breakdown | Style notes (descriptive) | Public schema + instruction (`schema/`, `prompts/breakdown.v1.md`) |
| Branding | Serena Launch / Serena Tan | Kuchi / Kalaris Labs |
| License | See `UPSTREAM_LICENSE` | MIT + NOTICE (attribution preserved) |

## 3. License & attribution rules

1. **Preserve** `UPSTREAM_LICENSE` verbatim. Do not delete or edit it.
2. **Preserve** upstream git history (fork, not re-init).
3. **Add** `NOTICE` crediting Serena Launch and stating Kalaris Labs' modifications.
4. **Do not** relicense upstream code under terms incompatible with the upstream license.
5. **Do not** claim authorship of the original corpus or its curation.

## 4. What must change (checklist by file)

| File / area | Change required | Status |
|---|---|---|
| `README.md` | Rebrand header, URLs, connect block | ☑ |
| `package.json` | `name: @kalarislabs/kuchi`, homepage, repo | ☑ |
| `.env.example` | Add `KUCHI_*` vars | ☑ |
| `mcp/server.js` | Endpoint from `KUCHI_MCP_URL`; add `/mcp/health` | ◐ see §10 |
| `schema/*.json` | `$id` → `kuchi.kalarislabs.com` | n/a (no `schema/`) |
| `prompts/*.md` | Re-author in Kuchi voice (no copy-paste) | ☐ open |
| `videos.json` | `video_url: null` for third-party refs | ☐ held (UI) |
| `docs/*.md` | All URLs via `KUCHI_BASE_URL` | ☑ via rebrand |
| `NOTICE` | Add Kalaris Labs + upstream credit | ☑ |
| `MIGRATION.md` | Serena → Kuchi mapping | ☑ |
| Any `serenatan.org` string | Remove or replace | ◐ upstream records left |
| Any hardcoded MP4 of third-party video | Remove from repo | ☐ held (UI) |

## 5. What must NOT be copied (asset flags)

These are **third-party launch videos**. They may be *referenced by source URL*
but must **not** be committed, hosted, or redistributed by Kuchi.

| Asset class | Rule |
|---|---|
| Launch MP4s (e.g., Grok Bot, Notion, Cursor, Claude) | Reference only; `video_url: null` |
| Embedded `x.com` / Twitter source links | Allowed as attribution metadata |
| Sampled frames / thumbnails | Do not commit unless licensed |
| Serena-worded prompt text | Do not copy verbatim; re-author |
| Serena branding assets (logos, names) | Do not reuse |

> **Audit output**: `scripts/audit.sh` must produce a `WHITELABEL_AUDIT.json`
> listing every flagged asset with `{ path, type, action: keep|swap|drop }`.

## 6. Domain & URL policy

- **Only** `kuchi.kalarislabs.com` may appear in user-facing output.
- All URLs derive from `KUCHI_BASE_URL`. No hardcoded domains in code.
- Allowed exceptions: upstream attribution URLs in `NOTICE` and
  `source_url` fields in `videos.json` (these point to *original creators*,
  not to Serena).
- **Forbidden**: `serenatan.org`, `localhost` in prod config, any
  `launchvideo/mcp` path from upstream.

## 7. Branding swap table

| Upstream | Kuchi |
|---|---|
| Serena Launch | Kuchi |
| Serena Tan | Kalaris Labs |
| serenatan.org | kuchi.kalarislabs.com |
| `/launchvideo/mcp` | `/mcp` |
| `/launchvideo/` | `/` |
| "AI clonable viral launch videos" | "Open reference corpus + MCP for AI-clonable launch videos" |

## 8. Audit checklist (the `WHITELABEL_AUDIT.md` content)

Run before every release. All items must be ✅.

- [ ] No `serenatan.org` string anywhere in the repo
- [ ] No upstream MP4 committed under `videos/`
- [ ] Every `videos.json` entry has `source_url` (attribution)
- [ ] Every third-party entry has `video_url: null`
- [ ] `NOTICE` present and correct
- [ ] `UPSTREAM_LICENSE` present and unmodified
- [ ] `schema/*.json` `$id` uses Kuchi domain
- [ ] All `prompts/*.md` carry version + date + author
- [ ] No prompt text copied verbatim from upstream
- [ ] `KUCHI_BASE_URL` is the only source of domains in code
- [ ] `/mcp/health` returns `{status, product:"Kuchi", version}`
- [ ] `MIGRATION.md` published
- [ ] `scripts/audit.sh` exits 0

## 9. `scripts/rebrand.sh` — spec

Idempotent. Safe to run repeatedly.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Fail fast if upstream license missing
[[ -f UPSTREAM_LICENSE ]] || { echo "Missing UPSTREAM_LICENSE"; exit 1; }

# Swap brand strings (case-sensitive where needed)
rg -l --hidden -g '!.git' 'Serena Launch' | xargs -r sed -i 's/Serena Launch/Kuchi/g'
rg -l --hidden -g '!.git' 'Serena Tan'    | xargs -r sed -i 's/Serena Tan/Kalaris Labs/g'
rg -l --hidden -g '!.git' 'serenatan\.org'| xargs -r sed -i 's#https\?://serenatan\.org/launchvideo/mcp#${KUCHI_MCP_URL:-https://kuchi.kalarislabs.com/mcp}#g'
rg -l --hidden -g '!.git' 'serenatan\.org'| xargs -r sed -i 's#https\?://serenatan\.org#https://kuchi.kalarislabs.com#g'

# Null out third-party video URLs by default
node -e '
  const fs=require("fs");const f="videos.json";
  if(!fs.existsSync(f))process.exit(0);
  const v=JSON.parse(fs.readFileSync(f));
  v.forEach(e=>{ if(e.source_url && !e.owned) e.video_url=null; });
  fs.writeFileSync(f, JSON.stringify(v,null,2));
'

echo "Rebrand complete. Run scripts/audit.sh next."
```

## 10. As implemented (2026-11-12)

**Constraint from the maintainer: the UI must not be removed or changed.** Where
this spec conflicts with that, the UI wins and the item stays open in the audit.

### Repository mapping

The spec assumes a layout this repository doesn't have. The real locations:

| Spec | This repository |
|---|---|
| `mcp/server.js` | `agent-service/worker.mjs` (+ `mcp-auth.mjs`, `request-guard.mjs`) |
| `videos.json` | `data/videos.json`; attribution field is `source`, media fields are `video` / `watchUrl` |
| `schema/`, `prompts/` | Don't exist. Prompts are `remakePrompt` values inside `data/videos.json` |
| `docs/*.md` | `README.md` (generated by `scripts/build_readme.py`), `agent/*.md`, `agent-service/*.md`, `site-worker/README.md` |

### Deviations from §9

- The rules live in `scripts/rebrand.py`, and `scripts/rebrand.sh` calls it.
  The `sed -i` one-liners behave differently on GNU and BSD, the domain swap
  alone missed the `/launchvideo` path prefix, URL-encoded deep links,
  regex-escaped paths, `clerk.`/`accounts.` subdomains and identifiers such as
  `serena-launch`. The script was run twice to confirm idempotence (0 changes on
  the second run).
- The `video_url: null` step was **not** applied. The field doesn't exist, and
  nulling `watchUrl` would stop the gallery playing videos (UI change).
- Upstream records stay as they were and are flagged `drop` instead of
  rewritten, because rewriting them would fabricate Kuchi records:
  `directory-submission/`, `agent-service/verification/`, `agent/traffic-dashboards.json`.
- The mascot, favicon and avatar images keep their bytes and filenames (UI
  unchanged) and are flagged `swap`. `site/mascot/README.md` says they're derived
  from the upstream owner's avatar, so replace them before a public launch.
- The h1 "AI clonable viral launch videos" was kept (UI copy). The new tagline
  is used in `package.json` only.
- `KUCHI_BASE_URL` is read at build time (`build_site.py`, `verify_site.py`).
  Worker and browser code holds the domain literally, as written by
  `rebrand.py` from `KUCHI_BASE_URL`. Change the domain by re-running it.
- §3.2 (preserve git history): this working copy had no `.git` directory, so
  history couldn't be checked here. Re-fork from GitHub, or graft this tree onto
  the upstream history, before publishing.

### Operator configuration removed from the fork

The upstream operator's Cloudflare `account_id` and `zone_id`s, D1
`database_id`, Clerk publishable key and PostHog project token were removed.
They're replaced by `zone_name`, `CLOUDFLARE_ACCOUNT_ID`, `REPLACE_WITH_…`
placeholders and an empty token (analytics off). See `MIGRATION.md` and
`.env.example`.
