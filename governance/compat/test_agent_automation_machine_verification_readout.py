"""Focused tests for the bounded MFRP-P2 AAF readout module."""

from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

import run_agent_automation_assist as assist
import run_agent_autorun_workflow_gate as autorun
from run_agent_commit_steward_preflight import PathPlan


def _plan() -> PathPlan:
    return PathPlan((), (), (), (), False, False, False, False)


class MachineVerificationReadoutTests(unittest.TestCase):
    def _v3_receipt(self) -> dict:
        context = {
            "phase": "pre-implementation",
            "base": "base",
            "head": "head",
            "baseSha": "abc",
            "headSha": "def",
            "commandManifestHash": "manifest",
            "worktreeFingerprint": "worktree",
            "verifierIdentityProfile": autorun.VERIFIER_IDENTITY_PROFILE,
        }
        digest = "a" * 64
        results = (
            autorun.GateResult(
                1,
                "sample",
                ("python", "governance/compat/check_sample.py"),
                0,
                0.1,
                "",
            ),
        )
        mv = autorun._machine_verification_object(context, digest, results)
        return {
            "schema": autorun.RECEIPT_SCHEMA,
            "status": "PASS",
            **context,
            "verifierIdentityDigest": digest,
            "machineVerification": mv,
            "receiptDigest": autorun._machine_verification_digest(mv),
            "checks": [
                {
                    "name": results[0].name,
                    "command": list(results[0].command),
                    "durationSeconds": 0.1,
                    "status": "PASS",
                }
            ],
        }

    @staticmethod
    def _write_receipt(root: Path, payload: object) -> Path:
        path = root / ".cvf/runtime/autorun-receipts/pre-implementation.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def test_valid_and_tampered_receipts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            payload = self._v3_receipt()
            path = self._write_receipt(root, payload)
            with mock.patch.object(assist, "REPO_ROOT", root):
                valid, _, reason = assist._read_receipt_readonly(str(path))
            self.assertTrue(valid, reason)
            payload["receiptDigest"] = "f" * 64
            self._write_receipt(root, payload)
            with mock.patch.object(assist, "REPO_ROOT", root):
                valid, _, reason = assist._read_receipt_readonly(str(path))
            self.assertFalse(valid)
            self.assertIn("receiptDigest mismatch", reason)

    def test_unclassified_exceptions_and_gap_probes_preserved(self):
        payload = self._v3_receipt()
        payload["machineVerification"]["exceptions"] = ["sample exception"]
        payload["machineVerification"]["unclassifiedItems"] = ["u1", "u2"]
        readout = assist._build_machine_verification_readout(True, payload, "ok")
        self.assertEqual(readout.unclassified, ("u1", "u2"))
        self.assertEqual(readout.exceptions, ("sample exception",))
        self.assertEqual(len(readout.candidate_probes), len(readout.not_checked_scope))
        self.assertIn("evidence gap", " ".join(readout.candidate_probes).lower())

    def test_malformed_and_non_object_receipts_fail_closed_without_crash(self):
        malformed = self._v3_receipt()
        malformed["machineVerification"]["notCheckedScope"] = None
        readout = assist._build_machine_verification_readout(False, malformed, "bad")
        self.assertEqual(readout.not_checked_scope, ())
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self._write_receipt(root, [])
            with mock.patch.object(assist, "REPO_ROOT", root), mock.patch.object(
                assist, "build_path_plan", return_value=_plan()
            ):
                report = assist.build_report("HEAD", "HEAD", "auto", str(path))
        self.assertFalse(report.machine_verification_readout.valid)
        self.assertIn("not an object", report.machine_verification_readout.reason)

    def test_ordering_identity_and_claim_boundary(self):
        item = assist._build_machine_verification_readout(
            True, self._v3_receipt(), "ok"
        )
        report = assist.AssistReport(
            "HEAD", "HEAD", "auto", "reviewer-return", (), (), (), (), "", "", machine_verification_readout=item
        )
        data = report._machine_readout_to_dict()
        keys = list(data)
        self.assertEqual(keys[:2], ["status", "receiptIdentity"])
        self.assertEqual(keys[-1], "reason")
        for field in ("notCheckedScope", "limitations", "unclassified", "exceptions"):
            self.assertLess(keys.index(field), keys.index("deterministicResults"))
        self.assertEqual(data["status"], assist.DETERMINISTIC_PREFLIGHT_COMPLETE)
        text = json.dumps(data).lower()
        self.assertNotIn("no rerun", text)
        self.assertNotIn("authorize the next phase", text)

    def test_absent_and_out_of_bound_receipt_behavior(self):
        with mock.patch.object(assist, "build_path_plan", return_value=_plan()):
            report = assist.build_report("HEAD", "HEAD", "auto")
        self.assertIsNone(report.machine_verification_readout)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            outside = root / "outside.json"
            outside.write_text("{}", encoding="utf-8")
            repo = root / "repo"
            repo.mkdir()
            with mock.patch.object(assist, "REPO_ROOT", repo):
                valid, _, reason = assist._read_receipt_readonly(str(outside))
        self.assertFalse(valid)
        self.assertIn("outside repository boundary", reason)

    def test_consumption_is_read_only_and_human_output_is_mechanical(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self._write_receipt(root, self._v3_receipt())
            before = sorted(str(item) for item in root.rglob("*"))
            buf = io.StringIO()
            with mock.patch.object(assist, "REPO_ROOT", root), mock.patch.object(
                assist, "build_path_plan", return_value=_plan()
            ), redirect_stdout(buf):
                rc = assist.main(
                    ["--base", "HEAD", "--head", "HEAD", "--consume-receipt", str(path)]
                )
            after = sorted(str(item) for item in root.rglob("*"))
        self.assertEqual(rc, 0)
        self.assertEqual(before, after)
        self.assertIn(assist.DETERMINISTIC_PREFLIGHT_COMPLETE, buf.getvalue())


if __name__ == "__main__":
    unittest.main()
