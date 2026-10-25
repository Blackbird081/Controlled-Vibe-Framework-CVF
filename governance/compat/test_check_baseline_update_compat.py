"""Focused private-default and exact-public-delta baseline gate regressions."""

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import check_baseline_update_compat as gate


BASE = "a" * 40
SOURCE = "b" * 40


class PublicChangeEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.changed = {
            "src/adapter.py": ["M"],
            "docs/guide.md": ["A"],
            gate.PUBLIC_CHANGE_EVIDENCE_PATH: ["M"],
        }
        self.evidence = {
            "schemaVersion": gate.PUBLIC_CHANGE_EVIDENCE_SCHEMA,
            "publicBase": BASE,
            "sourceCommit": SOURCE,
            "changedPaths": ["docs/guide.md", "src/adapter.py"],
            "claimBoundary": gate.PUBLIC_CHANGE_CLAIM_BOUNDARY,
        }

    def text(self, evidence=None):
        return (
            "# Export manifest\n\n## Public Change Evidence\n\n"
            "Change summary: Bind adapter repair to its public delta.\n"
            "Changed owners: `src/adapter.py` and `docs/guide.md`.\n"
            "Validation: Focused adapter compatibility checks passed.\n\n"
            "```public-change-evidence-json\n"
            + json.dumps(self.evidence if evidence is None else evidence, sort_keys=True)
            + "\n```\n"
        )

    def classify(self, text=None, previous="old manifest", changed=None):
        return gate.classify_public_change_evidence(
            [], self.changed if changed is None else changed,
            self.text() if text is None else text, previous, BASE,
        )

    def test_current_exact_public_delta_passes_without_private_artifact(self):
        report = self.classify()
        self.assertTrue(report["compliant"])
        self.assertTrue(report["publicChangeEvidenceValid"])
        self.assertEqual(report["baselineArtifactsUpdated"], [gate.PUBLIC_CHANGE_EVIDENCE_PATH])
        self.assertFalse(gate._classify([], self.changed)["compliant"])

    def test_missing_or_unchanged_public_artifact_fails(self):
        for label, changed, text, previous in (
            ("missing", {"src/adapter.py": ["M"]}, "", ""),
            ("unchanged-bytes", self.changed, self.text(), self.text()),
            ("not-in-current-diff", {"src/adapter.py": ["M"]}, self.text(), "old"),
            ("deleted", {**self.changed, gate.PUBLIC_CHANGE_EVIDENCE_PATH: ["D"]}, "", "old"),
        ):
            with self.subTest(label=label):
                report = self.classify(text, previous, changed)
                self.assertFalse(report["compliant"])
                self.assertIn("public_evidence_not_changed", report["publicChangeEvidenceErrors"])

    def test_omitted_extra_duplicate_and_unsorted_paths_fail(self):
        for paths in (
            ["src/adapter.py"],
            ["docs/guide.md", "src/adapter.py", "src/unrelated.py"],
            ["docs/guide.md", "src/adapter.py", "src/adapter.py"],
            ["src/adapter.py", "docs/guide.md"],
        ):
            with self.subTest(paths=paths):
                report = self.classify(self.text({**self.evidence, "changedPaths": paths}))
                self.assertFalse(report["compliant"])
                self.assertIn("public_changed_paths_mismatch", report["publicChangeEvidenceErrors"])

    def test_deleted_substantive_owner_requires_evidence_and_exact_path(self):
        changed = {"src/retired.py": ["D"], gate.PUBLIC_CHANGE_EVIDENCE_PATH: ["M"]}
        report = self.classify(self.text({**self.evidence, "changedPaths": ["src/retired.py"]}), changed=changed)
        self.assertTrue(report["compliant"])
        self.assertTrue(report["hasSubstantiveUpdate"])
        self.assertFalse(self.classify("", changed=changed)["compliant"])

    def test_schema_anchor_and_claim_boundaries_fail_closed(self):
        invalid = (
            {**self.evidence, "publicBase": "c" * 40},
            {**self.evidence, "sourceCommit": "short"},
            {**self.evidence, "schemaVersion": "unknown"},
            {**self.evidence, "claimBoundary": "PRIVATE_CLOSURE_PROVEN"},
            {**self.evidence, "unexpected": True},
        )
        for evidence in invalid:
            with self.subTest(evidence=evidence):
                self.assertFalse(self.classify(self.text(evidence))["compliant"])

    def test_unsafe_paths_malformed_json_and_duplicate_keys_fail(self):
        for value in ("../src/adapter.py", "/src/adapter.py", "src\\adapter.py", "C:/src/adapter.py", "src/../adapter.py", 42):
            with self.subTest(value=value):
                report = self.classify(self.text({**self.evidence, "changedPaths": [value]}))
                self.assertFalse(report["compliant"])
                self.assertIn("invalid_public_changed_paths", report["publicChangeEvidenceErrors"])
        valid = self.text()
        for malformed in (valid.replace('"schemaVersion":', '"schemaVersion": "duplicate", "schemaVersion":'),
                          valid.replace("```public-change-evidence-json", "```json"),
                          valid.replace('"sourceCommit":', '"sourceCommit"'),
                          valid + "\n" + valid):
            with self.subTest(malformed=malformed):
                self.assertFalse(self.classify(malformed)["compliant"])

    def test_scalar_summary_required_without_newline_value_or_placeholder(self):
        for text in (self.text().replace("Change summary: Bind adapter repair to its public delta.", "Change summary:"),
                     self.text().replace("Focused adapter compatibility checks passed.", "TBD")):
            self.assertFalse(self.classify(text)["compliant"])


