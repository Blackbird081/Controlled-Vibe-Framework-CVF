#!/usr/bin/env python3
"""Dedicated test coverage for DARA-T2 Architecture Readiness Admission validators.

Covers R1-01 (fail-closed on absent declaration for EXTERNAL_AGENT_CLI_MCP),
R1-02 (committed bytes SHA256 + ancestor validation), R1-03 (closed-chain
field validation trustSource/contextCarrier/evidenceOutputPath/rollbackPaths),
and acceptance criteria AM-01 through AM-06.

Tests 4-5 of the former TestArchitectureReadinessAdmissionScaffold in
test_build_dispatch_packet_scaffold.py are consolidated here.
"""
from __future__ import annotations
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.join(os.path.dirname(__file__), "..", ".."))

import check_work_order_dispatch_quality as dispatch_quality
import check_work_order_dispatch_quality_source as source_validation

# Real committed review identity (from the accepted DARA-T2-R1 architecture review).
# No fabricated commit may appear in a positive test per the DARA standard.
_REAL_REVIEW_COMMIT = "1316ea7340541ab8e675c5b1965f5a1ff3ef52d0"
_REAL_REVIEW_PATH = (
    "docs/reviews/CVF_DARA_T2_R1_ROOT_CONTRACT_AND_MANIFEST_AMENDMENT_REVIEW_2026-09-07.md"
)
_REAL_REVIEW_SHA256 = (
    "677a7647a810fd78340b217c319dfbb7201da7ee5d3426889c503435b1008984"
)
_THIS_TEST_PATH = (
    "governance/compat/test_check_work_order_dispatch_quality_architecture_readiness.py"
)
_RANGE_PATH = "governance/compat/check_work_order_dispatch_quality_range.py"
_RANGE_FN = "_validate_architecture_readiness_admission"
_EVIDENCE_PATH = (
    "docs/reviews/CVF_DARA_T2_ARCHITECTURE_READINESS_ADMISSION_IMPLEMENTATION_WORKER_RETURN_2026-09-06.md"
)

# A minimal 32-column Architecture Binding Matrix with one dummy row.
# Column presence triggers the ACCEPTED_BOUNDED validation path. Row-level
# errors from this dummy row are expected and do not affect SHA256 test results.
_MATRIX_HEADER = (
    "| criterionId | riskClass | behaviorIdentity | canonicalOwnerPath | canonicalOwnerLocator"
    " | implementationDisposition | implementationPath | implementationSymbol"
    " | producerPath | producerSymbol | trustSource | contextCarrierPath | contextField"
    " | exportPath | exportSymbol | registrationPath | registrationSymbol"
    " | compositionRootPath | compositionRootSymbol | runtimeConsumerPath | runtimeConsumerSymbol"
    " | positiveTestPath | negativeTestPath | bypassTestPath | compositionTestPath"
    " | compatibilityDisposition | rollbackPaths | evidenceOutputPath"
    " | machineDisposition | semanticAcceptance | semanticReviewPath | semanticReviewCommit |"
)
_MATRIX_SEP = (
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
    " --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
)
_MATRIX_ROW = (
    f"| TEST-AM-01 | HIGH | dara-test-behavior | {_RANGE_PATH} | {_RANGE_FN}"
    f" | EXTEND_EXISTING | {_RANGE_PATH} | {_RANGE_FN}"
    f" | {_RANGE_PATH} | {_RANGE_FN}"
    f" | {_RANGE_PATH}:{_RANGE_FN}"
    f" | {_RANGE_PATH} | {_RANGE_FN}"
    f" | {_RANGE_PATH} | {_RANGE_FN}"
    " | NONE_WITH_REASON:not-registered | NONE_WITH_REASON:not-registered"
    f" | {_RANGE_PATH} | {_RANGE_FN}"
    " | NONE_WITH_REASON:CONTRACT_ONLY_no-non-test-consumer | NONE_WITH_REASON:CONTRACT_ONLY_no-non-test-consumer"
    f" | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH}"
    f" | NONE_WITH_REASON:no-compat-gap | NONE_WITH_REASON:no-rollback"
    f" | {_EVIDENCE_PATH}"
    " | PENDING_REVIEW | PENDING_REVIEW | . | . |"
)
_MATRIX_SECTION = (
    f"\n## Architecture Binding Matrix\n\n{_MATRIX_HEADER}\n{_MATRIX_SEP}\n{_MATRIX_ROW}\n"
)


def _make_required_text(
    *,
    commit: str = _REAL_REVIEW_COMMIT,
    sha: str = _REAL_REVIEW_SHA256,
    review_path: str = _REAL_REVIEW_PATH,
    dispatch_surface: str = "EXTERNAL_AGENT_CLI_MCP",
) -> str:
    """Minimal work order text that reaches the ACCEPTED_BOUNDED/SHA256 validation."""
    return (
        f"dispatchSurface: {dispatch_surface}\n"
        "Architecture-Readiness Admission: REQUIRED\n"
        "architectureMatrixSchema: cvf.dara.architectureBindingMatrix.v1\n"
        "architectureMatrixRowCount: 1\n"
        "architectureMatrixCanonicalDigest: placeholder\n"
        "architectureMatrixDigestRecipe: standard\n"
        "architectureMachineDisposition: PENDING_REVIEW\n"
        "architectureSemanticDisposition: ACCEPTED_BOUNDED\n"
        f"architectureSemanticReviewPath: {review_path}\n"
        f"architectureSemanticReviewCommit: {commit}\n"
        f"architectureSemanticReviewFileSha256: {sha}\n"
        "cumulativeExternalInvocationCount: 0\n"
        "externalInvocationCeiling: 1\n"
        f"{_MATRIX_SECTION}\n"
    )


