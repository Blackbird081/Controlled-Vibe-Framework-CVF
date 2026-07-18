"""Tests for live_provider_bootstrap.py."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("live_provider_bootstrap.py")
SPEC = importlib.util.spec_from_file_location("live_provider_bootstrap", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class LiveProviderBootstrapTests(unittest.TestCase):
    def test_ensure_repo_root_on_sys_path_inserts_missing_root(self) -> None:
        repo_root_text = str(MODULE.REPO_ROOT)
        original_path = list(sys.path)
        try:
            sys.path[:] = [entry for entry in sys.path if entry != repo_root_text]

            inserted = MODULE.ensure_repo_root_on_sys_path()

            self.assertTrue(inserted)
            self.assertEqual(sys.path[0], repo_root_text)
        finally:
            sys.path[:] = original_path

    def test_bootstrap_live_provider_env_imports_canonical_loader(self) -> None:
        loaded_files = MODULE.bootstrap_live_provider_env()

        self.assertIsInstance(loaded_files, list)


if __name__ == "__main__":
    unittest.main()
