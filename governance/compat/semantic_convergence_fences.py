"""Fenced SCEC object discovery, kept independent of chain validation."""
from __future__ import annotations
import json, re
from pathlib import PurePosixPath
from importlib import import_module
_prefix = f"{__package__}." if __package__ else ""
_admission = import_module(_prefix + "semantic_convergence_root_admission")
_no_duplicates = _admission._no_duplicates
_decode_json_unicode_escapes = _admission.decode_json_unicode_escapes
SCEC_SCHEMA_VERSION = "cvf.semanticConvergenceControl.v1"
OPEN_FENCE_LINE_RE = re.compile(r"^ {0,3}(`{3,})([^`]*)$")
CLOSE_FENCE_LINE_RE = re.compile(r"^ {0,3}(`{3,})[ \t]*$")
def is_active_block(candidate):
    return isinstance(candidate, dict) and candidate.get("schemaVersion") == SCEC_SCHEMA_VERSION
def _iter_fenced_blocks(text: str) -> list[tuple[str, str]]:
    """Yield `(language_tag, body)` per fenced block via an explicit
    open/close state machine, so a closing fence is never re-paired as a
    later block's opener (ADIF-0055 mixed-fence hardening).
    """
    blocks: list[tuple[str, str]] = []
    in_fence = False
    language = ""
    opening_width = 0
    body_lines: list[str] = []
    for line in text.splitlines():
        normalized_line = line.rstrip("\r")
        if not in_fence:
            opening_match = OPEN_FENCE_LINE_RE.match(normalized_line)
            if opening_match:
                in_fence = True
                opening_width = len(opening_match.group(1))
                info = opening_match.group(2).strip()
                language = info.split(maxsplit=1)[0].lower() if info else ""
                body_lines = []
            continue
        closing_match = CLOSE_FENCE_LINE_RE.match(normalized_line)
        if closing_match and len(closing_match.group(1)) >= opening_width:
            blocks.append((language, "\n".join(body_lines)))
            in_fence = False
            language = ""
            opening_width = 0
            body_lines = []
            continue
        body_lines.append(line)
    return blocks
def find_active_blocks(text: str) -> list[dict]:
    """Extract every fenced-code-block JSON object that is a real active SCEC
    block (invariant 11: quoted/example markers outside real JSON are never
    treated as active).
    """
    active: list[dict] = []
    for language, body in _iter_fenced_blocks(text):
        if language not in ("", "json"):
            continue
        marker_body = _decode_json_unicode_escapes(body)
        opt_in = SCEC_SCHEMA_VERSION in marker_body and '"rootContractAdmission"' in marker_body
        try:
            candidate = (json.loads(body, object_pairs_hook=_no_duplicates,
                                    parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))
                         if opt_in else json.loads(body))
        except (json.JSONDecodeError, ValueError) as exc:
            # An attempted opt-in must remain an evaluated, failing object.
            # Ordinary malformed examples retain historical marker immunity.
            if opt_in:
                active.append({"schemaVersion": SCEC_SCHEMA_VERSION,
                               "_scec_parse_error": f"invalid or duplicate opt-in JSON: {exc}"})
            continue
        if is_active_block(candidate):
            active.append(candidate)
    return active

def is_safe_repo_relative_path(value: str) -> bool:
    """Reject absolute, drive-qualified, backslash, and traversal paths."""
    if not value or "\\" in value or value.startswith("/") or re.match(r"^[A-Za-z]:", value):
        return False
    parts = PurePosixPath(value).parts
    return bool(parts) and all(part not in ("", ".", "..") for part in parts)
