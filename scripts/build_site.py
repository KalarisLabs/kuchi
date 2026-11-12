"""Build the frontend against the repository catalog and published reference media."""
from pathlib import Path
import argparse
import json
import shutil
import os
import re
from urllib.parse import urlparse, unquote
from build_daily_stats import update_daily_stats
from site_summary import render_summary
from verify_site import verify_site, verify_runtime_assets
from site_llms import render_llms

ROOT = Path(__file__).resolve().parent.parent
# All public URLs derive from these (see WHITELABEL.md section 6).
BASE_URL = os.environ.get('KUCHI_BASE_URL', 'https://kuchi.kalarislabs.com').rstrip('/')
REPO = os.environ.get('KUCHI_REPO', 'kalarislabs/kuchi')
# Optional media origin, e.g. https://kuchi-media.kalarislabs.com (the kuchi-bucket
# R2 bucket on a custom domain, edge-cached). When set, pages and videos.json
# point MP4s there instead of at the gallery Worker.
MEDIA_URL = os.environ.get('KUCHI_MEDIA_URL', '').rstrip('/')
parser = argparse.ArgumentParser(description=__doc__)
# The deploy root mirrors public URLs: the site is served from the domain root,
# so the asset layer can answer /videos.json etc. without invoking the Worker
# (static asset requests are free and don't count toward Worker quota).
parser.add_argument('--output', type=Path, default=ROOT / 'site-public')
# Where MP4s are staged for scripts/sync_media_r2.py. Defaults to --output.
parser.add_argument('--media-dir', type=Path, default=None)
ARGS = parser.parse_args()
OUT = ARGS.output.resolve()
MEDIA_DIR = (ARGS.media_dir or ARGS.output).resolve()
OUT.mkdir(parents=True, exist_ok=True)
shutil.copy2(update_daily_stats(), OUT / 'daily-stats.json')
for source in (ROOT / 'site').iterdir():
    if source.is_file():
        shutil.copy2(source, OUT / source.name)
    elif source.is_dir():
        shutil.copytree(source, OUT / source.name, dirs_exist_ok=True)
# _headers already sits at the deploy root (the output directory).
html = (OUT / 'index.html').read_text(encoding='utf-8').replace('"assets/', f'"{BASE_URL}/assets/')
if MEDIA_URL:
    html = re.sub(re.escape(BASE_URL) + r'(/assets/[0-9]+\.mp4)', lambda m: MEDIA_URL + m.group(1), html)
videos = json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8'))
if MEDIA_URL:
    # assets/<id>.jpg in the page means that reference's poster.
    posters = {str(v['id']).lstrip('0') or '0': Path(v['poster']).name for v in videos}
    html = re.sub(re.escape(BASE_URL) + r'/assets/([0-9]+)\.jpg',
                  lambda m: f"{MEDIA_URL}/previews/{posters.get(m.group(1).lstrip('0') or '0', m.group(1) + '.jpg')}", html)
(OUT / 'index.html').write_text(render_summary(html, videos), encoding='utf-8')
(OUT / 'llms.txt').write_text(render_llms(videos), encoding='utf-8')
for video in videos:
    video['video'] = video['watchUrl']
    if MEDIA_URL and urlparse(video['watchUrl']).hostname == urlparse(BASE_URL).hostname:
        video['video'] = MEDIA_URL + urlparse(video['watchUrl']).path
    if MEDIA_URL:
        video['poster'] = f"{MEDIA_URL}/previews/{Path(video['poster']).name}"
    else:
        video['poster'] = f'https://raw.githubusercontent.com/{REPO}/main/' + video['poster']
(OUT / 'videos.json').write_text(json.dumps(videos, ensure_ascii=False) + '\n')
# Media stays in the catalog repository. External canonical references are not
# duplicated into the static asset deployment.
sizes = {}
for video in json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8')):
    url = urlparse(video['watchUrl'])
    if url.hostname != urlparse(BASE_URL).hostname:
        continue
    if not re.fullmatch(r'/assets/[0-9]+\.mp4', url.path):
        raise ValueError('Invalid gallery media path')
    source = (ROOT / video['video']).resolve()
    if not source.is_relative_to((ROOT / 'videos').resolve()) or source.suffix != '.mp4':
        raise ValueError('Invalid source media path')
    target = MEDIA_DIR / unquote(url.path[1:])
    target.parent.mkdir(parents=True, exist_ok=True)
    same_file = target.exists() and target.stat().st_ino == source.stat().st_ino and target.stat().st_dev == source.stat().st_dev
    if not same_file:
        if target.exists():
            target.unlink()
        try:
            os.link(source, target)
        except OSError:
            shutil.copy2(source, target)
    sizes['/' + target.relative_to(MEDIA_DIR).as_posix()] = target.stat().st_size
(ROOT / 'site-worker/asset-sizes.json').write_text(json.dumps(sizes) + '\n')
verify_site(OUT)
verify_runtime_assets(OUT)
print(f'Built {OUT} with {len(videos)} published playable references.')
