from __future__ import annotations

import copy
import importlib.util
import subprocess
import sys
from pathlib import Path

from governance.compat.route_task_governance import evaluate_tranche_value, load_registry, route_manifest

REPO_ROOT = Path(__file__).resolve().parents[2]

# executionBaseHead captured by the TPGR-INITIAL-INTAKE-T1 worker before any
# edit in this tranche (git rev-parse HEAD at dispatch, clean worktree).
EXECUTION_BASE_HEAD = "9066340e776b57072123b425038bf13470371849"


def _load_route_manifest_at_ref(ref: str):
    """Load the real committed route_task_governance module at `ref` via git show.

    This proves backward-compatibility against the actual prior-implementation
    source, not against the current module compared with itself.
    """
    proc = subprocess.run(
        ["git", "show", f"{ref}:governance/compat/route_task_governance.py"],
        cwd=REPO_ROOT, capture_output=True, text=True, check=True,
    )
    spec = importlib.util.spec_from_loader(f"_tpgr_baseline_{ref}", loader=None)
    module = importlib.util.module_from_spec(spec)
    module.__file__ = str(REPO_ROOT / "governance" / "compat" / "route_task_governance.py")
    exec(compile(proc.stdout, f"<git:{ref}:route_task_governance.py>", "exec"), module.__dict__)
    sys.modules[spec.name] = module
    return module.route_manifest


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


# --- TPGR-INITIAL-INTAKE-T1 initial-acquisition-survey admission coverage ---


def initial_intake_admission(**overrides):
    record = {
        "stage": "INITIAL_ACQUISITION_SURVEY",
        "plannedReceiptPath": "docs/reviews/CVF_EXAMPLE_INITIAL_SURVEY_2026-09-11.md",
        "acceptanceDisposition": "NO_ABSORPTION_ACCEPTANCE",
        "nextStageAuthority": "SEPARATE_REVIEWED_WORK_ORDER",
        "unknownEvidencePolicy": "PRESERVE_UNKNOWN",
    }
    record.update(overrides)
    return record


def initial_intake_manifest(*, source_scale="BOUNDED_CLUSTER", path_families=None, **classification_overrides):
    classification = {
        "taskKind": "EXTERNAL_ABSORPTION",
        "authorityImpact": "USES_EXISTING_OWNER",
        "externalEffect": "NONE",
        "dataSensitivity": "PRIVATE_REPO",
        "reversibility": "GIT_REVERSIBLE",
        "sourceScale": source_scale,
        "delegation": "MULTI_ROLE_NO_COMMIT",
        "novelty": "OWNER_COMPOSITION",
    }
    classification.update(classification_overrides)
    value = manifest(**classification)
    value["requestedProfile"] = "P3_ELEVATED"
    value["pathFamilies"] = path_families or ["docs/reviews/"]
    value["initialIntakeAdmission"] = initial_intake_admission()
    return value


def test_old_selected_file_task_without_full_read_evidence_still_rejects():
    value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="BOUNDED_CLUSTER", delegation="MULTI_ROLE_NO_COMMIT")
    value["requestedProfile"] = "P3_ELEVATED"
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert "selected-file absorption requires full semantic read confirmation" in result["validationErrors"]


def test_old_corpus_task_without_receipt_still_rejects():
    value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="CORPUS")
    value["requestedProfile"] = "P3_ELEVATED"
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert "corpus routing requires a corpus receipt reference" in result["validationErrors"]


