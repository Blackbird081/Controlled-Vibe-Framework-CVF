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
    if instant <= datetime.now(timezone.utc):
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
