"""Synthetic offline fixtures for parent_learning_evidence (disposable temp roots only)."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
MODULE = __import__("parent_learning_evidence")
REPO_ROOT = HERE.parents[1]
SCHEMA = REPO_ROOT / "docs/reference/downstream_gate_profile/parent_learning_evidence.schema.json"
REGISTRY = "docs/reference/downstream_gate_profile/downstream_finding_intake_registry.json"
DISPOSITIONS = ("RULE_EXISTS", "MACHINE_CHECK_ADDED", "STANDARD_UPDATED")
FID = "F-SYN-1"
PROJECT = "synthetic-project"


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


class Fixture:
    """Builds a disposable root holding a synthetic positive chain."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def write(self, rel: str, raw: bytes | str) -> dict:
        raw = raw.encode("utf-8") if isinstance(raw, str) else raw
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        return {"path": rel, "sha256": sha(raw)}

    def ref(self, rel: str, text: str, fragment: str = "L1", klass: str = "SYNTHETIC_OFFLINE") -> dict:
        return {**self.write(rel, text), "fragment": fragment, "evidenceClass": klass}

    def receipt(self, kind: str, control_ref: dict, **over) -> dict:
        body = {
            "schemaVersion": MODULE.RECEIPT_VERSION, "kind": kind, "findingId": FID, "sourceProject": PROJECT,
            "control": control_ref, "actor": f"{kind.lower()}-actor",
            "authorization": self.ref(f"ev/{kind}-auth.txt", f"{kind} authorization"),
            "verification": self.ref(f"ev/{kind}-verify.txt", f"{kind} verification"),
            "claimLimits": "synthetic structural fixture only",
        }
        body.update(over)
        return self.ref(f"ev/{kind}-receipt.json", json.dumps(body), "receipt", "SYNTHETIC_OFFLINE")

    def record(self) -> dict:
        check = lambda n: {"status": "SUPPORTED", "reason": f"synthetic {n} support",
                           "evidence": [self.ref(f"ev/{n}.txt", n)], "limits": "structural only"}
        control = self.ref("ev/control.txt", "control v1", "control:v1")
        life = lambda state, evidence=(): {"state": state, "reason": "synthetic", "evidence": list(evidence)}
        return {
            "schemaVersion": MODULE.SCHEMA_VERSION, "findingId": FID,
            "source": {"sourceProject": PROJECT, "evidence": self.ref("ev/source.txt", "source")},
            "valueChecks": {n: check(n) for n in MODULE.CHECK_NAMES},
            "decision": {"state": "ACCEPT", "reason": "synthetic accept", "reviewer": "local-reviewer",
                         "owner": "parent-f2g", "f2gDisposition": "MACHINE_CHECK_ADDED",
                         "evidence": [self.ref("ev/decision.txt", "decision", "D1", "OBSERVED_LOCAL")]},
            "implementation": life("IMPLEMENTED_BOUNDED", [
                control, self.ref("ev/pos.txt", "pos", "proof-positive:1"), self.ref("ev/neg.txt", "neg", "proof-negative:1")]),
            "projectResolution": life("OPEN"),
            "returnDelivery": life("RETURNED", [self.receipt("DELIVERY", {"path": control["path"], "sha256": control["sha256"]})]),
            "projectApplication": life("APPLIED", [self.receipt("APPLICATION", {"path": control["path"], "sha256": control["sha256"]})]),
            "claimLimits": "synthetic structural fixture only",
        }

    def check(self, record: dict, **kw) -> list[str]:
        issues = MODULE.validate_parent_evidence(record, kw.pop("finding_id", FID), self.root, dispositions=DISPOSITIONS)
        return sorted({i["type"] for i in issues})


def _drop(path: list, record: dict) -> None:
    node = record
    for key in path[:-1]:
        node = node[key]
    del node[path[-1]]


class ParentEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.fx = Fixture(Path(self._tmp.name))

    def test_valid_chain_is_typed_structural_valid(self) -> None:
        record = self.fx.record()
        self.assertEqual(self.fx.check(record), [])
        self.assertEqual(MODULE.TYPED_VALID, "TYPED_STRUCTURAL_VALID")

    def test_pending_and_parked_states_are_valid(self) -> None:
        record = self.fx.record()
        record["decision"] = {**record["decision"], "state": "PENDING", "reviewer": None, "evidence": []}
        for name, state in (("implementation", "NOT_IMPLEMENTED"), ("returnDelivery", "PARKED_BY_OPERATOR"),
                            ("projectApplication", "PARKED_BY_OPERATOR")):
            record[name] = {"state": state, "reason": "parked", "evidence": []}
        self.assertEqual(self.fx.check(record), [])

    def test_negative_class_matrix(self) -> None:
        def mut(fn):
            record = self.fx.record()
            fn(record)
            return record
        cases = {
            "hash_mismatch": lambda r: r["valueChecks"]["boundedProof"]["evidence"][0].update(sha256="0" * 64),
            "unknown_field": lambda r: r.update(extra="x"),
            "unknown_version": lambda r: r.update(schemaVersion="cvf.parentLearningEvidence@2.0.0"),
            "invalid_enum": lambda r: r["decision"].update(state="APPROVED"),
            "finding_id_mismatch": lambda r: r.update(findingId="OTHER"),
            "unsafe_locator": lambda r: r["source"]["evidence"].update(path="../outside.txt"),
            "supported_without_valid_evidence": lambda r: r["valueChecks"]["existingCoverage"].update(evidence=[]),
            "observed_claim_without_observed_evidence": lambda r: r["valueChecks"]["sourceConfidence"].update(reason="reproduced upstream"),
            "decided_without_reviewer": lambda r: r["decision"].update(reviewer=None),
            "decided_without_reference": lambda r: r["decision"].update(evidence=[]),
            "accept_without_supported_checks": lambda r: r["valueChecks"]["incrementalValue"].update(status="INCONCLUSIVE"),
            "implementation_without_proof": lambda r: r["implementation"].update(evidence=r["implementation"]["evidence"][:2]),
            "loopback_without_implementation": lambda r: r["implementation"].update(state="NOT_IMPLEMENTED"),
            "applied_without_return": lambda r: r["returnDelivery"].update(state="NOT_RETURNED", evidence=[]),
            "parked_positive_transition": lambda r: r["returnDelivery"].update(state="PARKED_BY_OPERATOR", evidence=[]),
            "receipt_count": lambda r: r["projectApplication"].update(evidence=[]),
            "invalid_f2g_disposition": lambda r: r["decision"].update(f2gDisposition="MADE_UP"),
            "rule_exists_claims_new_value": lambda r: r["decision"].update(f2gDisposition="RULE_EXISTS"),
            "receipt_wrong_type": lambda r: r["projectApplication"].update(evidence=copy.deepcopy(r["returnDelivery"]["evidence"])),
        }
        for expected, fn in cases.items():
            with self.subTest(expected):
                self.assertIn(expected, self.fx.check(mut(fn)))
        for key in MODULE.TOP_KEYS:
            with self.subTest(f"missing {key}"):
                record = self.fx.record()
                del record[key]
                self.assertIn("missing_field", self.fx.check(record))
        for name in MODULE.CHECK_NAMES:
            with self.subTest(f"missing check {name}"):
                record = self.fx.record()
                del record["valueChecks"][name]
                self.assertIn("missing_field", self.fx.check(record))
        self.assertIn("receipt_count", self.fx.check(mut(lambda r: r["returnDelivery"].update(evidence=[]))))

    def test_receipt_join_and_type_negatives(self) -> None:
        def with_receipt(name: str, kind: str, **over) -> list[str]:
            record = self.fx.record()
            ctl = record["implementation"]["evidence"][0]
            record[name]["evidence"] = [self.fx.receipt(kind, {"path": ctl["path"], "sha256": ctl["sha256"]}, **over)]
            return self.fx.check(record)
        other = {"path": "ev/control.txt", "sha256": "1" * 64}
        self.assertIn("receipt_join_mismatch", with_receipt("returnDelivery", "DELIVERY", findingId="OTHER"))
        self.assertIn("receipt_join_mismatch", with_receipt("returnDelivery", "DELIVERY", sourceProject="other-project"))
        self.assertIn("receipt_control_mismatch", with_receipt("projectApplication", "APPLICATION", control=other))
        self.assertIn("receipt_wrong_type", with_receipt("projectApplication", "DELIVERY"))
        self.assertIn("unknown_field", with_receipt("returnDelivery", "DELIVERY", extra=1))
        self.assertIn("hash_mismatch", with_receipt("returnDelivery", "DELIVERY", authorization={
            **self.fx.ref("ev/x-auth.txt", "a"), "sha256": "2" * 64}))
        record = self.fx.record()
        arbitrary = self.fx.ref("ev/arbitrary.txt", "just some file")
        record["returnDelivery"]["evidence"] = [arbitrary]
        self.assertIn("receipt_not_typed_json", self.fx.check(record))

    def test_unsafe_locators_refused(self) -> None:
        outside = Path(self._tmp.name).parent / "outside-flal.txt"
        for bad in ("/abs.txt", "C:/win.txt", "//unc/share/x", "http://example.invalid/x", "a\\b.txt", "ev/../ev/source.txt",
                    "ev/", "", "missing.txt", "ev"):
            with self.subTest(bad):
                record = self.fx.record()
                record["source"]["evidence"]["path"] = bad
                self.assertIn("unsafe_locator", self.fx.check(record))
        junction = self.fx.root / "junction"
        if os.name == "nt" and subprocess.run(["cmd", "/c", "mklink", "/J", str(junction), str(self.fx.root / "ev")],
                                              capture_output=True).returncode == 0:
            record = self.fx.record()
            record["source"]["evidence"].update(path="junction/source.txt")
            self.assertIn("unsafe_locator", self.fx.check(record))
            os.rmdir(junction)
        link = self.fx.root / "ev" / "link.txt"
        try:
            os.symlink(self.fx.root / "ev" / "source.txt", link)
        except (OSError, NotImplementedError):
            self.skipTest("symlink creation not permitted here")
        record = self.fx.record()
        record["source"]["evidence"].update(path="ev/link.txt")
        self.assertIn("unsafe_locator", self.fx.check(record))
        self.assertFalse(outside.exists())

    def test_attributed_only_cannot_support_observed(self) -> None:
        record = self.fx.record()
        record["valueChecks"]["sourceConfidence"].update(
            reason="observed in project", evidence=[self.fx.ref("ev/attr.txt", "attr", "L2", "ATTRIBUTED_SOURCE")])
        self.assertIn("observed_claim_without_observed_evidence", self.fx.check(record))

    def test_duplicate_json_keys_refused(self) -> None:
        with self.assertRaises(MODULE.DuplicateKeyError):
            MODULE.strict_json_loads(b'{"a": 1, "a": 2}')
        with self.assertRaises(ValueError):
            MODULE.strict_json_loads(b'{"a": NaN}')
        record = self.fx.record()
        dup = self.fx.write("ev/dup-receipt.json", '{"kind": "DELIVERY", "kind": "DELIVERY"}')
        record["returnDelivery"]["evidence"] = [{**dup, "fragment": "r", "evidenceClass": "SYNTHETIC_OFFLINE"}]
        self.assertIn("receipt_not_typed_json", self.fx.check(record))
        self.fx.write(REGISTRY, '{"entries": [], "entries": []}')
        report = MODULE.classify_registry(self.fx.root, REGISTRY)
        self.assertEqual((report["invalid"], report["issues"][0]["type"]), (1, "registry_unparseable"))

    def test_schema_matches_helper_constants(self) -> None:
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], MODULE.SCHEMA_VERSION)
        self.assertEqual(tuple(schema["required"]), MODULE.TOP_KEYS)
        self.assertFalse(schema["additionalProperties"])
        self.assertEqual(tuple(schema["$defs"]["receipt"]["required"]), MODULE.RECEIPT_KEYS)
        self.assertEqual(tuple(schema["properties"]["valueChecks"]["required"]), MODULE.CHECK_NAMES)
        if importlib.util.find_spec("jsonschema"):
            import jsonschema
            validator = jsonschema.Draft202012Validator(schema)
            self.assertEqual(list(validator.iter_errors(self.fx.record())), [])
            bad = self.fx.record()
            bad["extra"] = 1
            self.assertTrue(list(validator.iter_errors(bad)))


class LegacyCompatibilityTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.fx = Fixture(Path(self._tmp.name))

    def _registry(self, findings: list[dict]) -> dict:
        self.fx.write(REGISTRY, json.dumps({"entries": [{"intakeId": "E", "findings": findings}]}))
        return MODULE.classify_registry(self.fx.root, REGISTRY, DISPOSITIONS)

    def test_heterogeneous_legacy_shapes_stay_untyped(self) -> None:
        report = self._registry([
            {"id": "old-1", "defectClass": "RULE_GAP", "parentDisposition": "ACCEPTED"},
            {"id": "old-2", "returnDelivery": "PARKED_BY_OPERATOR", "sourceProjectApplication": "PARKED_BY_OPERATOR",
             "parentImplementation": "IMPLEMENTED_BOUNDED"},
        ])
        self.assertEqual((report["typedValid"], report["legacyUntyped"], report["invalid"]), (0, 2, 0))
        self.assertEqual({f["outcome"] for f in report["findings"]}, {MODULE.LEGACY})
        self.assertEqual(MODULE.LEGACY, "LEGACY_UNTYPED_NOT_REVALIDATED")

    def test_legacy_silent_promotion_refused(self) -> None:
        for field, value in (("returnDelivery", "RETURNED"), ("sourceProjectApplication", "APPLIED")):
            with self.subTest(field):
                report = self._registry([{"id": "old", field: value}])
                self.assertEqual((report["invalid"], report["legacyUntyped"]), (1, 0))
                self.assertEqual(report["issues"][0]["type"], "legacy_silent_promotion")

    def test_mixed_registry_counts_are_separate(self) -> None:
        typed = {"id": FID, "parentEvidence": self.fx.record()}
        broken = {"id": "bad", "parentEvidence": {"schemaVersion": MODULE.SCHEMA_VERSION}}
        report = self._registry([typed, broken, {"id": "old"}])
        self.assertEqual((report["typedValid"], report["legacyUntyped"], report["invalid"]), (1, 1, 1))
        self.assertTrue(all(i["path"].startswith("entries[0].findings[1]") for i in report["issues"]))

    def test_historical_registry_entries_preserved_and_not_reclassified(self) -> None:
        raw = (REPO_ROOT / REGISTRY).read_bytes()
        historical = subprocess.check_output(['git','show',
            '80ca1a7a9fc88d312bc05b496c4904de95f3aa34:'+REGISTRY], cwd=REPO_ROOT)
        self.assertEqual(sha(historical), "0077d4ba82bfb0c07d404784461f8fbd2f835678a8c4de5a2b2515c3072c2827")
        old_entries=json.loads(historical)['entries']
        self.assertEqual(json.loads(raw)['entries'][:len(old_entries)],old_entries)
        report = MODULE.classify_registry(REPO_ROOT, REGISTRY, DISPOSITIONS)
        self.assertEqual((report["invalid"], report["issues"]), (0, []))
        self.assertEqual(report['legacyUntyped'],sum(len(e['findings']) for e in old_entries))
        self.assertEqual((REPO_ROOT / REGISTRY).read_bytes(), raw)

    def test_missing_registry_is_empty_report(self) -> None:
        report = MODULE.classify_registry(self.fx.root, REGISTRY)
        self.assertEqual((report["typedValid"], report["legacyUntyped"], report["invalid"]), (0, 0, 0))

    def test_malformed_registry_containers_fail_closed(self) -> None:
        malformed = [
            {"entries": {}}, {"entries": "hidden"}, {"entries": None},
            {"entries": [None]}, {"entries": [{}]},
            {"entries": [{"findings": {"hidden": {"parentEvidence": {}}}}]},
            {"entries": [{"findings": [None, "not-a-finding"]}]},
        ]
        for data in malformed:
            with self.subTest(data=data):
                self.fx.write(REGISTRY, json.dumps(data))
                report = MODULE.classify_registry(self.fx.root, REGISTRY, DISPOSITIONS)
                self.assertGreater(report["invalid"], 0)
                self.assertTrue(report["issues"])
                self.assertEqual(report["legacyUntyped"], 0)


if __name__ == "__main__":
    unittest.main()
