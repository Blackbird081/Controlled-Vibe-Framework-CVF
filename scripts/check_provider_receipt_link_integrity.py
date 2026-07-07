#!/usr/bin/env python3
"""Provider receipt-link integrity checker.

Static, non-live guard for the public CVF provider readiness matrix
(`docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`). It verifies that
every provider row whose ``Status`` column is exactly ``CERTIFIED`` names a
local, resolvable markdown link in its ``Latest Receipt`` column. Rows with
any other status (``EXPERIMENTAL``, ``DEGRADED``, ``LIVE``, etc.) are not
required to carry a receipt link.

This script makes no provider or live API calls and does not change any
provider status, receipt content, or public claim. It only reads the matrix
file and checks that cited local link targets exist on disk.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

REPO_ROOT = Path(__file__).resolve().parents[1]
MATRIX_PATH = REPO_ROOT / "docs" / "reference" / "CVF_PROVIDER_LANE_READINESS_MATRIX.md"

REQUIRED_STATUS = "CERTIFIED"
SECTION_HEADING = "## Provider Readiness"
NEXT_HEADING_RE = re.compile(r"^##\s+", re.MULTILINE)
TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")
MARKDOWN_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


@dataclass
class ProviderRowResult:
    provider: str
    status: str
    latest_receipt_cell: str
    link_target: str | None = None
    ok: bool = False
    reason: str = ""


@dataclass
class CheckOutcome:
    ok: bool
    rows: list[ProviderRowResult] = field(default_factory=list)
    diagnostics: list[str] = field(default_factory=list)


def _read_matrix(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return ""
    after = start + len(heading)
    match = NEXT_HEADING_RE.search(text, after)
    end = match.start() if match else len(text)
    return text[after:end]


def _split_row(line: str) -> list[str]:
    inner = line.strip()
    if inner.startswith("|"):
        inner = inner[1:]
    if inner.endswith("|"):
        inner = inner[:-1]
    return [cell.strip() for cell in inner.split("|")]


def _is_separator_row(cells: list[str]) -> bool:
    return all(re.fullmatch(r":?-{1,}:?", cell) for cell in cells if cell)


def _parse_provider_table(section: str) -> tuple[dict[str, int], list[list[str]]]:
    rows: list[list[str]] = []
    header: dict[str, int] = {}
    for line in section.splitlines():
        match = TABLE_ROW_RE.match(line)
        if not match:
            continue
        cells = _split_row(line)
        if not header:
            header = {name.casefold(): idx for idx, name in enumerate(cells)}
            continue
        if _is_separator_row(cells):
            continue
        rows.append(cells)
    return header, rows


def _extract_link_target(cell: str) -> str | None:
    match = MARKDOWN_LINK_RE.search(cell)
    if not match:
        return None
    return match.group(1).strip()


def _is_external_or_unsafe(target: str) -> str | None:
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc:
        return f"link target `{target}` is an external URL, not a local repository path"
    if target.startswith("/"):
        return f"link target `{target}` is an absolute path, not a relative repository path"
    return None


def _resolve_local_path(target: str, matrix_path: Path) -> Path:
    matrix_dir = matrix_path.resolve().parent
    return (matrix_dir / target).resolve()


def _path_escapes_repo(resolved: Path) -> bool:
    try:
        resolved.relative_to(REPO_ROOT.resolve())
        return False
    except ValueError:
        return True


def check_matrix(matrix_path: Path = MATRIX_PATH) -> CheckOutcome:
    if not matrix_path.exists():
        return CheckOutcome(
            ok=False,
            diagnostics=[f"provider readiness matrix not found at `{matrix_path}`"],
        )

    text = _read_matrix(matrix_path)
    section = _extract_section(text, SECTION_HEADING)
    if not section:
        return CheckOutcome(
            ok=False,
            diagnostics=[f"could not locate `{SECTION_HEADING}` section in `{matrix_path}`"],
        )

    header, rows = _parse_provider_table(section)
    required_columns = ("provider", "status", "latest receipt")
    missing_columns = [name for name in required_columns if name not in header]
    if missing_columns:
        return CheckOutcome(
            ok=False,
            diagnostics=[
                f"provider readiness table is missing required column(s): {', '.join(missing_columns)}"
            ],
        )

    provider_idx = header["provider"]
    status_idx = header["status"]
    receipt_idx = header["latest receipt"]

    results: list[ProviderRowResult] = []
    diagnostics: list[str] = []
    overall_ok = True

    for cells in rows:
        if len(cells) <= max(provider_idx, status_idx, receipt_idx):
            continue
        provider = cells[provider_idx].strip().strip("`")
        status = cells[status_idx].strip().strip("`")
        receipt_cell = cells[receipt_idx].strip()

        if status != REQUIRED_STATUS:
            results.append(
                ProviderRowResult(
                    provider=provider,
                    status=status,
                    latest_receipt_cell=receipt_cell,
                    ok=True,
                    reason=f"status `{status}` does not require a receipt link",
                )
            )
            continue

        link_target = _extract_link_target(receipt_cell)
        if not link_target:
            reason = (
                f"provider `{provider}` is `{REQUIRED_STATUS}` but `Latest Receipt` cell "
                f"has no markdown link: `{receipt_cell}`"
            )
            diagnostics.append(reason)
            results.append(
                ProviderRowResult(
                    provider=provider,
                    status=status,
                    latest_receipt_cell=receipt_cell,
                    link_target=None,
                    ok=False,
                    reason=reason,
                )
            )
            overall_ok = False
            continue

        unsafe_reason = _is_external_or_unsafe(link_target)
        if unsafe_reason:
            reason = f"provider `{provider}` is `{REQUIRED_STATUS}` but {unsafe_reason}"
            diagnostics.append(reason)
            results.append(
                ProviderRowResult(
                    provider=provider,
                    status=status,
                    latest_receipt_cell=receipt_cell,
                    link_target=link_target,
                    ok=False,
                    reason=reason,
                )
            )
            overall_ok = False
            continue

        resolved = _resolve_local_path(link_target, matrix_path)
        if _path_escapes_repo(resolved):
            reason = (
                f"provider `{provider}` is `{REQUIRED_STATUS}` but link target `{link_target}` "
                "resolves outside the repository root"
            )
            diagnostics.append(reason)
            results.append(
                ProviderRowResult(
                    provider=provider,
                    status=status,
                    latest_receipt_cell=receipt_cell,
                    link_target=link_target,
                    ok=False,
                    reason=reason,
                )
            )
            overall_ok = False
            continue

        if not resolved.is_file():
            reason = (
                f"provider `{provider}` is `{REQUIRED_STATUS}` but link target `{link_target}` "
                f"does not exist on disk at `{resolved}`"
            )
            diagnostics.append(reason)
            results.append(
                ProviderRowResult(
                    provider=provider,
                    status=status,
                    latest_receipt_cell=receipt_cell,
                    link_target=link_target,
                    ok=False,
                    reason=reason,
                )
            )
            overall_ok = False
            continue

        results.append(
            ProviderRowResult(
                provider=provider,
                status=status,
                latest_receipt_cell=receipt_cell,
                link_target=link_target,
                ok=True,
                reason=f"`{REQUIRED_STATUS}` receipt link resolves to `{link_target}`",
            )
        )

    return CheckOutcome(ok=overall_ok, rows=results, diagnostics=diagnostics)


def emit_text(outcome: CheckOutcome) -> int:
    print("CVF PROVIDER RECEIPT-LINK INTEGRITY CHECK")
    print("=" * 68)
    if not outcome.rows and outcome.diagnostics:
        for diag in outcome.diagnostics:
            print(f"[FAIL] {diag}")
        print("-" * 68)
        print("GATE RESULT: FAIL")
        return 1
    for row in outcome.rows:
        status_label = "PASS" if row.ok else "FAIL"
        print(f"[{status_label}] {row.provider} ({row.status}): {row.reason}")
    print("-" * 68)
    print(f"GATE RESULT: {'PASS' if outcome.ok else 'FAIL'}")
    if not outcome.ok:
        print("Diagnostics:")
        for diag in outcome.diagnostics:
            print(f"  - {diag}")
    return 0 if outcome.ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--matrix-path",
        default=str(MATRIX_PATH),
        help="Path to the provider readiness matrix markdown file",
    )
    args = parser.parse_args(argv)
    outcome = check_matrix(Path(args.matrix_path))
    return emit_text(outcome)


if __name__ == "__main__":
    sys.exit(main())
