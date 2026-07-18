"""
DICE-T1 focused tests for the Document Intelligence Control Envelope.

Test name prefix conventions used here:
  DICE-MC-01: DICE does not define a new ScanRouteDisposition literal owner
  DICE-MC-02: DICE does not define a new AuthorizationGate literal owner
  DICE-MC-03: DICE does not define a new DownstreamCapability literal owner
  DICE-MC-04: blocked/provider/OCR gates do not produce unqualified handoff
  DICE-MC-05: operator_review_required is surfaced in envelope result
  DICE-MC-06: scan_decision_digest is preserved
  DICE-MC-07: decision_version is preserved
  DICE-MC-08: downstream_eligibility not widened beyond DIR output; existing
              DIR passthrough behavior preserved
  DICE-MC-09: no new OCR confidence threshold is introduced
  DICE-MC-10: scan findings are preserved without filtering or suppression
"""

from __future__ import annotations

import sys
from dataclasses import fields
from pathlib import Path
from typing import get_args

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from document_intelligence_control_envelope import (  # noqa: E402
    DICE_T1_ENVELOPE_VERSION,
    DocumentIntelligenceControlEnvelopeInput,
    DocumentIntelligenceControlEnvelopeResult,
    EnvelopeAdapterHandoff,
    build_document_intelligence_control_envelope,
)
from document_intelligence_router import (  # noqa: E402
    AuthorizationGate,
    DOCUMENT_INTELLIGENCE_ROUTE_VERSION,
    DownstreamCapability,
    DocumentProfile,
    DocumentStructureSignals,
)
from extraction_pipeline import (  # noqa: E402
    ExtractionQualityReport,
    ExtractionStorageBoundary,
)
from scan_outcome_report import (  # noqa: E402
    ScanOutcomeFinding,
    ScanOutcomeReport,
    build_scan_outcome_report,
)
from scan_route_decision import (  # noqa: E402
    CLAIM_BOUNDARY as SCAN_CLAIM_BOUNDARY,
    SCAN_ROUTE_DECISION_VERSION,
    ScanRouteDecision,
    ScanRouteDisposition,
)


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------


def _profile(
    requested_capability: str = "STRUCTURED_TEXT_HANDOFF",
) -> DocumentProfile:
    return DocumentProfile(
        source_artifact_id="artifact-dice-001",
        source_hash="b" * 64,
        source_type="pdf",
        language_hints=("en",),
        page_count=3,
        declared_artifact_role="corpus_candidate",
        domain_hint="general",
        requested_capability=requested_capability,
    )


def _structure() -> DocumentStructureSignals:
    return DocumentStructureSignals(
        has_tables=False,
        has_images=False,
        has_formulas=False,
        layout_preservation_risk="LOW",
        scanned_page_ratio=None,
        citation_marker_present=False,
        missing_page_flag=False,
    )


def _scan_decision(route: str) -> ScanRouteDecision:
    return ScanRouteDecision(
        decision_version=SCAN_ROUTE_DECISION_VERSION,
        route=route,
        reason_codes=[f"TEST_{route}"],
        operator_action="TEST_OPERATOR_ACTION",
        claim_boundary=SCAN_CLAIM_BOUNDARY,
    )


def _quality_report_pass() -> ExtractionQualityReport:
    return ExtractionQualityReport(
        status="PASS",
        quality_flags=[],
        page_count=3,
        pages_with_output=3,
        page_coverage_ratio=1.0,
        total_char_count=900,
        avg_chars_per_page=300.0,
        mean_ocr_confidence=None,
        thresholds={"MIN_CHARS_PER_PAGE": 50.0, "OCR_CONFIDENCE": 0.75, "PAGE_COVERAGE": 0.80},
    )


def _boundary_pass() -> ExtractionStorageBoundary:
    return ExtractionStorageBoundary(
        descriptor_inputs=[],
        quality_report=_quality_report_pass(),
        chunk_count=0,
        raw_ocr_retained=False,
        boundary_sha256="sha256:boundary-pass",
    )


