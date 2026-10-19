"""FLAL T3 offline composition: real intake builder bytes -> parent evidence validator/classifier -> receipts.

Synthetic, disposable temp roots only. Existing owners are called unmodified (no monkeypatch, no copied validator).
Fixture success is structural; it grants no project admission, semantic acceptance or production join enforcement.
Set FLAL_T3_EVIDENCE_OUT to a path to dump case-level evidence JSON after the run.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
LIB = REPO / "scripts" / "lib" / "downstream_governance"
DOCS = REPO / "docs" / "reference" / "downstream_gate_profile"
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(LIB))

import cvf_dg_common as common  # noqa: E402
import cvf_dg_install as inst  # noqa: E402
import cvf_dg_intake as intake  # noqa: E402
import parent_learning_evidence as ple  # noqa: E402

PROFILE = inst.load_profile(LIB)
DISPOSITIONS = ("RULE_EXISTS", "MACHINE_CHECK_ADDED", "STANDARD_UPDATED")
FID, PROJECT, SHA40 = "FND-T3-001", "synthetic-project", "a" * 40
RESULTS: list[dict] = []


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def finding(fid: str = FID, project: str = PROJECT) -> dict:
    data = json.loads((DOCS / "DOWNSTREAM_FINDING_INTAKE_TEMPLATE.json").read_text(encoding="utf-8"))
    data.update({"findingId": fid, "title": "Continuity drift passes doctor", "sourceProject": project, "sourceSha": SHA40,
                 "observed": "doctor PASS with drift", "expected": "drift blocks",
                 "negativeEvidence": [{"locator": "docs/reviews/x.md#L1", "description": "manual drift catch"}],
                 "chainJoins": [{"join": "template to executable", "gap": "no runner", "earliestControlPoint": "bootstrap"}],
                 "candidateControl": "CVF-DG-CONT-01 style gate", "claimLimits": "project claims unverified"})
    return data


class Chain:
    """Disposable root holding generated intake bytes plus a synthetic parent chain pinned to them."""

    def __init__(self, root: Path, scratch: Path) -> None:
        self.root, self.scratch = root, scratch

    def write(self, rel: str, raw: bytes | str) -> dict:
        raw = raw.encode("utf-8") if isinstance(raw, str) else raw
        (self.root / rel).parent.mkdir(parents=True, exist_ok=True)
        (self.root / rel).write_bytes(raw)
        return {"path": rel, "sha256": sha(raw)}

    def ref(self, rel: str, text: str, fragment: str = "L1", klass: str = "SYNTHETIC_OFFLINE") -> dict:
        return {**self.write(rel, text), "fragment": fragment, "evidenceClass": klass}

    def generate(self, data: dict) -> tuple[Path, str]:
        src = self.scratch / f"{data['findingId']}.finding.json"
        src.write_text(json.dumps(data), encoding="utf-8")
        target, problems = intake.build_intake(src, self.root, PROFILE)
        assert target is not None and not problems, problems
        return target, target.relative_to(self.root).as_posix()

    def source_ref(self, rel: str) -> dict:
        return {"path": rel, "sha256": sha((self.root / rel).read_bytes()), "fragment": "intake", "evidenceClass": "SYNTHETIC_OFFLINE"}

    def receipt(self, kind: str, ctl_ref: dict, **over) -> dict:
        body = {"schemaVersion": ple.RECEIPT_VERSION, "kind": kind, "findingId": FID, "sourceProject": PROJECT,
                "control": {"path": ctl_ref["path"], "sha256": ctl_ref["sha256"]}, "actor": "SYNTHETIC_LOCAL_REVIEWER",
                "authorization": self.ref(f"ev/{kind}-auth.txt", f"{kind} authorization"),
                "verification": self.ref(f"ev/{kind}-verify.txt", f"{kind} verification"),
                "claimLimits": "synthetic structural fixture only"}
        body.update(over)
        return self.ref(f"ev/{kind}-receipt.json", json.dumps(body), "receipt")

    def record(self, source_rel: str, returned: bool = True, applied: bool = True) -> dict:
        check = lambda n: {"status": "SUPPORTED", "reason": f"synthetic {n} support", "evidence": [self.ref(f"ev/{n}.txt", n)],
                           "limits": "structural only"}
        control = self.ref("ev/control.txt", "control v1", "control:v1")
        life = lambda state, ev=(): {"state": state, "reason": "synthetic", "evidence": list(ev)}
        delivery = [self.receipt("DELIVERY", control)] if returned else []
        application = [self.receipt("APPLICATION", control)] if applied else []
        return {"schemaVersion": ple.SCHEMA_VERSION, "findingId": FID,
                "source": {"sourceProject": PROJECT, "evidence": self.source_ref(source_rel)},
                "valueChecks": {n: check(n) for n in ple.CHECK_NAMES},
                "decision": {"state": "ACCEPT", "reason": "synthetic accept", "reviewer": "SYNTHETIC_LOCAL_REVIEWER",
                             "owner": "parent-f2g", "f2gDisposition": "MACHINE_CHECK_ADDED",
                             "evidence": [self.ref("ev/decision.txt", "synthetic decision bytes", "D1", "OBSERVED_LOCAL")]},
                "implementation": life("IMPLEMENTED_BOUNDED", [control, self.ref("ev/pos.txt", "pos", "proof-positive:1"),
                                                               self.ref("ev/neg.txt", "neg", "proof-negative:1")]),
                "projectResolution": life("OPEN"),
                "returnDelivery": life("RETURNED" if returned else "NOT_RETURNED", delivery),
                "projectApplication": life("APPLIED" if applied else "NOT_APPLIED", application),
                "claimLimits": "synthetic structural fixture only"}

    def issues(self, record: dict) -> list[dict]:
        return ple.validate_parent_evidence(record, FID, self.root, dispositions=DISPOSITIONS)

    def classify(self, record: dict) -> dict:
        self.write("registry.json", json.dumps({"entries": [{"findings": [{"id": FID, "parentEvidence": record}]}]}))
        report = ple.classify_registry(self.root, "registry.json", DISPOSITIONS)
        return {k: report[k] for k in ("typedValid", "legacyUntyped", "invalid")}


def types(issues: list[dict]) -> list[str]:
    return sorted({i["type"] for i in issues})


class OfflineCompositionTests(unittest.TestCase):
    def setUp(self) -> None:
        self._a, self._b = tempfile.TemporaryDirectory(), tempfile.TemporaryDirectory()
        self.addCleanup(self._a.cleanup)
        self.addCleanup(self._b.cleanup)
        self.chain = Chain(Path(self._a.name), Path(self._b.name))
        self.target, self.rel = self.chain.generate(finding())
        self.source_bytes = self.target.read_bytes()

    def assert_source_unchanged(self) -> None:
        self.assertEqual(self.target.read_bytes(), self.source_bytes, "composition must not rewrite generated source bytes")

    def note(self, case_id: str, expected: list[str], actual: list[str], blocked: str, **extra) -> None:
        RESULTS.append({"caseId": case_id, "expectedOwnerTypes": expected, "actualOwnerTypes": actual, "blockedClaim": blocked, **extra})

    def case(self, case_id: str, record: dict, expected: list[str], blocked: str) -> list[str]:
        actual = types(self.chain.issues(record))
        self.note(case_id, expected, actual, blocked, classifier=self.chain.classify(record))
        if expected:
            self.assertTrue(set(expected) <= set(actual), (case_id, expected, actual))
        else:
            self.assertEqual(actual, [], case_id)
        self.assert_source_unchanged()
        return actual

    def test_01_full_chain_with_real_builder_bytes_stays_pending(self) -> None:
        record = json.loads(self.source_bytes)
        self.assertEqual(intake.validate_record(common.load_json_strict(self.target), PROFILE), [])
        self.assertEqual((record["acceptance"], record["parentDisposition"]), ("NOT_ACCEPTED_GENERATION_ONLY", "PENDING_PARENT_ADMISSION"))
        self.assertTrue(all(v is None for v in record["parentLinks"].values()))
        chain = self.chain.record(self.rel)
        self.assertEqual(chain["source"]["evidence"]["sha256"], sha(self.source_bytes), "pin is over the actual generated bytes")
        self.case("FULL_SYNTHETIC_CHAIN", chain, [], "none: structural chain only; no semantic acceptance or project admission")
        self.assertEqual(self.chain.classify(chain), {"typedValid": 1, "legacyUntyped": 0, "invalid": 0})
        self.assertEqual((record["findingId"], record["sourceProject"]), (chain["findingId"], chain["source"]["sourceProject"]), "fixture join oracle")
        again, problems = intake.build_intake(self.chain.scratch / f"{FID}.finding.json", self.chain.root, PROFILE)
        self.assertEqual((problems, again.read_bytes()), ([], self.source_bytes), "regeneration is byte-identical")

    def test_02_staged_states_stay_truthfully_pending_or_parked(self) -> None:
        cases = {"STAGED_MISSING_RETURN": self.chain.record(self.rel, returned=False, applied=False),
                 "RETURNED_APPLICATION_NOT_APPLIED": self.chain.record(self.rel, returned=True, applied=False)}
        blocked = {"STAGED_MISSING_RETURN": "no RETURNED or APPLIED claim", "RETURNED_APPLICATION_NOT_APPLIED": "no APPLIED claim"}
        for case_id, record in cases.items():
            with self.subTest(case_id):
                self.case(case_id, record, [], blocked[case_id])
        parked = self.chain.record(self.rel, returned=False, applied=False)
        for name in ("returnDelivery", "projectApplication"):
            parked[name] = {"state": "PARKED_BY_OPERATOR", "reason": "operator parked", "evidence": []}
        parked["projectResolution"] = {"state": "PARKED_BY_OPERATOR", "reason": "operator parked", "evidence": []}
        self.case("PARKED_BY_OPERATOR_NO_APPLICATION", parked, [], "no return or application effect; parked is not a positive transition")
        with_receipt = json.loads(json.dumps(parked))
        with_receipt["returnDelivery"]["evidence"] = [self.chain.receipt("DELIVERY", parked["implementation"]["evidence"][0])]
        self.case("PARKED_WITH_RECEIPT", with_receipt, ["parked_with_receipt"], "no new receipt while parked")

    def test_03_receipt_and_claim_negatives_block_the_matching_claim(self) -> None:
        def mutate(fn) -> dict:
            record = self.chain.record(self.rel)
            fn(record, record["implementation"]["evidence"][0])
            return record

        def swap(record: dict, name: str, kind: str, **over) -> None:
            ctl = record["implementation"]["evidence"][0]
            record[name]["evidence"] = [self.chain.receipt(kind, ctl, **over)]
        cases = {
            "APPLIED_MISSING_APPLICATION_RECEIPT": (lambda r, c: r["projectApplication"].update(evidence=[]), ["receipt_count"], "APPLIED"),
            "SHARED_DELIVERY_APPLICATION_RECEIPT": (lambda r, c: r["projectApplication"].update(
                evidence=json.loads(json.dumps(r["returnDelivery"]["evidence"]))), ["receipt_wrong_type"], "APPLIED"),
            "DELIVERY_USES_APPLICATION_KIND": (lambda r, c: swap(r, "returnDelivery", "APPLICATION"), ["receipt_wrong_type"], "RETURNED"),
            "RECEIPT_FINDING_MISMATCH": (lambda r, c: swap(r, "returnDelivery", "DELIVERY", findingId="OTHER-ID"), ["receipt_join_mismatch"], "RETURNED"),
            "RECEIPT_SOURCE_PROJECT_MISMATCH": (lambda r, c: swap(r, "projectApplication", "APPLICATION", sourceProject="other-project"),
                                                ["receipt_join_mismatch"], "APPLIED"),
            "RECEIPT_CONTROL_MISMATCH": (lambda r, c: swap(r, "projectApplication", "APPLICATION", control={"path": c["path"], "sha256": "1" * 64}),
                                         ["receipt_control_mismatch"], "APPLIED"),
        }
        for case_id, (fn, expected, claim) in cases.items():
            with self.subTest(case_id):
                self.case(case_id, mutate(fn), expected, f"{claim} claim blocked")

    def test_04_changed_generated_source_with_stale_pin_is_detected(self) -> None:
        record = self.chain.record(self.rel)
        self.target.write_bytes(self.source_bytes + b" ")
        actual = types(self.chain.issues(record))
        self.note("STALE_SOURCE_PIN", ["hash_mismatch"], actual, "source evidence claim blocked until re-pinned")
        self.assertIn("hash_mismatch", actual)
        self.assertEqual(self.chain.classify(record)["invalid"], 1)
        self.target.write_bytes(self.source_bytes)
        other = finding()
        other["observed"] = "a different observation than the existing record"
        src = self.chain.scratch / "changed.finding.json"
        src.write_text(json.dumps(other), encoding="utf-8")
        refused, problems = intake.build_intake(src, self.chain.root, PROFILE)
        self.note("BUILDER_REFUSES_OVERWRITE", ["INTAKE_EXISTS_DIFFERENT"], sorted(p.code for p in problems), "generation never overwrites a pinned source")
        self.assertEqual((refused, [p.code for p in problems]), (None, ["INTAKE_EXISTS_DIFFERENT"]))
        self.assert_source_unchanged()

    def test_05_opaque_source_id_project_divergence_is_an_expected_boundary(self) -> None:
        record = self.chain.record(self.rel)
        drift_target, drift_rel = self.chain.generate(finding("FND-T3-DRIFT", "drifted-project"))
        drifted = common.load_json_strict(drift_target)
        record["source"]["evidence"] = self.chain.source_ref(drift_rel)
        owner_record = intake.validate_record(drifted, PROFILE)
        owner_parent = types(self.chain.issues(record))
        self.assertEqual((owner_record, owner_parent), ([], []), "each owner validates its own structure; parent treats source as opaque bytes")
        oracle = [name for name, claimed, found in (("findingId", record["findingId"], drifted["findingId"]),
                                                    ("sourceProject", record["source"]["sourceProject"], drifted["sourceProject"])) if claimed != found]
        self.assertEqual(oracle, ["findingId", "sourceProject"], "fixture oracle detects the divergence the parent cannot")
        self.note("OPAQUE_SOURCE_ID_PROJECT_DIVERGENCE", [], owner_parent, "no production join guard exists; fixture oracle only",
                  classification="EXPECTED_BOUNDARY_NOT_PRODUCTION_REFUSAL", builderValidateRecordIssues=[f.code for f in owner_record],
                  fixtureOracleDivergentFields=oracle, classifier=self.chain.classify(record),
                  driftSourceSha256=sha(drift_target.read_bytes()))
        self.assertEqual(self.target.read_bytes(), self.source_bytes)


def tearDownModule() -> None:
    out = os.environ.get("FLAL_T3_EVIDENCE_OUT")
    if out:
        Path(out).write_text(json.dumps({"cases": RESULTS}, indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
