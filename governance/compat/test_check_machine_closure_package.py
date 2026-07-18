from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_machine_closure_package.py")
SPEC = importlib.util.spec_from_file_location("check_machine_closure_package", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def _package(registry_status: str = "PASS") -> str:
    return f"""
## Machine Closure Package

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/CVF_WO_EXAMPLE.md` | final status updated | PASS |
| Completion or reviewer artifact | `docs/reviews/CVF_EXAMPLE_COMPLETION.md` | final disposition recorded | PASS |
| Roadmap state | `docs/roadmaps/CVF_EXAMPLE_ROADMAP.md` | tranche row closed | PASS |
| Registry JSON | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` | registry entry updated | {registry_status} |
| Registry Markdown | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` | registry lookup updated | {registry_status} |
| External evidence digest | N/A with reason | no external source | N/A with reason - no external source |
| System loop interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | connection updated | PASS |
| Session continuity | `CVF_SESSION_MEMORY.md` | handoff synced | PASS |
"""


class MachineClosurePackageTests(unittest.TestCase):
    def test_closed_gc018_baseline_requires_package(self) -> None:
        text = """
# GC-018 Example

Status: CLOSED_PASS_BOUNDED
"""
        self.assertTrue(MODULE._is_active_governed_doc("docs/baselines/CVF_GC018_EXAMPLE.md"))
        issues = MODULE.validate_machine_closure_package(
            "docs/baselines/CVF_GC018_EXAMPLE.md", text
        )
        self.assertIn(
            "closed-equivalent artifact is missing `Machine Closure Package` section",
            issues,
        )

    def test_closed_artifact_requires_package(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED
"""
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text)
        self.assertIn("closed-equivalent artifact is missing `Machine Closure Package` section", issues)

    def test_valid_package_passes(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED
""" + _package()
        self.assertEqual(
            MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text),
            [],
        )

    def test_corpus_closure_cannot_mark_registry_na(self) -> None:
        text = """
# LPCI Example

Status: CLOSED_PASS_BOUNDED

This corpus classification closure updates search/filter readiness.
""" + _package("N/A with reason - doc-only")
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_LPCI_EXAMPLE.md", text)
        self.assertIn(
            "corpus/search/classification closure cannot mark `Registry JSON` as N/A; update GC-051 registry surfaces or set BLOCKED with reason",
            issues,
        )
        self.assertIn(
            "corpus/search/classification closure cannot mark `Registry Markdown` as N/A; update GC-051 registry surfaces or set BLOCKED with reason",
            issues,
        )

    def test_source_verification_rejects_external_path(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Source Verification

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| External upload | `D:\\UNG DUNG AI\\TOOL AI 2026\\CVF-Workspace\\Policy_Local\\data_input\\a.docx` | local file | a.docx | external | ACCEPT |
""" + _package()
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text)
        self.assertIn(
            "Source Verification contains external/local filesystem path; use a repo-local External Evidence Digest instead",
            issues,
        )

    def test_corpus_signal_inside_code_fence_is_not_applicability(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED

```text
this corpus classification readiness example is fenced sample text only
```
""" + _package("N/A with reason - doc-only")
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text)
        self.assertFalse(any("corpus/search/classification closure" in issue for issue in issues))

    def test_corpus_signal_inside_na_line_is_not_applicability(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED

- Corpus classification readiness check: N/A with reason: not a corpus scan
""" + _package("N/A with reason - doc-only")
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text)
        self.assertFalse(any("corpus/search/classification closure" in issue for issue in issues))

    def test_corpus_signal_in_real_prose_still_fires(self) -> None:
        text = """
# LPCI Example

Status: CLOSED_PASS_BOUNDED

This corpus classification closure updates search/filter readiness for real.
""" + _package("N/A with reason - doc-only")
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_LPCI_EXAMPLE.md", text)
        self.assertTrue(any("corpus/search/classification closure" in issue for issue in issues))

    def test_invalid_defect_class_is_rejected(self) -> None:
        text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
| --- | --- | --- | --- | --- |
| Missing evidence | EVIDENCE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | Add checker |
""" + _package()
        issues = MODULE.validate_machine_closure_package("docs/reviews/CVF_EXAMPLE.md", text)
        self.assertIn(
            "invalid Finding-To-Governance defect class `EVIDENCE_GAP`; use a checker-accepted defect class",
            issues,
        )


if __name__ == "__main__":
    unittest.main()

