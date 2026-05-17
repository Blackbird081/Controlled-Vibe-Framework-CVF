#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_cpf_public_surface_maintainability.py")
SPEC = importlib.util.spec_from_file_location("check_cpf_public_surface_maintainability", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CpfPublicSurfaceMaintainabilityTests(unittest.TestCase):
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
        self._write(
            MODULE.BARREL_PATH,
            "\n".join(
                [
                    '// comment',
                    'export * from "./consumer.pipeline.bridges.barrel";',
                    'export * from "./control.plane.gateway.barrel";',
                ]
            ),
        )
        self._write(
            MODULE.SMOKE_TEST_PATH,
            '\n'.join(
                [
                    'import { describe, it } from "vitest";',
                    'import { createGatewayAuthContract } from "../src/index";',
                    'import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";',
                    'describe("smoke", () => { it("works", () => { void FIXED_BATCH_NOW; createGatewayAuthContract(); }); });',
                ]
            ),
        )
        self._write(
            MODULE.OWNERSHIP_REGISTRY_PATH,
            json.dumps({"partitions": []}),
        )

    def test_passes_for_thin_barrel_and_clean_smoke(self) -> None:
        self._seed()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertTrue(report["compliant"])

    def test_fails_when_barrel_contains_logic(self) -> None:
        self._seed()
        self._write(MODULE.BARREL_PATH, 'export * from "./consumer.pipeline.bridges.barrel";\nfunction nope() {}\n')
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertFalse(report["compliant"])
        self.assertIn("barrel_non_export_content", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
