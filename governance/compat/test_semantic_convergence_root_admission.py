"""Focused offline proofs for the one-pair SCEC root admission."""
from __future__ import annotations

import collections
import copy
import hashlib
import inspect
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


# ---- Post-STOP v2 admission: real pinned STOP bytes plus isolated prospective fixture authorities ----
STOP_PATH = "docs/reviews/CVF_NCR_R2_W05_BOUND_SOURCE_LOCAL_COMPLETION_REVIEW_2026-10-19.md"
STOP_RAW_SHA = "37d2905184e28fe2e27d574241a69200c49e5338a094b8b2826809e8ce797a42"
STOP_BYTES = (REAL_ROOT / STOP_PATH).read_bytes()
STOP_TEXT = STOP_BYTES.decode("utf-8")
V2_POINTER_SCHEMA = "cvf.scecPostStopRootAdmissionPointer@2.0.0"
V2_GRANT_SCHEMA = "cvf.scecPostStopRootAdmission@2.0.0"
V2_REASSESS_SCHEMA = "cvf.scecIntegratedRootReassessment@1.0.0"
V2_SOURCE_PATH = "docs/baselines/CVF_TEST_V2_SOURCE_CONTRACT.md"
V2_OPERATOR_PATH = "docs/baselines/CVF_TEST_V2_OPERATOR_INSTRUCTION.md"
V2_REASSESS_PATH = "docs/reviews/CVF_TEST_V2_ROOT_REASSESSMENT_LOCAL_REVIEW.md"
V2_UNRELATED_PATH = "docs/reviews/CVF_TEST_V2_UNRELATED_REVIEW.md"
V2_GRANT_PATH = "docs/baselines/CVF_TEST_V2_ADMISSION.md"
V1_GRANT_PATH = "docs/baselines/CVF_TEST_V1_ADMISSION.md"
V2_WORK_PATH = "docs/work_orders/CVF_TEST_V2_DISPATCH.md"
V2_WORK_SECOND_PATH = "docs/work_orders/CVF_TEST_V2_DISPATCH_SECOND.md"
V2_RETURN_PATH = "docs/reviews/CVF_TEST_V2_WORKER_RETURN.md"
V2_RETURN_SECOND_PATH = "docs/reviews/CVF_TEST_V2_WORKER_RETURN_SECOND.md"
V2_EARLIER_PATH = "docs/reviews/CVF_TEST_V2_EARLIER_WORKER_RETURN.md"
V2_EP_PATH = "docs/reviews/evidence/cvf-test-v2-worker.json"
V2_PROOF_PATH = "governance/compat/test_fixture_v2_proof.py"
V2_STOP_LOCATORS = {
    "BOUND_DESTINATION_NOT_ENFORCED": "| LR1 | HIGH | Signed challenge at foreign-web.invalid",
    "BOUND_ISSUED_AUTHORITY_NOT_IMMUTABLE": "| LR2 | HIGH | Unissued profile invokes once",
    "BOUND_ACTUAL_LEDGER_OWNER_JOIN_MISSING": "| LR3 | CRITICAL | After challenge, swapping the actual orchestrator.ledger",
}
EFFECT_NAMES = ("providerCalls", "networkCalls", "publicWrites", "deployments",
                "realDataMutations", "destructiveActions", "productRuntimeStarts")
EVALUATED: collections.Counter = collections.Counter()


def _fence(name: str, body: dict | str) -> bytes:
    text = body if isinstance(body, str) else json.dumps(body)
    return ("# Authority\n\n```" + name + "\n" + text + "\n```\n").encode("utf-8")


def _stop_variant(mutate) -> bytes:
    """Prospective STOP-shaped fixture derived from the real bytes with one declared change."""
    lines = STOP_TEXT.split("\n")
    index = next(i for i, line in enumerate(lines) if line.startswith('{"schemaVersion":"cvf.semanticConvergenceControl.v1"'))
    block = json.loads(lines[index])
    mutate(block)
    lines[index] = json.dumps(block, separators=(",", ":"))
    return "\n".join(lines).encode("utf-8")


