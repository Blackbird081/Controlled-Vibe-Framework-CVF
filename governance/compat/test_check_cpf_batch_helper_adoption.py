#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_cpf_batch_helper_adoption.py")
SPEC = importlib.util.spec_from_file_location("check_cpf_batch_helper_adoption", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CpfBatchHelperAdoptionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _seed(self) -> None:
        self._write(MODULE.SHARED_BATCH_HELPER_PATH, "export const helper = true;\n")
        self._write(MODULE.SHARED_FIXTURE_HELPER_PATH, "export const fixture = true;\n")
        for rel_path in MODULE.GOVERNED_CONTRACT_FILES:
            self._write(rel_path, 'import { helper } from "./batch.contract.shared";\nvoid helper;\n')
        for rel_path in MODULE.GOVERNED_TEST_FILES:
            self._write(rel_path, 'import { fixture } from "./helpers/cpf.batch.contract.fixtures";\nvoid fixture;\n')

    def test_passes_when_all_governed_files_adopt_helpers(self) -> None:
        self._seed()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertTrue(report["compliant"])

    def test_fails_when_contract_skips_shared_helper(self) -> None:
        self._seed()
        target = MODULE.GOVERNED_CONTRACT_FILES[0]
        self._write(target, "export const local = true;\n")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertFalse(report["compliant"])
        self.assertIn("contract_missing_shared_helper_import", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
