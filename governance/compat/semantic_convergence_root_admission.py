"""Strict, forward-only SCEC admission for one integrated root dispatch/return pair."""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import PurePosixPath
from typing import Any, Callable


@dataclass(frozen=True)
class BlockViolation:
    code: str
    message: str


ROOT_CONTRACT_PARTIAL_READY_THRESHOLD = 2
ROOT_CONTRACT_SCOPE_EXPANSION_THRESHOLD = 1
ROOT_CONTRACT_SAME_CLAIM_CORRECTION_THRESHOLD = 2
STOP_REASSESS_NON_DECREASING_THRESHOLD = 2
ESCALATED_DISPOSITIONS = ("ROOT_CONTRACT_REQUIRED", "STOP_REASSESS_ARCHITECTURE")
ESCALATION_SATISFYING_DISPOSITIONS = ESCALATED_DISPOSITIONS + ("READY_WITH_EXECUTABLE_PROOF",)
NON_NARROW_SUCCESSOR_SCOPES = ("INTEGRATED_ROOT_CONTRACT", "NO_SUCCESSOR", "EXECUTABLE_IMPLEMENTATION")
POINTER_SCHEMA = "cvf.scecRootContractAdmissionPointer@1.0.0"
GRANT_SCHEMA = "cvf.scecRootContractAdmission@1.0.0"
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
GRANT_FENCE_RE = re.compile(r"(?ms)^ {0,3}`{3}root-contract-admission-json\s*\n(.*?)\n {0,3}`{3}[ \t]*$")
EFFECT_FIELDS = {"providerCalls", "networkCalls", "publicWrites", "deployments",
                 "realDataMutations", "destructiveActions", "productRuntimeStarts"}
GRANT_FIELDS = {"schemaVersion", "status", "decisionOwner", "operatorInstructionEvidence",
                "problemKey", "predecessor", "sourceContract", "workOrderPath",
                "workerReturnPath", "allowedArtifacts", "effectCeilings", "expiresAtUtc"}
POST_STOP_POINTER_SCHEMA = "cvf.scecPostStopRootAdmissionPointer@2.0.0"
POST_STOP_GRANT_SCHEMA = "cvf.scecPostStopRootAdmission@2.0.0"
POST_STOP_REASSESSMENT_SCHEMA = "cvf.scecIntegratedRootReassessment@1.0.0"
POST_STOP_STATUS = "ACCEPTED_FOR_ONE_BOUNDED_POST_STOP_ROOT_PAIR"
POST_STOP_REASSESSMENT_STATUS = "ACCEPTED_BY_LOCAL"
POST_STOP_GRANT_FENCE_RE = re.compile(r"(?ms)^ {0,3}`{3}post-stop-root-admission-json[ \t]*\r?\n(.*?)\r?\n {0,3}`{3}[ \t]*\r?$")
POST_STOP_REASSESSMENT_FENCE_RE = re.compile(r"(?ms)^ {0,3}`{3}root-reassessment-json[ \t]*\r?\n(.*?)\r?\n {0,3}`{3}[ \t]*\r?$")
CANONICAL_UTC_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z")
MAX_AUTHORITY_BYTES = 65536
MAX_EVIDENCE_BYTES = 2097152
COUNTER_FIELDS = ("partialReadyClosures", "reviewerScopeExpansions",
                  "sameClaimCorrections", "nonDecreasingBlockerTransitions")
GOVERNED_ROOTS = ("docs/baselines/", "docs/reviews/")
POST_STOP_GRANT_FIELDS = {"schemaVersion", "status", "decisionOwner", "operatorInstructionEvidence",
                          "problemKey", "predecessor", "rootReassessment", "sourceContract",
                          "workOrderPath", "workerReturnPath", "allowedArtifacts", "effectCeilings",
                          "expiresAtUtc"}
POST_STOP_PIN_FIELDS = {"path", "sha256", "chainOrdinal", "blockers", "counters"}
POST_STOP_REASSESSMENT_FIELDS = {"schemaVersion", "status", "decisionOwner", "scope", "problemKey",
                                 "stoppedPredecessor", "sourceContract", "obligations"}
RUNTIME_READINESS_CLAIM_RE = re.compile(r"\b(runtime|production|provider|whole.job)\s+(ready|readiness|accepted)\b", re.I)


def _utc_now() -> datetime:
    """Actual UTC; the only clock seam, patched solely inside test scope."""
    return datetime.now(timezone.utc)


def decode_json_unicode_escapes(body: str) -> str:
    """Expose escaped opt-in markers before strict duplicate-key parsing."""
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), body)