def _boundary_with_status(status: str) -> ExtractionStorageBoundary:
    from extraction_pipeline import ExtractionStatus
    s: ExtractionStatus = status  # type: ignore[assignment]
    quality = ExtractionQualityReport(
        status=s,
        quality_flags=[s],
        page_count=3,
        pages_with_output=1,
        page_coverage_ratio=0.5,
        total_char_count=100,
        avg_chars_per_page=33.0,
        mean_ocr_confidence=0.5 if status == "OCR_LOW_CONFIDENCE" else None,
        thresholds={"MIN_CHARS_PER_PAGE": 50.0, "OCR_CONFIDENCE": 0.75, "PAGE_COVERAGE": 0.80},
    )
    return ExtractionStorageBoundary(
        descriptor_inputs=[],
        quality_report=quality,
        chunk_count=0,
        raw_ocr_retained=False,
        boundary_sha256=f"sha256:boundary-{status}",
    )


def _outcome_report_pass() -> ScanOutcomeReport:
    return build_scan_outcome_report(
        source_artifact_id="artifact-dice-001",
        source_hash="b" * 64,
        boundary=_boundary_pass(),
    )


def _outcome_report_with_finding(status: str) -> ScanOutcomeReport:
    return build_scan_outcome_report(
        source_artifact_id="artifact-dice-001",
        source_hash="b" * 64,
        boundary=_boundary_with_status(status),
    )


def _envelope_input(
    route: str = "LOCAL_TEXT_EXTRACTION_RECOMMENDED",
    requested_capability: str = "STRUCTURED_TEXT_HANDOFF",
    outcome_report: ScanOutcomeReport | None = None,
) -> DocumentIntelligenceControlEnvelopeInput:
    report = outcome_report if outcome_report is not None else _outcome_report_pass()
    return DocumentIntelligenceControlEnvelopeInput(
        profile=_profile(requested_capability),
        structure_signals=_structure(),
        scan_decision=_scan_decision(route),
        outcome_report=report,
    )


# ---------------------------------------------------------------------------
# DICE-MC-01: DICE does not define a new ScanRouteDisposition literal owner
# ---------------------------------------------------------------------------


def test_DICE_MC_01_envelope_module_does_not_define_scan_route_disposition() -> None:
    """DICE-MC-01: DICE must not introduce or redefine ScanRouteDisposition literals.

    The owner module for ScanRouteDisposition is scan_route_decision (EXA-T2).
    DICE may import it for type annotations but must not re-define it.
    We verify via __module__ that the type's origin is the EXA-T2 owner, not DICE.
    """
    import document_intelligence_control_envelope as dice_module

    # If present in DICE namespace it must be the same object as from owner.
    if hasattr(dice_module, "ScanRouteDisposition"):
        from scan_route_decision import ScanRouteDisposition as owner_type
        assert getattr(dice_module, "ScanRouteDisposition") is owner_type, (
            "DICE-MC-01: ScanRouteDisposition in DICE namespace is not the "
            "authoritative EXA-T2 owner object - re-definition detected."
        )

    # DICE must not declare the individual literal string values as module-level
    # constants in its own namespace independently of the owner type.
    authoritative_values = set(get_args(ScanRouteDisposition))
    assert len(authoritative_values) == 4
    for value in authoritative_values:
        assert not hasattr(dice_module, value), (
            f"DICE-MC-01: literal value {value!r} is redeclared as a "
            "standalone name in the DICE envelope module."
        )


# ---------------------------------------------------------------------------
# DICE-MC-02: DICE does not define a new AuthorizationGate literal owner
# ---------------------------------------------------------------------------


def test_DICE_MC_02_envelope_module_does_not_define_authorization_gate() -> None:
    """DICE-MC-02: DICE must not introduce or redefine AuthorizationGate literals.

    The owner module for AuthorizationGate is document_intelligence_router (DIR).
    DICE may import it for type annotations but must not re-define it.
    """
    import document_intelligence_control_envelope as dice_module

    if hasattr(dice_module, "AuthorizationGate"):
        from document_intelligence_router import AuthorizationGate as owner_type
        assert getattr(dice_module, "AuthorizationGate") is owner_type, (
            "DICE-MC-02: AuthorizationGate in DICE namespace is not the "
            "authoritative DIR owner object - re-definition detected."
        )

    authoritative_values = set(get_args(AuthorizationGate))
    for value in authoritative_values:
        assert not hasattr(dice_module, value), (
            f"DICE-MC-02: literal value {value!r} is redeclared as a "
            "standalone name in the DICE envelope module."
        )


