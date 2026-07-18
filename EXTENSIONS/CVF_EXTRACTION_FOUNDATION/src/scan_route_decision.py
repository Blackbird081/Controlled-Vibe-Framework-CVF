"""
CVF Extraction Foundation - EXA-T2 deterministic scan-signal and route-decision contracts.

Claim boundary: deterministic local scan-signal and route-decision contracts only. This
module does not install OCR dependencies, execute OCR, call providers, mutate
Policy_Local, activate EC, change retrieval, or claim readiness.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from extraction_pipeline import (
    ExtractionStatus,
    UnsupportedOcrLanguageError,
    map_ocr_language_codes,
)

SCAN_ROUTE_DECISION_VERSION = "cvf.scanRouteDecision.exaT2.v1"

CLAIM_BOUNDARY = (
    "This decision reflects supplied scan signals only. It does not prove "
    "extraction accuracy, OCR quality, metadata correctness, domain eligibility, "
    "legal or current status, retrieval quality, Policy_Local readiness, or "
    "production readiness."
)

SUPPORTED_SOURCE_TYPES: frozenset[str] = frozenset({"pdf", "docx"})

ScanRouteDisposition = Literal[
    "LOCAL_TEXT_EXTRACTION_RECOMMENDED",
    "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED",
    "ESCALATE_OR_ABSTAIN",
    "BLOCKED_UNSUPPORTED",
]


@dataclass(frozen=True)
class DocumentScanSignals:
    """Normalized pre-extraction or supplied extraction signals for route evaluation.

    No raw extracted text is stored here. Signals are caller-supplied or derived
    from a prior extraction quality report and never inferred from document content.
    """

    source_type: str
    language_codes: list[str]
    page_count: int
    text_presence: bool
    page_coverage_ratio: float
    mean_ocr_confidence: float | None
    quality_flags: list[ExtractionStatus]
    extraction_status: ExtractionStatus


@dataclass(frozen=True)
class ScanRouteDecision:
    """Deterministic route recommendation based on supplied scan signals.

    Does not contain raw text, OCR output, domain policy, or provider state.
    """

    decision_version: str
    route: ScanRouteDisposition
    reason_codes: list[str]
    operator_action: str
    claim_boundary: str


def decide_scan_route(signals: DocumentScanSignals) -> ScanRouteDecision:
    """Return a deterministic route decision from supplied scan signals.

    Does not execute OCR, call providers, read external files, or mutate state.
    Language support is evaluated using the governed OCR language mapping table
    without executing any OCR operation.
    """

    if signals.source_type not in SUPPORTED_SOURCE_TYPES:
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="BLOCKED_UNSUPPORTED",
            reason_codes=["UNSUPPORTED_SOURCE_TYPE"],
            operator_action="SUPPLY_SUPPORTED_SOURCE_TYPE_OR_CUSTOM_ADAPTER",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if signals.language_codes:
        try:
            map_ocr_language_codes(signals.language_codes)
        except UnsupportedOcrLanguageError:
            return ScanRouteDecision(
                decision_version=SCAN_ROUTE_DECISION_VERSION,
                route="BLOCKED_UNSUPPORTED",
                reason_codes=["UNSUPPORTED_OCR_LANGUAGE"],
                operator_action="SUPPLY_GOVERNED_LANGUAGE_CODE_OR_OPERATOR_ADAPTER",
                claim_boundary=CLAIM_BOUNDARY,
            )

    if (
        signals.page_count < 0
        or signals.page_coverage_ratio < 0
        or signals.page_coverage_ratio > 1
        or (
            signals.mean_ocr_confidence is not None
            and (
                signals.mean_ocr_confidence < 0
                or signals.mean_ocr_confidence > 1
            )
        )
    ):
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="ESCALATE_OR_ABSTAIN",
            reason_codes=["INVALID_SCAN_SIGNAL"],
            operator_action="REVIEW_SCAN_SIGNAL_INPUTS",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if signals.extraction_status == "PASS" and (
        signals.quality_flags
        or not signals.text_presence
        or signals.page_count == 0
        or signals.page_coverage_ratio <= 0
    ):
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="ESCALATE_OR_ABSTAIN",
            reason_codes=["CONTRADICTORY_SCAN_SIGNALS"],
            operator_action="REVIEW_SCAN_SIGNAL_INPUTS",
            claim_boundary=CLAIM_BOUNDARY,
        )

    status = signals.extraction_status

    if status == "PASS":
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="LOCAL_TEXT_EXTRACTION_RECOMMENDED",
            reason_codes=["EXTRACTION_QUALITY_PASS"],
            operator_action="PROCEED_TO_DOWNSTREAM_PROCESSING",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if status == "NEEDS_TIER2_OCR":
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED",
            reason_codes=["NEEDS_TIER2_OCR"],
            operator_action="SUPPLY_OR_AUTHORIZE_TIER2_OCR_ADAPTER",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if status == "OCR_LOW_CONFIDENCE":
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="ESCALATE_OR_ABSTAIN",
            reason_codes=["OCR_LOW_CONFIDENCE"],
            operator_action="REVIEW_OCR_OUTPUT_OR_USE_ALTERNATE_SOURCE",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if status == "PARTIAL_EXTRACTION":
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="ESCALATE_OR_ABSTAIN",
            reason_codes=["PARTIAL_EXTRACTION"],
            operator_action="REVIEW_MISSING_OR_EMPTY_PAGES",
            claim_boundary=CLAIM_BOUNDARY,
        )

    if status == "EMPTY":
        return ScanRouteDecision(
            decision_version=SCAN_ROUTE_DECISION_VERSION,
            route="ESCALATE_OR_ABSTAIN",
            reason_codes=["EXTRACTION_EMPTY"],
            operator_action="REVIEW_SOURCE_OR_EXTRACTION_ROUTE",
            claim_boundary=CLAIM_BOUNDARY,
        )

    return ScanRouteDecision(
        decision_version=SCAN_ROUTE_DECISION_VERSION,
        route="ESCALATE_OR_ABSTAIN",
        reason_codes=["UNKNOWN_EXTRACTION_STATUS"],
        operator_action="REVIEW_EXTRACTION_OUTPUT_BEFORE_DOWNSTREAM",
        claim_boundary=CLAIM_BOUNDARY,
    )
