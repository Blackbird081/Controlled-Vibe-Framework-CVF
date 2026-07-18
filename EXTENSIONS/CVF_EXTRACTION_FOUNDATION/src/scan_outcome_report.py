"""
Domain-agnostic operator reporting for CVF extraction scan outcomes.

The report contains bounded extraction evidence and operator actions only. It
does not release descriptors, extracted chunks, OCR text, or domain decisions.
"""

from __future__ import annotations

from dataclasses import dataclass
from json import dumps
from pathlib import Path
from typing import Literal, Mapping, Sequence

from extraction_pipeline import ExtractionStatus, ExtractionStorageBoundary

ScanOutcomeSeverity = Literal["INFO", "WARNING", "BLOCKING"]
ScanOutcomeDisposition = Literal[
    "READY_FOR_DOWNSTREAM",
    "OPERATOR_REVIEW_REQUIRED",
]

REPORT_VERSION = "cvf.scanOutcomeReport.exT9.v1"
CLAIM_BOUNDARY = (
    "This report describes supplied extraction signals only. It does not prove "
    "extraction accuracy, OCR quality, metadata correctness, domain eligibility, "
    "legal or current status, retrieval quality, or readiness."
)


@dataclass(frozen=True)
class ScanOutcomeFinding:
    """A stable, domain-agnostic scan finding and required operator action."""

    code: str
    severity: ScanOutcomeSeverity
    summary: str
    required_action: str
    evidence: Mapping[str, str]


@dataclass(frozen=True)
class ScanOutcomeReport:
    """Bounded operator-visible report derived from an extraction boundary."""

    report_version: str
    source_artifact_id: str
    source_hash: str
    boundary_sha256: str
    disposition: ScanOutcomeDisposition
    operator_review_required: bool
    extraction_status: ExtractionStatus
    metrics: Mapping[str, int | float | bool | None]
    findings: tuple[ScanOutcomeFinding, ...]
    claim_boundary: str


_QUALITY_FINDINGS: dict[
    ExtractionStatus,
    tuple[str, ScanOutcomeSeverity, str, str],
] = {
    "EMPTY": (
        "EXTRACTION_EMPTY",
        "BLOCKING",
        "The extractor produced no usable text.",
        "REVIEW_SOURCE_OR_EXTRACTION_ROUTE",
    ),
    "NEEDS_TIER2_OCR": (
        "TIER2_OCR_REQUIRED",
        "BLOCKING",
        "The digital-native extraction result requires a Tier 2 OCR route.",
        "SUPPLY_OR_AUTHORIZE_TIER2_OCR_ADAPTER",
    ),
    "PARTIAL_EXTRACTION": (
        "PARTIAL_PAGE_COVERAGE",
        "BLOCKING",
        "One or more source pages produced no usable extraction output.",
        "REVIEW_MISSING_OR_EMPTY_PAGES",
    ),
    "OCR_LOW_CONFIDENCE": (
        "OCR_CONFIDENCE_BELOW_THRESHOLD",
        "BLOCKING",
        "Mean OCR confidence is below the governed extraction threshold.",
        "REVIEW_OCR_OUTPUT_OR_USE_ALTERNATE_SOURCE",
    ),
}


def _quality_signals(boundary: ExtractionStorageBoundary) -> list[ExtractionStatus]:
    quality = boundary.quality_report
    signals = list(quality.quality_flags)
    if quality.status != "PASS":
        signals.insert(0, quality.status)
    return list(dict.fromkeys(signals))


def _finding_for_quality_signal(
    signal: ExtractionStatus,
    boundary: ExtractionStorageBoundary,
) -> ScanOutcomeFinding:
    try:
        code, severity, summary, required_action = _QUALITY_FINDINGS[signal]
    except KeyError as exc:
        raise ValueError(f"Unsupported extraction quality signal: {signal}") from exc

    quality = boundary.quality_report
    evidence = {
        "extractionStatus": quality.status,
        "qualitySignal": signal,
        "pageCoverageRatio": f"{quality.page_coverage_ratio:.6f}",
    }
    if signal == "OCR_LOW_CONFIDENCE":
        evidence["meanOcrConfidence"] = (
            "null"
            if quality.mean_ocr_confidence is None
            else f"{quality.mean_ocr_confidence:.6f}"
        )
        evidence["ocrConfidenceThreshold"] = str(
            quality.thresholds.get("OCR_CONFIDENCE", "unknown")
        )

    return ScanOutcomeFinding(
        code=code,
        severity=severity,
        summary=summary,
        required_action=required_action,
        evidence=evidence,
    )


