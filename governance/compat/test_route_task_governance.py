from __future__ import annotations

import copy

from governance.compat.route_task_governance import load_registry, route_manifest


def manifest(**classification_overrides):
    classification = {
        "taskKind": "PURE_LOCAL_IMPLEMENTATION",
        "authorityImpact": "USES_EXISTING_OWNER",
        "externalEffect": "LOCAL_REVERSIBLE",
        "dataSensitivity": "PRIVATE_REPO",
        "reversibility": "GIT_REVERSIBLE",
        "sourceScale": "NONE",
        "delegation": "SINGLE_ROLE",
        "novelty": "KNOWN_PATTERN",
    }
    classification.update(classification_overrides)
    return {
        "schemaVersion": "cvf.taskGovernanceManifest.v1",
        "taskId": "tpgr-test",
        "requestedProfile": "P1_LIGHT",
        "classification": classification,
        "pathFamilies": ["EXTENSIONS/example/src/"],
        "claims": ["pure local behavior"],
        "requiredProof": ["focused tests"],
        "operatorCheckpoints": [],
        "forbiddenEffects": ["network", "public write"],
        "sourceEvidence": {"selectedFilesFullyRead": False, "corpusReceiptRef": None, "completenessClaimChanged": False},
    }


def test_same_manifest_produces_same_receipt():
    value = manifest()
    assert route_manifest(value) == route_manifest(copy.deepcopy(value))


def test_p1_pure_local_selects_only_relevant_bundles_and_explicit_skips():
    result = route_manifest(manifest())
    assert result["receiptStatus"] == "ROUTED_SHADOW"
    assert result["profile"] == "P1_LIGHT"
    assert result["selectedBundles"] == ["CORE_INTEGRITY", "CODE_QUALITY"]
    assert result["skippedBundles"]["CORPUS_ACCOUNTING"] == "NO_CORPUS_OR_COMPLETENESS_CHANGE"
    assert result["selectiveExecutionAuthorized"] is False
    assert result["legacyGateDisposition"] == "RUN_FULL_LEGACY_BUNDLE"


def test_delegated_absorption_escalates_to_p2_and_requires_full_selected_read():
    value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="BOUNDED_CLUSTER", delegation="MULTI_ROLE_NO_COMMIT")
    value["requestedProfile"] = "P2_BOUNDED"
    value["sourceEvidence"]["selectedFilesFullyRead"] = True
    result = route_manifest(value)
    assert result["profile"] == "P2_BOUNDED"
    assert {"SOURCE_PROVENANCE", "DELEGATION_HANDOFF"}.issubset(result["selectedBundles"])

    value["sourceEvidence"]["selectedFilesFullyRead"] = False
    rejected = route_manifest(value)
    assert rejected["receiptStatus"] == "REJECTED_ESCALATED"
    assert rejected["profile"] == "P3_ELEVATED"


def test_corpus_requires_receipt_and_selects_accounting():
    value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="CORPUS")
    value["requestedProfile"] = "P2_BOUNDED"
    assert route_manifest(value)["receiptStatus"] == "REJECTED_ESCALATED"
    value["sourceEvidence"]["corpusReceiptRef"] = "ledger:immutable-v1"
    result = route_manifest(value)
    assert "CORPUS_ACCOUNTING" in result["selectedBundles"]


def test_every_mandatory_dimension_trigger_meets_minimum_profile():
    cases = [
        ({"authorityImpact": "CREATES_OR_CHANGES_AUTHORITY"}, "P3_ELEVATED"),
        ({"externalEffect": "NETWORK_WRITE"}, "P3_ELEVATED"),
        ({"externalEffect": "PUBLIC_WRITE"}, "P4_CRITICAL"),
        ({"dataSensitivity": "SECRET_VALUE"}, "P4_CRITICAL"),
        ({"reversibility": "IRREVERSIBLE"}, "P4_CRITICAL"),
        ({"novelty": "NEW_INTERFACE"}, "P3_ELEVATED"),
        ({"taskKind": "LIVE_PROOF", "externalEffect": "NETWORK_READ"}, "P4_CRITICAL"),
    ]
    for overrides, expected in cases:
        value = manifest(**overrides)
        value["requestedProfile"] = expected
        result = route_manifest(value)
        assert result["profile"] == expected
        assert result["receiptStatus"] == "ROUTED_SHADOW"


def test_profile_self_downgrade_is_rejected():
    result = route_manifest(manifest(authorityImpact="CREATES_OR_CHANGES_AUTHORITY"))
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert "below computed minimum" in result["validationErrors"][0]


def test_governance_and_standard_paths_force_p3():
    for path in ("governance/compat/example.py", "docs/reference/example.md", "AGENTS.md"):
        value = manifest(taskKind="DOC_CHANGE")
        value["pathFamilies"] = [path]
        value["requestedProfile"] = "P3_ELEVATED"
        assert route_manifest(value)["computedMinimumProfile"] == "P3_ELEVATED"


def test_public_workflow_path_forces_p4():
    value = manifest(taskKind="PUBLIC_RELEASE", externalEffect="PUBLIC_WRITE")
    value["pathFamilies"] = [".github/workflows/release.yml"]
    value["requestedProfile"] = "P4_CRITICAL"
    result = route_manifest(value)
    assert result["profile"] == "P4_CRITICAL"
    assert "PUBLIC_RELEASE" in result["selectedBundles"]


def test_unknown_or_malformed_manifest_fails_closed_to_full_p3():
    value = manifest()
    value["classification"]["taskKind"] = "TINY_SAFE_TRUST_ME"
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert result["profile"] == "P3_ELEVATED"
    assert result["selectedBundles"] == load_registry()["bundles"]


def test_runtime_path_contradiction_fails_closed():
    value = manifest(taskKind="PURE_LOCAL_IMPLEMENTATION", externalEffect="NONE")
    value["pathFamilies"] = ["EXTENSIONS/example/src/runtime/"]
    value["requestedProfile"] = "P3_ELEVATED"
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert any("contradicts" in error for error in result["validationErrors"])


def test_closed_shapes_bounds_and_duplicates_are_rejected():
    value = manifest()
    value["extra"] = True
    assert route_manifest(value)["receiptStatus"] == "REJECTED_ESCALATED"
    value = manifest()
    value["pathFamilies"] = ["a", "a"]
    assert route_manifest(value)["receiptStatus"] == "REJECTED_ESCALATED"


def test_path_families_must_be_normalized_repo_relative():
    for path in ("../escape", "/absolute", "C:/absolute", "a\\b", "a//b"):
        value = manifest()
        value["pathFamilies"] = [path]
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED"
        assert any("normalized repo-relative" in error for error in result["validationErrors"])