def test_old_valid_manifests_match_the_real_pre_implementation_baseline_receipt():
    """Compare current receipts against the actually-committed pre-change router.

    Loads governance/compat/route_task_governance.py as it existed at the
    worker's recorded executionBaseHead (9066340e7, before any edit in this
    tranche) and asserts the full receipt is identical for representative
    ordinary manifests that omit initialIntakeAdmission. This is a real
    before/after comparison, not the current module compared with itself.
    """
    baseline_route_manifest = _load_route_manifest_at_ref(EXECUTION_BASE_HEAD)

    representative_manifests = [
        manifest(),
        manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="BOUNDED_CLUSTER", delegation="MULTI_ROLE_NO_COMMIT"),
    ]
    delegated = representative_manifests[1]
    delegated["requestedProfile"] = "P2_BOUNDED"
    delegated["sourceEvidence"]["selectedFilesFullyRead"] = True

    corpus_value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="CORPUS")
    corpus_value["requestedProfile"] = "P2_BOUNDED"
    corpus_value["sourceEvidence"]["corpusReceiptRef"] = "ledger:immutable-v1"
    representative_manifests.append(corpus_value)

    governance_path_value = manifest(taskKind="DOC_CHANGE")
    governance_path_value["pathFamilies"] = ["governance/compat/example.py"]
    governance_path_value["requestedProfile"] = "P3_ELEVATED"
    representative_manifests.append(governance_path_value)

    for value in representative_manifests:
        expected = baseline_route_manifest(copy.deepcopy(value), load_registry())
        actual = route_manifest(copy.deepcopy(value))
        assert actual == expected, value
        assert "initialIntakeDisposition" not in actual
        assert "absorptionAcceptanceAuthorized" not in actual


def test_old_selected_and_corpus_rejections_match_the_real_pre_implementation_baseline_receipt():
    """Compare the two originally-reproduced rejections against the committed baseline."""
    baseline_route_manifest = _load_route_manifest_at_ref(EXECUTION_BASE_HEAD)

    selected_reject = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="BOUNDED_CLUSTER", delegation="MULTI_ROLE_NO_COMMIT")
    selected_reject["requestedProfile"] = "P3_ELEVATED"

    corpus_reject = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="CORPUS")
    corpus_reject["requestedProfile"] = "P3_ELEVATED"

    for value in (selected_reject, corpus_reject):
        expected = baseline_route_manifest(copy.deepcopy(value), load_registry())
        actual = route_manifest(copy.deepcopy(value))
        assert actual == expected, value
        assert expected["receiptStatus"] == "REJECTED_ESCALATED"


def test_explicit_initial_stage_routes_shadow_for_each_source_scale():
    for scale in ("NAMED_FILES", "BOUNDED_CLUSTER", "CORPUS"):
        value = initial_intake_manifest(source_scale=scale)
        result = route_manifest(value)
        assert result["receiptStatus"] == "ROUTED_SHADOW", (scale, result)
        assert result["profile"] == "P3_ELEVATED"
        assert result["initialIntakeDisposition"] == "INITIAL_EVIDENCE_COLLECTION_ONLY"
        assert result["absorptionAcceptanceAuthorized"] is False
        assert {"SOURCE_PROVENANCE", "CORPUS_ACCOUNTING"}.issubset(result["selectedBundles"])
        assert result["selectiveExecutionAuthorized"] is False
        assert result["legacyGateDisposition"] == "RUN_FULL_LEGACY_BUNDLE"
        second = route_manifest(copy.deepcopy(value))
        assert second == result


def test_initial_record_malformed_null_boolean_extra_missing_or_unknown_enum_rejects():
    for override in (
        None,
        True,
        {},
        initial_intake_admission(stage="WRONG_STAGE"),
        initial_intake_admission(acceptanceDisposition="ABSORPTION_ACCEPTED"),
        initial_intake_admission(nextStageAuthority="THIS_WORK_ORDER"),
        initial_intake_admission(unknownEvidencePolicy="DROP_UNKNOWN"),
        dict(initial_intake_admission(), extraField="x"),
        {k: v for k, v in initial_intake_admission().items() if k != "plannedReceiptPath"},
    ):
        value = initial_intake_manifest()
        value["initialIntakeAdmission"] = override
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", override
        assert result["profile"] == "P3_ELEVATED"
        assert result["selectedBundles"] == load_registry()["bundles"]


def test_unsafe_or_out_of_family_planned_output_rejects():
    for bad_path in (
        "../escape.md",
        "/absolute/docs/reviews/x.md",
        "C:/docs/reviews/x.md",
        "docs\\reviews\\x.md",
        "docs/reviews/",
        "docs/reviews/x.txt",
        "docs/audits/x",
        "docs/work_orders/x.md",
        "docs/x.md",
        "governance/compat/x.md",
        "x" * 300 + ".md",
    ):
        value = initial_intake_manifest()
        value["initialIntakeAdmission"] = initial_intake_admission(plannedReceiptPath=bad_path)
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", bad_path


