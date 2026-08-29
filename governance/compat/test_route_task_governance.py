from __future__ import annotations

import copy

from governance.compat.route_task_governance import evaluate_tranche_value, load_registry, route_manifest

TEST_AUTHORITY = {
    "authorityPath": "docs/roadmaps/CVF_TPGR_TRANCHE_VALUE_ADMISSION_GOVERNANCE_ROADMAP_2026-08-26.md",
    "authorityHash": "6c388376011537bffffe81cd61165100a0055c182177c2ad15bd4854a7110f9a",
    "authorityCommit": "8bd43f98a72978e72302d6897a2275d2e788f33f",
    "declaredCap": 3,
    "currentOrdinal": 2,
}


def tranche_value_record(**overrides):
    record = {
        "outcomeConsumer": "CVF dispatchers and reviewers",
        "severity": "P2",
        "findingEvidenceState": "OBSERVED",
        "rootCauseIdentity": {
            "relation": "INDEPENDENT",
            "causalInvariant": "missing pre-dispatch value owner",
            "ownerSurface": "TPGR",
            "evidenceReferences": ["docs/reviews/example.md"],
        },
        "marginalValue": "reduces repeated hand-authored value prose",
        "valueEvidenceState": "HISTORICAL_BOUNDED",
        "costEnvelope": {
            name: {"evidenceState": "UNKNOWN", "value": "UNKNOWN"}
            for name in ("workerTime", "reviewerTime", "latency", "tokenOrQuotaUsage", "providerCallCost", "opportunityCost")
        },
        "consolidationKey": "TPGR_TRANCHE_VALUE_ADMISSION_OWNER",
        "stopCondition": "stop after exact TV2 implementation unless pilot value releases TV3",
        "successorAuthority": {
            "authorityPath": TEST_AUTHORITY["authorityPath"],
            "authorityHash": TEST_AUTHORITY["authorityHash"],
            "authorityCommit": TEST_AUTHORITY["authorityCommit"],
            "declaredCap": 3,
            "currentOrdinal": 2,
        },
        "decisionReason": "existing owner, named consumer, independent root cause",
        "reviewerIdentity": "TV1 Independent Reviewer Addendum committed at 5084910ce",
        "freshness": {"capturedAt": "2026-08-26T00:00:00Z", "expiresAt": None, "noExpiryReason": "immutable dispatch authority"},
        "overrideAppealEvidence": None,
    }
    for key, value in overrides.items():
        record[key] = value
    return record


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


# --- TPGR-TV2 tranche-value admission shadow implementation coverage ---


def test_omitted_tranche_value_is_byte_equivalent_to_prior_receipt():
    value = manifest()
    with_key_absent = route_manifest(value)
    value_copy = copy.deepcopy(value)
    assert route_manifest(value_copy) == with_key_absent
    assert "valueDisposition" not in with_key_absent
    assert "valueDispositionAuthoritative" not in with_key_absent
    assert "valueDispositionReasonCodes" not in with_key_absent
    import hashlib
    import json

    canonical_bytes = json.dumps(with_key_absent, sort_keys=True, separators=(",", ":")).encode()
    assert hashlib.sha256(canonical_bytes).hexdigest() == "0cac1c52b5fca549d079165c5dd4cd44c2fa11623573958001e284170ba33ac2"


def test_declared_record_with_verified_authority_and_source_backed_value_continues():
    value = manifest()
    value["trancheValue"] = tranche_value_record()
    result = route_manifest(value, trusted_authority=TEST_AUTHORITY)
    assert result["receiptStatus"] == "ROUTED_SHADOW"
    assert result["valueDisposition"] == "CONTINUE_HIGH_VALUE"
    assert result["valueDispositionAuthoritative"] is False
    assert result["valueDispositionReasonCodes"]
    assert result["selectiveExecutionAuthorized"] is False
    assert result["legacyGateDisposition"] == "RUN_FULL_LEGACY_BUNDLE"


def test_source_backed_p0_with_independent_root_cause_and_observed_value_continues():
    record = tranche_value_record(severity="P0", findingEvidenceState="OBSERVED", valueEvidenceState="OBSERVED")
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] == "CONTINUE_HIGH_VALUE"


def test_serious_finding_with_unknown_economics_consolidates_not_parks_or_stops():
    record = tranche_value_record(severity="P1", findingEvidenceState="OBSERVED", valueEvidenceState="UNKNOWN")
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] == "CONSOLIDATE"


