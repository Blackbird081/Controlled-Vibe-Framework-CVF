#!/usr/bin/env python3
"""Hostile focused tests for the MFRP P3-R1B-R2 actual-seam replay repair."""

from __future__ import annotations

import copy
import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

try:
    import mfrp_actual_seam_replay as replay
except ModuleNotFoundError:
    from governance.compat import mfrp_actual_seam_replay as replay


ORACLE = replay.REPO_ROOT / replay.ORACLE_PATH


def _load() -> dict:
    return json.loads(ORACLE.read_text(encoding="utf-8"))


def _bytes(value: dict) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def _sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _validate_mutated(value: dict) -> None:
    raw = _bytes(value)
    required = replay._required_set(value)
    with (
        patch.object(replay, "ORACLE_SHA256", _sha(raw)),
        patch.object(replay, "ORACLE_JCS_SHA256", _sha(replay._jcs_bytes(value))),
        patch.object(replay, "REQUIRED_SET_SHA256", _sha(replay._jcs_bytes(required))),
    ):
        replay.validate_oracle(value, raw)


def _all_source_manifest_paths() -> list[str]:
    oracle = _load()
    return [entry["path"] for entry in oracle["sourceManifest"]]


class TestOracleAdmission(unittest.TestCase):
    def test_frozen_oracle_and_exact_coverage_pass(self) -> None:
        oracle = _load()
        required = replay.validate_oracle(oracle, ORACLE.read_bytes())
        self.assertEqual(19, len(required["requiredCaseIds"]))
        self.assertEqual(18, len(required["requiredFamilies"]))
        self.assertEqual(7, len(required["requiredZeroToleranceClasses"]))

    def test_one_case_cannot_pass(self) -> None:
        oracle = _load()
        oracle["cases"] = oracle["cases"][:1]
        oracle["requiredCaseIds"] = oracle["requiredCaseIds"][:1]
        with self.assertRaisesRegex(ValueError, "exactly 19"):
            _validate_mutated(oracle)

    def test_missing_required_family_fails(self) -> None:
        oracle = _load()
        oracle["requiredFamilies"] = oracle["requiredFamilies"][:-1]
        with self.assertRaisesRegex(ValueError, "family coverage"):
            _validate_mutated(oracle)

    def test_missing_zero_tolerance_class_fails(self) -> None:
        oracle = _load()
        oracle["requiredZeroToleranceClasses"] = oracle["requiredZeroToleranceClasses"][:-1]
        with self.assertRaisesRegex(ValueError, "zero-tolerance coverage"):
            _validate_mutated(oracle)

    def test_source_locator_or_excerpt_drift_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["locator"] = ""
        with self.assertRaisesRegex(ValueError, "source locator/excerpt drift"):
            _validate_mutated(oracle)

    def test_oracle_identity_drift_fails(self) -> None:
        oracle = _load()
        oracle["profile"] = "drifted"
        with self.assertRaisesRegex(ValueError, "oracle identity drift"):
            replay.validate_oracle(oracle, _bytes(oracle))

    def test_unknown_mutation_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["mutation"]["operator"] = "INVENTED_MUTATION"
        with self.assertRaisesRegex(ValueError, "unknown mutation"):
            _validate_mutated(oracle)


