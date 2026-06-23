#!/usr/bin/env bash
# Blocks agent edits that weaken Playwright tests under tests/.
# Exit 0 = allow, exit 2 = deny (weakened assertions).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/guard-test-assertions.py"
