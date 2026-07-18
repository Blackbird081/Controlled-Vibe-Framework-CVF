"""
CVF Extraction Foundation - DICE-T1 Document Intelligence Control Envelope.

Claim boundary: local deterministic CVF foundation source and tests only.
This module does not execute OCR, call providers, read external app trees,
change retrieval behavior, ingest corpus records, wire routes or APIs, perform
public-sync, make document correctness claims, extraction accuracy claims,
provider quality claims, readiness claims, cost claims, or memory reinjection.

This module composes existing EXA-T2 scan-route, scan outcome report, and DIR
route-decision owner surfaces without redefining scan dispositions,
authorization gates, downstream capabilities, OCR confidence, provider/OCR
execution, retrieval behavior, or downstream use-case readiness.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from document_intelligence_router import (
    AuthorizationGate,
    DocumentIntelligenceRouteDecision,
    DocumentProfile,
    DocumentStructureSignals,
    DownstreamCapability,
    decide_document_intelligence_route,
)
from scan_outcome_report import ScanOutcomeFinding, ScanOutcomeReport
from scan_route_decision import ScanRouteDecision, ScanRouteDisposition


DICE_T1_ENVELOPE_VERSION = "cvf.documentIntelligenceControlEnvelope.diceT1.v1"

CLAIM_BOUNDARY = (
    "DICE-T1 is local deterministic CVF foundation source and tests only. "
    "It does not authorize OCR/provider/API execution, external app tree access, "
    "retrieval behavior changes, route/API wiring, corpus ingestion, public-sync, "
    "document correctness claims, extraction accuracy claims, provider quality "
    "claims, readiness claims, cost claims, memory reinjection, high-risk "
    "promotion, or autonomous mutation."
)

EnvelopeAdapterHandoffStatus = Literal[
    "HANDOFF_AUTHORIZED",
    "HANDOFF_BLOCKED",
]


@dataclass(frozen=True)
class DocumentIntelligenceControlEnvelopeInput:
    """Input to the DICE-T1 local deterministic control envelope.

    The caller supplies the document profile, structure signals, an
    already-produced ScanRouteDecision (or None to derive from scan_signals
    inside the DIR owner), and the corresponding ScanOutcomeReport.

    No raw extracted text, OCR output, provider response, or downstream
    app state is stored here.
    """

    profile: DocumentProfile
    structure_signals: DocumentStructureSignals
    scan_decision: ScanRouteDecision
    outcome_report: ScanOutcomeReport


@dataclass(frozen=True)
class EnvelopeAdapterHandoff:
    """Local downstream handoff decision record produced by DICE-T1.

    This record reflects the DIR authorization gate output and the operator
    review state from the outcome report. It does not bypass or widen the DIR
    gate; downstream_eligibility is taken directly from the DIR decision.

    Must not be used to authorize OCR/provider/API, retrieval, corpus ingestion,
    route wiring, or any capability beyond what the DIR gate authorizes.
    """

    envelope_version: str
    handoff_status: EnvelopeAdapterHandoffStatus
    authorization_gate: AuthorizationGate
    downstream_eligibility: tuple[DownstreamCapability, ...]
    scan_route: ScanRouteDisposition
    scan_decision_digest: str
    decision_version: str
    operator_review_required: bool
    findings_count: int
    operator_action: str
    claim_boundary: str


@dataclass(frozen=True)
class DocumentIntelligenceControlEnvelopeResult:
    """Result of the DICE-T1 local deterministic control envelope.

    Contains the DIR route decision, the handoff decision record, and a
    passthrough of the incoming outcome report. No content is added, suppressed,
    or filtered.
    """

    envelope_version: str
    route_decision: DocumentIntelligenceRouteDecision
    handoff: EnvelopeAdapterHandoff
    outcome_report: ScanOutcomeReport
    claim_boundary: str


def _derive_handoff_status(
    authorization_gate: AuthorizationGate,
    operator_review_required: bool,
) -> EnvelopeAdapterHandoffStatus:
    """Return HANDOFF_AUTHORIZED only when the DIR gate allows local deterministic
    execution and the outcome report does not require operator review."""

    if (
        authorization_gate == "LOCAL_DETERMINISTIC_ALLOWED"
        and not operator_review_required
    ):
        return "HANDOFF_AUTHORIZED"
    return "HANDOFF_BLOCKED"


def build_document_intelligence_control_envelope(
    envelope_input: DocumentIntelligenceControlEnvelopeInput,
) -> DocumentIntelligenceControlEnvelopeResult:
    """Build a local deterministic DICE-T1 control envelope result.

    Composes the existing DIR decide_document_intelligence_route owner surface
    with the supplied outcome report. Does not call OCR, providers, retrieval,
    corpus ingestion, or any external service. Does not widen downstream
    eligibility beyond DIR output.
    """

    route_decision: DocumentIntelligenceRouteDecision = (
        decide_document_intelligence_route(
            profile=envelope_input.profile,
            structure_signals=envelope_input.structure_signals,
            scan_decision=envelope_input.scan_decision,
        )
    )

    operator_review_required: bool = (
        envelope_input.outcome_report.operator_review_required
    )

    handoff_status = _derive_handoff_status(
        route_decision.authorization_gate,
        operator_review_required,
    )

    handoff = EnvelopeAdapterHandoff(
        envelope_version=DICE_T1_ENVELOPE_VERSION,
        handoff_status=handoff_status,
        authorization_gate=route_decision.authorization_gate,
        downstream_eligibility=route_decision.downstream_eligibility,
        scan_route=route_decision.scan_route,
        scan_decision_digest=route_decision.scan_decision_digest,
        decision_version=route_decision.decision_version,
        operator_review_required=operator_review_required,
        findings_count=len(envelope_input.outcome_report.findings),
        operator_action=route_decision.operator_action,
        claim_boundary=CLAIM_BOUNDARY,
    )

    return DocumentIntelligenceControlEnvelopeResult(
        envelope_version=DICE_T1_ENVELOPE_VERSION,
        route_decision=route_decision,
        handoff=handoff,
        outcome_report=envelope_input.outcome_report,
        claim_boundary=CLAIM_BOUNDARY,
    )
