"""Focused tests for the DIR-T1 deterministic Document Intelligence Router."""

from __future__ import annotations

from dataclasses import fields
import sys
from pathlib import Path
from typing import get_args

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from document_intelligence_router import (  # noqa: E402
    AuthorizationGate,
    CLAIM_BOUNDARY,
    DOCUMENT_INTELLIGENCE_ROUTE_VERSION,
    SCAN_ROUTE_TO_AUTHORIZATION_GATE,
    DownstreamCapability,
    DocumentIntelligenceRouteDecision,
    DocumentProfile,
    DocumentStructureSignals,
    decide_document_intelligence_route,
)
from scan_route_decision import (  # noqa: E402
    CLAIM_BOUNDARY as SCAN_CLAIM_BOUNDARY,
    SCAN_ROUTE_DECISION_VERSION,
    DocumentScanSignals,
    ScanRouteDecision,
    ScanRouteDisposition,
)


def _profile(
    requested_capability: str = "STRUCTURED_TEXT_HANDOFF",
) -> DocumentProfile:
    return DocumentProfile(
        source_artifact_id="artifact-001",
        source_hash="a" * 64,
        source_type="pdf",
        language_hints=("en",),
        page_count=3,
        declared_artifact_role="corpus_candidate",
        domain_hint="general",
        requested_capability=requested_capability,
    )


def _structure() -> DocumentStructureSignals:
    return DocumentStructureSignals(
        has_tables=True,
        has_images=False,
        has_formulas=False,
        layout_preservation_risk="MEDIUM",
        scanned_page_ratio=None,
        citation_marker_present=True,
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


def test_authorization_gate_values_are_disjoint_from_scan_route_dispositions() -> None:
    assert set(get_args(AuthorizationGate)).isdisjoint(set(get_args(ScanRouteDisposition)))


@pytest.mark.parametrize(
    ("scan_route", "expected_gate"),
    [
        ("LOCAL_TEXT_EXTRACTION_RECOMMENDED", "LOCAL_DETERMINISTIC_ALLOWED"),
        ("OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED", "OCR_REQUIRES_SEPARATE_AUTH"),
        ("ESCALATE_OR_ABSTAIN", "OPERATOR_REVIEW_REQUIRED"),
        ("BLOCKED_UNSUPPORTED", "BLOCKED"),
    ],
)
def test_all_scan_dispositions_map_to_dir_t0_authorization_gates(
    scan_route: str,
    expected_gate: str,
) -> None:
    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=_scan_decision(scan_route),
    )

    assert decision.authorization_gate == expected_gate
    assert SCAN_ROUTE_TO_AUTHORIZATION_GATE[scan_route] == expected_gate


def test_derivation_map_is_total_for_current_scan_route_dispositions() -> None:
    assert set(SCAN_ROUTE_TO_AUTHORIZATION_GATE) == set(get_args(ScanRouteDisposition))


def test_scan_route_is_passthrough_from_source_scan_decision() -> None:
    source = _scan_decision("OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED")

    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=source,
    )

    assert decision.scan_route == source.route
    assert decision.scan_route == "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED"


def test_operator_review_scan_route_is_not_downgraded() -> None:
    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=_scan_decision("ESCALATE_OR_ABSTAIN"),
    )

    assert decision.authorization_gate == "OPERATOR_REVIEW_REQUIRED"
    assert decision.downstream_eligibility == ("OPERATOR_REVIEW_ONLY",)
    assert decision.operator_action == "OPERATOR_REVIEW_REQUIRED_BEFORE_DOWNSTREAM_HANDOFF"


def test_blocked_scan_route_yields_blocked_gate() -> None:
    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=_scan_decision("BLOCKED_UNSUPPORTED"),
    )

    assert decision.authorization_gate == "BLOCKED"
    assert decision.downstream_eligibility == ("ABSTAIN_OR_BLOCK",)
    assert decision.operator_action == "STOP_UNSUPPORTED_OR_BLOCKED_SOURCE"


def test_local_deterministic_route_preserves_requested_capability_shape() -> None:
    decision = decide_document_intelligence_route(
        profile=_profile("EVIDENCE_CITATION_HANDOFF"),
        structure_signals=_structure(),
        scan_decision=_scan_decision("LOCAL_TEXT_EXTRACTION_RECOMMENDED"),
    )

    assert decision.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
    assert decision.downstream_eligibility == ("EVIDENCE_CITATION_HANDOFF",)


def test_router_can_compose_existing_scan_route_function_from_signals() -> None:
    scan_signals = DocumentScanSignals(
        source_type="pdf",
        language_codes=["en"],
        page_count=2,
        text_presence=True,
        page_coverage_ratio=1.0,
        mean_ocr_confidence=None,
        quality_flags=[],
        extraction_status="PASS",
    )

    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_signals=scan_signals,
    )

    assert decision.scan_route == "LOCAL_TEXT_EXTRACTION_RECOMMENDED"
    assert decision.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"


def test_scan_decision_digest_is_present_and_not_raw_content() -> None:
    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=_scan_decision("LOCAL_TEXT_EXTRACTION_RECOMMENDED"),
    )

    assert len(decision.scan_decision_digest) == 64
    assert decision.scan_decision_digest.isalnum()
    assert "TEST_OPERATOR_ACTION" not in decision.scan_decision_digest
    assert "LOCAL_TEXT_EXTRACTION_RECOMMENDED" not in decision.scan_decision_digest


def test_router_decision_carries_version_and_claim_boundary() -> None:
    decision = decide_document_intelligence_route(
        profile=_profile(),
        structure_signals=_structure(),
        scan_decision=_scan_decision("LOCAL_TEXT_EXTRACTION_RECOMMENDED"),
    )

    assert decision.decision_version == DOCUMENT_INTELLIGENCE_ROUTE_VERSION
    assert decision.claim_boundary == CLAIM_BOUNDARY


def test_decision_requires_scan_decision_or_scan_signals() -> None:
    with pytest.raises(ValueError, match="scan_decision or scan_signals is required"):
        decide_document_intelligence_route(
            profile=_profile(),
            structure_signals=_structure(),
        )


def test_dir_dataclasses_do_not_expose_raw_content_fields() -> None:
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
        DocumentProfile,
        DocumentStructureSignals,
        DocumentIntelligenceRouteDecision,
    ):
        field_names = {field.name for field in fields(dataclass_type)}
        assert field_names.isdisjoint(forbidden_tokens)


def test_downstream_capabilities_do_not_contain_use_case_names() -> None:
    capability_values = set(get_args(DownstreamCapability))

    assert "TRANSLATION_PREP" not in capability_values
    assert "POLICY_EVIDENCE_REVIEW" not in capability_values
    assert all("TRANSLATION" not in value for value in capability_values)
    assert all("POLICY" not in value for value in capability_values)
