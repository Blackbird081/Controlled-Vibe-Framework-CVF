"""
CVF Extraction Foundation - DIR-T1 deterministic Document Intelligence Router.

Claim boundary: deterministic local routing composition only. This module
does not execute OCR, call providers, read external use-case repositories,
change retrieval behavior, ingest corpus records, or claim document
intelligence readiness.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json
from typing import Literal

from scan_route_decision import (
    DocumentScanSignals,
    ScanRouteDecision,
    ScanRouteDisposition,
    decide_scan_route,
)


DOCUMENT_INTELLIGENCE_ROUTE_VERSION = "cvf.documentIntelligenceRoute.dirT1.v1"

CLAIM_BOUNDARY = (
    "This decision composes an existing scan-route decision with a bounded "
    "document-intelligence authorization gate. It does not prove document "
    "content correctness, extraction accuracy, OCR quality, provider behavior, "
    "retrieval quality, Policy_Local readiness, Document Translator readiness, "
    "public readiness, or production readiness."
)

AuthorizationGate = Literal[
    "LOCAL_DETERMINISTIC_ALLOWED",
    "OCR_REQUIRES_SEPARATE_AUTH",
    "PROVIDER_REQUIRES_SEPARATE_AUTH",
    "OPERATOR_REVIEW_REQUIRED",
    "BLOCKED",
]

DownstreamCapability = Literal[
    "STRUCTURED_TEXT_HANDOFF",
    "EVIDENCE_CITATION_HANDOFF",
    "CORPUS_SCAN_HANDOFF",
    "OPERATOR_REVIEW_ONLY",
    "ABSTAIN_OR_BLOCK",
]

SCAN_ROUTE_TO_AUTHORIZATION_GATE: dict[ScanRouteDisposition, AuthorizationGate] = {
    "LOCAL_TEXT_EXTRACTION_RECOMMENDED": "LOCAL_DETERMINISTIC_ALLOWED",
    "OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED": "OCR_REQUIRES_SEPARATE_AUTH",
    "ESCALATE_OR_ABSTAIN": "OPERATOR_REVIEW_REQUIRED",
    "BLOCKED_UNSUPPORTED": "BLOCKED",
}

OPERATOR_ACTION_BY_GATE: dict[AuthorizationGate, str] = {
    "LOCAL_DETERMINISTIC_ALLOWED": "PROCEED_TO_AUTHORIZED_LOCAL_DETERMINISTIC_HANDOFF",
    "OCR_REQUIRES_SEPARATE_AUTH": "AUTHORIZE_SEPARATE_OCR_WORK_ORDER_OR_OPERATOR_REVIEW",
    "PROVIDER_REQUIRES_SEPARATE_AUTH": "AUTHORIZE_SEPARATE_PROVIDER_WORK_ORDER",
    "OPERATOR_REVIEW_REQUIRED": "OPERATOR_REVIEW_REQUIRED_BEFORE_DOWNSTREAM_HANDOFF",
    "BLOCKED": "STOP_UNSUPPORTED_OR_BLOCKED_SOURCE",
}


@dataclass(frozen=True)
class DocumentProfile:
    """Metadata and requested capability for a document artifact.

    The profile carries caller-supplied identifiers and intent only. It stores
    no extracted content, OCR output, provider response, or downstream app state.
    """

    source_artifact_id: str
    source_hash: str
    source_type: str
    language_hints: tuple[str, ...]
    page_count: int
    declared_artifact_role: str
    domain_hint: str
    requested_capability: DownstreamCapability


@dataclass(frozen=True)
class DocumentStructureSignals:
    """Document-shape signals kept separate from profile metadata at DIR-T1.

    KEEP_SEPARATE_BUT_COLLAPSIBLE_AT_T1: structure remains orthogonal to
    profile metadata and may be collapsed only by a later reviewed tranche if
    tests prove it has no independent variation. No field stores raw content,
    OCR output, provider response, or extraction chunks.
    """

    has_tables: bool
    has_images: bool
    has_formulas: bool
    layout_preservation_risk: Literal["LOW", "MEDIUM", "HIGH"]
    scanned_page_ratio: float | None
    citation_marker_present: bool
    missing_page_flag: bool


@dataclass(frozen=True)
class DocumentIntelligenceRouteDecision:
    """Router decision that composes, but does not reissue, the scan decision."""

    decision_version: str
    scan_route: ScanRouteDisposition
    authorization_gate: AuthorizationGate
    downstream_eligibility: tuple[DownstreamCapability, ...]
    operator_action: str
    scan_decision_digest: str
    claim_boundary: str


def _scan_decision_digest(scan_decision: ScanRouteDecision) -> str:
    payload = json.dumps(asdict(scan_decision), sort_keys=True, separators=(",", ":"))
    return sha256(payload.encode("utf-8")).hexdigest()


def _derive_downstream_eligibility(
    profile: DocumentProfile,
    authorization_gate: AuthorizationGate,
) -> tuple[DownstreamCapability, ...]:
    if authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED":
        if profile.requested_capability in {"OPERATOR_REVIEW_ONLY", "ABSTAIN_OR_BLOCK"}:
            return (profile.requested_capability,)
        return (profile.requested_capability,)
    if authorization_gate in {
        "OCR_REQUIRES_SEPARATE_AUTH",
        "PROVIDER_REQUIRES_SEPARATE_AUTH",
        "OPERATOR_REVIEW_REQUIRED",
    }:
        return ("OPERATOR_REVIEW_ONLY",)
    return ("ABSTAIN_OR_BLOCK",)


def decide_document_intelligence_route(
    *,
    profile: DocumentProfile,
    structure_signals: DocumentStructureSignals,
    scan_decision: ScanRouteDecision | None = None,
    scan_signals: DocumentScanSignals | None = None,
) -> DocumentIntelligenceRouteDecision:
    """Return a deterministic document-intelligence route decision.

    A caller may provide an already-produced ScanRouteDecision, or provide
    DocumentScanSignals for this function to call the existing EXA-T2
    decide_scan_route primitive. The structure_signals parameter is deliberately
    retained as a separate input to preserve the DIR-T0 contract boundary.
    """

    del structure_signals

    if scan_decision is None:
        if scan_signals is None:
            raise ValueError("scan_decision or scan_signals is required")
        scan_decision = decide_scan_route(scan_signals)

    authorization_gate = SCAN_ROUTE_TO_AUTHORIZATION_GATE[scan_decision.route]
    return DocumentIntelligenceRouteDecision(
        decision_version=DOCUMENT_INTELLIGENCE_ROUTE_VERSION,
        scan_route=scan_decision.route,
        authorization_gate=authorization_gate,
        downstream_eligibility=_derive_downstream_eligibility(
            profile,
            authorization_gate,
        ),
        operator_action=OPERATOR_ACTION_BY_GATE[authorization_gate],
        scan_decision_digest=_scan_decision_digest(scan_decision),
        claim_boundary=CLAIM_BOUNDARY,
    )
