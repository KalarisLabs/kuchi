#!/usr/bin/env python3
"""White-label release gate (WHITELABEL.md sections 5 and 8).

Writes WHITELABEL_AUDIT.json (every flagged asset as {path, type, action}, plus
check results) and WHITELABEL_AUDIT.md (the human checklist). Exits 0 only when
every check passes. A check that does not apply to this repository's layout is
reported as "n/a" with the reason, never as a pass.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {'.git', 'node_modules', 'site-public', 'site-dist', '.wrangler', '__pycache__'}
# Files that may name the upstream on purpose (attribution, mapping, tooling).
ATTRIBUTION = {'NOTICE', 'UPSTREAM_LICENSE', 'LICENSE', 'WHITELABEL.md', 'MIGRATION.md',
               'WHITELABEL_AUDIT.md', 'WHITELABEL_AUDIT.json',
               'scripts/rebrand.py', 'scripts/rebrand.sh', 'scripts/audit.py', 'scripts/audit.sh'}
# sha256 of the upstream LICENSE as forked.
UPSTREAM_LICENSE_SHA256 = '6dd77f61412c85041db6fcd1a89d99a318bc48eccce3ffbb878565f51f615036'
CODE_SUFFIXES = {'.js', '.mjs', '.ts', '.py'}
BINARY_SUFFIXES = {'.mp4', '.webm', '.png', '.jpg', '.jpeg', '.zip', '.gif', '.webp', '.ico'}


def files():
    for path in sorted(ROOT.rglob('*')):
        if path.is_file() and not any(p in SKIP_DIRS for p in path.relative_to(ROOT).parts):
            yield path.relative_to(ROOT).as_posix(), path


def text(path: Path) -> str | None:
    if path.suffix.lower() in BINARY_SUFFIXES:
        return None
    try:
        return path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, OSError):
        return None


def grep(pattern: str, allow=ATTRIBUTION, only=None) -> list[str]:
    rx = re.compile(pattern)
    hits = []
    for rel, path in files():
        if rel in allow or (only and not only(rel)):
            continue
        body = text(path)
        if body is not None and rx.search(body):
            hits.append(rel)
    return hits


def main() -> int:
    checks, assets = [], []

    def check(name, status, detail='', paths=()):
        checks.append({'check': name, 'status': status, 'detail': detail, 'paths': list(paths)})

    def flag(path, kind, action, note=''):
        assets.append({'path': path, 'type': kind, 'action': action, **({'note': note} if note else {})})

    videos = json.loads((ROOT / 'data/videos.json').read_text(encoding='utf-8'))
    all_files = dict(files())

    # --- Asset flags (section 5) ---------------------------------------------
    for rel in all_files:
        if rel.startswith('videos/') and rel.endswith('.mp4'):
            flag(rel, 'third-party-launch-video', 'drop',
                 'Kept on purpose: the gallery plays it. Remove, or get the creator\'s licence, before publishing.')
        elif rel.startswith('previews/'):
            flag(rel, 'third-party-thumbnail', 'drop', 'Sampled frame of a third-party video; needs a licence or a removal.')
        elif re.search(r'(^|/)serena-[^/]*\.(png|mp4|webm)$', rel) or rel in {
                'site/favicon.svg', 'site/favicon-32.png', 'site/favicon-180.png', 'site/avatar.svg',
                'plugin/launch-archive/assets/logo.svg'}:
            flag(rel, 'upstream-brand-asset', 'swap',
                 'Upstream mascot/avatar (site/mascot/README.md: derived from the upstream owner\'s avatar). '
                 'Replace it with a Kuchi asset of the same size so the UI layout stays the same.')
        elif rel.startswith('directory-submission/'):
            flag(rel, 'upstream-record', 'drop', 'Serena Launch directory submission; Kuchi needs its own.')
        elif rel.startswith('agent-service/verification/') or rel == 'agent/traffic-dashboards.json':
            flag(rel, 'upstream-record', 'drop', 'Upstream operator receipt/dashboard config.')
        elif rel in {'design/mascot-popcorn-prompt.txt', 'site/mascot/README.md', 'scripts/render_mascot.sh'}:
            flag(rel, 'upstream-brand-asset', 'swap', 'Describes or renders the upstream mascot.')
        elif rel.startswith('site/logos/'):
            flag(rel, 'third-party-logo', 'keep', 'Client marks under their stated licences (site/logos/README.md).')
    prompts = [v['id'] for v in videos if v.get('remakePrompt')]
    if prompts:
        flag('data/videos.json#remakePrompt', 'upstream-prompt-text', 'swap',
             f'{len(prompts)} remake prompts are upstream wording; re-author them in Kuchi voice.')
    flag('/shared/site-header.css, /shared/site-header.js', 'external-dependency', 'swap',
         'Referenced by site/*.html but served by the upstream portfolio site. On kuchi.kalarislabs.com they '
         '404 and the header falls back to style.css.')

    # --- Checks (section 8) ---------------------------------------------------
    hits = grep(r'serenatan\.org')
    check('No serenatan.org string anywhere in the repo',
          'pass' if not hits else 'fail', 'Allowed: NOTICE, MIGRATION.md, WHITELABEL docs, rebrand/audit tooling.', hits)

    hits = grep(r'Serena Launch|Serena Tan|serena-launch|\bSerena\b')
    check('No upstream brand strings outside attribution files', 'pass' if not hits else 'fail', '', hits)

    mp4s = [r for r in all_files if r.startswith('videos/') and r.endswith('.mp4')]
    check('No upstream MP4 committed under videos/', 'pass' if not mp4s else 'fail',
          f'{len(mp4s)} MP4s present. Kept on purpose so the gallery UI keeps playing them.', mp4s[:5])

    missing = [v['id'] for v in videos if not v.get('source')]
    check('Every videos.json entry has source_url (attribution)', 'pass' if not missing else 'fail',
          'This catalog\'s field is "source".', [f'id {i}' for i in missing])

    hosted = [v['id'] for v in videos if not v.get('owned') and v.get('watchUrl')]
    check('Every third-party entry has video_url: null', 'pass' if not hosted else 'fail',
          'This catalog has no video_url field; "watchUrl"/"video" point at self-hosted MP4s. '
          f'{len(hosted)} entries are third-party and hosted. Setting them to null would break playback.',
          [f'id {i}' for i in hosted[:5]])

    notice = (ROOT / 'NOTICE').read_text(encoding='utf-8') if (ROOT / 'NOTICE').exists() else ''
    ok = 'Kalaris Labs' in notice and 'serenakeyitan/awesome-ai-clonable-launch-videos' in notice
    check('NOTICE present and correct', 'pass' if ok else 'fail')

    lic = ROOT / 'UPSTREAM_LICENSE'
    ok = lic.exists() and hashlib.sha256(lic.read_bytes()).hexdigest() == UPSTREAM_LICENSE_SHA256
    check('UPSTREAM_LICENSE present and unmodified', 'pass' if ok else 'fail')

    schemas = list((ROOT / 'schema').glob('*.json')) if (ROOT / 'schema').is_dir() else []
    if not schemas:
        check('schema/*.json $id uses Kuchi domain', 'n/a', 'This repository has no schema/ directory.')
    else:
        bad = [p.name for p in schemas if 'kuchi.kalarislabs.com' not in json.loads(p.read_text()).get('$id', '')]
        check('schema/*.json $id uses Kuchi domain', 'pass' if not bad else 'fail', '', bad)

    prompt_files = list((ROOT / 'prompts').glob('*.md')) if (ROOT / 'prompts').is_dir() else []
    if not prompt_files:
        check('All prompts/*.md carry version + date + author', 'n/a',
              'This repository has no prompts/ directory. Prompts live in data/videos.json (remakePrompt).')
    else:
        bad = [p.name for p in prompt_files
               if not all(re.search(rf'(?im)^{k}:', p.read_text(encoding='utf-8')) for k in ('version', 'date', 'author'))]
        check('All prompts/*.md carry version + date + author', 'pass' if not bad else 'fail', '', bad)

    check('No prompt text copied verbatim from upstream', 'fail' if prompts else 'pass',
          f'{len(prompts)} remakePrompt values in data/videos.json are the upstream text and have not been re-authored.')

    # A line whose domain is only the KUCHI_BASE_URL fallback default doesn't count.
    code = grep(r'(?m)^(?!.*KUCHI_BASE_URL).*kuchi\.kalarislabs\.com',
                only=lambda r: Path(r).suffix in CODE_SUFFIXES and '/test' not in r and not r.startswith('scripts/test_')
                and not r.endswith('.test.mjs'))
    check('KUCHI_BASE_URL is the only source of domains in code', 'fail' if code else 'pass',
          'The build scripts read KUCHI_BASE_URL. Runtime Worker and browser code still embeds the domain that '
          'scripts/rebrand.py wrote from KUCHI_BASE_URL. Re-run rebrand.py to change it.', code)

    worker = (ROOT / 'agent-service/worker.mjs').read_text(encoding='utf-8')
    ok = '/mcp/health' in worker and "product:'Kuchi'" in worker and (ROOT / 'agent-service/test/health.test.mjs').exists()
    check('/mcp/health returns {status, product:"Kuchi", version}', 'pass' if ok else 'fail',
          'Static check plus agent-service/test/health.test.mjs. Live check: curl https://kuchi.kalarislabs.com/mcp/health')

    check('MIGRATION.md published', 'pass' if (ROOT / 'MIGRATION.md').exists() else 'fail')

    failed = [c for c in checks if c['status'] == 'fail']
    check('scripts/audit.sh exits 0', 'pass' if not failed else 'fail', f'{len(failed)} failing checks above.')

    report = {'product': 'Kuchi', 'upstream': 'serenakeyitan/awesome-ai-clonable-launch-videos',
              'passed': not failed, 'checks': checks, 'assets': assets}
    # write_bytes keeps LF line endings on every OS.
    (ROOT / 'WHITELABEL_AUDIT.json').write_bytes((json.dumps(report, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))

    mark = {'pass': '✅', 'fail': '❌', 'n/a': '➖'}
    lines = ['# Kuchi white-label audit', '', 'Generated by `scripts/audit.py`. Do not edit by hand.', '',
             f'**Result: {"PASS" if not failed else "FAIL"}** ({len(failed)} failing).', '', '## Checklist', '']
    for c in checks:
        lines.append(f'- {mark[c["status"]]} {c["check"]}' + (f': {c["detail"]}' if c['detail'] else ''))
        for p in c['paths'][:8]:
            lines.append(f'  - `{p}`')
        if len(c['paths']) > 8:
            lines.append(f'  - …and {len(c["paths"]) - 8} more')
    counts = {}
    for a in assets:
        counts.setdefault((a['type'], a['action']), 0)
        counts[(a['type'], a['action'])] += 1
    lines += ['', '## Flagged assets', '', '| Type | Action | Count |', '|---|---|---|']
    lines += [f'| {t} | {a} | {n} |' for (t, a), n in sorted(counts.items())]
    lines += ['', 'The full list with paths is in `WHITELABEL_AUDIT.json`.', '']
    (ROOT / 'WHITELABEL_AUDIT.md').write_bytes('\n'.join(lines).encode('utf-8'))

    for c in checks:
        print(f'{c["status"].upper():5} {c["check"]}')
    print(f'\n{len(assets)} flagged assets -> WHITELABEL_AUDIT.json')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
