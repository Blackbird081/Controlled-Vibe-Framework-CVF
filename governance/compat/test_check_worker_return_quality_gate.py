#!/usr/bin/env python3
"""Focused tests for the worker-return quality gate."""

from __future__ import annotations

import importlib.util
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


if __name__ == "__main__":
    unittest.main()
