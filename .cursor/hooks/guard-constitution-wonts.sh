#!/usr/bin/env bash
# afterFileEdit (matcher: Write) — block constitution WON'T violations under tests/ and pages/.
# Path filtering is inside the script (file_path from stdin JSON). Exit 0 = allow, exit 2 = deny.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/guard-constitution-wonts.py"
