import json
import subprocess

import governance.compat.run_agent_push_readiness_preview as preview
import governance.compat.run_agent_commit_steward_preflight as steward


def test_preview_commands_include_cascade_prone_marker_checks() -> None:
    commands = dict(preview._preview_commands("base", "head"))

    assert commands["active session state compatibility"] == (
        "python",
        "governance/compat/check_active_session_state.py",
        "--enforce",
    )
    assert commands["active-window registry"] == (
        "python",
        "governance/compat/check_active_window_registry.py",
        "--enforce",
    )
    assert commands["review retention registry"] == (
        "python",
        "governance/compat/check_review_retention_registry.py",
        "--enforce",
    )
    assert commands["pre-public P3 readiness"] == (
        "python",
        "governance/compat/check_prepublic_p3_readiness.py",
        "--enforce",
    )
    assert commands["knowledge absorption priority guard"] == (
        "python",
        "governance/compat/check_knowledge_absorption_priority_compat.py",
        "--base",
        "base",
        "--head",
        "head",
        "--enforce",
    )


def test_shape_result_fails_mixed_material_and_session(monkeypatch) -> None:
    plan = steward.PathPlan(
        changed_paths=("docs/reviews/example.md", "AGENT_HANDOFF_V23_2026-06-26.md"),
        material_paths=("docs/reviews/example.md",),
        protected_session_paths=("AGENT_HANDOFF_V23_2026-06-26.md",),
        trace_artifact_paths=(),
        mixed_material_and_session=True,
        exact_manifest_collision_risk=False,
        handoff_sync_only=False,
    )
    monkeypatch.setattr(preview.steward, "build_path_plan", lambda base, head: plan)

    result = preview._shape_result("base", "head")

    assert result.status == "FAIL"
    assert result.recommended_lane == "split: material first, session-sync/handoff-sync second"


def test_upstream_status_reports_missing_tracking_branch(monkeypatch) -> None:
    def fake_git_output(*args, check=False):
        return 1, "fatal: no upstream configured"

    monkeypatch.setattr(preview, "_git_output", fake_git_output)

    result = preview._upstream_status(ahead_limit=2)

    assert result.status == "FAIL"
    assert "no upstream" in result.output


def test_upstream_status_fails_when_push_debt_exceeds_limit(monkeypatch) -> None:
    def fake_git_output(*args, check=False):
        if args[:4] == ("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"):
            return 0, "origin/main"
        if args[:3] == ("rev-list", "--left-right", "--count"):
            return 0, "0\t3"
        return 1, "unexpected git call"

    monkeypatch.setattr(preview, "_git_output", fake_git_output)

    result = preview._upstream_status(ahead_limit=2)

    assert result.status == "FAIL"
    assert result.returncode == 1
    assert "upstream push debt exceeds limit 2" in result.output


def test_upstream_status_passes_within_push_debt_limit(monkeypatch) -> None:
    def fake_git_output(*args, check=False):
        if args[:4] == ("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"):
            return 0, "origin/main"
        if args[:3] == ("rev-list", "--left-right", "--count"):
            return 0, "0\t2"
        return 1, "unexpected git call"

    monkeypatch.setattr(preview, "_git_output", fake_git_output)

    result = preview._upstream_status(ahead_limit=2)

    assert result.status == "PASS"
    assert result.returncode == 0


def test_main_json_returns_nonzero_only_when_enforced(monkeypatch, capsys) -> None:
    shape = preview.ShapeResult(
        changed_paths=(),
        material_paths=(),
        protected_session_paths=(),
        trace_artifact_paths=(),
        mixed_material_and_session=False,
        exact_manifest_collision_risk=False,
        recommended_lane="no changed paths detected",
        status="PASS",
    )
    checks = (
        preview.PreviewResult(
            label="failing check",
            command=("check",),
            returncode=1,
            duration_s=0.01,
            status="FAIL",
            output="bad",
        ),
    )
    monkeypatch.setattr(
        preview,
        "_run_preview",
        lambda base, head, include_upstream, upstream_ahead_limit: (shape, checks),
    )
    monkeypatch.setattr(preview.sys, "argv", ["prog", "--json"])

    assert preview.main() == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "FAIL"

    monkeypatch.setattr(preview.sys, "argv", ["prog", "--json", "--enforce"])
    assert preview.main() == 1


def test_run_command_uses_utf8_replace(monkeypatch) -> None:
    observed = {}

    def fake_run(*args, **kwargs):
        observed.update(kwargs)
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="ok", stderr="")

    monkeypatch.setattr(preview.subprocess, "run", fake_run)

    result = preview._run_command("sample", ("cmd",))

    assert result.status == "PASS"
    assert observed["encoding"] == "utf-8"
    assert observed["errors"] == "replace"
