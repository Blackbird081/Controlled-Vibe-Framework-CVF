"""Offline file-control regressions; no provider, UI or runtime proof."""
import copy
import datetime as dt
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import check_semantic_convergence_control as scec
import semantic_convergence_outcome as control


class OutcomeLearningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = dt.datetime(2026, 10, 29, 1, tzinfo=dt.timezone.utc)
        self.anchor_block = {
            "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": "user-outcome",
            "chainMode": "INITIAL", "chainOrdinal": 0, "predecessor": None,
            "blockerDelta": {k: [] for k in ("prior", "resolved", "retained", "new", "reopened", "current")},
            "resolutionEvidence": {},
            "counters": {"partialReadyClosures": 0, "reviewerScopeExpansions": 0,
                         "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 0},
            "claims": [], "requiredDisposition": "CONTINUE_BOUNDED", "successorScope": "INITIAL_BOUNDED",
        }
        self.anchor = self.write("docs/work_orders/anchor.md", self.fence("json", self.anchor_block))
        self.decision = self.write_decision("HELD")
        self.authority = {"path": "docs/roadmaps/product.md", "heading": "## Acceptance"}
        self.write("docs/milestone-coverage-authority.json", json.dumps({"milestones": {"PRODUCT": self.authority}}))
        self.row = {"authority": self.authority, "anchor": self.anchor,
                    "history": [self.write("docs/reviews/failure-a.md", "Dependency failure"),
                                self.write("docs/reviews/failure-b.md", "Reserve failure")],
                    "state": "HELD", "decision": self.decision}
        self.save_registry()
        self.block = copy.deepcopy(self.anchor_block)
        self.block.update(chainMode="SUCCESSOR", chainOrdinal=1, predecessor=self.anchor,
                          requiredDisposition="ROOT_CONTRACT_REQUIRED", successorScope="INTEGRATED_ROOT_CONTRACT")
        self.block["counters"]["nonDecreasingBlockerTransitions"] = 1
        self.block["outcomeBinding"] = {"milestoneId": "PRODUCT", "anchor": self.anchor,
                                      "history": self.row["history"], "operatorAction": "NONE", "readiness": None}
        self.coverage = {"milestone": {"id": "PRODUCT"}, "authority": self.authority}

    def write(self, path, text):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(text.encode("utf-8"))
        return {"path": path, "sha256": hashlib.sha256(text.replace("\r\n", "\n").encode()).hexdigest()}

    def save_registry(self):
        self.write(control.REGISTRY, json.dumps({"schemaVersion": control.SCHEMA, "outcomes": {"PRODUCT": self.row}}))

    def write_decision(self, state):
        return self.write("docs/reviews/decision.json", json.dumps({"schemaVersion": "cvf.outcomeOperatorDecision@1",
                          "milestoneId": "PRODUCT", "state": state, "instruction": "Explicit fixture decision"}))

    @staticmethod
    def fence(tag, value):
        return "```" + tag + "\n" + json.dumps(value) + "\n```\n"

    def text(self):
        return self.fence("json", self.block) + self.fence(control.COVERAGE_TAG, self.coverage)

    def validate(self):
        return control.validate(self.root, "docs/work_orders/next.md", self.text(), [self.block],
                                fences=scec._iter_fenced_blocks, parse_blocks=scec.find_active_blocks, now=self.now)

    def ready(self):
        self.row["state"] = "OPEN"
        self.decision = self.write_decision("OPEN")
        self.row["decision"] = self.decision
        self.save_registry()
        evidence = self.write("docs/reviews/preparation-evidence.json", '{"observed":"disposable fixture"}')
        source = self.write("docs/reviews/source-manifest.json", json.dumps({
            "schemaVersion": "cvf.operatorRuntimeSource@1", "milestoneId": "PRODUCT",
            "sourceCommit": "a" * 40, "files": [self.write("scripts/app.py", "# fixture\n")]}))
        checks = {}
        for key in control.CHECKS:
            observation = self.write("docs/reviews/check-" + key + ".json", json.dumps({
                "schemaVersion": "cvf.operatorPreparationCheck@1", "milestoneId": "PRODUCT", "check": key,
                "source": source, "status": "PASS", "observedAt": "2026-10-29T00:59:00Z", "evidence": evidence}))
            checks[key] = {"status": "PASS", "evidence": observation}
        self.receipt = {"schemaVersion": "cvf.operatorPreparationReceipt@1", "milestoneId": "PRODUCT",
                        "source": source,
                        "observedAt": "2026-10-29T00:59:00Z", "expiresAt": "2026-10-29T01:10:00Z",
                        "decision": self.decision,
                        "checks": checks}
        self.block["outcomeBinding"]["operatorAction"] = "INVITE_ACCEPTANCE"
        self.save_receipt()

    def save_receipt(self):
        self.block["outcomeBinding"]["readiness"] = self.write("docs/reviews/ready.json", json.dumps(self.receipt))

    def test_integrated_reassessment_keeps_two_different_failures(self):
        self.assertEqual([], self.validate())

    def test_new_error_label_cannot_reset_same_outcome(self):
        self.block.update(problemKey="brand-new-error", chainMode="INITIAL", chainOrdinal=0, predecessor=None)
        self.assertIn("chain reset", str(self.validate()))

    def test_renamed_chain_with_anchor_is_rejected(self):
        self.block["problemKey"] = "other-error"
        self.assertIn("relabeled", str(self.validate()))

    def test_history_cannot_be_dropped(self):
        self.block["outcomeBinding"]["history"] = self.row["history"][:1]
        self.assertIn("history", str(self.validate()))

    def test_narrow_successor_after_different_failures_rejected(self):
        self.block["requiredDisposition"] = "CONTINUE_BOUNDED"
        self.assertIn("reassessment", str(self.validate()))

    def test_missing_binding_not_opt_in_escape(self):
        del self.block["outcomeBinding"]
        self.assertIn("requires one", str(self.validate()))

    def test_unknown_unenrolled_outcome_does_not_reopen_history(self):
        self.coverage["milestone"]["id"] = "OTHER"
        del self.block["outcomeBinding"]
        self.assertEqual([], self.validate())

    def test_bound_outcome_cannot_remove_coverage(self):
        issues = control.validate(self.root, "docs/work_orders/next.md", "", [self.block],
                                  fences=scec._iter_fenced_blocks, parse_blocks=scec.find_active_blocks)
        self.assertIn("coverage", str(issues))

    def test_mutated_pinned_history_rejected(self):
        self.write(self.row["history"][0]["path"], "replacement")
        self.assertIn("hash drift", str(self.validate()))

    def test_alternate_authority_cannot_substitute(self):
        self.coverage["authority"] = {"path": "other.md", "heading": "## Other"}
        self.assertIn("authority", str(self.validate()))

    def test_cycle_rejected(self):
        self.block["predecessor"] = {"path": "docs/work_orders/next.md", "sha256": "a" * 64}
        self.assertIn("cycle", str(self.validate()))

    def test_hold_rejects_even_valid_preparation(self):
        self.ready()
        self.row["state"] = "HELD"
        self.row["decision"] = self.write_decision("HELD")
        self.save_registry()
        self.assertIn("operator-held", str(self.validate()))

    def test_valid_open_preparation_passes(self):
        self.ready()
        self.assertEqual([], self.validate())

    def test_availability_request_needs_same_proof(self):
        self.row["state"] = "OPEN"
        self.row["decision"] = self.write_decision("OPEN")
        self.save_registry()
        self.block["outcomeBinding"].update(operatorAction="REQUEST_AVAILABILITY", readiness=None)
        self.assertTrue(self.validate())

    def test_expired_receipt_rejected(self):
        self.ready()
        self.receipt["expiresAt"] = "2026-10-29T01:00:00Z"
        self.save_receipt()
        self.assertIn("stale", str(self.validate()))

    def test_future_or_unbounded_receipt_rejected(self):
        self.ready()
        for field, value in (("observedAt", "2026-10-29T01:01:00Z"), ("expiresAt", "2026-10-29T02:00:00Z")):
            with self.subTest(field=field):
                self.receipt["observedAt"] = "2026-10-29T00:59:00Z"
                self.receipt[field] = value
                self.save_receipt()
                self.assertTrue(self.validate())

    def test_receipt_wrong_outcome_or_missing_check_rejected(self):
        self.ready()
        self.receipt["milestoneId"] = "OTHER"
        self.save_receipt()
        self.assertTrue(self.validate())
        self.receipt["milestoneId"] = "PRODUCT"
        del self.receipt["checks"]["launch"]
        self.save_receipt()
        self.assertTrue(self.validate())

    def test_source_change_invalidates_readiness(self):
        self.ready()
        self.write(self.receipt["source"]["path"], "different version")
        self.assertIn("hash drift", str(self.validate()))

    def test_duplicate_keys_and_unsafe_paths_fail_closed(self):
        self.write(control.REGISTRY, '{"schemaVersion":"x","schemaVersion":"y"}')
        self.assertIn("duplicate", str(self.validate()))
        self.row["decision"] = {"path": "../outside", "sha256": "a" * 64}
        self.save_registry()
        self.assertIn("unsafe", str(self.validate()))

    def test_actual_scec_diagnostic_invokes_control(self):
        self.block.update(chainMode="INITIAL", chainOrdinal=0, predecessor=None)
        with patch.object(scec, "REPO_ROOT", self.root):
            diagnostic = scec.diagnose_file("docs/work_orders/next.md", self.text(), require_block=True)
        self.assertIn("OUTCOME_LEARNING_BINDING_INVALID", [v.code for _, v in diagnostic.violations])

    def test_registry_open_cannot_override_pinned_hold(self):
        self.row["state"] = "OPEN"
        self.save_registry()
        self.assertIn("contradicts", str(self.validate()))

    def test_history_registry_cannot_shorten_or_replace_anchor(self):
        previous = (self.root / control.REGISTRY).read_text()
        for mutation in (lambda r: r["history"].pop(), lambda r: r.update(anchor=r["history"][0])):
            changed = copy.deepcopy(self.row)
            mutation(changed)
            with self.assertRaises(ValueError):
                control.validate_registry_transition(previous, {"PRODUCT": changed})

    def test_generic_or_wrong_source_check_cannot_be_reused(self):
        self.ready()
        self.receipt["checks"]["launch"] = self.receipt["checks"]["journey"]
        self.save_receipt()
        self.assertIn("joined", str(self.validate()))

    def test_source_manifest_members_revalidated(self):
        self.ready()
        self.write("scripts/app.py", "# drift\n")
        self.assertIn("hash drift", str(self.validate()))

    def test_crlf_text_pin_and_raw_predecessor_have_distinct_contracts(self):
        self.ready()
        p = self.root / self.row["history"][0]["path"]
        p.write_bytes(p.read_bytes() + b"\r\n")
        self.assertTrue(self.validate())  # Adding a newline changes content.
        ref = self.write("docs/reviews/crlf.md", "one\ntwo\n")
        p = self.root / ref["path"]
        p.write_bytes(p.read_bytes().replace(b"\n", b"\r\n"))
        self.assertTrue(control.pinned(self.root, ref))
        p = self.root / self.anchor["path"]
        p.write_bytes(p.read_bytes().replace(b"\n", b"\r\n"))
        self.assertNotEqual(hashlib.sha256(p.read_bytes()).hexdigest(), self.anchor["sha256"])

    def test_nonfinite_and_unclosed_coverage_rejected(self):
        with self.assertRaises(ValueError):
            control.strict_json('{"x":NaN}')
        issues = control.validate(self.root, "docs/work_orders/next.md", "```cvf-milestone-coverage-json\n{}", [],
                                  fences=scec._iter_fenced_blocks, parse_blocks=scec.find_active_blocks)
        self.assertTrue(issues)

    def test_duplicate_event_bytes_do_not_count_twice(self):
        self.row["history"][1] = self.write("docs/reviews/copy.md", "Dependency failure")
        self.save_registry()
        self.assertIn("duplicate history", str(self.validate()))

    def test_per_invocation_snapshot_reused_then_refreshed(self):
        with control.snapshot():
            first = control.safe_bytes(self.root, self.anchor["path"])
            self.write(self.anchor["path"], "changed")
            self.assertEqual(first, control.safe_bytes(self.root, self.anchor["path"]))
        self.assertNotEqual(first, control.safe_bytes(self.root, self.anchor["path"]))


if __name__ == "__main__":
    unittest.main()
