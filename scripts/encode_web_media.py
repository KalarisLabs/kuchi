"""Encode web playback copies of hosted MP4s for the kuchi-bucket R2 media domain.

The originals in videos/ stay untouched (CONTRIBUTING.md: no re-edits) and are
kept out of git; entries whose original isn't on this machine are skipped. This
writes .media-web/assets/<id>.mp4: H.264 High, at most 1080p, capped bitrate,
moov atom first (faststart) so playback starts before the download finishes.
A copy is only re-encoded when its source changed. If encoding would not make
the file smaller, the original is copied instead.

    python scripts/encode_web_media.py [--force] [--jobs 2]
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
import argparse
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = os.environ.get('KUCHI_BASE_URL', 'https://kuchi.kalarislabs.com').rstrip('/')
OUT = ROOT / '.media-web'
STATE = OUT / 'state.json'


def encode(source: Path, target: Path) -> str:
    tmp = target.with_suffix('.tmp.mp4')
    command = [
        'ffmpeg', '-v', 'error', '-y', '-i', str(source),
        '-map', '0:v:0', '-map', '0:a:0?',
        # Never upscale; cap the long edge at 1080p-equivalent (1920 wide or 1080 tall).
        '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-maxrate', '3M', '-bufsize', '6M',
        '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
        '-movflags', '+faststart', str(tmp),
    ]
    subprocess.run(command, check=True)
    if tmp.stat().st_size >= source.stat().st_size:
        tmp.unlink()
        shutil.copy2(source, target)
        return 'copied (already efficient)'
    tmp.replace(target)
    return f'{source.stat().st_size / 1e6:.1f} MB -> {target.stat().st_size / 1e6:.1f} MB'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--jobs', type=int, default=2)
    args = parser.parse_args()

    videos = json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8'))
    state = {} if args.force or not STATE.exists() else json.loads(STATE.read_text())
    (OUT / 'assets').mkdir(parents=True, exist_ok=True)
    work = []
    for video in videos:
        url = urlparse(video['watchUrl'])
        if url.hostname != urlparse(BASE_URL).hostname:
            continue
        if not re.fullmatch(r'/assets/[0-9]+\.mp4', url.path):
            raise SystemExit(f"Invalid watchUrl for {video['id']}")
        source = ROOT / video['video']
        target = OUT / url.path.lstrip('/')
        if not source.exists():
            continue  # originals are not in git; that copy is already in R2
        stamp = f'{source.stat().st_size}:{int(source.stat().st_mtime)}'
        if target.exists() and state.get(url.path) == stamp:
            continue
        work.append((url.path, source, target, stamp))

    def run(item):
        path, source, target, stamp = item
        result = encode(source, target)
        print(f'{path}: {result}', flush=True)
        return path, stamp

    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        for path, stamp in pool.map(run, work):
            state[path] = stamp
            STATE.write_text(json.dumps(state, indent=1) + '\n')
    total_in = sum((ROOT / v['video']).stat().st_size for v in videos if (ROOT / v['video']).exists())
    total_out = sum(p.stat().st_size for p in (OUT / 'assets').glob('*.mp4'))
    print(f'Encoded {len(work)} file(s). Web copies: {total_out / 1e6:.0f} MB (originals {total_in / 1e6:.0f} MB).')


if __name__ == '__main__':
    main()