def test_product_code_or_broad_root_path_family_rejects_even_with_valid_initial_classification():
    for bad_family in (
        "docs/",
        ".private_reference/",
        "governance/compat/route_task_governance.py",
        "EXTENSIONS/example/src/",
        ".github/workflows/release.yml",
        "scripts/example.py",
    ):
        value = initial_intake_manifest(path_families=[bad_family])
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", bad_family


def test_declared_continuity_paths_are_permitted_initial_stage_families():
    for continuity_path in ("CVF_SESSION_MEMORY.md", "AGENT_HANDOFF_V60_2026-09-08.md", "CVF_SESSION/ACTIVE_SESSION_STATE.json"):
        value = initial_intake_manifest(path_families=[continuity_path, "docs/reviews/"])
        result = route_manifest(value)
        assert result["receiptStatus"] == "ROUTED_SHADOW", continuity_path


def test_future_planned_output_absent_from_disk_is_allowed():
    import os

    value = initial_intake_manifest()
    planned = value["initialIntakeAdmission"]["plannedReceiptPath"]
    assert not os.path.exists(planned)
    result = route_manifest(value)
    assert result["receiptStatus"] == "ROUTED_SHADOW"


def test_full_read_or_completeness_true_with_initial_stage_rejects():
    full_read = initial_intake_manifest()
    full_read["sourceEvidence"]["selectedFilesFullyRead"] = True
    assert route_manifest(full_read)["receiptStatus"] == "REJECTED_ESCALATED"

    completeness = initial_intake_manifest(source_scale="CORPUS")
    completeness["sourceEvidence"]["completenessClaimChanged"] = True
    assert route_manifest(completeness)["receiptStatus"] == "REJECTED_ESCALATED"


def test_blank_prior_receipt_value_rejects_in_initial_object_path():
    value = initial_intake_manifest(source_scale="CORPUS")
    value["sourceEvidence"]["corpusReceiptRef"] = ""
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"


def test_whitespace_only_prior_receipt_value_rejects_in_initial_object_path():
    for whitespace_value in ("   ", "\t", "\n", "  \t \n "):
        value = initial_intake_manifest(source_scale="CORPUS")
        value["sourceEvidence"]["corpusReceiptRef"] = whitespace_value
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", repr(whitespace_value)


def test_whitespace_only_receipt_is_unaffected_for_ordinary_manifests():
    value = manifest(taskKind="EXTERNAL_ABSORPTION", sourceScale="CORPUS")
    value["requestedProfile"] = "P3_ELEVATED"
    value["sourceEvidence"]["corpusReceiptRef"] = "   "
    result = route_manifest(value)
    assert result["receiptStatus"] == "ROUTED_SHADOW"


def test_planned_receipt_path_must_fall_within_a_declared_path_family():
    value = initial_intake_manifest(path_families=["docs/reviews/"])
    value["initialIntakeAdmission"] = initial_intake_admission(
        plannedReceiptPath="docs/audits/outside-owned-scope.json"
    )
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert any("must fall within a declared pathFamilies entry" in error for error in result["validationErrors"])


def test_planned_receipt_path_within_declared_family_is_accepted():
    value = initial_intake_manifest(path_families=["docs/reviews/"])
    value["initialIntakeAdmission"] = initial_intake_admission(
        plannedReceiptPath="docs/reviews/nested/CVF_INITIAL_SURVEY.md"
    )
    result = route_manifest(value)
    assert result["receiptStatus"] == "ROUTED_SHADOW"


def test_planned_receipt_path_matches_exact_file_path_family():
    exact_file = "docs/reviews/CVF_EXACT_FILE_SURVEY.md"
    value = initial_intake_manifest(path_families=[exact_file])
    value["initialIntakeAdmission"] = initial_intake_admission(plannedReceiptPath=exact_file)
    result = route_manifest(value)
    assert result["receiptStatus"] == "ROUTED_SHADOW"