def validate_escalation_triggers(block: dict) -> list[BlockViolation]:
    """Original SCEC invariants 5-7; bypass only after strict pair admission."""
    violations: list[BlockViolation] = []
    counters = block.get("counters")
    disposition = block.get("requiredDisposition")
    successor_scope = block.get("successorScope")
    if not isinstance(counters, dict):
        return violations
    partial_ready = counters.get("partialReadyClosures", 0)
    scope_expansions = counters.get("reviewerScopeExpansions", 0)
    same_claim = counters.get("sameClaimCorrections", 0)
    non_decreasing = counters.get("nonDecreasingBlockerTransitions", 0)
    root_contract_required = (
        isinstance(partial_ready, int) and partial_ready >= ROOT_CONTRACT_PARTIAL_READY_THRESHOLD
    ) or (
        isinstance(scope_expansions, int) and scope_expansions >= ROOT_CONTRACT_SCOPE_EXPANSION_THRESHOLD
    ) or (
        isinstance(same_claim, int) and same_claim >= ROOT_CONTRACT_SAME_CLAIM_CORRECTION_THRESHOLD
    )
    stop_reassess_required = (
        isinstance(non_decreasing, int) and non_decreasing >= STOP_REASSESS_NON_DECREASING_THRESHOLD
    )
    if stop_reassess_required and disposition != "STOP_REASSESS_ARCHITECTURE":
        violations.append(BlockViolation(
            "MISSING_STOP_REASSESS_ESCALATION",
            "two or more consecutive non-decreasing blocker transitions require "
            "`requiredDisposition: STOP_REASSESS_ARCHITECTURE`",
        ))
    elif root_contract_required and disposition not in ESCALATION_SATISFYING_DISPOSITIONS:
        violations.append(BlockViolation(
            "MISSING_ROOT_CONTRACT_ESCALATION",
            "two partial-ready closures, one reviewer scope expansion, or a repeated "
            "same-claim correction requires `requiredDisposition` to be "
            f"one of {ESCALATION_SATISFYING_DISPOSITIONS}",
        ))
    escalated = disposition in ESCALATED_DISPOSITIONS or root_contract_required or stop_reassess_required
    if escalated and successor_scope == "INITIAL_BOUNDED":
        violations.append(BlockViolation(
            "NARROW_SUCCESSOR_AFTER_ESCALATION",
            "once escalation is required, `successorScope` must not be `INITIAL_BOUNDED`; "
            f"use one of {NON_NARROW_SUCCESSOR_SCOPES}",
        ))
    return violations


def validate_runtime_readiness(block: dict) -> list[BlockViolation]:
    """Original invariant 8: documentation-only proof cannot claim readiness."""
    violations: list[BlockViolation] = []
    if block.get("requiredDisposition") != "READY_WITH_EXECUTABLE_PROOF":
        return violations
    claims = block.get("claims")
    if not isinstance(claims, list):
        return violations
    for index, claim in enumerate(claims):
        if isinstance(claim, dict) and claim.get("proofClass") == "PROPOSAL_ONLY_NO_RUNTIME_READINESS":
            violations.append(BlockViolation(
                "RUNTIME_READINESS_FROM_DOC_ONLY_PROOF",
                f"claims[{index}] uses `PROPOSAL_ONLY_NO_RUNTIME_READINESS` proof but "
                "`requiredDisposition` is `READY_WITH_EXECUTABLE_PROOF`",
            ))
    return violations


def validate_ready_scope_pairing(block: dict) -> list[BlockViolation]:
    """Original readiness and scope pairing rule."""
    violations: list[BlockViolation] = []
    disposition = block.get("requiredDisposition")
    scope = block.get("successorScope")
    claims = block.get("claims")
    if disposition == "READY_WITH_EXECUTABLE_PROOF":
        if scope != "EXECUTABLE_IMPLEMENTATION":
            violations.append(BlockViolation('READY_SCOPE_MISMATCH',
                '`READY_WITH_EXECUTABLE_PROOF` requires `successorScope: EXECUTABLE_IMPLEMENTATION`'))
        if not isinstance(claims, list) or not claims:
            violations.append(BlockViolation('READY_WITHOUT_CLAIMS',
                '`READY_WITH_EXECUTABLE_PROOF` requires at least one claim with executable proof'))
    elif scope == "EXECUTABLE_IMPLEMENTATION":
        violations.append(BlockViolation('EXECUTABLE_SCOPE_WITHOUT_READY_DISPOSITION',
            '`successorScope: EXECUTABLE_IMPLEMENTATION` requires `READY_WITH_EXECUTABLE_PROOF`'))
    return violations


def safe_path(value: Any) -> bool:
    if not isinstance(value, str) or not value or "\\" in value or value.startswith("/"):
        return False
    if re.match(r"^[A-Za-z]:", value):
        return False
    pure = PurePosixPath(value)
    return pure.as_posix() == value and all(p not in ("", ".", "..") for p in value.split("/"))


def _no_duplicates(pairs: list[tuple[str, Any]]) -> dict:
    result: dict = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _object_ref(value: Any) -> bool:
    return isinstance(value, dict) and set(value) == {"path", "sha256"} and safe_path(value["path"]) and isinstance(value["sha256"], str) and bool(SHA_RE.fullmatch(value["sha256"]))


