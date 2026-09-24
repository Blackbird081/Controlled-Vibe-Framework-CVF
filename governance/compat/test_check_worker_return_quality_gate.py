#!/usr/bin/env python3
"""Focused tests for the worker-return quality gate."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


_COMPAT_DIR = Path(__file__).resolve().parent
_MODULE_PATH = _COMPAT_DIR / "check_worker_return_quality_gate.py"
_STANDARD_PATH = (
    _COMPAT_DIR.parents[1]
    / "docs"
    / "reference"
    / "work_order_authoring"
    / "CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md"
)
_SPEC = importlib.util.spec_from_file_location("check_worker_return_quality_gate", _MODULE_PATH)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
chk = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = chk
_SPEC.loader.exec_module(chk)


VALID_RETURN = """# Worker Return
Status: COMPLETE_PENDING_REVIEW
Self-declared worker-return artifact: yes
Responds to work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md`
dispatchWorkOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md`
executionBaseHead: abc1234
## Purpose
Implemented the bounded work.
## Scope / Methodology
Read source and ran focused tests.
## Findings / Position
Review-ready with evidence.
## Risk / Corrective Action
No unresolved risk.
## Checker Source Read-Ahead Block
| Field | Value |
| --- | --- |
| applicableCheckersRead | `governance/compat/check_worker_return_quality_gate.py`; `governance/compat/check_delta_execution_claim_boundary.py` |
| literalTokensReviewed | `CLAIM_REJECTED_NO_RECEIPT`; `WORKER_MUST_NOT_COMMIT honored`; `Agent Operation Trace Block` |
| gateRunPurpose | confirmation/evidence before return |
| claimBoundary | worker-return quality shape only |
## Agent Operation Trace Block
| Field | Evidence |
| --- | --- |
| Actor | worker |
| Provider or surface | local workspace |
| Session or invocation | X, 2026-07-01 |
| Working directory | repository root |
| Command or tool surface | shell |
| Target paths | helper, test, worker return |
| Allowed scope source | work order |
| Before status evidence | `git status --short` before |
| After status evidence | `git status --short` after |
| Diff evidence | `git diff --name-status` |
| Approval boundary | worker no-commit |
| Claim boundary | no runtime claim |
| Agent type | worker |
| Invocation ID | `x-2026-07-01` |
| Expected manifest | helper; test; worker return |
| Actual changed set | helper; test; worker return |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason |
## Delta Execution Claim Boundary Control Block
| Field | Value |
| --- | --- |
| claimScope | worker return only |
| claimDisposition | CLAIM_REJECTED |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT |
| actionEvidence | CLAIM_REJECTED_NO_ACTION |
| invocationBoundary | manual local command only |
| interceptionBoundary | no wrapper/proxy enforcement |
| claimLanguage | helper/test evidence only |
| forbiddenExpansion | no runtime/provider/public expansion |
## Public Export Disposition
DEFERRED_PRIVATE_ONLY
Reason: private worker return.
## External Knowledge Intake Routing
| Field | Value |
| --- | --- |
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | N/A with reason: not external intake |
| Matching local-view guard | N/A with reason |
| Owner surface | worker return |
| Disposition | NOT_APPLICABLE_WITH_REASON |
| Claim boundary | no external intake |
## Rescan Intelligence Hardening
- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
## Corpus Completeness And Report Integrity
- Corpus verdict: NOT_APPLICABLE_WITH_REASON - no corpus scan.
## Finding-To-Governance Learning Disposition
| Field | Value |
| --- | --- |
| Defect class | N/A_WITH_REASON: no defect |
| Learning lane | N/A_WITH_REASON: no learning |
| Finding | none |
| Disposition | N/A_WITH_REASON - none |
| Runtime/provider/cost lane | N/A_WITH_REASON: none |
| Next control action | none |
## Epistemic Process Block
- Expected result / prediction: pass
- Evidence Comparison: pass
- Contradiction or gap disposition: none
- Claim update: bounded
## Claim Boundary
No runtime claim.
## git status --short
```
 M helper.py
?? docs/reviews/x.md
```
## Changed Files
`git diff --name-status` -> PASS
## Command Evidence
`python -m unittest x` -> PASS
## No-Commit Statement
WORKER_MUST_NOT_COMMIT honored: HEAD unchanged; no git commit performed by worker.
"""


class EligibilityTests(unittest.TestCase):
    def test_valid_return_is_eligible(self) -> None:
        self.assertTrue(chk.is_eligible_worker_return("docs/reviews/CVF_X_WORKER_RETURN.md", VALID_RETURN))

    def test_completion_review_is_excluded(self) -> None:
        self.assertFalse(chk.is_eligible_worker_return("docs/reviews/CVF_X_COMPLETION_2026-07-01.md", VALID_RETURN))

    def test_reference_outside_reviews_is_excluded(self) -> None:
        self.assertFalse(chk.is_eligible_worker_return("docs/reference/x.md", VALID_RETURN))


class DiagnoseTests(unittest.TestCase):
    def test_valid_return_is_clean(self) -> None:
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", VALID_RETURN)
        self.assertTrue(d.is_clean, d.issues)

    def test_unresolved_fill_me_fails(self) -> None:
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", VALID_RETURN + "\nFILL_ME\n")
        self.assertFalse(d.is_clean)
        self.assertTrue(any("FILL_ME" in issue for issue in d.issues))

    def test_missing_self_declaration_fails(self) -> None:
        text = VALID_RETURN.replace("Self-declared worker-return artifact: yes\n", "")
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("Self-declared worker-return artifact" in issue for issue in d.issues))

    def test_missing_checker_source_fails(self) -> None:
        text = VALID_RETURN.replace("governance/compat/check_worker_return_quality_gate.py", "worker quality gate")
        text = text.replace("governance/compat/check_delta_execution_claim_boundary.py", "delta gate")
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("does not name any" in issue for issue in d.issues))

    def test_missing_delta_receipt_token_fails(self) -> None:
        text = VALID_RETURN.replace("CLAIM_REJECTED_NO_RECEIPT", "no receipt")
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("receipt evidence token" in issue for issue in d.issues))

    def test_command_evidence_without_disposition_fails(self) -> None:
        text = VALID_RETURN.replace("`python -m unittest x` -> PASS", "`python -m unittest x`")
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("command evidence" in issue for issue in d.issues))

    def test_noncanonical_external_input_fails(self) -> None:
        text = VALID_RETURN.replace(
            "operator-provided external comparison, critique, or recommendation",
            "N/A with reason",
        )
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("canonical" in issue for issue in d.issues))

    def test_internal_only_input_type_is_accepted(self) -> None:
        text = VALID_RETURN.replace(
            "| Input type | operator-provided external comparison, critique, or recommendation |",
            chk.INTERNAL_ONLY_INPUT_CANONICAL,
        )
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertTrue(d.is_clean, d.issues)

    def test_dispatch_authorized_fast_doc_return_is_clean(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.parent.mkdir(parents=True)
            work_order.write_text(
                "\n".join(
                    (
                        "Commit mode: WORKER_MUST_NOT_COMMIT",
                        "contractProfile: WORKER_RETURN_FAST_DOC_V1",
                        "scopeClassification: DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT",
                        "publicSyncDisposition: FORBIDDEN",
                        "liveRuntimeDisposition: FORBIDDEN",
                        "checkerMutationDisposition: FORBIDDEN",
                        "workerSelfSelection: FORBIDDEN",
                    )
                ),
                encoding="utf-8",
            )
            text = VALID_RETURN + "\ncontractProfile: WORKER_RETURN_FAST_DOC_V1\n"
            for heading in (
                "## External Knowledge Intake Routing",
                "## Rescan Intelligence Hardening",
                "## Corpus Completeness And Report Integrity",
            ):
                text = text.replace(chk._section(text, heading), "")
            text += (
                "\n## Conditional Controls Disposition\n"
                "conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA\n"
            )
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
                without_command_evidence = text.replace(
                    chk._section(text, "## Command Evidence"), ""
                )
                protected = chk.diagnose(
                    "docs/reviews/CVF_X_WORKER_RETURN.md", without_command_evidence
                )
            finally:
                chk.REPO_ROOT = original_root
            self.assertTrue(d.is_clean, d.issues)
            self.assertFalse(protected.is_clean)
            self.assertTrue(
                any("Command Evidence" in issue for issue in protected.issues)
            )

    def test_fast_doc_self_selection_without_dispatch_authority_fails(self) -> None:
        text = VALID_RETURN + "\ncontractProfile: WORKER_RETURN_FAST_DOC_V1\n"
        for heading in (
            "## External Knowledge Intake Routing",
            "## Rescan Intelligence Hardening",
            "## Corpus Completeness And Report Integrity",
        ):
            text = text.replace(chk._section(text, heading), "")
        text += (
            "\n## Conditional Controls Disposition\n"
            "conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA\n"
        )
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("dispatch work order" in issue for issue in d.issues))

    def test_fast_doc_still_requires_no_commit_evidence(self) -> None:
        text = VALID_RETURN.replace("WORKER_MUST_NOT_COMMIT honored", "no commit")
        d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("no-commit statement" in issue for issue in d.issues))


class WoasR7GeneratedSkeletonQualityGateTests(unittest.TestCase):
    """WOAS-R7: the WOAS-R3 generated worker-return skeleton must be
    checker-safe by construction against this gate's `diagnose()` function,
    proving AC5 of the WOAS-R7 work order without importing private checker
    internals from a second module (both live in `governance/compat/`)."""

    @classmethod
    def setUpClass(cls) -> None:
        compat_dir = _COMPAT_DIR
        if str(compat_dir) not in sys.path:
            sys.path.insert(0, str(compat_dir))
        from build_worker_return_skeleton_scaffold import (  # noqa: PLC0415
            build_worker_return_skeleton,
        )
        from dataclasses import dataclass

        @dataclass
        class _ScaffoldArgs:
            packet_kind: str
            batch_id: str
            title: str
            date: str
            base: str
            commit_mode: str
            dependencies: list
            include_worker_return_skeleton: bool = False

        args = _ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            batch_id="WOAS-R7-GATE-TEST",
            title="Checker-Safe Worker Return Skeleton Generation",
            date="2026-07-01",
            base="abc1234",
            commit_mode="WORKER_MUST_NOT_COMMIT",
            dependencies=[],
        )
        cls.skeleton = build_worker_return_skeleton(args)

    def test_generated_skeleton_has_no_placeholder_markers(self) -> None:
        for marker in chk.PLACEHOLDER_MARKERS:
            with self.subTest(marker=marker):
                self.assertNotIn(marker, self.skeleton)

    def test_generated_skeleton_is_eligible_worker_return(self) -> None:
        self.assertTrue(
            chk.is_eligible_worker_return(
                "docs/reviews/CVF_WOAS_R7_GATE_TEST_WORKER_RETURN_2026-07-01.md",
                self.skeleton,
            )
        )

    def test_generated_skeleton_diagnoses_clean(self) -> None:
        d = chk.diagnose(
            "docs/reviews/CVF_WOAS_R7_GATE_TEST_WORKER_RETURN_2026-07-01.md",
            self.skeleton,
        )
        self.assertTrue(d.is_clean, d.issues)


class EvidenceReadinessIntegrationTests(unittest.TestCase):
    """EVIDENCE-READINESS-T1: prove the *existing* checker call (`diagnose`/
    `run`) reaches the new evidence-readiness validator automatically, and
    that a worker cannot opt a covered task out by omission or tampering
    with the return alone -- applicability is derived from the trusted
    dispatch work order only."""

    def _write_repo(self, tmp: str) -> Path:
        repo_root = Path(tmp)
        (repo_root / "docs/work_orders").mkdir(parents=True)
        (repo_root / "docs/audits").mkdir(parents=True)
        return repo_root

    def test_diagnose_reaches_validator_and_blocks_missing_binding(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", VALID_RETURN)
            finally:
                chk.REPO_ROOT = original_root
            self.assertFalse(d.is_clean)
            self.assertTrue(any("evidence readiness" in issue for issue in d.issues))

    def test_diagnose_is_unaffected_when_work_order_has_no_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text("# Work Order\nNo evidence readiness contract.\n", encoding="utf-8")
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", VALID_RETURN)
            finally:
                chk.REPO_ROOT = original_root
            self.assertTrue(d.is_clean, d.issues)

    def test_omission_in_return_cannot_opt_out_of_applicable_contract(self) -> None:
        """The return does not mention evidence readiness at all; the
        dispatch work order alone determines applicability, so omission in
        the return is caught, not silently accepted."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            text_without_binding = VALID_RETURN  # no Evidence Readiness Binding section
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text_without_binding)
            finally:
                chk.REPO_ROOT = original_root
            self.assertFalse(d.is_clean)
            self.assertTrue(
                any("Evidence Readiness Binding" in issue for issue in d.issues)
            )

    def test_valid_binding_with_matching_digest_is_clean(self) -> None:
        """Rework note (F1): the source row must now resolve to a REAL
        source blob through the wired resolver, not a fabricated `blobA`
        against a fabricated pin -- so this fixture writes a genuine
        snapshot file under `<sourceRoot>/<sourcePin>/a.ts` and uses its
        real sha256 digest, proving the fix through this same integration
        test rather than loosening the assertion."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            audit_bytes = b'{"schemaVersion": "cvf.evidenceAudit.v1"}'
            (repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
            (repo_root / "docs/manifests").mkdir(parents=True)
            (repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
            import hashlib

            source_pin = "snapshot-2026-09-14"
            snapshot_dir = repo_root / "fixture_source" / source_pin
            snapshot_dir.mkdir(parents=True)
            source_bytes = b"real content\n"
            (snapshot_dir / "a.ts").write_bytes(source_bytes)
            blob_sha = hashlib.sha256(source_bytes).hexdigest()

            digest = hashlib.sha256(audit_bytes).hexdigest()
            binding = (
                "\n## Evidence Readiness Binding\n\n"
                "evidenceBindingSchema: cvf.workerEvidenceReadiness.v1\n"
                "auditPath: docs/audits/fixture_audit.json\n"
                f"auditSha256: {digest}\n"
                "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
                "sourceRoot: fixture_source\n"
                f"sourcePin: {source_pin}\n\n"
                "| path | blobSha256 | lineCount | readSpans | status |\n"
                "| --- | --- | --- | --- | --- |\n"
                f"| a.ts | {blob_sha} | 1 | 1-1 | READ |\n"
            )
            text = VALID_RETURN + binding
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
            finally:
                chk.REPO_ROOT = original_root
            self.assertTrue(d.is_clean, d.issues)

    def test_fabricated_source_identity_is_rejected_through_diagnose(self) -> None:
        """F1 proof at the checker-integration level: a row with a
        fabricated blobSha256 against a nonexistent sourceRoot/sourcePin
        must be rejected by `diagnose()`, the real checker entrypoint --
        this is the exact shape the reviewer's probe found passing clean."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            audit_bytes = b'{"schemaVersion": "cvf.evidenceAudit.v1"}'
            (repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
            (repo_root / "docs/manifests").mkdir(parents=True)
            (repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
            import hashlib

            digest = hashlib.sha256(audit_bytes).hexdigest()
            binding = (
                "\n## Evidence Readiness Binding\n\n"
                "evidenceBindingSchema: cvf.workerEvidenceReadiness.v1\n"
                "auditPath: docs/audits/fixture_audit.json\n"
                f"auditSha256: {digest}\n"
                "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
                "sourceRoot: fixture_source_does_not_exist\n"
                "sourcePin: fabricated-pin-never-existed\n\n"
                "| path | blobSha256 | lineCount | readSpans | status |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| a.ts | " + ("f" * 64) + " | 1 | 1-1 | READ |\n"
            )
            text = VALID_RETURN + binding
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", text)
            finally:
                chk.REPO_ROOT = original_root
            self.assertFalse(d.is_clean)
            self.assertTrue(any("could not be resolved" in issue for issue in d.issues))

    def test_audit_only_drift_reaches_unchanged_bound_return_via_index(self) -> None:
        """Requirement 7: an audit-only change must not bypass validation
        even though the bound Markdown return itself did not change. The
        bounded declared index maps the audit path back to the worker
        return path so `run()` re-diagnoses it."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            (repo_root / ".git").mkdir()
            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            audit_bytes = b'{"schemaVersion": "cvf.evidenceAudit.v1"}'
            audit_path = repo_root / "docs/audits/fixture_audit.json"
            audit_path.write_bytes(audit_bytes)
            (repo_root / "docs/manifests").mkdir(parents=True)
            (repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")

            import hashlib

            stale_digest = "0" * 64  # deliberately stale vs current audit bytes
            binding = (
                "\n## Evidence Readiness Binding\n\n"
                "evidenceBindingSchema: cvf.workerEvidenceReadiness.v1\n"
                "auditPath: docs/audits/fixture_audit.json\n"
                f"auditSha256: {stale_digest}\n"
                "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
                "sourceRoot: fixture_source\n"
                "sourcePin: 0000000000000000000000000000000000000\n\n"
                "| path | blobSha256 | lineCount | readSpans | status |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| a.ts | blobA | 1 | 1-1 | READ |\n"
            )
            return_path = repo_root / "docs/reviews/CVF_X_WORKER_RETURN.md"
            return_path.parent.mkdir(parents=True, exist_ok=True)
            return_path.write_text(VALID_RETURN + binding, encoding="utf-8")

            index_dir = repo_root / "governance/compat"
            index_dir.mkdir(parents=True, exist_ok=True)
            (index_dir / "evidence_readiness_audit_index.json").write_text(
                json.dumps({"docs/audits/fixture_audit.json": ["docs/reviews/CVF_X_WORKER_RETURN.md"]}),
                encoding="utf-8",
            )

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                changed = {"docs/audits/fixture_audit.json": {"M"}}
                drift = chk._audit_only_drift_paths(changed)
                self.assertIn("docs/reviews/CVF_X_WORKER_RETURN.md", drift)
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", return_path.read_text(encoding="utf-8"))
            finally:
                chk.REPO_ROOT = original_root
            self.assertFalse(d.is_clean)
            self.assertTrue(any("stale digest" in issue for issue in d.issues))

    def test_index_is_populated_automatically_without_hand_maintenance(self) -> None:
        """F4 proof, entrypoint-level: no `evidence_readiness_audit_index.json`
        exists beforehand at all. A first `diagnose()` call over an
        applicable, otherwise-clean binding must register the reverse
        `auditPath -> workerReturnPath` mapping itself as a side effect.
        Then, WITHOUT any human touching the index, changing only the bound
        audit file's bytes and re-running the real `run()` flow over that
        changed-file set must pull the worker return back into
        re-diagnosis and flag the resulting stale-digest drift -- proving
        the audit-only-drift path works with zero pre-seeded index state."""
        import hashlib
        import subprocess

        with tempfile.TemporaryDirectory() as tmp:
            repo_root = self._write_repo(tmp)
            subprocess.run(["git", "init", "-q"], cwd=repo_root, check=True)
            subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=repo_root, check=True)
            subprocess.run(["git", "config", "user.name", "Test"], cwd=repo_root, check=True)

            work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
            work_order.write_text(
                "# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8"
            )
            audit_bytes = b'{"schemaVersion": "cvf.evidenceAudit.v1"}'
            audit_rel = "docs/audits/fixture_audit.json"
            (repo_root / audit_rel).write_bytes(audit_bytes)
            (repo_root / "docs/manifests").mkdir(parents=True)
            (repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")

            source_pin = "snapshot-index-test"
            snapshot_dir = repo_root / "fixture_source" / source_pin
            snapshot_dir.mkdir(parents=True)
            source_bytes = b"stable content\n"
            (snapshot_dir / "a.ts").write_bytes(source_bytes)
            blob_sha = hashlib.sha256(source_bytes).hexdigest()

            digest = hashlib.sha256(audit_bytes).hexdigest()
            binding = (
                "\n## Evidence Readiness Binding\n\n"
                "evidenceBindingSchema: cvf.workerEvidenceReadiness.v1\n"
                f"auditPath: {audit_rel}\n"
                f"auditSha256: {digest}\n"
                "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
                "sourceRoot: fixture_source\n"
                f"sourcePin: {source_pin}\n\n"
                "| path | blobSha256 | lineCount | readSpans | status |\n"
                "| --- | --- | --- | --- | --- |\n"
                f"| a.ts | {blob_sha} | 1 | 1-1 | READ |\n"
            )
            return_rel = "docs/reviews/CVF_X_WORKER_RETURN.md"
            return_path = repo_root / return_rel
            return_path.parent.mkdir(parents=True, exist_ok=True)
            return_path.write_text(VALID_RETURN + binding, encoding="utf-8")

            index_path = repo_root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            self.assertFalse(index_path.is_file(), "precondition: no index file must exist yet")

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                # First diagnose call: registers the binding automatically.
                d = chk.diagnose(return_rel, return_path.read_text(encoding="utf-8"))
                self.assertTrue(d.is_clean, d.issues)
                self.assertTrue(index_path.is_file(), "index must be auto-created as a side effect")
                index_data = json.loads(index_path.read_text(encoding="utf-8"))
                self.assertIn(audit_rel, index_data)
                self.assertIn(return_rel, index_data[audit_rel])

                # Now mutate ONLY the bound audit file's bytes; the worker
                # return Markdown stays untouched.
                (repo_root / audit_rel).write_bytes(b'{"schemaVersion": "fixture.v2-drifted"}')

                changed = {audit_rel: {"M"}}
                drift = chk._audit_only_drift_paths(changed)
                self.assertIn(return_rel, drift)

                d2 = chk.diagnose(return_rel, return_path.read_text(encoding="utf-8"))
                self.assertFalse(d2.is_clean)
                self.assertTrue(any("stale digest" in issue for issue in d2.issues))
            finally:
                chk.REPO_ROOT = original_root

    def test_frozen_r4_files_are_not_in_the_audit_index(self) -> None:
        """Migration rule (requirement 10): historical/parked packets like
        the frozen R4 outputs have no entry in the bounded index, so they
        are never swept into evidence-readiness re-diagnosis by the
        audit-only-drift path."""
        index_path = (
            Path(__file__).resolve().parent / "evidence_readiness_audit_index.json"
        )
        if not index_path.is_file():
            return  # no index shipped yet is itself a valid empty-index state
        data = json.loads(index_path.read_text(encoding="utf-8"))
        self.assertNotIn("docs/audits/CVF_QM_RUNTIME_VALUE_R4_2026-09-14.json", data)


def _write_evidence_readiness_fixture(
    repo_root: Path,
    *,
    return_rel: str = "docs/reviews/CVF_X_WORKER_RETURN.md",
    audit_rel: str = "docs/audits/fixture_audit.json",
    source_pin: str = "snapshot-index-test",
) -> None:
    """Shared fixture builder for F4/F5 generation-2 tests: one applicable,
    otherwise-clean evidence-readiness binding with a real resolvable
    snapshot source, so `diagnose()`/`run()` reaches the real validator
    end to end."""

    import hashlib

    (repo_root / "docs/work_orders").mkdir(parents=True, exist_ok=True)
    work_order = repo_root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X_2026-07-01.md"
    work_order.write_text("# Work Order\nevidenceReadinessContract: REQUIRED_V1\n", encoding="utf-8")

    audit_bytes = b'{"schemaVersion": "cvf.evidenceAudit.v1"}'
    (repo_root / audit_rel).parent.mkdir(parents=True, exist_ok=True)
    (repo_root / audit_rel).write_bytes(audit_bytes)
    (repo_root / "docs/manifests").mkdir(parents=True, exist_ok=True)
    (repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")

    snapshot_dir = repo_root / "fixture_source" / source_pin
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    source_bytes = b"stable content\n"
    (snapshot_dir / "a.ts").write_bytes(source_bytes)
    blob_sha = hashlib.sha256(source_bytes).hexdigest()

    digest = hashlib.sha256(audit_bytes).hexdigest()
    binding = (
        "\n## Evidence Readiness Binding\n\n"
        "evidenceBindingSchema: cvf.workerEvidenceReadiness.v1\n"
        f"auditPath: {audit_rel}\n"
        f"auditSha256: {digest}\n"
        "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
        "sourceRoot: fixture_source\n"
        f"sourcePin: {source_pin}\n\n"
        "| path | blobSha256 | lineCount | readSpans | status |\n"
        "| --- | --- | --- | --- | --- |\n"
        f"| a.ts | {blob_sha} | 1 | 1-1 | READ |\n"
    )
    return_path = repo_root / return_rel
    return_path.parent.mkdir(parents=True, exist_ok=True)
    return_path.write_text(VALID_RETURN + binding, encoding="utf-8")


class EvidenceReadinessIndexIntegrityTests(unittest.TestCase):
    """F4 (generation 2): a malformed or unwritable audit-readiness index
    must surface as a visible diagnostic instead of silently behaving like a
    normal empty index."""

    def test_malformed_index_file_surfaces_as_issue_not_silent_empty(self) -> None:
        """A PRESENT-but-malformed index (not valid JSON) must produce a
        visible issue through the real diagnose()/run() path, not silently
        degrade to 'no bindings registered' indistinguishable from a
        legitimately missing/empty index."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            _write_evidence_readiness_fixture(repo_root)

            index_path = repo_root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            index_path.parent.mkdir(parents=True, exist_ok=True)
            index_path.write_text("{ this is not valid JSON !!!", encoding="utf-8")

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                return_path = repo_root / "docs/reviews/CVF_X_WORKER_RETURN.md"
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", return_path.read_text(encoding="utf-8"))
            finally:
                chk.REPO_ROOT = original_root
            self.assertFalse(d.is_clean)
            self.assertTrue(
                any("audit-readiness index could not be read" in issue for issue in d.issues)
            )

    def test_missing_index_file_is_not_flagged_as_malformed(self) -> None:
        """Counter-proof: a MISSING index file (the ordinary, expected first-
        use state) must NOT be flagged as an integrity problem -- only a
        present-but-malformed file is."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            _write_evidence_readiness_fixture(repo_root)
            index_path = repo_root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            self.assertFalse(index_path.is_file())

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                return_path = repo_root / "docs/reviews/CVF_X_WORKER_RETURN.md"
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", return_path.read_text(encoding="utf-8"))
            finally:
                chk.REPO_ROOT = original_root
            self.assertTrue(d.is_clean, d.issues)
            self.assertFalse(any("could not be read" in issue for issue in d.issues))

    def test_run_surfaces_malformed_index_as_issue_on_diagnosed_return(self) -> None:
        """Entrypoint-level (`run()`) proof: a malformed index is surfaced as
        a visible issue attached to a return diagnosed during that `run()`
        invocation, not merely at the direct `diagnose()` call level."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            subprocess_init(repo_root)
            _write_evidence_readiness_fixture(repo_root)

            index_path = repo_root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            index_path.parent.mkdir(parents=True, exist_ok=True)
            index_path.write_text("not json", encoding="utf-8")

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                diagnostics = chk.run(None, None)
            finally:
                chk.REPO_ROOT = original_root
            matches = [d for d in diagnostics if d.path == "docs/reviews/CVF_X_WORKER_RETURN.md"]
            self.assertEqual(len(matches), 1)
            self.assertTrue(
                any("audit-readiness index could not be read" in issue for issue in matches[0].issues)
            )

    def test_index_write_failure_surfaces_as_issue_not_swallowed(self) -> None:
        """A failed index WRITE (simulated via a monkeypatched writer that
        raises OSError) must surface as a visible issue on the return being
        diagnosed, not be silently swallowed as a 'non-fatal convenience
        side effect'."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            _write_evidence_readiness_fixture(repo_root)

            original_root = chk.REPO_ROOT
            original_writer = chk._write_evidence_readiness_audit_index
            chk.REPO_ROOT = repo_root

            def _raise_os_error(index):
                raise OSError("simulated disk full")

            chk._write_evidence_readiness_audit_index = _raise_os_error
            try:
                return_path = repo_root / "docs/reviews/CVF_X_WORKER_RETURN.md"
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", return_path.read_text(encoding="utf-8"))
            finally:
                chk.REPO_ROOT = original_root
                chk._write_evidence_readiness_audit_index = original_writer
            self.assertFalse(d.is_clean)
            self.assertTrue(
                any("audit-readiness index could not be written" in issue for issue in d.issues)
            )
            # The index file must not exist / not silently appear correct --
            # the write genuinely failed, so no partial or stale file should
            # be mistaken for a successful registration.
            index_path = repo_root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            self.assertFalse(index_path.is_file())


def subprocess_init(repo_root: Path) -> None:
    import subprocess

    subprocess.run(["git", "init", "-q"], cwd=repo_root, check=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=repo_root, check=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=repo_root, check=True)


class SharedResolverWiringTests(unittest.TestCase):
    """F5 (generation 2): the real `run()`/`diagnose()` code path must
    construct and reuse ONE shared resolver per (sourceRoot, sourcePin)
    across multiple worker returns diagnosed within a single `run()`
    invocation -- not merely when a test manually passes the same resolver
    instance to two direct `evaluate_worker_return()` calls."""

    def test_run_reuses_one_resolver_across_two_returns_sharing_same_pin(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            subprocess_init(repo_root)

            shared_pin = "snapshot-shared-2026-09-14"
            _write_evidence_readiness_fixture(
                repo_root,
                return_rel="docs/reviews/CVF_X_WORKER_RETURN.md",
                audit_rel="docs/audits/fixture_audit_x.json",
                source_pin=shared_pin,
            )
            _write_evidence_readiness_fixture(
                repo_root,
                return_rel="docs/reviews/CVF_Y_WORKER_RETURN.md",
                audit_rel="docs/audits/fixture_audit_y.json",
                source_pin=shared_pin,
            )

            constructed_resolvers: list[object] = []
            original_default_resolver_for = chk._default_resolver_for

            def _tracking_default_resolver_for(source_pin, repo_root_arg):
                resolver = original_default_resolver_for(source_pin, repo_root_arg)
                constructed_resolvers.append(resolver)
                return resolver

            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            chk._default_resolver_for = _tracking_default_resolver_for
            try:
                diagnostics = chk.run(None, None)
            finally:
                chk.REPO_ROOT = original_root
                chk._default_resolver_for = original_default_resolver_for

            matched = {d.path: d for d in diagnostics if d.path.startswith("docs/reviews/CVF_")}
            self.assertIn("docs/reviews/CVF_X_WORKER_RETURN.md", matched)
            self.assertIn("docs/reviews/CVF_Y_WORKER_RETURN.md", matched)
            self.assertTrue(matched["docs/reviews/CVF_X_WORKER_RETURN.md"].is_clean, matched["docs/reviews/CVF_X_WORKER_RETURN.md"].issues)
            self.assertTrue(matched["docs/reviews/CVF_Y_WORKER_RETURN.md"].is_clean, matched["docs/reviews/CVF_Y_WORKER_RETURN.md"].issues)

            # The real fix: exactly ONE resolver was constructed for the
            # shared (sourceRoot, sourcePin) pair across BOTH diagnosed
            # returns in this one run() invocation -- not one per return.
            same_pin_resolvers = [
                r for r in constructed_resolvers
                if getattr(r, "repo_root", None) == repo_root
            ]
            self.assertEqual(
                len(same_pin_resolvers),
                1,
                f"expected exactly one resolver constructed for the shared pin, got {len(same_pin_resolvers)}",
            )
            # And that one resolver's underlying read was only ever
            # performed once (its cache was populated once, reused by the
            # second diagnose() call), proving real cache reuse through
            # run(), not just "a resolver was constructed once by accident".
            resolver = same_pin_resolvers[0]
            self.assertEqual(resolver.call_count, 1)

    def test_diagnose_without_registry_still_works_standalone(self) -> None:
        """Backward-compatible: a direct `diagnose()` call with no
        `resolver_registry` (e.g. from a script or a test) still constructs
        a resolver per call and evaluates correctly -- the registry is an
        optional performance wiring, not a required parameter."""
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp)
            _write_evidence_readiness_fixture(repo_root)
            original_root = chk.REPO_ROOT
            chk.REPO_ROOT = repo_root
            try:
                return_path = repo_root / "docs/reviews/CVF_X_WORKER_RETURN.md"
                d = chk.diagnose("docs/reviews/CVF_X_WORKER_RETURN.md", return_path.read_text(encoding="utf-8"))
            finally:
                chk.REPO_ROOT = original_root
            self.assertTrue(d.is_clean, d.issues)


class StandardParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.standard_text = _STANDARD_PATH.read_text(encoding="utf-8")

    def test_standard_lists_all_required_headings(self) -> None:
        for heading in chk.REQUIRED_HEADINGS:
            with self.subTest(heading=heading):
                self.assertIn(heading, self.standard_text)

    def test_standard_lists_checker_field_constants(self) -> None:
        for label in (
            *chk.READ_AHEAD_FIELDS,
            *chk.AOT_FIELDS,
            *chk.DELTA_FIELDS,
        ):
            with self.subTest(label=label):
                self.assertIn(label, self.standard_text)

    def test_standard_lists_canonical_tokens(self) -> None:
        expected_tokens = (
            *chk.PLACEHOLDER_MARKERS,
            chk.EXTERNAL_INPUT_CANONICAL,
            chk.INTERNAL_ONLY_INPUT_CANONICAL,
            *chk.DELTA_RECEIPT_TOKENS,
            *chk.DELTA_ACTION_TOKENS,
            *chk.PUBLIC_EXPORT_TOKENS,
            "WORKER_MUST_NOT_COMMIT honored",
            "--base <executionBaseHead> --head HEAD --enforce",
            "confirmation/evidence",
        )
        for token in expected_tokens:
            with self.subTest(token=token):
                self.assertIn(token, self.standard_text)


class AuditOnlyIndexRegressionTests(unittest.TestCase):
    def test_noop_does_not_load_validator_or_start_subprocess(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(chk, "REPO_ROOT", Path(tmp)), patch.object(chk, "get_changed_paths", return_value={}), patch.object(chk, "_evidence_module") as load, patch.object(chk.subprocess, "run") as process:
                self.assertEqual(chk.run(None, None), [])
                load.assert_not_called()
                process.assert_not_called()

    def test_deleted_index_recovery_and_missing_locator_block(self):
        from unittest.mock import patch
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_evidence_readiness_fixture(root)
            audit = "docs/audits/fixture_audit.json"
            ret = "docs/reviews/CVF_X_WORKER_RETURN.md"
            # Resolve actual audit locator from the existing fixture binding.
            return_text = (root / ret).read_text()
            import re
            audit = re.search(r"(?m)^auditPath: (.+)$", return_text).group(1)
            old = (root / audit).read_bytes()
            raw = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1", "workerReturnPath": ret}).encode()
            (root / audit).write_bytes(raw)
            (root / ret).write_text(return_text.replace(hashlib.sha256(old).hexdigest(), hashlib.sha256(raw).hexdigest()))
            with patch.object(chk, "REPO_ROOT", root), patch.object(chk, "get_changed_paths", return_value={audit: {"M"}}):
                self.assertTrue(all(d.is_clean for d in chk.run(None, None)))
                (root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH).unlink()
                (root / audit).write_bytes(raw + b" ")
                diagnostics = chk.run(None, None)
                self.assertTrue(any("stale digest" in str(d.issues) for d in diagnostics))
                (root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH).unlink()
                (root / audit).write_text('{"schemaVersion":"cvf.evidenceAudit.v1"}')
                diagnostics = chk.run(None, None)
                self.assertTrue(any("no verified reverse binding" in str(d.issues) for d in diagnostics))

    def test_invalid_index_entry_type_is_blocking(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index = root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            index.parent.mkdir(parents=True)
            for content in ('{"audit.json": 5}', '{"audit.json":[null]}', '{"a":[],"a":[]}'):
                index.write_text(content)
                with patch.object(chk, "REPO_ROOT", root), patch.object(chk, "get_changed_paths", return_value={}):
                    self.assertTrue(any(not d.is_clean for d in chk.run(None, None)))

    def test_run_reports_corruption_without_changed_return(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index = root / chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH
            index.parent.mkdir(parents=True)
            index.write_text("{broken")
            with patch.object(chk, "REPO_ROOT", root), patch.object(chk, "get_changed_paths", return_value={"audit.json": {"M"}}):
                diagnostics = chk.run(None, None)
            self.assertEqual(len(diagnostics), 1)
            self.assertTrue(diagnostics[0].eligible)
            self.assertFalse(diagnostics[0].is_clean)
            self.assertEqual(diagnostics[0].path, chk.EVIDENCE_READINESS_AUDIT_INDEX_PATH)


if __name__ == "__main__":
    unittest.main()
