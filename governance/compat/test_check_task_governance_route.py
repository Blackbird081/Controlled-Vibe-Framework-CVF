from __future__ import annotations

import json
import subprocess

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


# --- TPGR-INITIAL-INTAKE-T1 active work-order checker integration coverage ---
#
# The tests below drive the real `check.evaluate(base, head)` entrypoint used
# by the active work-order checker at dispatch/CI time, not only the parser
# and router in isolation. They build a disposable local git repository,
# monkeypatch `check.REPO_ROOT` to point at it, and commit a real
# `docs/work_orders/*.md` file so `_changed_paths`, file-read, manifest
# extraction, `route_manifest`, and `_uncovered_paths` all execute through
# the actual git-diff-driven code path.


def _init_git_repo(path):
    subprocess.run(["git", "init", "-q"], cwd=path, check=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=path, check=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=path, check=True)


def _commit_all(path, message):
    subprocess.run(["git", "add", "-A"], cwd=path, check=True)
    subprocess.run(["git", "commit", "-q", "-m", message], cwd=path, check=True)
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=path, check=True, capture_output=True, text=True
    ).stdout.strip()


def _initial_intake_work_order_text(*, path_families, planned_receipt_path):
    payload = {
        "schemaVersion": "cvf.taskGovernanceManifest.v1", "taskId": "initial-intake-checker-smoke",
        "requestedProfile": "P3_ELEVATED",
        "classification": {
            "taskKind": "EXTERNAL_ABSORPTION", "authorityImpact": "USES_EXISTING_OWNER",
            "externalEffect": "NONE", "dataSensitivity": "PRIVATE_REPO",
            "reversibility": "GIT_REVERSIBLE", "sourceScale": "BOUNDED_CLUSTER",
            "delegation": "MULTI_ROLE_NO_COMMIT", "novelty": "OWNER_COMPOSITION",
        },
        "pathFamilies": path_families, "claims": ["initial survey"],
        "requiredProof": ["focused tests"], "operatorCheckpoints": [],
        "forbiddenEffects": ["network"],
        "sourceEvidence": {"selectedFilesFullyRead": False, "corpusReceiptRef": None, "completenessClaimChanged": False},
        "initialIntakeAdmission": {
            "stage": "INITIAL_ACQUISITION_SURVEY",
            "plannedReceiptPath": planned_receipt_path,
            "acceptanceDisposition": "NO_ABSORPTION_ACCEPTANCE",
            "nextStageAuthority": "SEPARATE_REVIEWED_WORK_ORDER",
            "unknownEvidencePolicy": "PRESERVE_UNKNOWN",
        },
    }
    return f"# Work order\n\nStatus: DISPATCH_READY\n\n{check.MANIFEST_HEADING}\n\n```json\n{json.dumps(payload)}\n```\n"


def test_evaluate_end_to_end_accepts_active_work_order_with_valid_initial_intake_object(tmp_path, monkeypatch):
    _init_git_repo(tmp_path)
    standard_dir = tmp_path / "docs" / "reference"
    standard_dir.mkdir(parents=True)
    (standard_dir / check.STANDARD_PATH.split("/")[-1]).write_text("activated\n", encoding="utf-8")
    base_head = _commit_all(tmp_path, "activate standard")

    work_orders_dir = tmp_path / "docs" / "work_orders"
    work_orders_dir.mkdir(parents=True)
    reviews_dir = tmp_path / "docs" / "reviews"
    reviews_dir.mkdir(parents=True)
    (reviews_dir / "companion.md").write_text("companion evidence\n", encoding="utf-8")
    (work_orders_dir / "task.md").write_text(
        _initial_intake_work_order_text(
            path_families=["docs/reviews/"],
            planned_receipt_path="docs/reviews/CVF_EXAMPLE_INITIAL_SURVEY_2026-09-11.md",
        ),
        encoding="utf-8",
    )
    head = _commit_all(tmp_path, "dispatch initial-intake work order")

    monkeypatch.setattr(check, "REPO_ROOT", tmp_path)
    report = check.evaluate(base_head, head)

    assert report["status"] == "COMPLIANT"
    assert report["violations"] == []
    assert len(report["workOrdersChecked"]) == 1
    checked = report["workOrdersChecked"][0]
    assert checked["receipt"]["receiptStatus"] == "ROUTED_SHADOW"
    assert checked["receipt"]["initialIntakeDisposition"] == "INITIAL_EVIDENCE_COLLECTION_ONLY"
    assert checked["receipt"]["absorptionAcceptanceAuthorized"] is False
    assert set(report["changedPaths"]) == {"docs/reviews/companion.md", "docs/work_orders/task.md"}


def test_evaluate_end_to_end_rejects_active_work_order_with_malformed_initial_intake_object(tmp_path, monkeypatch):
    _init_git_repo(tmp_path)
    standard_dir = tmp_path / "docs" / "reference"
    standard_dir.mkdir(parents=True)
    (standard_dir / check.STANDARD_PATH.split("/")[-1]).write_text("activated\n", encoding="utf-8")
    base_head = _commit_all(tmp_path, "activate standard")

    work_orders_dir = tmp_path / "docs" / "work_orders"
    work_orders_dir.mkdir(parents=True)
    text = _initial_intake_work_order_text(
        path_families=["docs/reviews/"],
        planned_receipt_path="docs/reviews/CVF_EXAMPLE_INITIAL_SURVEY_2026-09-11.md",
    ).replace("INITIAL_ACQUISITION_SURVEY", "WRONG_STAGE")
    (work_orders_dir / "task.md").write_text(text, encoding="utf-8")
    head = _commit_all(tmp_path, "dispatch malformed initial-intake work order")

    monkeypatch.setattr(check, "REPO_ROOT", tmp_path)
    report = check.evaluate(base_head, head)

    assert report["status"] == "VIOLATION"
    assert len(report["violations"]) == 1
    assert "invalid route manifest" in report["violations"][0]
    assert report["workOrdersChecked"][0]["receipt"]["receiptStatus"] == "REJECTED_ESCALATED"


def test_evaluate_end_to_end_flags_changed_paths_outside_declared_path_families(tmp_path, monkeypatch):
    _init_git_repo(tmp_path)
    standard_dir = tmp_path / "docs" / "reference"
    standard_dir.mkdir(parents=True)
    (standard_dir / check.STANDARD_PATH.split("/")[-1]).write_text("activated\n", encoding="utf-8")
    base_head = _commit_all(tmp_path, "activate standard")

    work_orders_dir = tmp_path / "docs" / "work_orders"
    work_orders_dir.mkdir(parents=True)
    (work_orders_dir / "task.md").write_text(
        _initial_intake_work_order_text(
            path_families=["docs/reviews/"],
            planned_receipt_path="docs/reviews/CVF_EXAMPLE_INITIAL_SURVEY_2026-09-11.md",
        ),
        encoding="utf-8",
    )
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "unrelated.py").write_text("# not covered by pathFamilies\n", encoding="utf-8")
    head = _commit_all(tmp_path, "dispatch work order plus an uncovered change")

    monkeypatch.setattr(check, "REPO_ROOT", tmp_path)
    report = check.evaluate(base_head, head)

    assert report["status"] == "VIOLATION"
    assert len(report["violations"]) == 1
    assert "changed paths not covered by pathFamilies" in report["violations"][0]
    assert "src/unrelated.py" in report["violations"][0]
    assert report["workOrdersChecked"][0]["receipt"]["receiptStatus"] == "ROUTED_SHADOW"
