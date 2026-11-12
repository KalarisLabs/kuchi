"""Add one launch video to the catalog from its public X post.

Does the mechanical part of CONTRIBUTING.md so a curator (human or agent) only
supplies editorial judgement:

  1. Rejects the post if its source URL is already in data/videos.json.
  2. Downloads the post's highest-quality video with yt-dlp to videos/<slug>.mp4
     (no re-edit, no crop, no upscale).
  3. Reads width, height, duration and audio with ffprobe.
  4. Writes a poster frame to previews/<slug>.jpg (JPEG, under 250 KB).
  5. Appends a schema-complete entry with the next id, URLs, remake prompt and
     snapshot date. Stats come only from the post metadata yt-dlp returns or
     from --meta; anything unknown stays null. Nothing is estimated.

    python scripts/add_video.py --source https://x.com/<handle>/status/<id> --meta meta.json [--dry-run]

meta.json carries the editorial fields (see agent/CURATOR.md):
    {"slug": "...", "title": "Brand — What it shows", "category": "AI launch",
     "styles": ["UI motion"], "readmeCategory": "clean-ui-data-graphics",
     "notes": ["..."], "impressions": null, "bookmarks": null, "followers": null}
"""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import argparse
import json
import os
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = os.environ.get('KUCHI_BASE_URL', 'https://kuchi.kalarislabs.com').rstrip('/')
CATALOG = ROOT / 'data/videos.json'
CATEGORIES = {'Launch video', 'AI launch', 'Startup launch', 'Feature clip', 'Tool demo'}
STYLES = {'3D animation', 'Abstract motion', 'Character animation', 'Charts', 'Cursor demo', 'Data graphics',
          'Device motion', 'Image collage', 'Kinetic type', 'Logo motion', 'Mixed media', 'Photo collage',
          'Terminal', 'UI motion'}
README_CATEGORIES = {'device-ui-transformations', 'clean-ui-data-graphics', 'pastel-ui-cursor-demos',
                     'typography-abstract-motion', 'dark-gradient-mixed-media', 'illustrated-mascot-stories'}
STAT_FIELDS = ('impressions', 'views', 'likes', 'bookmarks', 'reposts', 'replies', 'quotes')
MAX_POSTER_BYTES = 250_000


def canonical(url):
    match = re.match(r'https?://(?:www\.|mobile\.)?(?:x|twitter)\.com/([^/]+)/status/(\d+)', url.strip())
    if not match:
        raise SystemExit(f'Not an X post URL: {url}')
    return f'https://x.com/{match.group(1)}/status/{match.group(2)}', match.group(2)


def yt_dlp(*args):
    for base in (['yt-dlp'], [sys.executable, '-m', 'yt_dlp']):
        try:
            return subprocess.run(base + list(args), check=True, capture_output=True, text=True).stdout
        except FileNotFoundError:
            continue
    raise SystemExit('yt-dlp is not installed (pip install yt-dlp)')


def probe(path):
    data = json.loads(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration',
         '-of', 'json', str(path)], check=True, capture_output=True, text=True).stdout)
    video = next(s for s in data['streams'] if s['codec_type'] == 'video')
    return {'width': video['width'], 'height': video['height'],
            'seconds': round(float(data['format']['duration']), 2),
            'hasAudio': any(s['codec_type'] == 'audio' for s in data['streams'])}


def ratio(width, height):
    value = width / height
    for name, target in (('16:9', 16 / 9), ('9:16', 9 / 16), ('1:1', 1), ('4:5', 4 / 5), ('4:3', 4 / 3), ('3:2', 3 / 2)):
        if abs(value - target) < 0.03:
            return name
    return f'{width}:{height}'


def poster(video, target, seconds):
    for quality in (3, 5, 8, 12):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{seconds / 3:.2f}', '-i', str(video), '-frames:v', '1',
                        '-vf', "scale='min(1280,iw)':-2", '-q:v', str(quality), str(target)], check=True)
        if target.stat().st_size < MAX_POSTER_BYTES:
            return
    raise SystemExit(f'Could not get {target} under 250 KB')