# ---------------------------------------------------------------------------
# DICE-MC-03: DICE does not define a new DownstreamCapability literal owner
# ---------------------------------------------------------------------------


def test_DICE_MC_03_envelope_module_does_not_define_downstream_capability() -> None:
    """DICE-MC-03: DICE must not introduce or redefine DownstreamCapability literals.

    The owner module for DownstreamCapability is document_intelligence_router (DIR).
    DICE may import it for type annotations but must not re-define it.
    """
    import document_intelligence_control_envelope as dice_module

    if hasattr(dice_module, "DownstreamCapability"):
        from document_intelligence_router import DownstreamCapability as owner_type
        assert getattr(dice_module, "DownstreamCapability") is owner_type, (
            "DICE-MC-03: DownstreamCapability in DICE namespace is not the "
            "authoritative DIR owner object - re-definition detected."
        )

    authoritative_values = set(get_args(DownstreamCapability))
    for value in authoritative_values:
        assert not hasattr(dice_module, value), (
            f"DICE-MC-03: literal value {value!r} is redeclared as a "
            "standalone name in the DICE envelope module."
        )


# ---------------------------------------------------------------------------
# DICE-MC-04: blocked/provider/OCR/operator-review gates do not produce
#             unqualified downstream handoff
# ---------------------------------------------------------------------------


DICE_MUST_NOT_FORWARD_BLOCKED_HANDOFF = "DICE_MUST_NOT_FORWARD_BLOCKED_HANDOFF"


@pytest.mark.parametrize(
    "scan_route",
    [
        "BLOCKED_UNSUPPORTED",
        "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED",
        "ESCALATE_OR_ABSTAIN",
    ],
)
def test_DICE_MC_04_blocked_ocr_operator_gates_produce_blocked_handoff(
    scan_route: str,
) -> None:
    """DICE-MC-04 / DICE_MUST_NOT_FORWARD_BLOCKED_HANDOFF: non-local routes must
    never yield HANDOFF_AUTHORIZED regardless of outcome report state."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route=scan_route)
    )

    assert result.handoff.handoff_status == "HANDOFF_BLOCKED", (
        f"DICE_MUST_NOT_FORWARD_BLOCKED_HANDOFF: route={scan_route!r} must "
        f"produce HANDOFF_BLOCKED, got {result.handoff.handoff_status!r}"
    )
    assert result.handoff.downstream_eligibility != ("STRUCTURED_TEXT_HANDOFF",)


def test_DICE_MC_04_operator_review_required_blocks_handoff(
) -> None:
    """DICE-MC-04: HANDOFF_BLOCKED when operator review is required even for
    LOCAL_DETERMINISTIC_ALLOWED gate (outcome report has findings)."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            outcome_report=_outcome_report_with_finding("EMPTY"),
        )
    )

    assert result.handoff.handoff_status == "HANDOFF_BLOCKED", (
        "DICE_MUST_NOT_FORWARD_BLOCKED_HANDOFF: operator review required must "
        "block handoff even when DIR gate is LOCAL_DETERMINISTIC_ALLOWED"
    )
    assert result.handoff.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
    assert result.handoff.operator_review_required is True


# ---------------------------------------------------------------------------
# DICE-MC-05: operator_review_required is surfaced in envelope result
# ---------------------------------------------------------------------------


def test_DICE_MC_05_operator_review_required_surfaced_when_true() -> None:
    """DICE-MC-05: outcome_report.operator_review_required=True must flow to handoff."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            outcome_report=_outcome_report_with_finding("OCR_LOW_CONFIDENCE"),
        )
    )

    assert result.outcome_report.operator_review_required is True
    assert result.handoff.operator_review_required is True


def test_DICE_MC_05_operator_review_required_false_on_clean_pass() -> None:
    """DICE-MC-05: operator_review_required=False must flow to handoff on PASS."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.outcome_report.operator_review_required is False
    assert result.handoff.operator_review_required is False


# ---------------------------------------------------------------------------
# DICE-MC-06: scan_decision_digest is preserved
# ---------------------------------------------------------------------------


