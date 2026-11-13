"""Measure every catalog video frame by frame and write data/breakdowns.json.

For each video this decodes every frame of the file agents are given (the web
copy in .media-web/assets, the same bytes R2 serves), then records:

  - exact facts: fps, frame count, duration, size
  - shots: where the picture changes (hard cut, blank frame, animated transition,
    or motion resuming after a hold), with frame-accurate start and end
  - per shot: motion level, tone, dominant colors
  - per second: motion and loudness, as digit strings 0-9
  - storyboard sheets: labelled JPEG grids of real frames, one overview (one
    frame per shot) and detail sheets (evenly spaced frames)

Every label here comes from a fixed rule on measured numbers, so a rerun gives
the same result. Descriptions of what a shot shows are not measured: they live
in data/shot_labels.json and are written by the curator after viewing the sheets.

    python scripts/analyze_video.py            # videos that have no breakdown yet
    python scripts/analyze_video.py 34 51      # these ids
    python scripts/analyze_video.py --all      # everything

Sheets are written to .media-web/frames/<id>/; scripts/sync_media_r2.py uploads them.
"""
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import argparse
import json
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/breakdowns.json'
MEDIA = ROOT / '.media-web'
BASE_HOST = 'kuchi.kalarislabs.com'
SCHEMA = 1

# Analysis frame size. Small on purpose: these numbers describe whole-frame change.
AW, AH = 64, 36

# Fixed rules. Changing one changes labels across the catalog: rerun with --all.
CUT_MIN = 0.045          # mean change (0-1) a single frame needs to count as a cut
CUT_RATIO = 3.0          # and how many times larger than its neighbours
BLANK_STD = 0.02         # a frame this flat is blank
TRANSITION_MIN = 0.03    # sustained change that marks an animated transition
TRANSITION_FRAMES = 4
TRANSITION_JUMP = 0.12   # the picture before and after must differ this much
HOLD_MOTION = 0.003      # share of the frame changing; below this the picture is holding still
HOLD_SECONDS = 0.5
LONG_SHOT = 6.0          # shots longer than this are split at their holds
MIN_SHOT = 0.3
PIXEL_CHANGE = 0.04      # a pixel counts as moving when it changes this much in one frame
MOTION_LEVELS = [(0.004, 'still'), (0.03, 'low'), (0.12, 'medium'), (math.inf, 'high')]  # share of the frame moving
PACE_LEVELS = [(1.5, 'slow'), (3.5, 'medium'), (7.0, 'fast'), (math.inf, 'rapid')]  # shot changes per 10 s
MAX_DETAIL_FRAMES = 54
MAX_OVERVIEW = 24


def run(args, **kw):
    return subprocess.run(args, capture_output=True, check=True, **kw)


def probe(path):
    out = run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,r_frame_rate,width,height:format=duration',
               '-of', 'json', str(path)]).stdout
    info = json.loads(out)
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    num, den = (int(x) for x in video['r_frame_rate'].split('/'))
    return {'fps': num / den, 'width': video['width'], 'height': video['height'],
            'duration': float(info['format']['duration']),
            'audio': any(s['codec_type'] == 'audio' for s in info['streams'])}


def decode_small(path):
    """Every frame as a 64x36 RGB array scaled 0-1."""
    raw = run(['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'scale={AW}:{AH}:flags=area,format=rgb24',
               '-fps_mode', 'passthrough', '-f', 'rawvideo', '-']).stdout
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, AH, AW, 3)
    return frames.astype(np.float32) / 255.0


def loudness_per_second(path, seconds):
    raw = run(['ffmpeg', '-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-']).stdout
    pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    out = []
    for s in range(max(1, math.ceil(seconds))):
        chunk = pcm[s * 8000:(s + 1) * 8000]
        out.append(float(np.sqrt(np.mean(chunk ** 2))) if len(chunk) else 0.0)
    return out


def digits(values, top):
    """Values as a string of digits 0-9, where 9 is `top` or more."""
    return ''.join(str(min(9, int(round(9 * min(v, top) / top)))) if top else '0' for v in values)


def level(value, table):
    return next(name for limit, name in table if value < limit)