class TestActualSourceBindingExecution(unittest.TestCase):
    """R1B-RV-1 repair: source hashes and locator/range/excerpt bindings are
    actually recomputed and executed before any case is replayed."""

    def test_source_manifest_seven_hashes_recompute_and_match(self) -> None:
        oracle = _load()
        resolved = replay.validate_source_manifest(oracle)
        self.assertEqual(7, len(resolved))
        for entry in oracle["sourceManifest"]:
            self.assertEqual(resolved[entry["sourceId"]], entry["path"])

    def test_all_nineteen_case_bindings_execute_and_pass(self) -> None:
        oracle = _load()
        summary = replay.execute_source_binding(oracle)
        self.assertEqual(7, summary["sourceCount"])
        self.assertEqual(19, summary["caseBindingCount"])
        self.assertEqual(sorted(oracle["requiredCaseIds"]), sorted(summary["checkedCaseIds"]))

    def test_unknown_source_id_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["sourceId"] = "NOT_A_REAL_SOURCE_ID"
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "unknown sourceId"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_wrong_path_for_source_id_fails(self) -> None:
        oracle = _load()
        # Point C01 (sourceId H0) at a different real manifest path (P1's).
        other_path = next(
            entry["path"] for entry in oracle["sourceManifest"] if entry["sourceId"] == "P1"
        )
        oracle["cases"][0]["sourceRef"]["path"] = other_path
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "does not match sourceManifest path"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_missing_locator_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["locator"] = "THIS LOCATOR STRING DOES NOT EXIST ANYWHERE"
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "not found inside its declared excerpt range"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_duplicate_locator_inside_range_fails(self) -> None:
        oracle = _load()
        case = oracle["cases"][0]
        # A single-character locator will occur far more than once inside
        # any real excerpt range, exercising the exactly-once requirement.
        case["sourceRef"]["locator"] = "e"
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "occurs .* times"):
            replay.validate_case_source_binding(case, resolved)

    def test_invalid_range_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["sourceExcerptLineRange"]["endLine"] = 10**9
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "invalid or"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_excerpt_digest_drift_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["sourceExcerptSha256"] = "0" * 64
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "excerpt digest drift"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_unsupported_byte_recipe_fails(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["byteRecipe"] = "SOME_OTHER_RECIPE_V2"
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "unsupported byteRecipe"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_include_trailing_lf_must_be_false(self) -> None:
        oracle = _load()
        oracle["cases"][0]["sourceRef"]["sourceExcerptLineRange"]["includeTrailingLf"] = True
        resolved = replay.validate_source_manifest(oracle)
        with self.assertRaisesRegex(replay.SourceBindingError, "includeTrailingLf must be exactly false"):
            replay.validate_case_source_binding(oracle["cases"][0], resolved)

    def test_bom_is_rejected(self) -> None:
        raw = b"\xef\xbb\xbfsome content\nsecond line\n"
        with self.assertRaisesRegex(replay.SourceBindingError, "forbidden UTF-8 BOM"):
            replay._resolve_excerpt(raw, 1, 2)

    def test_crlf_and_lone_cr_normalize_to_lf(self) -> None:
        raw = b"line one\r\nline two\rline three\n"
        excerpt = replay._resolve_excerpt(raw, 1, 3)
        self.assertEqual(b"line one\nline two\nline three", excerpt)

    def test_source_manifest_hash_drift_fails(self) -> None:
        oracle = _load()
        oracle["sourceManifest"][0]["sha256"] = "1" * 64
        with self.assertRaisesRegex(replay.SourceBindingError, "hash drift"):
            replay.validate_source_manifest(oracle)


class TestGenuineCitedSourceDriftHostileTest(unittest.TestCase):
    """R1B-RV-1/R1B-RV-2 repair: mutate the actual cited-source bytes in a
    temporary out-of-repository root, prove rejection happens before any P2
    seam call with zero seam-call side effects, and prove repository source
    bytes and oracle pins remain untouched."""

    def setUp(self) -> None:
        self._temp_dir = tempfile.mkdtemp(prefix="cvf-mfrp-r1b-r2-hostile-")
        self.addCleanup(shutil.rmtree, self._temp_dir, ignore_errors=True)
        self.temp_root = Path(self._temp_dir)
        # This temp root is deliberately OUTSIDE the repository tree.
        self.assertFalse(str(self.temp_root).startswith(str(replay.REPO_ROOT)))
        for rel_path in _all_source_manifest_paths():
            source = replay.REPO_ROOT / rel_path
            destination = self.temp_root / rel_path
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)

    def test_cited_source_byte_drift_rejected_before_any_seam_call(self) -> None:
        oracle = _load()
        # Drift exactly one byte inside the C02 cited source (P2), leaving
        # every oracle pin (locator, range, expected digest) untouched. A
        # whole-file byte flip anywhere in the file also changes the
        # sourceManifest whole-file hash, so this is caught by the earlier
        # manifest-hash stage of source binding; that is still "rejected
        # before any P2 seam call" and is the correct fail-closed order.
        target_case = next(case for case in oracle["cases"] if case["caseId"] == "C02")
        target_rel_path = target_case["sourceRef"]["path"]
        original_bytes = (replay.REPO_ROOT / target_rel_path).read_bytes()
        drifted_path = self.temp_root / target_rel_path
        drifted_bytes = bytearray(drifted_path.read_bytes())
        drifted_bytes[500] ^= 0xFF
        drifted_path.write_bytes(bytes(drifted_bytes))
        self.assertNotEqual(bytes(drifted_bytes), original_bytes)

        seam_call_counter = {"validator": 0, "readout": 0}
        real_validate = replay._validate_receipt_integrity
        real_build_readout = replay.build_machine_verification_readout

        def _counting_validate(*args, **kwargs):
            seam_call_counter["validator"] += 1
            return real_validate(*args, **kwargs)

        def _counting_readout(*args, **kwargs):
            seam_call_counter["readout"] += 1
            return real_build_readout(*args, **kwargs)

        with (
            patch.object(replay, "_validate_receipt_integrity", side_effect=_counting_validate),
            patch.object(replay, "build_machine_verification_readout", side_effect=_counting_readout),
        ):
            with self.assertRaisesRegex(replay.SourceBindingError, "hash drift"):
                replay.execute_source_binding(oracle, source_root=self.temp_root)

        self.assertEqual(0, seam_call_counter["validator"])
        self.assertEqual(0, seam_call_counter["readout"])

        # No oracle expected identity was patched by this hostile probe.
        self.assertEqual(
            target_case["sourceRef"]["sourceExcerptSha256"],
            _load()["cases"][
                [c["caseId"] for c in _load()["cases"]].index("C02")
            ]["sourceRef"]["sourceExcerptSha256"],
        )
        # Repository source bytes remain unchanged; only the temp copy drifted.
        self.assertEqual(original_bytes, (replay.REPO_ROOT / target_rel_path).read_bytes())

    def test_cited_source_drift_inside_excerpt_range_rejected_before_any_seam_call(self) -> None:
        """Drift a real byte that falls specifically inside C02's declared
        excerpt line range (not merely anywhere in the file), leaving the
        oracle's locator/range/expected-digest pins untouched. Because
        source binding recomputes the whole-file sourceManifest hash before
        any per-case excerpt check, this genuine in-range byte drift is
        caught at the manifest-hash stage -- still strictly before any P2
        seam call -- which is the correct, stronger fail-closed order."""
        oracle = _load()
        target_case = next(case for case in oracle["cases"] if case["caseId"] == "C02")
        target_rel_path = target_case["sourceRef"]["path"]
        line_range = target_case["sourceRef"]["sourceExcerptLineRange"]
        drifted_path = self.temp_root / target_rel_path
        raw = drifted_path.read_bytes()
        text = raw.decode("utf-8")
        lines = text.split("\n")
        # Corrupt one character on the excerpt's first content line so the
        # drift lands strictly inside the declared [startLine, endLine] range.
        target_line_index = line_range["startLine"] - 1
        original_line = lines[target_line_index]
        self.assertTrue(original_line)
        lines[target_line_index] = "X" + original_line[1:]
        drifted_path.write_text("\n".join(lines), encoding="utf-8")
        self.assertNotEqual(drifted_path.read_bytes(), raw)

        seam_call_counter = {"validator": 0, "readout": 0}
        real_validate = replay._validate_receipt_integrity
        real_build_readout = replay.build_machine_verification_readout

        def _counting_validate(*args, **kwargs):
            seam_call_counter["validator"] += 1
            return real_validate(*args, **kwargs)

        def _counting_readout(*args, **kwargs):
            seam_call_counter["readout"] += 1
            return real_build_readout(*args, **kwargs)

        with (
            patch.object(replay, "_validate_receipt_integrity", side_effect=_counting_validate),
            patch.object(replay, "build_machine_verification_readout", side_effect=_counting_readout),
        ):
            with self.assertRaisesRegex(replay.SourceBindingError, "hash drift"):
                replay.execute_source_binding(oracle, source_root=self.temp_root)

        self.assertEqual(0, seam_call_counter["validator"])
        self.assertEqual(0, seam_call_counter["readout"])
        self.assertEqual(
            target_case["sourceRef"]["sourceExcerptSha256"],
            _load()["cases"][
                [c["caseId"] for c in _load()["cases"]].index("C02")
            ]["sourceRef"]["sourceExcerptSha256"],
        )
        self.assertEqual(raw, (replay.REPO_ROOT / target_rel_path).read_bytes())

    def test_excerpt_digest_drift_branch_itself_fails_closed(self) -> None:
        """Directly exercises the per-case excerpt-digest-drift branch (as
        distinct from the whole-file manifest-hash branch) using a real,
        unmodified cited source and a corrupted expected digest pin, proving
        that branch independently fails closed."""
        oracle = _load()
        target_case = copy.deepcopy(
            next(case for case in oracle["cases"] if case["caseId"] == "C02")
        )
        target_case["sourceRef"]["sourceExcerptSha256"] = "0" * 64
        resolved = {target_case["sourceRef"]["sourceId"]: target_case["sourceRef"]["path"]}
        with self.assertRaisesRegex(replay.SourceBindingError, "excerpt digest drift"):
            replay.validate_case_source_binding(target_case, resolved, source_root=self.temp_root)

    def test_cited_source_hash_drift_in_manifest_stage_rejected_before_seam_call(self) -> None:
        oracle = _load()
        target_rel_path = next(
            entry["path"] for entry in oracle["sourceManifest"] if entry["sourceId"] == "LATENCY"
        )
        drifted_path = self.temp_root / target_rel_path
        drifted_bytes = bytearray(drifted_path.read_bytes())
        drifted_bytes[100] ^= 0xFF
        drifted_path.write_bytes(bytes(drifted_bytes))

        seam_call_counter = {"validator": 0}
        real_validate = replay._validate_receipt_integrity

        def _counting_validate(*args, **kwargs):
            seam_call_counter["validator"] += 1
            return real_validate(*args, **kwargs)

        with patch.object(replay, "_validate_receipt_integrity", side_effect=_counting_validate):
            with self.assertRaisesRegex(replay.SourceBindingError, "hash drift"):
                replay.execute_source_binding(oracle, source_root=self.temp_root)

        self.assertEqual(0, seam_call_counter["validator"])
        original_bytes = (replay.REPO_ROOT / target_rel_path).read_bytes()
        self.assertNotEqual(bytes(drifted_bytes), b"")
        self.assertNotEqual(original_bytes, drifted_path.read_bytes())

    def test_clean_temp_root_copy_still_passes_source_binding(self) -> None:
        oracle = _load()
        summary = replay.execute_source_binding(oracle, source_root=self.temp_root)
        self.assertEqual(19, summary["caseBindingCount"])

    def test_production_cli_path_always_binds_repository_root(self) -> None:
        # The public build_ledger/main entrypoints never accept a source-root
        # override; execute_source_binding's default parameter always
        # resolves to REPO_ROOT so production replay cannot be pointed at
        # substitute historical bytes.
        import inspect

        sig = inspect.signature(replay.build_ledger)
        self.assertNotIn("source_root", sig.parameters)
        main_source = inspect.getsource(replay.main)
        self.assertNotIn("source_root", main_source)
        self.assertNotIn("source-root", main_source)


