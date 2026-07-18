"""Focused tests for MEOR-T2 metadata evidence normalization."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from extraction_pipeline import (  # noqa: E402
    ExtractionQualityReport,
    ExtractionStorageBoundary,
)
from metadata_evidence import (  # noqa: E402
    MetadataEvidenceRecord,
    MetadataEvidenceValidationError,
    evaluate_metadata_evidence,
    to_scan_outcome_finding,
)
from scan_outcome_report import build_scan_outcome_report  # noqa: E402

DECLARED = {"shared.metadata_field": "profile.example"}
ALL_BASES = ["SOURCE_EMBEDDED", "OPERATOR_SUPPLIED", "DERIVED_HINT", "NONE"]


def _record(
    observed_state: str,
    evidence_basis: str,
    *,
    requirement_id: str = "shared.metadata_field",
    owner_profile_id: str = "profile.example",
    pointers: tuple[str, ...] | None = None,
) -> MetadataEvidenceRecord:
    evidence_pointers = pointers
    if evidence_pointers is None:
        evidence_pointers = (
            ("artifact:source#metadata",)
            if evidence_basis in {"SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"}
            else ()
        )
    return MetadataEvidenceRecord(
        requirement_id=requirement_id,
        owner_profile_id=owner_profile_id,
        observed_state=observed_state,  # type: ignore[arg-type]
        evidence_basis=evidence_basis,  # type: ignore[arg-type]
        evidence_pointers=evidence_pointers,
    )


VALID_CASES = [
    ("NOT_APPLICABLE", "NONE", "RESOLVED", "ELIGIBLE_FOR_REEVALUATION"),
    ("PRESENT", "SOURCE_EMBEDDED", "RESOLVED", "ELIGIBLE_FOR_REEVALUATION"),
    ("PRESENT", "OPERATOR_SUPPLIED", "RESOLVED", "ELIGIBLE_FOR_REEVALUATION"),
    ("PRESENT", "DERIVED_HINT", "OPERATOR_ACTION_REQUIRED", "RETAIN_BLOCK"),
    ("PRESENT", "NONE", "OPERATOR_ACTION_REQUIRED", "RETAIN_BLOCK"),
    *[
        (state, basis, "OPERATOR_ACTION_REQUIRED", "RETAIN_BLOCK")
        for state in ("MISSING", "AMBIGUOUS")
        for basis in ALL_BASES
    ],
    *[
        (state, basis, "BLOCKED", "RETAIN_BLOCK")
        for state in ("CONFLICTING", "UNSUPPORTED")
        for basis in ALL_BASES
    ],
]


@pytest.mark.parametrize(
    ("state", "basis", "resolution", "downstream"),
    VALID_CASES,
)
def test_all_21_allowed_state_basis_pairs(
    state: str,
    basis: str,
    resolution: str,
    downstream: str,
) -> None:
    evaluation = evaluate_metadata_evidence(
        _record(state, basis),
        declared_requirements=DECLARED,
    )

    assert evaluation.resolution_state == resolution
    assert evaluation.downstream_disposition == downstream
    if basis == "DERIVED_HINT":
        assert evaluation.downstream_disposition == "RETAIN_BLOCK"


@pytest.mark.parametrize(
    ("record", "token"),
    [
        (_record("NOT_APPLICABLE", "SOURCE_EMBEDDED"), "INVALID_STATE_COMBINATION"),
        (_record("PRESENT", "SOURCE_EMBEDDED", pointers=()), "MISSING_EVIDENCE_POINTER"),
        (_record("PRESENT", "NONE", requirement_id=""), "INVALID_REQUIREMENT_ID"),
        (_record("PRESENT", "NONE", owner_profile_id=""), "INVALID_OWNER_PROFILE_ID"),
        (_record("PRESENT", "NONE", requirement_id="unknown"), "UNDECLARED_REQUIREMENT"),
        (
            _record("PRESENT", "NONE", owner_profile_id="profile.other"),
            "CROSS_PROFILE_REQUIREMENT_BLEED",
        ),
        (
            _record("PRESENT", "SOURCE_EMBEDDED", pointers=("raw:document text",)),
            "RAW_CONTENT_FORBIDDEN",
        ),
    ],
)
def test_invalid_records_fail_closed(
    record: MetadataEvidenceRecord,
    token: str,
) -> None:
    with pytest.raises(MetadataEvidenceValidationError) as exc_info:
        evaluate_metadata_evidence(record, declared_requirements=DECLARED)

    assert exc_info.value.token == token


def test_source_and_operator_evidence_remain_distinct_in_findings() -> None:
    source = to_scan_outcome_finding(
        evaluate_metadata_evidence(
            _record("PRESENT", "SOURCE_EMBEDDED"),
            declared_requirements=DECLARED,
        )
    )
    operator = to_scan_outcome_finding(
        evaluate_metadata_evidence(
            _record("PRESENT", "OPERATOR_SUPPLIED"),
            declared_requirements=DECLARED,
        )
    )

    assert source.evidence["evidenceBasis"] == "SOURCE_EMBEDDED"
    assert operator.evidence["evidenceBasis"] == "OPERATOR_SUPPLIED"
    assert source.evidence != operator.evidence


def test_finding_integrates_with_existing_scan_outcome_report() -> None:
    evaluation = evaluate_metadata_evidence(
        _record("MISSING", "NONE"),
        declared_requirements=DECLARED,
    )
    finding = to_scan_outcome_finding(evaluation)
    boundary = ExtractionStorageBoundary(
        descriptor_inputs=[],
        quality_report=ExtractionQualityReport(
            status="PASS",
            quality_flags=[],
            page_count=1,
            pages_with_output=1,
            page_coverage_ratio=1.0,
            total_char_count=100,
            avg_chars_per_page=100.0,
            mean_ocr_confidence=None,
            thresholds={},
            raw_ocr_retained=False,
        ),
        chunk_count=1,
        raw_ocr_retained=False,
        boundary_sha256="sha256:boundary",
    )

    report = build_scan_outcome_report(
        source_artifact_id="artifact-1",
        source_hash="sha256:source",
        boundary=boundary,
        additional_findings=[finding],
    )

    assert report.operator_review_required is True
    assert report.disposition == "OPERATOR_REVIEW_REQUIRED"
    assert report.findings == (finding,)
    assert "raw" not in repr(finding.evidence).lower()