def boundaries(frames, fps):
    """Frame indices where a new shot starts, each with how the picture got there."""
    n = len(frames)
    luma = frames.mean(axis=3)
    diff = np.zeros(n, dtype=np.float32)
    diff[1:] = np.abs(frames[1:] - frames[:-1]).mean(axis=(1, 2, 3))
    area = np.zeros(n, dtype=np.float32)  # share of the frame that moved
    area[1:] = (np.abs(frames[1:] - frames[:-1]).max(axis=3) > PIXEL_CHANGE).mean(axis=(1, 2))
    flat = luma.reshape(n, -1)
    blank = flat.std(axis=1) < BLANK_STD
    found = {}

    # Hard cuts: one frame changes far more than the frames around it.
    for i in range(1, n):
        if diff[i] < CUT_MIN:
            continue
        near = np.concatenate([diff[max(1, i - 6):i], diff[i + 1:i + 7]])
        if not len(near) or diff[i] >= CUT_RATIO * max(float(near.max()), 1e-4):
            found[i] = 'cut'

    # Blank frames (a fade through black or white, or a cleared canvas).
    i = 0
    while i < n:
        if blank[i]:
            j = i
            while j + 1 < n and blank[j + 1]:
                j += 1
            if i > 0 and j < n - 1 and (j - i + 1) >= 2:
                tone = 'black' if flat[i:j + 1].mean() < 0.5 else 'white'
                found.setdefault(j + 1, f'blank_{tone}')
            i = j + 1
        else:
            i += 1

    # Animated transitions: sustained change joining two different pictures.
    i = 1
    while i < n:
        if diff[i] >= TRANSITION_MIN:
            j = i
            while j + 1 < n and diff[j + 1] >= TRANSITION_MIN:
                j += 1
            if j - i + 1 >= TRANSITION_FRAMES and i >= 2 and j + 2 < n:
                jump = float(np.abs(frames[j + 1] - frames[i - 1]).mean())
                if jump >= TRANSITION_JUMP and not any(k in found for k in range(i - 1, j + 3)):
                    found[j + 1] = 'transition'
            i = j + 1
        else:
            i += 1

    # Long shots: split where motion resumes after the longest holds.
    hold = max(2, int(round(HOLD_SECONDS * fps)))
    changed = True
    while changed:
        changed = False
        marks = sorted([0, *found, n])
        for a, b in zip(marks, marks[1:]):
            if (b - a) / fps <= LONG_SHOT:
                continue
            best = None
            i = a + int(MIN_SHOT * fps) + 1
            while i < b:
                if area[i] < HOLD_MOTION:
                    j = i
                    while j + 1 < b and area[j + 1] < HOLD_MOTION:
                        j += 1
                    resume = j + 1
                    if j - i + 1 >= hold and resume < b - int(MIN_SHOT * fps) and resume - a > int(MIN_SHOT * fps):
                        # Prefer the hold nearest the middle, so halves stay balanced.
                        score = (j - i + 1) - abs(resume - (a + b) / 2) / fps
                        if best is None or score > best[0]:
                            best = (score, resume)
                    i = j + 1
                else:
                    i += 1
            if best:
                found[best[1]] = 'hold'
                changed = True

    # Drop boundaries that would leave a shot shorter than MIN_SHOT.
    kept, last = {}, 0
    for i in sorted(found):
        if (i - last) / fps >= MIN_SHOT and (n - i) / fps >= MIN_SHOT:
            kept[i] = found[i]
            last = i
    return kept, area


def palette(image, colors=5):
    small = image.convert('RGB').resize((96, 54))
    quant = small.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    counts = sorted(quant.getcolors(), reverse=True)
    pal = quant.getpalette()
    total = sum(c for c, _ in counts)
    return [['#%02x%02x%02x' % tuple(pal[i * 3:i * 3 + 3]), round(100 * c / total)] for c, i in counts if c / total >= 0.03]


def grab(path, indices, width):
    """Exact frames by index, scaled to `width`, as PIL images keyed by index."""
    indices = sorted(set(indices))
    images = {}
    for start in range(0, len(indices), 60):
        part = indices[start:start + 60]
        select = '+'.join(f'eq(n\\,{i})' for i in part)
        raw = run(['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f"select='{select}',scale={width}:-2:flags=lanczos,format=rgb24",
                   '-fps_mode', 'passthrough', '-f', 'rawvideo', '-']).stdout
        height = len(raw) // (len(part) * width * 3)
        for k, i in enumerate(part):
            images[i] = Image.frombytes('RGB', (width, height), raw[k * width * height * 3:(k + 1) * width * height * 3])
    return images


