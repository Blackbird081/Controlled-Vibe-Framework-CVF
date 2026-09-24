# Text Encoding Exception: Unicode path fixture verifies repository filename handling.
import json
import hashlib
import sys
import subprocess
from pathlib import Path
import pytest
import governance.compat.run_agent_autorun_workflow_gate as autorun
import governance.compat.run_agent_commit_steward_preflight as steward
import governance.compat.committed_evidence_fingerprint as committed_evidence

RIPA_SCRIPT = 'governance/compat/check_independent_review_probe_admission.py'
ACTIVE_ORDER = 'docs/work_orders/active.md'

def test_active_binding_changes_only_unique_probe_command() -> None:
    broad = autorun._common_commands('base', 'head')
    bound = autorun._common_commands('base', 'head', ACTIVE_ORDER)
    assert len(broad) == len(bound) == 83
    changed = [(a, b) for a, b in zip(broad, bound) if a != b]
    assert len(changed) == 1
    a, b = changed[0]
    assert a.name == b.name == 'independent review probe admission'
    assert a.command == ('python', RIPA_SCRIPT, '--base', 'base', '--head', 'head', '--enforce')
    assert b.command == a.command + ('--changed-lane-only', '--active-work-order', ACTIVE_ORDER)
    assert sum(RIPA_SCRIPT in c.command for c in broad) == 1
    assert all('--changed-lane-only' not in c.command and '--active-work-order' not in c.command for c in broad)
    assert all('--active-work-order' not in c.command for c in autorun.PRE_PUSH_COMMANDS)

@pytest.mark.parametrize('phase', ['pre-dispatch', 'pre-closure', 'pre-push'])
def test_active_binding_rejected_before_any_phase_side_effect(monkeypatch, capsys, phase) -> None:
    def forbidden(*args, **kwargs):
        pytest.fail('forbidden phase reached Git, execution or receipt reuse')
    for name in ('_git_rev_parse', '_run_commands', '_load_valid_receipt'):
        monkeypatch.setattr(autorun, name, forbidden)
    assert autorun._run_phase(phase, 'base', 'head', active_work_order=ACTIVE_ORDER, reuse_valid_receipt=True) == 1
    assert 'pre-implementation only' in capsys.readouterr().out

@pytest.mark.parametrize('binding', ['', '   '])
def test_empty_explicit_binding_fails_closed(binding) -> None:
    assert autorun._run_phase('pre-implementation', 'base', 'head', active_work_order=binding) == 1

def test_main_forwards_exact_binding(monkeypatch) -> None:
    captured = {}
    def record(*args, **kwargs):
        captured.update(kwargs)
        return 7
    monkeypatch.setattr(autorun, '_run_phase', record)
    monkeypatch.setattr(sys, 'argv', ['gate', '--phase', 'pre-implementation', '--active-work-order', ACTIVE_ORDER])
    assert autorun.main() == 7
    assert captured['active_work_order'] == ACTIVE_ORDER

def test_phase_forwards_bound_plan_and_preserves_other_commands(monkeypatch, tmp_path) -> None:
    observed = []
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_worktree_fingerprint', lambda *args: 'fixed')
    monkeypatch.setattr(autorun, '_verifier_identity_digest', lambda *args: 'a' * 64)
    def execute(index, command):
        observed.append(command)
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, '')
    monkeypatch.setattr(autorun, '_execute', execute)
    assert autorun._run_phase('pre-implementation', 'base', 'head', active_work_order=ACTIVE_ORDER, receipt_dir=tmp_path) == 0
    probe = [c.command for c in observed if RIPA_SCRIPT in c.command]
    assert probe == [('python', RIPA_SCRIPT, '--base', 'base', '--head', 'head', '--enforce', '--changed-lane-only', '--active-work-order', ACTIVE_ORDER)]
    assert len(observed) == 85
    assert sum('--active-work-order' in c.command for c in observed) == 1

def test_parallel_bound_probe_findings_visible_without_other_pass_noise(monkeypatch, capsys) -> None:
    commands = (autorun.GateCommand('probe', ('python', RIPA_SCRIPT, '--changed-lane-only', '--active-work-order', ACTIVE_ORDER)),
                autorun.GateCommand('ordinary', ('python', 'other.py')))
    diagnostic = 'Known findings outside the current changed lane: 1\n  (out-of-lane) docs/reviews/parked.md: violation\n'
    def execute(index, command):
        return autorun.GateResult(index, command.name, command.command, 0, .01, diagnostic if command.name == 'probe' else 'ordinary PASS detail')
    monkeypatch.setattr(autorun, '_execute', execute)
    autorun._run_commands(commands, parallel=True, max_workers=2)
    out = capsys.readouterr().out
    assert diagnostic.rstrip() in out
    assert 'ordinary PASS detail' not in out

