import json
from pathlib import Path

import check_continuation_chain as guard


def _write_registry(path: Path, entries: list[dict] | None = None) -> Path:
    path.write_text(json.dumps(entries or []), encoding="utf-8")
    return path


def _write_work_order(root: Path, name: str, body: str) -> None:
    root.mkdir(parents=True, exist_ok=True)
    (root / name).write_text(body, encoding="utf-8")


def _write_review(root: Path, name: str, body: str) -> None:
    root.mkdir(parents=True, exist_ok=True)
    (root / name).write_text(body, encoding="utf-8")


def _run(tmp_path: Path, *, include_rule_c: bool = False):
    return guard.run_check(
        tmp_path / "work_orders",
        tmp_path / "reviews",
        _write_registry(tmp_path / "exemptions.json"),
        include_rule_c=include_rule_c,
    )


def test_rule_a_missing_gc018(tmp_path):
    _write_work_order(tmp_path / "work_orders", "CVF_AGENT_WORK_ORDER_C2_TEST_2026-05-19.md", "Status: OPEN\nGC-018 required: Yes\n")

    report = _run(tmp_path)

    assert any(item["rule"] == "A" for item in report["violations"])


def test_rule_a_passes_with_gc018(tmp_path):
    _write_work_order(
        tmp_path / "work_orders",
        "CVF_AGENT_WORK_ORDER_C2_TEST_2026-05-19.md",
        "Status: OPEN\nGC-018 required: Yes\nPath: docs/baselines/CVF_GC018_C2_TEST_2026-05-19.md\n",
    )

    report = _run(tmp_path)

    assert not any(item["rule"] == "A" for item in report["violations"])


def test_rule_a_not_applicable_when_gc018_not_required(tmp_path):
    _write_work_order(tmp_path / "work_orders", "CVF_AGENT_WORK_ORDER_C1_TEST_2026-05-19.md", "Status: OPEN\nGC-018 required: No\n")

    report = _run(tmp_path)

    assert not any(item["rule"] == "A" for item in report["violations"])


def test_rule_b_missing_review(tmp_path):
    _write_work_order(
        tmp_path / "work_orders",
        "CVF_AGENT_WORK_ORDER_LANE_Z_TEST_2026-05-19.md",
        "Status: CLOSED\nGC-018 required: Yes\ndocs/baselines/CVF_GC018_LANE_Z_TEST_2026-05-19.md\n",
    )

    report = _run(tmp_path)

    assert any(item["rule"] == "B" for item in report["violations"])


def test_rule_b_passes_with_review(tmp_path):
    name = "CVF_AGENT_WORK_ORDER_LANE_Z_TEST_2026-05-19.md"
    _write_work_order(
        tmp_path / "work_orders",
        name,
        "Status: CLOSED\nGC-018 required: Yes\ndocs/baselines/CVF_GC018_LANE_Z_TEST_2026-05-19.md\n",
    )
    _write_review(tmp_path / "reviews", "CVF_LANE_Z_TEST_COMPLETION_2026-05-19.md", f"Completed {name}\n")

    report = _run(tmp_path)

    assert not any(item["rule"] == "B" for item in report["violations"])


def test_rule_b_exemption(tmp_path):
    name = "CVF_AGENT_WORK_ORDER_LEGACY_TEST_2026-05-19.md"
    _write_work_order(tmp_path / "work_orders", name, "Status: CLOSED\n")
    registry = _write_registry(tmp_path / "exemptions.json", [{"workOrderFile": name, "reason": "legacy", "addedAt": "2026-05-19", "addedBy": "Worker"}])

    report = guard.run_check(tmp_path / "work_orders", tmp_path / "reviews", registry, include_rule_c=False)

    assert not any(item["rule"] == "B" for item in report["violations"])


def test_rule_c_head_drift(monkeypatch, tmp_path):
    handoff = tmp_path / "handoff.md"
    handoff.write_text("Current HEAD: oldsha\n", encoding="utf-8")
    monkeypatch.setattr(guard, "_active_handoff_path", lambda: handoff)
    monkeypatch.setattr(guard, "_git_head_short", lambda: "12345678")
    monkeypatch.setattr(guard, "_git_parent_short", lambda: "abcdef01")

    violations = guard._check_handoff_head()

    expected_file = str(handoff.relative_to(guard.REPO_ROOT)) if handoff.is_relative_to(guard.REPO_ROOT) else str(handoff)
    assert violations == [{"rule": "C", "file": expected_file, "issue": "GC-020 drift", "headSha": "12345678", "parentSha": "abcdef01"}]


def test_rule_c_passes(monkeypatch, tmp_path):
    handoff = tmp_path / "handoff.md"
    handoff.write_text("Current HEAD: 12345678\n", encoding="utf-8")
    monkeypatch.setattr(guard, "_active_handoff_path", lambda: handoff)
    monkeypatch.setattr(guard, "_git_head_short", lambda: "12345678")
    monkeypatch.setattr(guard, "_git_parent_short", lambda: "abcdef01")

    assert guard._check_handoff_head() == []


def test_rule_c_accepts_parent_sha(monkeypatch, tmp_path):
    """A GC-020 sync commit naturally embeds its parent SHA, not its own.

    The pre-push gate runs with HEAD = the sync commit itself. Requiring the
    sync commit's own SHA inside its own content is impossible (a commit
    cannot reference its own future SHA). Accepting the parent SHA preserves
    the recency guarantee without forcing self-reference.
    """
    handoff = tmp_path / "handoff.md"
    handoff.write_text("Current HEAD (GC-020): abcdef01 (GC-020 sync)\n", encoding="utf-8")
    monkeypatch.setattr(guard, "_active_handoff_path", lambda: handoff)
    monkeypatch.setattr(guard, "_git_head_short", lambda: "12345678")
    monkeypatch.setattr(guard, "_git_parent_short", lambda: "abcdef01")

    assert guard._check_handoff_head() == []


def test_rule_c_fails_when_neither_head_nor_parent_present(monkeypatch, tmp_path):
    handoff = tmp_path / "handoff.md"
    handoff.write_text("Current HEAD: stale-anchor\n", encoding="utf-8")
    monkeypatch.setattr(guard, "_active_handoff_path", lambda: handoff)
    monkeypatch.setattr(guard, "_git_head_short", lambda: "12345678")
    monkeypatch.setattr(guard, "_git_parent_short", lambda: "abcdef01")

    violations = guard._check_handoff_head()

    assert violations and violations[0]["rule"] == "C"


def test_rule_c_passes_when_parent_missing_and_head_present(monkeypatch, tmp_path):
    handoff = tmp_path / "handoff.md"
    handoff.write_text("Current HEAD: 12345678\n", encoding="utf-8")
    monkeypatch.setattr(guard, "_active_handoff_path", lambda: handoff)
    monkeypatch.setattr(guard, "_git_head_short", lambda: "12345678")
    monkeypatch.setattr(guard, "_git_parent_short", lambda: None)

    assert guard._check_handoff_head() == []