def _read_bound(path: str, resolver: Callable[[str], bytes | None]) -> bytes | None:
    if not safe_path(path) or "/archive/" in f"/{path}/":
        return None
    try:
        return resolver(path)
    except (OSError, ValueError):
        return None


def _grant(pointer: dict, resolver: Callable[[str], bytes | None]) -> tuple[dict | None, str | None]:
    path = pointer["path"]
    if not (path.startswith("docs/baselines/") or path.startswith("docs/reviews/")) or not path.endswith(".md"):
        return None, "grant must be a governed baseline or review"
    content = _read_bound(path, resolver)
    if content is None or len(content) > 65536:
        return None, "grant is unreadable or oversized"
    if hashlib.sha256(content).hexdigest() != pointer["sha256"]:
        return None, "grant raw SHA-256 mismatch"
    try:
        text = content.decode("utf-8", errors="strict")
    except UnicodeError:
        return None, "grant is not strict UTF-8"
    matches = GRANT_FENCE_RE.findall(text)
    if len(matches) != 1:
        return None, "grant must contain exactly one admission JSON object"
    try:
        grant = json.loads(matches[0], object_pairs_hook=_no_duplicates)
    except (ValueError, json.JSONDecodeError) as exc:
        return None, f"invalid or duplicate grant JSON: {exc}"
    if not isinstance(grant, dict) or set(grant) != GRANT_FIELDS:
        return None, "grant fields must match exact schema"
    return grant, None


