"""Focused tests for the EXA-T2 deterministic scan-signal and route-decision contracts."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from scan_route_decision import (  # noqa: E402
    CLAIM_BOUNDARY,
    SCAN_ROUTE_DECISION_VERSION,
    SUPPORTED_SOURCE_TYPES,
    DocumentScanSignals,
    ScanRouteDecision,
    decide_scan_route,
)


def _signals(
    *,
    source_type: str = "pdf",
    language_codes: list[str] | None = None,
    page_count: int = 2,
    text_presence: bool = True,
    page_coverage_ratio: float = 1.0,
    mean_ocr_confidence: float | None = None,
    quality_flags: list | None = None,
    extraction_status: str = "PASS",
) -> DocumentScanSignals:
    return DocumentScanSignals(
        source_type=source_type,
        language_codes=language_codes if language_codes is not None else ["en"],
        page_count=page_count,
        text_presence=text_presence,
        page_coverage_ratio=page_coverage_ratio,
        mean_ocr_confidence=mean_ocr_confidence,
        quality_flags=quality_flags if quality_flags is not None else [],
        extraction_status=extraction_status,
    )


def test_pass_quality_signals_route_local_text_extraction() -> None:
    decision = decide_scan_route(_signals(extraction_status="PASS"))

    assert decision.route == "LOCAL_TEXT_EXTRACTION_RECOMMENDED"
    assert "EXTRACTION_QUALITY_PASS" in decision.reason_codes
    assert decision.operator_action == "PROCEED_TO_DOWNSTREAM_PROCESSING"


def test_needs_tier2_ocr_signals_route_ocr_eligible() -> None:
    decision = decide_scan_route(
        _signals(
            extraction_status="NEEDS_TIER2_OCR",
            quality_flags=["NEEDS_TIER2_OCR"],
            text_presence=False,
        )
    )

    assert decision.route == "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED"
    assert "NEEDS_TIER2_OCR" in decision.reason_codes
    assert decision.operator_action == "SUPPLY_OR_AUTHORIZE_TIER2_OCR_ADAPTER"


def test_ocr_low_confidence_signals_route_escalate() -> None:
    decision = decide_scan_route(
        _signals(
            extraction_status="OCR_LOW_CONFIDENCE",
            quality_flags=["OCR_LOW_CONFIDENCE"],
            mean_ocr_confidence=0.50,
        )
    )

    assert decision.route == "ESCALATE_OR_ABSTAIN"
    assert "OCR_LOW_CONFIDENCE" in decision.reason_codes
    assert decision.operator_action == "REVIEW_OCR_OUTPUT_OR_USE_ALTERNATE_SOURCE"


def test_partial_extraction_signals_route_escalate() -> None:
    decision = decide_scan_route(
        _signals(
            extraction_status="PARTIAL_EXTRACTION",
            quality_flags=["PARTIAL_EXTRACTION"],
            page_coverage_ratio=0.50,
        )
    )

    assert decision.route == "ESCALATE_OR_ABSTAIN"
    assert "PARTIAL_EXTRACTION" in decision.reason_codes
    assert decision.operator_action == "REVIEW_MISSING_OR_EMPTY_PAGES"


def test_empty_extraction_signals_route_escalate() -> None:
    decision = decide_scan_route(
        _signals(
            extraction_status="EMPTY",
            quality_flags=["EMPTY"],
            text_presence=False,
            page_coverage_ratio=0.0,
        )
    )

    assert decision.route == "ESCALATE_OR_ABSTAIN"
    assert "EXTRACTION_EMPTY" in decision.reason_codes
    assert decision.operator_action == "REVIEW_SOURCE_OR_EXTRACTION_ROUTE"


def test_unsupported_language_signals_route_blocked() -> None:
    decision = decide_scan_route(
        _signals(language_codes=["xx"], extraction_status="PASS")
    )

    assert decision.route == "BLOCKED_UNSUPPORTED"
    assert "UNSUPPORTED_OCR_LANGUAGE" in decision.reason_codes
    assert decision.operator_action == "SUPPLY_GOVERNED_LANGUAGE_CODE_OR_OPERATOR_ADAPTER"


def test_unsupported_source_type_signals_route_blocked() -> None:
    decision = decide_scan_route(
        _signals(source_type="rtf", extraction_status="PASS")
    )

    assert decision.route == "BLOCKED_UNSUPPORTED"
    assert "UNSUPPORTED_SOURCE_TYPE" in decision.reason_codes
    assert decision.operator_action == "SUPPLY_SUPPORTED_SOURCE_TYPE_OR_CUSTOM_ADAPTER"


def test_unknown_source_type_signals_route_blocked() -> None:
    decision = decide_scan_route(
        _signals(source_type="unknown", extraction_status="PASS")
    )

    assert decision.route == "BLOCKED_UNSUPPORTED"
    assert "UNSUPPORTED_SOURCE_TYPE" in decision.reason_codes


def test_docx_source_type_is_supported() -> None:
    decision = decide_scan_route(
        _signals(source_type="docx", extraction_status="PASS")
    )

    assert decision.route == "LOCAL_TEXT_EXTRACTION_RECOMMENDED"


def test_source_type_block_takes_priority_over_language_check() -> None:
    decision = decide_scan_route(
        _signals(source_type="rtf", language_codes=["xx"], extraction_status="PASS")
    )

    assert decision.route == "BLOCKED_UNSUPPORTED"
    assert "UNSUPPORTED_SOURCE_TYPE" in decision.reason_codes


def test_deterministic_repeatability_same_inputs_same_decision() -> None:
    sigs = _signals(extraction_status="NEEDS_TIER2_OCR", quality_flags=["NEEDS_TIER2_OCR"])
    decision_a = decide_scan_route(sigs)
    decision_b = decide_scan_route(sigs)

    assert decision_a.route == decision_b.route
    assert decision_a.reason_codes == decision_b.reason_codes
    assert decision_a.operator_action == decision_b.operator_action


def test_decision_carries_version_and_claim_boundary() -> None:
    decision = decide_scan_route(_signals())

    assert decision.decision_version == SCAN_ROUTE_DECISION_VERSION
    assert decision.claim_boundary == CLAIM_BOUNDARY


def test_decision_does_not_contain_raw_text_field() -> None:
    decision = decide_scan_route(_signals())

    assert not hasattr(decision, "text")
    assert not hasattr(decision, "raw_text")
    assert not hasattr(decision, "extracted_text")
    assert not hasattr(decision, "ocr_output")


def test_signals_does_not_contain_raw_text_field() -> None:
    sigs = _signals()

    assert not hasattr(sigs, "text")
    assert not hasattr(sigs, "raw_text")
    assert not hasattr(sigs, "extracted_text")
    assert not hasattr(sigs, "ocr_output")


def test_supported_source_types_constant_contains_pdf_and_docx() -> None:
    assert "pdf" in SUPPORTED_SOURCE_TYPES
    assert "docx" in SUPPORTED_SOURCE_TYPES


def test_empty_language_codes_do_not_block_pass_route() -> None:
    decision = decide_scan_route(
        _signals(language_codes=[], extraction_status="PASS")
    )

    assert decision.route == "LOCAL_TEXT_EXTRACTION_RECOMMENDED"


def test_invalid_numeric_signal_routes_escalate() -> None:
    decision = decide_scan_route(
        _signals(page_coverage_ratio=1.5, extraction_status="PASS")
    )

    assert decision.route == "ESCALATE_OR_ABSTAIN"
    assert "INVALID_SCAN_SIGNAL" in decision.reason_codes
    assert decision.operator_action == "REVIEW_SCAN_SIGNAL_INPUTS"


def test_contradictory_pass_signal_routes_escalate() -> None:
    decision = decide_scan_route(
        _signals(
            extraction_status="PASS",
            quality_flags=["PARTIAL_EXTRACTION"],
            page_coverage_ratio=0.5,
        )
    )

    assert decision.route == "ESCALATE_OR_ABSTAIN"
    assert "CONTRADICTORY_SCAN_SIGNALS" in decision.reason_codes
    assert decision.operator_action == "REVIEW_SCAN_SIGNAL_INPUTS"


@pytest.mark.parametrize(
    ("extraction_status", "expected_route"),
    [
        ("PASS", "LOCAL_TEXT_EXTRACTION_RECOMMENDED"),
        ("NEEDS_TIER2_OCR", "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED"),
        ("OCR_LOW_CONFIDENCE", "ESCALATE_OR_ABSTAIN"),
        ("PARTIAL_EXTRACTION", "ESCALATE_OR_ABSTAIN"),
        ("EMPTY", "ESCALATE_OR_ABSTAIN"),
    ],
)
def test_all_extraction_statuses_map_to_stable_routes(
    extraction_status: str,
    expected_route: str,
) -> None:
    decision = decide_scan_route(_signals(extraction_status=extraction_status))

    assert decision.route == expected_route