@pytest.mark.parametrize('target', [None, 'docs/work_orders/different.md'])
def test_binding_change_rejects_receipt_reuse(monkeypatch, tmp_path, target) -> None:
    monkeypatch.setattr(autorun, '_worktree_fingerprint', lambda *args: 'same-worktree')
    plans = [autorun._common_commands('base', 'head', binding) for binding in (ACTIVE_ORDER, target)]
    contexts = [autorun._receipt_context('pre-implementation', 'base', 'head', 'abc', 'def', plan) for plan in plans]
    for plan, context in zip(plans, contexts):
        preimage = json.dumps([{'name': c.name, 'command': list(c.command)} for c in plan], sort_keys=True, separators=(',', ':')).encode()
        assert context['commandManifestHash'] == hashlib.sha256(preimage).hexdigest()
    assert contexts[0]['commandManifestHash'] != contexts[1]['commandManifestHash']
    path = tmp_path / 'receipt.json'
    results = tuple(autorun.GateResult(i, c.name, c.command, 0, .01, '') for i, c in enumerate(plans[0], 1))
    autorun._write_receipt(path, contexts[0], results, 1.0, 'a' * 64)
    assert autorun._load_valid_receipt(path, {**contexts[0], 'verifierIdentityDigest': 'a' * 64})[0]
    valid, reason = autorun._load_valid_receipt(path, {**contexts[1], 'verifierIdentityDigest': 'a' * 64})
    assert not valid and reason == 'receipt commandManifestHash mismatch'

@pytest.fixture
def lane_repo(temp_repo):
    temp_repo.write(ACTIVE_ORDER, '# Order\n\ndocType: work_order\n\nindependentProbeRequired: NOT_APPLICABLE_WITH_REASON: fixture\n\nWorker return path: docs/reviews/current.md\n')
    temp_repo.commit('dispatch fixture')
    temp_repo.write('docs/reviews/parked.md', '# Parked\n\nStatus: COMPLETE_PENDING_REVIEW\n\nindependentProbeDisposition: INVALID\n')
    return temp_repo

def _invoke_real_probe(repo, binding):
    command = next(c.command for c in autorun._common_commands('HEAD', 'HEAD', binding) if RIPA_SCRIPT in c.command)
    # Exercise the real parser and Git lane discovery against a disposable repo.
    code = 'import sys; from pathlib import Path; import governance.compat.check_independent_review_probe_admission as c; c.REPO_ROOT=Path(sys.argv[1]); raise SystemExit(c.main(sys.argv[2:]))'
    return subprocess.run([sys.executable, '-c', code, str(repo.path), *command[2:]], capture_output=True, text=True)

def test_real_probe_rejects_current_untracked_return_and_keeps_parked_diagnostic(lane_repo) -> None:
    lane_repo.write('docs/reviews/current.md', '# Return\n\nStatus: COMPLETE_PENDING_REVIEW\n\nindependentProbeDisposition: INVALID\n')
    failed = _invoke_real_probe(lane_repo, ACTIVE_ORDER)
    assert failed.returncode == 1
    assert '  - docs/reviews/current.md:' in failed.stdout
    assert '(out-of-lane) docs/reviews/parked.md:' in failed.stdout
    assert '?? docs/reviews/current.md' in lane_repo.git('status', '--short', '--untracked-files=all')
    lane_repo.write('docs/reviews/current.md', '# Return\n\nStatus: COMPLETE_PENDING_REVIEW\n\nindependentProbeDisposition: PENDING_REVIEWER_EXECUTION\n')
    passed = _invoke_real_probe(lane_repo, ACTIVE_ORDER)
    assert passed.returncode == 0
    assert '(out-of-lane) docs/reviews/parked.md:' in passed.stdout
    assert _invoke_real_probe(lane_repo, None).returncode == 1

@pytest.mark.parametrize('binding', ['../escape.md', '/absolute.md', 'docs/work_orders/missing.md', 'docs/reviews/parked.md', 'docs/work_orders/ambiguous.md'])
def test_real_probe_rejects_invalid_binding(lane_repo, binding) -> None:
    lane_repo.write('docs/work_orders/ambiguous.md', '# Order\n\ndocType: work_order\n\nWorker return path: docs/reviews/a.md\nWorker return path: docs/reviews/b.md\n')
    result = _invoke_real_probe(lane_repo, binding)
    assert result.returncode == 1
    assert 'binding could not resolve exactly one' in result.stdout

def test_range_shape_preflight_blocks_exact_manifest_session_mix(monkeypatch) -> None:
    plan = steward.PathPlan(changed_paths=('docs/reviews/example.md', 'AGENT_HANDOFF_V19_2026-06-15.md'), material_paths=('docs/reviews/example.md',), protected_session_paths=('AGENT_HANDOFF_V19_2026-06-15.md',), trace_artifact_paths=('docs/reviews/example.md',), mixed_material_and_session=True, mixed_atomicity_authorized=False, exact_manifest_collision_risk=True, handoff_sync_only=False)
    monkeypatch.setattr(autorun.steward, 'build_path_plan', lambda base, head: plan)
    assert autorun._range_shape_preflight('pre-closure', 'base', 'head') == 1

def test_range_shape_preflight_allows_split_material_range(monkeypatch) -> None:
    plan = steward.PathPlan(changed_paths=('docs/reviews/example.md',), material_paths=('docs/reviews/example.md',), protected_session_paths=(), trace_artifact_paths=('docs/reviews/example.md',), mixed_material_and_session=False, mixed_atomicity_authorized=False, exact_manifest_collision_risk=False, handoff_sync_only=False)
    monkeypatch.setattr(autorun.steward, 'build_path_plan', lambda base, head: plan)
    assert autorun._range_shape_preflight('pre-closure', 'base', 'head') == 0

def test_range_shape_preflight_ignores_pre_dispatch(monkeypatch) -> None:
    monkeypatch.setattr(autorun.steward, 'build_path_plan', lambda base, head: (_ for _ in ()).throw(AssertionError('not called')))
    assert autorun._range_shape_preflight('pre-dispatch', 'base', 'head') == 0