class ActualStopTests(unittest.TestCase):
    def test_pinned_actual_stop_validates_with_real_repository_resolvers(self) -> None:
        self.assertEqual(hashlib.sha256(STOP_BYTES).hexdigest(), STOP_RAW_SHA)
        result = scec.diagnose_file(STOP_PATH, STOP_TEXT, require_block=True)
        EVALUATED["ACTUAL_STOP"] += result.block_count
        self.assertEqual((result.block_count, result.violations), (1, ()))
        block = scec.find_active_blocks(STOP_TEXT)[0]
        self.assertEqual((block["requiredDisposition"], block["successorScope"], block["chainOrdinal"]),
                         ("STOP_REASSESS_ARCHITECTURE", "NO_SUCCESSOR", 2))
        self.assertEqual(sorted(block["blockerDelta"]["current"]), sorted(V2_STOP_LOCATORS))
        self.assertEqual(block["counters"], {"partialReadyClosures": 0, "reviewerScopeExpansions": 0,
                                             "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 2})


class PostStopFixture(unittest.TestCase):
    """Strict v2 dispatch/return pair built around the real STOP bytes; all grants are fixtures only."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        patcher = patch.object(scec, "REPO_ROOT", self.root)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.build()

    def _write(self, path: str, content: bytes) -> None:
        full = self.root / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(content)

    def build(self) -> None:
        self.stop_block = scec.find_active_blocks(STOP_TEXT)[0]
        self.key = self.stop_block["problemKey"]
        self.blockers = list(self.stop_block["blockerDelta"]["current"])
        self.counters = dict(self.stop_block["counters"])
        self.stop_hash = STOP_RAW_SHA
        self.reassess_path = V2_REASSESS_PATH
        self.operator_bytes = b"# Operator instruction\n\nFIXTURE OPERATOR INSTRUCTION RECORD: bounded v2 pair approved.\n"
        self.source_bytes = ("# Fixture source contract: consolidated integrated root reassessment\n\n" + "".join(
            f"DESIGN-OBLIGATION {b}: fixture design text\n" for b in self.blockers)).encode("utf-8")
        self.ep_bytes = ("fixture executable proof record\n" + "".join(
            f"fixture-proof-locator-{b}\n" for b in self.blockers)).encode("utf-8")
        for path, content in ((STOP_PATH, STOP_BYTES), (V2_OPERATOR_PATH, self.operator_bytes),
                              (V2_SOURCE_PATH, self.source_bytes), (V2_EP_PATH, self.ep_bytes),
                              (V2_PROOF_PATH, b"fixture proof assertion\n"),
                              (V2_UNRELATED_PATH, b"unrelated review text locator\n")):
            self._write(path, content)
        self.ledger = {
            "schemaVersion": "cvf.workOrderAcceptanceLedger@1.0.0",
            "requirements": [{"requirementId": "R1", "mandatory": True,
                              "expectedArtifacts": [V2_RETURN_PATH, V2_EP_PATH, V2_PROOF_PATH],
                              "requiredProofIds": ["P1"]}],
            "proofCatalog": [{"proofId": "P1", "kind": "COMMAND", "locator": "fixture proof assertion"}],
        }
        source_ref = {"path": V2_SOURCE_PATH, "sha256": _sha(self.source_bytes)}
        stop_ref = {"path": STOP_PATH, "sha256": STOP_RAW_SHA}
        self.reassess = {
            "schemaVersion": V2_REASSESS_SCHEMA, "status": "ACCEPTED_BY_LOCAL", "decisionOwner": "LOCAL",
            "scope": "INTEGRATED_ROOT_CONTRACT", "problemKey": self.key,
            "stoppedPredecessor": dict(stop_ref), "sourceContract": dict(source_ref),
            "obligations": [{
                "blockerId": b,
                "designEvidence": {**source_ref, "locator": f"DESIGN-OBLIGATION {b}"},
                "sourceEvidence": {**stop_ref, "locator": V2_STOP_LOCATORS[b]},
            } for b in self.blockers],
        }
        self.grant = {
            "schemaVersion": V2_GRANT_SCHEMA, "status": "ACCEPTED_FOR_ONE_BOUNDED_POST_STOP_ROOT_PAIR",
            "decisionOwner": "LOCAL",
            "operatorInstructionEvidence": {"path": V2_OPERATOR_PATH, "sha256": _sha(self.operator_bytes),
                                            "locator": "FIXTURE OPERATOR INSTRUCTION RECORD"},
            "problemKey": self.key,
            "predecessor": {**stop_ref, "chainOrdinal": self.stop_block["chainOrdinal"],
                            "blockers": list(self.blockers), "counters": dict(self.counters)},
            "rootReassessment": None, "sourceContract": dict(source_ref),
            "workOrderPath": V2_WORK_PATH, "workerReturnPath": V2_RETURN_PATH,
            "allowedArtifacts": [V2_RETURN_PATH, V2_EP_PATH, V2_PROOF_PATH],
            "effectCeilings": {name: 0 for name in EFFECT_NAMES},
            "expiresAtUtc": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        self.rebuild()

    def set_source(self, content: bytes) -> None:
        self._write(V2_SOURCE_PATH, content)
        ref = {"path": V2_SOURCE_PATH, "sha256": _sha(content)}
        self.grant["sourceContract"], self.reassess["sourceContract"] = dict(ref), dict(ref)
        for row in self.reassess["obligations"]:
            row["designEvidence"]["sha256"] = ref["sha256"]

    def set_operator(self, content: bytes) -> None:
        self._write(V2_OPERATOR_PATH, content)
        self.grant["operatorInstructionEvidence"]["sha256"] = _sha(content)

    def set_stop(self, content: bytes) -> None:
        self._write(STOP_PATH, content)
        self.stop_hash = _sha(content)
        self.grant["predecessor"]["sha256"] = self.stop_hash
        self.reassess["stoppedPredecessor"]["sha256"] = self.stop_hash
        for row in self.reassess["obligations"]:
            row["sourceEvidence"]["sha256"] = self.stop_hash

    def pointer(self, stage: str) -> dict:
        return {"schemaVersion": V2_POINTER_SCHEMA, "path": V2_GRANT_PATH, "sha256": self.grant_hash, "stage": stage}

    def dispatch_block(self) -> dict:
        return {
            "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": self.key, "chainMode": "SUCCESSOR",
            "chainOrdinal": self.stop_block["chainOrdinal"] + 1,
            "predecessor": {"path": STOP_PATH, "sha256": self.stop_hash},
            "blockerDelta": {"prior": list(self.blockers), "resolved": [], "retained": list(self.blockers),
                             "new": [], "reopened": [], "current": list(self.blockers)},
            "resolutionEvidence": {},
            "counters": {**self.counters, "nonDecreasingBlockerTransitions": self.counters["nonDecreasingBlockerTransitions"] + 1},
            "claims": [], "requiredDisposition": "ROOT_CONTRACT_REQUIRED",
            "successorScope": "INTEGRATED_ROOT_CONTRACT", "rootContractAdmission": self.pointer("DISPATCH"),
        }

    def return_block(self, work_hash: str) -> dict:
        ids = [f"proof-{i}" for i, _ in enumerate(self.blockers)]
        return {
            "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": self.key, "chainMode": "SUCCESSOR",
            "chainOrdinal": self.stop_block["chainOrdinal"] + 2,
            "predecessor": {"path": V2_WORK_PATH, "sha256": work_hash},
            "blockerDelta": {"prior": list(self.blockers), "resolved": list(self.blockers), "retained": [],
                             "new": [], "reopened": [], "current": []},
            "resolutionEvidence": {b: {"evidenceClass": "EXECUTABLE_PROOF", "evidencePath": V2_EP_PATH,
                                       "sha256": _sha(self.ep_bytes), "locator": f"fixture-proof-locator-{b}",
                                       "claimId": ids[i]} for i, b in enumerate(self.blockers)},
            "counters": {**self.counters, "nonDecreasingBlockerTransitions": 0},
            "claims": [{"claimId": cid, "claimClass": "SCHEMA_COMPATIBILITY",
                        "proofClass": "EXECUTABLE_BUILDER_VALIDATOR_CONTRACT_TEST",
                        "evidenceRef": V2_PROOF_PATH} for cid in ids],
            "requiredDisposition": "READY_WITH_EXECUTABLE_PROOF", "successorScope": "EXECUTABLE_IMPLEMENTATION",
            "rootContractAdmission": self.pointer("RETURN"),
        }

    def rebuild(self, *, grant_bytes: bytes | None = None, reassess_bytes: bytes | None = None,
                dispatch=None, returned=None, ledger: bool = True, pin_reassessment: bool = True) -> None:
        reassess = reassess_bytes if reassess_bytes is not None else _fence("root-reassessment-json", self.reassess)
        self._write(self.reassess_path, reassess)
        if pin_reassessment:
            self.grant["rootReassessment"] = {"path": self.reassess_path, "sha256": _sha(reassess)}
        grant = grant_bytes if grant_bytes is not None else _fence("post-stop-root-admission-json", self.grant)
        self._write(V2_GRANT_PATH, grant)
        self.grant_hash = _sha(grant)
        self.dispatch = self.dispatch_block()
        if dispatch:
            dispatch(self.dispatch)
        work = _markdown(self.dispatch, ledger=self.ledger if ledger else None).encode("utf-8")
        self._write(V2_WORK_PATH, work)
        self.returned = self.return_block(_sha(work))
        if returned:
            returned(self.returned)
        self._write(V2_RETURN_PATH, _markdown(self.returned).encode("utf-8"))

    def codes(self, path: str, kind: str) -> set[str]:
        result = scec.diagnose_file(path, (self.root / path).read_text(encoding="utf-8"), require_block=True)
        self.assertEqual(result.block_count, 1, f"{kind}: invalid admission must remain an evaluated active block")
        EVALUATED[kind] += result.block_count
        return {v.code for _, v in result.violations}

    def check(self, kind: str, code: str, mutate=None, *, path: str = V2_WORK_PATH, also: tuple[str, ...] = (),
              after=None, **rebuild_args) -> set[str]:
        self.build()
        if mutate:
            mutate(self)
        self.rebuild(**rebuild_args)
        if after:
            after(self)
        found = self.codes(path, kind)
        self.assertIn(code, found, f"{kind}: {sorted(found)}")
        for extra in also:
            self.assertIn(extra, found, f"{kind}: {sorted(found)}")
        return found


class PostStopAdmissionTests(PostStopFixture):
    def test_valid_direct_dispatch_retains_all_blockers_and_return_resolves_all(self) -> None:
        for path, kind in ((V2_WORK_PATH, "VALID_DISPATCH"), (V2_RETURN_PATH, "VALID_RETURN")):
            self.assertEqual(self.codes(path, kind), set(), path)
        self.assertEqual((self.dispatch["chainOrdinal"], self.dispatch["counters"]["nonDecreasingBlockerTransitions"]), (3, 3))
        self.assertEqual(set(self.dispatch["blockerDelta"]["retained"]), set(V2_STOP_LOCATORS))
        self.assertEqual((self.returned["chainOrdinal"], self.returned["counters"]["nonDecreasingBlockerTransitions"]), (4, 0))
        self.assertEqual(set(self.returned["blockerDelta"]["resolved"]), set(V2_STOP_LOCATORS))
        self.assertEqual(self.returned["blockerDelta"]["current"], [])
        self.assertEqual({k: self.returned["counters"][k] for k in list(self.counters)[:3]}, {k: 0 for k in list(self.counters)[:3]})

    def test_no_pointer_and_v1_pointer_reject_actual_stop_successor(self) -> None:
        self.build()
        self.rebuild(dispatch=lambda b: b.pop("rootContractAdmission"))
        found = self.codes(V2_WORK_PATH, "NO_POINTER")
        self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", found)
        self.assertIn("MISSING_STOP_REASSESS_ESCALATION", found)
        v1_grant = {
            "schemaVersion": "cvf.scecRootContractAdmission@1.0.0", "status": "ACCEPTED_FOR_BOUNDED_SOURCE_IMPLEMENTATION",
            "decisionOwner": "LOCAL", "operatorInstructionEvidence": "fixture operator consent", "problemKey": self.key,
            "predecessor": {"path": STOP_PATH, "sha256": STOP_RAW_SHA},
            "sourceContract": {"path": V2_SOURCE_PATH, "sha256": _sha(self.source_bytes)},
            "workOrderPath": V2_WORK_PATH, "workerReturnPath": V2_RETURN_PATH,
            "allowedArtifacts": [V2_RETURN_PATH, V2_EP_PATH, V2_PROOF_PATH],
            "effectCeilings": {name: 0 for name in EFFECT_NAMES}, "expiresAtUtc": self.grant["expiresAtUtc"],
        }
        v1_bytes = _fence("root-contract-admission-json", v1_grant)
        self._write(V1_GRANT_PATH, v1_bytes)

        def use_v1(block: dict) -> None:
            block["rootContractAdmission"] = {"schemaVersion": POINTER_SCHEMA, "path": V1_GRANT_PATH,
                                              "sha256": _sha(v1_bytes), "stage": "DISPATCH"}
        self.rebuild(dispatch=use_v1)
        found = self.codes(V2_WORK_PATH, "V1_POINTER")
        self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", found)

    def test_pointer_shape_rejects(self) -> None:
        cases = {
            "missing-stage": lambda b: b["rootContractAdmission"].pop("stage"),
            "extra-field": lambda b: b["rootContractAdmission"].update(extra=1),
            "unknown-stage": lambda b: b["rootContractAdmission"].update(stage="SECOND"),
            "traversal-path": lambda b: b["rootContractAdmission"].update(path="docs/baselines/../x.md"),
            "bad-sha-shape": lambda b: b["rootContractAdmission"].update(sha256="xyz"),
        }
        for name, edit in cases.items():
            with self.subTest(case=name):
                self.check("POINTER", "ROOT_ADMISSION_V2_POINTER", dispatch=edit)

    def test_context_and_actual_artifact_identity_required(self) -> None:
        kwargs = dict(predecessor_hash_resolver=scec._repo_predecessor_hash_resolver,
                      predecessor_block_resolver=scec._repo_predecessor_block_resolver)
        evidence = scec._repo_evidence_bytes_resolver
        cases = (
            ("no-resolvers", scec.validate_block(self.dispatch), "ROOT_ADMISSION_CONTEXT_MISSING"),
            ("no-artifact-path", scec.validate_block(self.dispatch, evidence_bytes_resolver=evidence, **kwargs),
             "ROOT_ADMISSION_V2_CONTEXT"),
            ("no-evidence-resolver", scec.validate_block(self.dispatch, artifact_path=V2_WORK_PATH, **kwargs),
             "ROOT_ADMISSION_V2_CONTEXT"),
            ("unsafe-artifact-path", scec.validate_block(
                self.dispatch, artifact_path="../x.md", evidence_bytes_resolver=evidence, **kwargs),
             "ROOT_ADMISSION_V2_CONTEXT"),
            ("initial-chain", scec.validate_block(
                dict(self.dispatch, chainMode="INITIAL", chainOrdinal=0, predecessor=None),
                artifact_path=V2_WORK_PATH, evidence_bytes_resolver=evidence, **kwargs),
             "ROOT_ADMISSION_CONTEXT_MISSING"),
        )
        for name, result, code in cases:
            with self.subTest(case=name):
                self.assertTrue(result.is_active)
                EVALUATED["CONTEXT"] += 1
                self.assertIn(code, {v.code for v in result.violations})
        direct = scec._admission.validate_post_stop_admission(
            self.dispatch, V2_WORK_PATH, None, evidence, scec.validate_work_order)
        EVALUATED["CONTEXT"] += 1
        self.assertEqual([v.code for v in direct], ["ROOT_ADMISSION_V2_CONTEXT"])

    def test_grant_identity_schema_and_bytes_reject(self) -> None:
        dup = json.dumps(self.grant).replace('"status":', '"status": "X", "status":', 1)
        raw = {
            "version": lambda s: s.grant.update(schemaVersion="cvf.scecRootContractAdmission@1.0.0"),
            "status": lambda s: s.grant.update(status="ACCEPTED_FOR_BOUNDED_SOURCE_IMPLEMENTATION"),
            "worker-owner": lambda s: s.grant.update(decisionOwner="WORKER"),
            "renamed-key": lambda s: s.grant.update(problemKey="renamed-problem"),
            "missing-field": lambda s: s.grant.pop("expiresAtUtc"),
            "extra-field": lambda s: s.grant.update(extra=1),
            "stop-pin-empty-blockers": lambda s: s.grant["predecessor"].update(blockers=[]),
            "stop-pin-bool-counter": lambda s: s.grant["predecessor"]["counters"].update(partialReadyClosures=True),
            "stop-pin-missing-counter": lambda s: s.grant["predecessor"]["counters"].pop("sameClaimCorrections"),
            "stop-pin-bool-ordinal": lambda s: s.grant["predecessor"].update(chainOrdinal=True),
            "stop-pin-extra-field": lambda s: s.grant["predecessor"].update(extra=1),
        }
        for name, edit in raw.items():
            with self.subTest(case=name):
                self.check("GRANT", "ROOT_ADMISSION_V2_GRANT", edit)
        byte_cases = {
            "duplicate-key": _fence("post-stop-root-admission-json", dup),
            "oversize": b"x" * 65537,
            "non-utf8": b"\xff\xfe",
            "no-object": b"# Admission without an object\n",
            "two-objects": _fence("post-stop-root-admission-json", self.grant) * 2,
        }
        for name, content in byte_cases.items():
            with self.subTest(case=name):
                self.check("GRANT", "ROOT_ADMISSION_V2_GRANT", grant_bytes=content)
        with self.subTest(case="raw-hash-drift"):
            self.check("GRANT", "ROOT_ADMISSION_V2_GRANT", dispatch=lambda b: b["rootContractAdmission"].update(sha256="f" * 64))
        with self.subTest(case="archive-and-wrong-family"):
            archive = "docs/baselines/archive/CVF_TEST_V2_ADMISSION.md"
            self.check("GRANT", "ROOT_ADMISSION_V2_GRANT", after=lambda s: s._write(archive, (s.root / V2_GRANT_PATH).read_bytes()),
                       dispatch=lambda b: b["rootContractAdmission"].update(path=archive))
            self.check("GRANT", "ROOT_ADMISSION_V2_GRANT", dispatch=lambda b: b["rootContractAdmission"].update(path=V2_WORK_PATH))
        with self.subTest(case="resolver-reports-symlink-escape-as-missing"):
            self.build()
            real = scec._repo_evidence_bytes_resolver
            with patch.object(scec, "_repo_evidence_bytes_resolver", lambda p: None if p == V2_GRANT_PATH else real(p)):
                result = scec.diagnose_file(V2_WORK_PATH, (self.root / V2_WORK_PATH).read_text(encoding="utf-8"), require_block=True)
            EVALUATED["GRANT"] += result.block_count
            self.assertEqual(result.block_count, 1)
            self.assertIn("ROOT_ADMISSION_V2_GRANT", {v.code for _, v in result.violations})

    def test_operator_instruction_evidence_rejects(self) -> None:
        cases = {
            "locator-absent": lambda s: s.grant["operatorInstructionEvidence"].update(locator="NOT IN FILE"),
            "locator-ambiguous": lambda s: s.set_operator(s.operator_bytes + b"FIXTURE OPERATOR INSTRUCTION RECORD again\n"),
            "hash-drift": lambda s: s.grant["operatorInstructionEvidence"].update(sha256="f" * 64),
            "unsafe-path": lambda s: s.grant["operatorInstructionEvidence"].update(path="../x.md"),
            "absolute-path": lambda s: s.grant["operatorInstructionEvidence"].update(path="/etc/x.md"),
            "drive-path": lambda s: s.grant["operatorInstructionEvidence"].update(path="C:/x.md"),
            "backslash-path": lambda s: s.grant["operatorInstructionEvidence"].update(path="docs\\baselines\\x.md"),
            "extra-field": lambda s: s.grant["operatorInstructionEvidence"].update(extra=1),
            "plain-string": lambda s: s.grant.update(operatorInstructionEvidence="operator said yes"),
            "non-utf8": lambda s: s.set_operator(b"\xff\xfe"),
            "oversize": lambda s: s.set_operator(b"x" * (2097152 + 1)),
        }
        for name, edit in cases.items():
            with self.subTest(case=name):
                self.check("EVIDENCE", "ROOT_ADMISSION_V2_EVIDENCE", edit)

    def test_source_contract_rejects(self) -> None:
        cases = {
            "hash-drift": lambda s: s.grant["sourceContract"].update(sha256="f" * 64),
            "missing": lambda s: s.grant.update(sourceContract={"path": "docs/baselines/CVF_TEST_V2_MISSING.md", "sha256": "a" * 64}),
            "not-baseline": lambda s: s.grant.update(sourceContract={"path": STOP_PATH, "sha256": STOP_RAW_SHA}),
            "non-utf8": lambda s: s.set_source(b"\xff\xfe"),
            "oversize": lambda s: s.set_source(b"x" * (2097152 + 1)),
            "extra-field": lambda s: s.grant["sourceContract"].update(extra=1),
        }
        for name, edit in cases.items():
            with self.subTest(case=name):
                self.check("SOURCE", "ROOT_ADMISSION_V2_SOURCE", edit)

    def test_root_reassessment_accepted_state_rejects(self) -> None:
        dup = json.dumps(self.reassess).replace('"status":', '"status": "X", "status":', 1)
        cases = {
            "pending-proposal-status": lambda s: s.reassess.update(status="PENDING_LOCAL_REVIEW"),
            "worker-owner": lambda s: s.reassess.update(decisionOwner="WORKER"),
            "wrong-scope": lambda s: s.reassess.update(scope="NARROW_BOUNDED"),
            "wrong-version": lambda s: s.reassess.update(schemaVersion="cvf.scecIntegratedRootReassessment@0.9.0"),
            "wrong-key": lambda s: s.reassess.update(problemKey="other-problem"),
            "empty-obligations": lambda s: s.reassess.update(obligations=[]),
            "missing-blocker": lambda s: s.reassess.update(obligations=s.reassess["obligations"][:-1]),
            "extra-blocker": lambda s: s.reassess["obligations"].append(
                {**copy.deepcopy(s.reassess["obligations"][0]), "blockerId": "EXTRA_BLOCKER"}),
            "duplicate-blocker": lambda s: s.reassess["obligations"].append(copy.deepcopy(s.reassess["obligations"][0])),
            "extra-field": lambda s: s.reassess.update(extra=1),
            "stopped-pin-differs": lambda s: s.reassess["stoppedPredecessor"].update(sha256="e" * 64),
            "source-pin-differs": lambda s: s.reassess["sourceContract"].update(sha256="e" * 64),
            "design-outside-source": lambda s: s.reassess["obligations"][0].update(
                designEvidence={"path": V2_OPERATOR_PATH, "sha256": _sha(s.operator_bytes), "locator": "FIXTURE OPERATOR INSTRUCTION RECORD"}),
            "source-evidence-not-naming-blocker": lambda s: s.reassess["obligations"][0].update(
                sourceEvidence={"path": V2_UNRELATED_PATH, "sha256": _sha(b"unrelated review text locator\n"), "locator": "unrelated review text locator"}),
            "ambiguous-locator": lambda s: s.reassess["obligations"][0]["sourceEvidence"].update(locator="LR1"),
            "absent-locator": lambda s: s.reassess["obligations"][0]["sourceEvidence"].update(locator="NOT IN REVIEW"),
            "worker-return-path": lambda s: setattr(s, "reassess_path", "docs/reviews/CVF_TEST_V2_ROOT_REASSESSMENT_WORKER_RETURN_2026-10-20.md"),
        }
        for name, edit in cases.items():
            with self.subTest(case=name):
                self.check("REASSESSMENT", "ROOT_ADMISSION_V2_REASSESSMENT", edit)
        byte_cases = {
            "duplicate-key": _fence("root-reassessment-json", dup),
            "mere-words-no-object": b"# Review\n\nroot integrated reassessment accepted by Local.\n",
            "non-utf8": b"\xff\xfe",
            "oversize": b"x" * 65537,
        }
        for name, content in byte_cases.items():
            with self.subTest(case=name):
                self.check("REASSESSMENT", "ROOT_ADMISSION_V2_REASSESSMENT", reassess_bytes=content)

        def drift(s: "PostStopFixture") -> None:
            s.grant["rootReassessment"] = {"path": V2_REASSESS_PATH, "sha256": "f" * 64}
        with self.subTest(case="pin-hash-drift"):
            self.check("REASSESSMENT", "ROOT_ADMISSION_V2_REASSESSMENT", drift, pin_reassessment=False)
        with self.subTest(case="pin-missing-file"):
            self.check("REASSESSMENT", "ROOT_ADMISSION_V2_REASSESSMENT", lambda s: s.grant.update(
                rootReassessment={"path": "docs/reviews/CVF_TEST_V2_NO_SUCH_REASSESSMENT.md", "sha256": "a" * 64}), pin_reassessment=False)

    def test_paths_manifest_and_authority_separation_reject(self) -> None:
        path_cases = {
            "work-order-wrong-family": lambda s: s.grant.update(workOrderPath="docs/reviews/CVF_TEST_V2_DISPATCH.md"),
            "work-equals-return": lambda s: s.grant.update(workerReturnPath=V2_WORK_PATH),
            "return-wrong-family": lambda s: s.grant.update(workerReturnPath="docs/baselines/CVF_TEST_V2_RETURN.md"),
            "return-absolute": lambda s: s.grant.update(workerReturnPath="/docs/reviews/x.md"),
            "return-drive": lambda s: s.grant.update(workerReturnPath="C:/docs/reviews/x.md"),
            "return-backslash": lambda s: s.grant.update(workerReturnPath="docs\\reviews\\x.md"),
            "return-traversal": lambda s: s.grant.update(workerReturnPath="docs/reviews/../x.md"),
            "operator-equals-source": lambda s: s.grant.update(operatorInstructionEvidence={
                "path": V2_SOURCE_PATH, "sha256": _sha(s.source_bytes), "locator": f"DESIGN-OBLIGATION {s.blockers[0]}"}),
        }
        for name, edit in path_cases.items():
            with self.subTest(case=name):
                self.check("PATH", "ROOT_ADMISSION_V2_PATH", edit)
        manifest_cases = {
            "narrowed": lambda s: s.grant.update(allowedArtifacts=[V2_RETURN_PATH, V2_PROOF_PATH]),
            "widened": lambda s: s.grant["allowedArtifacts"].append("docs/reviews/CVF_TEST_V2_EXTRA.md"),
            "duplicate": lambda s: s.grant["allowedArtifacts"].append(V2_EP_PATH),
            "missing-return": lambda s: s.grant.update(allowedArtifacts=[V2_EP_PATH, V2_PROOF_PATH]),
            "writable-grant": lambda s: s.grant["allowedArtifacts"].append(V2_GRANT_PATH),
            "writable-reassessment": lambda s: s.grant["allowedArtifacts"].append(V2_REASSESS_PATH),
            "writable-source": lambda s: s.grant["allowedArtifacts"].append(V2_SOURCE_PATH),
            "writable-stop": lambda s: s.grant["allowedArtifacts"].append(STOP_PATH),
            "writable-work-order": lambda s: s.grant["allowedArtifacts"].append(V2_WORK_PATH),
            "not-a-list": lambda s: s.grant.update(allowedArtifacts=V2_RETURN_PATH),
            "unsafe-entry": lambda s: s.grant["allowedArtifacts"].append("../escape.md"),
            "ledger-union-changed": lambda s: s.ledger["requirements"][0].update(expectedArtifacts=[V2_RETURN_PATH, V2_EP_PATH]),
        }
        for name, edit in manifest_cases.items():
            with self.subTest(case=name):
                self.check("MANIFEST", "ROOT_ADMISSION_V2_MANIFEST", edit)
        with self.subTest(case="missing-or-invalid-ledger"):
            self.check("WORK_ORDER", "ROOT_ADMISSION_V2_WORK_ORDER", ledger=False)
            self.check("WORK_ORDER", "ROOT_ADMISSION_V2_WORK_ORDER", lambda s: s.ledger.update(proofCatalog=[]))

    def test_each_effect_ceiling_must_be_strict_integer_zero(self) -> None:
        for name in EFFECT_NAMES:
            for value in (1, True, False, 0.0, "0", None):
                with self.subTest(effect=name, value=repr(value)):
                    self.check("EFFECT", "ROOT_ADMISSION_V2_EFFECT", lambda s, n=name, v=value: s.grant["effectCeilings"].update({n: v}))
        with self.subTest(case="missing-or-extra-effect"):
            self.check("EFFECT", "ROOT_ADMISSION_V2_EFFECT", lambda s: s.grant["effectCeilings"].pop("deployments"))
            self.check("EFFECT", "ROOT_ADMISSION_V2_EFFECT", lambda s: s.grant["effectCeilings"].update(extra=0))

    def test_expiry_uses_actual_utc_with_test_scoped_clock_seam(self) -> None:
        for value in ("2000-01-01T00:00:00Z", "2099-01-01Z", "2099-01-01T00:00:00+00:00", "2099-01-01T00:00:00z",
                      "2099-01-01 00:00:00Z", 4102444800, None):
            with self.subTest(expiry=repr(value)):
                self.check("EXPIRED", "ROOT_ADMISSION_V2_EXPIRED", lambda s, v=value: s.grant.update(expiresAtUtc=v))
        self.build()
        expiry = datetime.fromisoformat(self.grant["expiresAtUtc"].replace("Z", "+00:00"))
        for label, now in (("at-expiry", expiry), ("after-expiry", expiry + timedelta(seconds=1))):
            with self.subTest(clock=label), patch.object(scec._admission, "_utc_now", return_value=now):
                self.assertIn("ROOT_ADMISSION_V2_EXPIRED", self.codes(V2_WORK_PATH, "EXPIRED"))
        with patch.object(scec._admission, "_utc_now", return_value=expiry - timedelta(seconds=1)):
            self.assertEqual(self.codes(V2_WORK_PATH, "VALID_DISPATCH"), set())
        self.assertNotIn("_utc_now", inspect.signature(scec.validate_block).parameters)
        self.assertNotIn("environ", inspect.getsource(scec._admission))
        self.assertFalse(hasattr(scec._admission, "os"))

    def test_dispatch_must_directly_succeed_the_actual_stop_with_every_blocker(self) -> None:
        first, rest = self.blockers[0], self.blockers[1:]
        delta = lambda **kw: (lambda b: b["blockerDelta"].update(kw))  # noqa: E731
        cases = {
            "blocker-omitted-silently": ("ROOT_ADMISSION_V2_CHAIN", delta(retained=rest, current=rest)),
            "blocker-omitted-from-prior": ("ROOT_ADMISSION_V2_CHAIN", delta(prior=rest, retained=rest, current=rest)),
            "extra-new-blocker": ("ROOT_ADMISSION_V2_CHAIN", delta(new=["EXTRA"], current=self.blockers + ["EXTRA"])),
            "reopened-blocker": ("ROOT_ADMISSION_V2_CHAIN", delta(reopened=["EXTRA"], current=self.blockers + ["EXTRA"])),
            "resolved-by-documentation": ("RESOLUTION_EVIDENCE_MISSING_BINDING", delta(resolved=[first], retained=rest, current=rest)),
            "resolved-with-review-binding": ("ROOT_ADMISSION_V2_CHAIN", lambda b: (
                b["blockerDelta"].update(resolved=[first], retained=rest, current=rest),
                b["resolutionEvidence"].update({first: {"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": STOP_PATH,
                                                        "sha256": STOP_RAW_SHA, "locator": V2_STOP_LOCATORS[first]}}))),
            "evidence-without-resolution": ("RESOLUTION_EVIDENCE_EXTRA_BINDING", lambda b: b["resolutionEvidence"].update(
                {first: {"evidenceClass": "ACCEPTED_REVIEW", "evidencePath": STOP_PATH, "sha256": STOP_RAW_SHA, "locator": V2_STOP_LOCATORS[first]}})),
            "streak-reset": ("NON_DECREASING_STREAK_MISMATCH", lambda b: b["counters"].update(nonDecreasingBlockerTransitions=0)),
            "streak-wrong": ("ROOT_ADMISSION_V2_CHAIN", lambda b: b["counters"].update(nonDecreasingBlockerTransitions=2)),
            "cumulative-counter-changed": ("ROOT_ADMISSION_V2_CHAIN", lambda b: b["counters"].update(partialReadyClosures=1)),
            "ordinal-skipped": ("PREDECESSOR_ORDINAL_DISCONTINUITY", lambda b: b.update(chainOrdinal=5)),
            "ordinal-reset-to-same": ("PREDECESSOR_ORDINAL_DISCONTINUITY", lambda b: b.update(chainOrdinal=2)),
            "renamed-key": ("PREDECESSOR_PROBLEM_KEY_MISMATCH", lambda b: b.update(problemKey="renamed-problem")),
            "continue-bounded": ("ROOT_ADMISSION_V2_DISPATCH", lambda b: b.update(requiredDisposition="CONTINUE_BOUNDED")),
            "narrow-scope": ("ROOT_ADMISSION_V2_DISPATCH", lambda b: b.update(successorScope="INITIAL_BOUNDED")),
            "runtime-ready-claim": ("ROOT_ADMISSION_V2_DISPATCH", lambda b: b.update(claims=[{
                "claimId": "c", "claimClass": "DOCUMENTATION_ONLY", "proofClass": "PROPOSAL_ONLY_NO_RUNTIME_READINESS",
                "evidenceRef": "runtime ready"}])),
            "predecessor-other-hash": ("PREDECESSOR_HASH_MISMATCH", lambda b: b["predecessor"].update(sha256="e" * 64)),
        }
        for name, (code, edit) in cases.items():
            with self.subTest(case=name):
                self.check("CHAIN" if "V2_CHAIN" in code else "DISPATCH", code, dispatch=edit)
        with self.subTest(case="new-initial-with-pointer"):
            self.check("CONTEXT", "ROOT_ADMISSION_CONTEXT_MISSING",
                       dispatch=lambda b: b.update(chainMode="INITIAL", chainOrdinal=0, predecessor=None))

    def test_pinned_stop_state_and_earlier_fork_reject(self) -> None:
        def earlier(s: "PostStopFixture") -> None:
            early = {"schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": s.key, "chainMode": "INITIAL",
                     "chainOrdinal": 0, "predecessor": None,
                     "blockerDelta": {"prior": [], "resolved": [], "retained": [], "new": list(s.blockers),
                                      "reopened": [], "current": list(s.blockers)},
                     "resolutionEvidence": {}, "counters": {k: 0 for k in s.counters},
                     "claims": [{"claimId": "e", "claimClass": "OTHER", "proofClass": "NAMED_OBSERVABLE_PROOF", "evidenceRef": STOP_PATH}],
                     "requiredDisposition": "CONTINUE_BOUNDED", "successorScope": "INITIAL_BOUNDED"}
            s._write(V2_EARLIER_PATH, _markdown(early).encode("utf-8"))

        def fork(block: dict) -> None:
            block.update(chainOrdinal=1, predecessor={
                "path": V2_EARLIER_PATH, "sha256": _sha((self.root / V2_EARLIER_PATH).read_bytes())})
        with self.subTest(case="fork-from-earlier-worker"):
            self.check("STOP", "ROOT_ADMISSION_V2_STOP", earlier, dispatch=fork)
        cases = {
            "pinned-counters-differ": lambda s: s.grant["predecessor"]["counters"].update(nonDecreasingBlockerTransitions=1),
            "pinned-ordinal-differs": lambda s: s.grant["predecessor"].update(chainOrdinal=3),
            "pinned-blockers-fewer": lambda s: (s.grant["predecessor"].update(blockers=s.blockers[:-1]),
                                                s.reassess.update(obligations=s.reassess["obligations"][:-1])),
            "actual-predecessor-not-stop": lambda s: s.set_stop(_stop_variant(lambda block: block.update(
                requiredDisposition="ROOT_CONTRACT_REQUIRED", successorScope="INTEGRATED_ROOT_CONTRACT",
                counters={**block["counters"], "nonDecreasingBlockerTransitions": 0}))),
        }
        for name, edit in cases.items():
            with self.subTest(case=name):
                self.check("STOP", "ROOT_ADMISSION_V2_STOP", edit)
        with self.subTest(case="pinned-hash-differs"):
            self.check("REASSESSMENT", "ROOT_ADMISSION_V2_REASSESSMENT", lambda s: s.grant["predecessor"].update(sha256="e" * 64))
        with self.subTest(case="narrowed-successor-stop-predecessor-is-invalid-itself"):
            self.check("STOP", "PREDECESSOR_BLOCK_INVALID", lambda s: s.set_stop(_stop_variant(
                lambda block: block.update(successorScope="INITIAL_BOUNDED"))))

    def test_return_must_immediately_follow_admitted_work_order_with_executable_proof(self) -> None:
        first, rest = self.blockers[0], self.blockers[1:]
        bindings = lambda b: b["resolutionEvidence"]  # noqa: E731

        def duplicate_locator(s: "PostStopFixture") -> None:
            s.ep_bytes += f"fixture-proof-locator-{first}\n".encode("utf-8")
            s._write(V2_EP_PATH, s.ep_bytes)
        cases = {
            "pointer-stage-dispatch": ("ROOT_ADMISSION_V2_DISPATCH", lambda b: b["rootContractAdmission"].update(stage="DISPATCH"), None),
            "work-order-hash-wrong": ("ROOT_ADMISSION_V2_RETURN", lambda b: b["predecessor"].update(sha256="0" * 64), None),
            "predecessor-not-work-order": ("ROOT_ADMISSION_V2_RETURN", lambda b: b["predecessor"].update(path=STOP_PATH, sha256=STOP_RAW_SHA), None),
            "other-grant-pointer": ("ROOT_ADMISSION_V2_GRANT", lambda b: b["rootContractAdmission"].update(sha256="f" * 64), None),
            "ordinal-skipped": ("PREDECESSOR_ORDINAL_DISCONTINUITY", lambda b: b.update(chainOrdinal=5), None),
            "blocker-left-active": ("ROOT_ADMISSION_V2_CHAIN", lambda b: (
                b["blockerDelta"].update(resolved=rest, retained=[first], current=[first]),
                bindings(b).pop(first)), None),
            "blocker-new": ("ROOT_ADMISSION_V2_CHAIN", lambda b: b["blockerDelta"].update(new=["EXTRA"], current=["EXTRA"]), None),
            "binding-omitted": ("RESOLUTION_EVIDENCE_MISSING_BINDING", lambda b: bindings(b).pop(first), None),
            "documentation-resolution": ("ROOT_ADMISSION_V2_PROOF", lambda b: bindings(b)[first].update(evidenceClass="ACCEPTED_REVIEW"), None),
            "evidence-outside-allowed": ("ROOT_ADMISSION_V2_PROOF", lambda b: bindings(b)[first].update(
                evidencePath=V2_SOURCE_PATH, sha256=_sha(self.source_bytes), locator=f"DESIGN-OBLIGATION {first}"), None),
            "claim-link-missing": ("RESOLUTION_EVIDENCE_EXECUTABLE_MISSING_CLAIM_LINK", lambda b: bindings(b)[first].pop("claimId"), None),
            "claim-unknown": ("RESOLUTION_EVIDENCE_INVALID_CLAIM_LINK", lambda b: bindings(b)[first].update(claimId="nope"), None),
            "claim-doc-only": ("ROOT_ADMISSION_V2_PROOF", lambda b: b["claims"][0].update(
                claimClass="DOCUMENTATION_ONLY", proofClass="PROPOSAL_ONLY_NO_RUNTIME_READINESS"), None),
            "claim-evidence-missing-file": ("ROOT_ADMISSION_V2_PROOF", lambda b: b["claims"][0].update(evidenceRef="governance/compat/missing_proof.py"), None),
            "claim-evidence-not-allowed": ("ROOT_ADMISSION_V2_PROOF", lambda b: b["claims"][0].update(evidenceRef=V2_SOURCE_PATH), None),
            "claims-empty": ("READY_WITHOUT_CLAIMS", lambda b: b.update(claims=[]), None),
            "duplicate-claim-id": ("ROOT_ADMISSION_V2_PROOF", lambda b: b["claims"][1].update(claimId=b["claims"][0]["claimId"]), None),
            "locator-absent": ("RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND", lambda b: bindings(b)[first].update(locator="not present anywhere"), None),
            "evidence-hash-drift": ("RESOLUTION_EVIDENCE_HASH_MISMATCH", lambda b: bindings(b)[first].update(sha256="f" * 64), None),
            "evidence-bytes-drift": ("RESOLUTION_EVIDENCE_HASH_MISMATCH", lambda b: None,
                                     lambda s: s._write(V2_EP_PATH, s.ep_bytes + b"drift\n")),
            "locator-duplicated": ("RESOLUTION_EVIDENCE_LOCATOR_AMBIGUOUS", lambda b: bindings(b)[first].update(sha256=_sha(self.ep_bytes + f"fixture-proof-locator-{first}\n".encode("utf-8"))),
                                   duplicate_locator),
            "streak-not-reset": ("ROOT_ADMISSION_V2_CHAIN", lambda b: b["counters"].update(nonDecreasingBlockerTransitions=3), None),
            "cumulative-counter-raised": ("ROOT_ADMISSION_V2_CHAIN", lambda b: b["counters"].update(sameClaimCorrections=1), None),
            "wrong-disposition": ("ROOT_ADMISSION_V2_RETURN", lambda b: b.update(requiredDisposition="CONTINUE_BOUNDED", successorScope="INITIAL_BOUNDED"), None),
            "renamed-key": ("PREDECESSOR_PROBLEM_KEY_MISMATCH", lambda b: b.update(problemKey="renamed-problem"), None),
        }
        for name, (code, edit, after) in cases.items():
            with self.subTest(case=name):
                self.check("PROOF" if "PROOF" in code else ("CHAIN" if "CHAIN" in code else "RETURN"), code,
                           returned=edit, after=after, path=V2_RETURN_PATH)
        with self.subTest(case="work-order-changed-after-return"):
            self.check("RETURN", "ROOT_ADMISSION_V2_RETURN", path=V2_RETURN_PATH, also=("PREDECESSOR_HASH_MISMATCH",),
                       after=lambda s: s._write(V2_WORK_PATH, (s.root / V2_WORK_PATH).read_bytes() + b"\n"))
        with self.subTest(case="return-at-wrong-path"):
            def copied(s: "PostStopFixture") -> None:
                s._write(V2_RETURN_SECOND_PATH, (s.root / V2_RETURN_PATH).read_bytes())
            self.check("SECOND_PAIR", "ROOT_ADMISSION_V2_RETURN", path=V2_RETURN_SECOND_PATH, after=copied)

    def test_grant_is_exhausted_by_its_one_pair(self) -> None:
        self.build()
        self._write(V2_WORK_SECOND_PATH, (self.root / V2_WORK_PATH).read_bytes())
        self.assertIn("ROOT_ADMISSION_V2_DISPATCH", self.codes(V2_WORK_SECOND_PATH, "SECOND_PAIR"))
        replay = dict(self.dispatch_block(), chainOrdinal=5, predecessor={"path": V2_RETURN_PATH, "sha256": _sha((self.root / V2_RETURN_PATH).read_bytes())})
        for stage in ("DISPATCH", "RETURN"):
            with self.subTest(replay_stage=stage):
                replay["rootContractAdmission"] = self.pointer(stage)
                self._write(V2_WORK_SECOND_PATH, _markdown(replay, ledger=self.ledger).encode("utf-8"))
                found = self.codes(V2_WORK_SECOND_PATH, "SECOND_PAIR")
                self.assertTrue(any(c.startswith("ROOT_ADMISSION_V2_") for c in found), sorted(found))
        direct = dict(self.returned, predecessor={"path": STOP_PATH, "sha256": STOP_RAW_SHA}, chainOrdinal=3)
        self._write(V2_RETURN_PATH, _markdown(direct).encode("utf-8"))
        found = self.codes(V2_RETURN_PATH, "SECOND_PAIR")
        self.assertIn("ROOT_ADMISSION_V2_RETURN", found)
        self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", found)

    def test_failed_and_interrupted_returns_keep_ordinary_stop_and_grant_no_new_pair(self) -> None:
        for kind, extra in (("FAILED_RETURN", []), ("INTERRUPTED_RETURN", ["WORKER_INTERRUPTED_BEFORE_PROOF"])):
            with self.subTest(outcome=kind):
                self.build()
                work = (self.root / V2_WORK_PATH).read_bytes()
                failed = {
                    "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": self.key, "chainMode": "SUCCESSOR",
                    "chainOrdinal": 4, "predecessor": {"path": V2_WORK_PATH, "sha256": _sha(work)},
                    "blockerDelta": {"prior": list(self.blockers), "resolved": [], "retained": list(self.blockers),
                                     "new": extra, "reopened": [], "current": self.blockers + extra},
                    "resolutionEvidence": {}, "counters": {**self.counters, "nonDecreasingBlockerTransitions": 4},
                    "claims": [{"claimId": "partial", "claimClass": "OTHER", "proofClass": "NAMED_OBSERVABLE_PROOF",
                                "evidenceRef": V2_EP_PATH}],
                    "requiredDisposition": "STOP_REASSESS_ARCHITECTURE", "successorScope": "NO_SUCCESSOR",
                }
                self._write(V2_RETURN_PATH, _markdown(failed).encode("utf-8"))
                self.assertEqual(self.codes(V2_RETURN_PATH, kind), set())
                successor = dict(failed, chainOrdinal=5, predecessor={"path": V2_RETURN_PATH, "sha256": _sha((self.root / V2_RETURN_PATH).read_bytes())})
                successor["counters"] = {**self.counters, "nonDecreasingBlockerTransitions": 5}
                for pointer in (None, self.pointer("DISPATCH")):
                    case = dict(successor)
                    if pointer:
                        case["rootContractAdmission"] = pointer
                    self._write(V2_WORK_SECOND_PATH, _markdown(case, ledger=self.ledger).encode("utf-8"))
                    self.assertIn("SUCCESSOR_AFTER_STOP_REASSESS", self.codes(V2_WORK_SECOND_PATH, "SECOND_PAIR"))

    def test_exception_is_narrow_and_unrelated_violations_remain_reported(self) -> None:
        bogus = [{"claimId": "c", "claimClass": "BOGUS", "proofClass": "NAMED_OBSERVABLE_PROOF", "evidenceRef": STOP_PATH}]
        found = self.check("ORDINARY_PRESERVED", "INVALID_CLAIM_CLASS", dispatch=lambda b: b.update(claims=bogus))
        self.assertNotIn("SUCCESSOR_AFTER_STOP_REASSESS", found)
        self.check("ORDINARY_PRESERVED", "MISSING_CLAIM_FIELD", dispatch=lambda b: b.update(claims=[{"claimId": "c"}]))
        self.check("ORDINARY_PRESERVED", "SET_RECONCILIATION_CURRENT", dispatch=lambda b: b["blockerDelta"].update(current=[]),
                   also=("ROOT_ADMISSION_V2_CHAIN",))
        self.check("ORDINARY_PRESERVED", "PREDECESSOR_COUNTER_RESET",
                   lambda s: s.set_stop(_stop_variant(lambda block: block["counters"].update(sameClaimCorrections=1))),
                   also=("ROOT_ADMISSION_V2_STOP", "SUCCESSOR_AFTER_STOP_REASSESS"))

    def test_duplicate_escaped_partial_and_wrong_version_pointer_remain_evaluated_failures(self) -> None:
        raw = json.dumps(self.dispatch)
        cases = {
            "duplicate-pointer-key": raw.replace('"rootContractAdmission":', '"rootContractAdmission": null, "rootContractAdmission":', 1),
            "duplicate-nested-key": raw.replace('"stage": "DISPATCH"', '"stage": "RETURN", "stage": "DISPATCH"'),
            "escaped-marker-with-duplicate": raw.replace("rootContractAdmission", r"rootContractAdmission").replace(
                '"stage": "DISPATCH"', '"stage": "RETURN", "stage": "DISPATCH"'),
            "truncated-object": raw[:-1],
        }
        for name, text in cases.items():
            with self.subTest(case=name):
                self._write(V2_WORK_PATH, ("```json\n" + text + "\n```\n").encode("utf-8"))
                self.assertIn("ROOT_ADMISSION_JSON_INVALID", self.codes(V2_WORK_PATH, "POINTER"))
        with self.subTest(case="null-pointer"):
            self.check("POINTER", "ROOT_ADMISSION_PARTIAL_POINTER", dispatch=lambda b: b.update(rootContractAdmission=None))
        with self.subTest(case="wrong-pointer-version"):
            self.check("POINTER", "ROOT_ADMISSION_POINTER_INVALID", dispatch=lambda b: b["rootContractAdmission"].update(
                schemaVersion="cvf.scecPostStopRootAdmissionPointer@2.0.1"))


class ZPostStopEvaluatedCountTests(unittest.TestCase):
    """Runs after the class above by name: every named class evaluated nonzero real objects."""

    def test_nonzero_evaluated_objects_for_dispatch_return_and_each_negative_class(self) -> None:
        required = ("ACTUAL_STOP", "VALID_DISPATCH", "VALID_RETURN", "NO_POINTER", "V1_POINTER", "POINTER", "CONTEXT",
                    "GRANT", "EVIDENCE", "SOURCE", "REASSESSMENT", "PATH", "MANIFEST", "WORK_ORDER", "EFFECT",
                    "EXPIRED", "STOP", "CHAIN", "DISPATCH", "RETURN", "PROOF", "SECOND_PAIR", "FAILED_RETURN",
                    "INTERRUPTED_RETURN", "ORDINARY_PRESERVED")
        missing = [name for name in required if EVALUATED[name] <= 0]
        self.assertEqual(missing, [], dict(EVALUATED))


if __name__ == "__main__":
    unittest.main()
