"""Build the visual, prompt-first README from the attributed video metadata."""
from pathlib import Path
import json
from build_daily_stats import update_daily_stats

ROOT = Path(__file__).resolve().parent.parent
VIDEOS = json.loads((ROOT / 'data/videos.json').read_text())
GROUPS = [
    ('device-ui-transformations', 'A. Device & UI Transformations', 'Phones, floating windows, camera moves, and interfaces that change shape.'),
    ('clean-ui-data-graphics', 'B. Clean UI, Data & Graphics', 'One focal point per scene: charts, code cards, simple geometry, and useful product actions.'),
    ('pastel-ui-cursor-demos', 'C. Pastel UI & Cursor Demos', 'Product stories driven by clear interfaces, oversized cursors, and quick visual payoffs.'),
    ('typography-abstract-motion', 'D. Typography & Abstract Motion', 'Kinetic type, counters, glowing outlines, rings, and waveform-led product stories.'),
    ('dark-gradient-mixed-media', 'E. Dark, Gradient & Mixed Media', 'Dark interfaces, floating devices, image collage, and product demos mixed with people or generated footage.'),
    ('illustrated-mascot-stories', 'F. Illustrated Mascot Stories', 'Character-led 2D stories with illustrated environments and product interfaces.'),
]

def duration(seconds):
    total = round(seconds)
    return f'{total // 60}:{total % 60:02d}'

def metric(number):
    return f'{number:,}' if number is not None else '—'

def compact(number):
    if number is None:
        return '—'
    return f'{number / 1_000_000:.2f}M' if number >= 1_000_000 else f'{number / 1000:.1f}K' if number >= 1000 else str(number)

def prompt(video):
    return f"Remake this video's motion and vibe for my product:\n{video['source']}"

def video_embed(video):
    # GitHub turns uploaded attachment URLs into native players in Markdown.
    url = video.get('githubVideoUrl', '')
    if url.startswith('https://github.com/user-attachments/assets/'):
        return url
    # Until the MP4 is uploaded as a GitHub attachment, show the poster and
    # link it to the playable file on the live site.
    return f"[![▶ Watch {video['title']}]({video['poster']})]({video['watchUrl']})"

def stats(video):
    v = video
    rows = [
        ('Posting account', v['account']), ('Post date', v['date']),
        ('Stats snapshot (PT)', v['snapshotDate']), ('Post impressions', metric(v['impressions'])),
        ('Video plays', metric(v['views'])), ('Likes', metric(v['likes'])),
        ('Bookmarks', metric(v['bookmarks'])), ('Reposts', metric(v['reposts'])),
        ('Replies', metric(v['replies'])), ('Quotes', metric(v['quotes'])),
        ('Account followers', metric(v['followers'])),
        ('Original duration', duration(v['originalSeconds'])),
        ('Included file', duration(v['clipSeconds']) + (' — excerpt' if v['excerpt'] else ' — full clip')),
        ('Aspect ratio', v['ratio']), ('Reference resolution', f"{v['width']} × {v['height']}"),
        ('Audio track', 'Present' if v['hasAudio'] else 'None'),
    ]
    return '\n'.join(['| Metadata | Value |', '| --- | --- |'] + [f'| {key} | {value} |' for key, value in rows])

