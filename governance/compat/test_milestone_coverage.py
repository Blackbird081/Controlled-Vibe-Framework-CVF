"""Mechanical coverage joins; disposable files, no agent/provider behavior claim."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "scripts/lib/downstream_governance"))
import cvf_milestone_coverage as cov


def write(root, path, value):
    p = root / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(value.encode("utf-8"))


def fixture(root, source="docs/roadmaps/criteria.md", heading="## Acceptance"):
    write(root, cov.AUTHORITY_REGISTRY, json.dumps(dict(schemaVersion="cvf.milestoneAuthority@1.0.0", milestones={"M1": dict(path=source, heading=heading)})))
    write(root, source, "# Product\n\n## Acceptance\n\n| ID | Result |\n|---|---|\n| H01 | usable preview |\n| H02 | recover accepted version |\n\n## Other\nnot selected\n")
    selected = cov.section((root / source).read_text(), heading)
    return dict(schemaVersion=cov.SCHEMA, authority=dict(path=source, heading=heading, sha256=cov.digest(selected.encode())),
                milestone=dict(id="M1", consumer="operator", outcome="accept and recover exact output",
                               checkpoint=dict(trigger="bounded proof returned", owner="Local reviewer", decision="accept or hold")),
                phase="DISPATCH", action=dict(kind="IMPLEMENT", selected=["H01"], owner="worker", output="preview proof",
                                               budgetMinutes=10, stop="one bounded implementation", next="Local review then recovery"),
                rows=[dict(id=i, state="NOT_STARTED", gap="proof absent", owner="Local maintainer",
                           destination="M1/" + i + " acceptance checkpoint", evidence=[]) for i in ("H01", "H02")],
                supportingWork=[], conclusions=dict(tranche="PENDING", trancheSummary="execution pending", trancheEvidence=[],
                                                    product="PENDING", productSummary="mandatory proof absent", acceptance=[], owner="Local reviewer"))


def block(data):
    return "```cvf-milestone-coverage-json\n" + json.dumps(data, indent=2) + "\n```\n"


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="cvf-coverage-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.data = fixture(self.root)

    def code(self, code):
        self.assertIn(code, cov.validate(self.root, self.data))

    def test_selected_slice_retains_owned_remainder(self):
        self.assertEqual(cov.validate(self.root, self.data), [])
        self.assertEqual(cov.validate_text(self.root, "docs/work_orders/order.md", "Status: READY\n" + block(self.data)), [])

    def test_omitted_extra_duplicate_rows(self):
        for rows, code in ((self.data["rows"][:1], "COV_CRITERION_SET_MISMATCH"),
                           (self.data["rows"] * 2, "COV_DUPLICATE_ID")):
            value = copy.deepcopy(self.data); value["rows"] = rows
            self.assertIn(code, cov.validate(self.root, value))
        self.data["rows"][1]["id"] = "H03"
        self.code("COV_CRITERION_SET_MISMATCH")

    def test_scope_source_drift(self):
        path = self.root / self.data["authority"]["path"]
        path.write_text(path.read_text().replace("usable preview", "new scope"))
        self.code("COV_AUTHORITY_STALE")

    def test_unrelated_source_section_does_not_invalidate(self):
        path = self.root / self.data["authority"]["path"]
        path.write_text(path.read_text().replace("not selected", "unrelated change"))
        self.assertEqual(cov.validate(self.root, self.data), [])

    def test_no_owner_or_destination(self):
        for key in ("owner", "destination"):
            data = copy.deepcopy(self.data); data["rows"][1][key] = ""
            self.assertIn("COV_TEXT_REQUIRED", cov.validate(self.root, data))

    def test_unknown_requires_finite_verification(self):
        self.data["rows"][0]["state"] = "UNKNOWN"
        self.code("COV_UNKNOWN_IMPLEMENTATION")
        self.data["action"].update(kind="VERIFY", question="which proof is missing?", sourceBoundary="named criteria section only")
        self.assertEqual(cov.validate(self.root, self.data), [])
        for budget in (0, True, -1, "10"):
            self.data["action"]["budgetMinutes"] = budget
            self.code("COV_FINITE_BUDGET_REQUIRED")

    def test_unknown_independence_needs_evidence(self):
        self.data["rows"][1]["state"] = "UNKNOWN"
        self.code("COV_UNKNOWN_IMPLEMENTATION")
        self.data["rows"][1]["independence"] = dict(reviewer="Local", reason="separate prerequisite", evidence=[])
        self.code("COV_EVIDENCE_REQUIRED")
        write(self.root, "docs/independence.md", "Local source disposition")
        self.data["rows"][1]["independence"]["evidence"] = [dict(path="docs/independence.md", sha256=cov.digest(b"Local source disposition"))]
        self.assertEqual(cov.validate(self.root, self.data), [])

    def test_initial_unknown_authority_only_finite_verify(self):
        self.data.update(authority=None, rows=[])
        self.data["action"].update(selected=[], kind="VERIFY", question="identify approved criteria", sourceBoundary="operator brief")
        self.assertEqual(cov.validate(self.root, self.data), [])
        self.data["action"]["kind"] = "IMPLEMENT"
        self.code("COV_UNKNOWN_AUTHORITY_IMPLEMENTATION")

    def test_stale_evidence_and_unsafe_paths(self):
        self.data["rows"][0].update(state="VERIFIED", evidence=[dict(path="../escape", sha256="0" * 64)])
        self.code("COV_UNSAFE_PATH")
        write(self.root, "docs/proof.md", "current")
        self.data["rows"][0]["evidence"] = [dict(path="docs/proof.md", sha256=cov.digest(b"old"))]
        self.code("COV_EVIDENCE_STALE")

    def test_tranche_complete_does_not_complete_product(self):
        write(self.root, "docs/proof.md", "selected slice delivered")
        proof = dict(path="docs/proof.md", sha256=cov.digest(b"selected slice delivered"))
        self.data.update(phase="REVIEW"); self.data["action"]["kind"] = "REVIEW"
        self.data["conclusions"].update(tranche="COMPLETE", trancheEvidence=[proof], product="BLOCKED")
        self.assertEqual(cov.validate(self.root, self.data), [])
        self.data["conclusions"].update(product="COMPLETE", acceptance=[proof])
        self.code("COV_PRODUCT_INCOMPLETE")
        for row in self.data["rows"]:
            row.update(state="VERIFIED", evidence=[proof])
        self.assertEqual(cov.validate(self.root, self.data), [])
        self.data["conclusions"]["acceptance"] = []
        self.code("COV_EVIDENCE_REQUIRED")

    def test_unbounded_supporting_work(self):
        self.data["supportingWork"] = [dict(criterionIds=["H01"], reason="proof dependency", budgetMinutes=3, stop="one check", returnToProduct="")]
        self.code("COV_TEXT_REQUIRED")

    def test_missing_duplicate_json_nested_example_and_phase(self):
        path = "docs/work_orders/order.md"
        self.assertEqual(cov.validate_text(self.root, path, "Status: READY\n"), ["COV_BLOCK_REQUIRED"])
        self.assertEqual(cov.validate_text(self.root, path, block(self.data) * 2), ["COV_BLOCK_REQUIRED"])
        duplicate = block(self.data).replace('"schemaVersion":', '"schemaVersion": "bad", "schemaVersion":', 1)
        self.assertEqual(cov.validate_text(self.root, path, duplicate), ["COV_DUPLICATE_JSON_KEY"])
        nested = "````example\n" + block(self.data) + "````\n"
        self.assertEqual(cov.validate_text(self.root, path, nested), ["COV_BLOCK_REQUIRED"])
        self.data.update(phase="PLAN"); self.data["action"]["kind"] = "PLAN"
        self.assertEqual(cov.validate_text(self.root, path, "Status: READY\n" + block(self.data)), ["COV_EXECUTABLE_PHASE_REQUIRED"])

    def test_authority_duplicates_and_fenced_fake_heading(self):
        value = "```example\n## Acceptance\n```\n" + (self.root / self.data["authority"]["path"]).read_text()
        self.assertEqual(cov.criterion_ids(cov.section(value, "## Acceptance")), {"H01", "H02"})
        with self.assertRaises(cov.Invalid):
            cov.criterion_ids(cov.section(value.replace("H02", "H01"), "## Acceptance"))

    def test_real_read_only_authority_sets(self):
        sources = [("docs/roadmaps/CVF_NCR_HTML_PILOT_DELIVERY_AND_ACCEPTANCE_PLAN_2026-10-21.md", "## Acceptance Criteria", {f"H{i:02}" for i in range(1, 15)}),
                   ("docs/reviews/learnings/CVF_PRODUCT_MILESTONE_COVERAGE_LEARNING_2026-10-23.md", "## Foundation Milestone Coverage And Checkpoints", {f"F{i}" for i in range(1, 6)})]
        for path, heading, expected in sources:
            value = cov.section((REPO / path).read_text(encoding="utf-8"), heading)
            self.assertEqual(cov.criterion_ids(value), expected)
            data = copy.deepcopy(self.data)
            data["authority"] = dict(path=path, heading=heading, sha256=cov.digest(value.encode()))
            data["milestone"]["id"] = "NCR-HTML-PILOT" if path.startswith("docs/roadmaps/") else "CVF-FOUNDATION-COVERAGE"
            data["rows"] = [dict(id=i, state="UNKNOWN", gap="no product execution in this proof", owner="Local", destination="foundation read-only evidence review", evidence=[]) for i in sorted(expected)]
            data["action"].update(kind="VERIFY", selected=[sorted(expected)[0]], question="is criterion reconciliation mechanically complete?", sourceBoundary=path)
            self.assertEqual(cov.validate(REPO, data), [])
            data["rows"].pop()
            self.assertEqual(cov.validate(REPO, data), ["COV_CRITERION_SET_MISMATCH"])

    def test_core_uses_portable_validator(self):
        sys.path.insert(0, str(REPO / "governance/compat"))
        import check_work_order_dispatch_quality as core
        self.assertEqual(core.validate_milestone_coverage(self.root, "docs/work_orders/order.md", "Status: READY\n" + block(self.data)), [])
        path = "docs/work_orders/order.md"
        write(self.root, path, "Status: READY\n" + block(self.data))
        self.assertEqual(core.collect_coverage_violations(self.root, [path]), [])
        write(self.root, "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json", json.dumps(dict(currentAuthority=dict(workOrderPath=path))))
        source = self.root / self.data["authority"]["path"]
        original = source.read_bytes()
        source.write_bytes(original.replace(b"usable preview", b"new scope"))
        self.assertEqual(core.collect_coverage_violations(self.root, [])[0]["issues"], ["COV_AUTHORITY_STALE"])
        source.write_bytes(original)
        self.data["rows"].pop()
        self.assertEqual(core.validate_milestone_coverage(self.root, "docs/work_orders/order.md", block(self.data)), ["COV_CRITERION_SET_MISMATCH"])

    def test_wrong_milestone_or_alternative_scope_table(self):
        self.data["milestone"]["id"] = "OTHER"
        self.code("COV_MILESTONE_AUTHORITY_MISMATCH")
        self.data["milestone"]["id"] = "M1"
        self.data["authority"]["heading"] = "## Other"
        self.code("COV_MILESTONE_AUTHORITY_MISMATCH")

    def test_ambiguous_first_cell_and_fence_suffix(self):
        with self.assertRaises(cov.Invalid):
            cov.criterion_ids("| ID | Result |\n|---|---|\n| H01 H02 | ambiguous |\n")
        value = "```example\n```python\n## Fake\n```\n## Real\n"
        self.assertNotIn("## Fake", cov.unfenced(value))
        self.assertIn("## Real", cov.unfenced(value))

    def test_terminal_artifacts_require_review_and_both_positions(self):
        for path in ("docs/roadmaps/plan.md", "docs/reviews/close.md"):
            self.assertEqual(cov.validate_text(self.root, path, "Status: COMPLETE\n" + block(self.data)), ["COV_TERMINAL_REVIEW_REQUIRED"])
        self.data["phase"] = "REVIEW"; self.data["action"]["kind"] = "REVIEW"
        self.assertEqual(cov.validate_text(self.root, path, "Status: COMPLETE\n" + block(self.data)), ["COV_TERMINAL_CONCLUSIONS_REQUIRED"])
        self.data["conclusions"].update(tranche="BLOCKED", product="BLOCKED")
        self.assertEqual(cov.validate_text(self.root, path, "Status: BLOCKED\n" + block(self.data)), [])

    def test_candidate_size_and_encoding_and_deep_json(self):
        p = "docs/roadmaps/bad.md"
        write(self.root, p, "x" * (cov.MAX_BYTES + 1))
        self.assertEqual(cov.validate_file(self.root, p), ["COV_FILE_MISSING_OR_OVERSIZE"])
        (self.root / p).write_bytes(b"\xff")
        self.assertEqual(cov.validate_file(self.root, p), ["COV_INVALID_INPUT:UnicodeDecodeError"])
        value = "```" + cov.TAG + "\n" + "[" * 2000 + "0" + "]" * 2000 + "\n```"
        self.assertEqual(cov.validate_text(self.root, p, value), ["COV_INVALID_JSON"])


if __name__ == "__main__":
    unittest.main()
