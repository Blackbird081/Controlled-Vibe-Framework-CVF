from __future__ import annotations

import json

import governance.compat.check_task_governance_route as check


def test_extracts_embedded_manifest_and_routes_shadow():
    payload = {
        "schemaVersion": "cvf.taskGovernanceManifest.v1", "taskId": "next-tranche",
        "requestedProfile": "P2_BOUNDED",
        "classification": {"taskKind": "EXTERNAL_ABSORPTION", "authorityImpact": "ENRICHES_EXISTING_OWNER", "externalEffect": "NONE", "dataSensitivity": "PRIVATE_REPO", "reversibility": "GIT_REVERSIBLE", "sourceScale": "BOUNDED_CLUSTER", "delegation": "MULTI_ROLE_NO_COMMIT", "novelty": "OWNER_COMPOSITION"},
        "pathFamilies": ["EXTENSIONS/example/src/"], "claims": ["bounded adaptation"],
        "requiredProof": ["focused tests"], "operatorCheckpoints": [],
        "forbiddenEffects": ["runtime", "network"],
        "sourceEvidence": {"selectedFilesFullyRead": True, "corpusReceiptRef": "ledger:205", "completenessClaimChanged": False},
    }
    text = f"# Work order\n\nStatus: DISPATCH_READY\n\n{check.MANIFEST_HEADING}\n\n```json\n{json.dumps(payload)}\n```\n"
    parsed = check._manifest_from_markdown(text)
    assert parsed == payload


def test_missing_manifest_block_is_rejected():
    try:
        check._manifest_from_markdown("Status: DISPATCH_READY")
    except ValueError as exc:
        assert "missing exact" in str(exc)
    else:
        raise AssertionError("missing manifest must reject")


def test_changed_path_reconciliation_excludes_only_the_manifest_carrier():
    changed = ["docs/work_orders/task.md", "src/a.py", "tests/a_test.py"]
    assert check._uncovered_paths(changed, "docs/work_orders/task.md", ["src/", "tests/"]) == []
    assert check._uncovered_paths(changed, "docs/work_orders/task.md", ["src/"]) == ["tests/a_test.py"]


# --- TPGR-TV2 authority-sourced cap resolution coverage ---

REAL_ROADMAP_PATH = "docs/roadmaps/CVF_TPGR_TRANCHE_VALUE_ADMISSION_GOVERNANCE_ROADMAP_2026-08-26.md"
REAL_ROADMAP_HASH = "6c388376011537bffffe81cd61165100a0055c182177c2ad15bd4854a7110f9a"
REAL_ROADMAP_COMMIT = "8bd43f98a72978e72302d6897a2275d2e788f33f"


def test_resolve_trusted_authority_reads_committed_roadmap_block():
    authority = check.resolve_trusted_authority(REAL_ROADMAP_PATH, REAL_ROADMAP_HASH, REAL_ROADMAP_COMMIT)
    assert authority is not None
    assert authority["authorityPath"] == REAL_ROADMAP_PATH
    assert authority["authorityHash"] == REAL_ROADMAP_HASH
    assert authority["authorityCommit"] == REAL_ROADMAP_COMMIT
    assert authority["declaredCap"] == 3
    assert authority["currentOrdinal"] == 2


def test_resolve_trusted_authority_rejects_hash_mismatch():
    assert check.resolve_trusted_authority(REAL_ROADMAP_PATH, "0" * 64, REAL_ROADMAP_COMMIT) is None


def test_resolve_trusted_authority_rejects_missing_file():
    assert check.resolve_trusted_authority("docs/roadmaps/CVF_DOES_NOT_EXIST.md", REAL_ROADMAP_HASH, REAL_ROADMAP_COMMIT) is None


def test_resolve_trusted_authority_rejects_non_ancestor_path_family():
    for unsafe_path in ("../escape.md", "docs/work_orders/not_a_roadmap.md", "governance/compat/route_task_governance.py"):
        assert check.resolve_trusted_authority(unsafe_path, REAL_ROADMAP_HASH, REAL_ROADMAP_COMMIT) is None