def test_planned_receipt_path_rejects_sibling_prefix_collision_family():
    value = initial_intake_manifest(path_families=["docs/reviews-extra-family/"])
    value["initialIntakeAdmission"] = initial_intake_admission(
        plannedReceiptPath="docs/reviews/CVF_EXAMPLE_INITIAL_SURVEY_2026-09-11.md"
    )
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert any("must fall within a declared pathFamilies entry" in error for error in result["validationErrors"])


def test_planned_receipt_path_rejects_exact_file_prefix_collision():
    value = initial_intake_manifest(path_families=["docs/reviews/CVF_OTHER_FILE.md"])
    value["initialIntakeAdmission"] = initial_intake_admission(
        plannedReceiptPath="docs/reviews/CVF_OTHER_FILE.md.json"
    )
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"


def test_forbidden_task_shape_or_effect_rejects_initial_intake():
    for overrides in (
        {"taskKind": "RUNTIME_INTEGRATION"},
        {"taskKind": "LIVE_PROOF"},
        {"taskKind": "PUBLIC_RELEASE"},
        {"taskKind": "DESTRUCTIVE_OPERATION"},
        {"externalEffect": "PUBLIC_WRITE"},
        {"externalEffect": "DESTRUCTIVE"},
        {"dataSensitivity": "SECRET_VALUE"},
        {"dataSensitivity": "CREDENTIAL_REFERENCE"},
        {"authorityImpact": "CREATES_OR_CHANGES_AUTHORITY"},
        {"novelty": "NEW_INTERFACE"},
        {"novelty": "NEW_AUTHORITY"},
        {"delegation": "MULTI_ROLE_WITH_COMMIT"},
    ):
        value = initial_intake_manifest(**overrides)
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", overrides


def test_initial_record_combined_with_tranche_value_rejects():
    value = initial_intake_manifest()
    value["trancheValue"] = tranche_value_record()
    result = route_manifest(value, trusted_authority=TEST_AUTHORITY)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"


def test_initial_intake_p0_p1_p2_self_downgrade_rejects():
    for profile in ("P0_OBSERVE", "P1_LIGHT", "P2_BOUNDED"):
        value = initial_intake_manifest()
        value["requestedProfile"] = profile
        result = route_manifest(value)
        assert result["receiptStatus"] == "REJECTED_ESCALATED", profile


def test_malformed_ordinary_manifest_plus_valid_looking_initial_object_rejects_no_short_circuit():
    value = initial_intake_manifest()
    value["classification"]["taskKind"] = "TINY_SAFE_TRUST_ME"
    result = route_manifest(value)
    assert result["receiptStatus"] == "REJECTED_ESCALATED"
    assert result["selectedBundles"] == load_registry()["bundles"]


def test_initial_intake_schema_and_router_agree_on_field_types_and_enums():
    import json as _json
    from pathlib import Path as _Path

    schema = _json.loads(
        (_Path(__file__).with_name("CVF_TASK_GOVERNANCE_ROUTE_MANIFEST.schema.json")).read_text(encoding="utf-8")
    )
    record_schema = schema["properties"]["initialIntakeAdmission"]
    assert set(record_schema["required"]) == {
        "stage", "plannedReceiptPath", "acceptanceDisposition", "nextStageAuthority", "unknownEvidencePolicy",
    }
    assert record_schema["properties"]["stage"]["const"] == "INITIAL_ACQUISITION_SURVEY"
    assert record_schema["properties"]["acceptanceDisposition"]["const"] == "NO_ABSORPTION_ACCEPTANCE"
    assert record_schema["properties"]["nextStageAuthority"]["const"] == "SEPARATE_REVIEWED_WORK_ORDER"
    assert record_schema["properties"]["unknownEvidencePolicy"]["const"] == "PRESERVE_UNKNOWN"
    assert record_schema["additionalProperties"] is False

    value = initial_intake_manifest()
    result = route_manifest(value)
    assert result["receiptStatus"] == "ROUTED_SHADOW"