def _check(text: str) -> list[str]:
    return dispatch_quality._validate_architecture_readiness_admission(
        "docs/work_orders/test.md", text
    )


class TestR101ExternalDeclarationOmission(unittest.TestCase):
    """AM-01: EXTERNAL_AGENT_CLI_MCP work orders must have exactly one
    Architecture-Readiness Admission declaration; absence is BLOCKED (not empty
    list). HT-02 corrected: the original 'return []' on absent declaration is
    replaced with a fail-closed error for external dispatch."""

    def test_external_omission_returns_blocked_error_not_empty_list(self) -> None:
        """AM-01: absent declaration on EXTERNAL_AGENT_CLI_MCP -> blocked error."""
        text = "dispatchSurface: EXTERNAL_AGENT_CLI_MCP\nsome content without a declaration"
        issues = _check(text)
        self.assertTrue(issues, "expected a blocking issue for absent external declaration")
        self.assertTrue(
            any("BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED" in i for i in issues),
            f"expected BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED in issues, got: {issues}",
        )

    def test_internal_omission_still_silently_passes(self) -> None:
        """Internal dispatch omission is still non-applicable and returns no issues."""
        text = "dispatchSurface: INTERNAL_AGENT\nsome content without a declaration"
        issues = _check(text)
        self.assertEqual(issues, [])

    def test_absent_dispatch_surface_omission_silently_passes(self) -> None:
        """If dispatchSurface is not EXTERNAL_AGENT_CLI_MCP, omission is not blocked."""
        text = "some content without any dispatch surface or declaration"
        issues = _check(text)
        self.assertEqual(issues, [])


class TestR101LowRiskPrefix(unittest.TestCase):
    """AM-02 and AM-03: NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON handling."""

    def test_low_risk_with_non_empty_reason_passes(self) -> None:
        """AM-02: NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON with reason -> no issues."""
        text = (
            "dispatchSurface: EXTERNAL_AGENT_CLI_MCP\n"
            "Architecture-Readiness Admission: NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON:documentation-only-no-design-change"
        )
        issues = _check(text)
        self.assertEqual(issues, [])

    def test_low_risk_without_reason_suffix_fails(self) -> None:
        """AM-03: NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON: with empty suffix -> error."""
        text = (
            "dispatchSurface: EXTERNAL_AGENT_CLI_MCP\n"
            "Architecture-Readiness Admission: NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON:"
        )
        issues = _check(text)
        self.assertTrue(issues, "expected an error for empty reason suffix")
        self.assertTrue(
            any("non-empty reason" in i for i in issues),
            f"expected 'non-empty reason' in issues, got: {issues}",
        )


class TestR102CommittedHashValidation(unittest.TestCase):
    """AM-04 and AM-05: committed bytes SHA256 + ancestor validation.

    Positive tests use the real accepted review commit; no fabricated commit
    appears in any positive test case per the DARA standard.
    """

    def test_non_hex_commit_format_rejected(self) -> None:
        """AM-04: commit that is not 40 lowercase hex chars -> error."""
        text = _make_required_text(commit="not-a-valid-hex-commit", sha="abc123")
        issues = _check(text)
        self.assertTrue(
            any("40 lowercase hex" in i for i in issues),
            f"expected 40-lowercase-hex error, got: {issues}",
        )

    def test_correct_commit_but_wrong_sha256_reports_mismatch(self) -> None:
        """AM-05: real ancestor commit + wrong SHA256 -> committed-bytes mismatch error."""
        text = _make_required_text(sha="0" * 64)
        issues = _check(text)
        sha_issues = [i for i in issues if "committed bytes" in i or "does not match" in i]
        self.assertTrue(sha_issues, f"expected sha256 mismatch error, got: {issues}")

    def test_correct_commit_and_correct_sha256_no_mismatch_error(self) -> None:
        """AM-05 positive: real ancestor commit + correct SHA256 -> no sha-mismatch error.

        Uses the committed bytes of the actual accepted review (not working-tree bytes).
        This test will fail if someone modifies the committed review file.
        """
        text = _make_required_text()
        issues = _check(text)
        sha_mismatch = [i for i in issues if "committed bytes" in i and "FileSha256" in i or
                        ("committed bytes" in i and "changed after acceptance" in i)]
        self.assertFalse(
            sha_mismatch,
            f"unexpected sha256 mismatch error with correct committed hash: {sha_mismatch}",
        )


