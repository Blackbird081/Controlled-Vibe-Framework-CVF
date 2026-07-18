import json
from pathlib import Path

import governance.compat.run_agent_autorun_workflow_gate as autorun
import governance.compat.run_agent_commit_steward_preflight as steward


def test_range_shape_preflight_blocks_exact_manifest_session_mix(monkeypatch) -> None:
    plan = steward.PathPlan(
        changed_paths=(
            "docs/reviews/example.md",
            "AGENT_HANDOFF_V19_2026-06-15.md",
        ),
        material_paths=("docs/reviews/example.md",),
        protected_session_paths=("AGENT_HANDOFF_V19_2026-06-15.md",),
        trace_artifact_paths=("docs/reviews/example.md",),
        mixed_material_and_session=True,
        exact_manifest_collision_risk=True,
        handoff_sync_only=False,
    )
    monkeypatch.setattr(autorun.steward, "build_path_plan", lambda base, head: plan)

    assert autorun._range_shape_preflight("pre-closure", "base", "head") == 1


def test_range_shape_preflight_allows_split_material_range(monkeypatch) -> None:
    plan = steward.PathPlan(
        changed_paths=("docs/reviews/example.md",),
        material_paths=("docs/reviews/example.md",),
        protected_session_paths=(),
        trace_artifact_paths=("docs/reviews/example.md",),
        mixed_material_and_session=False,
        exact_manifest_collision_risk=False,
        handoff_sync_only=False,
    )
    monkeypatch.setattr(autorun.steward, "build_path_plan", lambda base, head: plan)

    assert autorun._range_shape_preflight("pre-closure", "base", "head") == 0


def test_range_shape_preflight_ignores_pre_dispatch(monkeypatch) -> None:
    monkeypatch.setattr(
        autorun.steward,
        "build_path_plan",
        lambda base, head: (_ for _ in ()).throw(AssertionError("not called")),
    )

    assert autorun._range_shape_preflight("pre-dispatch", "base", "head") == 0


def test_command_manifest_hash_changes_with_command() -> None:
    first = (autorun.GateCommand("one", ("python", "one.py")),)
    second = (autorun.GateCommand("one", ("python", "two.py")),)

    assert autorun._command_manifest_hash(first) != autorun._command_manifest_hash(second)


