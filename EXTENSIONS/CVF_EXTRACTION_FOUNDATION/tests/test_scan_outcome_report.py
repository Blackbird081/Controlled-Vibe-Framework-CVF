"""Focused tests for the EX-T9 operator-visible scan outcome report."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from extraction_pipeline import (  # noqa: E402
    ExtractionQualityReport,
    ExtractionStatus,
    ExtractionStorageBoundary,
)
from scan_outcome_report import (  # noqa: E402
    ScanOutcomeFinding,
    build_scan_outcome_report,
    render_scan_outcome_report_json,
    render_scan_outcome_report_markdown,
    write_scan_outcome_report_files,
)


def _boundary(
    *,
    status: ExtractionStatus = "PASS",
    quality_flags: list[ExtractionStatus] | None = None,
) -> ExtractionStorageBoundary:
    flags = [] if quality_flags is None else quality_flags
    return ExtractionStorageBoundary(
        descriptor_inputs=[],
        quality_report=ExtractionQualityReport(
            status=status,
            quality_flags=flags,
            page_count=2,
            pages_with_output=2 if status == "PASS" else 1,
            page_coverage_ratio=1.0 if status == "PASS" else 0.5,
            total_char_count=240,
            avg_chars_per_page=120.0,
            mean_ocr_confidence=0.91 if status == "PASS" else 0.5,
            thresholds={
                "OCR_CONFIDENCE": 0.75,
                "PAGE_COVERAGE": 0.8,
            },
            raw_ocr_retained=False,
        ),
        chunk_count=2,
        raw_ocr_retained=False,
        boundary_sha256="sha256:boundary",
    )


def _report(boundary: ExtractionStorageBoundary | None = None):
    return build_scan_outcome_report(
        source_artifact_id="artifact-1",
        source_hash="sha256:source",
        boundary=boundary or _boundary(),
    )


def test_pass_quality_is_ready_without_operator_checkpoint() -> None:
    report = _report()

    assert report.disposition == "READY_FOR_DOWNSTREAM"
    assert report.operator_review_required is False
    assert report.findings == ()


@pytest.mark.parametrize(
    ("signal", "expected_code", "expected_action"),
    [
        ("EMPTY", "EXTRACTION_EMPTY", "REVIEW_SOURCE_OR_EXTRACTION_ROUTE"),
        (
            "NEEDS_TIER2_OCR",
            "TIER2_OCR_REQUIRED",
            "SUPPLY_OR_AUTHORIZE_TIER2_OCR_ADAPTER",
        ),
        (
            "PARTIAL_EXTRACTION",
            "PARTIAL_PAGE_COVERAGE",
            "REVIEW_MISSING_OR_EMPTY_PAGES",
        ),
        (
            "OCR_LOW_CONFIDENCE",
            "OCR_CONFIDENCE_BELOW_THRESHOLD",
            "REVIEW_OCR_OUTPUT_OR_USE_ALTERNATE_SOURCE",
        ),
    ],
)
def test_current_quality_signals_map_to_stable_operator_actions(
    signal: ExtractionStatus,
    expected_code: str,
    expected_action: str,
) -> None:
    report = _report(_boundary(status=signal, quality_flags=[signal]))

    assert report.disposition == "OPERATOR_REVIEW_REQUIRED"
    assert report.operator_review_required is True
    assert [finding.code for finding in report.findings] == [expected_code]
    assert report.findings[0].required_action == expected_action


def test_additional_generic_blocking_finding_requires_operator_review() -> None:
    finding = ScanOutcomeFinding(
        code="SOURCE_METADATA_MISSING",
        severity="BLOCKING",
        summary="A required generic source metadata field is absent.",
        required_action="REVIEW_SOURCE_METADATA",
        evidence={"field": "sourceDate"},
    )
    report = build_scan_outcome_report(
        source_artifact_id="artifact-1",
        source_hash="sha256:source",
        boundary=_boundary(),
        additional_findings=[finding],
    )

    assert report.disposition == "OPERATOR_REVIEW_REQUIRED"
    assert report.findings == (finding,)


def test_json_is_deterministic_parseable_and_releases_no_raw_content() -> None:
    report = _report(
        _boundary(
            status="PARTIAL_EXTRACTION",
            quality_flags=["PARTIAL_EXTRACTION"],
        )
    )

    first = render_scan_outcome_report_json(report)
    second = render_scan_outcome_report_json(report)
    payload = json.loads(first)

    assert first == second
    assert first.endswith("\n")
    assert payload["reportVersion"] == "cvf.scanOutcomeReport.exT9.v1"
    assert payload["operatorReviewRequired"] is True
    assert "descriptor_inputs" not in first
    assert "descriptorInputs" not in first
    assert "rawOcrText" not in first
    assert '"text"' not in first


def test_markdown_contains_source_metrics_findings_and_claim_boundary() -> None:
    report = _report(
        _boundary(
            status="OCR_LOW_CONFIDENCE",
            quality_flags=["OCR_LOW_CONFIDENCE"],
        )
    )

    markdown = render_scan_outcome_report_markdown(report)

    assert "artifact-1" in markdown
    assert "OPERATOR_REVIEW_REQUIRED" in markdown
    assert "pageCoverageRatio" in markdown
    assert "OCR_CONFIDENCE_BELOW_THRESHOLD" in markdown
    assert "REVIEW_OCR_OUTPUT_OR_USE_ALTERNATE_SOURCE" in markdown
    assert "## Claim Boundary" in markdown


def test_utf8_writer_supports_unicode_filenames(tmp_path: Path) -> None:
    report = _report()
    # Intentional Unicode exception: this test proves non-ASCII path handling.
    json_path = tmp_path / "báo-cáo-kết-quả.json"
    markdown_path = tmp_path / "báo-cáo-kết-quả.md"

    written_json, written_markdown = write_scan_outcome_report_files(
        report,
        json_path=json_path,
        markdown_path=markdown_path,
    )

    assert written_json == json_path
    assert written_markdown == markdown_path
    assert json.loads(json_path.read_text(encoding="utf-8"))["disposition"] == (
        "READY_FOR_DOWNSTREAM"
    )
    assert "# CVF Scan Outcome Report" in markdown_path.read_text(encoding="utf-8")