def test_command_manifest_hash_changes_with_command() -> None:
    first = (autorun.GateCommand('one', ('python', 'one.py')),)
    second = (autorun.GateCommand('one', ('python', 'two.py')),)
    assert autorun._command_manifest_hash(first) != autorun._command_manifest_hash(second)

def test_valid_receipt_requires_exact_context(tmp_path: Path) -> None:
    path = tmp_path / 'receipt.json'
    context = {'phase': 'pre-implementation', 'base': 'base', 'head': 'head', 'baseSha': 'abc1234', 'headSha': 'def5678', 'commandManifestHash': 'manifest', 'worktreeFingerprint': 'worktree', 'verifierIdentityProfile': autorun.VERIFIER_IDENTITY_PROFILE}
    verifier_identity_digest = 'a' * 64
    expected = {**context, 'verifierIdentityDigest': verifier_identity_digest}
    path.write_text(json.dumps(_build_v3_receipt_payload(context, verifier_identity_digest)), encoding='utf-8')
    assert autorun._load_valid_receipt(path, expected)[0]
    stale = {**expected, 'worktreeFingerprint': 'changed'}
    valid, reason = autorun._load_valid_receipt(path, stale)
    assert not valid
    assert reason == 'receipt worktreeFingerprint mismatch'

def test_malformed_receipt_fails_closed(tmp_path: Path) -> None:
    path = tmp_path / 'receipt.json'
    path.write_text('{not-json', encoding='utf-8')
    valid, reason = autorun._load_valid_receipt(path, {'phase': 'pre-dispatch'})
    assert not valid
    assert reason.startswith('receipt unreadable:')

def test_parallel_runner_retains_all_results_and_failure(monkeypatch) -> None:
    commands = (autorun.GateCommand('pass', ('pass',)), autorun.GateCommand('fail', ('fail',)))

    def fake_execute(index: int, command: autorun.GateCommand) -> autorun.GateResult:
        return autorun.GateResult(index=index, name=command.name, command=command.command, returncode=1 if command.name == 'fail' else 0, duration_s=0.01, output='')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    results = autorun._run_commands(commands, parallel=True, max_workers=2)
    assert [result.name for result in results] == ['pass', 'fail']
    assert [result.returncode for result in results] == [0, 1]

def test_serial_runner_preserves_manifest_order(monkeypatch) -> None:
    observed: list[str] = []
    commands = (autorun.GateCommand('first', ('first',)), autorun.GateCommand('second', ('second',)))

    def fake_execute(index: int, command: autorun.GateCommand) -> autorun.GateResult:
        observed.append(command.name)
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, '')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    autorun._run_commands(commands, parallel=False, max_workers=1)
    assert observed == ['first', 'second']

def test_worktree_fingerprint_changes_with_file_content(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / 'sample.txt'
    target.write_text('one', encoding='utf-8')
    plan = steward.PathPlan(changed_paths=('sample.txt',), material_paths=('sample.txt',), protected_session_paths=(), trace_artifact_paths=(), mixed_material_and_session=False, mixed_atomicity_authorized=False, exact_manifest_collision_risk=False, handoff_sync_only=False)
    monkeypatch.setattr(autorun, 'REPO_ROOT', tmp_path)
    monkeypatch.setattr(autorun.steward, 'build_path_plan', lambda base, head: plan)
    first = autorun._worktree_fingerprint('base', 'head')
    target.write_text('two', encoding='utf-8')
    second = autorun._worktree_fingerprint('base', 'head')
    assert first != second

def test_git_status_short_keeps_stderr_separate(monkeypatch) -> None:

    class Proc:
        returncode = 0
        stdout = ''
        stderr = 'warning: unable to access global ignore'
    monkeypatch.setattr(autorun.subprocess, 'run', lambda *args, **kwargs: Proc())
    result = autorun._git_status_short()
    assert result.returncode == 0
    assert result.stdout == ''
    assert result.stderr == 'warning: unable to access global ignore'

def test_closure_finality_allows_warning_only_git_status(monkeypatch, capsys) -> None:
    monkeypatch.setattr(autorun, '_git_status_short', lambda: autorun.GitStatusResult(returncode=0, stdout='', stderr='warning: unable to access global ignore'))
    assert autorun._closure_worktree_finality_failures() == 0
    output = capsys.readouterr().out
    assert 'Git status diagnostics:' in output
    assert 'PASS: worktree is clean' in output

def test_closure_finality_blocks_dirty_stdout(monkeypatch, capsys) -> None:
    monkeypatch.setattr(autorun, '_git_status_short', lambda: autorun.GitStatusResult(returncode=0, stdout=' M file.txt', stderr=''))
    assert autorun._closure_worktree_finality_failures() == 1
    output = capsys.readouterr().out
    assert ' M file.txt' in output
    assert 'cannot claim CLOSED' in output

def test_closure_finality_blocks_nonzero_git_status(monkeypatch, capsys) -> None:
    monkeypatch.setattr(autorun, '_git_status_short', lambda: autorun.GitStatusResult(returncode=128, stdout='', stderr='fatal: not a git repository'))
    assert autorun._closure_worktree_finality_failures() == 1
    output = capsys.readouterr().out
    assert 'Git status diagnostics:' in output
    assert 'git status --short failed' in output
AAF_HELPER_SCRIPT = 'governance/compat/run_agent_automation_assist.py'

def _has_aaf_helper(commands) -> bool:
    return any((AAF_HELPER_SCRIPT in command.command for command in commands))

def test_pre_implementation_commands_include_aaf_helper_json_enforce() -> None:
    commands = autorun._pre_implementation_commands('base', 'head')
    aaf = [c for c in commands if AAF_HELPER_SCRIPT in c.command]
    assert len(aaf) == 1, 'AAF helper must be wired exactly once at pre-implementation'
    command = aaf[0].command
    assert command == ('python', AAF_HELPER_SCRIPT, '--base', 'base', '--head', 'head', '--json', '--enforce')

def test_aaf_helper_is_read_only_no_mutating_flags() -> None:
    commands = autorun._pre_implementation_commands('base', 'head')
    aaf = next((c for c in commands if AAF_HELPER_SCRIPT in c.command))
    forbidden = {'--apply', '--fix', '--write', '--mutate', '--patch', '--live', '--provider'}
    assert not set(aaf.command) & forbidden

def test_aaf_helper_not_in_all_phase_common_commands() -> None:
    assert not _has_aaf_helper(autorun._common_commands('base', 'head'))
    assert not _has_aaf_helper(autorun.PRE_PUSH_COMMANDS)

def test_forbidden_state_remains_first_pre_implementation_command() -> None:
    commands = autorun._pre_implementation_commands('base', 'head')
    assert 'governance/compat/check_forbidden_filesystem_state.py' in commands[0].command

def _stub_phase_environment(monkeypatch) -> None:
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_write_receipt', lambda *a, **k: None)

def test_pre_implementation_passes_when_aaf_helper_passes(monkeypatch) -> None:
    _stub_phase_environment(monkeypatch)

    def fake_execute(index, command):
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, '')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    assert autorun._run_phase('pre-implementation', 'base', 'head') == 0

