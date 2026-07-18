from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

MODULE_PATH = COMPAT_DIR / "run_agent_automation_assist.py"
SPEC = importlib.util.spec_from_file_location("run_agent_automation_assist", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
assist = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = assist
SPEC.loader.exec_module(assist)


class CorpusNaAssistTests(unittest.TestCase):
    def test_short_not_applicable_corpus_block_is_not_a_defect(self):
        text = """# Worker Return

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON - no corpus completeness claim.
"""
        diag = assist.diagnose_corpus_completeness("docs/reviews/x.md", text)
        self.assertTrue(diag.applicable)
        self.assertTrue(diag.has_section)
        self.assertEqual(diag.missing_fields, ())
        self.assertEqual(diag.missing_terminal_statuses, ())
        self.assertTrue(diag.is_clean)


if __name__ == "__main__":
    unittest.main()
