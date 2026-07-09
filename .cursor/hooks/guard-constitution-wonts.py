#!/usr/bin/env python3
"""afterFileEdit hook: block constitution WON'T violations under tests/ and pages/."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

EXPECT_TOKEN = "expect("

# Absolute bans — block when the edit introduces (or increases) these.
WAIT_FOR_TIMEOUT = re.compile(r"\bwaitForTimeout\s*\(")

# locator('//...'), locator("xpath=..."), or { xpath: '...' }
XPATH_LOCATOR = re.compile(
    r"(?:\.locator\s*\(\s*(['\"`])\s*(?://|xpath\s*=))|(?:\bxpath\s*:\s*['\"`])",
    re.IGNORECASE,
)

ANY_TYPE = re.compile(
    r"(?::\s*any\b|\bas\s+any\b|<\s*any\s*>|Promise\s*<\s*any\s*>|"
    r"Array\s*<\s*any\s*>|Record\s*<[^>]*\bany\b)"
)

HARDCODED_CREDENTIAL = re.compile(
    r"(?ix)"
    r"(?:"
    # password/token/secret assigned to a string literal (not process.env)
    r"(?:password|passwd|secret|api[_-]?token|api[_-]?key)\s*[:=]\s*['\"][^'\"${][^'\"]{2,}['\"]"
    r"|"
    # Bearer token literal
    r"['\"]Bearer\s+[A-Za-z0-9._\-+=]{8,}['\"]"
    r"|"
    # JWT-looking literal
    r"['\"]eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
    r"|"
    # login('user@x', 'literal-password')
    r"\.login\s*\(\s*['\"][^'\"]+@[^'\"]+['\"]\s*,\s*['\"][^'\"]+['\"]"
    r"|"
    # fill/type with hardcoded didaxis email
    r"\.(?:fill|type)\s*\(\s*['\"][^'\"]*@didaxis\.studio['\"]"
    r")"
)

DESCRIBE_TAG = re.compile(
    r"test\.describe\s*\(\s*(?:`[^`]*`|'[^']*'|\"[^\"]*\")\s*,\s*\{[^}]*\btag\s*:",
    re.DOTALL,
)

VIOLATION_CHECKS: list[tuple[str, re.Pattern[str]]] = [
    ("page.waitForTimeout / waitForTimeout(", WAIT_FOR_TIMEOUT),
    ("XPath locator", XPATH_LOCATOR),
    ("any type", ANY_TYPE),
    ("hardcoded credential", HARDCODED_CREDENTIAL),
    ("tag on test.describe()", DESCRIBE_TAG),
]


def load_input() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("empty stdin")
    return json.loads(raw)


def in_scope(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return bool(re.search(r"(?:^|/)(tests|pages)(?:/|$)", normalized))


def count_matches(pattern: re.Pattern[str], text: str) -> int:
    return len(pattern.findall(text))


def reconstruct_before(after: str, edits: list[dict]) -> str | None:
    content = after
    for edit in reversed(edits):
        old = edit.get("old_string") or ""
        new = edit.get("new_string") or ""
        if not new:
            if old:
                return None
            continue
        if new not in content:
            return None
        content = content.replace(new, old, 1)
    return content


def git_before(repo_root: Path, file_path: Path) -> str | None:
    try:
        rel = file_path.relative_to(repo_root).as_posix()
    except ValueError:
        return None
    result = subprocess.run(
        ["git", "show", f"HEAD:{rel}"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return result.stdout


def resolve_before(after: str, edits: list[dict], payload: dict, path: Path) -> str:
    if edits:
        before = reconstruct_before(after, edits)
        if before is not None:
            return before

    workspace_roots = payload.get("workspace_roots") or []
    repo_root = Path(workspace_roots[0]) if workspace_roots else path.parent
    while repo_root != repo_root.parent and not (repo_root / ".git").is_dir():
        repo_root = repo_root.parent
    before = git_before(repo_root, path)
    if before is not None:
        return before

    # New file / no baseline — treat as empty so any violation is "introduced".
    return ""


def count_total_expects(text: str) -> int:
    return text.count(EXPECT_TOKEN)


def count_commented_expects(text: str) -> int:
    count = 0
    for line in text.splitlines():
        if EXPECT_TOKEN not in line:
            continue
        if is_commented_expect_line(line):
            count += line.count(EXPECT_TOKEN)
    return count


def is_commented_expect_line(line: str) -> bool:
    idx = line.find(EXPECT_TOKEN)
    if idx == -1:
        return False
    stripped = line.lstrip()
    if stripped.startswith("//"):
        return True
    comment_at = line.find("//")
    return comment_at != -1 and comment_at < idx


def deny(reason: str) -> None:
    payload = {
        "permission": "deny",
        "user_message": reason,
        "agent_message": (
            "Blocked by constitution WON'T guard. Fix the violation "
            "(role locators, web-first waits, env credentials, typed code, "
            "tags on test() only) — do not weaken assertions or heal a real bug."
        ),
    }
    print(json.dumps(payload))
    sys.exit(2)


def main() -> None:
    try:
        payload = load_input()
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"guard-constitution-wonts: invalid hook input: {exc}", file=sys.stderr)
        sys.exit(1)

    file_path = payload.get("file_path") or ""
    if not file_path or not in_scope(file_path):
        sys.exit(0)

    path = Path(file_path)
    if not path.is_file():
        # Edit may have been blocked/reverted already; nothing to scan.
        sys.exit(0)

    after = path.read_text(encoding="utf-8")
    edits = payload.get("edits") or []
    before = resolve_before(after, edits, payload, path)

    for label, pattern in VIOLATION_CHECKS:
        before_n = count_matches(pattern, before)
        after_n = count_matches(pattern, after)
        if after_n > before_n:
            deny(
                f"Blocked: {path.name} introduces constitution WON'T — {label} "
                f"({before_n} → {after_n})."
            )

    before_total = count_total_expects(before)
    after_total = count_total_expects(after)
    before_commented = count_commented_expects(before)
    after_commented = count_commented_expects(after)

    if after_total < before_total:
        deny(
            f"Blocked: {path.name} now has {after_total} expect( occurrence(s), "
            f"down from {before_total}. Removing assertions is not allowed."
        )

    if after_commented > before_commented:
        deny(
            f"Blocked: {path.name} has {after_commented - before_commented} newly "
            f"commented expect( line(s). Commenting out assertions is not allowed."
        )

    sys.exit(0)


if __name__ == "__main__":
    main()