def test_resolve_trusted_authority_rejects_empty_or_none_input():
    assert check.resolve_trusted_authority("", REAL_ROADMAP_HASH, REAL_ROADMAP_COMMIT) is None
    assert check.resolve_trusted_authority(REAL_ROADMAP_PATH, "", REAL_ROADMAP_COMMIT) is None
    assert check.resolve_trusted_authority(REAL_ROADMAP_PATH, REAL_ROADMAP_HASH, "") is None
    assert check.resolve_trusted_authority(REAL_ROADMAP_PATH, REAL_ROADMAP_HASH, "f" * 40) is None


def test_checker_composes_resolved_authority_into_route_manifest():
    import json as _json

    payload = {
        "schemaVersion": "cvf.taskGovernanceManifest.v1", "taskId": "tv2-checker-smoke",
        "requestedProfile": "P3_ELEVATED",
        "classification": {
            "taskKind": "PURE_LOCAL_IMPLEMENTATION", "authorityImpact": "USES_EXISTING_OWNER",
            "externalEffect": "NONE", "dataSensitivity": "PRIVATE_REPO",
            "reversibility": "GIT_REVERSIBLE", "sourceScale": "NONE",
            "delegation": "MULTI_ROLE_NO_COMMIT", "novelty": "KNOWN_PATTERN",
        },
        "pathFamilies": ["governance/compat/"], "claims": ["smoke"],
        "requiredProof": ["focused tests"], "operatorCheckpoints": [],
        "forbiddenEffects": ["network"],
        "sourceEvidence": {"selectedFilesFullyRead": True, "corpusReceiptRef": None, "completenessClaimChanged": False},
        "trancheValue": {
            "outcomeConsumer": "reviewer smoke", "severity": "P2",
            "findingEvidenceState": "OBSERVED",
            "rootCauseIdentity": {"relation": "INDEPENDENT", "causalInvariant": "x", "ownerSurface": "TPGR", "evidenceReferences": ["a"]},
            "marginalValue": "smoke-tests the checker authority composition seam",
            "valueEvidenceState": "HISTORICAL_BOUNDED",
            "costEnvelope": {name: {"evidenceState": "UNKNOWN", "value": "UNKNOWN"} for name in ("workerTime", "reviewerTime", "latency", "tokenOrQuotaUsage", "providerCallCost", "opportunityCost")},
            "consolidationKey": "K", "stopCondition": "stop after smoke",
            "successorAuthority": {"authorityPath": REAL_ROADMAP_PATH, "authorityHash": REAL_ROADMAP_HASH, "authorityCommit": REAL_ROADMAP_COMMIT, "declaredCap": 3, "currentOrdinal": 2},
            "decisionReason": "smoke", "reviewerIdentity": "smoke reviewer",
            "freshness": {"capturedAt": "2026-08-26T00:00:00Z", "expiresAt": None, "noExpiryReason": "immutable"},
            "overrideAppealEvidence": None,
        },
    }
    text = f"# Work order\n\nStatus: DISPATCH_READY\n\n{check.MANIFEST_HEADING}\n\n```json\n{_json.dumps(payload)}\n```\n"
    manifest = check._manifest_from_markdown(text)
    trusted_authority = None
    if isinstance(manifest.get("trancheValue"), dict):
        candidate_authority = manifest["trancheValue"].get("successorAuthority")
        if isinstance(candidate_authority, dict):
            trusted_authority = check.resolve_trusted_authority(
                candidate_authority.get("authorityPath", ""),
                candidate_authority.get("authorityHash", ""),
                candidate_authority.get("authorityCommit", ""),
            )
    receipt = check.route_manifest(manifest, check.load_registry(), trusted_authority)
    assert receipt["receiptStatus"] == "ROUTED_SHADOW"
    assert receipt["valueDisposition"] == "CONTINUE_HIGH_VALUE"
    assert receipt["valueDispositionAuthoritative"] is False
