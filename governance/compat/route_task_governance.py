#!/usr/bin/env python3
"""Deterministic TPGR-T0 task classifier and shadow routing receipt emitter."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = Path(__file__).with_name("CVF_TASK_GOVERNANCE_ROUTE_REGISTRY.json")
MANIFEST_VERSION = "cvf.taskGovernanceManifest.v1"
RECEIPT_VERSION = "cvf.taskGovernanceRoute.v1"
PROFILE_ORDER = ("P0_OBSERVE", "P1_LIGHT", "P2_BOUNDED", "P3_ELEVATED", "P4_CRITICAL")
SAFE_TASK_ID = re.compile(r"^[A-Za-z0-9._-]{1,128}$")
REQUIRED_KEYS = {
    "schemaVersion", "taskId", "requestedProfile", "classification", "pathFamilies",
    "claims", "requiredProof", "operatorCheckpoints", "forbiddenEffects", "sourceEvidence",
}
OPTIONAL_KEYS = {"trancheValue"}
CLASSIFICATION_KEYS = {
    "taskKind", "authorityImpact", "externalEffect", "dataSensitivity",
    "reversibility", "sourceScale", "delegation", "novelty",
}
SOURCE_EVIDENCE_KEYS = {"selectedFilesFullyRead", "corpusReceiptRef", "completenessClaimChanged"}

TRANCHE_VALUE_KEYS = {
    "outcomeConsumer", "severity", "findingEvidenceState", "rootCauseIdentity",
    "marginalValue", "valueEvidenceState", "costEnvelope", "consolidationKey",
    "stopCondition", "successorAuthority", "decisionReason", "reviewerIdentity",
    "freshness", "overrideAppealEvidence",
}
ROOT_CAUSE_IDENTITY_KEYS = {"relation", "causalInvariant", "ownerSurface", "evidenceReferences"}
COST_ENVELOPE_KEYS = {"workerTime", "reviewerTime", "latency", "tokenOrQuotaUsage", "providerCallCost", "opportunityCost"}
COST_FIELD_KEYS = {"evidenceState", "value"}
SUCCESSOR_AUTHORITY_KEYS = {"authorityPath", "authorityHash", "authorityCommit", "declaredCap", "currentOrdinal"}
FRESHNESS_KEYS = {"capturedAt", "expiresAt"}
OVERRIDE_KEYS = {"operatorAuthorityReference", "reason", "originalToken"}
EVIDENCE_STATES = {"OBSERVED", "HISTORICAL_BOUNDED", "PROJECTED", "UNKNOWN"}
SEVERITIES = {"P0", "P1", "P2", "P3", "NONE"}
ROOT_CAUSE_RELATIONS = {"INDEPENDENT", "DEPENDENT", "DUPLICATE"}
VALUE_TOKENS = ("CONTINUE_HIGH_VALUE", "CONSOLIDATE", "PARK_LOW_VALUE", "STOP_NO_INCREMENTAL_VALUE")
AUTHORITY_HASH_RE = re.compile(r"^[0-9a-f]{64}$")
AUTHORITY_COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")


def load_registry(path: Path = REGISTRY_PATH) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schemaVersion") != "cvf.taskGovernanceRouteRegistry.v1":
        raise ValueError("unsupported route registry schemaVersion")
    if tuple(payload.get("profiles", ())) != PROFILE_ORDER:
        raise ValueError("route registry profile order mismatch")
    return payload


def _profile_max(left: str, right: str) -> str:
    return PROFILE_ORDER[max(PROFILE_ORDER.index(left), PROFILE_ORDER.index(right))]


def _bounded_strings(value: Any, name: str, *, nonempty: bool) -> list[str]:
    if not isinstance(value, list) or (nonempty and not value) or len(value) > 64:
        raise ValueError(f"{name} must be a bounded{' non-empty' if nonempty else ''} array")
    if any(not isinstance(item, str) or not item or len(item) > 256 or any(ord(char) < 32 for char in item) for item in value):
        raise ValueError(f"{name} contains an unsafe string")
    if len(set(value)) != len(value):
        raise ValueError(f"{name} must contain unique values")
    return value


def _safe_repo_path_family(value: str) -> bool:
    if "\\" in value or value.startswith("/") or "//" in value or re.match(r"^[A-Za-z]:", value):
        return False
    parts = value.rstrip("/").split("/")
    return bool(parts) and all(part not in {"", ".", ".."} for part in parts)


def validate_manifest(manifest: Any, registry: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if not isinstance(manifest, dict):
        return ["manifest must be an object"]
    present_keys = set(manifest)
    if not REQUIRED_KEYS.issubset(present_keys) or not present_keys.issubset(REQUIRED_KEYS | OPTIONAL_KEYS):
        errors.append("manifest keys do not match the v1 closed shape plus optional trancheValue")
    if "trancheValue" in manifest:
        errors.extend(_validate_tranche_value(manifest["trancheValue"]))
    if manifest.get("schemaVersion") != MANIFEST_VERSION:
        errors.append("unsupported manifest schemaVersion")
    task_id = manifest.get("taskId")
    if not isinstance(task_id, str) or not SAFE_TASK_ID.fullmatch(task_id):
        errors.append("taskId must be a bounded safe identifier")
    if manifest.get("requestedProfile") not in PROFILE_ORDER:
        errors.append("requestedProfile is invalid")
    classification = manifest.get("classification")
    if not isinstance(classification, dict) or set(classification) != CLASSIFICATION_KEYS:
        errors.append("classification keys do not match the v1 closed shape")
    else:
        for key, allowed in registry["dimensions"].items():
            if classification.get(key) not in allowed:
                errors.append(f"classification.{key} is invalid")
    for key, nonempty in (("pathFamilies", True), ("claims", False), ("requiredProof", True), ("operatorCheckpoints", False), ("forbiddenEffects", True)):
        try:
            _bounded_strings(manifest.get(key), key, nonempty=nonempty)
        except ValueError as exc:
            errors.append(str(exc))
    if isinstance(manifest.get("pathFamilies"), list) and any(
        isinstance(path, str) and not _safe_repo_path_family(path) for path in manifest["pathFamilies"]
    ):
        errors.append("pathFamilies must contain normalized repo-relative paths")
    source = manifest.get("sourceEvidence")
    if not isinstance(source, dict) or set(source) != SOURCE_EVIDENCE_KEYS:
        errors.append("sourceEvidence keys do not match the v1 closed shape")
    else:
        if not isinstance(source.get("selectedFilesFullyRead"), bool):
            errors.append("sourceEvidence.selectedFilesFullyRead must be boolean")
        if source.get("corpusReceiptRef") is not None and not isinstance(source.get("corpusReceiptRef"), str):
            errors.append("sourceEvidence.corpusReceiptRef must be string or null")
        if not isinstance(source.get("completenessClaimChanged"), bool):
            errors.append("sourceEvidence.completenessClaimChanged must be boolean")
    return sorted(set(errors))


def _validate_cost_field(value: Any, name: str) -> list[str]:
    if not isinstance(value, dict) or set(value) != COST_FIELD_KEYS:
        return [f"trancheValue.costEnvelope.{name} keys do not match the closed cost-field shape"]
    errors: list[str] = []
    if value.get("evidenceState") not in EVIDENCE_STATES:
        errors.append(f"trancheValue.costEnvelope.{name}.evidenceState is invalid")
    if not isinstance(value.get("value"), str) or not value.get("value"):
        errors.append(f"trancheValue.costEnvelope.{name}.value must be a non-empty string")
    elif value.get("evidenceState") == "UNKNOWN" and value.get("value") not in {"UNKNOWN"}:
        errors.append(f"trancheValue.costEnvelope.{name}.value must be the literal UNKNOWN when evidenceState is UNKNOWN")
    return errors


def _validate_tranche_value(record: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(record, dict) or set(record) != TRANCHE_VALUE_KEYS:
        return ["trancheValue keys do not match the closed fourteen-field shape"]
    if not isinstance(record.get("outcomeConsumer"), str) or not record["outcomeConsumer"]:
        errors.append("trancheValue.outcomeConsumer must be a non-empty string")
    if record.get("severity") not in SEVERITIES:
        errors.append("trancheValue.severity is invalid")
    if record.get("findingEvidenceState") not in EVIDENCE_STATES:
        errors.append("trancheValue.findingEvidenceState is invalid")
    root_cause = record.get("rootCauseIdentity")
    if not isinstance(root_cause, dict) or set(root_cause) != ROOT_CAUSE_IDENTITY_KEYS:
        errors.append("trancheValue.rootCauseIdentity keys do not match the closed shape")
    else:
        if root_cause.get("relation") not in ROOT_CAUSE_RELATIONS:
            errors.append("trancheValue.rootCauseIdentity.relation is invalid")
        if not isinstance(root_cause.get("causalInvariant"), str) or not root_cause["causalInvariant"]:
            errors.append("trancheValue.rootCauseIdentity.causalInvariant must be a non-empty string")
        if not isinstance(root_cause.get("ownerSurface"), str) or not root_cause["ownerSurface"]:
            errors.append("trancheValue.rootCauseIdentity.ownerSurface must be a non-empty string")
        refs = root_cause.get("evidenceReferences")
        if not isinstance(refs, list) or not refs or any(not isinstance(r, str) or not r for r in refs):
            errors.append("trancheValue.rootCauseIdentity.evidenceReferences must be a non-empty list of non-empty strings")
    if not isinstance(record.get("marginalValue"), str) or not record["marginalValue"]:
        errors.append("trancheValue.marginalValue must be a non-empty string")
    if record.get("valueEvidenceState") not in EVIDENCE_STATES:
        errors.append("trancheValue.valueEvidenceState is invalid")
    cost_envelope = record.get("costEnvelope")
    if not isinstance(cost_envelope, dict) or set(cost_envelope) != COST_ENVELOPE_KEYS:
        errors.append("trancheValue.costEnvelope keys do not match the closed six-field shape")
    else:
        for name in COST_ENVELOPE_KEYS:
            errors.extend(_validate_cost_field(cost_envelope.get(name), name))
    if not isinstance(record.get("consolidationKey"), str) or not record["consolidationKey"]:
        errors.append("trancheValue.consolidationKey must be a non-empty string")
    if not isinstance(record.get("stopCondition"), str) or not record["stopCondition"]:
        errors.append("trancheValue.stopCondition must be a non-empty string")
    authority = record.get("successorAuthority")
    if not isinstance(authority, dict) or set(authority) != SUCCESSOR_AUTHORITY_KEYS:
        errors.append("trancheValue.successorAuthority keys do not match the closed shape")
    else:
        if not isinstance(authority.get("authorityPath"), str) or not authority["authorityPath"]:
            errors.append("trancheValue.successorAuthority.authorityPath must be a non-empty string")
        if not isinstance(authority.get("authorityHash"), str) or not AUTHORITY_HASH_RE.fullmatch(authority["authorityHash"]):
            errors.append("trancheValue.successorAuthority.authorityHash must be a lowercase SHA-256 digest")
        if not isinstance(authority.get("authorityCommit"), str) or not AUTHORITY_COMMIT_RE.fullmatch(authority["authorityCommit"]):
            errors.append("trancheValue.successorAuthority.authorityCommit must be a full lowercase commit hash")
        if not isinstance(authority.get("declaredCap"), int) or isinstance(authority.get("declaredCap"), bool) or not (1 <= authority.get("declaredCap", 0) <= 32):
            errors.append("trancheValue.successorAuthority.declaredCap must be a bounded positive integer")
        if not isinstance(authority.get("currentOrdinal"), int) or isinstance(authority.get("currentOrdinal"), bool) or not (1 <= authority.get("currentOrdinal", 0) <= 32):
            errors.append("trancheValue.successorAuthority.currentOrdinal must be a bounded positive integer")
    if not isinstance(record.get("decisionReason"), str) or not record["decisionReason"]:
        errors.append("trancheValue.decisionReason must be a non-empty string")
    if not isinstance(record.get("reviewerIdentity"), str) or not record["reviewerIdentity"]:
        errors.append("trancheValue.reviewerIdentity must be a non-empty string")
    freshness = record.get("freshness")
    if not isinstance(freshness, dict) or not FRESHNESS_KEYS.issubset(set(freshness)) or not set(freshness).issubset(FRESHNESS_KEYS | {"noExpiryReason"}):
        errors.append("trancheValue.freshness keys do not match the closed shape")
    else:
        if not isinstance(freshness.get("capturedAt"), str) or not freshness["capturedAt"]:
            errors.append("trancheValue.freshness.capturedAt must be a non-empty string")
        expires_at = freshness.get("expiresAt")
        if expires_at is None:
            if not isinstance(freshness.get("noExpiryReason"), str) or not freshness.get("noExpiryReason"):
                errors.append("trancheValue.freshness with null expiresAt requires a non-empty noExpiryReason")
        elif not isinstance(expires_at, str) or not expires_at:
            errors.append("trancheValue.freshness.expiresAt must be a non-empty string or null")
    override = record.get("overrideAppealEvidence")
    if override is not None:
        if not isinstance(override, dict) or set(override) != OVERRIDE_KEYS:
            errors.append("trancheValue.overrideAppealEvidence keys do not match the closed shape")
        else:
            if not isinstance(override.get("operatorAuthorityReference"), str) or not override["operatorAuthorityReference"]:
                errors.append("trancheValue.overrideAppealEvidence.operatorAuthorityReference must be a non-empty string")
            if not isinstance(override.get("reason"), str) or not override["reason"]:
                errors.append("trancheValue.overrideAppealEvidence.reason must be a non-empty string")
            if override.get("originalToken") not in VALUE_TOKENS:
                errors.append("trancheValue.overrideAppealEvidence.originalToken is invalid")
    return errors


def evaluate_tranche_value(record: dict[str, Any], trusted_authority: dict[str, Any] | None = None) -> dict[str, Any]:
    """Pure deterministic tranche-value decision.

    `trusted_authority` must be resolved by the caller from a committed,
    hash-verified roadmap successor-authority block. A candidate record's own
    `successorAuthority` fields are never trusted on their own; absent or
    mismatched trusted authority fails closed to a shadow park explanation.
    """
    reason_codes: list[str] = []

    if not isinstance(record, dict) or set(record) != TRANCHE_VALUE_KEYS or _validate_tranche_value(record):
        return _tranche_value_result("PARK_LOW_VALUE", ["MALFORMED_OR_MISSING_DECLARED_FIELDS"])

    authority = record["successorAuthority"]
    if trusted_authority is None:
        return _tranche_value_result("PARK_LOW_VALUE", ["UNVERIFIED_AUTHORITY_SHADOW_ONLY"])
    if (
        authority.get("authorityPath") != trusted_authority.get("authorityPath")
        or authority.get("authorityHash") != trusted_authority.get("authorityHash")
        or authority.get("authorityCommit") != trusted_authority.get("authorityCommit")
        or authority.get("declaredCap") != trusted_authority.get("declaredCap")
        or authority.get("currentOrdinal") != trusted_authority.get("currentOrdinal")
    ):
        return _tranche_value_result("PARK_LOW_VALUE", ["AUTHORITY_MISMATCH_FAILS_CLOSED"])

    root_cause = record["rootCauseIdentity"]
    if _is_stale(record["freshness"]):
        return _tranche_value_result("PARK_LOW_VALUE", ["STALE_OR_EXPIRED_FRESHNESS"])

    if root_cause["relation"] in {"DEPENDENT", "DUPLICATE"}:
        return _tranche_value_result("STOP_NO_INCREMENTAL_VALUE", ["DEPENDENT_OR_DUPLICATE_ROOT_CAUSE"])

    cap_exhausted = trusted_authority.get("currentOrdinal", 0) > trusted_authority.get("declaredCap", 0)
    severity = record["severity"]
    finding_state = record["findingEvidenceState"]
    value_state = record["valueEvidenceState"]
    source_backed_finding = finding_state in {"OBSERVED", "HISTORICAL_BOUNDED"}
    source_backed_value = value_state in {"OBSERVED", "HISTORICAL_BOUNDED"}
    serious = severity in {"P0", "P1"}

    if cap_exhausted:
        if serious and source_backed_finding:
            reason_codes.append("CAP_EXHAUSTED_SERIOUS_FINDING_REQUIRES_NEW_ROADMAP")
            return _tranche_value_result("CONSOLIDATE", reason_codes)
        return _tranche_value_result("STOP_NO_INCREMENTAL_VALUE", ["CAP_EXHAUSTED_NO_TV4"])

    if serious and not source_backed_finding:
        return _tranche_value_result("PARK_LOW_VALUE", ["SERIOUS_SEVERITY_WITHOUT_OBSERVED_OR_HISTORICAL_FINDING_PROOF"])

    if serious:
        if root_cause["relation"] == "INDEPENDENT" and source_backed_value:
            return _tranche_value_result("CONTINUE_HIGH_VALUE", ["SOURCE_BACKED_P0_P1_INDEPENDENT_ROOT_CAUSE_OBSERVED_VALUE"])
        return _tranche_value_result("CONSOLIDATE", ["SOURCE_BACKED_P0_P1_BOUNDED_REPAIR_UNKNOWN_OR_PROJECTED_ECONOMICS"])

    if root_cause["relation"] == "INDEPENDENT" and source_backed_value:
        return _tranche_value_result("CONTINUE_HIGH_VALUE", ["NON_SERIOUS_INDEPENDENT_ROOT_CAUSE_OBSERVED_OR_HISTORICAL_VALUE"])

    return _tranche_value_result("PARK_LOW_VALUE", ["PROJECTED_OR_UNKNOWN_VALUE_NEVER_CONTINUES"])


def _is_stale(freshness: dict[str, Any]) -> bool:
    expires_at = freshness.get("expiresAt")
    if expires_at is None:
        return False
    try:
        import datetime as _dt

        expiry = _dt.datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        now = _dt.datetime.now(_dt.timezone.utc)
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=_dt.timezone.utc)
        return now >= expiry
    except (ValueError, AttributeError):
        return True


def _tranche_value_result(disposition: str, reason_codes: list[str]) -> dict[str, Any]:
    return {
        "valueDisposition": disposition,
        "valueDispositionAuthoritative": False,
        "valueDispositionReasonCodes": sorted(set(reason_codes)),
    }


def route_manifest(manifest: Any, registry: dict[str, Any] | None = None, trusted_authority: dict[str, Any] | None = None) -> dict[str, Any]:
    registry = registry or load_registry()
    errors = validate_manifest(manifest, registry)
    if errors:
        return _rejected_receipt(manifest, errors, registry)

    classification = manifest["classification"]
    minimum = "P0_OBSERVE"
    triggers: list[str] = []
    for dimension, mapping in registry["profileMinimums"].items():
        value = classification[dimension]
        if value in mapping:
            minimum = _profile_max(minimum, mapping[value])
            triggers.append(f"{dimension.upper()}_{value}")

    for rule in registry["protectedPathMinimums"]:
        if any(path == rule["prefix"] or path.startswith(rule["prefix"]) for path in manifest["pathFamilies"]):
            minimum = _profile_max(minimum, rule["profile"])
            triggers.append(rule["trigger"])

    contradiction_errors: list[str] = []
    risky_path = any(
        any(token in path.lower() for token in ("runtime/", "provider", "deploy", "workflow", "installer", "migration"))
        for path in manifest["pathFamilies"]
    )
    if risky_path and classification["externalEffect"] == "NONE" and classification["taskKind"] not in {"DOC_CHANGE", "EXTERNAL_ABSORPTION"}:
        contradiction_errors.append("declared NONE externalEffect contradicts a runtime/provider/deploy path family")
    if classification["taskKind"] == "EXTERNAL_ABSORPTION" and classification["sourceScale"] in {"NAMED_FILES", "BOUNDED_CLUSTER"} and not manifest["sourceEvidence"]["selectedFilesFullyRead"]:
        contradiction_errors.append("selected-file absorption requires full semantic read confirmation")
    if classification["sourceScale"] == "CORPUS" and not manifest["sourceEvidence"]["corpusReceiptRef"]:
        contradiction_errors.append("corpus routing requires a corpus receipt reference")
    if classification["sourceScale"] != "CORPUS" and manifest["sourceEvidence"]["completenessClaimChanged"]:
        contradiction_errors.append("completenessClaimChanged requires sourceScale CORPUS")

    if contradiction_errors:
        return _rejected_receipt(manifest, contradiction_errors, registry)

    requested = manifest["requestedProfile"]
    if PROFILE_ORDER.index(requested) < PROFILE_ORDER.index(minimum):
        return _rejected_receipt(manifest, [f"requestedProfile {requested} is below computed minimum {minimum}"], registry)
    profile = requested
    selected = {"CORE_INTEGRITY"}
    if any(path.startswith("docs/") for path in manifest["pathFamilies"]):
        selected.add("ARTIFACT_SHAPE")
    if classification["taskKind"] == "EXTERNAL_ABSORPTION" or classification["sourceScale"] != "NONE":
        selected.add("SOURCE_PROVENANCE")
    if classification["sourceScale"] == "CORPUS" or manifest["sourceEvidence"]["completenessClaimChanged"]:
        selected.add("CORPUS_ACCOUNTING")
    if classification["delegation"] != "SINGLE_ROLE":
        selected.add("DELEGATION_HANDOFF")
    if classification["taskKind"] in {"PURE_LOCAL_IMPLEMENTATION", "STATEFUL_LOCAL_IMPLEMENTATION", "RUNTIME_INTEGRATION"}:
        selected.add("CODE_QUALITY")
    if PROFILE_ORDER.index(profile) >= PROFILE_ORDER.index("P3_ELEVATED") and any(
        classification[key] in values for key, values in {
            "taskKind": {"STATEFUL_LOCAL_IMPLEMENTATION"},
            "dataSensitivity": {"CREDENTIAL_REFERENCE", "SECRET_VALUE", "REGULATED"},
            "reversibility": {"STATEFUL_REVERSIBLE", "PARTIALLY_REVERSIBLE", "IRREVERSIBLE"},
        }.items()
    ):
        selected.add("STATE_AND_SECURITY")
    if classification["taskKind"] in {"RUNTIME_INTEGRATION", "LIVE_PROOF"} or classification["externalEffect"] in {"NETWORK_READ", "NETWORK_WRITE"}:
        selected.add("RUNTIME_LIVE")
    if classification["taskKind"] in {"PUBLIC_RELEASE", "DESTRUCTIVE_OPERATION"} or classification["externalEffect"] in {"PUBLIC_WRITE", "DESTRUCTIVE"}:
        selected.add("PUBLIC_RELEASE")
    for rule in registry["domainPathBundles"]:
        if any(path == rule["prefix"] or path.startswith(rule["prefix"]) for path in manifest["pathFamilies"]):
            selected.add(rule["bundle"])

    selected_ordered = [bundle for bundle in registry["bundles"] if bundle in selected]
    skipped = {
        bundle: _skip_reason(bundle, classification)
        for bundle in registry["bundles"] if bundle not in selected
    }
    receipt = {
        "schemaVersion": RECEIPT_VERSION,
        "taskId": manifest["taskId"],
        "profile": profile,
        "computedMinimumProfile": minimum,
        "classification": classification,
        "escalationTriggers": sorted(set(triggers)),
        "selectedBundles": selected_ordered,
        "skippedBundles": skipped,
        "estimatedCommandCount": len(selected_ordered),
        "selectiveExecutionAuthorized": False,
        "legacyGateDisposition": "RUN_FULL_LEGACY_BUNDLE",
        "receiptStatus": "ROUTED_SHADOW",
        "validationErrors": [],
    }
    if "trancheValue" in manifest:
        receipt.update(evaluate_tranche_value(manifest["trancheValue"], trusted_authority))
    return receipt


def _skip_reason(bundle: str, classification: dict[str, str]) -> str:
    reasons = {
        "ARTIFACT_SHAPE": "NO_GOVERNED_ARTIFACT_PATH",
        "SOURCE_PROVENANCE": "NO_EXTERNAL_OR_SOURCE_INPUT",
        "CORPUS_ACCOUNTING": "NO_CORPUS_OR_COMPLETENESS_CHANGE",
        "DELEGATION_HANDOFF": "SINGLE_ROLE_NO_HANDOFF",
        "CODE_QUALITY": "NO_IMPLEMENTATION_SOURCE",
        "STATE_AND_SECURITY": "NO_STATE_AUTH_SECRET_DEPENDENCY_OR_MUTATION_TRIGGER",
        "RUNTIME_LIVE": "NO_RUNTIME_NETWORK_OR_LIVE_EFFECT",
        "PUBLIC_RELEASE": "NO_PUBLIC_RELEASE_OR_DESTRUCTIVE_EFFECT",
        "CONTINUITY": "NO_CURRENT_STATE_OR_HANDOFF_CHANGE",
    }
    return reasons.get(bundle, f"NOT_SELECTED_FOR_{classification['taskKind']}")


def _rejected_receipt(manifest: Any, errors: list[str], registry: dict[str, Any]) -> dict[str, Any]:
    task_id = manifest.get("taskId", "invalid") if isinstance(manifest, dict) else "invalid"
    return {
        "schemaVersion": RECEIPT_VERSION,
        "taskId": task_id if isinstance(task_id, str) and SAFE_TASK_ID.fullmatch(task_id) else "invalid",
        "profile": registry["legacyFallback"]["profile"],
        "computedMinimumProfile": "P3_ELEVATED",
        "classification": manifest.get("classification", {}) if isinstance(manifest, dict) else {},
        "escalationTriggers": ["INVALID_OR_CONTRADICTORY_MANIFEST"],
        "selectedBundles": list(registry["bundles"]),
        "skippedBundles": {},
        "estimatedCommandCount": len(registry["bundles"]),
        "selectiveExecutionAuthorized": False,
        "legacyGateDisposition": "RUN_FULL_LEGACY_BUNDLE",
        "receiptStatus": "REJECTED_ESCALATED",
        "validationErrors": sorted(set(errors)),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        receipt = route_manifest(manifest)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        receipt = _rejected_receipt({}, [str(exc)], load_registry())
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if receipt["receiptStatus"] == "ROUTED_SHADOW" else 1


if __name__ == "__main__":
    sys.exit(main())
