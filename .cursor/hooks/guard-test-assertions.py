#!/usr/bin/env python3
"""afterFileEdit hook: block edits that weaken test assertions."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

EXPECT_TOKEN = "expect("


def load_input() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("empty stdin")
    return json.loads(raw)


def is_test_file(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return "/tests/" in normalized or normalized.endswith("/tests")


def compute_before_counts(after: str, edits: list[dict]) -> tuple[int, int]:
    """Derive pre-edit expect counts by reversing edit deltas."""
    total = count_total_expects(after)
    commented = count_commented_expects(after)
    for edit in reversed(edits):
        old = edit.get("old_string") or ""
        new = edit.get("new_string") or ""
        total += count_total_expects(old) - count_total_expects(new)
        commented += count_commented_expects(old) - count_commented_expects(new)
    return total, commented


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
            "This edit was blocked because it weakens test coverage. "
            "Fix the locator or app behavior instead of removing or commenting assertions."
        ),
    }
    print(json.dumps(payload))
    sys.exit(2)


def main() -> None:
    try:
        payload = load_input()
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"guard-test-assertions: invalid hook input: {exc}", file=sys.stderr)
        sys.exit(1)

    file_path = payload.get("file_path") or ""
    if not file_path or not is_test_file(file_path):
        sys.exit(0)

    path = Path(file_path)
    if not path.is_file():
        sys.exit(0)

    after = path.read_text(encoding="utf-8")
    edits = payload.get("edits") or []

    if edits:
        before_total, before_commented = compute_before_counts(after, edits)
    else:
        before = reconstruct_before(after, edits)
        if before is None:
            workspace_roots = payload.get("workspace_roots") or []
            repo_root = Path(workspace_roots[0]) if workspace_roots else path.parent
            while repo_root != repo_root.parent and not (repo_root / ".git").is_dir():
                repo_root = repo_root.parent
            before = git_before(repo_root, path)
        if before is None:
            print(
                "guard-test-assertions: could not determine pre-edit content",
                file=sys.stderr,
            )
            sys.exit(1)
        before_total = count_total_expects(before)
        before_commented = count_commented_expects(before)

    after_total = count_total_expects(after)
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
