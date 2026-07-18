import json
import tempfile
import unittest
from pathlib import Path

from governance.compat.generate_active_session_state import (
    BOOTSTRAP_FIELDS,
    CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES,
    aggregate_entry,
    build_state,
    entry_filename,
    generate_bootstrap_read_model,
    render_json,
    validate_aggregate_matches_sources,
    validate_bootstrap_read_model_matches_sources,
)


class GenerateActiveSessionStateTests(unittest.TestCase):
    def test_entry_filename_uses_safe_slug(self) -> None:
        self.assertEqual(
            entry_filename("nextAllowedMove"),
            "nextAllowedMove.json",
        )
        self.assertEqual(
            entry_filename("Policy Local / PL-S1"),
            "Policy-Local-PL-S1.json",
        )

    def test_build_state_sorts_by_state_order_and_expands_entries(self) -> None:
        state = build_state(
            {"schemaVersion": "0.1.0"},
            [
                {"stateOrder": 3, "stateKey": "b", "value": "B"},
                {"stateOrder": 2, "stateKey": "a", "value": {"nested": True}},
            ],
        )

        self.assertEqual(list(state.keys()), ["schemaVersion", "a", "b"])
        self.assertEqual(state["a"], {"nested": True})

    def test_aggregate_entry_requires_state_key_and_value(self) -> None:
        self.assertEqual(
            aggregate_entry({"stateOrder": 1, "stateKey": "mode", "value": "x"}),
            ("mode", "x"),
        )
        with self.assertRaises(ValueError):
            aggregate_entry({"stateOrder": 1, "value": "x"})
        with self.assertRaises(ValueError):
            aggregate_entry({"stateOrder": 1, "stateKey": "mode"})

    def test_validate_aggregate_matches_sources_detects_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            core = root / "core.json"
            entries = root / "entries"
            aggregate = root / "aggregate.json"
            entries.mkdir()
            core.write_text(render_json({"schemaVersion": "0.1.0"}), encoding="utf-8")
            (entries / "mode.json").write_text(
                render_json({"stateOrder": 2, "stateKey": "mode", "value": "ready"}),
                encoding="utf-8",
            )
            aggregate.write_text(
                json.dumps({"schemaVersion": "0.1.0", "mode": "stale"}),
                encoding="utf-8",
            )

            violations = validate_aggregate_matches_sources(aggregate, core, entries)

        self.assertEqual(len(violations), 1)
        self.assertIn("ACTIVE_SESSION_STATE.json drifted", violations[0])


    def test_generate_bootstrap_read_model_creates_file_with_required_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            aggregate = root / "aggregate.json"
            bootstrap = root / "bootstrap.json"
            state = {
                "schemaVersion": "0.1.0",
                "currentMode": "test_mode",
                "activeHandoff": "AGENT_HANDOFF_TEST.md",
                "nextAllowedMove": "test move",
                "activeStateRegistry": "CVF_SESSION/ACTIVE_SESSION_STATE.json",
                "activeSessionFrontDoor": "CVF_SESSION_MEMORY.md",
                "freezePosture": "none",
                "activeReviewQueue": "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json",
                "extraField": "should not appear",
            }
            aggregate.write_text(render_json(state), encoding="utf-8")

            generate_bootstrap_read_model(aggregate, bootstrap)

            self.assertTrue(bootstrap.exists())
            model = json.loads(bootstrap.read_text(encoding="utf-8"))
            for field in BOOTSTRAP_FIELDS:
                self.assertIn(field, model)
            self.assertNotIn("extraField", model)
            self.assertIn("claimBoundary", model)
            self.assertIn("compact bootstrap", model["claimBoundary"].lower())

    def test_validate_bootstrap_read_model_detects_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            aggregate = root / "aggregate.json"
            bootstrap = root / "bootstrap.json"
            state = {
                "schemaVersion": "0.1.0",
                "currentMode": "mode_a",
                "activeHandoff": "HANDOFF.md",
                "nextAllowedMove": "move",
                "activeStateRegistry": "CVF_SESSION/ACTIVE_SESSION_STATE.json",
                "activeSessionFrontDoor": "CVF_SESSION_MEMORY.md",
            }
            aggregate.write_text(render_json(state), encoding="utf-8")
            stale_model = {
                "schemaVersion": "0.1.0",
                "currentMode": "stale_mode",
                "claimBoundary": "bootstrap",
            }
            bootstrap.write_text(render_json(stale_model), encoding="utf-8")

            violations = validate_bootstrap_read_model_matches_sources(aggregate, bootstrap)

            self.assertGreater(len(violations), 0)
            drift_fields = " ".join(violations)
            self.assertIn("currentMode", drift_fields)

    def test_bootstrap_read_model_size_is_within_ceiling(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            aggregate = root / "aggregate.json"
            bootstrap = root / "bootstrap.json"
            state = {
                "schemaVersion": "0.1.0",
                "currentMode": "test_mode",
                "activeHandoff": "AGENT_HANDOFF_TEST.md",
                "nextAllowedMove": "test move description",
                "activeStateRegistry": "CVF_SESSION/ACTIVE_SESSION_STATE.json",
                "activeSessionFrontDoor": "CVF_SESSION_MEMORY.md",
                "freezePosture": "none",
                "activeReviewQueue": "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json",
            }
            aggregate.write_text(render_json(state), encoding="utf-8")

            generate_bootstrap_read_model(aggregate, bootstrap)

            size = bootstrap.stat().st_size
            self.assertLessEqual(
                size,
                CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES,
                f"bootstrap read model {size} bytes exceeds ceiling "
                f"{CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES}",
            )


if __name__ == "__main__":
    unittest.main()
