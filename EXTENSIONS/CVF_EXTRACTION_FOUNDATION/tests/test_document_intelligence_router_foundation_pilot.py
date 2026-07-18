"""DIR-T2 foundation pilot harness -- synthetic metadata-only fixture corpus.

Claim boundary: deterministic local composition proof only. This harness
does not execute OCR, call providers, read external repositories, ingest corpus
records, mutate retrieval or session state, or claim document intelligence
readiness.

Sample corpus:
  DIR-T2-S1  digital-native structured text handoff (LOCAL_TEXT_EXTRACTION_RECOMMENDED)
  DIR-T2-S2  scanned/image-heavy document needing OCR auth (OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED)
  DIR-T2-S3  ambiguous/low-confidence requiring operator review (ESCALATE_OR_ABSTAIN)
  DIR-T2-S4  unsupported source blocked by scan layer (BLOCKED_UNSUPPORTED)
"""

from __future__ import annotations

import sys
from dataclasses import fields
from pathlib import Path
from typing import get_args

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from document_intelligence_router import (  # noqa: E402
    CLAIM_BOUNDARY,
    DOCUMENT_INTELLIGENCE_ROUTE_VERSION,
    AuthorizationGate,
    DocumentIntelligenceRouteDecision,
    DocumentProfile,
    DocumentStructureSignals,
    DownstreamCapability,
    SCAN_ROUTE_TO_AUTHORIZATION_GATE,
    decide_document_intelligence_route,
)
from scan_route_decision import (  # noqa: E402
    CLAIM_BOUNDARY as SCAN_CLAIM_BOUNDARY,
    SCAN_ROUTE_DECISION_VERSION,
    DocumentScanSignals,
    ScanRouteDecision,
    ScanRouteDisposition,
)

# ---------------------------------------------------------------------------
# Forbidden payload tokens -- none of these may appear in any fixture field
# or decision field (except as part of the claim-boundary prose itself).
# ---------------------------------------------------------------------------
_FORBIDDEN_RAW_TOKENS = frozenset(
    {
        "raw_text",
        "raw_content",
        "ocr_output",
        "raw_ocr",
        "provider_response",
        "extracted_text",
    }
)

_FORBIDDEN_USECASE_TOKENS = frozenset(
    {
        "TRANSLATION",
        "POLICY_EVIDENCE",
        "Document_Translator",
        "Policy_Local",
    }
)


# ---------------------------------------------------------------------------
# Synthetic fixture builders (metadata-only, no document content).
# ---------------------------------------------------------------------------


def _scan_decision_for(route: ScanRouteDisposition) -> ScanRouteDecision:
    """Build a minimal synthetic ScanRouteDecision for the given disposition."""
    return ScanRouteDecision(
        decision_version=SCAN_ROUTE_DECISION_VERSION,
        route=route,
        reason_codes=[f"PILOT_{route}"],
        operator_action="PILOT_OPERATOR_ACTION",
        claim_boundary=SCAN_CLAIM_BOUNDARY,
    )


def _profile_for(
    sample_id: str,
    requested_capability: DownstreamCapability = "STRUCTURED_TEXT_HANDOFF",
    source_type: str = "pdf",
) -> DocumentProfile:
    return DocumentProfile(
        source_artifact_id=f"pilot-{sample_id}",
        source_hash="b" * 64,
        source_type=source_type,
        language_hints=("vi",),
        page_count=5,
        declared_artifact_role="pilot_fixture",
        domain_hint="governance",
        requested_capability=requested_capability,
    )


def _structure_for(
    has_images: bool = False,
    scanned_page_ratio: float | None = None,
    layout_preservation_risk: str = "LOW",
) -> DocumentStructureSignals:
    return DocumentStructureSignals(
        has_tables=False,
        has_images=has_images,
        has_formulas=False,
        layout_preservation_risk=layout_preservation_risk,
        scanned_page_ratio=scanned_page_ratio,
        citation_marker_present=False,
        missing_page_flag=False,
    )


# ---------------------------------------------------------------------------
# Fixture corpus -- one record per GC-018 sample.
# ---------------------------------------------------------------------------