def build_scan_outcome_report(
    *,
    source_artifact_id: str,
    source_hash: str,
    boundary: ExtractionStorageBoundary,
    additional_findings: Sequence[ScanOutcomeFinding] = (),
) -> ScanOutcomeReport:
    """Build an operator report without exposing extraction content."""

    findings = [
        _finding_for_quality_signal(signal, boundary)
        for signal in _quality_signals(boundary)
    ]
    findings.extend(additional_findings)
    operator_review_required = any(
        finding.severity != "INFO" for finding in findings
    )
    disposition: ScanOutcomeDisposition = (
        "OPERATOR_REVIEW_REQUIRED"
        if operator_review_required
        else "READY_FOR_DOWNSTREAM"
    )
    quality = boundary.quality_report

    return ScanOutcomeReport(
        report_version=REPORT_VERSION,
        source_artifact_id=source_artifact_id,
        source_hash=source_hash,
        boundary_sha256=boundary.boundary_sha256,
        disposition=disposition,
        operator_review_required=operator_review_required,
        extraction_status=quality.status,
        metrics={
            "pageCount": quality.page_count,
            "pagesWithOutput": quality.pages_with_output,
            "pageCoverageRatio": quality.page_coverage_ratio,
            "totalCharCount": quality.total_char_count,
            "avgCharsPerPage": quality.avg_chars_per_page,
            "meanOcrConfidence": quality.mean_ocr_confidence,
            "chunkCount": boundary.chunk_count,
            "rawOcrRetained": boundary.raw_ocr_retained,
        },
        findings=tuple(findings),
        claim_boundary=CLAIM_BOUNDARY,
    )


def _report_payload(report: ScanOutcomeReport) -> dict[str, object]:
    return {
        "reportVersion": report.report_version,
        "sourceArtifactId": report.source_artifact_id,
        "sourceHash": report.source_hash,
        "boundarySha256": report.boundary_sha256,
        "disposition": report.disposition,
        "operatorReviewRequired": report.operator_review_required,
        "extractionStatus": report.extraction_status,
        "metrics": dict(report.metrics),
        "findings": [
            {
                "code": finding.code,
                "severity": finding.severity,
                "summary": finding.summary,
                "requiredAction": finding.required_action,
                "evidence": dict(finding.evidence),
            }
            for finding in report.findings
        ],
        "claimBoundary": report.claim_boundary,
    }


def render_scan_outcome_report_json(report: ScanOutcomeReport) -> str:
    """Render stable, machine-readable JSON with a trailing newline."""

    return dumps(
        _report_payload(report),
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\n"


def _markdown_cell(value: object) -> str:
    return str(value).replace("|", r"\|").replace("\r", " ").replace("\n", " ")


def render_scan_outcome_report_markdown(report: ScanOutcomeReport) -> str:
    """Render a bounded human-readable operator report."""

    lines = [
        "# CVF Scan Outcome Report",
        "",
        f"- Report version: `{report.report_version}`",
        f"- Source artifact: `{report.source_artifact_id}`",
        f"- Source hash: `{report.source_hash}`",
        f"- Boundary SHA-256: `{report.boundary_sha256}`",
        f"- Extraction status: `{report.extraction_status}`",
        f"- Disposition: `{report.disposition}`",
        f"- Operator review required: `{str(report.operator_review_required).lower()}`",
        "",
        "## Metrics",
        "",
        "| Metric | Value |",
        "| --- | --- |",
    ]
    for key, value in report.metrics.items():
        lines.append(f"| `{_markdown_cell(key)}` | {_markdown_cell(value)} |")

    lines.extend(["", "## Findings And Required Actions", ""])
    if not report.findings:
        lines.append("No operator-review finding was produced.")
    else:
        lines.extend(
            [
                "| Code | Severity | Summary | Required action | Evidence |",
                "| --- | --- | --- | --- | --- |",
            ]
        )
        for finding in report.findings:
            evidence = "; ".join(
                f"{key}={value}" for key, value in sorted(finding.evidence.items())
            )
            lines.append(
                "| "
                f"`{_markdown_cell(finding.code)}` | "
                f"`{_markdown_cell(finding.severity)}` | "
                f"{_markdown_cell(finding.summary)} | "
                f"`{_markdown_cell(finding.required_action)}` | "
                f"{_markdown_cell(evidence)} |"
            )

    lines.extend(
        [
            "",
            "## Claim Boundary",
            "",
            report.claim_boundary,
            "",
        ]
    )
    return "\n".join(lines)


def write_scan_outcome_report_files(
    report: ScanOutcomeReport,
    *,
    json_path: str | Path,
    markdown_path: str | Path,
) -> tuple[Path, Path]:
    """Write JSON and Markdown reports to caller-selected UTF-8 paths."""

    resolved_json_path = Path(json_path)
    resolved_markdown_path = Path(markdown_path)
    resolved_json_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_markdown_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_json_path.write_text(
        render_scan_outcome_report_json(report),
        encoding="utf-8",
    )
    resolved_markdown_path.write_text(
        render_scan_outcome_report_markdown(report),
        encoding="utf-8",
    )
    return resolved_json_path, resolved_markdown_path
