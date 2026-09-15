#!/usr/bin/env python3
"""Offline pre-dispatch receipt check; never fetches, executes, or repins upstream."""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

SHA = re.compile(r"[0-9a-f]{40}")
FIELDS = {
    "schemaVersion", "sourceUrl", "observedAt", "manifestFrozenAt",
    "defaultBranch", "observedHead", "selectedPin", "previousPin",
    "selectionReason", "deltaSummary", "lsRemoteOutput",
}
HEADING = "## Upstream Freshness Preflight"
MIRROR = re.compile(r"\.private_reference/source_mirrors/([A-Za-z0-9_.-]+__[A-Za-z0-9_.-]+)(?=[/`\s]|$)")


def applies_to_dispatch(path: str, text: str) -> bool:
    return (path.startswith("docs/work_orders/") and path.endswith(".md")
            and "/archive/" not in path and
            (bool(MIRROR.search(text)) or "source-intake" in text or HEADING in text))


def validate_dispatch(text: str, historical_text: str | None = None,
                      newly_dispatched: bool = False, now: datetime | None = None) -> list[str]:
    # Only byte-equivalent pre-activation packets retain the old contract.
    if historical_text is not None and text.strip() == historical_text.strip():
        return []
    if historical_text is not None and re.search(r'^Status: CLOSED_PASS_BOUNDED$', text, re.M):
        # Closure appends machine evidence, never authorizes another source pass.
        original = historical_text.split('\n## Machine Closure Package')[0].strip()
        closing = text.split('\n## Machine Closure Package')[0].strip()
        closing = re.sub(r'^Status: CLOSED_PASS_BOUNDED$', 'Status: DISPATCH_READY', closing, flags=re.M)
        if closing == original:
            return []
    sections = list(re.finditer(r"^## Upstream Freshness Preflight\s*$", text, re.M))
    if len(sections) != 1:
        return [f"requires exactly one {HEADING} section with inline receipt array"]
    start = sections[0].end()
    next_heading = re.search(r"^## ", text[start:], re.M)
    end = start + next_heading.start() if next_heading else len(text)
    blocks = re.findall(r"^```json\s*\n(.*?)^```\s*$", text[start:end], re.M | re.S)
    if len(blocks) != 1:
        return ["freshness section requires exactly one JSON receipt array"]
    try:
        rows = json.loads(blocks[0], object_pairs_hook=unique_object)
    except ValueError:
        return ["freshness section contains malformed or duplicate-key JSON"]
    if not isinstance(rows, list) or not rows:
        return ["freshness receipt array must be nonempty"]
    errors, covered = [], set()
    scope = text[:sections[0].start()] + text[end:]
    for index, row in enumerate(rows):
        issues = validate(row, now)
        if issues:
            errors.extend(f"receipt {index}: {issue}" for issue in issues)
            continue
        parts = urlsplit(row["sourceUrl"]).path.strip("/").removesuffix(".git").split("/")
        source = "__".join(parts)
        if source in covered:
            errors.append(f"receipt {index}: duplicate repository")
        covered.add(source)
        if row["selectedPin"] not in scope:
            errors.append(f"receipt {index}: selectedPin absent from work-order scope outside receipt")
        if newly_dispatched:
            observed = datetime.fromisoformat(row["observedAt"].replace("Z", "+00:00"))
            if (now or datetime.now(timezone.utc)) - observed > timedelta(hours=24):
                errors.append(f"receipt {index}: new dispatch requires observation within last 24 hours")
    for missing in sorted(set(MIRROR.findall(scope)) - covered):
        errors.append(f"missing receipt for mirror {missing}")
    return errors


def unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate field: {key}")
        result[key] = value
    return result


def validate(data: object, now: datetime | None = None) -> list[str]:
    if not isinstance(data, dict) or set(data) != FIELDS:
        return ["receipt must contain exactly the documented fields"]
    if any(not isinstance(value, str) for value in data.values()):
        return ["all receipt fields must be strings"]
    errors = []
    if data["schemaVersion"] != "cvf.upstream-freshness.v1":
        errors.append("unsupported schemaVersion")
    try:
        url = urlsplit(data["sourceUrl"])
        if (url.scheme != "https" or not url.hostname or url.username or
                url.password or url.query or url.fragment or not url.path.strip("/")):
            errors.append("sourceUrl must be a credential-free HTTPS repository URL")
    except ValueError:
        errors.append("invalid sourceUrl")
    for field in ("observedHead", "selectedPin"):
        if not SHA.fullmatch(data[field]):
            errors.append(f"{field} must be a full lowercase Git SHA")
    previous = data["previousPin"]
    if previous != "NONE" and not SHA.fullmatch(previous):
        errors.append("previousPin must be a full SHA or NONE for first acquisition")
    branch = data["defaultBranch"]
    if not re.fullmatch(r"refs/heads/[^\s]+", branch):
        errors.append("defaultBranch must name a full refs/heads reference")
    lines = [line.split() for line in data["lsRemoteOutput"].splitlines() if line.strip()]
    if (lines.count(["ref:", branch, "HEAD"]) != 1 or
            lines.count([data["observedHead"], "HEAD"]) != 1 or
            any(row[-1:] == ["HEAD"] and row not in
                (["ref:", branch, "HEAD"], [data["observedHead"], "HEAD"])
                for row in lines)):
        errors.append("lsRemoteOutput must bind exactly one symbolic HEAD and observed SHA")
    try:
        observed, frozen = [datetime.fromisoformat(data[key].replace("Z", "+00:00"))
                            for key in ("observedAt", "manifestFrozenAt")]
        if any(t.tzinfo is None or t.utcoffset() != timedelta(0) for t in (observed, frozen)):
            raise ValueError("timestamps must be UTC")
        if not observed <= frozen <= (now or datetime.now(timezone.utc)):
            errors.append("timestamps must be ordered observation <= freeze <= now")
        if frozen - observed > timedelta(hours=24):
            errors.append("observation must be within 24 hours before manifest freeze")
    except ValueError:
        errors.append("observedAt and manifestFrozenAt must be valid UTC timestamps")
    if data["selectedPin"] != data["observedHead"] and not data["selectionReason"].strip():
        errors.append("historical/release pin requires selectionReason")
    if previous != "NONE" and previous != data["observedHead"] and not data["deltaSummary"].strip():
        errors.append("upstream drift requires deltaSummary including affected scope")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, required=True)
    args = parser.parse_args()
    try:
        errors = validate(json.loads(args.receipt.read_text(encoding="utf-8"),
                                     object_pairs_hook=unique_object))
    except (OSError, ValueError) as exc:
        errors = [f"cannot read valid receipt: {type(exc).__name__}"]
    for error in errors:
        print(f"FAIL: {error}")
    if not errors:
        print("PASS: upstream freshness receipt consistent (offline; not live verification)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