def stat(value):
    return None if value is None else int(value)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', required=True)
    parser.add_argument('--meta', type=Path, required=True)
    parser.add_argument('--dry-run', action='store_true', help='validate and print the entry; write nothing')
    args = parser.parse_args()

    source, post_id = canonical(args.source)
    meta = json.loads(args.meta.read_text(encoding='utf-8'))
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    if any(canonical(v['source'])[1] == post_id for v in catalog if 'status/' in (v.get('source') or '')):
        raise SystemExit(f'Already in the collection: {source}')

    errors = []
    slug = meta.get('slug', '')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        errors.append('slug must be lowercase kebab-case')
    if any(v['slug'] == slug for v in catalog):
        errors.append(f'slug {slug} is taken')
    if ' — ' not in meta.get('title', ''):
        errors.append('title must look like "Brand — What it shows"')
    if meta.get('category') not in CATEGORIES:
        errors.append(f'category must be one of {sorted(CATEGORIES)}')
    styles = meta.get('styles') or []
    if not 1 <= len(styles) <= 3 or not set(styles) <= STYLES:
        errors.append(f'styles: 1-3 of {sorted(STYLES)}')
    if meta.get('readmeCategory') not in README_CATEGORIES:
        errors.append(f'readmeCategory must be one of {sorted(README_CATEGORIES)}')
    notes = meta.get('notes') or []
    if not 1 <= len(notes) <= 3:
        errors.append('notes: 1-3 descriptive sentences')
    if errors:
        raise SystemExit('Invalid meta:\n  - ' + '\n  - '.join(errors))

    info = json.loads(yt_dlp('--dump-single-json', '--no-warnings', source))
    text = (info.get('description') or '').strip()
    video_path = ROOT / 'videos' / f'{slug}.mp4'
    poster_path = ROOT / 'previews' / f'{slug}.jpg'
    if not args.dry_run:
        yt_dlp('-f', 'bv*[vcodec^=avc1]+ba/b[vcodec^=avc1]/bv*+ba/b', '--merge-output-format', 'mp4',
               '--no-playlist', '--no-warnings', '-o', str(video_path), source)
        media = probe(video_path)
        poster(video_path, poster_path, media['seconds'])
    else:
        media = {'width': info.get('width') or 0, 'height': info.get('height') or 1,
                 'seconds': info.get('duration') or 0, 'hasAudio': True}

    new_id = str(max(int(v['id']) for v in catalog) + 1)
    timestamp = info.get('timestamp')
    pacific = ZoneInfo('America/Los_Angeles')
    entry = {
        'id': new_id,
        'title': meta['title'],
        'originalTitle': text.splitlines()[0] if text else meta['title'],
        'account': '@' + (info.get('uploader_id') or source.split('/')[3]).lstrip('@'),
        'followers': stat(meta.get('followers')),
        'category': meta['category'],
        'seed': None,
        'impressions': stat(meta.get('impressions')),
        'views': stat(meta.get('views', info.get('view_count'))),
        'likes': stat(meta.get('likes', info.get('like_count'))),
        'bookmarks': stat(meta.get('bookmarks')),
        'reposts': stat(meta.get('reposts', info.get('repost_count'))),
        'replies': stat(meta.get('replies', info.get('comment_count'))),
        'quotes': stat(meta.get('quotes')),
        'originalSeconds': media['seconds'],
        'clipSeconds': media['seconds'],
        'excerpt': False,
        'ratio': ratio(media['width'], media['height']),
        'date': (datetime.fromtimestamp(timestamp, pacific).date().isoformat() if timestamp
                 else meta.get('date')),
        'width': media['width'],
        'height': media['height'],
        'hasAudio': media['hasAudio'],
        'source': source,
        'quote': text,
        'styles': styles,
        'notes': notes,
        'originalNotes': [],
        'flag': '',
        'video': f'videos/{slug}.mp4',
        'poster': f'previews/{slug}.jpg',
        'snapshotDate': datetime.now(pacific).date().isoformat(),
        'collectionSource': None,
        'referenceGroup': None,
        'scores': None,
        'benchmark': None,
        'slug': slug,
        'readmeCategory': meta['readmeCategory'],
        'watchUrl': f'{BASE_URL}/assets/{new_id}.mp4',
        'detailUrl': f'{BASE_URL}/#video-{new_id}',
        'remakePrompt': f"Remake this video's motion and vibe for my product:\n{source}",
        'githubVideoUrl': '',
        'mediaQuality': None,
    }
    if entry['date'] is None:
        raise SystemExit('Post date unknown; pass "date" (YYYY-MM-DD) in meta')
    print(json.dumps(entry, indent=2, ensure_ascii=False))
    if args.dry_run:
        print('Dry run: nothing written.')
        return
    catalog.append(entry)
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Added #{new_id} {slug}: {video_path.relative_to(ROOT)}, {poster_path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