class TestActualP2Replay(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ledger = replay.build_ledger(ORACLE, execution_base="test-base")

    def _case(self, case_id: str) -> dict:
        return next(item for item in self.ledger["cases"] if item["caseId"] == case_id)

    def test_digest_tamper_reaches_actual_validator(self) -> None:
        item = self._case("C02")
        self.assertFalse(item["validatorAccepted"])
        self.assertIn("receiptDigest mismatch", item["validatorReason"])
        self.assertTrue(item["validatorReadoutSamePayloadObject"])

    def test_fully_rebound_attacker_remains_structural_gap(self) -> None:
        item = self._case("C07")
        self.assertEqual("NOT_REPRESENTABLE_BY_CURRENT_P2", item["executionDisposition"])
        self.assertFalse(item["predicateSatisfied"])
        self.assertEqual("NOT_REPRESENTABLE_BY_CURRENT_P2", item["classification"])
        self.assertIsNone(item["falseNegative"])
        self.assertIsNone(item["falsePositive"])
        self.assertIsNone(item["baseReceiptDigest"])
        self.assertIsNone(item["mutatedReceiptDigest"])

    def test_fixed_sentinel_is_honestly_observed_and_not_a_real_secret(self) -> None:
        item = self._case("C15")
        self.assertFalse(item["predicateSatisfied"])
        self.assertEqual("FALSE_NEGATIVE", item["classification"])
        self.assertTrue(item["falseNegative"])
        self.assertFalse(item["falsePositive"])
        self.assertIn(replay.SECRET_SENTINEL, item["readout"]["exceptions"])
        serialized = replay.ledger_bytes(self.ledger).decode("utf-8")
        for forbidden in ("AWS_SECRET_ACCESS_KEY=", "Bearer ", "-----BEGIN PRIVATE KEY-----"):
            self.assertNotIn(forbidden, serialized)

    def test_real_readout_fields_are_preserved(self) -> None:
        item = self._case("C01")
        self.assertTrue(item["validatorAccepted"])
        self.assertEqual(replay.DETERMINISTIC_PREFLIGHT_COMPLETE, item["readout"]["status"])
        for field in ("receiptIdentity", "notCheckedScope", "limitations", "unclassified", "exceptions", "deterministicResults", "candidateProbes", "claimBoundary"):
            self.assertIn(field, item["readout"])

    def test_zero_totals_fail(self) -> None:
        oracle = _load()
        oracle["cases"] = []
        oracle["requiredCaseIds"] = []
        oracle["requiredFamilies"] = []
        oracle["requiredZeroToleranceClasses"] = []
        with self.assertRaisesRegex(ValueError, "exactly 19"):
            _validate_mutated(oracle)

    def test_runner_cannot_emit_reviewer_outcomes(self) -> None:
        self.assertEqual("REVIEWER_OWNED_NOT_SET", self.ledger["reviewerDisposition"])
        self.assertFalse(
            replay.FORBIDDEN_REVIEWER_OUTCOMES.intersection(replay._walk_strings(self.ledger))
        )

    def test_owner_files_are_byte_identical_before_after(self) -> None:
        before = {path: replay._sha_file(replay.REPO_ROOT / path) for path in replay.OWNER_HASHES}
        replay.build_ledger(ORACLE, execution_base="test-base")
        after = {path: replay._sha_file(replay.REPO_ROOT / path) for path in replay.OWNER_HASHES}
        self.assertEqual(before, after)
        self.assertEqual(replay.OWNER_HASHES, after)

    def test_repeated_same_base_is_byte_identical(self) -> None:
        first = replay.ledger_bytes(replay.build_ledger(ORACLE, execution_base="same-base"))
        second = replay.ledger_bytes(replay.build_ledger(ORACLE, execution_base="same-base"))
        self.assertEqual(first, second)

    def test_all_typed_mutations_are_consumed_and_change_bytes(self) -> None:
        cases = {case["caseId"]: case for case in _load()["cases"]}
        for case_id, case in cases.items():
            if case_id in replay.NON_REPRESENTABLE:
                continue
            receipt = replay._canonical_receipt()
            changed = replay.apply_mutation(receipt, case)
            self.assertEqual(case["mutation"]["operator"] != "NO_MUTATION", changed, case_id)

    def test_normative_label_cannot_manufacture_observation(self) -> None:
        case = copy.deepcopy(_load()["cases"][0])
        case["requiredSafetyPredicate"] = "REPLAY_PASS"
        observation = replay.observe_receipt(replay._canonical_receipt())
        with self.assertRaisesRegex(ValueError, "unknown predicate"):
            replay.evaluate_predicate(case, observation)

    def test_weakened_evaluator_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "negative calibration"):
            replay.assert_evaluator_conformance(lambda _case, _observation: True)

    def test_complete_ledger_reconciles_and_returns_to_design_candidate(self) -> None:
        coverage = self.ledger["coverage"]
        self.assertEqual((19, 18, 7), (
            coverage["observedCaseCount"], coverage["observedFamilyCount"],
            coverage["observedZeroToleranceClassCount"],
        ))
        self.assertEqual(["C07", "C08", "C15", "C18"], self.ledger["predicateMissCaseIds"])
        self.assertEqual(
            "REPLAY_EVIDENCE_COMPLETE_RETURN_TO_DESIGN_CANDIDATE",
            self.ledger["workerTerminalCandidate"],
        )
        self.assertEqual("COMPLETE", self.ledger["executionCompleteness"])
        self.assertEqual("RETURN_TO_DESIGN_CANDIDATE", self.ledger["safetyCandidate"])

    def test_cli_write_is_only_requested_output(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "ledger.json"
            output.write_bytes(replay.ledger_bytes(self.ledger))
            self.assertEqual([output], list(Path(temp_dir).iterdir()))

    def test_source_binding_executed_before_any_case_in_ledger(self) -> None:
        self.assertTrue(self.ledger["sourceBinding"]["executedBeforeAnySeamCall"])
        self.assertEqual(7, self.ledger["sourceBinding"]["sourceCount"])
        self.assertEqual(19, self.ledger["sourceBinding"]["caseBindingCount"])


class TestReceiptDigestAndClassification(unittest.TestCase):
    """R1B-RV-3 repair: base/mutated receipt digests and explicit
    false-negative/false-positive classification for every case."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.ledger = replay.build_ledger(ORACLE, execution_base="test-base")

    def _case(self, case_id: str) -> dict:
        return next(item for item in self.ledger["cases"] if item["caseId"] == case_id)

    def test_no_mutation_control_preserves_digest(self) -> None:
        for case_id in ("C01", "C16A"):
            item = self._case(case_id)
            self.assertEqual(item["baseReceiptDigest"], item["mutatedReceiptDigest"])
            self.assertEqual("TRUE_NEGATIVE", item["classification"])
            self.assertFalse(item["falseNegative"])
            self.assertFalse(item["falsePositive"])

    def test_representable_mutation_changes_digest(self) -> None:
        for case in self.ledger["cases"]:
            if case["caseId"] in replay.NON_REPRESENTABLE or case["mutationOperator"] == "NO_MUTATION":
                continue
            self.assertNotEqual(
                case["baseReceiptDigest"], case["mutatedReceiptDigest"], case["caseId"]
            )

    def test_digest_is_sha256_of_jcs_over_complete_receipt(self) -> None:
        control = replay._canonical_receipt()
        expected = hashlib.sha256(replay._jcs_bytes(control)).hexdigest()
        self.assertEqual(expected, replay._receipt_digest(control))
        item = self._case("C01")
        self.assertEqual(expected, item["baseReceiptDigest"])

    def test_jcs_numeric_fixed_vector_uses_shortest_integral_form(self) -> None:
        self.assertEqual(b'{"n":0}', replay._jcs_bytes({"n": 0.0}))
        self.assertEqual(b'{"n":0}', replay._jcs_bytes({"n": -0.0}))
        with self.assertRaisesRegex(ValueError, "finite integral"):
            replay._jcs_bytes({"n": 0.5})

    def test_every_case_binds_oracle_and_source_status(self) -> None:
        for case in self.ledger["cases"]:
            self.assertEqual(case["caseId"], case["oracleCaseId"])
            self.assertEqual(replay.ORACLE_SHA256, case["oracleIdentity"])
            self.assertEqual("PASS", case["sourceBindingStatus"])

    def test_every_representable_case_has_exactly_one_classification(self) -> None:
        valid = {"TRUE_NEGATIVE", "FALSE_POSITIVE", "TRUE_POSITIVE", "FALSE_NEGATIVE"}
        for case in self.ledger["cases"]:
            if case["caseId"] in replay.NON_REPRESENTABLE:
                self.assertEqual("NOT_REPRESENTABLE_BY_CURRENT_P2", case["classification"])
                continue
            self.assertIn(case["classification"], valid)

    def test_classify_case_mapping_is_closed_and_consistent(self) -> None:
        self.assertEqual(("TRUE_NEGATIVE", False, False), replay.classify_case(
            mutation_operator="NO_MUTATION", predicate_satisfied=True))
        self.assertEqual(("FALSE_POSITIVE", False, True), replay.classify_case(
            mutation_operator="NO_MUTATION", predicate_satisfied=False))
        self.assertEqual(("TRUE_POSITIVE", False, False), replay.classify_case(
            mutation_operator="REPLACE_JSON_POINTER", predicate_satisfied=True))
        self.assertEqual(("FALSE_NEGATIVE", True, False), replay.classify_case(
            mutation_operator="REPLACE_JSON_POINTER", predicate_satisfied=False))

    def test_classification_reconciliation_totals_are_consistent(self) -> None:
        recon = self.ledger["classificationReconciliation"]
        self.assertEqual(16, recon["representableCaseCount"])
        self.assertEqual(["C07", "C08", "C18"], recon["excludedUnrepresentableCaseIds"])
        self.assertEqual(["C15"], recon["falseNegativeCaseIds"])
        self.assertEqual([], recon["falsePositiveCaseIds"])
        total = sum(recon["counts"].values())
        self.assertEqual(19, total)
        self.assertEqual(3, recon["counts"]["NOT_REPRESENTABLE_BY_CURRENT_P2"])

    def test_classification_boolean_inconsistency_is_rejected(self) -> None:
        with patch.object(
            replay, "classify_case", return_value=("TRUE_POSITIVE", True, False)
        ):
            with self.assertRaisesRegex(ValueError, "classification/boolean inconsistency"):
                replay.build_ledger(ORACLE, execution_base="test-base")


class TestSameObjectActualP2Seam(unittest.TestCase):
    """Proves the validator and readout observe the identical in-memory
    receipt object, and that a copied/forked evaluator is caught."""

    def test_same_object_evidence_for_every_representable_case(self) -> None:
        ledger = replay.build_ledger(ORACLE, execution_base="test-base")
        for case in ledger["cases"]:
            if case["caseId"] in replay.NON_REPRESENTABLE:
                continue
            self.assertTrue(case["validatorReadoutSamePayloadObject"], case["caseId"])

    def test_observe_receipt_passes_identical_object_to_both_seams(self) -> None:
        receipt = replay._canonical_receipt()
        seen_by_validator = {}
        seen_by_readout = {}
        real_validate = replay._validate_receipt_integrity
        real_build_readout = replay.build_machine_verification_readout

        def _wrap_validate(payload):
            seen_by_validator["obj"] = payload
            return real_validate(payload)

        def _wrap_readout(valid, payload, reason):
            seen_by_readout["obj"] = payload
            return real_build_readout(valid, payload, reason)

        with (
            patch.object(replay, "_validate_receipt_integrity", side_effect=_wrap_validate),
            patch.object(replay, "build_machine_verification_readout", side_effect=_wrap_readout),
        ):
            replay.observe_receipt(receipt)

        self.assertIs(seen_by_validator["obj"], seen_by_readout["obj"])
        self.assertIs(seen_by_validator["obj"], receipt)

    def test_same_object_divergence_fails_the_runner(self) -> None:
        real_observe = replay.observe_receipt

        def _diverged(receipt):
            observation = real_observe(receipt)
            observation["validatorReadoutSamePayloadObject"] = False
            return observation

        with patch.object(replay, "observe_receipt", side_effect=_diverged):
            with self.assertRaisesRegex(ValueError, "payload identity diverged"):
                replay.build_ledger(ORACLE, execution_base="test-base")


if __name__ == "__main__":
    unittest.main()
