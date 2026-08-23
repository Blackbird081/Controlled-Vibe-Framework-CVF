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
CLASSIFICATION_KEYS = {
    "taskKind", "authorityImpact", "externalEffect", "dataSensitivity",
    "reversibility", "sourceScale", "delegation", "novelty",
}
SOURCE_EVIDENCE_KEYS = {"selectedFilesFullyRead", "corpusReceiptRef", "completenessClaimChanged"}


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
    if set(manifest) != REQUIRED_KEYS:
        errors.append("manifest keys do not match the v1 closed shape")
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


def route_manifest(manifest: Any, registry: dict[str, Any] | None = None) -> dict[str, Any]:
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
    return {
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