class BaselineProfileCommandTests(unittest.TestCase):
    def invoke(self, arguments, changed, root=None, git=None):
        output = io.StringIO()
        with patch.object(sys, "argv", ["check_baseline_update_compat.py", *arguments]), \
             patch.object(gate, "_resolve_range", return_value=(BASE, "HEAD", "test")), \
             patch.object(gate, "_get_commits_in_range", return_value=[]), \
             patch.object(gate, "_get_changed_name_status", return_value=changed), \
             patch.object(gate, "_get_worktree_name_status", return_value={}), \
             patch.object(gate, "_run_git", side_effect=git), \
             patch.object(gate, "REPO_ROOT", root or Path(".")), \
             contextlib.redirect_stdout(output), contextlib.redirect_stderr(io.StringIO()):
            result = gate.main()
        return result, output.getvalue()

    def test_private_default_still_requires_private_baseline(self):
        self.assertEqual(self.invoke(["--enforce", "--json"], {"src/adapter.py": ["M"]})[0], 2)
        changed = {"src/adapter.py": ["M"], "docs/baselines/delta.md": ["M"]}
        result, text = self.invoke(["--enforce", "--json"], changed)
        self.assertEqual(result, 0)
        self.assertEqual(json.loads(text)["baselineArtifactsUpdated"], ["docs/baselines/delta.md"])

    def test_public_profile_cannot_waive_current_evidence(self):
        with tempfile.TemporaryDirectory(prefix="cvf-public-baseline-test-") as directory:
            root = Path(directory)
            carrier = root / "governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_AGENTS.md"
            carrier.parent.mkdir(parents=True)
            carrier.write_text("public carrier", encoding="utf-8")
            (root / "AGENTS.md").write_text("public carrier", encoding="utf-8")
            git = lambda args: (0, BASE, "") if args[0] == "rev-parse" else (1, "", "missing")
            result, text = self.invoke(["--profile", "public", "--enforce", "--json"], {"src/adapter.py": ["M"]}, root, git)
            self.assertEqual(result, 2)
            self.assertFalse(json.loads(text)["publicChangeEvidenceValid"])
            (root / "AGENTS.md").write_text("private carrier", encoding="utf-8")
            self.assertEqual(self.invoke(["--profile", "public", "--enforce"], {"src/adapter.py": ["M"]}, root, git)[0], 1)

    def test_public_range_failure_does_not_fallback_to_unrelated_delta(self):
        with patch.object(sys, "argv", ["gate", "--profile", "public", "--base", "missing"]), \
             patch.object(gate, "_get_commits_in_range", side_effect=RuntimeError("unresolved range")) as commits, \
             contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(gate.main(), 1)
        self.assertEqual(commits.call_count, 1)


if __name__ == "__main__":
    unittest.main()


def test_git_unicode_pending_paths_keep_utf8_identity(tmp_path):
    import subprocess
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    path = "CHANGELOG \u2013 CVF.md"
    (tmp_path / path).write_text("# Existing filename\n", encoding="utf-8")
    with patch.object(gate, "REPO_ROOT", tmp_path):
        changed = gate._get_worktree_name_status()
    assert path in changed
    assert len(changed) == 1