parts = [f'''<p align="center">
  <a href="https://kuchi.kalarislabs.com/"><img src="assets/kuchi-banner.jpg" alt="Kuchi by Kalaris Labs: AI for viral launch videos" width="100%"></a>
</p>

<h1 align="center"><img src="web/public/favicon-180.png" alt="Kuchi popcorn icon" width="36" height="36" align="absmiddle"> Kuchi</h1>

<p align="center"><b>AI for viral launch videos.</b><br>Real launch videos, measured frame by frame, that your AI agent can remake for your product.</p>

<p align="center">
  <a href="https://kuchi.kalarislabs.com/">Website</a> ·
  <a href="agent/README.md">Connect your agent</a> ·
  <a href="#the-collection">The collection</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

<p align="center">
  <a href="#the-collection"><img alt="Video references" src="https://img.shields.io/badge/video_references-{len(VIDEOS)}-black"></a>
  <a href="agent/README.md"><img alt="MCP server" src="https://img.shields.io/badge/MCP-no_sign--in-blue"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
  <a href="https://awesome.re"><img alt="Awesome" src="https://awesome.re/badge.svg"></a>
</p>

## What is Kuchi?

Kuchi is a library of launch videos that spread, built to be copied in spirit. Each one is a template: Kuchi measures its exact shots, timing and transitions, and your agent copies that motion and taste and fills it with your own product, assets and copy. It never reuses the reference's brand, footage or music.

For founders, designers and builders making their next product launch. Browse a style, watch a reference, then hand it to your agent.

Every reference has a playable video, a frame-by-frame breakdown, a remake prompt and credit to the original creator. Kuchi measures and plans; your agent does the seeing and the building. Kuchi does not render video.

## How a remake works

| Step | What happens |
| --- | --- |
| 1. Find | Describe your product. Kuchi returns a short ranked list of references, or pick one on the [website](https://kuchi.kalarislabs.com/) and paste the link. |
| 2. Study | The agent reads the reference's breakdown: every shot with its exact start, end, entrance and colors, plus storyboard frames. |
| 3. Plan | You supply your product details and assets. Kuchi returns a frame-timed blueprint for your target length. |
| 4. Build | The agent builds the video with your tools: code, motion graphics or generative video. |
| 5. Check | Kuchi flags reused brand words, borrowed assets, placeholders and timing gaps before you ship. |

## Connect your agent

Add the MCP server `https://kuchi.kalarislabs.com/mcp` (Streamable HTTP, read-only, no sign-in), or paste this into your agent:

```text
Connect the Kuchi MCP server at https://kuchi.kalarislabs.com/mcp (Streamable HTTP, no sign-in) and confirm it works by listing its tools.
```

In Claude Code, install the plugin (MCP server + skill):

```text
/plugin install kuchi --marketplace KalarisLabs/kuchi
```

[Setup for Claude, ChatGPT, Codex, Cursor & more](agent/README.md) · [Skill file](agent/SKILL.md) · [Plugin](plugin/launch-archive)

New videos reach connected agents within a minute, with no reinstall. Without MCP, the same data is at [`/agent/catalog.json`](https://kuchi.kalarislabs.com/agent/catalog.json) and [`/agent/workflow.md`](https://kuchi.kalarislabs.com/agent/workflow.md).

## What is in this repository

| Path | What it is |
| --- | --- |
| [`web/`](web) | The Kuchi website (Astro, deployed as a Cloudflare Worker) |
| [`agent-service/`](agent-service) | The MCP server and `/agent` routes |
| [`agent/`](agent) | Setup guide, the remake workflow and the agent skill |
| [`plugin/launch-archive/`](plugin/launch-archive) | The Claude Code and Codex plugin (MCP server + skill) |
| [`data/`](data) | The catalog ([`videos.json`](data/videos.json)), frame-by-frame breakdowns and daily stats |
| [`scripts/`](scripts) | Tools to add a video, analyze it, build this README and upload media |
| [`assets/`](assets) | Images used by this README |

<a id="the-collection"></a>

## The collection

Every reference below has an inline player, the video file, a remake prompt and credit to the original creator. Video files are not stored in this repository; they are served from the site's media domain.

## Table of Contents
''']
for key, title, _ in GROUPS:
    entries = [v for v in VIDEOS if v['readmeCategory'] == key]
    parts.append(f'### [{title}](#{key})\n')
    parts.extend(f"- [{v['title']}](#{v['slug']})" for v in entries)
    parts.append('')
parts.append('---\n')