def test_common_commands_include_semantic_convergence_control_checker() -> None:
    commands = autorun._common_commands('base', 'head')
    matches = [c for c in commands if any(('check_semantic_convergence_control.py' in part for part in c.command))]
    assert len(matches) == 1, 'SCEC checker must be bound exactly once in _common_commands'

def test_pre_implementation_fails_when_aaf_helper_fails(monkeypatch) -> None:
    _stub_phase_environment(monkeypatch)

    def fake_execute(index, command):
        failed = AAF_HELPER_SCRIPT in command.command
        return autorun.GateResult(index, command.name, command.command, 1 if failed else 0, 0.01, '')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    assert autorun._run_phase('pre-implementation', 'base', 'head') == 1

def _write_repo_file(root: Path, relative: str, content: str) -> Path:
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')
    return target

def _fake_interpreter_identity() -> dict:
    return {'implementation': 'cpython', 'cacheTag': 'cpython-311', 'version': '3.11.9.final.0', 'executablePath': 'C:/fake/python.exe', 'executableSha256': 'e' * 64}

def _set_snapshot_env(monkeypatch, tmp_path: Path, *, tracked: tuple[str, ...], untracked: tuple[str, ...]=()) -> None:
    monkeypatch.setattr(autorun, 'REPO_ROOT', tmp_path)
    monkeypatch.setattr(autorun, '_git_ls_files', lambda args: untracked if '--others' in args else tracked)
    monkeypatch.setattr(autorun, '_interpreter_identity', _fake_interpreter_identity)

def _build_v3_receipt_payload(context, verifier_identity_digest, results=None):
    if results is None:
        results = (autorun.GateResult(index=1, name='sample', command=('python', 'governance/compat/check_sample.py'), returncode=0, duration_s=0.1, output=''),)
    machine_verification = autorun._machine_verification_object(context, verifier_identity_digest, results)
    return {'schema': autorun.RECEIPT_SCHEMA, 'status': 'PASS', **context, 'verifierIdentityDigest': verifier_identity_digest, 'machineVerification': machine_verification, 'receiptDigest': autorun._machine_verification_digest(machine_verification), 'checks': [{'name': result.name, 'command': list(result.command), 'durationSeconds': round(result.duration_s, 3), 'status': 'PASS'} for result in results]}

def test_v3_exact_state_reuse_hit_no_execution(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'

    def fake_execute(index, command):
        raise AssertionError('no command should execute on an exact cache hit')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    context = autorun._receipt_context('pre-implementation', 'base', 'head', 'base', 'head', commands)
    digest = autorun._verifier_identity_digest(commands)
    payload = _build_v3_receipt_payload(context, digest)
    receipt_dir.mkdir(parents=True, exist_ok=True)
    (receipt_dir / 'pre-implementation.json').write_text(json.dumps(payload), encoding='utf-8')
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: commands)
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    result = autorun._run_phase('pre-implementation', 'base', 'head', reuse_valid_receipt=True, receipt_dir=receipt_dir)
    assert result == 0

