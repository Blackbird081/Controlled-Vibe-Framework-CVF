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
