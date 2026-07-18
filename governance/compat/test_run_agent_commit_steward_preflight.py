import subprocess
from pathlib import Path

import governance.compat.run_agent_commit_steward_preflight as steward


def test_protected_session_path_classification() -> None:
    assert steward._is_protected_session_path("CVF_SESSION_MEMORY.md")
    assert steward._is_protected_session_path("CVF_SESSION/ACTIVE_SESSION_STATE.json")
    assert steward._is_protected_session_path("AGENT_HANDOFF_V18_2026-06-12.md")
    assert not steward._is_protected_session_path("CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json")
    assert not steward._is_protected_session_path("docs/reference/example.md")


def test_agent_operation_trace_detection(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(steward, "REPO_ROOT", tmp_path)
    traced = tmp_path / "docs" / "reviews" / "trace.md"
    traced.parent.mkdir(parents=True)
    traced.write_text(
        "# Trace\n\n## Agent Operation Trace Block\n\n| Actual changed set | x |\n",
        encoding="utf-8",
    )
    plain = tmp_path / "docs" / "reviews" / "plain.md"
    plain.write_text("# Plain\n", encoding="utf-8")

    assert steward._has_agent_operation_trace("docs/reviews/trace.md")
    assert not steward._has_agent_operation_trace("docs/reviews/plain.md")


def test_path_plan_collision_risk(monkeypatch) -> None:
    monkeypatch.setattr(
        steward,
        "_range_paths",
        lambda base, head: (
            "docs/work_orders/example.md",
            "AGENT_HANDOFF_V18_2026-06-12.md",
        ),
    )
    monkeypatch.setattr(steward, "_status_paths", lambda: ())
    monkeypatch.setattr(
        steward,
        "_has_agent_operation_trace",
        lambda path: path == "docs/work_orders/example.md",
    )

    plan = steward.build_path_plan("base", "head")

    assert plan.mixed_material_and_session
    assert plan.exact_manifest_collision_risk
    assert plan.material_paths == ("docs/work_orders/example.md",)
    assert plan.protected_session_paths == ("AGENT_HANDOFF_V18_2026-06-12.md",)
    assert steward._recommended_mode(plan) == "split: material first, session-sync/handoff-sync second"


def test_agents_handoff_pointer_change_joins_session_sync(monkeypatch) -> None:
    monkeypatch.setattr(
        steward,
        "_range_paths",
        lambda base, head: ("AGENTS.md", "AGENT_HANDOFF_V22_2026-06-22.md"),
    )
    monkeypatch.setattr(steward, "_status_paths", lambda: ())
    monkeypatch.setattr(steward, "_agents_change_is_handoff_routing_only", lambda base: True)
    monkeypatch.setattr(steward, "_has_agent_operation_trace", lambda path: False)

    plan = steward.build_path_plan("base", "head")

    assert plan.material_paths == ()
    assert plan.protected_session_paths == (
        "AGENTS.md",
        "AGENT_HANDOFF_V22_2026-06-22.md",
    )
    assert steward._recommended_mode(plan) == "session-sync"


def test_agents_rule_change_remains_material(monkeypatch) -> None:
    monkeypatch.setattr(
        steward,
        "_range_paths",
        lambda base, head: ("AGENTS.md", "AGENT_HANDOFF_V22_2026-06-22.md"),
    )
    monkeypatch.setattr(steward, "_status_paths", lambda: ())
    monkeypatch.setattr(steward, "_agents_change_is_handoff_routing_only", lambda base: False)
    monkeypatch.setattr(steward, "_has_agent_operation_trace", lambda path: False)

    plan = steward.build_path_plan("base", "head")

    assert plan.material_paths == ("AGENTS.md",)
    assert plan.protected_session_paths == ("AGENT_HANDOFF_V22_2026-06-22.md",)


def test_agents_pointer_comparison_normalizes_line_endings_and_trailing_newline(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(steward, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(
        steward,
        "_git_output",
        lambda *args, **kwargs: "Active: `AGENT_HANDOFF_V21_2026-06-22.md`",
    )
    (tmp_path / "AGENTS.md").write_text(
        "Active: `AGENT_HANDOFF_V22_2026-06-22.md`\r\n",
        encoding="utf-8",
    )

    assert steward._agents_change_is_handoff_routing_only("base")


def test_handoff_sync_only_lane(monkeypatch) -> None:
    monkeypatch.setattr(
        steward,
        "_range_paths",
        lambda base, head: ("AGENT_HANDOFF_V18_2026-06-12.md",),
    )
    monkeypatch.setattr(steward, "_status_paths", lambda: ())
    monkeypatch.setattr(steward, "_has_agent_operation_trace", lambda path: False)

    plan = steward.build_path_plan("base", "head")

    assert plan.handoff_sync_only
    assert plan.material_paths == ()
    assert plan.protected_session_paths == ("AGENT_HANDOFF_V18_2026-06-12.md",)
    assert steward._recommended_mode(plan) == "handoff-sync"
    assert steward._validate_mode_shape("handoff-sync", "base", "head", plan, True) == 0


def test_handoff_sync_rejects_session_state_mix(monkeypatch) -> None:
    monkeypatch.setattr(steward, "_short_ref", lambda ref: ref)
    plan = steward.PathPlan(
        changed_paths=(
            "AGENT_HANDOFF_V18_2026-06-12.md",
            "CVF_SESSION/ACTIVE_SESSION_STATE.json",
        ),
        material_paths=(),
        protected_session_paths=(
            "AGENT_HANDOFF_V18_2026-06-12.md",
            "CVF_SESSION/ACTIVE_SESSION_STATE.json",
        ),
        trace_artifact_paths=(),
        mixed_material_and_session=False,
        exact_manifest_collision_risk=False,
        handoff_sync_only=False,
    )

    assert steward._validate_mode_shape("handoff-sync", "base", "head", plan, True) == 1


def test_session_sync_commands_include_closure_packaging_preflight() -> None:
    commands = steward._mode_commands("session-sync", "base", "head")

    assert commands[0].name == "closure packaging preflight"
    assert commands[0].args == (
        "python",
        "governance/compat/check_closure_packaging_preflight.py",
        "--base",
        "base",
        "--head",
        "head",
        "--enforce",
    )


def test_handoff_sync_commands_stay_lightweight() -> None:
    commands = steward._mode_commands("handoff-sync", "base", "head")

    assert [command.name for command in commands] == [
        "active session state compatibility",
        "diff hygiene",
    ]


def test_status_paths_handles_trimmed_git_status(monkeypatch) -> None:
    monkeypatch.setattr(
        steward,
        "_git_output",
        lambda *args, **kwargs: "M AGENTS.md\n?? docs/reference/new.md\n",
    )

    assert steward._status_paths() == (
        "AGENTS.md",
        "docs/reference/new.md",
    )


def test_phase_command_requests_exact_autorun_receipt_reuse() -> None:
    command = steward._mode_commands("implementation", "base", "head")[0]

    assert command.args[-1] == "--reuse-valid-receipt"


def test_git_output_does_not_mix_stderr_warning_into_paths(monkeypatch) -> None:
    monkeypatch.setattr(
        steward.subprocess,
        "run",
        lambda *args, **kwargs: subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=" M docs/reference/example.md\n",
            stderr="warning: ignored config\n",
        ),
    )

    assert steward._git_output("status", "--short") == "M docs/reference/example.md"