for key, title, description in GROUPS:
    parts.append(f'<a id="{key}"></a>\n\n## {title}\n\n{description}\n')
    for v in (x for x in VIDEOS if x['readmeCategory'] == key):
        v['remakePrompt'] = prompt(v)
        included = duration(v['clipSeconds']) + (f" excerpt of {duration(v['originalSeconds'])}" if v['excerpt'] else '')
        parts.append(f'''<a id="{v['slug']}"></a>

### {v['title']}

{video_embed(v)}

**{included} · {v['ratio']} · {compact(v['impressions'])} impressions · {compact(v['views'])} plays**

[▶ Watch video]({v['watchUrl']}) · [MP4 file]({v['watchUrl']}) · [Browse with stats]({v['detailUrl']})

{' '.join(v['notes'])}

```text
{v['remakePrompt']}
```

*Source: [{v['account']}]({v['source']}) · {v['date']}*

<details>
<summary>Metadata & stats</summary>

{stats(v)}

</details>

---
''')

parts.append('''## How to use these prompts

1. Pick a video and copy its prompt, including the Twitter/X source link.
2. Paste it into your AI coding or video tool.
3. Add your product details and assets.

## Data & source notes

- Metrics are historical snapshots (Pacific time). Each entry records its own date; counts are not live. Unavailable counts appear as —.
- Impressions describe post exposure, not video plays. They do not establish organic reach or exclude paid promotion.
- Posting-account follower counts may describe a founder or employee rather than a company.
- Reference files use high-resolution source footage, with web-optimized H.264 encodes where needed. Eight entries are excerpts; their original durations are shown. Stats describe the full source posts.
- Style notes are based on sampled frames and supplied metadata. Style categories are editorial judgments.
- Full metadata, original Chinese notes, source links, and prompts are in [data/videos.json](data/videos.json).

## Contributing

Know a launch video worth cloning? [Suggest it in an issue](https://github.com/kalarislabs/kuchi/issues/new?template=suggest-video.yml) with just the X link, or add it yourself in a PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for what fits the collection, the entry format and the checks to run.

## Deploying (maintainers)

Pushing to `main` deploys everything. Cloudflare Workers Builds rebuilds both Workers; GitHub Actions only runs the checks.

| Part | What it serves | Source |
| --- | --- | --- |
| Gallery Worker (`kuchi-site`) | The site, `videos.json`, the analytics relay | `web/` |
| Agent service (`kuchi-agent`) | MCP at `/mcp`, `/agent/*` | `agent-service/` |
| Media bucket (`kuchi-bucket`) | MP4s and storyboard sheets at `kuchi-media.kalarislabs.com` | Uploaded with `scripts/sync_media_r2.py` |

Video files and storyboard sheets are third-party content and are not in this repository. Upload them before you push, or the checks fail:

```bash
python scripts/encode_web_media.py     # web copies of new videos
python scripts/analyze_video.py        # frame-by-frame breakdowns and storyboard sheets
python scripts/sync_media_r2.py        # uploads what is new
```

The catalog, breakdowns, manifest and workflow are read live from `main`, so data-only changes reach connected agents within a minute.

**After deploying**, run `npm --prefix agent-service run verify:live`. It checks the MCP server with two client versions, the storyboard sheets and the rate limits. More detail: [agent/README.md](agent/README.md) and [agent/CURATOR.md](agent/CURATOR.md).

## License & credits

Original curation, prompts, and repository code are [MIT licensed](LICENSE). Third-party videos, previews, product UI, logos, and branding remain with their respective owners; the MIT license does not grant rights to those assets. Every video links to its original post.
''')

assert VIDEOS and len(VIDEOS) == len({v['slug'] for v in VIDEOS})
assert len([v for key, _, _ in GROUPS for v in VIDEOS if v['readmeCategory'] == key]) == len(VIDEOS)
# MP4s are git-ignored and served from R2, so only posters are checked here.
for video in VIDEOS:
    assert (ROOT / video['poster']).is_file(), video['poster']
(ROOT / 'README.md').write_bytes('\n'.join(parts).encode('utf-8'))
(ROOT / 'data/videos.json').write_bytes((json.dumps(VIDEOS, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
print(f'Built README with {len(VIDEOS)} previews, prompts, MP4 links, source credits, and metadata tables.')

update_daily_stats()
