"""Upload gallery media to the kuchi-bucket R2 bucket (served at KUCHI_MEDIA_URL).

Uploads web MP4 copies from .media-web/assets/ (run scripts/encode_web_media.py
first), posters from previews/ and storyboard sheets from .media-web/frames/
(run scripts/analyze_video.py first). Objects use the public path without the
leading /, e.g. assets/34.mp4, previews/<slug>.jpg and frames/34/overview.jpg.

Before uploading, each file is checked against the live media domain with a
cache-bypassing HEAD request; a file whose size already matches is skipped. That
makes the script safe to run on every commit (CI has no local upload state).

Needs wrangler auth: `npx wrangler login` locally, or CLOUDFLARE_API_TOKEN and
CLOUDFLARE_ACCOUNT_ID in CI.

    python scripts/sync_media_r2.py [--all] [--local] [--dry-run] [--only frames]
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import argparse
import json
import os
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parent.parent
BUCKET = json.loads((ROOT / 'site-worker/wrangler.json').read_text())['r2_buckets'][0]['bucket_name']
MEDIA_URL = os.environ.get('KUCHI_MEDIA_URL', 'https://kuchi-media.kalarislabs.com').rstrip('/')
BASE_URL = os.environ.get('KUCHI_BASE_URL', 'https://kuchi.kalarislabs.com').rstrip('/')
ATTEMPTS = 6
NPX = 'npx.cmd' if os.name == 'nt' else 'npx'


def live_size(key):
    # A unique query string misses the edge cache, so this reads R2 itself.
    request = Request(f'{MEDIA_URL}/{key}?check={uuid.uuid4().hex}', method='HEAD',
                      headers={'User-Agent': 'kuchi-media-sync'})
    try:
        with urlopen(request, timeout=20) as response:
            return int(response.headers.get('Content-Length', -1))
    except Exception:
        return None


def files():
    videos = json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8'))
    for video in videos:
        url = urlparse(video['watchUrl'])
        if url.hostname == urlparse(BASE_URL).hostname:
            key = url.path.lstrip('/')
            source = ROOT / '.media-web' / key
            if not source.exists():
                if live_size(key) is None:
                    raise SystemExit(f'{key} is not in R2 and {source} is missing; run scripts/encode_web_media.py first')
                continue  # already live; the original isn't on this machine
            yield key, source, 'video/mp4'
        poster = ROOT / video['poster']
        if poster.exists():
            yield f'previews/{poster.name}', poster, 'image/jpeg'
    breakdowns = ROOT / 'data/breakdowns.json'
    for breakdown in json.loads(breakdowns.read_text(encoding='utf-8')) if breakdowns.exists() else []:
        for sheet in breakdown['sheets']:
            source = ROOT / '.media-web' / sheet['file']
            if not source.exists():
                if live_size(sheet['file']) is None:
                    raise SystemExit(f"{sheet['file']} is not in R2 and {source} is missing; run scripts/analyze_video.py {breakdown['id']}")
                continue
            yield sheet['file'], source, 'image/jpeg'


def sync(item, args):
    """Uploads one file unless it is already live. Returns 'uploaded' or 'skipped'."""
    key, source, content_type = item
    size = source.stat().st_size
    if not (args.all or args.local) and live_size(key) == size:
        return 'skipped'
    if args.dry_run:
        print(f'Would upload {key} ({size / 1e6:.1f} MB)', flush=True)
        return 'uploaded'
    command = [NPX, 'wrangler', 'r2', 'object', 'put', f'{BUCKET}/{key}', '--config', 'site-worker/wrangler.json',
               '--file', str(source), '--content-type', content_type,
               '--cache-control', 'public, max-age=86400', '--local' if args.local else '--remote']
    for attempt in range(ATTEMPTS):
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
        if result.returncode == 0:
            break
        print(f'Retrying {key} ({attempt + 1}/{ATTEMPTS - 1}): {result.stderr.strip()[-200:]}', flush=True)
        time.sleep(min(3 * (attempt + 1), 15))
    else:
        raise SystemExit(f'Could not upload {key}; rerun this script to resume.')
    print(f'Uploaded {key} ({size / 1e6:.1f} MB)', flush=True)
    return 'uploaded'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--all', action='store_true', help='upload even when the live size matches')
    parser.add_argument('--local', action='store_true', help='write to the local wrangler dev bucket')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--only', choices=['assets', 'previews', 'frames'], help='sync one kind of file')
    parser.add_argument('--workers', type=int, default=6)
    args = parser.parse_args()
    items = [item for item in files() if not args.only or item[0].startswith(args.only + '/')]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda item: sync(item, args), items))
    uploaded, skipped = results.count('uploaded'), results.count('skipped')
    print(f'{"Planned" if args.dry_run else "Uploaded"} {uploaded}, already live {skipped}, bucket {BUCKET}.')


if __name__ == '__main__':
    main()