def test_valid_receipt_requires_exact_context(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    expected = {
        "phase": "pre-implementation",
        "baseSha": "abc1234",
        "headSha": "def5678",
        "commandManifestHash": "manifest",
        "worktreeFingerprint": "worktree",
    }
    path.write_text(
        json.dumps({"schema": autorun.RECEIPT_SCHEMA, "status": "PASS", **expected}),
        encoding="utf-8",
    )

    assert autorun._load_valid_receipt(path, expected)[0]
    stale = {**expected, "worktreeFingerprint": "changed"}
    valid, reason = autorun._load_valid_receipt(path, stale)
    assert not valid
    assert reason == "receipt worktreeFingerprint mismatch"


def test_malformed_receipt_fails_closed(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    path.write_text("{not-json", encoding="utf-8")

    valid, reason = autorun._load_valid_receipt(path, {"phase": "pre-dispatch"})

    assert not valid
    assert reason.startswith("receipt unreadable:")


def test_parallel_runner_retains_all_results_and_failure(monkeypatch) -> None:
    commands = (
        autorun.GateCommand("pass", ("pass",)),
        autorun.GateCommand("fail", ("fail",)),
    )

    def fake_execute(index: int, command: autorun.GateCommand) -> autorun.GateResult:
        return autorun.GateResult(
            index=index,
            name=command.name,
            command=command.command,
            returncode=1 if command.name == "fail" else 0,
            duration_s=0.01,
            output="",
        )

    monkeypatch.setattr(autorun, "_execute", fake_execute)
    results = autorun._run_commands(commands, parallel=True, max_workers=2)

    assert [result.name for result in results] == ["pass", "fail"]
    assert [result.returncode for result in results] == [0, 1]


def test_serial_runner_preserves_manifest_order(monkeypatch) -> None:
    observed: list[str] = []
    commands = (
        autorun.GateCommand("first", ("first",)),
        autorun.GateCommand("second", ("second",)),
    )

    def fake_execute(index: int, command: autorun.GateCommand) -> autorun.GateResult:
        observed.append(command.name)
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, "")

    monkeypatch.setattr(autorun, "_execute", fake_execute)
    autorun._run_commands(commands, parallel=False, max_workers=1)

    assert observed == ["first", "second"]


def test_worktree_fingerprint_changes_with_file_content(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "sample.txt"
    target.write_text("one", encoding="utf-8")
    plan = steward.PathPlan(
        changed_paths=("sample.txt",),
        material_paths=("sample.txt",),
        protected_session_paths=(),
        trace_artifact_paths=(),
        mixed_material_and_session=False,
        exact_manifest_collision_risk=False,
        handoff_sync_only=False,
    )
    monkeypatch.setattr(autorun, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(autorun.steward, "build_path_plan", lambda base, head: plan)

    first = autorun._worktree_fingerprint("base", "head")
    target.write_text("two", encoding="utf-8")
    second = autorun._worktree_fingerprint("base", "head")

    assert first != second


def test_git_status_short_keeps_stderr_separate(monkeypatch) -> None:
    class Proc:
        returncode = 0
        stdout = ""
        stderr = "warning: unable to access global ignore"

    monkeypatch.setattr(autorun.subprocess, "run", lambda *args, **kwargs: Proc())

    result = autorun._git_status_short()

    assert result.returncode == 0
    assert result.stdout == ""
    assert result.stderr == "warning: unable to access global ignore"


def test_closure_finality_allows_warning_only_git_status(monkeypatch, capsys) -> None:
    monkeypatch.setattr(
        autorun,
        "_git_status_short",
        lambda: autorun.GitStatusResult(
            returncode=0,
            stdout="",
            stderr="warning: unable to access global ignore",
        ),
    )

    assert autorun._closure_worktree_finality_failures() == 0
    output = capsys.readouterr().out
    assert "Git status diagnostics:" in output
    assert "PASS: worktree is clean" in output


def test_closure_finality_blocks_dirty_stdout(monkeypatch, capsys) -> None:
    monkeypatch.setattr(
        autorun,
        "_git_status_short",
        lambda: autorun.GitStatusResult(returncode=0, stdout=" M file.txt", stderr=""),
    )

    assert autorun._closure_worktree_finality_failures() == 1
    output = capsys.readouterr().out
    assert " M file.txt" in output
    assert "cannot claim CLOSED" in output


def test_closure_finality_blocks_nonzero_git_status(monkeypatch, capsys) -> None:
    monkeypatch.setattr(
        autorun,
        "_git_status_short",
        lambda: autorun.GitStatusResult(
            returncode=128,
            stdout="",
            stderr="fatal: not a git repository",
        ),
    )

    assert autorun._closure_worktree_finality_failures() == 1
    output = capsys.readouterr().out
    assert "Git status diagnostics:" in output
    assert "git status --short failed" in output


# --- AAF-T6A: early diagnostic wire-in of the read-only AAF helper ---

AAF_HELPER_SCRIPT = "governance/compat/run_agent_automation_assist.py"


def _has_aaf_helper(commands) -> bool:
    return any(AAF_HELPER_SCRIPT in command.command for command in commands)


def test_pre_implementation_commands_include_aaf_helper_json_enforce() -> None:
    commands = autorun._pre_implementation_commands("base", "head")

    aaf = [c for c in commands if AAF_HELPER_SCRIPT in c.command]
    assert len(aaf) == 1, "AAF helper must be wired exactly once at pre-implementation"
    command = aaf[0].command
    # AC1: helper runs over the worker range in JSON enforce mode.
    assert command == (
        "python",
        AAF_HELPER_SCRIPT,
        "--base",
        "base",
        "--head",
        "head",
        "--json",
        "--enforce",
    )


def test_aaf_helper_is_read_only_no_mutating_flags() -> None:
    # AC4: the wired command must not introduce any mutate/apply/fix/write or
    # provider/live flag; it stays a read-only advisory invocation.
    commands = autorun._pre_implementation_commands("base", "head")
    aaf = next(c for c in commands if AAF_HELPER_SCRIPT in c.command)
    forbidden = {"--apply", "--fix", "--write", "--mutate", "--patch", "--live", "--provider"}
    assert not (set(aaf.command) & forbidden)


def test_aaf_helper_not_in_all_phase_common_commands() -> None:
    # AC2: the helper is a pre-implementation-only command, not an all-phase
    # common command.
    assert not _has_aaf_helper(autorun._common_commands("base", "head"))
    assert not _has_aaf_helper(autorun.PRE_PUSH_COMMANDS)


def test_forbidden_state_remains_first_pre_implementation_command() -> None:
    commands = autorun._pre_implementation_commands("base", "head")
    assert "governance/compat/check_forbidden_filesystem_state.py" in commands[0].command


def _stub_phase_environment(monkeypatch) -> None:
    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)
    monkeypatch.setattr(autorun, "_write_receipt", lambda *a, **k: None)


def test_pre_implementation_passes_when_aaf_helper_passes(monkeypatch) -> None:
    _stub_phase_environment(monkeypatch)

    def fake_execute(index, command):
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, "")

    monkeypatch.setattr(autorun, "_execute", fake_execute)

    assert autorun._run_phase("pre-implementation", "base", "head") == 0


def test_pre_implementation_fails_when_aaf_helper_fails(monkeypatch) -> None:
    # AC3: a nonzero AAF helper exit propagates to gate failure through the
    # existing command-result aggregation.
    _stub_phase_environment(monkeypatch)

    def fake_execute(index, command):
        failed = AAF_HELPER_SCRIPT in command.command
        return autorun.GateResult(
            index,
            command.name,
            command.command,
            1 if failed else 0,
            0.01,
            "",
        )

    monkeypatch.setattr(autorun, "_execute", fake_execute)

    assert autorun._run_phase("pre-implementation", "base", "head") == 1