def test_serious_finding_without_observed_or_historical_proof_parks():
    record = tranche_value_record(severity="P1", findingEvidenceState="PROJECTED")
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "SERIOUS_SEVERITY_WITHOUT_OBSERVED_OR_HISTORICAL_FINDING_PROOF" in result["valueDispositionReasonCodes"]


def test_non_serious_projected_or_unknown_value_never_continues():
    for value_state in ("PROJECTED", "UNKNOWN"):
        record = tranche_value_record(severity="P2", valueEvidenceState=value_state)
        result = evaluate_tranche_value(record, TEST_AUTHORITY)
        assert result["valueDisposition"] == "PARK_LOW_VALUE"


def test_dependent_and_duplicate_root_cause_stop_regardless_of_evidence():
    for relation in ("DEPENDENT", "DUPLICATE"):
        record = tranche_value_record(
            rootCauseIdentity={
                "relation": relation,
                "causalInvariant": "same as prior",
                "ownerSurface": "TPGR",
                "evidenceReferences": ["docs/reviews/prior.md"],
            }
        )
        result = evaluate_tranche_value(record, TEST_AUTHORITY)
        assert result["valueDisposition"] == "STOP_NO_INCREMENTAL_VALUE"
        assert "DEPENDENT_OR_DUPLICATE_ROOT_CAUSE" in result["valueDispositionReasonCodes"]