PILOT_CORPUS = {
    "DIR-T2-S1": {
        "intent": "digital-native structured text handoff",
        "scan_route": "LOCAL_TEXT_EXTRACTION_RECOMMENDED",
        "expected_gate": "LOCAL_DETERMINISTIC_ALLOWED",
        "expected_operator_action": "PROCEED_TO_AUTHORIZED_LOCAL_DETERMINISTIC_HANDOFF",
        "requested_capability": "STRUCTURED_TEXT_HANDOFF",
        "has_images": False,
        "scanned_page_ratio": None,
        "layout_preservation_risk": "LOW",
    },
    "DIR-T2-S2": {
        "intent": "scanned or image-heavy document requiring OCR authorization",
        "scan_route": "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED",
        "expected_gate": "OCR_REQUIRES_SEPARATE_AUTH",
        "expected_operator_action": "AUTHORIZE_SEPARATE_OCR_WORK_ORDER_OR_OPERATOR_REVIEW",
        "requested_capability": "CORPUS_SCAN_HANDOFF",
        "has_images": True,
        "scanned_page_ratio": 0.9,
        "layout_preservation_risk": "HIGH",
    },
    "DIR-T2-S3": {
        "intent": "ambiguous or low-confidence document requiring operator review",
        "scan_route": "ESCALATE_OR_ABSTAIN",
        "expected_gate": "OPERATOR_REVIEW_REQUIRED",
        "expected_operator_action": "OPERATOR_REVIEW_REQUIRED_BEFORE_DOWNSTREAM_HANDOFF",
        "requested_capability": "EVIDENCE_CITATION_HANDOFF",
        "has_images": False,
        "scanned_page_ratio": 0.3,
        "layout_preservation_risk": "MEDIUM",
    },
    "DIR-T2-S4": {
        "intent": "unsupported source blocked by scan layer",
        "scan_route": "BLOCKED_UNSUPPORTED",
        "expected_gate": "BLOCKED",
        "expected_operator_action": "STOP_UNSUPPORTED_OR_BLOCKED_SOURCE",
        "requested_capability": "STRUCTURED_TEXT_HANDOFF",
        "has_images": False,
        "scanned_page_ratio": None,
        "layout_preservation_risk": "LOW",
    },
}


def _route_sample(sample_id: str) -> DocumentIntelligenceRouteDecision:
    spec = PILOT_CORPUS[sample_id]
    return decide_document_intelligence_route(
        profile=_profile_for(
            sample_id,
            requested_capability=spec["requested_capability"],
        ),
        structure_signals=_structure_for(
            has_images=spec["has_images"],
            scanned_page_ratio=spec["scanned_page_ratio"],
            layout_preservation_risk=spec["layout_preservation_risk"],
        ),
        scan_decision=_scan_decision_for(spec["scan_route"]),
    )


# ---------------------------------------------------------------------------
# 1. Corpus coverage -- all four GC-018 scan dispositions are present.
# ---------------------------------------------------------------------------


def test_pilot_corpus_covers_all_scan_dispositions() -> None:
    covered = {spec["scan_route"] for spec in PILOT_CORPUS.values()}
    all_dispositions = set(get_args(ScanRouteDisposition))
    assert covered == all_dispositions


# ---------------------------------------------------------------------------
# 2. Per-sample gate and operator-action assertions.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_authorization_gate_per_sample(sample_id: str) -> None:
    spec = PILOT_CORPUS[sample_id]
    decision = _route_sample(sample_id)
    assert decision.authorization_gate == spec["expected_gate"], (
        f"{sample_id}: expected gate {spec['expected_gate']!r}, got {decision.authorization_gate!r}"
    )


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_operator_action_per_sample(sample_id: str) -> None:
    spec = PILOT_CORPUS[sample_id]
    decision = _route_sample(sample_id)
    assert decision.operator_action == spec["expected_operator_action"], (
        f"{sample_id}: expected operator_action {spec['expected_operator_action']!r}, "
        f"got {decision.operator_action!r}"
    )


# ---------------------------------------------------------------------------
# 3. Downstream-eligibility shape invariants per GC-018 authorization gate.
# ---------------------------------------------------------------------------


def test_s1_local_deterministic_preserves_requested_capability() -> None:
    decision = _route_sample("DIR-T2-S1")
    assert decision.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
    assert decision.downstream_eligibility == ("STRUCTURED_TEXT_HANDOFF",)


def test_s2_ocr_yields_operator_review_only() -> None:
    decision = _route_sample("DIR-T2-S2")
    assert decision.authorization_gate == "OCR_REQUIRES_SEPARATE_AUTH"
    assert decision.downstream_eligibility == ("OPERATOR_REVIEW_ONLY",)


def test_s3_escalate_yields_operator_review_only() -> None:
    decision = _route_sample("DIR-T2-S3")
    assert decision.authorization_gate == "OPERATOR_REVIEW_REQUIRED"
    assert decision.downstream_eligibility == ("OPERATOR_REVIEW_ONLY",)


def test_s4_blocked_yields_abstain_or_block() -> None:
    decision = _route_sample("DIR-T2-S4")
    assert decision.authorization_gate == "BLOCKED"
    assert decision.downstream_eligibility == ("ABSTAIN_OR_BLOCK",)


# ---------------------------------------------------------------------------
# 4. Scan-route passthrough -- DIR does not alter the scan disposition value.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_scan_route_passthrough_per_sample(sample_id: str) -> None:
    spec = PILOT_CORPUS[sample_id]
    decision = _route_sample(sample_id)
    assert decision.scan_route == spec["scan_route"], (
        f"{sample_id}: scan_route should pass through unchanged; "
        f"expected {spec['scan_route']!r}, got {decision.scan_route!r}"
    )