def clock(t):
    return f'{int(t // 60)}:{t % 60:04.1f}'


def sheet(images, cells, cols, title, target):
    """A labelled grid of frames. cells: [(frame index, seconds, shot number)]."""
    font = ImageFont.load_default(size=20)
    small = ImageFont.load_default(size=16)
    w, h = images[cells[0][0]].size
    bar, gap, head = 30, 8, 34
    rows = math.ceil(len(cells) / cols)
    canvas = Image.new('RGB', (cols * w + (cols + 1) * gap, head + rows * (h + bar + gap) + gap), (18, 18, 20))
    draw = ImageDraw.Draw(canvas)
    draw.text((gap, 8), title, fill=(160, 160, 168), font=small)
    for k, (index, t, shot) in enumerate(cells):
        x = gap + (k % cols) * (w + gap)
        y = head + (k // cols) * (h + bar + gap)
        canvas.paste(images[index], (x, y))
        draw.text((x + 2, y + h + 3), f'{clock(t)}  shot {shot}', fill=(235, 235, 240), font=font)
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, 'JPEG', quality=82, optimize=True, progressive=True)
    return canvas.size


def source_file(video):
    url = urlparse(video['watchUrl'])
    if url.hostname == BASE_HOST:
        key = url.path.lstrip('/')
        path = MEDIA / key
        if not path.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            fetch(f'https://kuchi-media.kalarislabs.com/{key}', path)
        return path, key
    path = MEDIA / 'external' / f"{video['id']}.mp4"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        fetch(video['watchUrl'], path)
    return path, video['watchUrl']


def fetch(url, path):
    with urlopen(Request(url, headers={'User-Agent': 'kuchi-analyze'}), timeout=120) as response:
        path.write_bytes(response.read())


