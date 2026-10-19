"""Focused offline proofs for the one-pair SCEC root admission."""
from __future__ import annotations

import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import check_semantic_convergence_control as scec


REAL_ROOT = Path(__file__).resolve().parents[2]
ROOT_PATH = "docs/reviews/CVF_NCR_HTML_DRAFT_RECOVERY_BROWSER_COMPLETION_2026-10-18.md"
ROOT_BYTES = (REAL_ROOT / ROOT_PATH).read_bytes()
ROOT_HASH = hashlib.sha256(ROOT_BYTES).hexdigest()
SOURCE_PATH = "docs/baselines/CVF_TEST_INTEGRATED_ROOT_SOURCE.md"
GRANT_PATH = "docs/baselines/CVF_TEST_ROOT_ADMISSION.md"
WORK_PATH = "docs/work_orders/CVF_TEST_ROOT_DISPATCH.md"
RETURN_PATH = "docs/reviews/CVF_TEST_ROOT_WORKER_RETURN.md"
PROOF_PATH = "governance/compat/test_semantic_convergence_root_admission.py"
POINTER_SCHEMA = "cvf.scecRootContractAdmissionPointer@1.0.0"


def _sha(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _markdown(block: dict, *, ledger: dict | None = None) -> str:
    text = "# Fixture\n\n"
    if ledger is not None:
        text += "```acceptance-ledger-json\n" + json.dumps(ledger) + "\n```\n\n"
    return text + "```json\n" + json.dumps(block) + "\n```\n"


class RootAdmissionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.patch_root = patch.object(scec, "REPO_ROOT", self.root)
        self.patch_root.start()
        self.addCleanup(self.patch_root.stop)
        self._write(ROOT_PATH, ROOT_BYTES)
        self._write(PROOF_PATH, b"source fixture proof assertion\n")
        self.source = b"Consolidated integrated root reassessment for source only.\n"
        self._write(SOURCE_PATH, self.source)
        self.root_block = scec.find_active_blocks(ROOT_BYTES.decode("utf-8"))[0]
        self.ledger = {
            "schemaVersion": "cvf.workOrderAcceptanceLedger@1.0.0",
            "requirements": [{"requirementId": "R1", "mandatory": True,
                              "expectedArtifacts": [RETURN_PATH, PROOF_PATH],
                              "requiredProofIds": ["P1"]}],
            "proofCatalog": [{"proofId": "P1", "kind": "COMMAND", "locator": "source fixture proof assertion"}],
        }
        self.grant = {
            "schemaVersion": "cvf.scecRootContractAdmission@1.0.0",
            "status": "ACCEPTED_FOR_BOUNDED_SOURCE_IMPLEMENTATION",
            "decisionOwner": "LOCAL",
            "operatorInstructionEvidence": "operator exact4 scope consent",
            "problemKey": self.root_block["problemKey"],
            "predecessor": {"path": ROOT_PATH, "sha256": ROOT_HASH},
            "sourceContract": {"path": SOURCE_PATH, "sha256": _sha(self.source)},
            "workOrderPath": WORK_PATH, "workerReturnPath": RETURN_PATH,
            "allowedArtifacts": [RETURN_PATH, PROOF_PATH],
            "effectCeilings": {key: 0 for key in (
                "providerCalls", "networkCalls", "publicWrites", "deployments",
                "realDataMutations", "destructiveActions", "productRuntimeStarts")},
            "expiresAtUtc": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat().replace("+00:00", "Z"),
        }
        self._set_grant()

    def _write(self, path: str, content: bytes) -> None:
        full = self.root / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(content)

    def _set_grant(self, *, raw: str | None = None) -> None:
        text = "# Admission\n\n```root-contract-admission-json\n" + (raw or json.dumps(self.grant)) + "\n```\n"
        content = text.encode("utf-8")
        self._write(GRANT_PATH, content)
        self.grant_hash = _sha(content)

    def _block(self, stage: str, *, pointer: bool = True) -> dict:
        is_dispatch = stage == "DISPATCH"
        block = {
            "schemaVersion": scec.SCEC_SCHEMA_VERSION,
            "problemKey": self.root_block["problemKey"], "chainMode": "SUCCESSOR",
            "chainOrdinal": 2 if is_dispatch else 3,
            "predecessor": {"path": ROOT_PATH if is_dispatch else WORK_PATH,
                            "sha256": ROOT_HASH if is_dispatch else "0" * 64},
            "blockerDelta": {key: [] for key in ("prior", "resolved", "retained", "new", "reopened", "current")},
            "resolutionEvidence": {},
            "counters": {**self.root_block["counters"], "nonDecreasingBlockerTransitions": 2 if is_dispatch else 3},
            "claims": [] if is_dispatch else [{"claimId": "fixture-proof", "claimClass": "OTHER",
                                                 "proofClass": "NAMED_OBSERVABLE_PROOF", "evidenceRef": PROOF_PATH}],
            "requiredDisposition": "ROOT_CONTRACT_REQUIRED" if is_dispatch else "READY_WITH_EXECUTABLE_PROOF",
            "successorScope": "INTEGRATED_ROOT_CONTRACT" if is_dispatch else "EXECUTABLE_IMPLEMENTATION",
        }
        if pointer:
            block["rootContractAdmission"] = {"schemaVersion": POINTER_SCHEMA,
                                              "path": GRANT_PATH, "sha256": self.grant_hash,
                                              "stage": stage}
        return block

    def _pair(self) -> tuple[dict, dict]:
        dispatch = self._block("DISPATCH")
        self._write(WORK_PATH, _markdown(dispatch, ledger=self.ledger).encode("utf-8"))
        returned = self._block("RETURN")
        returned["predecessor"]["sha256"] = _sha((self.root / WORK_PATH).read_bytes())
        self._write(RETURN_PATH, _markdown(returned).encode("utf-8"))
        return dispatch, returned

    def _diagnose(self, path: str) -> scec.FileDiagnostic:
        return scec.diagnose_file(path, (self.root / path).read_text(encoding="utf-8"), require_block=True)

    def _codes(self, path: str) -> set[str]:
        return {v.code for _, v in self._diagnose(path).violations}

    def test_actual_root_bound_pair_uses_real_repository_resolvers(self) -> None:
        self._pair()
        for path in (WORK_PATH, RETURN_PATH):
            result = self._diagnose(path)
            self.assertEqual(result.block_count, 1)
            self.assertEqual(result.violations, ())

    def test_no_pointer_preserves_mandatory_stop(self) -> None:
        block = self._block("DISPATCH", pointer=False)
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("MISSING_STOP_REASSESS_ESCALATION", self._codes(WORK_PATH))

    def test_actual_stop_predecessor_is_terminal(self) -> None:
        self.root_block["requiredDisposition"] = "STOP_REASSESS_ARCHITECTURE"
        self.root_block["successorScope"] = "NO_SUCCESSOR"
        self._write(ROOT_PATH, _markdown(self.root_block).encode("utf-8"))
        self.grant["predecessor"]["sha256"] = _sha((self.root / ROOT_PATH).read_bytes())
        self._set_grant()
        block = self._block("DISPATCH")
        block["predecessor"] = self.grant["predecessor"].copy()
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", self._codes(WORK_PATH))

    def test_wrong_stage_and_actual_path_reject(self) -> None:
        block, _ = self._pair()
        block["rootContractAdmission"]["stage"] = "RETURN"
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_RETURN_INVALID", self._codes(WORK_PATH))
        valid = self._block("DISPATCH")
        result = scec.validate_block(valid, artifact_path=RETURN_PATH,
                                     predecessor_hash_resolver=scec._repo_predecessor_hash_resolver,
                                     predecessor_block_resolver=scec._repo_predecessor_block_resolver,
                                     evidence_bytes_resolver=scec._repo_evidence_bytes_resolver)
        self.assertIn("ROOT_ADMISSION_DISPATCH_INVALID", {v.code for v in result.violations})

    def test_duplicate_pointer_is_evaluated_failure(self) -> None:
        block = self._block("DISPATCH")
        raw = json.dumps(block).replace('"rootContractAdmission":', '"rootContractAdmission": null, "rootContractAdmission":', 1)
        self._write(WORK_PATH, ("```json\n" + raw + "\n```\n").encode("utf-8"))
        result = self._diagnose(WORK_PATH)
        self.assertEqual(result.block_count, 1)
        self.assertIn("ROOT_ADMISSION_JSON_INVALID", self._codes(WORK_PATH))

    def test_duplicate_grant_key_rejects(self) -> None:
        raw = json.dumps(self.grant).replace('"decisionOwner":', '"decisionOwner": "LOCAL", "decisionOwner":', 1)
        self._set_grant(raw=raw)
        block = self._block("DISPATCH")
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_GRANT_INVALID", self._codes(WORK_PATH))

    def test_nonzero_and_boolean_effects_reject(self) -> None:
        for value in (True, 1):
            with self.subTest(value=value):
                self.grant["effectCeilings"]["providerCalls"] = value
                self._set_grant()
                block = self._block("DISPATCH")
                self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
                self.assertIn("ROOT_ADMISSION_EFFECT_INVALID", self._codes(WORK_PATH))

    def test_manifest_expiry_and_owner_reject(self) -> None:
        for field, value, code in (
            ("allowedArtifacts", [RETURN_PATH], "ROOT_ADMISSION_MANIFEST_INVALID"),
            ("decisionOwner", "WORKER", "ROOT_ADMISSION_GRANT_INVALID"),
            ("expiresAtUtc", "2000-01-01T00:00:00Z", "ROOT_ADMISSION_EXPIRED"),
        ):
            with self.subTest(field=field):
                original = copy.deepcopy(self.grant[field])
                self.grant[field] = value
                self._set_grant()
                block = self._block("DISPATCH")
                self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
                self.assertIn(code, self._codes(WORK_PATH))
                self.grant[field] = original

    def test_missing_context_and_replay_reject(self) -> None:
        dispatch, returned = self._pair()
        result = scec.validate_block(dispatch)
        self.assertIn("ROOT_ADMISSION_CONTEXT_MISSING", {v.code for v in result.violations})
        returned["chainOrdinal"] = 4
        self._write(RETURN_PATH, _markdown(returned).encode("utf-8"))
        self.assertIn("PREDECESSOR_ORDINAL_DISCONTINUITY", self._codes(RETURN_PATH))

    def test_fake_ready_proof_rejects(self) -> None:
        _, returned = self._pair()
        returned["claims"][0]["evidenceRef"] = "missing/fixture-proof.md"
        self._write(RETURN_PATH, _markdown(returned).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_PROOF_INVALID", self._codes(RETURN_PATH))

    def test_malformed_and_partial_opt_in_remain_evaluated(self) -> None:
        block = self._block("DISPATCH")
        block["rootContractAdmission"].pop("stage")
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_POINTER_INVALID", self._codes(WORK_PATH))
        raw = json.dumps(self._block("DISPATCH"))[:-1]
        self._write(WORK_PATH, ("```json\n" + raw + "\n```\n").encode("utf-8"))
        result = self._diagnose(WORK_PATH)
        self.assertEqual(result.block_count, 1)
        self.assertIn("ROOT_ADMISSION_JSON_INVALID", self._codes(WORK_PATH))

    def test_wrong_hash_source_and_expiry_fail(self) -> None:
        self._pair()
        block = self._block("DISPATCH")
        block["rootContractAdmission"]["sha256"] = "f" * 64
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_GRANT_INVALID", self._codes(WORK_PATH))
        self.grant["sourceContract"]["sha256"] = "f" * 64
        self._set_grant()
        block = self._block("DISPATCH")
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_SOURCE_INVALID", self._codes(WORK_PATH))

    def test_unsafe_oversized_and_non_utf8_grant_fail(self) -> None:
        block = self._block("DISPATCH")
        block["rootContractAdmission"]["path"] = "docs/baselines/../bad.md"
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_POINTER_INVALID", self._codes(WORK_PATH))
        for content in (b"x" * 65537, b"\xff"):
            with self.subTest(content_len=len(content)):
                self._write(GRANT_PATH, content)
                block = self._block("DISPATCH")
                block["rootContractAdmission"]["sha256"] = _sha(content)
                self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
                self.assertIn("ROOT_ADMISSION_GRANT_INVALID", self._codes(WORK_PATH))

    def test_new_initial_renamed_key_narrow_scope_and_blockers_fail(self) -> None:
        for mutation in ("INITIAL", "RENAME", "NARROW", "BLOCKERS"):
            with self.subTest(mutation=mutation):
                block = self._block("DISPATCH")
                if mutation == "INITIAL":
                    block.update(chainMode="INITIAL", chainOrdinal=0, predecessor=None)
                elif mutation == "RENAME":
                    block["problemKey"] = "renamed-problem"
                elif mutation == "NARROW":
                    block["successorScope"] = "INITIAL_BOUNDED"
                else:
                    block["blockerDelta"]["new"] = ["ACTIVE"]
                    block["blockerDelta"]["current"] = ["ACTIVE"]
                self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
                self.assertTrue(self._codes(WORK_PATH))

    def test_return_replay_and_ordinary_worker_failure(self) -> None:
        _, returned = self._pair()
        returned["rootContractAdmission"]["stage"] = "DISPATCH"
        self._write(RETURN_PATH, _markdown(returned).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_DISPATCH_INVALID", self._codes(RETURN_PATH))
        returned.pop("rootContractAdmission")
        returned["requiredDisposition"] = "STOP_REASSESS_ARCHITECTURE"
        returned["successorScope"] = "NO_SUCCESSOR"
        returned["claims"] = []
        self._write(RETURN_PATH, _markdown(returned).encode("utf-8"))
        self.assertEqual(self._codes(RETURN_PATH), set())

    def test_package_import_preserves_cli_entrypoints(self) -> None:
        result = subprocess.run(
            [sys.executable, "-B", "-c", "from governance.compat import check_semantic_convergence_control as c; print(c.SCEC_SCHEMA_VERSION)"],
            cwd=REAL_ROOT, capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(scec.SCEC_SCHEMA_VERSION, result.stdout)

    def test_escaped_pointer_and_schema_duplicate_nested_key_reject(self) -> None:
        block = self._block("DISPATCH")
        raw = json.dumps(block).replace("rootContractAdmission", r"root\u0043ontractAdmission")
        raw = raw.replace('"stage": "DISPATCH"', '"stage": "RETURN", "stage": "DISPATCH"')
        raw = raw.replace("cvf.semanticConvergenceControl.v1", r"cvf.semanticConvergence\u0043ontrol.v1")
        self._write(WORK_PATH, ("```json\n" + raw + "\n```\n").encode("utf-8"))
        result = self._diagnose(WORK_PATH)
        self.assertEqual(result.block_count, 1)
        self.assertIn("ROOT_ADMISSION_JSON_INVALID", self._codes(WORK_PATH))

    def test_noncanonical_naive_expiry_rejects_without_exception(self) -> None:
        self.grant["expiresAtUtc"] = "2099-01-01Z"
        self._set_grant()
        block = self._block("DISPATCH")
        self._write(WORK_PATH, _markdown(block, ledger=self.ledger).encode("utf-8"))
        self.assertIn("ROOT_ADMISSION_EXPIRED", self._codes(WORK_PATH))


if __name__ == "__main__":
    unittest.main()
