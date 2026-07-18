"""Deterministic metadata evidence normalization for extraction outcomes."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Mapping

from scan_outcome_report import ScanOutcomeFinding

ObservedState = Literal[
    "PRESENT",
    "MISSING",
    "AMBIGUOUS",
    "CONFLICTING",
    "UNSUPPORTED",
    "NOT_APPLICABLE",
]
EvidenceBasis = Literal[
    "SOURCE_EMBEDDED",
    "OPERATOR_SUPPLIED",
    "DERIVED_HINT",
    "NONE",
]
ResolutionState = Literal["RESOLVED", "OPERATOR_ACTION_REQUIRED", "BLOCKED"]
DownstreamDisposition = Literal[
    "RETAIN_BLOCK",
    "ELIGIBLE_FOR_REEVALUATION",
]
FailureToken = Literal[
    "INVALID_REQUIREMENT_ID",
    "INVALID_OWNER_PROFILE_ID",
    "INVALID_STATE_COMBINATION",
    "MISSING_EVIDENCE_POINTER",
    "RAW_CONTENT_FORBIDDEN",
    "UNDECLARED_REQUIREMENT",
    "CROSS_PROFILE_REQUIREMENT_BLEED",
]

CONTRACT_VERSION = "cvf.metadataEvidenceResolution.meor.t1.v1"

_OBSERVED_STATES = {
    "PRESENT",
    "MISSING",
    "AMBIGUOUS",
    "CONFLICTING",
    "UNSUPPORTED",
    "NOT_APPLICABLE",
}
_EVIDENCE_BASES = {
    "SOURCE_EMBEDDED",
    "OPERATOR_SUPPLIED",
    "DERIVED_HINT",
    "NONE",
}
_AUTHORITATIVE_BASES = {"SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"}
_RAW_POINTER_MARKERS = ("raw:", "text:", "ocr:", "content:")


@dataclass(frozen=True)
class MetadataEvidenceRecord:
    """A profile-scoped metadata observation without raw source content."""

    requirement_id: str
    owner_profile_id: str
    observed_state: ObservedState
    evidence_basis: EvidenceBasis
    evidence_pointers: tuple[str, ...] = ()


@dataclass(frozen=True)
class MetadataEvidenceEvaluation:
    """A deterministic resolution and downstream disposition."""

    contract_version: str
    record: MetadataEvidenceRecord
    resolution_state: ResolutionState
    downstream_disposition: DownstreamDisposition
    required_action: str | None


class MetadataEvidenceValidationError(ValueError):
    """Fail-closed validation error with a canonical T1 failure token."""

    def __init__(self, token: FailureToken, message: str) -> None:
        super().__init__(message)
        self.token = token


def _fail(token: FailureToken, message: str) -> None:
    raise MetadataEvidenceValidationError(token, message)


def _validate_record(
    record: MetadataEvidenceRecord,
    declared_requirements: Mapping[str, str],
) -> None:
    if not record.requirement_id.strip():
        _fail("INVALID_REQUIREMENT_ID", "requirement_id must be non-empty")
    if not record.owner_profile_id.strip():
        _fail("INVALID_OWNER_PROFILE_ID", "owner_profile_id must be non-empty")
    if record.observed_state not in _OBSERVED_STATES:
        _fail("INVALID_STATE_COMBINATION", "unsupported observed_state")
    if record.evidence_basis not in _EVIDENCE_BASES:
        _fail("INVALID_STATE_COMBINATION", "unsupported evidence_basis")

    declared_owner = declared_requirements.get(record.requirement_id)
    if declared_owner is None:
        _fail(
            "UNDECLARED_REQUIREMENT",
            "requirement_id is not declared by a domain profile",
        )
    if declared_owner != record.owner_profile_id:
        _fail(
            "CROSS_PROFILE_REQUIREMENT_BLEED",
            "requirement_id is owned by a different domain profile",
        )

    for pointer in record.evidence_pointers:
        normalized = pointer.strip().lower()
        if (
            not normalized
            or "\n" in pointer
            or "\r" in pointer
            or len(pointer) > 512
            or normalized.startswith(_RAW_POINTER_MARKERS)
        ):
            _fail(
                "RAW_CONTENT_FORBIDDEN",
                "evidence pointers must be bounded secret-safe references",
            )

    if (
        record.evidence_basis in _AUTHORITATIVE_BASES
        and not record.evidence_pointers
    ):
        _fail(
            "MISSING_EVIDENCE_POINTER",
            "authoritative evidence requires an evidence pointer",
        )
    if (
        record.observed_state == "NOT_APPLICABLE"
        and record.evidence_basis != "NONE"
    ):
        _fail(
            "INVALID_STATE_COMBINATION",
            "NOT_APPLICABLE requires evidence basis NONE",
        )


def evaluate_metadata_evidence(
    record: MetadataEvidenceRecord,
    *,
    declared_requirements: Mapping[str, str],
) -> MetadataEvidenceEvaluation:
    """Evaluate one observation against the MEOR-T1 rule matrix."""

    _validate_record(record, declared_requirements)

    if record.observed_state == "NOT_APPLICABLE":
        resolution: ResolutionState = "RESOLVED"
        downstream: DownstreamDisposition = "ELIGIBLE_FOR_REEVALUATION"
        action = None
    elif record.observed_state == "PRESENT":
        if record.evidence_basis in _AUTHORITATIVE_BASES:
            resolution = "RESOLVED"
            downstream = "ELIGIBLE_FOR_REEVALUATION"
            action = None
        else:
            resolution = "OPERATOR_ACTION_REQUIRED"
            downstream = "RETAIN_BLOCK"
            action = "PROVIDE_AUTHORITATIVE_METADATA_EVIDENCE"
    elif record.observed_state in {"MISSING", "AMBIGUOUS"}:
        resolution = "OPERATOR_ACTION_REQUIRED"
        downstream = "RETAIN_BLOCK"
        action = "REVIEW_AND_RESOLVE_METADATA_REQUIREMENT"
    else:
        resolution = "BLOCKED"
        downstream = "RETAIN_BLOCK"
        action = "RESOLVE_METADATA_CONFLICT_OR_UNSUPPORTED_STATE"

    return MetadataEvidenceEvaluation(
        contract_version=CONTRACT_VERSION,
        record=record,
        resolution_state=resolution,
        downstream_disposition=downstream,
        required_action=action,
    )


def to_scan_outcome_finding(
    evaluation: MetadataEvidenceEvaluation,
) -> ScanOutcomeFinding:
    """Adapt a valid evaluation to the existing EX-T9 finding surface."""

    severity = {
        "RESOLVED": "INFO",
        "OPERATOR_ACTION_REQUIRED": "WARNING",
        "BLOCKED": "BLOCKING",
    }[evaluation.resolution_state]
    code = {
        "RESOLVED": "METADATA_REQUIREMENT_RESOLVED",
        "OPERATOR_ACTION_REQUIRED": "METADATA_OPERATOR_ACTION_REQUIRED",
        "BLOCKED": "METADATA_REQUIREMENT_BLOCKED",
    }[evaluation.resolution_state]
    record = evaluation.record
    evidence = {
        "contractVersion": evaluation.contract_version,
        "requirementId": record.requirement_id,
        "ownerProfileId": record.owner_profile_id,
        "observedState": record.observed_state,
        "evidenceBasis": record.evidence_basis,
        "evidencePointerCount": str(len(record.evidence_pointers)),
        "resolutionState": evaluation.resolution_state,
        "downstreamDisposition": evaluation.downstream_disposition,
    }
    if record.evidence_pointers:
        evidence["evidencePointers"] = ";".join(record.evidence_pointers)

    return ScanOutcomeFinding(
        code=code,
        severity=severity,
        summary=(
            f"Metadata requirement {record.requirement_id} evaluated as "
            f"{evaluation.resolution_state}."
        ),
        required_action=evaluation.required_action or "NO_OPERATOR_ACTION",
        evidence=evidence,
    )
