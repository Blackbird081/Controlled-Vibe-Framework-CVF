import json
from pathlib import Path

import pytest

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
        mixed_atomicity_authorized=False,
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
        mixed_atomicity_authorized=False,
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
    context = {
        "phase": "pre-implementation",
        "base": "base",
        "head": "head",
        "baseSha": "abc1234",
        "headSha": "def5678",
        "commandManifestHash": "manifest",
        "worktreeFingerprint": "worktree",
        "verifierIdentityProfile": autorun.VERIFIER_IDENTITY_PROFILE,
    }
    verifier_identity_digest = "a" * 64
    expected = {**context, "verifierIdentityDigest": verifier_identity_digest}
    path.write_text(
        json.dumps(_build_v3_receipt_payload(context, verifier_identity_digest)),
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
        mixed_atomicity_authorized=False,
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


# --- SCEC-T1: semantic convergence checker earliest-applicable gate binding ---


def test_common_commands_include_semantic_convergence_control_checker() -> None:
    commands = autorun._common_commands("base", "head")
    matches = [
        c
        for c in commands
        if any("check_semantic_convergence_control.py" in part for part in c.command)
    ]
    assert len(matches) == 1, "SCEC checker must be bound exactly once in _common_commands"


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


# --- MFRP-H0: autorun receipt v2 and verifier-identity hostile matrix ---


def _write_repo_file(root: Path, relative: str, content: str) -> Path:
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return target


def _fake_interpreter_identity() -> dict:
    return {
        "implementation": "cpython",
        "cacheTag": "cpython-311",
        "version": "3.11.9.final.0",
        "executablePath": "C:/fake/python.exe",
        "executableSha256": "e" * 64,
    }


def _set_snapshot_env(
    monkeypatch,
    tmp_path: Path,
    *,
    tracked: tuple[str, ...],
    untracked: tuple[str, ...] = (),
) -> None:
    monkeypatch.setattr(autorun, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(
        autorun,
        "_git_ls_files",
        lambda args: untracked if "--others" in args else tracked,
    )
    monkeypatch.setattr(autorun, "_interpreter_identity", _fake_interpreter_identity)


def _build_v3_receipt_payload(context, verifier_identity_digest, results=None):
    if results is None:
        results = (
            autorun.GateResult(
                index=1,
                name="sample",
                command=("python", "governance/compat/check_sample.py"),
                returncode=0,
                duration_s=0.1,
                output="",
            ),
        )
    machine_verification = autorun._machine_verification_object(
        context, verifier_identity_digest, results
    )
    return {
        "schema": autorun.RECEIPT_SCHEMA,
        "status": "PASS",
        **context,
        "verifierIdentityDigest": verifier_identity_digest,
        "machineVerification": machine_verification,
        "receiptDigest": autorun._machine_verification_digest(machine_verification),
        "checks": [
            {
                "name": result.name,
                "command": list(result.command),
                "durationSeconds": round(result.duration_s, 3),
                "status": "PASS",
            }
            for result in results
        ],
    }


def test_v3_exact_state_reuse_hit_no_execution(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"

    def fake_execute(index, command):
        raise AssertionError("no command should execute on an exact cache hit")

    monkeypatch.setattr(autorun, "_execute", fake_execute)
    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)

    context = autorun._receipt_context(
        "pre-implementation", "base", "head", "base", "head", commands
    )
    digest = autorun._verifier_identity_digest(commands)
    payload = _build_v3_receipt_payload(context, digest)
    receipt_dir.mkdir(parents=True, exist_ok=True)
    (receipt_dir / "pre-implementation.json").write_text(
        json.dumps(payload), encoding="utf-8"
    )

    monkeypatch.setattr(autorun, "_common_commands", lambda base, head: commands)
    monkeypatch.setattr(autorun, "_pre_implementation_commands", lambda base, head: ())

    result = autorun._run_phase(
        "pre-implementation",
        "base",
        "head",
        reuse_valid_receipt=True,
        receipt_dir=receipt_dir,
    )

    assert result == 0


def test_v1_schema_forces_full_run(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"
    receipt_dir.mkdir(parents=True, exist_ok=True)
    context = autorun._receipt_context(
        "pre-implementation", "base", "head", "base", "head", commands
    )
    digest = autorun._verifier_identity_digest(commands)
    v1_payload = {
        "schema": "cvf.autorun.pass-receipt.v1",
        "status": "PASS",
        **context,
        "verifierIdentityDigest": digest,
    }
    (receipt_dir / "pre-implementation.json").write_text(
        json.dumps(v1_payload), encoding="utf-8"
    )

    valid, reason = autorun._load_valid_receipt(
        receipt_dir / "pre-implementation.json",
        {**context, "verifierIdentityDigest": digest},
    )

    assert not valid
    assert reason == "receipt schema mismatch"


def test_direct_checker_body_drift_same_argv_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('v1')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)
    before_manifest = autorun._command_manifest_hash(commands)

    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('v2')\n")
    after = autorun._verifier_identity_digest(commands)
    after_manifest = autorun._command_manifest_hash(commands)

    assert before_manifest == after_manifest, "argv is unchanged by construction"
    assert before != after


def test_cross_batch_tracked_verifier_drift_outside_path_plan_miss(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('sample')\n")
    _write_repo_file(tmp_path, "governance/compat/check_other.py", "print('other')\n")
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=(
            "governance/compat/check_sample.py",
            "governance/compat/check_other.py",
        ),
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    # check_other.py was modified in a prior batch and is not in commands'
    # argv or in the current change path plan, but is still Git-tracked.
    _write_repo_file(tmp_path, "governance/compat/check_other.py", "print('modified')\n")
    after = autorun._verifier_identity_digest(commands)

    assert before != after


def test_shared_imported_module_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "import shared\n")
    _write_repo_file(tmp_path, "governance/compat/shared_helper.py", "VALUE = 1\n")
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=(
            "governance/compat/check_sample.py",
            "governance/compat/shared_helper.py",
        ),
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    _write_repo_file(tmp_path, "governance/compat/shared_helper.py", "VALUE = 2\n")
    after = autorun._verifier_identity_digest(commands)

    assert before != after


def test_tracked_config_registry_fixture_standard_drift_miss(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _write_repo_file(
        tmp_path,
        "governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json",
        "{\"thresholds\": {}}",
    )
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=(
            "governance/compat/check_sample.py",
            "governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json",
        ),
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    _write_repo_file(
        tmp_path,
        "governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json",
        "{\"thresholds\": {\"general_source\": {}}}",
    )
    after = autorun._verifier_identity_digest(commands)

    assert before != after


def test_untracked_nonignored_shared_input_drift_miss(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _write_repo_file(tmp_path, "governance/compat/fixtures/local.json", "{}")
    monkeypatch.setattr(autorun, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(autorun, "_interpreter_identity", _fake_interpreter_identity)
    monkeypatch.setattr(
        autorun,
        "_git_ls_files",
        lambda args: ("governance/compat/fixtures/local.json",)
        if "--others" in args
        else ("governance/compat/check_sample.py",),
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    _write_repo_file(tmp_path, "governance/compat/fixtures/local.json", "{\"x\": 1}")
    after = autorun._verifier_identity_digest(commands)

    assert before != after


def test_runner_or_catalog_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _write_repo_file(
        tmp_path, "governance/compat/agent_autorun_command_catalog.py", "V = 1\n"
    )
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=(
            "governance/compat/check_sample.py",
            "governance/compat/agent_autorun_command_catalog.py",
        ),
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    _write_repo_file(
        tmp_path, "governance/compat/agent_autorun_command_catalog.py", "V = 2\n"
    )
    after = autorun._verifier_identity_digest(commands)

    assert before != after


def test_interpreter_implementation_version_tag_path_or_bytes_drift_miss(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    before = autorun._verifier_identity_digest(commands)

    for mutated in (
        {**_fake_interpreter_identity(), "implementation": "pypy"},
        {**_fake_interpreter_identity(), "version": "3.11.10.final.0"},
        {**_fake_interpreter_identity(), "cacheTag": "cpython-312"},
        {**_fake_interpreter_identity(), "executablePath": "C:/other/python.exe"},
        {**_fake_interpreter_identity(), "executableSha256": "f" * 64},
    ):
        monkeypatch.setattr(autorun, "_interpreter_identity", lambda m=mutated: m)
        after = autorun._verifier_identity_digest(commands)
        assert before != after


def test_unreadable_or_unstable_input_miss_no_reusable_receipt(
    monkeypatch, tmp_path: Path
) -> None:
    # A path Git tracks as a regular file but that currently resolves to a
    # directory is non-regular/unsafe, not merely "tracked missing" (which
    # the spec treats as a valid stable-marker case). This must make identity
    # construction fail rather than silently narrow the snapshot.
    (tmp_path / "governance" / "compat" / "check_dir_not_file.py").mkdir(
        parents=True, exist_ok=True
    )
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=("governance/compat/check_dir_not_file.py",),
    )
    commands = (
        autorun.GateCommand(
            "dirlike",
            ("python", "governance/compat/check_dir_not_file.py", "--enforce"),
        ),
    )

    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)
    monkeypatch.setattr(autorun, "_common_commands", lambda base, head: commands)
    monkeypatch.setattr(autorun, "_pre_implementation_commands", lambda base, head: ())
    monkeypatch.setattr(
        autorun,
        "_execute",
        lambda index, command: autorun.GateResult(
            index, command.name, command.command, 0, 0.01, ""
        ),
    )

    with pytest.raises(autorun.VerifierIdentityUnavailable):
        autorun._verifier_identity_digest(commands)

    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"
    result = autorun._run_phase(
        "pre-implementation",
        "base",
        "head",
        reuse_valid_receipt=True,
        receipt_dir=receipt_dir,
    )

    assert result == 0
    assert not (receipt_dir / "pre-implementation.json").exists()


def test_missing_direct_command_input_makes_identity_unavailable(
    monkeypatch, tmp_path: Path
) -> None:
    _set_snapshot_env(monkeypatch, tmp_path, tracked=())
    commands = (
        autorun.GateCommand(
            "missing",
            ("python", "governance/compat/missing_check.py", "--enforce"),
        ),
    )

    with pytest.raises(
        autorun.VerifierIdentityUnavailable,
        match="missing repository-relative command input",
    ):
        autorun._verifier_identity_digest(commands)


def test_ignored_direct_command_input_makes_identity_unavailable(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "ignored/check_secret.py", "print('secret')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=(), untracked=())
    commands = (
        autorun.GateCommand(
            "ignored", ("python", "ignored/check_secret.py", "--enforce")
        ),
    )

    with pytest.raises(
        autorun.VerifierIdentityUnavailable,
        match="absent from safe snapshot",
    ):
        autorun._verifier_identity_digest(commands)


def test_mid_bundle_input_drift_pass_but_no_reusable_receipt(
    monkeypatch, tmp_path: Path
) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    monkeypatch.setattr(autorun, "REPO_ROOT", tmp_path)

    call_state = {"count": 0}

    def flaky_ls_files(args):
        if "--others" in args:
            return ()
        call_state["count"] += 1
        if call_state["count"] > 1:
            _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('drift')\n")
        return ("governance/compat/check_sample.py",)

    monkeypatch.setattr(autorun, "_git_ls_files", flaky_ls_files)
    monkeypatch.setattr(autorun, "_interpreter_identity", _fake_interpreter_identity)
    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)
    monkeypatch.setattr(autorun, "_common_commands", lambda base, head: ())
    monkeypatch.setattr(autorun, "_pre_implementation_commands", lambda base, head: ())

    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"
    result = autorun._run_phase(
        "pre-implementation",
        "base",
        "head",
        receipt_dir=receipt_dir,
    )

    assert result == 0
    assert not (receipt_dir / "pre-implementation.json").exists()


def test_path_order_canonicalization_stable(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/b_check.py", "print('b')\n")
    _write_repo_file(tmp_path, "governance/compat/a_check.py", "print('a')\n")
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/a_check.py", "--enforce")
        ),
    )

    monkeypatch.setattr(autorun, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(autorun, "_interpreter_identity", _fake_interpreter_identity)
    monkeypatch.setattr(
        autorun,
        "_git_ls_files",
        lambda args: ()
        if "--others" in args
        else ("governance/compat/b_check.py", "governance/compat/a_check.py"),
    )
    first = autorun._verifier_identity_digest(commands)

    monkeypatch.setattr(
        autorun,
        "_git_ls_files",
        lambda args: ()
        if "--others" in args
        else ("governance/compat/a_check.py", "governance/compat/b_check.py"),
    )
    second = autorun._verifier_identity_digest(commands)

    assert first == second


def test_unicode_jcs_fixed_vector_match() -> None:
    # Independent literal preimage/digest; not derived from the production
    # canonicalizer. See docs/work_orders/CVF_AGENT_WORK_ORDER_MFRP_H0_
    # AUTORUN_RECEIPT_VERIFIER_IDENTITY_HARDENING_2026-09-01.md Canonical
    # Preimage Profile section for the published source of this vector.
    preimage = {
        "digestAlgorithm": "sha256",
        "files": [
            {
                "path": "governance/compat/check_\u03b1.py",
                "sha256": "0" * 64,
            }
        ],
        "interpreter": {
            "cacheTag": "cpython-313",
            "executablePath": "C:/Python313/python.exe",
            "executableSha256": "1" * 64,
            "implementation": "cpython",
            "version": "3.13.7.final.0",
        },
        "profile": "cvf.autorun.verifierIdentity.v1",
    }
    expected_digest = "37730e62eac9a4f900b100c4734aee20311d596fd6426cebea7f6ae8d1a63575"

    produced = autorun._jcs_bytes(preimage)
    actual_digest = __import__("hashlib").sha256(produced).hexdigest()

    assert actual_digest == expected_digest


@pytest.mark.parametrize("unexpected", [None, True, 1, 1.5, ("tuple",)])
def test_restricted_jcs_rejects_unexpected_value_types(unexpected) -> None:
    with pytest.raises(
        autorun.VerifierIdentityUnavailable,
        match="unsupported verifier identity value type",
    ):
        autorun._jcs_bytes({"unexpected": unexpected})


def test_restricted_jcs_rejects_non_unicode_scalar() -> None:
    with pytest.raises(
        autorun.VerifierIdentityUnavailable,
        match="non-I-JSON surrogate",
    ):
        autorun._jcs_bytes({"unexpected": "\ud800"})


def test_interpreter_identity_uses_resolved_executable_path(
    monkeypatch, tmp_path: Path
) -> None:
    executable = _write_repo_file(tmp_path, "bin/python.exe", "fake interpreter\n")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(autorun.sys, "executable", "bin/python.exe")

    identity = autorun._interpreter_identity()

    assert identity["executablePath"] == executable.resolve().as_posix()


def test_no_reuse_flag_always_executes(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"
    context = autorun._receipt_context(
        "pre-implementation", "base", "head", "base", "head", commands
    )
    digest = autorun._verifier_identity_digest(commands)
    receipt_dir.mkdir(parents=True, exist_ok=True)
    (receipt_dir / "pre-implementation.json").write_text(
        json.dumps(
            {
                "schema": autorun.RECEIPT_SCHEMA,
                "status": "PASS",
                **context,
                "verifierIdentityDigest": digest,
            }
        ),
        encoding="utf-8",
    )

    executed = {"count": 0}

    def fake_execute(index, command):
        executed["count"] += 1
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, "")

    monkeypatch.setattr(autorun, "_execute", fake_execute)
    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)
    monkeypatch.setattr(autorun, "_common_commands", lambda base, head: commands)
    monkeypatch.setattr(autorun, "_pre_implementation_commands", lambda base, head: ())

    result = autorun._run_phase(
        "pre-implementation",
        "base",
        "head",
        reuse_valid_receipt=False,
        receipt_dir=receipt_dir,
    )

    assert result == 0
    assert executed["count"] == 1


def test_reuse_disabled_full_bundle_pass_control(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, "governance/compat/check_sample.py", "print('ok')\n")
    _set_snapshot_env(
        monkeypatch, tmp_path, tracked=("governance/compat/check_sample.py",)
    )
    commands = (
        autorun.GateCommand(
            "sample", ("python", "governance/compat/check_sample.py", "--enforce")
        ),
    )
    receipt_dir = tmp_path / ".cvf" / "runtime" / "autorun-receipts"

    monkeypatch.setattr(
        autorun,
        "_execute",
        lambda index, command: autorun.GateResult(
            index, command.name, command.command, 0, 0.01, ""
        ),
    )
    monkeypatch.setattr(autorun, "_git_rev_parse", lambda ref: ref)
    monkeypatch.setattr(autorun, "_common_commands", lambda base, head: commands)
    monkeypatch.setattr(autorun, "_pre_implementation_commands", lambda base, head: ())

    result = autorun._run_phase(
        "pre-implementation",
        "base",
        "head",
        reuse_valid_receipt=False,
        receipt_dir=receipt_dir,
    )

    assert result == 0
    assert (receipt_dir / "pre-implementation.json").exists()


def test_malformed_or_partial_v3_fails_closed(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    expected = {
        "phase": "pre-implementation",
        "baseSha": "abc",
        "headSha": "def",
        "commandManifestHash": "manifest",
        "worktreeFingerprint": "worktree",
        "verifierIdentityProfile": autorun.VERIFIER_IDENTITY_PROFILE,
        "verifierIdentityDigest": "a" * 64,
    }
    # Partial v3: schema and status present, machineVerification omitted.
    path.write_text(
        json.dumps(
            {
                "schema": autorun.RECEIPT_SCHEMA,
                "status": "PASS",
                **{k: v for k, v in expected.items() if k != "verifierIdentityDigest"},
            }
        ),
        encoding="utf-8",
    )

    valid, reason = autorun._load_valid_receipt(path, expected)

    assert not valid
    assert "machineVerification" in reason


def test_secret_safe_miss_reason_no_file_content_or_env_value(
    monkeypatch, tmp_path: Path, capsys
) -> None:
    secret_path = tmp_path / "governance" / "compat" / "check_secret_bearing.py"
    secret_path.parent.mkdir(parents=True, exist_ok=True)
    secret_path.write_text(
        "TOKEN = 'sk-should-never-appear'\n", encoding="utf-8"
    )
    (tmp_path / "governance" / "compat" / "check_dir_not_file.py").mkdir(
        parents=True, exist_ok=True
    )
    _set_snapshot_env(
        monkeypatch,
        tmp_path,
        tracked=(
            "governance/compat/check_secret_bearing.py",
            "governance/compat/check_dir_not_file.py",
        ),
    )
    commands = (
        autorun.GateCommand(
            "secret",
            ("python", "governance/compat/check_secret_bearing.py", "--enforce"),
        ),
    )
    monkeypatch.setenv("SUPER_SECRET_TOKEN", "sk-env-should-never-appear")

    try:
        autorun._verifier_identity_digest(commands)
        raise AssertionError("expected VerifierIdentityUnavailable")
    except autorun.VerifierIdentityUnavailable as exc:
        message = str(exc)

    assert "sk-should-never-appear" not in message
    assert "sk-env-should-never-appear" not in message
    assert "SUPER_SECRET_TOKEN" not in message
