#!/usr/bin/env python3
"""Rebrand the upstream Serena Launch fork to Kuchi (see WHITELABEL.md).

Idempotent: every rule maps an upstream string to its Kuchi form, and no Kuchi
form contains an upstream pattern, so a second run changes nothing.

Scope: text only. UI layout, styles, markup structure, images and media are
left untouched on purpose. Upstream records that belong to Serena Launch
(directory submissions, verification receipts, dashboards) are not rewritten,
because rewriting them would fabricate Kuchi records; scripts/audit.py flags
them instead.

Usage: python scripts/rebrand.py [--check]   (--check: list files that would change)
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = os.environ.get('KUCHI_BASE_URL', 'https://kuchi.kalarislabs.com').rstrip('/')
HOST = re.sub(r'^https?://', '', BASE_URL)
REPO = os.environ.get('KUCHI_REPO', 'kalarislabs/kuchi')
SUPPORT_EMAIL = os.environ.get('KUCHI_SUPPORT_EMAIL', 'support@kalarislabs.com')

# Never rewritten: attribution/legal docs, upstream records, generated output.
EXCLUDE_DIRS = {'.git', 'node_modules', 'site-public', 'site-dist', '.wrangler', '__pycache__',
                'videos', 'previews', 'directory-submission'}
EXCLUDE_FILES = {'LICENSE', 'UPSTREAM_LICENSE', 'NOTICE', 'WHITELABEL.md', 'WHITELABEL_AUDIT.md',
                 'WHITELABEL_AUDIT.json', 'MIGRATION.md', 'package-lock.json',
                 'scripts/rebrand.py', 'scripts/rebrand.sh', 'scripts/audit.py', 'scripts/audit.sh',
                 'agent/traffic-dashboards.json', 'design/mascot-popcorn-prompt.txt',
                 'site/mascot/README.md'}
EXCLUDE_PREFIXES = ('agent-service/verification/',)
TEXT_SUFFIXES = {'.md', '.json', '.js', '.mjs', '.ts', '.py', '.sh', '.html', '.css', '.yml', '.yaml',
                 '.txt', '.sql', '.svg', ''}

# Mascot media keep their filenames so the UI stays byte-for-byte identical.
KEEP_ASSET = r'(?!popcorn|cutout|idle)'

RULES: list[tuple[str, str]] = [
    # --- URL-encoded forms (connect deep links, OAuth fixtures) ------------
    (r'https%3A%2F%2Fserenatan\.org%2Flaunchvideo%2Fmcp', quote(f'{BASE_URL}/mcp', safe='')),
    (r'Serena%20Launch', 'Kuchi'),
    # --- Contact ------------------------------------------------------------
    (r'serenatan1125@gmail\.com', SUPPORT_EMAIL),
    # --- Domains and paths (most specific first) -------------------------
    (r'https?://serenatan\.org/\.well-known/oauth-protected-resource/launchvideo/mcp',
     f'{BASE_URL}/.well-known/oauth-protected-resource/mcp'),
    (r'serenatan\.org/\.well-known/oauth-protected-resource/launchvideo/mcp',
     f'{HOST}/.well-known/oauth-protected-resource/mcp'),
    (r'/\.well-known/oauth-protected-resource/launchvideo/mcp', '/.well-known/oauth-protected-resource/mcp'),
    (r'https?://serenatan\.org/launchvideo/mcp', f'{BASE_URL}/mcp'),
    (r'https?://serenatan\.org/launchvideo', BASE_URL),
    (r'serenatan\.org/launchvideo', HOST),
    (r'https?://(?:clerk|accounts)\.serenatan\.org',
     lambda m: m.group(0).replace('serenatan.org', HOST).replace('http://', 'https://')),
    (r'https?://(?:www\.)?serenatan\.org', BASE_URL),
    (r'(?<![\w.-])(clerk|accounts)\.serenatan\.org', rf'\1.{HOST}'),
    (r'(?<![\w.-])serenatan\.org', HOST),
    # Path prefix /launchvideo -> site root (regex-escaped form first).
    (r'\\/launchvideo(?=\\/)', ''),
    (r"(['\"`])/launchvideo(['\"`])", r'\1\2'),
    (r'/launchvideo/', '/'),
    (r'/launchvideo(?![\w-])', ''),
    # --- Infrastructure identifiers -----------------------------------------
    (r'serenatan-launchvideo-media', 'kuchi-media'),
    (r'serenatan-launchvideo-agent', 'kuchi-agent'),
    (r'serenatan-launchvideo', 'kuchi-site'),
    (r'serena-launch-conversations', 'kuchi-conversations'),
    (r'serena-launch-static-delivery', 'kuchi-static-delivery'),
    (r'serena-launch-metadata\.json', 'kuchi-metadata.json'),
    (r'serena-launch-public-draft', 'kuchi-public-draft'),
    # --- Repository ---------------------------------------------------------
    (r'serenakeyitan/awesome-ai-clonable-launch-videos', REPO),
    # --- Brand names (most specific first) ----------------------------------
    (r'Serena with popcorn', 'Kuchi mascot with popcorn'),
    # No claim on the upstream curation (WHITELABEL.md 3.5).
    (r"Serena Tan['’]s curated video collection", 'the Kuchi video collection'),
    (r"(?:Serena Tan|Serena)['’]s curated collection", 'the Kuchi collection'),
    (r'Launch-video references curated by Serena, updated daily\.', 'Launch-video references, updated daily.'),
    (r"Serena Tan['’]s", 'Kalaris Labs’'),
    (r'Serena Tan', 'Kalaris Labs'),
    (r'Serena Launch', 'Kuchi'),
    (r'serena-launch', 'kuchi'),
    (r'X-Serena-', 'X-Kuchi-'),
    (r'SERENA_', 'KUCHI_'),
    (r'Serena-Analytics', 'Kuchi-Analytics'),
    (r'serena_launch_visitor', 'kuchi_visitor'),
    (r'serena-recorder', 'kuchi-recorder'),
    (r'serena-replay', 'kuchi-replay'),
    (r'serena-community', 'kuchi-community'),
    (r'serena-traffic', 'kuchi-traffic'),
    (rf'serena-{KEEP_ASSET}(?=[a-z])', 'kuchi-'),
    (r"\bSerena['’]s\b", 'Kalaris Labs’'),
    (r'\bSerena\b(?!-)', 'Kalaris Labs'),
]
COMPILED = [(re.compile(p), r) for p, r in RULES]


def rewrite(text: str) -> str:
    for pattern, repl in COMPILED:
        text = pattern.sub(repl, text)
    return text


def candidates():
    for path in sorted(ROOT.rglob('*')):
        rel = path.relative_to(ROOT).as_posix()
        if not path.is_file() or any(part in EXCLUDE_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if rel in EXCLUDE_FILES or rel.startswith(EXCLUDE_PREFIXES) or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        yield rel, path


# Directories whose names carry the upstream brand.
RENAMES = [('plugin/launch-archive/skills/serena-launch', 'plugin/launch-archive/skills/kuchi')]


def main(check: bool) -> int:
    changed = []
    for old, new in RENAMES:
        src, dst = ROOT / old, ROOT / new
        if src.exists() and not dst.exists():
            changed.append(f'{old} -> {new}')
            if not check:
                src.rename(dst)
    for rel, path in candidates():
        raw = path.read_bytes()
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            continue
        new = rewrite(text)
        if new != text:
            changed.append(rel)
            if not check:
                path.write_bytes(new.encode('utf-8'))
    verb = 'Would change' if check else 'Changed'
    print(f'{verb} {len(changed)} paths.')
    for rel in changed:
        print('  ' + rel)
    return 1 if check and changed else 0


if __name__ == '__main__':
    sys.exit(main('--check' in sys.argv[1:]))
