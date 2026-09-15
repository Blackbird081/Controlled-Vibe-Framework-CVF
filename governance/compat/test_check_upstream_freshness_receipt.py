"""Negative boundary tests for the offline upstream freshness receipt."""
from datetime import datetime, timezone
import json
import subprocess
import sys
from pathlib import Path
import unittest

from check_upstream_freshness_receipt import unique_object, validate, validate_dispatch, applies_to_dispatch
from unittest.mock import patch

NOW = datetime(2026, 9, 14, 12, tzinfo=timezone.utc)


def receipt():
    return dict(schemaVersion="cvf.upstream-freshness.v1",
                sourceUrl="https://github.com/example/repo.git",
                observedAt="2026-09-14T10:00:00Z", manifestFrozenAt="2026-09-14T11:00:00Z",
                defaultBranch="refs/heads/main", observedHead="a" * 40,
                selectedPin="a" * 40, previousPin="NONE", selectionReason="",
                deltaSummary="", lsRemoteOutput="ref: refs/heads/main\tHEAD\n" + "a" * 40 + "\tHEAD\n")


class FreshnessTests(unittest.TestCase):
    def packet(self, rows=None):
        return ("# Audit\nsource-intake\n.private_reference/source_mirrors/example__repo/\n"
                + "a" * 40 + "\n## Upstream Freshness Preflight\n```json\n"
                + json.dumps([receipt()] if rows is None else rows) + "\n```\n")

    def test_dispatch_binding_and_activation(self):
        old = 'Status: DISPATCH_READY\nsource-intake'
        closed = old.replace('DISPATCH_READY', 'CLOSED_PASS_BOUNDED') + '\n## Machine Closure Package\nclosure evidence'
        self.assertEqual(validate_dispatch(closed, historical_text=old, now=NOW), [])
        self.assertTrue(validate_dispatch(closed.replace('source-intake', 'source-intake changed'), historical_text=old, now=NOW))
        packet = self.packet()
        self.assertTrue(applies_to_dispatch("docs/work_orders/new.md", packet))
        self.assertFalse(applies_to_dispatch("docs/reviews/old.md", packet))
        self.assertEqual(validate_dispatch(packet, now=NOW, newly_dispatched=True), [])
        self.assertTrue(validate_dispatch("source-intake", now=NOW))
        self.assertEqual(validate_dispatch("source-intake", historical_text="source-intake", now=NOW), [])
        self.assertTrue(validate_dispatch("source-intake changed", historical_text="source-intake", now=NOW))
        self.assertTrue(validate_dispatch(self.packet([]), now=NOW))
        self.assertTrue(validate_dispatch(self.packet([receipt(), receipt()]), now=NOW))
        self.assertTrue(validate_dispatch(packet.replace("example__repo", "missing__repo"), now=NOW))
        self.assertTrue(validate_dispatch(packet.replace("a" * 40 + "\n##", "b" * 40 + "\n##"), now=NOW))
        later = datetime(2026, 9, 16, 12, tzinfo=timezone.utc)
        self.assertTrue(validate_dispatch(packet, now=later, newly_dispatched=True))
        self.assertEqual(validate_dispatch(packet, now=later), [])

    def test_existing_routing_gate_rejects_missing_receipt(self):
        import check_external_knowledge_intake_routing as routing
        with patch.object(routing, "_read_file", return_value="source-intake"), \
             patch.object(routing, "_run_git", return_value=(1, "", "absent")), \
             patch.object(routing, "check_text", return_value=[]), \
             patch.object(routing, "check_coordination", return_value=[]):
            errors = routing.check_paths(["docs/work_orders/new.md"])
        self.assertTrue(any("Upstream Freshness Preflight" in error for error in errors))

    def test_current_and_historical_receipts(self):
        self.assertEqual(validate(receipt(), NOW), [])
        row = receipt()
        row.update(previousPin="b" * 40, selectedPin="b" * 40,
                   selectionReason="Audit released version", deltaSummary="UI changed; core unchanged")
        self.assertEqual(validate(row, NOW), [])

    def test_invalid_evidence_is_rejected(self):
        cases = [dict(observedHead="a" * 7), dict(selectedPin="b" * 40),
                 dict(previousPin="b" * 40), dict(lsRemoteOutput=""),
                 dict(defaultBranch="refs/heads/other"), dict(sourceUrl="https://token@github.com/x/y"),
                 dict(observedAt="2026-09-12T10:00:00Z"),
                 dict(observedAt="2026-09-14T11:30:00Z"),
                 dict(manifestFrozenAt="2026-09-15T11:00:00Z"),
                 dict(observedAt="2026-09-14T10:00:00"),
                 dict(observedAt="bad"), dict(previousPin=None), dict(extra=True),
                 dict(lsRemoteOutput=receipt()["lsRemoteOutput"] + "b" * 40 + "\tHEAD\n")]
        for delta in cases:
            with self.subTest(delta=delta):
                self.assertTrue(validate(receipt() | delta, NOW))
        self.assertTrue(validate([], NOW))
        self.assertTrue(validate({}, NOW))

    def test_duplicate_fields_rejected(self):
        with self.assertRaises(ValueError):
            json.loads('{"a":1,"a":2}', object_pairs_hook=unique_object)

    def test_missing_receipt_cli_fails(self):
        result = subprocess.run([sys.executable, str(Path(__file__).with_name(
            "check_upstream_freshness_receipt.py")), "--receipt", "nonexistent-freshness-receipt.json"],
            capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("FAIL:", result.stdout)


if __name__ == "__main__":
    unittest.main()
