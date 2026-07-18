"""Metadata-only MinerU receipt writer for CVF Extraction Foundation.

This helper accepts caller-supplied metadata and renders a stable receipt
payload. It does not read source documents, generated MinerU output content,
or execute MinerU.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from json import dumps
import re
from typing import Literal, Sequence


RECEIPT_VERSION = "cvf.mineruMetadataReceipt.r28t5.v2"
MEMORY_SAFE_CANDIDATE_CONTRACT_VERSION = "cvf.mineruMemorySafeCandidate.r28t9.v1"
MEMORY_OWNER_ADMISSION_READOUT_VERSION = "cvf.mineruMemoryOwnerAdmission.r28t12.v1"
MEMORY_RECORD_CANDIDATE_VERSION = "cvf.mineruMemoryRecordCandidate.r28t14.v1"
DURABLE_MEMORY_WRITE_INPUT_CANDIDATE_VERSION = "cvf.mineruDurableMemoryWriteInputCandidate.r28t16.v1"
DURABLE_MEMORY_WRITE_ADAPTER_CANDIDATE_VERSION = "cvf.mineruDurableMemoryWriteAdapterCandidate.r28t18.v1"
DURABLE_MEMORY_WRITE_ADAPTER_CANDIDATE_READY = "DURABLE_MEMORY_WRITE_ADAPTER_IMPLEMENTATION_CANDIDATE_READY"
DURABLE_STORE_INVOCATION_NOT_AUTHORIZED_BY_T18 = "DURABLE_STORE_INVOCATION_NOT_AUTHORIZED_BY_T18"
MIN_PROVENANCE_SCORE = 0.7
DURABLE_TIER_ACTOR_LANES: dict[str, frozenset[str]] = {
    "skill": frozenset({"OPERATOR", "GOVERNOR", "BUILDER", "SERVICE_AGENT"}),
    "long-term": frozenset({"OPERATOR", "GOVERNOR", "SERVICE_AGENT"}),
}
PRIVATE_OUTPUT_DISPOSITION = "RECEIPT_METADATA_ALLOWED"
DOWNSTREAM_RELEASE_HELD = "HELD_PENDING_RECEIPT_CHECKER_AND_MEMORY_ROUTE"
MEMORY_WRITE_NOT_AUTHORIZED_BY_T9 = "MEMORY_WRITE_NOT_AUTHORIZED_BY_T9_DISPATCH"
MEMORY_WRITE_NOT_AUTHORIZED_BY_T12 = "MEMORY_WRITE_NOT_AUTHORIZED_BY_T12_DISPATCH"
MEMORY_WRITE_NOT_AUTHORIZED_BY_T14 = "MEMORY_WRITE_NOT_AUTHORIZED_BY_T14_CANDIDATE_ONLY"
MEMORY_WRITE_NOT_AUTHORIZED_BY_T16 = "MEMORY_WRITE_NOT_AUTHORIZED_BY_T16_MAPPING_ONLY"
MEMORY_RECORD_CANDIDATE_READY_FOR_REVIEW = "MEMORY_RECORD_CANDIDATE_READY_FOR_REVIEW"
MEMORY_STORE_ADAPTER_MAPPING_IMPLEMENTED = "MEMORY_STORE_ADAPTER_MAPPING_IMPLEMENTED"
CLAIM_BOUNDARY = (
    "This receipt records caller-supplied MinerU metadata only. It does not "
    "prove extraction accuracy, document truth, legal quality, current-law "
    "correctness, runtime readiness, memory ingestion readiness, RAG readiness, "
    "or production workflow readiness."
)

ALLOWED_OUTPUT_FILE_NAMES = frozenset(
    {
        "layout.pdf",
        "span.pdf",
        "model.json",
        "middle.json",
        "content_list.json",
        "content_list_v2.json",
    }
)

MineruPrivateOutputClass = Literal[
    "PRIVATE_INPUT_ONLY",
    "PRIVATE_RUNTIME_COPY",
    "PRIVATE_GENERATED_OUTPUT",
]

FailureToken = Literal[
    "INVALID_RECEIPT_ID",
    "INVALID_SOURCE_INPUT_SLOT",
    "INVALID_INPUT_SHA256",
    "INVALID_OUTPUT_FILE_NAME",
    "OUTPUT_CONTENT_READ_FORBIDDEN",
    "QUALITY_OR_SOURCE_POINTER_MISSING",
    "DOWNSTREAM_RELEASE_NOT_HELD",
    "MEMORY_WRITE_ALREADY_AUTHORIZED",
    "CLAIM_BOUNDARY_MISSING",
    "POLICY_DECISION_DENIED",
    "ACTOR_NOT_AUTHORIZED",
    "LOW_PROVENANCE_SCORE",
    "ACTOR_ROLE_NOT_ALLOWED_FOR_TIER",
    "R27_PREREQUISITE_MISSING",
    "DURABLE_TIER_NOT_SUPPORTED",
]

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")
_SAFE_MARKDOWN_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}\.md$")
_SHA256_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
_BOUNDARY_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_UNSAFE_TEXT_MARKERS = ("raw:", "text:", "ocr:", "content:")


class MineruMetadataReceiptValidationError(ValueError):
    """Fail-closed validation error with a stable R28-T1 token."""

    def __init__(self, token: FailureToken, message: str) -> None:
        super().__init__(message)
        self.token = token


@dataclass(frozen=True)
class MineruMetadataReceipt:
    """A metadata-only receipt for a private MinerU extraction output set."""

    receipt_id: str
    source_input_slot: str
    input_sha256: str
    output_file_names: tuple[str, ...]
    quality_report_ref: str
    source_pointer: str
    private_output_class: MineruPrivateOutputClass = "PRIVATE_GENERATED_OUTPUT"
    private_output_disposition: str = PRIVATE_OUTPUT_DISPOSITION
    output_content_read: bool = False
    downstream_release: str = DOWNSTREAM_RELEASE_HELD
    receipt_version: str = RECEIPT_VERSION
    claim_boundary: str = CLAIM_BOUNDARY


@dataclass(frozen=True)
class MineruQualityReportSourcePointer:
    """Metadata-only references produced from caller-owned quality evidence."""

    quality_report_ref: str
    source_pointer: str


@dataclass(frozen=True)
class MineruMemorySafeCandidateContract:
    """Metadata-only candidate contract for later memory-route selection."""

    candidate_id: str
    receipt_id: str
    source_input_slot: str
    input_sha256: str
    quality_report_ref: str
    source_pointer: str
    downstream_release: str = DOWNSTREAM_RELEASE_HELD
    output_content_read: bool = False
    memory_write_authorized: bool = False
    memory_write_disposition: str = MEMORY_WRITE_NOT_AUTHORIZED_BY_T9
    contract_version: str = MEMORY_SAFE_CANDIDATE_CONTRACT_VERSION
    claim_boundary: str = CLAIM_BOUNDARY


@dataclass(frozen=True)
class MineruMemoryOwnerAdmissionReadout:
    """Metadata-only readout for future memory-owner admission review."""

    candidate_id: str
    receipt_id: str
    source_input_slot: str
    input_sha256: str
    quality_report_ref: str
    source_pointer: str
    downstream_release: str
    claim_boundary: str
    output_content_read: bool = False
    memory_write_authorized: bool = False
    memory_write_disposition: str = MEMORY_WRITE_NOT_AUTHORIZED_BY_T12
    admission_disposition: str = "MEMORY_OWNER_ADMISSION_READY_FOR_REVIEW"
    future_authority_required: str = "FUTURE_MEMORY_WRITE_WORK_ORDER_REQUIRED"
    readout_version: str = MEMORY_OWNER_ADMISSION_READOUT_VERSION


@dataclass(frozen=True)
class MineruMemoryRecordCandidate:
    """Metadata-only memory-record candidate for future store-owner review."""

    record_candidate_id: str
    candidate_id: str
    receipt_id: str
    source_input_slot: str
    input_sha256: str
    quality_report_ref: str
    source_pointer: str
    downstream_release: str
    claim_boundary: str
    output_content_read: bool = False
    memory_write_authorized: bool = False
    memory_write_disposition: str = MEMORY_WRITE_NOT_AUTHORIZED_BY_T14
    candidate_disposition: str = MEMORY_RECORD_CANDIDATE_READY_FOR_REVIEW
    future_authority_required: str = "FUTURE_MEMORY_STORE_WRITE_AUTHORITY_REQUIRED"
    candidate_version: str = MEMORY_RECORD_CANDIDATE_VERSION


@dataclass(frozen=True)
class MineruDurableMemoryWriteInputCandidate:
    """Summary-only durable-memory write-input candidate; never calls the store."""

    id: str
    scope: str
    actor_id: str
    actor_role: str
    summary: str
    record_candidate_id: str
    claim_boundary: str
    output_content_read: bool = False
    memory_write_authorized: bool = False
    memory_write_disposition: str = MEMORY_WRITE_NOT_AUTHORIZED_BY_T16
    candidate_version: str = DURABLE_MEMORY_WRITE_INPUT_CANDIDATE_VERSION


@dataclass(frozen=True)
class MineruDurableMemoryWriteAdapterCandidate:
    """Metadata-only durable-memory write adapter candidate; never calls the store.

    This adapter candidate validates T16 write-input candidates against T17
    policy, actor, provenance, privacy, and R27 prerequisites. It does not
    invoke the durable memory store, write memory/RAG, vectorize, retrieve,
    or read private/generated output content.
    """

    adapter_candidate_id: str
    write_input_candidate_id: str
    policy_decision: str
    actor_authorized: bool
    actor_role: str
    target_durable_tier: str
    provenance_score: float
    r27_receipt_prerequisite: bool
    r27_quality_prerequisite: bool
    r27_source_pointer_prerequisite: bool
    r27_downstream_use_prerequisite: bool
    r27_claim_boundary_prerequisite: bool
    summary: str
    claim_boundary: str
    adapter_disposition: str = DURABLE_MEMORY_WRITE_ADAPTER_CANDIDATE_READY
    durable_store_invocation_disposition: str = DURABLE_STORE_INVOCATION_NOT_AUTHORIZED_BY_T18
    summary_only: bool = True
    can_reinject: bool = False
    raw_memory_released: bool = False
    output_content_read: bool = False
    memory_write_authorized: bool = False
    adapter_version: str = DURABLE_MEMORY_WRITE_ADAPTER_CANDIDATE_VERSION


def _fail(token: FailureToken, message: str) -> None:
    raise MineruMetadataReceiptValidationError(token, message)


def _validate_safe_id(value: str, *, field_name: str, token: FailureToken) -> None:
    if not _SAFE_ID_RE.fullmatch(value):
        _fail(token, f"{field_name} must be a bounded metadata identifier")
    lowered = value.casefold()
    if any(marker in lowered for marker in _UNSAFE_TEXT_MARKERS):
        _fail(token, f"{field_name} must not contain raw-content markers")


def _validate_output_file_name(name: str) -> None:
    if "/" in name or "\\" in name or name in {"", ".", ".."}:
        _fail("INVALID_OUTPUT_FILE_NAME", "output file names must be basenames")
    if name != name.strip() or "\n" in name or "\r" in name:
        _fail("INVALID_OUTPUT_FILE_NAME", "output file names must be stable strings")
    lowered = name.casefold()
    if any(marker in lowered for marker in _UNSAFE_TEXT_MARKERS):
        _fail(
            "INVALID_OUTPUT_FILE_NAME",
            "output file names must not encode output content",
        )
    if lowered in ALLOWED_OUTPUT_FILE_NAMES or _SAFE_MARKDOWN_RE.fullmatch(name):
        return
    _fail(
        "INVALID_OUTPUT_FILE_NAME",
        "output file name is not an allowed MinerU metadata family",
    )


def _validate_quality_source_pointer(quality_report_ref: str, source_pointer: str) -> None:
    for field_name, value in (
        ("quality_report_ref", quality_report_ref),
        ("source_pointer", source_pointer),
    ):
        if not _SAFE_ID_RE.fullmatch(value):
            _fail(
                "QUALITY_OR_SOURCE_POINTER_MISSING",
                f"{field_name} must be a bounded metadata identifier",
            )
        lowered = value.casefold()
        if any(marker in lowered for marker in _UNSAFE_TEXT_MARKERS):
            _fail(
                "QUALITY_OR_SOURCE_POINTER_MISSING",
                f"{field_name} must not contain raw-content markers",
            )


def build_mineru_quality_report_source_pointer(
    *,
    receipt_id: str,
    source_input_slot: str,
    input_sha256: str,
    quality_report_status: str,
    boundary_sha256: str,
    chunk_count: int,
) -> MineruQualityReportSourcePointer:
    """Build deterministic metadata refs without reading extraction content."""

    _validate_safe_id(
        receipt_id,
        field_name="receipt_id",
        token="INVALID_RECEIPT_ID",
    )
    _validate_safe_id(
        source_input_slot,
        field_name="source_input_slot",
        token="INVALID_SOURCE_INPUT_SLOT",
    )
    _validate_safe_id(
        quality_report_status,
        field_name="quality_report_status",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )
    if not _SHA256_RE.fullmatch(input_sha256):
        _fail("INVALID_INPUT_SHA256", "input_sha256 must be sha256:<64 lowercase hex>")
    if not _BOUNDARY_SHA256_RE.fullmatch(boundary_sha256):
        _fail(
            "QUALITY_OR_SOURCE_POINTER_MISSING",
            "boundary_sha256 must be a lowercase 64-character metadata digest",
        )
    if chunk_count < 0:
        _fail(
            "QUALITY_OR_SOURCE_POINTER_MISSING",
            "chunk_count must be a non-negative metadata count",
        )

    seed = "|".join(
        (
            receipt_id,
            source_input_slot,
            input_sha256,
            quality_report_status,
            boundary_sha256,
            str(chunk_count),
        )
    )
    digest = sha256(seed.encode("utf-8")).hexdigest()[:24]
    refs = MineruQualityReportSourcePointer(
        quality_report_ref=f"quality-report:{digest}",
        source_pointer=f"source-pointer:{digest}",
    )
    _validate_quality_source_pointer(refs.quality_report_ref, refs.source_pointer)
    return refs


def build_mineru_metadata_receipt(
    *,
    receipt_id: str,
    source_input_slot: str,
    input_sha256: str,
    output_file_names: Sequence[str],
    quality_report_ref: str,
    source_pointer: str,
    private_output_class: MineruPrivateOutputClass = "PRIVATE_GENERATED_OUTPUT",
    output_content_read: bool = False,
) -> MineruMetadataReceipt:
    """Build a validated metadata receipt without reading files or content."""

    _validate_safe_id(
        receipt_id,
        field_name="receipt_id",
        token="INVALID_RECEIPT_ID",
    )
    _validate_safe_id(
        source_input_slot,
        field_name="source_input_slot",
        token="INVALID_SOURCE_INPUT_SLOT",
    )
    if not _SHA256_RE.fullmatch(input_sha256):
        _fail("INVALID_INPUT_SHA256", "input_sha256 must be sha256:<64 lowercase hex>")
    if output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "R28-T1 receipts must keep output_content_read false",
        )
    if not output_file_names:
        _fail(
            "INVALID_OUTPUT_FILE_NAME",
            "at least one MinerU output file name is required",
        )
    _validate_quality_source_pointer(quality_report_ref, source_pointer)

    normalized_names = tuple(output_file_names)
    for name in normalized_names:
        _validate_output_file_name(name)

    return MineruMetadataReceipt(
        receipt_id=receipt_id,
        source_input_slot=source_input_slot,
        input_sha256=input_sha256,
        output_file_names=normalized_names,
        quality_report_ref=quality_report_ref,
        source_pointer=source_pointer,
        private_output_class=private_output_class,
    )


def mineru_metadata_receipt_payload(
    receipt: MineruMetadataReceipt,
) -> dict[str, object]:
    """Return the stable camelCase receipt payload."""

    return {
        "claimBoundary": receipt.claim_boundary,
        "downstreamRelease": receipt.downstream_release,
        "inputSha256": receipt.input_sha256,
        "outputContentRead": receipt.output_content_read,
        "outputFileNames": list(receipt.output_file_names),
        "privateOutputClass": receipt.private_output_class,
        "privateOutputDisposition": receipt.private_output_disposition,
        "qualityReportRef": receipt.quality_report_ref,
        "receiptId": receipt.receipt_id,
        "receiptVersion": receipt.receipt_version,
        "sourceInputSlot": receipt.source_input_slot,
        "sourcePointer": receipt.source_pointer,
    }


def build_mineru_memory_safe_candidate_contract(
    receipt: MineruMetadataReceipt,
) -> MineruMemorySafeCandidateContract:
    """Derive a deterministic metadata-only contract from a validated receipt."""

    _validate_safe_id(
        receipt.receipt_id,
        field_name="receipt_id",
        token="INVALID_RECEIPT_ID",
    )
    _validate_safe_id(
        receipt.source_input_slot,
        field_name="source_input_slot",
        token="INVALID_SOURCE_INPUT_SLOT",
    )
    if not _SHA256_RE.fullmatch(receipt.input_sha256):
        _fail("INVALID_INPUT_SHA256", "input_sha256 must be sha256:<64 lowercase hex>")
    if receipt.output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "memory-safe candidate contracts require output_content_read false",
        )
    if receipt.downstream_release != DOWNSTREAM_RELEASE_HELD:
        _fail(
            "DOWNSTREAM_RELEASE_NOT_HELD",
            "memory-safe candidate contracts require held downstream release",
        )
    _validate_quality_source_pointer(
        receipt.quality_report_ref,
        receipt.source_pointer,
    )

    seed = "|".join(
        (
            receipt.receipt_id,
            receipt.source_input_slot,
            receipt.input_sha256,
            receipt.quality_report_ref,
            receipt.source_pointer,
            receipt.downstream_release,
            receipt.claim_boundary,
        )
    )
    digest = sha256(seed.encode("utf-8")).hexdigest()[:24]
    candidate_id = f"memory-safe-candidate:{digest}"
    _validate_safe_id(
        candidate_id,
        field_name="candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )

    return MineruMemorySafeCandidateContract(
        candidate_id=candidate_id,
        receipt_id=receipt.receipt_id,
        source_input_slot=receipt.source_input_slot,
        input_sha256=receipt.input_sha256,
        quality_report_ref=receipt.quality_report_ref,
        source_pointer=receipt.source_pointer,
        downstream_release=receipt.downstream_release,
        claim_boundary=receipt.claim_boundary,
    )


def mineru_memory_safe_candidate_contract_payload(
    contract: MineruMemorySafeCandidateContract,
) -> dict[str, object]:
    """Return the stable camelCase memory-safe candidate payload."""

    return {
        "candidateId": contract.candidate_id,
        "claimBoundary": contract.claim_boundary,
        "contractVersion": contract.contract_version,
        "downstreamRelease": contract.downstream_release,
        "inputSha256": contract.input_sha256,
        "memoryWriteAuthorized": contract.memory_write_authorized,
        "memoryWriteDisposition": contract.memory_write_disposition,
        "outputContentRead": contract.output_content_read,
        "qualityReportRef": contract.quality_report_ref,
        "receiptId": contract.receipt_id,
        "sourceInputSlot": contract.source_input_slot,
        "sourcePointer": contract.source_pointer,
    }


def build_mineru_memory_owner_admission_readout(
    contract: MineruMemorySafeCandidateContract,
) -> MineruMemoryOwnerAdmissionReadout:
    """Build a metadata-only admission readout without writing memory."""

    _validate_safe_id(
        contract.candidate_id,
        field_name="candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )
    _validate_safe_id(
        contract.receipt_id,
        field_name="receipt_id",
        token="INVALID_RECEIPT_ID",
    )
    _validate_safe_id(
        contract.source_input_slot,
        field_name="source_input_slot",
        token="INVALID_SOURCE_INPUT_SLOT",
    )
    if not _SHA256_RE.fullmatch(contract.input_sha256):
        _fail("INVALID_INPUT_SHA256", "input_sha256 must be sha256:<64 lowercase hex>")
    _validate_quality_source_pointer(
        contract.quality_report_ref,
        contract.source_pointer,
    )
    if contract.downstream_release != DOWNSTREAM_RELEASE_HELD:
        _fail(
            "DOWNSTREAM_RELEASE_NOT_HELD",
            "memory-owner admission readouts require held downstream release",
        )
    if contract.output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "memory-owner admission readouts require output_content_read false",
        )
    if contract.memory_write_authorized is not False:
        _fail(
            "MEMORY_WRITE_ALREADY_AUTHORIZED",
            "T12 admission readouts must not authorize memory write",
        )
    if not contract.claim_boundary.strip():
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary is required")
    lowered_boundary = contract.claim_boundary.casefold()
    if any(marker in lowered_boundary for marker in _UNSAFE_TEXT_MARKERS):
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary must not contain raw-content markers")

    return MineruMemoryOwnerAdmissionReadout(
        candidate_id=contract.candidate_id,
        receipt_id=contract.receipt_id,
        source_input_slot=contract.source_input_slot,
        input_sha256=contract.input_sha256,
        quality_report_ref=contract.quality_report_ref,
        source_pointer=contract.source_pointer,
        downstream_release=contract.downstream_release,
        claim_boundary=contract.claim_boundary,
    )


def mineru_memory_owner_admission_readout_payload(
    readout: MineruMemoryOwnerAdmissionReadout,
) -> dict[str, object]:
    """Return the stable camelCase memory-owner admission readout payload."""

    return {
        "admissionDisposition": readout.admission_disposition,
        "candidateId": readout.candidate_id,
        "claimBoundary": readout.claim_boundary,
        "downstreamRelease": readout.downstream_release,
        "futureAuthorityRequired": readout.future_authority_required,
        "inputSha256": readout.input_sha256,
        "memoryWriteAuthorized": readout.memory_write_authorized,
        "memoryWriteDisposition": readout.memory_write_disposition,
        "outputContentRead": readout.output_content_read,
        "qualityReportRef": readout.quality_report_ref,
        "readoutVersion": readout.readout_version,
        "receiptId": readout.receipt_id,
        "sourceInputSlot": readout.source_input_slot,
        "sourcePointer": readout.source_pointer,
    }


def build_mineru_memory_record_candidate(
    readout: MineruMemoryOwnerAdmissionReadout,
) -> MineruMemoryRecordCandidate:
    """Build a metadata-only memory-record candidate without writing memory."""

    _validate_safe_id(
        readout.candidate_id,
        field_name="candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )
    _validate_safe_id(
        readout.receipt_id,
        field_name="receipt_id",
        token="INVALID_RECEIPT_ID",
    )
    _validate_safe_id(
        readout.source_input_slot,
        field_name="source_input_slot",
        token="INVALID_SOURCE_INPUT_SLOT",
    )
    if not _SHA256_RE.fullmatch(readout.input_sha256):
        _fail("INVALID_INPUT_SHA256", "input_sha256 must be sha256:<64 lowercase hex>")
    _validate_quality_source_pointer(
        readout.quality_report_ref,
        readout.source_pointer,
    )
    if readout.downstream_release != DOWNSTREAM_RELEASE_HELD:
        _fail(
            "DOWNSTREAM_RELEASE_NOT_HELD",
            "memory-record candidates require held downstream release",
        )
    if readout.output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "memory-record candidates require output_content_read false",
        )
    if readout.memory_write_authorized is not False:
        _fail(
            "MEMORY_WRITE_ALREADY_AUTHORIZED",
            "T14 memory-record candidates must not authorize memory write",
        )
    if not readout.claim_boundary.strip():
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary is required")
    lowered_boundary = readout.claim_boundary.casefold()
    if any(marker in lowered_boundary for marker in _UNSAFE_TEXT_MARKERS):
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary must not contain raw-content markers")

    seed = "|".join(
        (
            readout.candidate_id,
            readout.receipt_id,
            readout.source_input_slot,
            readout.input_sha256,
            readout.quality_report_ref,
            readout.source_pointer,
            readout.downstream_release,
            readout.claim_boundary,
            readout.admission_disposition,
            readout.readout_version,
        )
    )
    digest = sha256(seed.encode("utf-8")).hexdigest()[:24]
    record_candidate_id = f"memory-record-candidate:{digest}"
    _validate_safe_id(
        record_candidate_id,
        field_name="record_candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )

    return MineruMemoryRecordCandidate(
        record_candidate_id=record_candidate_id,
        candidate_id=readout.candidate_id,
        receipt_id=readout.receipt_id,
        source_input_slot=readout.source_input_slot,
        input_sha256=readout.input_sha256,
        quality_report_ref=readout.quality_report_ref,
        source_pointer=readout.source_pointer,
        downstream_release=readout.downstream_release,
        claim_boundary=readout.claim_boundary,
    )


def mineru_memory_record_candidate_payload(
    candidate: MineruMemoryRecordCandidate,
) -> dict[str, object]:
    """Return the stable camelCase memory-record candidate payload."""

    return {
        "candidateDisposition": candidate.candidate_disposition,
        "candidateId": candidate.candidate_id,
        "candidateVersion": candidate.candidate_version,
        "claimBoundary": candidate.claim_boundary,
        "downstreamRelease": candidate.downstream_release,
        "futureAuthorityRequired": candidate.future_authority_required,
        "inputSha256": candidate.input_sha256,
        "memoryWriteAuthorized": candidate.memory_write_authorized,
        "memoryWriteDisposition": candidate.memory_write_disposition,
        "outputContentRead": candidate.output_content_read,
        "qualityReportRef": candidate.quality_report_ref,
        "receiptId": candidate.receipt_id,
        "recordCandidateId": candidate.record_candidate_id,
        "sourceInputSlot": candidate.source_input_slot,
        "sourcePointer": candidate.source_pointer,
    }


def build_mineru_durable_memory_write_input_candidate(
    candidate: MineruMemoryRecordCandidate,
    *,
    scope: str,
    actor_id: str,
    actor_role: str,
) -> MineruDurableMemoryWriteInputCandidate:
    """Map a T14 memory-record candidate to a summary-only write-input shape.

    This never calls the durable memory store, never writes memory/RAG, and
    never includes raw OCR text, extracted text, document body, or any
    private/generated output content. The summary is built only from bounded
    metadata identifiers already present on the candidate.
    """

    _validate_safe_id(
        candidate.record_candidate_id,
        field_name="record_candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )
    _validate_safe_id(scope, field_name="scope", token="INVALID_SOURCE_INPUT_SLOT")
    _validate_safe_id(actor_id, field_name="actor_id", token="INVALID_RECEIPT_ID")
    _validate_safe_id(actor_role, field_name="actor_role", token="INVALID_RECEIPT_ID")
    if candidate.downstream_release != DOWNSTREAM_RELEASE_HELD:
        _fail(
            "DOWNSTREAM_RELEASE_NOT_HELD",
            "durable memory write-input candidates require held downstream release",
        )
    if candidate.output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "durable memory write-input candidates require output_content_read false",
        )
    if candidate.memory_write_authorized is not False:
        _fail(
            "MEMORY_WRITE_ALREADY_AUTHORIZED",
            "T16 mapping must not authorize memory write",
        )
    if not candidate.claim_boundary.strip():
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary is required")
    lowered_boundary = candidate.claim_boundary.casefold()
    if any(marker in lowered_boundary for marker in _UNSAFE_TEXT_MARKERS):
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary must not contain raw-content markers")

    summary = (
        f"MinerU memory-record candidate {candidate.record_candidate_id} "
        f"(receipt {candidate.receipt_id}, quality {candidate.quality_report_ref}, "
        f"source {candidate.source_pointer})"
    )
    seed = "|".join(
        (
            candidate.record_candidate_id,
            scope,
            actor_id,
            actor_role,
        )
    )
    digest = sha256(seed.encode("utf-8")).hexdigest()[:24]
    write_input_id = f"durable-memory-write-input:{digest}"
    _validate_safe_id(
        write_input_id,
        field_name="write_input_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )

    return MineruDurableMemoryWriteInputCandidate(
        id=write_input_id,
        scope=scope,
        actor_id=actor_id,
        actor_role=actor_role,
        summary=summary,
        record_candidate_id=candidate.record_candidate_id,
        claim_boundary=candidate.claim_boundary,
    )


def mineru_durable_memory_write_input_candidate_payload(
    candidate: MineruDurableMemoryWriteInputCandidate,
) -> dict[str, object]:
    """Return the stable camelCase durable memory write-input candidate payload."""

    return {
        "actorId": candidate.actor_id,
        "actorRole": candidate.actor_role,
        "candidateVersion": candidate.candidate_version,
        "claimBoundary": candidate.claim_boundary,
        "id": candidate.id,
        "memoryWriteAuthorized": candidate.memory_write_authorized,
        "memoryWriteDisposition": candidate.memory_write_disposition,
        "outputContentRead": candidate.output_content_read,
        "recordCandidateId": candidate.record_candidate_id,
        "scope": candidate.scope,
        "summary": candidate.summary,
    }


def build_mineru_durable_memory_write_adapter_candidate(
    write_input_candidate: MineruDurableMemoryWriteInputCandidate,
    *,
    policy_decision: str,
    actor_authorized: bool,
    actor_role: str,
    target_durable_tier: str,
    provenance_score: float,
    r27_receipt_prerequisite: bool,
    r27_quality_prerequisite: bool,
    r27_source_pointer_prerequisite: bool,
    r27_downstream_use_prerequisite: bool,
    r27_claim_boundary_prerequisite: bool,
) -> MineruDurableMemoryWriteAdapterCandidate:
    """Build a metadata-only durable-memory write adapter candidate.

    This builder validates the T16 write-input candidate against T17 policy,
    actor authorization, provenance, actor-role/tier compatibility, and R27
    prerequisites. It never calls the durable memory store, never writes
    memory/RAG, and never reads private/generated output content.

    Fail-closed conditions:
    - policy_decision is not "allow"
    - actor_authorized is not True
    - provenance_score is below MIN_PROVENANCE_SCORE (0.7)
    - actor_role is not allowed for the target durable tier
    - target_durable_tier is not a supported durable tier
    - any R27 prerequisite is False
    - write_input_candidate has output_content_read=True
    - write_input_candidate has memory_write_authorized=True
    - write_input_candidate has an empty or unsafe claim_boundary
    """

    _validate_safe_id(
        write_input_candidate.id,
        field_name="write_input_candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )
    _validate_safe_id(actor_role, field_name="actor_role", token="INVALID_RECEIPT_ID")
    _validate_safe_id(
        target_durable_tier,
        field_name="target_durable_tier",
        token="INVALID_SOURCE_INPUT_SLOT",
    )

    if write_input_candidate.output_content_read is not False:
        _fail(
            "OUTPUT_CONTENT_READ_FORBIDDEN",
            "T18 adapter candidates require output_content_read false on write-input",
        )
    if write_input_candidate.memory_write_authorized is not False:
        _fail(
            "MEMORY_WRITE_ALREADY_AUTHORIZED",
            "T18 adapter candidates must not inherit memory_write_authorized true",
        )
    if not write_input_candidate.claim_boundary.strip():
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary is required")
    lowered_boundary = write_input_candidate.claim_boundary.casefold()
    if any(marker in lowered_boundary for marker in _UNSAFE_TEXT_MARKERS):
        _fail("CLAIM_BOUNDARY_MISSING", "claim_boundary must not contain raw-content markers")

    if target_durable_tier not in DURABLE_TIER_ACTOR_LANES:
        _fail(
            "DURABLE_TIER_NOT_SUPPORTED",
            f"target_durable_tier must be one of: {', '.join(sorted(DURABLE_TIER_ACTOR_LANES.keys()))}",
        )
    if policy_decision != "allow":
        _fail(
            "POLICY_DECISION_DENIED",
            "T18 adapter candidates require policy_decision allow",
        )
    if actor_authorized is not True:
        _fail(
            "ACTOR_NOT_AUTHORIZED",
            "T18 adapter candidates require actor_authorized true",
        )
    if (
        isinstance(provenance_score, bool)
        or not isinstance(provenance_score, (int, float))
        or provenance_score < MIN_PROVENANCE_SCORE
    ):
        _fail(
            "LOW_PROVENANCE_SCORE",
            f"T18 adapter candidates require provenance_score >= {MIN_PROVENANCE_SCORE}",
        )
    allowed_actors = DURABLE_TIER_ACTOR_LANES[target_durable_tier]
    if actor_role not in allowed_actors:
        _fail(
            "ACTOR_ROLE_NOT_ALLOWED_FOR_TIER",
            f"actor_role {actor_role} is not allowed for durable tier {target_durable_tier}",
        )

    if not r27_receipt_prerequisite:
        _fail("R27_PREREQUISITE_MISSING", "R27 receipt prerequisite must be satisfied")
    if not r27_quality_prerequisite:
        _fail("R27_PREREQUISITE_MISSING", "R27 quality prerequisite must be satisfied")
    if not r27_source_pointer_prerequisite:
        _fail("R27_PREREQUISITE_MISSING", "R27 source pointer prerequisite must be satisfied")
    if not r27_downstream_use_prerequisite:
        _fail("R27_PREREQUISITE_MISSING", "R27 downstream use prerequisite must be satisfied")
    if not r27_claim_boundary_prerequisite:
        _fail("R27_PREREQUISITE_MISSING", "R27 claim boundary prerequisite must be satisfied")

    summary = (
        f"Durable memory write adapter candidate for write-input "
        f"{write_input_candidate.id} (tier {target_durable_tier}, "
        f"actor {actor_role}, provenance {provenance_score})"
    )
    seed = "|".join(
        (
            write_input_candidate.id,
            policy_decision,
            str(actor_authorized),
            actor_role,
            target_durable_tier,
            str(provenance_score),
            str(r27_receipt_prerequisite),
            str(r27_quality_prerequisite),
            str(r27_source_pointer_prerequisite),
            str(r27_downstream_use_prerequisite),
            str(r27_claim_boundary_prerequisite),
        )
    )
    digest = sha256(seed.encode("utf-8")).hexdigest()[:24]
    adapter_candidate_id = f"durable-memory-write-adapter:{digest}"
    _validate_safe_id(
        adapter_candidate_id,
        field_name="adapter_candidate_id",
        token="QUALITY_OR_SOURCE_POINTER_MISSING",
    )

    return MineruDurableMemoryWriteAdapterCandidate(
        adapter_candidate_id=adapter_candidate_id,
        write_input_candidate_id=write_input_candidate.id,
        policy_decision=policy_decision,
        actor_authorized=actor_authorized,
        actor_role=actor_role,
        target_durable_tier=target_durable_tier,
        provenance_score=provenance_score,
        r27_receipt_prerequisite=r27_receipt_prerequisite,
        r27_quality_prerequisite=r27_quality_prerequisite,
        r27_source_pointer_prerequisite=r27_source_pointer_prerequisite,
        r27_downstream_use_prerequisite=r27_downstream_use_prerequisite,
        r27_claim_boundary_prerequisite=r27_claim_boundary_prerequisite,
        summary=summary,
        claim_boundary=write_input_candidate.claim_boundary,
    )


def mineru_durable_memory_write_adapter_candidate_payload(
    candidate: MineruDurableMemoryWriteAdapterCandidate,
) -> dict[str, object]:
    """Return the stable camelCase durable memory write adapter candidate payload."""

    return {
        "adapterCandidateId": candidate.adapter_candidate_id,
        "adapterDisposition": candidate.adapter_disposition,
        "adapterVersion": candidate.adapter_version,
        "actorAuthorized": candidate.actor_authorized,
        "actorRole": candidate.actor_role,
        "canReinject": candidate.can_reinject,
        "claimBoundary": candidate.claim_boundary,
        "durableStoreInvocationDisposition": candidate.durable_store_invocation_disposition,
        "memoryWriteAuthorized": candidate.memory_write_authorized,
        "outputContentRead": candidate.output_content_read,
        "policyDecision": candidate.policy_decision,
        "provenanceScore": candidate.provenance_score,
        "r27ClaimBoundaryPrerequisite": candidate.r27_claim_boundary_prerequisite,
        "r27DownstreamUsePrerequisite": candidate.r27_downstream_use_prerequisite,
        "r27QualityPrerequisite": candidate.r27_quality_prerequisite,
        "r27ReceiptPrerequisite": candidate.r27_receipt_prerequisite,
        "r27SourcePointerPrerequisite": candidate.r27_source_pointer_prerequisite,
        "rawMemoryReleased": candidate.raw_memory_released,
        "summary": candidate.summary,
        "summaryOnly": candidate.summary_only,
        "targetDurableTier": candidate.target_durable_tier,
        "writeInputCandidateId": candidate.write_input_candidate_id,
    }


def render_mineru_metadata_receipt_json(receipt: MineruMetadataReceipt) -> str:
    """Render deterministic JSON with a trailing newline."""

    return dumps(
        mineru_metadata_receipt_payload(receipt),
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    ) + "\n"