def analyze(video):
    vid = video['id']
    path, served = source_file(video)
    info = probe(path)
    fps = info['fps']
    frames = decode_small(path)
    n = len(frames)
    seconds = n / fps
    marks, area = boundaries(frames, fps)
    starts = [0, *sorted(marks)]
    ends = [*starts[1:], n]
    luma = frames.mean(axis=(1, 2, 3))

    ratio = info['width'] / info['height']
    cols, cell_w = (3, 640) if ratio >= 1.25 else (4, 480) if ratio >= 0.75 else (6, 320)
    per_sheet = cols * (3 if cols == 3 else 2)

    # Detail frames: evenly spaced, plus the middle of any shot the grid misses.
    step = max(0.5, seconds / MAX_DETAIL_FRAMES)
    grid = sorted({min(n - 1, int(round((k + 0.5) * step * fps))) for k in range(int(seconds / step))})
    mids = [min(e - 1, s + max(1, (e - s) // 2)) for s, e in zip(starts, ends)]
    for (s, e), mid in zip(zip(starts, ends), mids):
        if not any(s <= g < e for g in grid):
            grid.append(mid)
    grid = sorted(set(grid))

    overview_idx = mids
    if len(mids) > MAX_OVERVIEW:  # keep the longest shots, in order
        longest = sorted(range(len(mids)), key=lambda k: starts[k] - ends[k])[:MAX_OVERVIEW]
        overview_idx = [mids[k] for k in sorted(longest)]
    images = grab(path, [*grid, *mids], cell_w)

    shot_of = lambda i: next(k + 1 for k, (s, e) in enumerate(zip(starts, ends)) if s <= i < e)
    folder = MEDIA / 'frames' / f'{vid:02d}'
    for old in folder.glob('*.jpg'):
        old.unlink()
    title = f"Kuchi reference {vid} · {clock(seconds)} · {fps:g} fps · {len(starts)} shots · real frames, timestamps are exact"
    sheets = []
    cells = [(i, i / fps, shot_of(i)) for i in overview_idx]
    ocols = min(cols + 1, max(2, math.ceil(math.sqrt(len(cells)))))
    small = {i: images[i].resize((cell_w * 3 // 4, images[i].size[1] * 3 // 4), Image.LANCZOS) for i in overview_idx}
    size = sheet(small, cells, ocols, title + ' · one frame per shot', folder / 'overview.jpg')
    sheets.append({'file': f'frames/{vid:02d}/overview.jpg', 'kind': 'overview', 'width': size[0], 'height': size[1],
                   'cells': [[round(t, 2), s] for _, t, s in cells]})
    for page, start in enumerate(range(0, len(grid), per_sheet), 1):
        cells = [(i, i / fps, shot_of(i)) for i in grid[start:start + per_sheet]]
        name = f'detail-{page}.jpg'
        size = sheet(images, cells, cols, f'{title} · detail {page}', folder / name)
        sheets.append({'file': f'frames/{vid:02d}/{name}', 'kind': 'detail', 'width': size[0], 'height': size[1],
                       'cells': [[round(t, 2), s] for _, t, s in cells]})

    shots = []
    for k, (s, e) in enumerate(zip(starts, ends)):
        motion = float(area[s + 1:e].mean()) if e - s > 1 else 0.0
        tone = float(luma[s:e].mean())
        shots.append({
            'n': k + 1, 'start_s': round(s / fps, 3), 'end_s': round(e / fps, 3), 'start_frame': s, 'end_frame': e - 1,
            'enters': 'start' if k == 0 else marks[s],
            'motion': level(motion, MOTION_LEVELS),
            'tone': 'dark' if tone < 0.35 else 'light' if tone > 0.65 else 'mid',
            'palette': palette(images[mids[k]])
        })

    changes = len(starts) - 1
    weights = np.array([e - s for s, e in zip(starts, ends)], dtype=np.float32)
    dark = float(sum(w for w, shot in zip(weights, shots) if shot['tone'] == 'dark') / weights.sum())
    light = float(sum(w for w, shot in zip(weights, shots) if shot['tone'] == 'light') / weights.sum())
    per_second = [float(area[int(s * fps) + 1:int((s + 1) * fps) + 1].mean()) if int(s * fps) + 1 < n else 0.0 for s in range(max(1, math.ceil(seconds)))]
    result = {
        'id': vid, 'schema': SCHEMA, 'file': served,
        'fps': round(fps, 3), 'frames': n, 'seconds': round(seconds, 3), 'width': info['width'], 'height': info['height'],
        'shot_changes': changes, 'changes_per_10s': round(10 * changes / seconds, 2),
        'pace': level(10 * changes / seconds, PACE_LEVELS),
        'average_shot_s': round(seconds / len(shots), 2),
        'theme': 'dark' if dark >= 0.7 else 'light' if light >= 0.7 else 'mixed',
        'palette': palette(Image.fromarray((frames[::max(1, n // 60)].reshape(-1, AW, 3) * 255).astype(np.uint8)), 6),
        'motion_per_second': digits(per_second, 0.25),
        'shots': shots, 'sheets': sheets
    }
    if info['audio']:
        loud = loudness_per_second(path, seconds)
        result['loudness_per_second'] = digits(loud, max(max(loud), 1e-6))
        result['silent'] = max(loud) < 0.003
    return result


def write(breakdowns):
    # One video per line keeps diffs readable.
    lines = [json.dumps(breakdowns[k], ensure_ascii=False, separators=(',', ':')) for k in sorted(breakdowns, key=int)]
    OUT.write_bytes(('[\n' + ',\n'.join(lines) + '\n]\n').encode('utf-8'))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('ids', nargs='*', type=int)
    parser.add_argument('--all', action='store_true')
    args = parser.parse_args()
    videos = json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8'))
    done = {str(b['id']): b for b in json.loads(OUT.read_text(encoding='utf-8'))} if OUT.exists() else {}
    live = {str(v['id']) for v in videos}
    done = {k: b for k, b in done.items() if k in live}
    for video in sorted(videos, key=lambda v: v['id']):
        key = str(video['id'])
        if args.ids and video['id'] not in args.ids:
            continue
        if not (args.all or args.ids) and key in done and done[key].get('schema') == SCHEMA:
            continue
        try:
            done[key] = analyze(video)
        except Exception as error:  # keep going; report at the end
            print(f"FAILED {key}: {error}", file=sys.stderr, flush=True)
            continue
        b = done[key]
        print(f"{key}: {b['seconds']}s {b['fps']}fps {len(b['shots'])} shots, pace {b['pace']}, {len(b['sheets'])} sheets", flush=True)
        write(done)
    write(done)
    missing = sorted(live - set(done), key=int)
    if missing:
        raise SystemExit(f'No breakdown for: {", ".join(missing)}')


if __name__ == '__main__':
    main()
