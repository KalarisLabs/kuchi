#!/usr/bin/env bash
# Idempotent rebrand (WHITELABEL.md section 9). The rules live in rebrand.py so
# they behave the same on Linux, macOS and Windows (no GNU/BSD sed differences).
# It does not touch videos.json media URLs: nulling them would break gallery playback.
set -euo pipefail
cd "$(dirname "$0")/.."

# Fail fast if upstream license missing
[[ -f UPSTREAM_LICENSE ]] || { echo "Missing UPSTREAM_LICENSE"; exit 1; }

python3 scripts/rebrand.py "$@"
echo "Rebrand complete. Run scripts/audit.sh next."
