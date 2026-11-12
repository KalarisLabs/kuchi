#!/usr/bin/env bash
# CI gate: exits non-zero unless every WHITELABEL.md section 8 check passes.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python3 scripts/audit.py "$@"
