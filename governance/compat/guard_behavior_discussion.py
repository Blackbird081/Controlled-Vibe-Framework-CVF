"""Shared parsing for explicitly marked guard-behavior discussion sections."""

from __future__ import annotations

import re


HEADING = "## Guard Behavior Discussion"
MARKER = "Discussion-only disposition: META_DISCUSSION_ONLY"
_SECTION_RE = re.compile(
    rf"(?ms)^{re.escape(HEADING)}\s*$\n(.*?)(?=^##\s+|\Z)"
)


def strip_marked_discussion_sections(text: str) -> str:
    """Remove only explicitly marked discussion sections for applicability scans."""

    def replace(match: re.Match[str]) -> str:
        body = match.group(1)
        return "\n" if MARKER in body else match.group(0)

    return _SECTION_RE.sub(replace, text)