def test_v1_schema_forces_full_run(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'
    receipt_dir.mkdir(parents=True, exist_ok=True)
    context = autorun._receipt_context('pre-implementation', 'base', 'head', 'base', 'head', commands)
    digest = autorun._verifier_identity_digest(commands)
    v1_payload = {'schema': 'cvf.autorun.pass-receipt.v1', 'status': 'PASS', **context, 'verifierIdentityDigest': digest}
    (receipt_dir / 'pre-implementation.json').write_text(json.dumps(v1_payload), encoding='utf-8')
    valid, reason = autorun._load_valid_receipt(receipt_dir / 'pre-implementation.json', {**context, 'verifierIdentityDigest': digest})
    assert not valid
    assert reason == 'receipt schema mismatch'

def test_direct_checker_body_drift_same_argv_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('v1')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    before_manifest = autorun._command_manifest_hash(commands)
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('v2')\n")
    after = autorun._verifier_identity_digest(commands)
    after_manifest = autorun._command_manifest_hash(commands)
    assert before_manifest == after_manifest, 'argv is unchanged by construction'
    assert before != after

def test_cross_batch_tracked_verifier_drift_outside_path_plan_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('sample')\n")
    _write_repo_file(tmp_path, 'governance/compat/check_other.py', "print('other')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py', 'governance/compat/check_other.py'))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    _write_repo_file(tmp_path, 'governance/compat/check_other.py', "print('modified')\n")
    after = autorun._verifier_identity_digest(commands)
    assert before != after

def test_shared_imported_module_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', 'import shared\n')
    _write_repo_file(tmp_path, 'governance/compat/shared_helper.py', 'VALUE = 1\n')
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py', 'governance/compat/shared_helper.py'))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    _write_repo_file(tmp_path, 'governance/compat/shared_helper.py', 'VALUE = 2\n')
    after = autorun._verifier_identity_digest(commands)
    assert before != after

def test_tracked_config_registry_fixture_standard_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _write_repo_file(tmp_path, 'governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json', '{"thresholds": {}}')
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py', 'governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json'))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    _write_repo_file(tmp_path, 'governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json', '{"thresholds": {"general_source": {}}}')
    after = autorun._verifier_identity_digest(commands)
    assert before != after

def test_untracked_nonignored_shared_input_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _write_repo_file(tmp_path, 'governance/compat/fixtures/local.json', '{}')
    monkeypatch.setattr(autorun, 'REPO_ROOT', tmp_path)
    monkeypatch.setattr(autorun, '_interpreter_identity', _fake_interpreter_identity)
    monkeypatch.setattr(autorun, '_git_ls_files', lambda args: ('governance/compat/fixtures/local.json',) if '--others' in args else ('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    _write_repo_file(tmp_path, 'governance/compat/fixtures/local.json', '{"x": 1}')
    after = autorun._verifier_identity_digest(commands)
    assert before != after

def test_runner_or_catalog_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _write_repo_file(tmp_path, 'governance/compat/agent_autorun_command_catalog.py', 'V = 1\n')
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py', 'governance/compat/agent_autorun_command_catalog.py'))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    _write_repo_file(tmp_path, 'governance/compat/agent_autorun_command_catalog.py', 'V = 2\n')
    after = autorun._verifier_identity_digest(commands)
    assert before != after

def test_interpreter_implementation_version_tag_path_or_bytes_drift_miss(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    before = autorun._verifier_identity_digest(commands)
    for mutated in ({**_fake_interpreter_identity(), 'implementation': 'pypy'}, {**_fake_interpreter_identity(), 'version': '3.11.10.final.0'}, {**_fake_interpreter_identity(), 'cacheTag': 'cpython-312'}, {**_fake_interpreter_identity(), 'executablePath': 'C:/other/python.exe'}, {**_fake_interpreter_identity(), 'executableSha256': 'f' * 64}):
        monkeypatch.setattr(autorun, '_interpreter_identity', lambda m=mutated: m)
        after = autorun._verifier_identity_digest(commands)
        assert before != after

def test_unreadable_or_unstable_input_miss_no_reusable_receipt(monkeypatch, tmp_path: Path) -> None:
    (tmp_path / 'governance' / 'compat' / 'check_dir_not_file.py').mkdir(parents=True, exist_ok=True)
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_dir_not_file.py',))
    commands = (autorun.GateCommand('dirlike', ('python', 'governance/compat/check_dir_not_file.py', '--enforce')),)
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: commands)
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    monkeypatch.setattr(autorun, '_execute', lambda index, command: autorun.GateResult(index, command.name, command.command, 0, 0.01, ''))
    with pytest.raises(autorun.VerifierIdentityUnavailable):
        autorun._verifier_identity_digest(commands)
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'
    result = autorun._run_phase('pre-implementation', 'base', 'head', reuse_valid_receipt=True, receipt_dir=receipt_dir)
    assert result == 0
    assert not (receipt_dir / 'pre-implementation.json').exists()

def test_missing_direct_command_input_makes_identity_unavailable(monkeypatch, tmp_path: Path) -> None:
    _set_snapshot_env(monkeypatch, tmp_path, tracked=())
    commands = (autorun.GateCommand('missing', ('python', 'governance/compat/missing_check.py', '--enforce')),)
    with pytest.raises(autorun.VerifierIdentityUnavailable, match='missing repository-relative command input'):
        autorun._verifier_identity_digest(commands)

def test_ignored_direct_command_input_makes_identity_unavailable(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'ignored/check_secret.py', "print('secret')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=(), untracked=())
    commands = (autorun.GateCommand('ignored', ('python', 'ignored/check_secret.py', '--enforce')),)
    with pytest.raises(autorun.VerifierIdentityUnavailable, match='absent from safe snapshot'):
        autorun._verifier_identity_digest(commands)

def test_mid_bundle_input_drift_pass_but_no_reusable_receipt(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    monkeypatch.setattr(autorun, 'REPO_ROOT', tmp_path)
    call_state = {'count': 0}

    def flaky_ls_files(args):
        if '--others' in args:
            return ()
        call_state['count'] += 1
        if call_state['count'] > 1:
            _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('drift')\n")
        return ('governance/compat/check_sample.py',)
    monkeypatch.setattr(autorun, '_git_ls_files', flaky_ls_files)
    monkeypatch.setattr(autorun, '_interpreter_identity', _fake_interpreter_identity)
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: ())
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'
    result = autorun._run_phase('pre-implementation', 'base', 'head', receipt_dir=receipt_dir)
    assert result == 0
    assert not (receipt_dir / 'pre-implementation.json').exists()

def test_path_order_canonicalization_stable(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/b_check.py', "print('b')\n")
    _write_repo_file(tmp_path, 'governance/compat/a_check.py', "print('a')\n")
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/a_check.py', '--enforce')),)
    monkeypatch.setattr(autorun, 'REPO_ROOT', tmp_path)
    monkeypatch.setattr(autorun, '_interpreter_identity', _fake_interpreter_identity)
    monkeypatch.setattr(autorun, '_git_ls_files', lambda args: () if '--others' in args else ('governance/compat/b_check.py', 'governance/compat/a_check.py'))
    first = autorun._verifier_identity_digest(commands)
    monkeypatch.setattr(autorun, '_git_ls_files', lambda args: () if '--others' in args else ('governance/compat/a_check.py', 'governance/compat/b_check.py'))
    second = autorun._verifier_identity_digest(commands)
    assert first == second

def test_unicode_jcs_fixed_vector_match() -> None:
    preimage = {'digestAlgorithm': 'sha256', 'files': [{'path': 'governance/compat/check_α.py', 'sha256': '0' * 64}], 'interpreter': {'cacheTag': 'cpython-313', 'executablePath': 'C:/Python313/python.exe', 'executableSha256': '1' * 64, 'implementation': 'cpython', 'version': '3.13.7.final.0'}, 'profile': 'cvf.autorun.verifierIdentity.v1'}
    expected_digest = '37730e62eac9a4f900b100c4734aee20311d596fd6426cebea7f6ae8d1a63575'
    produced = autorun._jcs_bytes(preimage)
    actual_digest = __import__('hashlib').sha256(produced).hexdigest()
    assert actual_digest == expected_digest

@pytest.mark.parametrize('unexpected', [None, True, 1, 1.5, ('tuple',)])
def test_restricted_jcs_rejects_unexpected_value_types(unexpected) -> None:
    with pytest.raises(autorun.VerifierIdentityUnavailable, match='unsupported verifier identity value type'):
        autorun._jcs_bytes({'unexpected': unexpected})

def test_restricted_jcs_rejects_non_unicode_scalar() -> None:
    with pytest.raises(autorun.VerifierIdentityUnavailable, match='non-I-JSON surrogate'):
        autorun._jcs_bytes({'unexpected': '\ud800'})

def test_interpreter_identity_uses_resolved_executable_path(monkeypatch, tmp_path: Path) -> None:
    executable = _write_repo_file(tmp_path, 'bin/python.exe', 'fake interpreter\n')
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(autorun.sys, 'executable', 'bin/python.exe')
    identity = autorun._interpreter_identity()
    assert identity['executablePath'] == executable.resolve().as_posix()

def test_no_reuse_flag_always_executes(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'
    context = autorun._receipt_context('pre-implementation', 'base', 'head', 'base', 'head', commands)
    digest = autorun._verifier_identity_digest(commands)
    receipt_dir.mkdir(parents=True, exist_ok=True)
    (receipt_dir / 'pre-implementation.json').write_text(json.dumps({'schema': autorun.RECEIPT_SCHEMA, 'status': 'PASS', **context, 'verifierIdentityDigest': digest}), encoding='utf-8')
    executed = {'count': 0}

    def fake_execute(index, command):
        executed['count'] += 1
        return autorun.GateResult(index, command.name, command.command, 0, 0.01, '')
    monkeypatch.setattr(autorun, '_execute', fake_execute)
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: commands)
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    result = autorun._run_phase('pre-implementation', 'base', 'head', reuse_valid_receipt=False, receipt_dir=receipt_dir)
    assert result == 0
    assert executed['count'] == 1

def test_reuse_disabled_full_bundle_pass_control(monkeypatch, tmp_path: Path) -> None:
    _write_repo_file(tmp_path, 'governance/compat/check_sample.py', "print('ok')\n")
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_sample.py',))
    commands = (autorun.GateCommand('sample', ('python', 'governance/compat/check_sample.py', '--enforce')),)
    receipt_dir = tmp_path / '.cvf' / 'runtime' / 'autorun-receipts'
    monkeypatch.setattr(autorun, '_execute', lambda index, command: autorun.GateResult(index, command.name, command.command, 0, 0.01, ''))
    monkeypatch.setattr(autorun, '_git_rev_parse', lambda ref: ref)
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: commands)
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    result = autorun._run_phase('pre-implementation', 'base', 'head', reuse_valid_receipt=False, receipt_dir=receipt_dir)
    assert result == 0
    assert (receipt_dir / 'pre-implementation.json').exists()

def test_malformed_or_partial_v3_fails_closed(tmp_path: Path) -> None:
    path = tmp_path / 'receipt.json'
    expected = {'phase': 'pre-implementation', 'baseSha': 'abc', 'headSha': 'def', 'commandManifestHash': 'manifest', 'worktreeFingerprint': 'worktree', 'verifierIdentityProfile': autorun.VERIFIER_IDENTITY_PROFILE, 'verifierIdentityDigest': 'a' * 64}
    path.write_text(json.dumps({'schema': autorun.RECEIPT_SCHEMA, 'status': 'PASS', **{k: v for k, v in expected.items() if k != 'verifierIdentityDigest'}}), encoding='utf-8')
    valid, reason = autorun._load_valid_receipt(path, expected)
    assert not valid
    assert 'machineVerification' in reason

def test_secret_safe_miss_reason_no_file_content_or_env_value(monkeypatch, tmp_path: Path, capsys) -> None:
    secret_path = tmp_path / 'governance' / 'compat' / 'check_secret_bearing.py'
    secret_path.parent.mkdir(parents=True, exist_ok=True)
    secret_path.write_text("TOKEN = 'sk-should-never-appear'\n", encoding='utf-8')
    (tmp_path / 'governance' / 'compat' / 'check_dir_not_file.py').mkdir(parents=True, exist_ok=True)
    _set_snapshot_env(monkeypatch, tmp_path, tracked=('governance/compat/check_secret_bearing.py', 'governance/compat/check_dir_not_file.py'))
    commands = (autorun.GateCommand('secret', ('python', 'governance/compat/check_secret_bearing.py', '--enforce')),)
    monkeypatch.setenv('SUPER_SECRET_TOKEN', 'sk-env-should-never-appear')
    try:
        autorun._verifier_identity_digest(commands)
        raise AssertionError('expected VerifierIdentityUnavailable')
    except autorun.VerifierIdentityUnavailable as exc:
        message = str(exc)
    assert 'sk-should-never-appear' not in message
    assert 'sk-env-should-never-appear' not in message
    assert 'SUPER_SECRET_TOKEN' not in message

class _TempRepo:

    def __init__(self, path: Path) -> None:
        self.path = path

    def git(self, *args: str) -> str:
        proc = subprocess.run(['git', *args], cwd=self.path, capture_output=True, text=True)
        assert proc.returncode == 0, f'git {args} failed: {proc.stderr}'
        return proc.stdout.strip()

    def write(self, relative: str, content: str) -> None:
        target = self.path / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding='utf-8')

    def commit(self, message: str) -> str:
        self.git('add', '-A')
        self.git('commit', '-q', '-m', message)
        return self.git('rev-parse', 'HEAD')

@pytest.fixture
def temp_repo(tmp_path: Path) -> _TempRepo:
    repo = _TempRepo(tmp_path / 'repo')
    repo.path.mkdir(parents=True, exist_ok=True)
    repo.git('init', '-q')
    repo.git('config', 'user.email', 'test@example.invalid')
    repo.git('config', 'user.name', 'F1 Test')
    return repo

def _stub_pre_closure_gate(monkeypatch, temp_repo: '_TempRepo', commands=()) -> None:
    """Stub away everything except the committedEvidence binding step itself: gate commands are a real no-op pass, receipt writing is captured (never
actually written), and closure worktree finality is bypassed since these tests never need a genuinely clean tree.
``committed_evidence.resolve_full_sha``/``build_committed_evidence`` default their ``cwd`` parameter to the real repository root at import time (not
call time), so simply patching the module-level ``REPO_ROOT`` attribute after import does not redirect their default argument. These thin wrappers
rebind ``cwd`` explicitly to the temp repo instead of trying to defeat Python's late-bound-default semantics."""
    captured: dict = {}

    def fake_write_receipt(path, context, results, total_duration_s, verifier_identity_digest):
        captured['context'] = context

    def scoped_resolve_full_sha(ref, *, cwd=None):
        return committed_evidence.resolve_full_sha(ref, cwd=temp_repo.path)

    def scoped_build_committed_evidence(base_sha, head_sha, *, cwd=None):
        return committed_evidence.build_committed_evidence(base_sha, head_sha, cwd=temp_repo.path)
    monkeypatch.setattr(autorun, '_common_commands', lambda base, head: commands)
    monkeypatch.setattr(autorun, '_pre_implementation_commands', lambda base, head: ())
    monkeypatch.setattr(autorun, '_write_receipt', fake_write_receipt)
    monkeypatch.setattr(autorun, '_closure_worktree_finality_failures', lambda: 0)
    monkeypatch.setattr(autorun, '_range_shape_preflight', lambda phase, base, head: 0)
    monkeypatch.setattr(autorun.committed_evidence, 'resolve_full_sha', scoped_resolve_full_sha)
    monkeypatch.setattr(autorun.committed_evidence, 'build_committed_evidence', scoped_build_committed_evidence)
    return captured

def test_committed_evidence_bound_for_stable_range(monkeypatch, temp_repo: _TempRepo) -> None:
    """Control case: an ordinary two-commit range with no ref movement and no evidence drift must still bind committedEvidence exactly as before this rework."""
    temp_repo.write('a.txt', 'one')
    base = temp_repo.commit('A')
    temp_repo.write('a.txt', 'two')
    head = temp_repo.commit('B')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' in captured['context']
    evidence = captured['context']['committedEvidence']
    assert evidence['baseSha'] == base
    assert evidence['headSha'] == head

def test_committed_evidence_withheld_when_head_ref_moves_after_gate_run(monkeypatch, temp_repo: _TempRepo) -> None:
    """F1: if the ref named by ``head`` moves to a different commit between the pre-run short-SHA capture and the post-run committedEvidence resolution (e.g.
a concurrent commit lands on a mutable branch ref), the just-run gate commands can no longer be trusted to have verified that new target. No binding
must be produced -- not a binding for the stale target, not a binding for the moved target."""
    temp_repo.write('a.txt', 'one')
    base = temp_repo.commit('A')
    temp_repo.write('a.txt', 'two')
    temp_repo.commit('B')
    branch = temp_repo.git('branch', '--show-current')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    real_resolve_full_sha = committed_evidence.resolve_full_sha

    def moving_ref_resolve_full_sha(ref, *, cwd=None):
        if ref == branch:
            temp_repo.write('a.txt', 'three (concurrent, unverified)')
            temp_repo.commit('concurrent C')
        return real_resolve_full_sha(ref, cwd=temp_repo.path)
    monkeypatch.setattr(autorun.committed_evidence, 'resolve_full_sha', moving_ref_resolve_full_sha)
    result = autorun._run_phase('pre-closure', base, branch)
    assert result == 0
    assert 'committedEvidence' not in captured['context']

def test_committed_evidence_withheld_when_evidence_path_content_changes_after_gate_run(monkeypatch, temp_repo: _TempRepo) -> None:
    """F1: even when base/head SHAs resolve identically before and after the gate run, if the content the gate actually verified (captured in the run's own
worktree fingerprint) no longer matches what a fresh reconstruction over the same range would see, that is a semantic change to the historical target
-- not mere continuity -- and no committedEvidence binding may be produced for it."""
    temp_repo.write('a.txt', 'one')
    base = temp_repo.commit('A')
    temp_repo.write('a.txt', 'two')
    head = temp_repo.commit('B')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    real_worktree_fingerprint = autorun._worktree_fingerprint
    call_count = {'n': 0}

    def drifting_fingerprint(base_ref: str, head_ref: str) -> str:
        call_count['n'] += 1
        if call_count['n'] == 1:
            return real_worktree_fingerprint(base_ref, head_ref)
        return 'deliberately-drifted-fingerprint'
    monkeypatch.setattr(autorun, '_worktree_fingerprint', drifting_fingerprint)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' not in captured['context']

def test_committed_evidence_bound_for_continuity_only_later_head(monkeypatch, temp_repo: _TempRepo) -> None:
    """A later continuity-only commit (touching only a path outside the material range under test) must remain supportable: running pre-closure against the
original material base/head range still produces a binding, proving this rework does not collapse the continuity case together with genuine
evidence-path drift."""
    temp_repo.write('a.txt', 'one')
    base = temp_repo.commit('A')
    temp_repo.write('a.txt', 'two')
    head = temp_repo.commit('B')
    temp_repo.write('CONTINUITY.md', 'session sync only')
    temp_repo.commit('continuity')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' in captured['context']

def test_committed_evidence_withheld_for_historical_target_semantic_drift(monkeypatch, temp_repo: _TempRepo) -> None:
    """F1 (rework-2): the exact Local-review counterexample reproduced through the real producer entry point, not just the shared helper in isolation. A:
base. B: target changes evidence.txt. C: a further commit changes evidence.txt's content again (semantic drift). Worktree is clean and stable at C for
the whole run. Requesting ``_run_phase("pre-closure", base=A, head=B)`` must NOT bind committedEvidence: the worktree the gate commands actually read
(at C) does not match B's own committed blob for evidence.txt, even though the worktree never moves during this run (the pure before/after stability
check the original rework relied on would incorrectly pass this case)."""
    temp_repo.write('evidence.txt', 'base content')
    base = temp_repo.commit('A')
    temp_repo.write('evidence.txt', 'target content for B')
    head = temp_repo.commit('B')
    temp_repo.write('evidence.txt', 'drifted content at C -- semantic change')
    temp_repo.commit('C')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' not in captured['context'], 'worktree at C must not be certified as historical target B; this is the exact reviewer-supplied counterexample'

def test_committed_evidence_bound_for_historical_target_with_continuity_only_head_c(monkeypatch, temp_repo: _TempRepo) -> None:
    """Companion positive case to the counterexample above: C touches only an unrelated continuity path, not evidence.txt. Admission for A..B must still
succeed, proving the historical-target check does not over-reject the legitimate continuity case alongside the genuine drift case."""
    temp_repo.write('evidence.txt', 'base content')
    base = temp_repo.commit('A')
    temp_repo.write('evidence.txt', 'target content for B')
    head = temp_repo.commit('B')
    temp_repo.write('CONTINUITY.md', 'session sync only, unrelated to evidence.txt')
    temp_repo.commit('continuity-only C')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' in captured['context']
    evidence = captured['context']['committedEvidence']
    assert evidence['baseSha'] == base
    assert evidence['headSha'] == head

def test_committed_evidence_bound_with_crlf_checkout_representation(monkeypatch, temp_repo: _TempRepo) -> None:
    """The historical-target admission check must remain CRLF/line-ending tolerant: a worktree file checked out with core.autocrlf-converted CRLF bytes,
differing only in checkout representation from the committed LF blob, must still admit -- this is Git's own clean-filter equivalence (git
hash-object), not a hand-rolled normalization."""
    temp_repo.git('config', 'core.autocrlf', 'true')
    temp_repo.write('evidence.txt', 'line1\r\nline2\r\n')
    base = temp_repo.commit('A')
    temp_repo.write('evidence.txt', 'line1\r\nline2\r\nline3\r\n')
    head = temp_repo.commit('B')
    monkeypatch.setattr(autorun, 'REPO_ROOT', temp_repo.path)
    captured = _stub_pre_closure_gate(monkeypatch, temp_repo)
    result = autorun._run_phase('pre-closure', base, head)
    assert result == 0
    assert 'committedEvidence' in captured['context']
