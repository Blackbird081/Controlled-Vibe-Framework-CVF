"""Bounded next-move text comparison; no execution authority is inferred."""
from __future__ import annotations
import re
from typing import Any, Callable

NEXT_ALLOWED_MOVE_TOKEN_PATTERN = re.compile(
    r'\b(DIR-T\d+[A-Za-z0-9-]*|MEMCON-T\d+[A-Za-z0-9-]*|LPCI2-[A-Za-z0-9-]*|'
    r'DT-CVF-T\d+[A-Za-z0-9-]*|PL-S\d+[A-Za-z0-9-]*|Policy_Local|EC(?:-\d+)?|DEP\d+[A-Za-z0-9-]*)\b'
)
VALUE = r'[A-Z][A-Z0-9_-]*'
HEADER = re.compile(r'^PROGRAM_ID\s*=\s*('+VALUE+r')\s*;\s*NEXT_ACTION_CLASS\s*=\s*('+VALUE+r')\s*;\s*BATCH_ID\s*=\s*('+VALUE+r')\s*\.\s*(.*)$')
NCR_START = re.compile(r'^PROGRAM_ID\s*=\s*CVF-NCR(?![A-Z0-9_-])')


def _extract_markdown_section(text: str, heading: str) -> str:
    lines = text.splitlines()
    section: list[str] = []
    capture = False
    for line in lines:
        if line.strip() == heading:
            capture = True
            section.append(line)
            continue
        if capture and line.startswith('## '):
            break
        if capture:
            section.append(line)
    return '\n'.join(section)


def _unwrap(text: str) -> str:
    text = text.strip()
    text = re.sub(r'^Next allowed move:\s*', '', text, flags=re.I)
    if text.startswith('`') and text.endswith('`'):
        text = text[1:-1].strip()
    return text


def _ncr_signature(text: str) -> tuple[str, str, str, str] | None:
    # Only outer whitespace may surround a physical declaration line.
    text = _unwrap(text)
    if '\n' in text or '\r' in text:
        return None
    match = HEADER.fullmatch(text)
    if not match or match[1] != 'CVF-NCR':
        return None
    return match[1], match[2], match[3], ' '.join(match[4].split())


def _next_allowed_move_signature(text: str) -> str | None:
    if not text:
        return None
    if NCR_START.match(_unwrap(text).lstrip('`')):
        parsed = _ncr_signature(text)
        return repr(parsed) if parsed else None
    match = re.search(r'(?is)next allowed move:\s*(.+)', text)
    candidate = match.group(1) if match else text
    token_match = NEXT_ALLOWED_MOVE_TOKEN_PATTERN.search(candidate)
    return token_match.group(1).lower() if token_match else None


def _section_ncr(text: str) -> tuple[str, str, str, str] | None:
    section = _extract_markdown_section(text, '## Next Allowed Move')
    lines = [_unwrap(line) for line in section.splitlines()]
    declarations = [line for line in lines if line.lstrip('`').startswith('PROGRAM_ID')]
    if len(declarations) != 1:
        return None
    return _ncr_signature(declarations[0])


def check_alignment(state: dict[str, Any] | None, front_door_text: str,
                    active_handoff: str | None, read_text: Callable[[str], str]) -> list[str]:
    if not state:
        return []
    value = state.get('nextAllowedMove')
    if not isinstance(value, str):
        return []
    if NCR_START.match(_unwrap(value).lstrip('`')):
        expected = _ncr_signature(value)
        if expected is None:
            return ['state nextAllowedMove NCR declaration is malformed or multiline']
        violations = []
        surfaces = [('CVF_SESSION_MEMORY.md', front_door_text)]
        if active_handoff:
            surfaces.append(('active handoff', read_text(active_handoff)))
        for label, text in surfaces:
            actual = _section_ncr(text)
            if actual is None:
                violations.append(f'{label} Next Allowed Move requires exactly one valid NCR declaration')
            elif actual != expected:
                violations.append(f'{label} Next Allowed Move NCR declaration does not match state nextAllowedMove')
        return violations
    # The previous legacy primary-token comparison remains its own branch.
    expected_legacy = _next_allowed_move_signature(value)
    if not expected_legacy:
        return []
    violations = []
    surfaces = [('CVF_SESSION_MEMORY.md', front_door_text)]
    if active_handoff:
        surfaces.append(('active handoff', read_text(active_handoff)))
    for label, text in surfaces:
        actual = _next_allowed_move_signature(_extract_markdown_section(text, '## Next Allowed Move'))
        if not actual:
            violations.append(f'{label} Next Allowed Move is missing a parser-visible primary next-move token')
        elif actual != expected_legacy:
            violations.append(f'{label} Next Allowed Move primary token `{actual}` does not match state nextAllowedMove primary token `{expected_legacy}`')
    return violations
