#!/usr/bin/env python3
"""Deterministic MFRP P3-R1B-R2 replay through the actual P2 seams.

Repairs the R1B-RV-1/R1B-RV-2/R1B-RV-3 gaps: this runner actually
recomputes the seven `sourceManifest` source hashes and executes every
locator/range/excerpt binding before any case replay, rejects genuine
cited-source byte drift before any P2 seam call, and emits per-case
base/mutated receipt digests plus explicit false-negative/false-positive
classification alongside the actual P2 validator/readout observations.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

try:
    from agent_autorun_machine_verification import (
        RECEIPT_SCHEMA,
        VERIFIER_IDENTITY_PROFILE,
        _machine_verification_digest,
        _machine_verification_object,
        _validate_receipt_integrity,
    )
    from agent_automation_machine_verification_readout import (
        DETERMINISTIC_PREFLIGHT_COMPLETE,
        build_machine_verification_readout,
        machine_readout_to_dict,
    )
except ModuleNotFoundError:
    from governance.compat.agent_autorun_machine_verification import (
        RECEIPT_SCHEMA,
        VERIFIER_IDENTITY_PROFILE,
        _machine_verification_digest,
        _machine_verification_object,
        _validate_receipt_integrity,
    )
    from governance.compat.agent_automation_machine_verification_readout import (
        DETERMINISTIC_PREFLIGHT_COMPLETE,
        build_machine_verification_readout,
        machine_readout_to_dict,
    )


REPO_ROOT = Path(__file__).resolve().parents[2]
ORACLE_SCHEMA = "cvf.mfrp.actualSeamReplayOracle.v1"
RESULT_SCHEMA = "cvf.mfrp.actualSeamReplayResult.v1"
ORACLE_PATH = Path("governance/compat/fixtures/mfrp_p3_r1a_r1_static_only_oracle.json")
ORACLE_SHA256 = "c6a8006265ff1968760101e380c779e2a031c870aa7ff3c6d0296df94dbebd43"
ORACLE_JCS_SHA256 = "5a6751a7b6cda0291792a476799594dde63bdfa7e13997b8a093f3cecfd8e97d"
REQUIRED_SET_SHA256 = "04be6dc1fa061e13af195c5490769bf88fba3309e2ddb4aa0ed24a8fd6440fca"
ORACLE_COMMIT = "e15cf55d8060a44056f44dd819b399ae3aec1fb0"
RECEIPT_OWNER = Path("governance/compat/agent_autorun_machine_verification.py")
READOUT_OWNER = Path("governance/compat/agent_automation_machine_verification_readout.py")
OWNER_HASHES = {
    str(RECEIPT_OWNER): "8280a95e0985bd1273aa359afff455be1d18346e8b49cb92e9746922d835d022",
    str(READOUT_OWNER): "ff6088bf8144deec4582ce9faf62384b314346c9cbbb87f6b3349a2d23f7e7c3",
}
DESIGN_HASHES = {
    "docs/assessments/CVF_MFRP_P3_R1_ACTUAL_SEAM_REPLAY_AND_COMMITTED_ORACLE_REDESIGN_2026-09-01.md": "22a086d7742dbdaec5b887fd377890962ad34396953f48287ce865f743766011",
    "docs/assessments/CVF_MFRP_P4_SHADOW_CANARY_AND_GOVERNANCE_TAX_BUDGET_DESIGN_2026-09-02.md": "65698a95dc7bb7f437fe061a81559701b91a3e611c445f5122ad8145c5f13df5",
}
NON_REPRESENTABLE = {"C07", "C08", "C18"}
ALLOWED_MUTATIONS = {
    "NO_MUTATION", "REPLACE_JSON_POINTER", "ALTER_SOURCE_IDENTITY",
    "DELETE_JSON_POINTER", "ALTER_CHECK_SET", "INJECT_SECRET_SENTINEL",
    "ADD_JSON_POINTER",
}
SECRET_SENTINEL = "MFRP_FIXED_NON_SECRET_SENTINEL_C15"
FORBIDDEN_REVIEWER_OUTCOMES = {"REPLAY_PASS", "RETURN_TO_DESIGN"}
BYTE_RECIPE = "UTF8_NO_BOM_LF_NORMALIZED_LINE_RANGE_V1"


@dataclass(frozen=True)
class _Result:
    name: str


class SourceBindingError(ValueError):
    """Raised when a source/locator/excerpt binding fails to validate."""


def _jcs_bytes(value: object) -> bytes:
    """Restricted RFC 8785 serialization for the bounded replay domain.

    The oracle and synthetic P2 receipt use strings, booleans, nulls, arrays,
    objects, safe integers and integral finite floats. Reject other numeric
    values instead of silently calling generic JSON canonical JCS.
    """

    def string(value: str) -> str:
        if any(0xD800 <= ord(character) <= 0xDFFF for character in value):
            raise ValueError("JCS input contains a non-I-JSON surrogate")
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

    def serialize(item: object) -> str:
        if item is None:
            return "null"
        if item is True:
            return "true"
        if item is False:
            return "false"
        if isinstance(item, str):
            return string(item)
        if isinstance(item, int):
            if abs(item) > 9007199254740991:
                raise ValueError("JCS integer exceeds the I-JSON safe range")
            return str(item)
        if isinstance(item, float):
            if not math.isfinite(item) or not item.is_integer():
                raise ValueError(
                    "bounded replay JCS admits only finite integral numeric values"
                )
            integer = int(item)
            if abs(integer) > 9007199254740991:
                raise ValueError("JCS number exceeds the I-JSON safe range")
            return str(integer)
        if isinstance(item, list):
            return "[" + ",".join(serialize(value) for value in item) + "]"
        if isinstance(item, dict):
            if not all(isinstance(key, str) for key in item):
                raise ValueError("JCS object keys must be strings")
            keys = sorted(item, key=lambda key: key.encode("utf-16-be"))
            return "{" + ",".join(
                f"{string(key)}:{serialize(item[key])}" for key in keys
            ) + "}"
        raise ValueError(f"unsupported bounded replay JCS type: {type(item).__name__}")

    return serialize(value).encode("utf-8")


def _sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha_file(path: Path) -> str:
    return _sha_bytes(path.read_bytes())


def _git_head() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, text=True,
        capture_output=True, check=True,
    ).stdout.strip()


def _git_blob(commit: str, path: Path) -> bytes:
    return subprocess.run(
        ["git", "show", f"{commit}:{path.as_posix()}"], cwd=REPO_ROOT,
        capture_output=True, check=True,
    ).stdout


def _required_set(oracle: dict) -> dict:
    return {
        "requiredCaseIds": oracle["requiredCaseIds"],
        "requiredFamilies": oracle["requiredFamilies"],
        "requiredZeroToleranceClasses": oracle["requiredZeroToleranceClasses"],
    }


# ---------------------------------------------------------------------------
# Actual source-binding execution (R1B-RV-1 repair)
# ---------------------------------------------------------------------------


def _normalize_line_ending_text(raw: bytes) -> str:
    """Decode UTF-8 without BOM and normalize CRLF/lone CR to LF.

    Rejects a UTF-8 BOM outright per the fixed byte recipe
    ``UTF8_NO_BOM_LF_NORMALIZED_LINE_RANGE_V1``.
    """
    if raw.startswith(b"\xef\xbb\xbf"):
        raise SourceBindingError("source bytes carry a forbidden UTF-8 BOM")
    text = raw.decode("utf-8")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def _resolve_excerpt(raw: bytes, start_line: int, end_line: int) -> bytes:
    """Select a one-based inclusive line range and return its excerpt bytes.

    ``includeTrailingLf`` is always ``False`` under this recipe: lines are
    joined with ``\n`` and no trailing newline is appended.
    """
    text = _normalize_line_ending_text(raw)
    lines = text.split("\n")
    total_lines = len(lines)
    if not isinstance(start_line, int) or not isinstance(end_line, int):
        raise SourceBindingError("source excerpt range must be integer line numbers")
    if start_line < 1 or end_line < start_line or end_line > total_lines:
        raise SourceBindingError(
            f"source excerpt range [{start_line}, {end_line}] is invalid or "
            f"out of bounds for a {total_lines}-line source"
        )
    selected = lines[start_line - 1:end_line]
    return "\n".join(selected).encode("utf-8")


def validate_source_manifest(
    oracle: dict, *, source_root: Path | None = None
) -> dict[str, str]:
    """Recompute all seven `sourceManifest` file hashes against source_root.

    ``source_root`` is an internal test-only override; the production CLI
    path always binds to the repository root and never accepts an override
    that could substitute clean historical bytes for the real cited source.
    """
    root = source_root if source_root is not None else REPO_ROOT
    manifest = oracle.get("sourceManifest")
    if not isinstance(manifest, list) or not manifest:
        raise SourceBindingError("oracle sourceManifest is missing or empty")
    resolved: dict[str, str] = {}
    seen_paths: dict[str, str] = {}
    for entry in manifest:
        source_id = entry.get("sourceId")
        path = entry.get("path")
        expected_sha256 = entry.get("sha256")
        if not source_id or not path or not expected_sha256:
            raise SourceBindingError("sourceManifest entry missing sourceId/path/sha256")
        full = root / path
        if not full.is_file():
            raise SourceBindingError(f"sourceManifest path does not exist: {path}")
        actual = _sha_bytes(full.read_bytes())
        if actual != expected_sha256:
            raise SourceBindingError(
                f"source {source_id} ({path}) hash drift: expected {expected_sha256}, got {actual}"
            )
        resolved[source_id] = path
        seen_paths[path] = source_id
    if len(resolved) != 7:
        raise SourceBindingError(f"sourceManifest must contain exactly seven sources, found {len(resolved)}")
    return resolved


def validate_case_source_binding(
    case: dict, resolved_sources: dict[str, str], *, source_root: Path | None = None
) -> None:
    """Execute one case's locator/range/excerpt binding before replay.

    Fails closed before any call to `_validate_receipt_integrity` or the
    readout owner.
    """
    root = source_root if source_root is not None else REPO_ROOT
    case_id = case.get("caseId")
    ref = case.get("sourceRef")
    if not isinstance(ref, dict):
        raise SourceBindingError(f"{case_id}: sourceRef missing or malformed")
    source_id = ref.get("sourceId")
    path = ref.get("path")
    locator = ref.get("locator")
    byte_recipe = ref.get("byteRecipe")
    line_range = ref.get("sourceExcerptLineRange")
    expected_excerpt_sha256 = ref.get("sourceExcerptSha256")

    if source_id not in resolved_sources:
        raise SourceBindingError(f"{case_id}: unknown sourceId {source_id!r}")
    if resolved_sources[source_id] != path:
        raise SourceBindingError(
            f"{case_id}: sourceRef.path {path!r} does not match sourceManifest path "
            f"for {source_id} ({resolved_sources[source_id]!r})"
        )
    if byte_recipe != BYTE_RECIPE:
        raise SourceBindingError(
            f"{case_id}: unsupported byteRecipe {byte_recipe!r}; only {BYTE_RECIPE} is admitted"
        )
    if not isinstance(line_range, dict):
        raise SourceBindingError(f"{case_id}: sourceExcerptLineRange missing or malformed")
    if line_range.get("includeTrailingLf") is not False:
        raise SourceBindingError(f"{case_id}: includeTrailingLf must be exactly false")
    if not locator:
        raise SourceBindingError(f"{case_id}: locator is empty")
    if not isinstance(expected_excerpt_sha256, str) or len(expected_excerpt_sha256) != 64:
        raise SourceBindingError(f"{case_id}: sourceExcerptSha256 missing or malformed")

    full = root / path
    if not full.is_file():
        raise SourceBindingError(f"{case_id}: cited source path does not exist: {path}")
    raw = full.read_bytes()
    excerpt = _resolve_excerpt(raw, line_range.get("startLine"), line_range.get("endLine"))
    excerpt_text = excerpt.decode("utf-8")
    occurrences = excerpt_text.count(locator)
    if occurrences == 0:
        raise SourceBindingError(
            f"{case_id}: locator {locator!r} not found inside its declared excerpt range"
        )
    if occurrences > 1:
        raise SourceBindingError(
            f"{case_id}: locator {locator!r} occurs {occurrences} times inside its "
            "declared excerpt range; exactly one occurrence is required"
        )
    actual_excerpt_sha256 = _sha_bytes(excerpt)
    if actual_excerpt_sha256 != expected_excerpt_sha256:
        raise SourceBindingError(
            f"{case_id}: source excerpt digest drift: expected {expected_excerpt_sha256}, "
            f"got {actual_excerpt_sha256}"
        )


def execute_source_binding(
    oracle: dict, *, source_root: Path | None = None
) -> dict[str, object]:
    """Recompute all seven source hashes and execute all 19 case bindings.

    Must run and fully pass before any case is replayed through a P2 seam.
    Returns a summary usable for evidence reporting.
    """
    resolved_sources = validate_source_manifest(oracle, source_root=source_root)
    cases = oracle.get("cases", [])
    checked_case_ids: list[str] = []
    for case in cases:
        validate_case_source_binding(case, resolved_sources, source_root=source_root)
        checked_case_ids.append(case.get("caseId"))
    return {
        "sourceCount": len(resolved_sources),
        "caseBindingCount": len(checked_case_ids),
        "checkedCaseIds": checked_case_ids,
    }


def validate_oracle(oracle: object, raw_bytes: bytes) -> dict:
    if not isinstance(oracle, dict) or oracle.get("schema") != ORACLE_SCHEMA:
        raise ValueError("oracle schema mismatch")
    if _sha_bytes(raw_bytes) != ORACLE_SHA256:
        raise ValueError("oracle identity drift")
    if _sha_bytes(_jcs_bytes(oracle)) != ORACLE_JCS_SHA256:
        raise ValueError("oracle all-field JCS identity drift")
    required = _required_set(oracle)
    if _sha_bytes(_jcs_bytes(required)) != REQUIRED_SET_SHA256:
        raise ValueError("oracle required-set identity drift")
    cases = oracle.get("cases")
    if not isinstance(cases, list) or len(cases) != 19:
        raise ValueError("oracle must contain exactly 19 cases")
    case_ids = [case.get("caseId") for case in cases if isinstance(case, dict)]
    families = [case.get("family") for case in cases if isinstance(case, dict)]
    if case_ids != oracle["requiredCaseIds"] or len(set(case_ids)) != 19:
        raise ValueError("case coverage mismatch")
    if set(families) != set(oracle["requiredFamilies"]) or len(set(families)) != 18:
        raise ValueError("family coverage mismatch")
    zero_classes = {
        case.get("zeroToleranceClass") for case in cases
        if case.get("zeroToleranceClass") != "NONE"
    }
    if zero_classes != set(oracle["requiredZeroToleranceClasses"]) or len(zero_classes) != 7:
        raise ValueError("zero-tolerance coverage mismatch")
    for case in cases:
        source = case.get("sourceRef", {})
        mutation = case.get("mutation", {})
        if not source.get("locator") or len(source.get("sourceExcerptSha256", "")) != 64:
            raise ValueError(f"{case.get('caseId')}: source locator/excerpt drift")
        if mutation.get("operator") not in ALLOWED_MUTATIONS:
            raise ValueError(f"{case.get('caseId')}: unknown mutation")
        expected = (
            "NOT_REPRESENTABLE_BY_CURRENT_P2"
            if case.get("caseId") in NON_REPRESENTABLE else "STATICALLY_REACHABLE"
        )
        if case.get("feasibilityDisposition") != expected:
            raise ValueError(f"{case.get('caseId')}: feasibility mismatch")
    return required


def _canonical_receipt() -> dict:
    context = {
        "phase": "pre-implementation",
        "base": "mfrp-r1b-base",
        "head": "mfrp-r1b-head",
        "baseSha": "1" * 40,
        "headSha": "2" * 40,
        "commandManifestHash": "3" * 64,
        "worktreeFingerprint": "4" * 64,
        "verifierIdentityProfile": VERIFIER_IDENTITY_PROFILE,
    }
    verifier_digest = "5" * 64
    results = (_Result("mfrp-r1b-control"),)
    machine = _machine_verification_object(context, verifier_digest, results)
    return {
        "schema": RECEIPT_SCHEMA,
        "status": "PASS",
        **context,
        "verifierIdentityDigest": verifier_digest,
        "machineVerification": machine,
        "receiptDigest": _machine_verification_digest(machine),
        "totalDurationSeconds": 0.0,
        "checks": [{
            "name": results[0].name,
            "command": ["python", "-B", "mfrp-r1b-control"],
            "durationSeconds": 0.0,
            "status": "PASS",
        }],
    }


def _set_pointer(document: dict, pointer: str, value: object, *, append: bool = False) -> None:
    parts = pointer.lstrip("/").split("/")
    target: object = document
    for part in parts[:-1]:
        target = target[int(part)] if isinstance(target, list) else target[part]
    leaf = parts[-1]
    if isinstance(target, list):
        if append or leaf == "-" or int(leaf) == len(target):
            target.append(value)
        else:
            target[int(leaf)] = value
    else:
        target[leaf] = value


def _delete_pointer(document: dict, pointer: str) -> None:
    parts = pointer.lstrip("/").split("/")
    target: object = document
    for part in parts[:-1]:
        target = target[int(part)] if isinstance(target, list) else target[part]
    if isinstance(target, list):
        del target[int(parts[-1])]
    else:
        del target[parts[-1]]


def apply_mutation(receipt: dict, case: dict) -> bool:
    """Consume a committed typed mutation and report serialized-byte change."""
    before = _jcs_bytes(receipt)
    case_id = case["caseId"]
    operator = case["mutation"]["operator"]
    pointer = case["mutation"]["jsonPointer"]
    if operator == "NO_MUTATION":
        pass
    elif operator == "DELETE_JSON_POINTER":
        _delete_pointer(receipt, pointer)
    elif operator == "ADD_JSON_POINTER":
        _set_pointer(receipt, pointer, "MFRP_FOCUSED_PROBE_CONTRADICTION", append=True)
    elif operator == "INJECT_SECRET_SENTINEL":
        _set_pointer(receipt, pointer, SECRET_SENTINEL)
    elif operator == "ALTER_CHECK_SET":
        if pointer == "/checks":
            receipt["checks"].append({
                "name": "mfrp-altered-check", "command": ["python", "-B", "altered"],
                "durationSeconds": 0.0, "status": "PASS",
            })
        else:
            _set_pointer(receipt, pointer, [{"name": "narrow-only", "status": "PASS"}])
    elif case_id in {"C03", "C11"}:
        _set_pointer(receipt, pointer, "6" * 64 if case_id == "C03" else "not-a-sha256")
    elif case_id == "C02":
        _set_pointer(receipt, pointer, [{"name": "same-role-substitution", "status": "PASS"}])
    elif case_id == "C04":
        _set_pointer(receipt, pointer, "AVAILABLE_MATCHED")
    elif case_id == "C05":
        _set_pointer(receipt, pointer, "0" * 40)
    elif case_id == "C06":
        _set_pointer(receipt, pointer, "RECONCILED")
    elif case_id == "C12":
        _set_pointer(receipt, pointer, "CLOSED")
    elif case_id == "C13":
        receipt["machineVerification"]["deterministicResults"].append(
            {"name": "fabricated-unrun-check", "status": "PASS"}
        )
    elif case_id == "C16B":
        _set_pointer(receipt, pointer, "7" * 64)
    else:
        _set_pointer(receipt, pointer, "MFRP_MUTATED_VALUE")
    changed = _jcs_bytes(receipt) != before
    if operator == "NO_MUTATION" and changed:
        raise AssertionError(f"{case_id}: NO_MUTATION changed payload")
    if operator != "NO_MUTATION" and not changed:
        raise AssertionError(f"{case_id}: mutation did not change serialized bytes")
    return changed


def observe_receipt(receipt: dict) -> dict:
    validator_payload = receipt
    valid, reason = _validate_receipt_integrity(validator_payload)
    readout_payload = validator_payload
    readout = machine_readout_to_dict(
        build_machine_verification_readout(valid, readout_payload, reason)
    )
    assert readout is not None
    return {
        "validatorAccepted": valid,
        "validatorReason": reason,
        "validatorReadoutSamePayloadObject": validator_payload is readout_payload,
        "readout": readout,
    }


def evaluate_predicate(case: dict, observation: dict) -> bool:
    predicate = case["requiredSafetyPredicate"]
    valid = observation["validatorAccepted"]
    readout = observation["readout"]
    if predicate == "POSITIVE_CONTROL_VALID":
        return valid and readout["status"] == DETERMINISTIC_PREFLIGHT_COMPLETE
    if predicate == "RECEIPT_REJECTED":
        return not valid
    if predicate == "IDENTITY_DRIFT_REJECTED":
        return not valid and any(
            term in observation["validatorReason"]
            for term in ("identity", "Identity", "envelope", "Digest", "digest")
        )
    if predicate == "GAP_SURFACED_UNCLASSIFIED":
        return bool(
            readout["unclassified"] or readout["notCheckedScope"]
            or readout["limitations"] or readout["exceptions"]
        )
    if predicate == "HARD_OBLIGATION_NOT_CLOSED":
        return (not valid) or "hard-obligation map not checked" in readout["unclassified"]
    if predicate == "SECRET_SENTINEL_NOT_EMITTED":
        return SECRET_SENTINEL not in json.dumps(readout, sort_keys=True)
    raise ValueError(f"unknown predicate: {predicate}")


def assert_evaluator_conformance(evaluator: Callable[[dict, dict], bool]) -> None:
    negative_case = {"requiredSafetyPredicate": "SECRET_SENTINEL_NOT_EMITTED"}
    negative_observation = {
        "validatorAccepted": False,
        "validatorReason": "receipt receiptDigest mismatch",
        "readout": {"exceptions": [SECRET_SENTINEL]},
    }
    if evaluator(negative_case, negative_observation):
        raise ValueError("predicate evaluator accepts the fixed negative calibration")


# ---------------------------------------------------------------------------
# Receipt digest and classification (R1B-RV-3 repair)
# ---------------------------------------------------------------------------


def _receipt_digest(receipt: dict) -> str:
    """SHA-256 of RFC 8785 JCS bytes over the complete in-memory receipt.

    Uses the exact same JCS helper/byte domain as every other digest in
    this module. Excludes no field: the entire receipt payload is hashed.
    """
    return _sha_bytes(_jcs_bytes(receipt))


def classify_case(
    *,
    mutation_operator: str,
    predicate_satisfied: bool,
) -> tuple[str, bool | None, bool | None]:
    """Map (mutation operator, predicate outcome) to the closed classification.

    Returns (classification, falseNegative, falsePositive).
    """
    if mutation_operator == "NO_MUTATION":
        if predicate_satisfied:
            return "TRUE_NEGATIVE", False, False
        return "FALSE_POSITIVE", False, True
    if predicate_satisfied:
        return "TRUE_POSITIVE", False, False
    return "FALSE_NEGATIVE", True, False


def build_ledger(oracle_path: Path, execution_base: str | None = None) -> dict:
    raw = oracle_path.read_bytes()
    oracle = json.loads(raw.decode("utf-8"))
    required = validate_oracle(oracle, raw)
    identities = {
        "oracleContainingCommit": ORACLE_COMMIT,
        "oracleContainingCommitBlobSha256": _sha_bytes(_git_blob(ORACLE_COMMIT, ORACLE_PATH)),
        "oracleContainingCommitMatch": _sha_bytes(_git_blob(ORACLE_COMMIT, ORACLE_PATH)) == ORACLE_SHA256,
        "oracleFileSha256": _sha_bytes(raw),
        "oracleAllFieldJcsSha256": _sha_bytes(_jcs_bytes(oracle)),
        "requiredSetJcsSha256": _sha_bytes(_jcs_bytes(required)),
        "p2Owners": [
            {"path": path, "sha256": _sha_file(REPO_ROOT / path),
             "expectedSha256": expected, "match": _sha_file(REPO_ROOT / path) == expected}
            for path, expected in OWNER_HASHES.items()
        ],
        "governanceDesigns": [
            {"path": path, "sha256": _sha_file(REPO_ROOT / path),
             "expectedSha256": expected, "match": _sha_file(REPO_ROOT / path) == expected}
            for path, expected in DESIGN_HASHES.items()
        ],
    }
    if not identities["oracleContainingCommitMatch"]:
        raise ValueError("oracle containing-commit identity drift")
    if not all(item["match"] for item in identities["p2Owners"] + identities["governanceDesigns"]):
        raise ValueError("P2 owner or design identity drift")

    # Actual source-binding execution: must fully pass before any case is
    # replayed through a P2 seam (R1B-RV-1 repair).
    source_binding_summary = execute_source_binding(oracle)

    control = _canonical_receipt()
    control_valid, _ = _validate_receipt_integrity(control)
    if not control_valid:
        raise ValueError("canonical P2 control receipt rejected")
    control_digest = _receipt_digest(control)
    assert_evaluator_conformance(evaluate_predicate)
    results = []
    for case in oracle["cases"]:
        if case["caseId"] in NON_REPRESENTABLE:
            results.append({
                "caseId": case["caseId"], "family": case["family"],
                "oracleCaseId": case["caseId"],
                "oracleIdentity": ORACLE_SHA256,
                "sourceBindingStatus": "PASS",
                "zeroToleranceClass": case["zeroToleranceClass"],
                "mutationOperator": case["mutation"]["operator"],
                "executionDisposition": "NOT_REPRESENTABLE_BY_CURRENT_P2",
                "predicate": case["requiredSafetyPredicate"],
                "predicateSatisfied": False,
                "baseReceiptDigest": None,
                "mutatedReceiptDigest": None,
                "classification": "NOT_REPRESENTABLE_BY_CURRENT_P2",
                "falseNegative": None,
                "falsePositive": None,
                "limitation": "no honest current-P2 observation route exists",
            })
            continue
        receipt = copy.deepcopy(control)
        base_digest = _receipt_digest(receipt)
        changed = apply_mutation(receipt, case)
        mutated_digest = _receipt_digest(receipt)
        mutation_operator = case["mutation"]["operator"]
        if mutation_operator == "NO_MUTATION":
            if mutated_digest != base_digest:
                raise ValueError(f"{case['caseId']}: NO_MUTATION control digest drift")
        else:
            if mutated_digest == base_digest:
                raise ValueError(f"{case['caseId']}: representable mutation left receipt digest unchanged")
        observation = observe_receipt(receipt)
        if not observation["validatorReadoutSamePayloadObject"]:
            raise ValueError(
                f"{case['caseId']}: validator/readout payload identity diverged"
            )
        predicate_satisfied = evaluate_predicate(case, observation)
        classification, false_negative, false_positive = classify_case(
            mutation_operator=mutation_operator,
            predicate_satisfied=predicate_satisfied,
        )
        results.append({
            "caseId": case["caseId"], "family": case["family"],
            "oracleCaseId": case["caseId"],
            "oracleIdentity": ORACLE_SHA256,
            "sourceBindingStatus": "PASS",
            "zeroToleranceClass": case["zeroToleranceClass"],
            "mutationOperator": mutation_operator,
            "serializedBytesChanged": changed,
            "executionDisposition": "ACTUAL_P2_SEAM_OBSERVED",
            "validatorReadoutSamePayloadObject": observation["validatorReadoutSamePayloadObject"],
            "validatorAccepted": observation["validatorAccepted"],
            "validatorReason": observation["validatorReason"],
            "readout": observation["readout"],
            "predicate": case["requiredSafetyPredicate"],
            "predicateSatisfied": predicate_satisfied,
            "baseReceiptDigest": base_digest,
            "mutatedReceiptDigest": mutated_digest,
            "classification": classification,
            "falseNegative": false_negative,
            "falsePositive": false_positive,
        })
    missing = sorted(set(required["requiredCaseIds"]) - {item["caseId"] for item in results})
    if missing or len(results) != 19:
        raise ValueError("execution coverage is incomplete")
    unknown_classification = [
        item["caseId"] for item in results
        if item["classification"] not in {
            "TRUE_NEGATIVE", "FALSE_POSITIVE", "TRUE_POSITIVE", "FALSE_NEGATIVE",
            "NOT_REPRESENTABLE_BY_CURRENT_P2",
        }
    ]
    if unknown_classification:
        raise ValueError(f"unknown or inconsistent classification for: {unknown_classification}")
    inconsistent = []
    for item in results:
        cls = item["classification"]
        if cls == "NOT_REPRESENTABLE_BY_CURRENT_P2":
            if item["falseNegative"] is not None or item["falsePositive"] is not None:
                inconsistent.append(item["caseId"])
            continue
        if cls == "FALSE_NEGATIVE" and item["falseNegative"] is not True:
            inconsistent.append(item["caseId"])
        if cls == "FALSE_POSITIVE" and item["falsePositive"] is not True:
            inconsistent.append(item["caseId"])
        if cls in {"TRUE_NEGATIVE", "TRUE_POSITIVE"} and (
            item["falseNegative"] is not False or item["falsePositive"] is not False
        ):
            inconsistent.append(item["caseId"])
    if inconsistent:
        raise ValueError(f"classification/boolean inconsistency for: {sorted(set(inconsistent))}")

    predicate_misses = [item["caseId"] for item in results if not item["predicateSatisfied"]]
    candidate = (
        "REPLAY_EVIDENCE_COMPLETE_PASS_CANDIDATE"
        if not predicate_misses else "REPLAY_EVIDENCE_COMPLETE_RETURN_TO_DESIGN_CANDIDATE"
    )
    representable_results = [item for item in results if item["caseId"] not in NON_REPRESENTABLE]
    classification_counts: dict[str, int] = {}
    for item in results:
        classification_counts[item["classification"]] = classification_counts.get(item["classification"], 0) + 1
    per_class_totals: dict[str, dict[str, int]] = {}
    for item in results:
        zero_class = item["zeroToleranceClass"]
        bucket = per_class_totals.setdefault(zero_class, {"numerator": 0, "denominator": 0})
        if item["classification"] == "NOT_REPRESENTABLE_BY_CURRENT_P2":
            continue
        bucket["denominator"] += 1
        if item["predicateSatisfied"]:
            bucket["numerator"] += 1
    ledger = {
        "schema": RESULT_SCHEMA,
        "executionBaseHead": execution_base or _git_head(),
        "sourceIdentities": identities,
        "sourceBinding": {
            "byteRecipe": BYTE_RECIPE,
            "sourceCount": source_binding_summary["sourceCount"],
            "caseBindingCount": source_binding_summary["caseBindingCount"],
            "checkedCaseIds": source_binding_summary["checkedCaseIds"],
            "executedBeforeAnySeamCall": True,
        },
        "coverage": {
            "requiredCaseCount": 19, "observedCaseCount": len(results),
            "requiredFamilyCount": 18, "observedFamilyCount": len({x["family"] for x in results}),
            "requiredZeroToleranceClassCount": 7,
            "observedZeroToleranceClassCount": len({
                x["zeroToleranceClass"] for x in results if x["zeroToleranceClass"] != "NONE"
            }),
            "missingCaseIds": [], "extraCaseIds": [],
            "nonRepresentableCaseIds": sorted(NON_REPRESENTABLE),
            "actualP2ObservationCount": sum(
                x["executionDisposition"] == "ACTUAL_P2_SEAM_OBSERVED" for x in results
            ),
        },
        "cases": results,
        "classificationReconciliation": {
            "counts": classification_counts,
            "representableCaseCount": len(representable_results),
            "excludedUnrepresentableCaseIds": sorted(NON_REPRESENTABLE),
            "perZeroToleranceClassTotals": per_class_totals,
            "falseNegativeCaseIds": sorted(
                item["caseId"] for item in results if item["falseNegative"] is True
            ),
            "falsePositiveCaseIds": sorted(
                item["caseId"] for item in results if item["falsePositive"] is True
            ),
        },
        "limitations": [
            "C07, C08 and C18 are not representable by current P2 and are not counted as detected or satisfied.",
            "C15 deliberately records that the fixed non-secret sentinel is emitted by the current readout.",
            "Receipt-local consistency is not correctness, phase-return identity, authorization, or closure.",
        ],
        "predicateMissCaseIds": predicate_misses,
        "executionCompleteness": "COMPLETE",
        "safetyCandidate": (
            "PASS_CANDIDATE" if not predicate_misses else "RETURN_TO_DESIGN_CANDIDATE"
        ),
        "workerTerminalCandidate": candidate,
        "reviewerDisposition": "REVIEWER_OWNED_NOT_SET",
        "claimBoundary": "Local deterministic actual-P2 replay evidence only; reviewer retains evaluation, acceptance and closure.",
    }
    if any(value in FORBIDDEN_REVIEWER_OUTCOMES for value in _walk_strings(ledger)):
        raise ValueError("runner attempted to emit a reviewer-owned outcome")
    return ledger


def _walk_strings(value: object):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _walk_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _walk_strings(item)


def ledger_bytes(ledger: dict) -> bytes:
    return (json.dumps(ledger, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--oracle", default=str(ORACLE_PATH))
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--execution-base",
        default=None,
        help="Frozen execution base to bind into deterministic output (defaults to HEAD).",
    )
    args = parser.parse_args()
    oracle_path = Path(args.oracle)
    if not oracle_path.is_absolute():
        oracle_path = REPO_ROOT / oracle_path
    output = Path(args.output)
    if not output.is_absolute():
        output = REPO_ROOT / output
    ledger = build_ledger(oracle_path, execution_base=args.execution_base)
    output.write_bytes(ledger_bytes(ledger))
    print(json.dumps({
        "schema": ledger["schema"],
        "caseCount": ledger["coverage"]["observedCaseCount"],
        "actualP2ObservationCount": ledger["coverage"]["actualP2ObservationCount"],
        "sourceBindingCaseCount": ledger["sourceBinding"]["caseBindingCount"],
        "predicateMissCaseIds": ledger["predicateMissCaseIds"],
        "workerTerminalCandidate": ledger["workerTerminalCandidate"],
        "outputSha256": _sha_file(output),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