class TestR103ChainValidation(unittest.TestCase):
    """AM-06: trustSource, contextCarrierPath/contextField, evidenceOutputPath,
    rollbackPaths closed-chain field validation via _validate_architecture_matrix_row_identity."""

    def _base_row(self, **overrides: str) -> dict[str, str]:
        base = {
            "criterionId": "AM-06-TEST",
            "riskClass": "HIGH",
            "behaviorIdentity": "test-behavior",
            "canonicalOwnerPath": _RANGE_PATH,
            "canonicalOwnerLocator": _RANGE_FN,
            "implementationDisposition": "EXTEND_EXISTING",
            "implementationPath": _RANGE_PATH,
            "implementationSymbol": _RANGE_FN,
            "producerPath": _RANGE_PATH,
            "producerSymbol": _RANGE_FN,
            "trustSource": f"{_RANGE_PATH}:{_RANGE_FN}",
            "contextCarrierPath": _RANGE_PATH,
            "contextField": _RANGE_FN,
            "exportPath": _RANGE_PATH,
            "exportSymbol": _RANGE_FN,
            "registrationPath": _RANGE_PATH,
            "registrationSymbol": "NONE_WITH_REASON:not-registered",
            "compositionRootPath": _RANGE_PATH,
            "compositionRootSymbol": _RANGE_FN,
            "runtimeConsumerPath": "",
            "runtimeConsumerSymbol": "NONE_WITH_REASON:CONTRACT_ONLY_no-non-test-consumer",
            "positiveTestPath": _THIS_TEST_PATH,
            "negativeTestPath": _THIS_TEST_PATH,
            "bypassTestPath": _THIS_TEST_PATH,
            "compositionTestPath": _THIS_TEST_PATH,
            "compatibilityDisposition": "NONE_WITH_REASON:no-compat-gap",
            "rollbackPaths": "NONE_WITH_REASON:no-rollback",
            "evidenceOutputPath": _EVIDENCE_PATH,
            "machineDisposition": "PENDING_REVIEW",
            "semanticAcceptance": "PENDING_REVIEW",
            "semanticReviewPath": ".",
            "semanticReviewCommit": ".",
        }
        base.update(overrides)
        return base

    def test_trust_source_missing_locator_fails(self) -> None:
        row = self._base_row(trustSource="governance/compat/check_work_order_dispatch_quality_range.py")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("trustSource" in i and "path>:<locator>" in i for i in issues))

    def test_trust_source_archive_path_rejected(self) -> None:
        row = self._base_row(trustSource=".private_reference/secret.md:SomeClass")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("trustSource" in i and "rejected" in i for i in issues))

    def test_trust_source_traversal_rejected(self) -> None:
        row = self._base_row(trustSource="../outside.py:fn")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("trustSource" in i and "rejected" in i for i in issues))

    def test_trust_source_absolute_path_rejected(self) -> None:
        row = self._base_row(trustSource="/abs/path.py:fn")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("trustSource" in i and "rejected" in i for i in issues))

    def test_trust_source_valid_path_passes(self) -> None:
        row = self._base_row(trustSource=f"{_RANGE_PATH}:{_RANGE_FN}")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertFalse(any("trustSource" in i for i in issues), f"unexpected trust errors: {[i for i in issues if 'trustSource' in i]}")

    def test_context_carrier_field_not_in_file_fails(self) -> None:
        row = self._base_row(contextField="nonexistent_field_xyz_not_present")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("contextField" in i for i in issues))

    def test_context_carrier_path_nonexistent_fails(self) -> None:
        row = self._base_row(contextCarrierPath="docs/nonexistent/file.md", contextField="anything")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("contextCarrierPath" in i for i in issues))

    def test_evidence_output_path_wrong_directory_fails(self) -> None:
        row = self._base_row(evidenceOutputPath="docs/wrong/SOME_FILE_2026-09-06.md")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("evidenceOutputPath" in i and "authorized" in i for i in issues))

    def test_evidence_output_path_no_date_fails(self) -> None:
        row = self._base_row(evidenceOutputPath="docs/reviews/SOME_FILE_NO_DATE.md")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("evidenceOutputPath" in i and "YYYY-MM-DD" in i for i in issues))

    def test_evidence_output_path_valid_authorized_dir_passes(self) -> None:
        row = self._base_row(evidenceOutputPath=_EVIDENCE_PATH)
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertFalse(any("evidenceOutputPath" in i for i in issues), f"unexpected evidence errors: {[i for i in issues if 'evidenceOutputPath' in i]}")

    def test_rollback_path_traversal_rejected(self) -> None:
        row = self._base_row(rollbackPaths="../some/path.py")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("rollbackPaths" in i and ("absolute" in i or "traversal" in i) for i in issues))

    def test_rollback_path_absolute_rejected(self) -> None:
        row = self._base_row(rollbackPaths="C:\\windows\\path.py")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertTrue(any("rollbackPaths" in i for i in issues))

    def test_rollback_path_none_with_reason_passes(self) -> None:
        row = self._base_row(rollbackPaths="NONE_WITH_REASON:no-rollback")
        issues = source_validation._validate_architecture_matrix_row_identity(row)
        self.assertFalse(any("rollbackPaths" in i for i in issues))