def validate_root_admission(
    block: dict, artifact_path: str | None, predecessor_block: dict | None,
    evidence_bytes_resolver: Callable[[str], bytes | None] | None,
    *, validate_work_order: Callable[[str], tuple[dict | None, list[str]]] | None = None,
) -> list[BlockViolation]:
    """Validate the strict declaration and repository binding; no authority inference."""
    pointer = block.get("rootContractAdmission")
    if pointer is None:
        return [BlockViolation("ROOT_ADMISSION_PARTIAL_POINTER", "null admission pointer is invalid")]
    if _v2_pointer(block) is not None:
        return validate_post_stop_admission(block, artifact_path, predecessor_block,
                                            evidence_bytes_resolver, validate_work_order)
    if not isinstance(pointer, dict) or set(pointer) != {"schemaVersion", "path", "sha256", "stage"}:
        return [BlockViolation("ROOT_ADMISSION_POINTER_INVALID", "pointer requires exactly schemaVersion, path, sha256, stage")]
    if (pointer["schemaVersion"] != POINTER_SCHEMA or not safe_path(pointer["path"])
            or not isinstance(pointer["sha256"], str) or not SHA_RE.fullmatch(pointer["sha256"])
            or pointer["stage"] not in ("DISPATCH", "RETURN")):
        return [BlockViolation("ROOT_ADMISSION_POINTER_INVALID", "pointer schema, path, SHA-256, or stage invalid")]
    if not safe_path(artifact_path) or evidence_bytes_resolver is None or predecessor_block is None or validate_work_order is None:
        return [BlockViolation("ROOT_ADMISSION_CONTEXT_MISSING", "actual artifact path and repository/evidence context required")]
    grant, error = _grant(pointer, evidence_bytes_resolver)
    if error:
        return [BlockViolation("ROOT_ADMISSION_GRANT_INVALID", error)]
    assert grant is not None
    if (grant["schemaVersion"] != GRANT_SCHEMA or grant["status"] != "ACCEPTED_FOR_BOUNDED_SOURCE_IMPLEMENTATION"
            or grant["decisionOwner"] != "LOCAL" or not isinstance(grant["operatorInstructionEvidence"], str)
            or not grant["operatorInstructionEvidence"].strip() or grant["problemKey"] != block.get("problemKey")
            or not _object_ref(grant["predecessor"]) or not _object_ref(grant["sourceContract"])):
        return [BlockViolation("ROOT_ADMISSION_GRANT_INVALID", "grant schema, owner, identity, evidence, or pinned source invalid")]
    source = grant["sourceContract"]
    if source["path"] == pointer["path"] or not source["path"].startswith("docs/baselines/"):
        return [BlockViolation("ROOT_ADMISSION_SOURCE_INVALID", "source contract must be independent governed baseline")]
    source_bytes = _read_bound(source["path"], evidence_bytes_resolver)
    if source_bytes is None or hashlib.sha256(source_bytes).hexdigest() != source["sha256"]:
        return [BlockViolation("ROOT_ADMISSION_SOURCE_INVALID", "source contract missing or raw hash mismatch")]
    try:
        source_text = source_bytes.decode("utf-8", errors="strict")
    except UnicodeError:
        return [BlockViolation("ROOT_ADMISSION_SOURCE_INVALID", "source contract is not UTF-8")]
    if "root" not in source_text.lower() or "integrated" not in source_text.lower():
        return [BlockViolation("ROOT_ADMISSION_SOURCE_INVALID", "source contract lacks consolidated integrated root reassessment")]
    work_path, return_path = grant["workOrderPath"], grant["workerReturnPath"]
    if (not safe_path(work_path) or not safe_path(return_path) or work_path == return_path
            or not work_path.startswith("docs/work_orders/") or not return_path.startswith("docs/reviews/")
            or not work_path.endswith(".md") or not return_path.endswith(".md")):
        return [BlockViolation("ROOT_ADMISSION_PATH_INVALID", "bound work order and return paths invalid")]
    allowed = grant["allowedArtifacts"]
    if (not isinstance(allowed, list) or not allowed or any(not safe_path(p) for p in allowed)
            or len(allowed) != len(set(allowed)) or return_path not in allowed
            or any(p in allowed for p in (pointer["path"], source["path"], work_path))):
        return [BlockViolation("ROOT_ADMISSION_MANIFEST_INVALID", "allowed artifacts invalid or include authority inputs")]
    effects = grant["effectCeilings"]
    if not isinstance(effects, dict) or set(effects) != EFFECT_FIELDS or any(type(v) is not int or v != 0 for v in effects.values()):
        return [BlockViolation("ROOT_ADMISSION_EFFECT_INVALID", "effect ceilings must be exact strict integer zero")]
    expiry = grant["expiresAtUtc"]
    if not isinstance(expiry, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z", expiry):
        return [BlockViolation("ROOT_ADMISSION_EXPIRED", "expiry must be canonical UTC Z")]
    try:
        instant = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
    except ValueError:
        return [BlockViolation("ROOT_ADMISSION_EXPIRED", "expiry is invalid")]
    if instant <= _utc_now():
        return [BlockViolation("ROOT_ADMISSION_EXPIRED", "grant has expired")]
    work_bytes = _read_bound(work_path, evidence_bytes_resolver)
    if work_bytes is None:
        return [BlockViolation("ROOT_ADMISSION_WORK_ORDER_INVALID", "bound work order unreadable")]
    try:
        ledger, issues = validate_work_order(work_bytes.decode("utf-8", errors="strict"))
    except UnicodeError:
        return [BlockViolation("ROOT_ADMISSION_WORK_ORDER_INVALID", "work order is not UTF-8")]
    if issues or ledger is None:
        return [BlockViolation("ROOT_ADMISSION_WORK_ORDER_INVALID", "bound acceptance ledger invalid: " + "; ".join(issues))]
    expected = {p for row in ledger["requirements"] for p in row["expectedArtifacts"]}
    if set(allowed) != expected:
        return [BlockViolation("ROOT_ADMISSION_MANIFEST_INVALID", "allowedArtifacts differs from validated expectedArtifacts union")]
    if predecessor_block.get("requiredDisposition") == "STOP_REASSESS_ARCHITECTURE":
        return [BlockViolation("SUCCESSOR_AFTER_STOP_REASSESS", "actual STOP predecessor remains terminal")]
    delta = block["blockerDelta"]
    if delta["prior"] or delta["current"] or block["chainMode"] != "SUCCESSOR":
        return [BlockViolation("ROOT_ADMISSION_CHAIN_INVALID", "admitted pair requires successor and empty blockers")]
    stage = pointer["stage"]
    if stage == "DISPATCH":
        if (artifact_path != work_path or block["predecessor"] != grant["predecessor"]
                or predecessor_block.get("requiredDisposition") != "ROOT_CONTRACT_REQUIRED"
                or predecessor_block.get("successorScope") != "NO_SUCCESSOR"
                or predecessor_block.get("blockerDelta", {}).get("current") != []
                or block["requiredDisposition"] != "ROOT_CONTRACT_REQUIRED"
                or block["successorScope"] != "INTEGRATED_ROOT_CONTRACT"
                or block["counters"]["nonDecreasingBlockerTransitions"] != 2):
            return [BlockViolation("ROOT_ADMISSION_DISPATCH_INVALID", "dispatch is not direct bound integrated ROOT successor")]
        if any(re.search(r"\b(runtime|production|provider|whole.job)\s+(ready|readiness|accepted)\b",
                         str(claim.get("evidenceRef", "")), re.I) for claim in block["claims"]):
            return [BlockViolation("ROOT_ADMISSION_DISPATCH_INVALID", "dispatch cannot assert runtime readiness")]
        return []
    if (artifact_path != return_path or block["predecessor"].get("path") != work_path
            or predecessor_block.get("rootContractAdmission") != {**pointer, "stage": "DISPATCH"}
            or predecessor_block.get("predecessor") != grant["predecessor"]
            or predecessor_block.get("requiredDisposition") != "ROOT_CONTRACT_REQUIRED"
            or predecessor_block.get("successorScope") != "INTEGRATED_ROOT_CONTRACT"
            or block["requiredDisposition"] != "READY_WITH_EXECUTABLE_PROOF"
            or block["successorScope"] != "EXECUTABLE_IMPLEMENTATION"
            or block["counters"]["nonDecreasingBlockerTransitions"] != 3):
        return [BlockViolation("ROOT_ADMISSION_RETURN_INVALID", "return is not immediate bound executable proof successor")]
    if not block["claims"] or any(c["proofClass"] == "PROPOSAL_ONLY_NO_RUNTIME_READINESS" for c in block["claims"]):
        return [BlockViolation("ROOT_ADMISSION_PROOF_INVALID", "return requires executable claim-to-proof mapping")]
    for claim in block["claims"]:
        ref = claim["evidenceRef"]
        if not safe_path(ref) or ref not in allowed or _read_bound(ref, evidence_bytes_resolver) is None:
            return [BlockViolation("ROOT_ADMISSION_PROOF_INVALID", "return proof reference must resolve to repository evidence")]
    return []


class _Reject(Exception):
    def __init__(self, suffix: str, message: str) -> None:
        super().__init__(message)
        self.violation = BlockViolation(f"ROOT_ADMISSION_V2_{suffix}", message)


def _need(condition: Any, suffix: str, message: str) -> None:
    if not condition:
        raise _Reject(suffix, message)


def _is_sha(value: Any) -> bool:
    return isinstance(value, str) and bool(SHA_RE.fullmatch(value))


def _is_count(value: Any) -> bool:
    return type(value) is int and value >= 0


def _v2_pointer(block: dict) -> dict | None:
    pointer = block.get("rootContractAdmission")
    if isinstance(pointer, dict) and pointer.get("schemaVersion") == POST_STOP_POINTER_SCHEMA:
        return pointer
    return None


def is_post_stop_return(block: dict) -> bool:
    """True for a v2 RETURN pointer, which keeps the ordinary escalation triggers."""
    pointer = _v2_pointer(block)
    return pointer is not None and pointer.get("stage") == "RETURN"


def post_stop_dispatch_admitted(block: dict, admission_violations: list[BlockViolation]) -> bool:
    """The narrow actual-STOP exception: a fully valid v2 DISPATCH admission only."""
    pointer = _v2_pointer(block)
    return pointer is not None and pointer.get("stage") == "DISPATCH" and not admission_violations


def _pinned_text(path: Any, sha: Any, resolver: Callable[[str], bytes | None], suffix: str, *,
                 roots: tuple[str, ...] = GOVERNED_ROOTS, limit: int = MAX_EVIDENCE_BYTES) -> str:
    _need(safe_path(path) and path.startswith(roots), suffix, "reference path must be a safe governed repository path")
    _need(_is_sha(sha), suffix, "reference raw SHA-256 shape invalid")
    content = _read_bound(path, resolver)
    _need(isinstance(content, bytes), suffix, f"{path} is unreadable or not a repository file")
    _need(len(content) <= limit, suffix, f"{path} exceeds the {limit}-byte reference limit")
    _need(hashlib.sha256(content).hexdigest() == sha, suffix, f"{path} raw SHA-256 mismatch")
    try:
        return content.decode("utf-8", errors="strict")
    except UnicodeError:
        raise _Reject(suffix, f"{path} is not strict UTF-8") from None


def _located(ref: Any, resolver: Callable[[str], bytes | None], suffix: str, *,
             roots: tuple[str, ...] = GOVERNED_ROOTS) -> tuple[dict, str]:
    _need(isinstance(ref, dict) and set(ref) == {"path", "sha256", "locator"}, suffix,
          "evidence reference requires exactly path, sha256, locator")
    locator = ref["locator"]
    _need(isinstance(locator, str) and locator != "" and locator == locator.strip(), suffix,
          "locator must be a canonical non-empty string")
    text = _pinned_text(ref["path"], ref["sha256"], resolver, suffix, roots=roots)
    _need(text.count(locator) == 1, suffix, f"locator must occur exactly once in {ref['path']}")
    return ref, text


def _authority_json(ref: Any, resolver: Callable[[str], bytes | None], fence: re.Pattern[str], suffix: str) -> dict:
    _need(_object_ref(ref) and ref["path"].endswith(".md"), suffix,
          "authority reference requires exactly a safe .md path and raw SHA-256")
    text = _pinned_text(ref["path"], ref["sha256"], resolver, suffix, limit=MAX_AUTHORITY_BYTES)
    matches = fence.findall(text)
    _need(len(matches) == 1, suffix, "authority must contain exactly one structured JSON object")
    try:
        value = json.loads(matches[0], object_pairs_hook=_no_duplicates)
    except ValueError as exc:
        raise _Reject(suffix, f"invalid or duplicate authority JSON: {exc}") from None
    _need(isinstance(value, dict), suffix, "authority JSON must be an object")
    return value


def _stop_pin(stop: Any) -> dict:
    _need(isinstance(stop, dict) and set(stop) == POST_STOP_PIN_FIELDS, "GRANT",
          "predecessor pin requires exactly path, sha256, chainOrdinal, blockers, counters")
    _need(safe_path(stop["path"]) and _is_sha(stop["sha256"]) and _is_count(stop["chainOrdinal"]), "GRANT",
          "predecessor pin path, SHA-256 or ordinal invalid")
    blockers, counters = stop["blockers"], stop["counters"]
    _need(isinstance(blockers, list) and blockers and all(isinstance(b, str) and b.strip() for b in blockers)
          and len(blockers) == len(set(blockers)), "GRANT", "predecessor blocker set must be a non-empty unique string list")
    _need(isinstance(counters, dict) and set(counters) == set(COUNTER_FIELDS)
          and all(_is_count(counters[name]) for name in COUNTER_FIELDS), "GRANT",
          "predecessor pin must carry all four counters as non-negative integers")
    return stop


def _check_reassessment(grant: dict, stop: dict, resolver: Callable[[str], bytes | None]) -> set[str]:
    """Accepted-state predicates of the Local-owned integrated root reassessment."""
    ref, source = grant["rootReassessment"], grant["sourceContract"]
    _need(_object_ref(ref) and ref["path"].startswith(GOVERNED_ROOTS) and "_WORKER_RETURN_" not in ref["path"],
          "REASSESSMENT", "reassessment must be a Local governed baseline or review, never a worker return")
    doc = _authority_json(ref, resolver, POST_STOP_REASSESSMENT_FENCE_RE, "REASSESSMENT")
    _need(set(doc) == POST_STOP_REASSESSMENT_FIELDS, "REASSESSMENT", "reassessment fields must match the exact schema")
    _need(doc["schemaVersion"] == POST_STOP_REASSESSMENT_SCHEMA and doc["status"] == POST_STOP_REASSESSMENT_STATUS
          and doc["decisionOwner"] == "LOCAL" and doc["scope"] == "INTEGRATED_ROOT_CONTRACT"
          and doc["problemKey"] == grant["problemKey"], "REASSESSMENT",
          "reassessment version, accepted status, Local owner, integrated scope or problem key invalid")
    _need(doc["stoppedPredecessor"] == {"path": stop["path"], "sha256": stop["sha256"]}
          and doc["sourceContract"] == source, "REASSESSMENT", "reassessment pins differ from the grant")
    rows = doc["obligations"]
    _need(isinstance(rows, list) and rows and all(
        isinstance(row, dict) and set(row) == {"blockerId", "designEvidence", "sourceEvidence"} for row in rows),
        "REASSESSMENT", "reassessment obligations must be a non-empty list of exact obligation rows")
    ids = [row["blockerId"] for row in rows]
    _need(all(isinstance(i, str) for i in ids) and len(ids) == len(set(ids)) and set(ids) == set(stop["blockers"]),
          "REASSESSMENT", "obligations must cover every actual stopped blocker exactly once")
    paths = {ref["path"]}
    for row in rows:
        design, _ = _located(row["designEvidence"], resolver, "REASSESSMENT", roots=("docs/baselines/",))
        _need(design["path"] == source["path"] and design["sha256"] == source["sha256"], "REASSESSMENT",
              "design evidence must resolve inside the independently pinned source contract")
        evidence, text = _located(row["sourceEvidence"], resolver, "REASSESSMENT", roots=("docs/reviews/",))
        _need(row["blockerId"] in text, "REASSESSMENT", "source evidence must name the blocker it supports")
        paths.add(evidence["path"])
    return paths


def _check_grant(block: dict, pointer: dict, resolver: Callable[[str], bytes | None],
                 validate_work_order: Callable[[str], tuple[dict | None, list[str]]]) -> tuple[dict, dict, set[str], bytes]:
    grant = _authority_json({"path": pointer["path"], "sha256": pointer["sha256"]}, resolver,
                            POST_STOP_GRANT_FENCE_RE, "GRANT")
    _need(set(grant) == POST_STOP_GRANT_FIELDS, "GRANT", "grant fields must match the exact v2 schema")
    _need(grant["schemaVersion"] == POST_STOP_GRANT_SCHEMA and grant["status"] == POST_STOP_STATUS
          and grant["decisionOwner"] == "LOCAL" and grant["problemKey"] == block.get("problemKey"), "GRANT",
          "grant version, status, Local owner or problem key invalid")
    stop = _stop_pin(grant["predecessor"])
    operator, _ = _located(grant["operatorInstructionEvidence"], resolver, "EVIDENCE")
    source = grant["sourceContract"]
    _need(_object_ref(source) and source["path"].startswith("docs/baselines/"), "SOURCE",
          "source contract must be an independent governed baseline reference")
    _pinned_text(source["path"], source["sha256"], resolver, "SOURCE", roots=("docs/baselines/",))
    authority = _check_reassessment(grant, stop, resolver) | {pointer["path"], source["path"], operator["path"], stop["path"]}
    _pinned_text(stop["path"], stop["sha256"], resolver, "STOP")
    work_path, return_path, allowed = grant["workOrderPath"], grant["workerReturnPath"], grant["allowedArtifacts"]
    _need(safe_path(work_path) and safe_path(return_path) and work_path != return_path
          and work_path.startswith("docs/work_orders/") and return_path.startswith("docs/reviews/")
          and work_path.endswith(".md") and return_path.endswith(".md"), "PATH",
          "bound work order and return paths invalid")
    refs = [pointer["path"], grant["rootReassessment"]["path"], source["path"], operator["path"], stop["path"]]
    _need(len(refs) == len(set(refs)) and work_path not in refs and return_path not in refs, "PATH",
          "grant, reassessment, source, operator evidence and stopped predecessor must be distinct from each other and the bound pair")
    _need(isinstance(allowed, list) and allowed and all(safe_path(p) for p in allowed)
          and len(allowed) == len(set(allowed)) and return_path in allowed
          and work_path not in allowed and not authority & set(allowed), "MANIFEST",
          "allowed artifacts invalid, duplicated, or include authority inputs")
    effects = grant["effectCeilings"]
    _need(isinstance(effects, dict) and set(effects) == EFFECT_FIELDS
          and all(type(v) is int and v == 0 for v in effects.values()), "EFFECT",
          "effect ceilings must be exact strict integer zero")
    expiry = grant["expiresAtUtc"]
    _need(isinstance(expiry, str) and CANONICAL_UTC_RE.fullmatch(expiry), "EXPIRED", "expiry must be canonical UTC Z")
    try:
        instant = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
    except ValueError:
        raise _Reject("EXPIRED", "expiry is invalid") from None
    _need(instant > _utc_now(), "EXPIRED", "grant has expired")
    work_bytes = _read_bound(work_path, resolver)
    _need(isinstance(work_bytes, bytes) and len(work_bytes) <= MAX_EVIDENCE_BYTES, "WORK_ORDER",
          "bound work order unreadable or oversized")
    try:
        ledger, issues = validate_work_order(work_bytes.decode("utf-8", errors="strict"))
    except UnicodeError:
        raise _Reject("WORK_ORDER", "work order is not UTF-8") from None
    _need(ledger is not None and not issues, "WORK_ORDER", "bound acceptance ledger invalid: " + "; ".join(issues or []))
    expected = {p for row in ledger["requirements"] for p in row["expectedArtifacts"]}
    _need(set(allowed) == expected, "MANIFEST", "allowedArtifacts differs from validated expectedArtifacts union")
    return grant, stop, set(allowed), work_bytes


def _check_blocker_state(block: dict, stop: dict, *, resolved: bool) -> None:
    delta, counters = block["blockerDelta"], block["counters"]
    blockers = set(stop["blockers"])
    _need(set(delta["prior"]) == blockers, "CHAIN", "prior must equal the stopped blocker set")
    if resolved:
        _need(set(delta["resolved"]) == blockers and not (delta["retained"] or delta["new"] or delta["reopened"]
              or delta["current"]), "CHAIN", "return must resolve every stopped blocker and add or keep none")
    else:
        _need(set(delta["retained"]) == blockers and set(delta["current"]) == blockers
              and not (delta["resolved"] or delta["new"] or delta["reopened"]), "CHAIN",
              "dispatch must retain every stopped blocker and resolve, add or reopen none")
    pinned = stop["counters"]
    _need(all(counters.get(name) == pinned[name] for name in COUNTER_FIELDS[:3]), "CHAIN",
          "cumulative counters must equal the pinned stopped counters")
    streak = 0 if resolved else pinned["nonDecreasingBlockerTransitions"] + 1
    _need(counters.get("nonDecreasingBlockerTransitions") == streak, "CHAIN",
          "streak must follow the ordinary rule from the pinned stopped counters")


def _check_post_stop(block: dict, artifact_path: Any, predecessor_block: Any,
                     resolver: Callable[[str], bytes | None] | None,
                     validate_work_order: Callable[[str], tuple[dict | None, list[str]]] | None) -> None:
    pointer = block["rootContractAdmission"]
    _need(set(pointer) == {"schemaVersion", "path", "sha256", "stage"} and safe_path(pointer["path"])
          and _is_sha(pointer["sha256"]) and pointer["stage"] in ("DISPATCH", "RETURN"), "POINTER",
          "pointer requires exactly schemaVersion, path, sha256, stage with a safe path and valid stage")
    _need(safe_path(artifact_path) and resolver is not None and isinstance(predecessor_block, dict)
          and validate_work_order is not None, "CONTEXT", "actual artifact path and repository/evidence context required")
    grant, stop, allowed, work_bytes = _check_grant(block, pointer, resolver, validate_work_order)
    work_path, return_path = grant["workOrderPath"], grant["workerReturnPath"]
    stop_ref = {"path": stop["path"], "sha256": stop["sha256"]}
    stage = pointer["stage"]
    ordinal = block.get("chainOrdinal")
    if stage == "DISPATCH":
        _need(artifact_path == work_path, "DISPATCH", "dispatch must be the single bound work order")
        _need(block["predecessor"] == stop_ref, "STOP", "dispatch must directly follow the pinned actual stopped predecessor")
        _need(predecessor_block.get("requiredDisposition") == "STOP_REASSESS_ARCHITECTURE"
              and predecessor_block.get("successorScope") == "NO_SUCCESSOR"
              and predecessor_block.get("problemKey") == grant["problemKey"]
              and predecessor_block.get("chainOrdinal") == stop["chainOrdinal"]
              and predecessor_block.get("counters") == stop["counters"]
              and isinstance(predecessor_block.get("blockerDelta"), dict)
              and set(predecessor_block["blockerDelta"].get("current", [])) == set(stop["blockers"]), "STOP",
              "predecessor is not the pinned actual STOP state (disposition, key, ordinal, blockers, counters)")
        _need(ordinal == stop["chainOrdinal"] + 1, "CHAIN", "dispatch ordinal must be the stopped ordinal plus one")
        _check_blocker_state(block, stop, resolved=False)
        _need(block.get("resolutionEvidence") in (None, {}), "CHAIN", "dispatch cannot resolve a blocker by documentation")
        _need(block["requiredDisposition"] == "ROOT_CONTRACT_REQUIRED"
              and block["successorScope"] == "INTEGRATED_ROOT_CONTRACT", "DISPATCH",
              "dispatch must be ROOT_CONTRACT_REQUIRED / INTEGRATED_ROOT_CONTRACT")
        _need(not any(RUNTIME_READINESS_CLAIM_RE.search(str(c.get("evidenceRef", ""))) for c in block["claims"]),
              "DISPATCH", "dispatch cannot assert runtime readiness")
        return
    _need(artifact_path == return_path, "RETURN", "return must be the single bound worker return path")
    _need(block["predecessor"].get("path") == work_path
          and block["predecessor"].get("sha256") == hashlib.sha256(work_bytes).hexdigest(), "RETURN",
          "return must directly follow the exact admitted work order bytes")
    _need(predecessor_block.get("rootContractAdmission") == {**pointer, "stage": "DISPATCH"}
          and predecessor_block.get("predecessor") == stop_ref
          and predecessor_block.get("requiredDisposition") == "ROOT_CONTRACT_REQUIRED"
          and predecessor_block.get("successorScope") == "INTEGRATED_ROOT_CONTRACT"
          and predecessor_block.get("chainOrdinal") == stop["chainOrdinal"] + 1, "RETURN",
          "work order must be the one admitted dispatch of the same grant")
    _need(ordinal == stop["chainOrdinal"] + 2, "CHAIN", "return ordinal must be the stopped ordinal plus two")
    _check_blocker_state(block, stop, resolved=True)
    _need(block["requiredDisposition"] == "READY_WITH_EXECUTABLE_PROOF"
          and block["successorScope"] == "EXECUTABLE_IMPLEMENTATION", "RETURN",
          "return must be READY_WITH_EXECUTABLE_PROOF / EXECUTABLE_IMPLEMENTATION")
    claims = {c["claimId"]: c for c in block["claims"]}
    _need(claims and len(claims) == len(block["claims"]) and all(c["proofClass"] != "PROPOSAL_ONLY_NO_RUNTIME_READINESS"
                         and c["claimClass"] != "DOCUMENTATION_ONLY" for c in claims.values()), "PROOF",
          "return requires executable claim-to-proof mapping")
    _need(all(safe_path(c["evidenceRef"]) and c["evidenceRef"] in allowed
              and _read_bound(c["evidenceRef"], resolver) is not None for c in claims.values()), "PROOF",
          "claim evidence must be an allowed repository artifact")
    bindings = block.get("resolutionEvidence")
    _need(isinstance(bindings, dict) and set(bindings) == set(stop["blockers"]), "PROOF",
          "every stopped blocker needs exactly one executable proof binding")
    for binding in bindings.values():
        _need(isinstance(binding, dict) and binding.get("evidenceClass") == "EXECUTABLE_PROOF"
              and binding.get("evidencePath") in allowed and isinstance(binding.get("claimId"), str)
              and binding["claimId"] in claims, "PROOF",
              "binding must be EXECUTABLE_PROOF over an allowed artifact joined to an executable claim")


def validate_post_stop_admission(
    block: dict, artifact_path: str | None, predecessor_block: dict | None,
    evidence_bytes_resolver: Callable[[str], bytes | None] | None,
    validate_work_order: Callable[[str], tuple[dict | None, list[str]]] | None,
) -> list[BlockViolation]:
    """Strict v2 declared-state admission of one post-STOP dispatch/return pair; no authority inference."""
    try:
        _check_post_stop(block, artifact_path, predecessor_block, evidence_bytes_resolver, validate_work_order)
    except _Reject as exc:
        return [exc.violation]
    return []