def test_malformed_or_missing_declared_fields_park():
    incomplete = tranche_value_record()
    del incomplete["marginalValue"]
    result = evaluate_tranche_value(incomplete, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "MALFORMED_OR_MISSING_DECLARED_FIELDS" in result["valueDispositionReasonCodes"]

    unknown_enum = tranche_value_record(severity="P5_NOT_REAL")
    result = evaluate_tranche_value(unknown_enum, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "MALFORMED_OR_MISSING_DECLARED_FIELDS" in result["valueDispositionReasonCodes"]


def test_finding_and_value_evidence_are_independently_evaluated():
    strong_finding_weak_value = tranche_value_record(
        severity="P1", findingEvidenceState="OBSERVED", valueEvidenceState="UNKNOWN"
    )
    assert evaluate_tranche_value(strong_finding_weak_value, TEST_AUTHORITY)["valueDisposition"] == "CONSOLIDATE"

    weak_finding_strong_value = tranche_value_record(
        severity="P1", findingEvidenceState="PROJECTED", valueEvidenceState="OBSERVED"
    )
    result = evaluate_tranche_value(weak_finding_strong_value, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "SERIOUS_SEVERITY_WITHOUT_OBSERVED_OR_HISTORICAL_FINDING_PROOF" in result["valueDispositionReasonCodes"]


def test_all_six_cost_fields_evaluated_and_unknown_is_never_zero():
    record = tranche_value_record()
    for name in record["costEnvelope"]:
        assert record["costEnvelope"][name]["value"] == "UNKNOWN"
        assert record["costEnvelope"][name]["evidenceState"] == "UNKNOWN"
    bad = tranche_value_record()
    bad["costEnvelope"]["latency"] = {"evidenceState": "UNKNOWN", "value": "0"}
    assert evaluate_tranche_value(bad, TEST_AUTHORITY)["valueDisposition"] == "PARK_LOW_VALUE"
    assert "MALFORMED_OR_MISSING_DECLARED_FIELDS" in evaluate_tranche_value(bad, TEST_AUTHORITY)["valueDispositionReasonCodes"]


def test_authority_hash_mismatch_fails_closed():
    record = tranche_value_record()
    tampered_authority = dict(TEST_AUTHORITY, authorityHash="0" * 64)
    result = evaluate_tranche_value(record, tampered_authority)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "AUTHORITY_MISMATCH_FAILS_CLOSED" in result["valueDispositionReasonCodes"]


def test_authority_cap_or_ordinal_mismatch_fails_closed():
    record = tranche_value_record()
    for override in ({"declaredCap": 5}, {"currentOrdinal": 3}):
        tampered_authority = dict(TEST_AUTHORITY, **override)
        result = evaluate_tranche_value(record, tampered_authority)
        assert result["valueDisposition"] == "PARK_LOW_VALUE"
        assert "AUTHORITY_MISMATCH_FAILS_CLOSED" in result["valueDispositionReasonCodes"]


def test_authority_commit_mismatch_fails_closed():
    record = tranche_value_record()
    tampered_authority = dict(TEST_AUTHORITY, authorityCommit="f" * 40)
    result = evaluate_tranche_value(record, tampered_authority)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "AUTHORITY_MISMATCH_FAILS_CLOSED" in result["valueDispositionReasonCodes"]


def test_unverified_cli_path_is_shadow_only_and_never_continues():
    record = tranche_value_record(severity="P0", findingEvidenceState="OBSERVED", valueEvidenceState="OBSERVED")
    result = evaluate_tranche_value(record, None)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "UNVERIFIED_AUTHORITY_SHADOW_ONLY" in result["valueDispositionReasonCodes"]
    assert result["valueDispositionAuthoritative"] is False


def test_cap_exhaustion_stops_non_serious_and_consolidates_serious():
    exhausted_authority = dict(TEST_AUTHORITY, currentOrdinal=4, declaredCap=3)
    non_serious = tranche_value_record(severity="P2")
    non_serious["successorAuthority"]["currentOrdinal"] = 4
    result = evaluate_tranche_value(non_serious, exhausted_authority)
    assert result["valueDisposition"] == "STOP_NO_INCREMENTAL_VALUE"
    assert "CAP_EXHAUSTED_NO_TV4" in result["valueDispositionReasonCodes"]

    serious = tranche_value_record(severity="P0", findingEvidenceState="OBSERVED")
    serious["successorAuthority"]["currentOrdinal"] = 4
    result = evaluate_tranche_value(serious, exhausted_authority)
    assert result["valueDisposition"] == "CONSOLIDATE"
    assert "CAP_EXHAUSTED_SERIOUS_FINDING_REQUIRES_NEW_ROADMAP" in result["valueDispositionReasonCodes"]


def test_stale_freshness_parks():
    record = tranche_value_record(freshness={"capturedAt": "2020-01-01T00:00:00Z", "expiresAt": "2020-01-02T00:00:00Z"})
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert "STALE_OR_EXPIRED_FRESHNESS" in result["valueDispositionReasonCodes"]


def test_stale_serious_record_cannot_continue_or_consolidate():
    record = tranche_value_record(
        severity="P0",
        findingEvidenceState="OBSERVED",
        valueEvidenceState="OBSERVED",
        freshness={"capturedAt": "2020-01-01T00:00:00Z", "expiresAt": "2020-01-02T00:00:00Z"},
    )
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert result["valueDispositionReasonCodes"] == ["STALE_OR_EXPIRED_FRESHNESS"]


def test_no_expiry_with_reason_is_never_stale():
    record = tranche_value_record(freshness={"capturedAt": "2026-08-26T00:00:00Z", "expiresAt": None, "noExpiryReason": "immutable"})
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    assert result["valueDisposition"] != "PARK_LOW_VALUE" or "STALE_OR_EXPIRED_FRESHNESS" not in result["valueDispositionReasonCodes"]


def test_override_is_preserved_and_never_authoritative():
    record = tranche_value_record(
        overrideAppealEvidence={
            "operatorAuthorityReference": "docs/roadmaps/example.md",
            "reason": "operator continuation decision",
            "originalToken": "PARK_LOW_VALUE",
        },
        severity="P3",
        valueEvidenceState="PROJECTED",
    )
    result = evaluate_tranche_value(record, TEST_AUTHORITY)
    # The computed token still governs; override evidence does not itself flip the result.
    assert result["valueDisposition"] == "PARK_LOW_VALUE"
    assert result["valueDispositionAuthoritative"] is False


def test_rejected_manifest_preserves_full_p3_fallback_even_with_tranche_value():
    value = manifest()
    value["trancheValue"] = tranche_value_record()
    value["classification"]["taskKind"] = "TINY_SAFE_TRUST_ME"
    result = route_manifest(value, trusted_authority=TEST_AUTHORITY)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert result["profile"] == "P3_ELEVATED"
    assert result["selectedBundles"] == load_registry()["bundles"]
    assert result["selectiveExecutionAuthorized"] is False
    assert result["legacyGateDisposition"] == "RUN_FULL_LEGACY_BUNDLE"
    assert "valueDisposition" not in result


def test_malformed_tranche_value_rejects_whole_manifest():
    value = manifest()
    broken_record = tranche_value_record()
    del broken_record["severity"]
    value["trancheValue"] = broken_record
    result = route_manifest(value, trusted_authority=TEST_AUTHORITY)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert result["legacyGateDisposition"] == "RUN_FULL_LEGACY_BUNDLE"


def test_same_declared_record_produces_same_receipt_deterministically():
    value = manifest()
    value["trancheValue"] = tranche_value_record()
    first = route_manifest(copy.deepcopy(value), trusted_authority=TEST_AUTHORITY)
    second = route_manifest(copy.deepcopy(value), trusted_authority=TEST_AUTHORITY)
    assert first == second