# ---------------------------------------------------------------------------
# 5. No raw content or external use-case payload in any sample decision.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_no_raw_content_tokens_in_decision_fields(sample_id: str) -> None:
    decision = _route_sample(sample_id)
    for f in fields(decision):
        val = str(getattr(decision, f.name))
        for token in _FORBIDDEN_RAW_TOKENS:
            assert token not in val, (
                f"{sample_id}.{f.name}: forbidden raw-content token {token!r} found"
            )


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_no_external_usecase_tokens_in_decision_fields(sample_id: str) -> None:
    decision = _route_sample(sample_id)
    for f in fields(decision):
        if f.name == "claim_boundary":
            # Claim boundary prose is allowed to contain the tokens as negative evidence.
            continue
        val = str(getattr(decision, f.name))
        for token in _FORBIDDEN_USECASE_TOKENS:
            assert token not in val, (
                f"{sample_id}.{f.name}: forbidden use-case token {token!r} found"
            )


# ---------------------------------------------------------------------------
# 6. Version and claim-boundary invariants across all samples.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_version_and_claim_boundary_per_sample(sample_id: str) -> None:
    decision = _route_sample(sample_id)
    assert decision.decision_version == DOCUMENT_INTELLIGENCE_ROUTE_VERSION
    assert decision.claim_boundary == CLAIM_BOUNDARY


# ---------------------------------------------------------------------------
# 7. Digest present and not raw payload for all samples.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(PILOT_CORPUS))
def test_scan_decision_digest_present_per_sample(sample_id: str) -> None:
    decision = _route_sample(sample_id)
    assert len(decision.scan_decision_digest) == 64
    assert decision.scan_decision_digest.isalnum()
    # Digest must not contain the route value verbatim (it is a hash, not an echo).
    spec = PILOT_CORPUS[sample_id]
    assert spec["scan_route"] not in decision.scan_decision_digest


# ---------------------------------------------------------------------------
# 8. Derivation-map totality -- gate map covers all current scan dispositions.
# ---------------------------------------------------------------------------


def test_scan_route_to_authorization_gate_total_for_pilot_corpus() -> None:
    for sample_id, spec in PILOT_CORPUS.items():
        assert spec["scan_route"] in SCAN_ROUTE_TO_AUTHORIZATION_GATE, (
            f"{sample_id}: scan_route {spec['scan_route']!r} not in SCAN_ROUTE_TO_AUTHORIZATION_GATE"
        )


# ---------------------------------------------------------------------------
# 9. Downstream capability values remain foundation-level (no use-case names).
# ---------------------------------------------------------------------------


def test_downstream_capabilities_remain_foundation_level() -> None:
    capability_values = set(get_args(DownstreamCapability))
    for token in _FORBIDDEN_USECASE_TOKENS:
        for val in capability_values:
            assert token not in val, (
                f"DownstreamCapability value {val!r} contains forbidden use-case token {token!r}"
            )


# ---------------------------------------------------------------------------
# 10. Fixture corpus metadata is metadata-only (no raw text in intent strings).
# ---------------------------------------------------------------------------


def test_pilot_corpus_fixtures_are_metadata_only() -> None:
    for sample_id, spec in PILOT_CORPUS.items():
        for token in _FORBIDDEN_RAW_TOKENS:
            assert token not in spec["intent"], (
                f"{sample_id}: intent string contains forbidden raw-content token {token!r}"
            )
        for token in _FORBIDDEN_USECASE_TOKENS:
            assert token not in spec["intent"], (
                f"{sample_id}: intent string contains forbidden use-case token {token!r}"
            )


# ---------------------------------------------------------------------------
# 11. Pilot harness uses scan_decision path (not scan_signals) for determinism.
# ---------------------------------------------------------------------------


def test_all_pilot_samples_use_supplied_scan_decision_path() -> None:
    # Routing via supplied ScanRouteDecision (not scan_signals) is the
    # deterministic pilot path; verify each sample can be routed this way.
    for sample_id, spec in PILOT_CORPUS.items():
        decision = decide_document_intelligence_route(
            profile=_profile_for(sample_id, requested_capability=spec["requested_capability"]),
            structure_signals=_structure_for(),
            scan_decision=_scan_decision_for(spec["scan_route"]),
        )
        assert decision.scan_route == spec["scan_route"]


# ---------------------------------------------------------------------------
# 12. Pilot also validates scan_signals composition path for S1 (PASS status).
# ---------------------------------------------------------------------------


def test_s1_via_scan_signals_composition_path() -> None:
    scan_signals = DocumentScanSignals(
        source_type="pdf",
        language_codes=["vi"],
        page_count=5,
        text_presence=True,
        page_coverage_ratio=1.0,
        mean_ocr_confidence=None,
        quality_flags=[],
        extraction_status="PASS",
    )
    decision = decide_document_intelligence_route(
        profile=_profile_for("DIR-T2-S1"),
        structure_signals=_structure_for(),
        scan_signals=scan_signals,
    )
    assert decision.scan_route == "LOCAL_TEXT_EXTRACTION_RECOMMENDED"
    assert decision.authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