def test_DICE_MC_06_scan_decision_digest_is_preserved_from_dir() -> None:
    """DICE-MC-06: handoff.scan_decision_digest must equal DIR route_decision digest."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.handoff.scan_decision_digest == result.route_decision.scan_decision_digest
    assert len(result.handoff.scan_decision_digest) == 64
    assert result.handoff.scan_decision_digest.isalnum()


# ---------------------------------------------------------------------------
# DICE-MC-07: decision_version is preserved
# ---------------------------------------------------------------------------


def test_DICE_MC_07_decision_version_is_preserved_from_dir() -> None:
    """DICE-MC-07: handoff.decision_version must equal DIR route_decision.decision_version."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.handoff.decision_version == DOCUMENT_INTELLIGENCE_ROUTE_VERSION
    assert result.handoff.decision_version == result.route_decision.decision_version


# ---------------------------------------------------------------------------
# DICE-MC-08: downstream_eligibility not widened beyond DIR output;
#             existing DIR passthrough behavior preserved
# ---------------------------------------------------------------------------


def test_DICE_MC_08_downstream_eligibility_is_not_widened_beyond_dir_output() -> None:
    """DICE-MC-08: handoff.downstream_eligibility must equal DIR downstream_eligibility.

    Preserves existing DIR passthrough invariant for LOCAL_DETERMINISTIC_ALLOWED:
    the requested capability is forwarded as-is from the DIR decision.
    No DICE-specific widening is allowed.
    """

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            requested_capability="EVIDENCE_CITATION_HANDOFF",
        )
    )

    assert result.handoff.downstream_eligibility == result.route_decision.downstream_eligibility
    assert result.handoff.downstream_eligibility == ("EVIDENCE_CITATION_HANDOFF",)


def test_DICE_MC_08_dir_passthrough_preserved_for_local_deterministic_allowed() -> None:
    """DICE-MC-08: existing DIR passthrough for LOCAL_DETERMINISTIC_ALLOWED is
    not broken. For each supported requested_capability, DICE handoff equals DIR."""

    for capability in get_args(DownstreamCapability):
        result = build_document_intelligence_control_envelope(
            _envelope_input(
                route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
                requested_capability=capability,
            )
        )
        assert result.handoff.downstream_eligibility == result.route_decision.downstream_eligibility, (
            f"DICE-MC-08: downstream_eligibility mismatch for capability={capability!r}"
        )


def test_DICE_MC_08_blocked_route_yields_abstain_passthrough() -> None:
    """DICE-MC-08: DIR passthrough for BLOCKED_UNSUPPORTED remains ABSTAIN_OR_BLOCK."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="BLOCKED_UNSUPPORTED")
    )

    assert result.handoff.downstream_eligibility == ("ABSTAIN_OR_BLOCK",)
    assert result.handoff.downstream_eligibility == result.route_decision.downstream_eligibility


def test_DICE_MC_08_ocr_route_yields_operator_review_only_passthrough() -> None:
    """DICE-MC-08: DIR passthrough for OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED is
    OPERATOR_REVIEW_ONLY and must not be widened by DICE."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED")
    )

    assert result.handoff.downstream_eligibility == ("OPERATOR_REVIEW_ONLY",)
    assert result.handoff.downstream_eligibility == result.route_decision.downstream_eligibility


# ---------------------------------------------------------------------------
# DICE-MC-09: no new OCR confidence threshold is introduced
# ---------------------------------------------------------------------------


def test_DICE_MC_09_envelope_module_does_not_define_ocr_confidence_threshold() -> None:
    """DICE-MC-09: DICE must not introduce a new OCR confidence threshold constant."""
    import document_intelligence_control_envelope as dice_module
    import extraction_pipeline

    # Authoritative threshold lives in extraction_pipeline only.
    assert hasattr(extraction_pipeline, "OCR_CONFIDENCE_THRESHOLD")
    authoritative_threshold = extraction_pipeline.OCR_CONFIDENCE_THRESHOLD

    # DICE module must not declare its own threshold constant.
    assert not hasattr(dice_module, "OCR_CONFIDENCE_THRESHOLD")

    # No numeric constant in dice_module that equals the authoritative threshold
    # and is defined at module level (avoids accidental re-declaration).
    for attr_name in vars(dice_module):
        value = getattr(dice_module, attr_name)
        if isinstance(value, float) and value == authoritative_threshold:
            pytest.fail(
                f"DICE-MC-09: found float constant {attr_name}={value!r} in "
                "DICE module that duplicates the OCR_CONFIDENCE_THRESHOLD owner."
            )