class TestValidatorScaffoldIntegration(unittest.TestCase):
    """Validator-hostile tests relocated from test_build_dispatch_packet_scaffold.py.

    These tests were originally tests 4-5 of TestArchitectureReadinessAdmissionScaffold.
    Consolidated here because they import the dispatch-quality validator.
    """

    def test_blocked_unclassified_default_fails_the_architecture_validator(self) -> None:
        """The scaffold's BLOCKED_UNCLASSIFIED default must report a blocking issue,
        proving the default is genuinely fail-closed rather than a disguised pass."""
        import build_dispatch_packet_scaffold as scaffold

        args = scaffold.ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            title="test", batch_id="TEST-001", date="2026-09-07",
            base="abc1234", commit_mode="WORKER_MUST_NOT_COMMIT",
            dispatch_surface="EXTERNAL_AGENT_CLI_MCP",
        )
        work_order = scaffold.build_work_order(args, scaffold.detect_triggers(args))
        issues = dispatch_quality._validate_architecture_readiness_admission(
            "docs/work_orders/test.md", work_order
        )
        self.assertTrue(issues)
        self.assertTrue(any("UNCLASSIFIED" in issue for issue in issues))

    def test_internal_agent_default_passes_the_architecture_validator_with_no_issues(
        self,
    ) -> None:
        """The internal-agent default is non-applicable: it must not raise any issue."""
        import build_dispatch_packet_scaffold as scaffold

        args = scaffold.ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            title="test", batch_id="TEST-001", date="2026-09-07",
            base="abc1234", commit_mode="WORKER_MUST_NOT_COMMIT",
            dispatch_surface="INTERNAL_AGENT",
        )
        work_order = scaffold.build_work_order(args, scaffold.detect_triggers(args))
        issues = dispatch_quality._validate_architecture_readiness_admission(
            "docs/work_orders/test.md", work_order
        )
        self.assertEqual(issues, [])


