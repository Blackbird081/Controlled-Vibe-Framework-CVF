#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_batch_contract_determinism.py")
SPEC = importlib.util.spec_from_file_location("check_batch_contract_determinism", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class BatchContractDeterminismTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "EXTENSIONS" / "CVF_CONTROL_PLANE_FOUNDATION" / "src").mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _run(self) -> dict:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "GOVERNED_ROOTS", ("EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src",)):
                return MODULE._classify()

    def test_accepts_deterministic_batch_file(self) -> None:
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/example.batch.contract.ts",
            """
            export class ExampleBatchContract {
              private readonly now: () => string;
              constructor() {
                this.now = () => "2026-04-05T00:00:00Z";
                const contract = new ExampleContract({ now: this.now });
                void contract;
              }
              batchHashOnly() {
                const { batchHash, batchId } = createDeterministicBatchIdentity({
                  batchSeed: "seed",
                  batchIdSeed: "seed-id",
                  hashParts: ["x"],
                });
                return { batchHash, batchId };
              }
            }
            """,
        )
        report = self._run()
        self.assertTrue(report["compliant"])

    def test_rejects_batch_id_parts(self) -> None:
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/example.batch.contract.ts",
            """
            const { batchHash, batchId } = createDeterministicBatchIdentity({
              batchSeed: "seed",
              batchIdSeed: "seed-id",
              hashParts: ["x"],
              batchIdParts: ["volatile"],
            });
            void batchHash;
            void batchId;
            """,
        )
        report = self._run()
        self.assertFalse(report["compliant"])
        self.assertIn("batch_id_parts_forbidden", {v["type"] for v in report["violations"]})

    def test_rejects_direct_batch_id_without_batch_hash(self) -> None:
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/example.batch.contract.ts",
            """
            const batchId = computeDeterministicHash(
              "seed-id",
              "volatile-direct-id",
            );
            void batchId;
            """,
        )
        report = self._run()
        self.assertFalse(report["compliant"])
        self.assertIn("direct_batch_id_not_derived_from_batch_hash", {v["type"] for v in report["violations"]})

    def test_rejects_nested_contract_without_now(self) -> None:
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/example.batch.contract.ts",
            """
            export class ExampleBatchContract {
              private readonly now: () => string;
              constructor() {
                this.now = () => "2026-04-05T00:00:00Z";
                const contract = new ExampleContract({});
                void contract;
              }
            }
            """,
        )
        report = self._run()
        self.assertFalse(report["compliant"])
        self.assertIn("nested_now_not_propagated", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