def test_DICE_MC_09_envelope_does_not_evaluate_ocr_confidence_directly() -> None:
    """DICE-MC-09: build_document_intelligence_control_envelope must not contain
    direct threshold comparisons on mean_ocr_confidence."""
    import inspect
    import document_intelligence_control_envelope as dice_module

    source = inspect.getsource(dice_module)
    assert "mean_ocr_confidence" not in source
    assert "OCR_CONFIDENCE_THRESHOLD" not in source
    assert "0.75" not in source


# ---------------------------------------------------------------------------
# DICE-MC-10: scan findings are preserved without filtering or suppression
# ---------------------------------------------------------------------------


def test_DICE_MC_10_scan_findings_preserved_without_filtering() -> None:
    """DICE-MC-10: outcome_report.findings must be preserved unchanged in result."""

    report = _outcome_report_with_finding("PARTIAL_EXTRACTION")
    assert len(report.findings) > 0

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            outcome_report=report,
        )
    )

    assert result.outcome_report.findings == report.findings
    assert result.handoff.findings_count == len(report.findings)


def test_DICE_MC_10_additional_findings_preserved_without_suppression() -> None:
    """DICE-MC-10: additional findings attached to the outcome report must reach
    the envelope result unchanged."""

    extra_finding = ScanOutcomeFinding(
        code="SOURCE_METADATA_MISSING",
        severity="BLOCKING",
        summary="Required source metadata field absent.",
        required_action="REVIEW_SOURCE_METADATA",
        evidence={"field": "sourceDate"},
    )
    report = build_scan_outcome_report(
        source_artifact_id="artifact-dice-001",
        source_hash="b" * 64,
        boundary=_boundary_pass(),
        additional_findings=[extra_finding],
    )

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            outcome_report=report,
        )
    )

    assert extra_finding in result.outcome_report.findings
    assert result.handoff.findings_count == len(report.findings)


def test_DICE_MC_10_empty_findings_preserved() -> None:
    """DICE-MC-10: when no findings exist, the empty tuple must be preserved."""

    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.outcome_report.findings == ()
    assert result.handoff.findings_count == 0


# ---------------------------------------------------------------------------
# Additional envelope integrity tests
# ---------------------------------------------------------------------------


def test_envelope_result_carries_version_and_claim_boundary() -> None:
    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.envelope_version == DICE_T1_ENVELOPE_VERSION
    assert result.handoff.envelope_version == DICE_T1_ENVELOPE_VERSION
    assert "local deterministic CVF foundation" in result.claim_boundary
    assert "local deterministic CVF foundation" in result.handoff.claim_boundary


def test_authorized_handoff_requires_local_allowed_gate_and_no_operator_review() -> None:
    result = build_document_intelligence_control_envelope(
        _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    )

    assert result.handoff.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
    assert result.handoff.operator_review_required is False
    assert result.handoff.handoff_status == "HANDOFF_AUTHORIZED"


def test_envelope_dataclasses_do_not_expose_raw_content_fields() -> None:
    forbidden_tokens = {
        "raw_text",
        "raw_content",
        "ocr_output",
        "raw_ocr",
        "provider_response",
        "extracted_text",
        "text",
    }

    for dataclass_type in (
        DocumentIntelligenceControlEnvelopeInput,
        DocumentIntelligenceControlEnvelopeResult,
        EnvelopeAdapterHandoff,
    ):
        field_names = {f.name for f in fields(dataclass_type)}
        assert field_names.isdisjoint(forbidden_tokens), (
            f"{dataclass_type.__name__} exposes raw content field(s): "
            f"{field_names & forbidden_tokens}"
        )


def test_envelope_input_requires_existing_scan_decision_not_new_signals() -> None:
    """DICE-T1 always consumes a caller-supplied ScanRouteDecision from EXA-T2."""

    inp = _envelope_input(route="LOCAL_TEXT_EXTRACTION_RECOMMENDED")
    assert isinstance(inp.scan_decision, ScanRouteDecision)
    assert inp.scan_decision.decision_version == SCAN_ROUTE_DECISION_VERSION


def test_envelope_result_outcome_report_is_passthrough_not_modified() -> None:
    original_report = _outcome_report_pass()

    result = build_document_intelligence_control_envelope(
        _envelope_input(
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            outcome_report=original_report,
        )
    )

    assert result.outcome_report is original_report