class TestHtIrNegativeCases(unittest.TestCase):
    """HT-IR-01 through HT-IR-14: Internal recovery acceptance matrix.

    Covers the repaired predicates required by DARA-T2-R3 (committed
    R3 finding set from the final implementation completion review).

    HT-IR-01: genuine accepted echo identity -> no blocking issue (PASS).
    HT-IR-02: fabricated commit -> blocking identity issue.
    HT-IR-03: non-ancestor commit -> blocking identity issue.
    HT-IR-04: review path missing from commit -> blocking identity issue.
    HT-IR-05: wrong committed-byte SHA -> blocking identity issue.
    HT-IR-06: arbitrary canonical digest alone, every other field genuinely
        valid -> blocking (digest verified against committed review bytes).
    HT-IR-06B: missing architectureSemanticReviewFileSha256 -> blocking.
    HT-IR-06C: missing architectureBindingEchoDisposition -> blocking.
    HT-IR-07: required criterion absent from committed review bytes -> blocking.
    HT-IR-08: trust locator absent from cited bytes -> blocking locator issue.
    HT-IR-09: rollback path AGENTS.md outside writable manifest -> blocking.
    HT-IR-10: private legacy (`.private_reference/`) trust source -> blocking authority issue.
    HT-IR-11: private legacy (`.private_reference/`) canonical owner -> blocking authority issue.
    HT-IR-12: private legacy (`archive/`) canonical owner -> blocking authority issue.
    HT-IR-12B: private legacy (`ECOSYSTEM/private/`) canonical owner -> blocking authority issue.
    HT-IR-13: valid public canonical owner and valid locator -> PASS.
    HT-IR-14: both worker-return scaffold routes emit exact identity-echo parity.

    HT-IR-08 through HT-IR-13 exercise realistic parsed work-order/matrix
    input via `_make_matrix_text` + `_check` (the real markdown-table parser
    `_architecture_matrix_rows` and the top-level validator entry point),
    not hand-built row dicts carrying fields the matrix schema cannot
    actually populate from parsed markdown.
    """

    def _make_echo_text(
        self,
        *,
        commit: str = _REAL_REVIEW_COMMIT,
        sha: str | None = _REAL_REVIEW_SHA256,
        review_path: str = _REAL_REVIEW_PATH,
        digest: str = "8d82ed44b5f5e66576639e54e610f4bd659210561fe6a2b6ac1a4b8b15b221b2",
        echo_disposition: str | None = "EXACT_MATCH",
    ) -> str:
        """Minimal accepted-design-echo work order text. Passing ``sha`` or
        ``echo_disposition`` as ``None`` omits that field line entirely, to
        exercise the missing-mandatory-field fail-closed cases."""
        sha_line = f"architectureSemanticReviewFileSha256: {sha}\n" if sha is not None else ""
        echo_line = (
            f"architectureBindingEchoDisposition: {echo_disposition}\n"
            if echo_disposition is not None else ""
        )
        return (
            "dispatchSurface: INTERNAL_AGENT\n"
            "Architecture-Readiness Admission: NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO\n"
            f"architectureMatrixCanonicalDigest: {digest}\n"
            f"architectureSemanticReviewPath: {review_path}\n"
            f"architectureSemanticReviewCommit: {commit}\n"
            f"{sha_line}"
            f"{echo_line}"
        )

    def _check_echo(self, text: str) -> list[str]:
        return dispatch_quality._validate_architecture_readiness_admission(
            "docs/work_orders/test_ir.md", text
        )

    _MATRIX_HEADER_32 = (
        "| criterionId | riskClass | behaviorIdentity | canonicalOwnerPath | canonicalOwnerLocator"
        " | implementationDisposition | implementationPath | implementationSymbol"
        " | producerPath | producerSymbol | trustSource | contextCarrierPath | contextField"
        " | exportPath | exportSymbol | registrationPath | registrationSymbol"
        " | compositionRootPath | compositionRootSymbol | runtimeConsumerPath | runtimeConsumerSymbol"
        " | positiveTestPath | negativeTestPath | bypassTestPath | compositionTestPath"
        " | compatibilityDisposition | rollbackPaths | evidenceOutputPath"
        " | machineDisposition | semanticAcceptance | semanticReviewPath | semanticReviewCommit |"
    )
    _MATRIX_SEP_32 = "| --- " * 32 + "|"

    def _make_matrix_text(
        self,
        criterion_id: str,
        behavior: str,
        *,
        canonical_owner_path: str = _RANGE_PATH,
        canonical_owner_locator: str = _RANGE_FN,
        trust_source: str | None = None,
    ) -> str:
        """Build a realistic full REQUIRED work-order text with one parsed
        matrix row, going through the same markdown-table parser
        (`_architecture_matrix_rows`) a real dispatch packet would use. This
        proves the closed-chain authority rejection fires on genuinely
        parsed input, not only on a hand-built row dict carrying fields the
        matrix schema cannot actually populate from markdown."""
        trust = trust_source if trust_source is not None else f"{_RANGE_PATH}:{_RANGE_FN}"
        matrix_row = (
            f"| {criterion_id} | HIGH | {behavior} | {canonical_owner_path} | {canonical_owner_locator}"
            f" | EXTEND_EXISTING | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {trust}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:not-registered | NONE_WITH_REASON:not-registered"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer"
            f" | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH}"
            f" | NONE_WITH_REASON:no-compat-gap | NONE_WITH_REASON:no-rollback"
            f" | {_EVIDENCE_PATH}"
            " | PENDING_REVIEW | PENDING_REVIEW | . | . |"
        )
        return (
            "dispatchSurface: EXTERNAL_AGENT_CLI_MCP\n"
            "Architecture-Readiness Admission: REQUIRED\n"
            "architectureMatrixSchema: cvf.dara.architectureBindingMatrix.v1\n"
            "architectureMatrixRowCount: 1\n"
            "architectureMatrixCanonicalDigest: placeholder\n"
            "architectureMatrixDigestRecipe: standard\n"
            "architectureMachineDisposition: PENDING_REVIEW\n"
            "architectureSemanticDisposition: ACCEPTED_BOUNDED\n"
            f"architectureSemanticReviewPath: {_REAL_REVIEW_PATH}\n"
            f"architectureSemanticReviewCommit: {_REAL_REVIEW_COMMIT}\n"
            f"architectureSemanticReviewFileSha256: {_REAL_REVIEW_SHA256}\n"
            "cumulativeExternalInvocationCount: 0\n"
            "externalInvocationCeiling: 1\n"
            f"\n## Architecture Binding Matrix\n\n{self._MATRIX_HEADER_32}\n{self._MATRIX_SEP_32}\n{matrix_row}\n"
        )

    # HT-IR-01: genuine accepted echo identity -> PASS (no blocking issue).
    def test_ht_ir_01_genuine_accepted_echo_identity_passes(self) -> None:
        """HT-IR-01: a fully genuine, complete committed echo identity (real
        commit, real committed-bytes SHA, digest attested by the committed
        review bytes, and a permitted `EXACT_MATCH` echo disposition)
        produces zero issues of any kind, not merely zero identity-labeled
        issues. This is a strict complete-positive case: any new fail-open
        or fail-closed regression in any predicate must surface here."""
        text = self._make_echo_text()
        issues = self._check_echo(text)
        self.assertEqual(
            issues, [],
            f"HT-IR-01: expected zero issues with a genuine complete echo identity, got: {issues}",
        )

    # HT-IR-02: fabricated commit -> blocking identity issue.
    def test_ht_ir_02_fabricated_commit_blocked(self) -> None:
        """HT-IR-02: fabricated commit string (not 40 lowercase hex) -> blocking error."""
        text = self._make_echo_text(commit="fabricated-not-a-real-commit")
        issues = self._check_echo(text)
        self.assertTrue(
            any("40 lowercase hex" in i or "not an ancestor" in i for i in issues),
            f"HT-IR-02: expected 40-lowercase-hex or ancestor error, got: {issues}",
        )

    # HT-IR-03: non-ancestor commit -> blocking identity issue.
    def test_ht_ir_03_non_ancestor_commit_blocked(self) -> None:
        """HT-IR-03: well-formed 40-hex commit that is not an ancestor of HEAD."""
        # Use a valid-looking SHA that is virtually certain to not be in this repo.
        text = self._make_echo_text(commit="0" * 40)
        issues = self._check_echo(text)
        self.assertTrue(
            any("not an ancestor" in i for i in issues),
            f"HT-IR-03: expected non-ancestor error, got: {issues}",
        )

    # HT-IR-04: review path missing from commit -> blocking identity issue.
    def test_ht_ir_04_review_path_missing_from_commit_blocked(self) -> None:
        """HT-IR-04: path does not exist in the referenced commit -> blocking error."""
        # Use a path that does not exist in the real commit.
        text = self._make_echo_text(
            review_path="docs/reviews/CVF_NONEXISTENT_REVIEW_FILE_2026-09-07.md",
        )
        issues = self._check_echo(text)
        # Either the path does not exist on disk (exists_rel check) or not in the commit.
        self.assertTrue(
            any("architectureSemanticReviewPath" in i or "does not exist" in i for i in issues),
            f"HT-IR-04: expected review-path error, got: {issues}",
        )

    # HT-IR-05: wrong committed-byte SHA -> blocking identity issue.
    def test_ht_ir_05_wrong_committed_byte_sha_blocked(self) -> None:
        """HT-IR-05: real ancestor commit + wrong SHA256 -> committed-bytes mismatch error."""
        text = self._make_echo_text(sha="0" * 64)
        issues = self._check_echo(text)
        self.assertTrue(
            any("committed" in i and ("bytes" in i or "match" in i) for i in issues),
            f"HT-IR-05: expected committed-bytes mismatch error, got: {issues}",
        )

    # HT-IR-06: arbitrary canonical digest, with every OTHER identity field
    # genuinely valid (real commit, real committed-bytes SHA), is rejected
    # on the digest alone. This proves the digest is verified against the
    # immutable committed review bytes, not merely checked for non-emptiness.
    def test_ht_ir_06_arbitrary_digest_alone_is_rejected(self) -> None:
        """HT-IR-06: real commit + real SHA + arbitrary digest not attested by
        the committed review bytes -> blocked on the digest alone."""
        text = self._make_echo_text(digest="0" * 64)
        issues = self._check_echo(text)
        self.assertFalse(
            any("committed bytes" in i and "changed after acceptance" in i for i in issues),
            f"HT-IR-06: SHA must not itself be flagged (it is genuine), got: {issues}",
        )
        self.assertTrue(
            any("architectureMatrixCanonicalDigest" in i and "not attested" in i for i in issues),
            f"HT-IR-06: expected the digest-alone attestation error, got: {issues}",
        )

    # HT-IR-06B: missing architectureSemanticReviewFileSha256, every other
    # field genuinely valid -> blocked (mandatory field fails closed).
    def test_ht_ir_06b_missing_sha_blocked(self) -> None:
        """HT-IR-06B: real commit + real digest + real echo disposition, but
        no `architectureSemanticReviewFileSha256` field at all -> blocked."""
        text = self._make_echo_text(sha=None)
        issues = self._check_echo(text)
        self.assertTrue(
            any("architectureSemanticReviewFileSha256" in i for i in issues),
            f"HT-IR-06B: expected a missing-SHA error, got: {issues}",
        )

    # HT-IR-06C: missing architectureBindingEchoDisposition, every other
    # field genuinely valid -> blocked (mandatory field fails closed).
    def test_ht_ir_06c_missing_echo_disposition_blocked(self) -> None:
        """HT-IR-06C: real commit + real SHA + real digest, but no
        `architectureBindingEchoDisposition` field at all -> blocked."""
        text = self._make_echo_text(echo_disposition=None)
        issues = self._check_echo(text)
        self.assertTrue(
            any("architectureBindingEchoDisposition" in i for i in issues),
            f"HT-IR-06C: expected a missing-echo-disposition error, got: {issues}",
        )

    # HT-IR-07: required criterion absent from committed review.
    def test_ht_ir_07_criterion_absent_from_committed_review_blocked(self) -> None:
        """HT-IR-07: genuinely committed review that lacks a fabricated criterionId -> blocked."""
        # Build a REQUIRED text that references the real review file but asks for a
        # criterionId that does not appear in the committed bytes of that review.
        fabricated_criterion = "CRITERION-DEFINITELY-NOT-IN-REVIEW-XYZ-99999"
        matrix_header = (
            "| criterionId | riskClass | behaviorIdentity | canonicalOwnerPath | canonicalOwnerLocator"
            " | implementationDisposition | implementationPath | implementationSymbol"
            " | producerPath | producerSymbol | trustSource | contextCarrierPath | contextField"
            " | exportPath | exportSymbol | registrationPath | registrationSymbol"
            " | compositionRootPath | compositionRootSymbol | runtimeConsumerPath | runtimeConsumerSymbol"
            " | positiveTestPath | negativeTestPath | bypassTestPath | compositionTestPath"
            " | compatibilityDisposition | rollbackPaths | evidenceOutputPath"
            " | machineDisposition | semanticAcceptance | semanticReviewPath | semanticReviewCommit |"
        )
        matrix_sep = "| --- " * 32 + "|"
        matrix_row = (
            f"| {fabricated_criterion} | HIGH | ht-ir-07-behavior | {_RANGE_PATH} | {_RANGE_FN}"
            f" | EXTEND_EXISTING | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH}:{_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:not-registered | NONE_WITH_REASON:not-registered"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer"
            f" | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH}"
            f" | NONE_WITH_REASON:no-compat-gap | NONE_WITH_REASON:no-rollback"
            f" | {_EVIDENCE_PATH}"
            " | PENDING_REVIEW | PENDING_REVIEW | . | . |"
        )
        text = (
            "dispatchSurface: EXTERNAL_AGENT_CLI_MCP\n"
            "Architecture-Readiness Admission: REQUIRED\n"
            "architectureMatrixSchema: cvf.dara.architectureBindingMatrix.v1\n"
            "architectureMatrixRowCount: 1\n"
            "architectureMatrixCanonicalDigest: placeholder\n"
            "architectureMatrixDigestRecipe: standard\n"
            "architectureMachineDisposition: PENDING_REVIEW\n"
            "architectureSemanticDisposition: ACCEPTED_BOUNDED\n"
            f"architectureSemanticReviewPath: {_REAL_REVIEW_PATH}\n"
            f"architectureSemanticReviewCommit: {_REAL_REVIEW_COMMIT}\n"
            f"architectureSemanticReviewFileSha256: {_REAL_REVIEW_SHA256}\n"
            "cumulativeExternalInvocationCount: 0\n"
            "externalInvocationCeiling: 1\n"
            f"\n## Architecture Binding Matrix\n\n{matrix_header}\n{matrix_sep}\n{matrix_row}\n"
        )
        issues = _check(text)
        self.assertTrue(
            any("criterionId" in i and fabricated_criterion in i for i in issues),
            f"HT-IR-07: expected criterionId-not-in-review error, got: {issues}",
        )

    # HT-IR-08: trust locator absent from cited bytes.
    def test_ht_ir_08_trust_locator_absent_from_cited_bytes_blocked(self) -> None:
        """HT-IR-08: realistic parsed work order with an existing trust
        source path but a locator not present in that file's bytes -> blocked."""
        text = self._make_matrix_text(
            "HT-IR-08", "ht-ir-08-behavior",
            trust_source=f"{_RANGE_PATH}:LOCATOR_THAT_DOES_NOT_EXIST_7F3A_HT_IR_08",
        )
        issues = _check(text)
        self.assertTrue(
            any("trustSource" in i and "locator" in i and "BLOCKED_LOCATOR_NOT_IN_AUTHORITY" in i for i in issues),
            f"HT-IR-08: expected BLOCKED_LOCATOR_NOT_IN_AUTHORITY in trustSource error, got: {issues}",
        )

    # HT-IR-09: rollback path AGENTS.md outside writable manifest -> blocking.
    def test_ht_ir_09_rollback_outside_writable_manifest_blocked(self) -> None:
        """HT-IR-09: realistic parsed work order whose rollback path
        `AGENTS.md` is outside its own declared `Planned Worker Fulfillment
        Manifest` table -> blocked. Proves the manifest is genuinely
        extracted from parsed markdown, not injected as a raw set."""
        text = self._make_matrix_text("HT-IR-09", "ht-ir-09-behavior")
        # Insert a matrix row with rollbackPaths=AGENTS.md and a manifest
        # table that does not include AGENTS.md.
        matrix_row = (
            f"| HT-IR-09-ROLLBACK | HIGH | ht-ir-09-rollback-behavior | {_RANGE_PATH} | {_RANGE_FN}"
            f" | EXTEND_EXISTING | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH}:{_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:not-registered | NONE_WITH_REASON:not-registered"
            f" | {_RANGE_PATH} | {_RANGE_FN}"
            " | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer | NONE_WITH_REASON:CONTRACT_ONLY_no-consumer"
            f" | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH} | {_THIS_TEST_PATH}"
            f" | NONE_WITH_REASON:no-compat-gap | AGENTS.md"
            f" | {_EVIDENCE_PATH}"
            " | PENDING_REVIEW | PENDING_REVIEW | . | . |"
        )
        manifest_section = (
            "\n## Planned Worker Fulfillment Manifest\n\n"
            "| Path | Required at handoff | Purpose |\n"
            "| --- | --- | --- |\n"
            f"| `{_RANGE_PATH}` | Yes | test |\n"
            f"| `{_THIS_TEST_PATH}` | Yes | test |\n"
            f"| `{_EVIDENCE_PATH}` | Yes | test |\n"
        )
        text = (
            text.replace(
                f"\n\n{self._MATRIX_HEADER_32}\n{self._MATRIX_SEP_32}\n",
                f"\n\n{self._MATRIX_HEADER_32}\n{self._MATRIX_SEP_32}\n{matrix_row}\n",
            )
            + manifest_section
        )
        issues = _check(text)
        self.assertTrue(
            any("rollbackPaths" in i and "BLOCKED_ROLLBACK_OUTSIDE_WRITABLE_MANIFEST" in i for i in issues),
            f"HT-IR-09: expected BLOCKED_ROLLBACK_OUTSIDE_WRITABLE_MANIFEST, got: {issues}",
        )

    # HT-IR-10: private legacy trust source -> blocking authority issue.
    def test_ht_ir_10_private_legacy_trust_source_blocked(self) -> None:
        """HT-IR-10: realistic parsed work order with a trustSource path
        under `.private_reference/` -> blocked."""
        text = self._make_matrix_text(
            "HT-IR-10", "ht-ir-10-behavior",
            trust_source=".private_reference/secret.md:SomeLocator",
        )
        issues = _check(text)
        self.assertTrue(
            any("trustSource" in i and "rejected" in i for i in issues),
            f"HT-IR-10: expected trustSource rejected error, got: {issues}",
        )

    # HT-IR-11: private legacy canonical owner -> blocking authority issue.
    def test_ht_ir_11_private_legacy_canonical_owner_blocked(self) -> None:
        """HT-IR-11: realistic parsed work order with a canonicalOwnerPath
        under `.private_reference/` -> blocked."""
        text = self._make_matrix_text(
            "HT-IR-11", "ht-ir-11-behavior",
            canonical_owner_path=".private_reference/secret_owner.py",
            canonical_owner_locator="SomeClass",
        )
        issues = _check(text)
        self.assertTrue(
            any("canonicalOwnerPath" in i and "rejected" in i for i in issues),
            f"HT-IR-11: expected canonicalOwnerPath rejected error, got: {issues}",
        )

    # HT-IR-12: private legacy canonical owner under archive/ -> blocking authority issue.
    def test_ht_ir_12_private_legacy_archive_canonical_owner_blocked(self) -> None:
        """HT-IR-12: realistic parsed work order with a canonicalOwnerPath
        under `archive/` -> blocked."""
        text = self._make_matrix_text(
            "HT-IR-12", "ht-ir-12-behavior",
            canonical_owner_path="docs/reviews/archive/old_review.md",
            canonical_owner_locator="SomeSymbol",
        )
        issues = _check(text)
        self.assertTrue(
            any("canonicalOwnerPath" in i and "rejected" in i for i in issues),
            f"HT-IR-12: expected canonicalOwnerPath rejected error, got: {issues}",
        )

    # HT-IR-12B: canonicalOwnerPath under ECOSYSTEM/private/ -> blocking.
    def test_ht_ir_12b_ecosystem_private_canonical_owner_blocked(self) -> None:
        """HT-IR-12B: realistic parsed work order with a canonicalOwnerPath
        under `ECOSYSTEM/private/` -> blocked. Proves the normalized
        authority-rejection helper covers this authority family, not only
        `.private_reference/` and `archive/`."""
        text = self._make_matrix_text(
            "HT-IR-12B", "ht-ir-12b-behavior",
            canonical_owner_path="ECOSYSTEM/private/secret_owner.py",
            canonical_owner_locator="SomeSymbol",
        )
        issues = _check(text)
        self.assertTrue(
            any("canonicalOwnerPath" in i and "rejected" in i for i in issues),
            f"HT-IR-12B: expected canonicalOwnerPath rejected error, got: {issues}",
        )

    # HT-IR-13: valid public canonical owner/authority and valid locator -> PASS.
    def test_ht_ir_13_valid_public_owner_and_valid_locator_passes(self) -> None:
        """HT-IR-13: realistic parsed work order with a valid public path as
        canonicalOwnerPath and a locator present in that file's bytes ->
        no owner/locator errors."""
        text = self._make_matrix_text("HT-IR-13", "ht-ir-13-behavior")
        issues = _check(text)
        owner_issues = [i for i in issues if "canonicalOwnerPath" in i and "rejected" in i]
        locator_issues = [i for i in issues if "trustSource" in i and "locator" in i]
        self.assertFalse(owner_issues, f"HT-IR-13: unexpected owner rejection: {owner_issues}")
        self.assertFalse(locator_issues, f"HT-IR-13: unexpected locator issue: {locator_issues}")

    # HT-IR-14: both worker-return scaffold routes emit exact identity-echo parity.
    def test_ht_ir_14_both_scaffold_routes_emit_echo_parity(self) -> None:
        """HT-IR-14: run_worker_return_scaffold and build_worker_return_skeleton_scaffold
        both emit the same six accepted identity fields (echo parity)."""
        import run_worker_return_scaffold as rws
        import build_worker_return_skeleton_scaffold as bwss

        # Collect echo field names from both modules' output helpers.
        echo_fields = source_validation.ARCHITECTURE_ECHO_FIELDS
        # Verify both modules export the same set of six echo field constants.
        rws_fields = getattr(rws, "ARCHITECTURE_ECHO_FIELDS", None)
        bwss_fields = getattr(bwss, "ARCHITECTURE_ECHO_FIELDS", None)
        if rws_fields is not None:
            self.assertEqual(
                set(rws_fields), set(echo_fields),
                "HT-IR-14: run_worker_return_scaffold ARCHITECTURE_ECHO_FIELDS mismatch",
            )
        if bwss_fields is not None:
            self.assertEqual(
                set(bwss_fields), set(echo_fields),
                "HT-IR-14: build_worker_return_skeleton_scaffold ARCHITECTURE_ECHO_FIELDS mismatch",
            )
        # Verify both modules can be imported without error (import parity).
        self.assertIsNotNone(rws, "HT-IR-14: run_worker_return_scaffold import failed")
        self.assertIsNotNone(bwss, "HT-IR-14: build_worker_return_skeleton_scaffold import failed")


if __name__ == "__main__":
    unittest.main()
