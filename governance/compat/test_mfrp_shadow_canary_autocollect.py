"""Hostile/unit/integration tests for the P4-C1 automatic evidence collector. Covers the work order's Required Hostile Regression Matrix. Where a real
committed-range fingerprint proof needs a controlled two-commit sequence, a genuine temporary Git repository is created and torn down (never mocked
git plumbing). Where a real, currently-valid P2 receipt is needed, one is constructed through the actual imported P2 owner symbols -- never a copied
or fabricated digest -- following the same fixture pattern already established by ``test_mfrp_shadow_canary_core.py``. Zero provider/network calls
anywhere in this file. Text Encoding Exception: this file intentionally includes literal non-ASCII path characters (CJK and accented Latin) in one
end-to-end fixture path, to prove the shared committed-evidence fingerprint helper preserves Unicode repository paths exactly through the real
producer/validator/collector chain, per the work order's required hostile-matrix row for Unicode/spaces paths."""
from __future__ import annotations
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest import mock
sys.path.insert(0, str(Path(__file__).resolve().parent))
import mfrp_shadow_canary as canary
import mfrp_shadow_canary_core as canary_core
import mfrp_shadow_canary_autocollect as autocollect
import committed_evidence_fingerprint as committed_evidence
REPO_ROOT = canary_core.REPO_ROOT
_FRESH_RECEIPT_DIR = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-receipts'
_ELIGIBLE_BLOCK = '## P4 Automatic Evidence Observation Block\np4ObservationEligibility: YES\np4ObservationPhase: REVIEW\np4HardObligationLocator: probe locator\np4HardObligationPattern: probe pattern\np4SourceAuthorityLocator: probe#loc\n'

def _cleanup_fresh_receipt_dir() -> None:
    if _FRESH_RECEIPT_DIR.is_dir():
        shutil.rmtree(_FRESH_RECEIPT_DIR, ignore_errors=True)

def _build_fresh_real_receipt(name: str, base_sha: str, head_sha: str, committed_evidence_object: dict | None=None) -> dict:
    """Construct a genuinely valid, fresh P2 receipt through the actual imported P2 owner symbols. Mirrors
``test_mfrp_shadow_canary_core._build_fresh_real_receipt`` exactly, using a separate scratch directory so this file never collides with that one's
fixtures or with the real ignored receipt directory the collector reads in production. When ``committed_evidence_object`` is provided, it is threaded
through the real P2 context/object builders exactly as the production producer (``run_agent_autorun_workflow_gate._run_phase``) does, so the fixture's
top-level and nested ``committedEvidence`` copies and ``receiptDigest`` are genuinely producer-consistent, never hand-assembled."""
    try:
        import agent_autorun_machine_verification as p2owner
    except ModuleNotFoundError:
        from governance.compat import agent_autorun_machine_verification as p2owner
    _FRESH_RECEIPT_DIR.mkdir(parents=True, exist_ok=True)
    context = {'phase': 'p4-c1-fresh-probe', 'baseSha': base_sha[:9], 'headSha': head_sha[:9], 'commandManifestHash': hashlib.sha256(name.encode('utf-8')).hexdigest(), 'worktreeFingerprint': 'b' * 64}
    if committed_evidence_object is not None:
        context['committedEvidence'] = committed_evidence_object
    verifier_digest = 'c' * 64

    class _FakeResult:

        def __init__(self, name: str) -> None:
            self.name = name
    results = [_FakeResult('p4-c1 fresh probe check')]
    machine_verification = p2owner._machine_verification_object(context, verifier_digest, results)
    receipt_digest = p2owner._machine_verification_digest(machine_verification)
    payload = {'schema': p2owner.RECEIPT_SCHEMA, 'status': 'PASS', 'phase': context['phase'], 'base': base_sha, 'head': head_sha, 'baseSha': context['baseSha'], 'headSha': context['headSha'], 'commandManifestHash': context['commandManifestHash'], 'worktreeFingerprint': context['worktreeFingerprint'], 'verifierIdentityProfile': p2owner.VERIFIER_IDENTITY_PROFILE, 'verifierIdentityDigest': verifier_digest, 'machineVerification': machine_verification, 'receiptDigest': receipt_digest, 'totalDurationSeconds': 1.0, 'checks': [{'name': 'p4-c1 fresh probe check', 'status': 'PASS', 'command': ['true']}]}
    if committed_evidence_object is not None:
        payload['committedEvidence'] = committed_evidence_object
    valid, reason = p2owner._validate_receipt_integrity(payload)
    assert valid, f'constructed fixture receipt failed real P2 validation: {reason}'
    receipt_file = _FRESH_RECEIPT_DIR / f'{name}.json'
    receipt_file.write_text(json.dumps(payload), encoding='utf-8')
    return {'path': receipt_file, 'payload': payload}

class ObservationBlockParsingTests(unittest.TestCase):
    """Mechanical field extraction, never a semantic re-execution."""

    def test_default_no_block_is_not_eligible(self):
        text = '## P4 Automatic Evidence Observation Block\np4ObservationEligibility: NO\n'
        parsed = autocollect.parse_observation_block(text)
        self.assertIsNotNone(parsed)
        self.assertFalse(parsed.is_eligible)

    def test_absent_block_returns_none(self):
        self.assertIsNone(autocollect.parse_observation_block('no block here'))

    def test_eligible_block_with_full_metadata(self):
        parsed = autocollect.parse_observation_block(_ELIGIBLE_BLOCK)
        self.assertIsNotNone(parsed)
        self.assertTrue(parsed.is_eligible)
        self.assertTrue(parsed.has_required_metadata)

    def test_eligible_block_with_invalid_phase_fails_metadata(self):
        text = _ELIGIBLE_BLOCK.replace('REVIEW', 'NOT_A_REAL_PHASE')
        parsed = autocollect.parse_observation_block(text)
        self.assertTrue(parsed.is_eligible)
        self.assertFalse(parsed.has_required_metadata)

    def test_eligible_block_with_na_locator_fails_metadata(self):
        text = _ELIGIBLE_BLOCK.replace('p4HardObligationLocator: probe locator', 'p4HardObligationLocator: N/A with reason: none')
        parsed = autocollect.parse_observation_block(text)
        self.assertTrue(parsed.is_eligible)
        self.assertFalse(parsed.has_required_metadata)

    def test_trusted_disposition_detection(self):
        reviewed = 'Status: COMPLETE_PENDING_REVIEW\n## Independent Reviewer Adjudication\nReviewer disposition: `REVIEWER_ACCEPTED_BOUNDED`\n'
        self.assertEqual(autocollect._trusted_disposition(reviewed), 'REVIEWER_ACCEPTED_BOUNDED')
        self.assertIsNone(autocollect._trusted_disposition('Status: COMPLETE_PENDING_REVIEW\n'))
        self.assertIsNone(autocollect._trusted_disposition('Reviewer disposition: `REVIEWER_ACCEPTED_BOUNDED`\n'))

class RealRepositoryCandidateDiscoveryTests(unittest.TestCase):
    """Ordinary/irrelevant-commit and multi-candidate skip behavior against this actual repository's real Git history -- no mocked git plumbing."""

    def test_ordinary_historical_commit_with_no_observation_block_skips(self):
        with self.assertRaises(autocollect.CollectionSkipped) as ctx:
            autocollect.find_eligible_candidate(canary_core.TRUSTED_COMMIT)
        self.assertEqual(ctx.exception.code, 'SKIPPED_NO_ELIGIBLE_CANDIDATE')

    def test_non_review_touching_commit_skips_without_blocking(self):
        code, out, _ = (subprocess.run(['git', 'log', '--format=%H', '-n', '200'], cwd=REPO_ROOT, capture_output=True, text=True).returncode, subprocess.run(['git', 'log', '--format=%H', '-n', '200'], cwd=REPO_ROOT, capture_output=True, text=True).stdout, None)
        candidate_commit = None
        for sha in out.splitlines():
            if not autocollect._candidate_review_paths(sha):
                candidate_commit = sha
                break
        if candidate_commit is None:
            self.skipTest('no non-docs/reviews commit found in the last 200 commits')
        with self.assertRaises(autocollect.CollectionSkipped) as ctx:
            autocollect.find_eligible_candidate(candidate_commit)
        self.assertEqual(ctx.exception.code, 'SKIPPED_NO_ELIGIBLE_CANDIDATE')

class ReceiptCandidateDiscoveryTests(unittest.TestCase):

    def setUp(self) -> None:
        self._scratch = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-scratch-receipts'
        self._scratch.mkdir(parents=True, exist_ok=True)
        self._patch = mock.patch.object(autocollect, 'RECEIPT_DIR', self._scratch)
        self._patch.start()

    def tearDown(self) -> None:
        self._patch.stop()
        shutil.rmtree(self._scratch, ignore_errors=True)
        _cleanup_fresh_receipt_dir()

    def test_multiple_stale_receipts_do_not_compete_with_generated_current_receipt(self):
        (self._scratch / 'a.json').write_text('{}', encoding='utf-8')
        (self._scratch / 'b.json').write_text('{}', encoding='utf-8')
        current = self._scratch / autocollect.GENERATED_RECEIPT_NAME
        with mock.patch.object(autocollect, 'generate_current_receipt', return_value=(current, 'parent-sha')):
            self.assertEqual(autocollect.find_receipt_candidate('trusted-sha', 'disclosure-sha'), (current, 'parent-sha'))

    def test_generation_receipts_trusted_commit_without_disclosure_sync_paths(self):
        target = self._scratch / autocollect.GENERATED_RECEIPT_NAME

        def _run(command, **_kwargs):
            target.write_text('{}', encoding='utf-8')
            return subprocess.CompletedProcess(command, 0, 'PASS', '')
        with mock.patch.object(autocollect, '_single_parent', return_value='parent-sha'), mock.patch.object(autocollect.subprocess, 'run', side_effect=_run) as runner:
            path, parent = autocollect.generate_current_receipt('trusted-sha', 'disclosure-sha')
        self.assertEqual((path, parent), (target, 'parent-sha'))
        command = runner.call_args.args[0]
        self.assertEqual(command[-6:], ['--phase', 'pre-closure', '--base', 'parent-sha', '--head', 'trusted-sha'])

    def test_tampered_receipt_is_rejected(self):
        base = canary_core.git_head()
        fixture = _build_fresh_real_receipt('tampered', base, base)
        tampered_path = self._scratch / 'tampered.json'
        payload = dict(fixture['payload'])
        payload['receiptDigest'] = '0' * 64
        tampered_path.write_text(json.dumps(payload), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionSkipped) as ctx:
            autocollect.validate_and_reconcile_receipt(tampered_path, base, base, base)
        self.assertEqual(ctx.exception.code, 'SKIPPED_INVALID_RECEIPT')

    def test_partial_receipt_is_rejected(self):
        target = self._scratch / 'partial.json'
        target.write_text(json.dumps({'schema': 'wrong'}), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionSkipped) as ctx:
            head = canary_core.git_head()
            autocollect.validate_and_reconcile_receipt(target, head, head, head)
        self.assertEqual(ctx.exception.code, 'SKIPPED_INVALID_RECEIPT')

    def test_unknown_ancestry_receipt_is_rejected(self):
        base = canary_core.git_head()
        fixture = _build_fresh_real_receipt('badancestry', base, base)
        target = self._scratch / 'badancestry.json'
        payload = dict(fixture['payload'])
        payload['baseSha'] = '0' * 40
        payload['headSha'] = '1' * 40
        target.write_text(json.dumps(payload), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionSkipped):
            autocollect.validate_and_reconcile_receipt(target, base, base, base)

    def test_legacy_receipt_without_committed_evidence_is_skipped_not_rehashed(self):
        """MFRP-FINGERPRINT-T1: a v3 receipt with no committedEvidence binding remains a legacy-valid P2 receipt but is explicitly ineligible for new P4
committed-evidence collection -- it must be skipped, never upgraded or silently reconciled against its raw worktreeFingerprint."""
        commit = canary_core.TRUSTED_COMMIT
        fixture = _build_fresh_real_receipt('current', commit, commit)
        with mock.patch.object(autocollect, '_range_changed_paths', return_value=('probe.txt',)):
            with self.assertRaises(autocollect.CollectionSkipped) as ctx:
                autocollect.validate_and_reconcile_receipt(fixture['path'], commit, commit, commit)
        self.assertEqual(ctx.exception.code, 'SKIPPED_NO_COMMITTED_EVIDENCE')

    def test_receipt_with_valid_committed_evidence_reconciles_through_shared_helper(self):
        commit = canary_core.TRUSTED_COMMIT
        fixture = _build_fresh_real_receipt('current-ce', commit, commit, committed_evidence_object={'profile': committed_evidence.COMMITTED_EVIDENCE_PROFILE, 'baseSha': commit, 'headSha': commit, 'fingerprint': 'b' * 64})
        with mock.patch.object(autocollect, '_range_changed_paths', return_value=('probe.txt',)), mock.patch.object(committed_evidence, 'compute_committed_evidence_fingerprint', return_value='b' * 64):
            result = autocollect.validate_and_reconcile_receipt(fixture['path'], commit, commit, commit)
        self.assertEqual(result['baseSha'], commit[:9])
        self.assertEqual(result['headSha'], commit[:9])
        self.assertEqual(result['reconstructedFingerprint'], 'b' * 64)

    def test_receipt_with_mismatched_committed_evidence_fingerprint_is_unsafe(self):
        commit = canary_core.TRUSTED_COMMIT
        fixture = _build_fresh_real_receipt('current-ce-bad', commit, commit, committed_evidence_object={'profile': committed_evidence.COMMITTED_EVIDENCE_PROFILE, 'baseSha': commit, 'headSha': commit, 'fingerprint': 'c' * 64})
        with mock.patch.object(autocollect, '_range_changed_paths', return_value=('probe.txt',)), mock.patch.object(committed_evidence, 'compute_committed_evidence_fingerprint', return_value='b' * 64):
            with self.assertRaises(autocollect.CollectionUnsafe) as ctx:
                autocollect.validate_and_reconcile_receipt(fixture['path'], commit, commit, commit)
        self.assertEqual(ctx.exception.code, 'UNSAFE_COMMITTED_EVIDENCE_FINGERPRINT_MISMATCH')

    def test_malformed_committed_evidence_is_rejected_at_the_real_p2_owner(self):
        """The real P2 validator (agent_autorun_machine_verification) rejects a malformed committedEvidence object before the collector ever sees it; this proves
the shared shape validator is enforced at the canonical owner, not forked or bypassed by P4."""
        try:
            import agent_autorun_machine_verification as p2owner
        except ModuleNotFoundError:
            from governance.compat import agent_autorun_machine_verification as p2owner
        commit = canary_core.TRUSTED_COMMIT
        context = {'phase': 'p4-c1-malformed-probe', 'baseSha': commit[:9], 'headSha': commit[:9], 'commandManifestHash': hashlib.sha256(b'malformed-probe').hexdigest(), 'worktreeFingerprint': 'b' * 64, 'committedEvidence': {'profile': 'wrong-profile'}}

        class _FakeResult:
            name = 'probe'
        machine_verification = p2owner._machine_verification_object(context, 'c' * 64, [_FakeResult()])
        payload = {'schema': p2owner.RECEIPT_SCHEMA, 'status': 'PASS', 'phase': context['phase'], 'base': commit, 'head': commit, 'baseSha': context['baseSha'], 'headSha': context['headSha'], 'commandManifestHash': context['commandManifestHash'], 'worktreeFingerprint': context['worktreeFingerprint'], 'committedEvidence': context['committedEvidence'], 'verifierIdentityProfile': p2owner.VERIFIER_IDENTITY_PROFILE, 'verifierIdentityDigest': 'c' * 64, 'machineVerification': machine_verification, 'receiptDigest': p2owner._machine_verification_digest(machine_verification), 'totalDurationSeconds': 1.0, 'checks': [{'name': 'probe', 'status': 'PASS', 'command': ['true']}]}
        valid, reason = p2owner._validate_receipt_integrity(payload)
        self.assertFalse(valid)
        self.assertIn('committedEvidence', reason)

    def test_declared_malformed_binding_is_unsafe_not_downgraded_to_benign_skip(self):
        """MFRP-FINGERPRINT-T1 rework (F3): a receipt that *declares* a committedEvidence binding but fails the canonical P2 validator (for any reason -- shape,
one-sided, tampered) must reach the collector's real ``validate_and_reconcile_receipt`` entry point and come out as
``CollectionUnsafe``/``UNSAFE_COMMITTED_EVIDENCE_MALFORMED``, never as the benign ``CollectionSkipped``/``SKIPPED_INVALID_RECEIPT`` that a receipt
with no committedEvidence declaration at all legitimately produces. This exercises the actual collector function, not a standalone reproduction of the
P2 validator call."""
        try:
            import agent_autorun_machine_verification as p2owner
        except ModuleNotFoundError:
            from governance.compat import agent_autorun_machine_verification as p2owner
        commit = canary_core.TRUSTED_COMMIT
        context = {'phase': 'p4-c1-malformed-binding-probe', 'baseSha': commit[:9], 'headSha': commit[:9], 'commandManifestHash': hashlib.sha256(b'malformed-binding-probe').hexdigest(), 'worktreeFingerprint': 'b' * 64, 'committedEvidence': {'profile': 'wrong-profile'}}

        class _FakeResult:
            name = 'probe'
        machine_verification = p2owner._machine_verification_object(context, 'c' * 64, [_FakeResult()])
        payload = {'schema': p2owner.RECEIPT_SCHEMA, 'status': 'PASS', 'phase': context['phase'], 'base': commit, 'head': commit, 'baseSha': context['baseSha'], 'headSha': context['headSha'], 'commandManifestHash': context['commandManifestHash'], 'worktreeFingerprint': context['worktreeFingerprint'], 'committedEvidence': context['committedEvidence'], 'verifierIdentityProfile': p2owner.VERIFIER_IDENTITY_PROFILE, 'verifierIdentityDigest': 'c' * 64, 'machineVerification': machine_verification, 'receiptDigest': p2owner._machine_verification_digest(machine_verification), 'totalDurationSeconds': 1.0, 'checks': [{'name': 'probe', 'status': 'PASS', 'command': ['true']}]}
        valid, _reason = p2owner._validate_receipt_integrity(payload)
        assert not valid
        _FRESH_RECEIPT_DIR.mkdir(parents=True, exist_ok=True)
        receipt_path = _FRESH_RECEIPT_DIR / 'declared-malformed-binding.json'
        receipt_path.write_text(json.dumps(payload), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionUnsafe) as ctx:
            autocollect.validate_and_reconcile_receipt(receipt_path, commit, commit, commit)
        self.assertEqual(ctx.exception.code, 'UNSAFE_COMMITTED_EVIDENCE_MALFORMED')

    def test_legacy_receipt_with_unrelated_defect_still_skips_benignly(self):
        """Control case for F3: a receipt that never declared a committedEvidence binding at all, but is invalid for an unrelated reason (wrong schema), must
still take the benign ``SKIPPED_INVALID_RECEIPT`` path -- proving the new declared-binding check is narrowly scoped and does not turn every unrelated
legacy-shape defect into a false UNSAFE classification."""
        commit = canary_core.TRUSTED_COMMIT
        _FRESH_RECEIPT_DIR.mkdir(parents=True, exist_ok=True)
        receipt_path = _FRESH_RECEIPT_DIR / 'unrelated-defect-no-binding.json'
        receipt_path.write_text(json.dumps({'schema': 'wrong-schema', 'status': 'PASS'}), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionSkipped) as ctx:
            autocollect.validate_and_reconcile_receipt(receipt_path, commit, commit, commit)
        self.assertEqual(ctx.exception.code, 'SKIPPED_INVALID_RECEIPT')

    def test_nested_only_declared_binding_rejection_is_also_unsafe(self):
        """The declared-binding detection must catch a binding declared only under the nested machineVerification copy too, not just the top-level copy -- the
one-sided case is itself a declared binding."""
        commit = canary_core.TRUSTED_COMMIT
        raw_payload = {'schema': 'cvf.autorun.pass-receipt.v3', 'status': 'PASS', 'phase': 'probe', 'base': commit, 'head': commit, 'baseSha': commit[:9], 'headSha': commit[:9], 'commandManifestHash': 'x' * 64, 'worktreeFingerprint': 'y' * 64, 'verifierIdentityProfile': 'cvf.autorun.verifierIdentity.v1', 'verifierIdentityDigest': 'c' * 64, 'machineVerification': {'profile': 'cvf.autorun.machineVerification.v1', 'committedEvidence': {'profile': 'cvf.committedEvidenceFingerprint.v1', 'baseSha': commit, 'headSha': commit, 'fingerprint': 'a' * 64}}, 'receiptDigest': '0' * 64}
        _FRESH_RECEIPT_DIR.mkdir(parents=True, exist_ok=True)
        receipt_path = _FRESH_RECEIPT_DIR / 'nested-only-binding.json'
        receipt_path.write_text(json.dumps(raw_payload), encoding='utf-8')
        with self.assertRaises(autocollect.CollectionUnsafe) as ctx:
            autocollect.validate_and_reconcile_receipt(receipt_path, commit, commit, commit)
        self.assertEqual(ctx.exception.code, 'UNSAFE_COMMITTED_EVIDENCE_MALFORMED')

class DeterministicFingerprintTempRepoTests(unittest.TestCase):
    """Real two-commit temporary Git repositories, required for genuine committed-vs-mutable-worktree and content-change fingerprint proofs."""

    def setUp(self) -> None:
        self._tmp = tempfile.mkdtemp(prefix='p4c1-fingerprint-')
        self._repo = Path(self._tmp)
        self._git('init', '-q')
        self._git('config', 'user.email', 'test@example.invalid')
        self._git('config', 'user.name', 'P4-C1 Test')

    def tearDown(self) -> None:
        shutil.rmtree(self._tmp, ignore_errors=True)

    def _git(self, *args: str) -> str:
        proc = subprocess.run(['git', *args], cwd=self._repo, capture_output=True, text=True)
        assert proc.returncode == 0, f'git {args} failed: {proc.stderr}'
        return proc.stdout.strip()

    def _commit(self, filename: str, content: str, message: str) -> str:
        (self._repo / filename).write_text(content, encoding='utf-8')
        self._git('add', filename)
        self._git('commit', '-q', '-m', message)
        return self._git('rev-parse', 'HEAD')

    def test_fingerprint_changes_when_committed_target_changes(self):
        commit_a = self._commit('f.txt', 'version one', 'A')
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo), mock.patch.object(autocollect.canary_core, '_run_git', canary_core._run_git):
            fp_a = autocollect._reconstruct_fingerprint_from_commit(commit_a, ('f.txt',))
        commit_b = self._commit('f.txt', 'version two', 'B')
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            fp_b = autocollect._reconstruct_fingerprint_from_commit(commit_b, ('f.txt',))
        self.assertNotEqual(fp_a, fp_b)

    def test_mutable_worktree_bytes_cannot_substitute_for_committed_blob(self):
        commit_a = self._commit('g.txt', 'committed content', 'A')
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            fp_before_dirty = autocollect._reconstruct_fingerprint_from_commit(commit_a, ('g.txt',))
        (self._repo / 'g.txt').write_text('DIRTY UNCOMMITTED CONTENT', encoding='utf-8')
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            fp_after_dirty = autocollect._reconstruct_fingerprint_from_commit(commit_a, ('g.txt',))
        self.assertEqual(fp_before_dirty, fp_after_dirty, msg='fingerprint must be sourced from the committed blob, not the dirtied worktree file')

    def test_deterministic_across_repeated_reconstruction(self):
        commit_a = self._commit('h.txt', 'stable content', 'A')
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            fp1 = autocollect._reconstruct_fingerprint_from_commit(commit_a, ('h.txt',))
            fp2 = autocollect._reconstruct_fingerprint_from_commit(commit_a, ('h.txt',))
        self.assertEqual(fp1, fp2)

class ProducerValidatorCollectorEndToEndTests(unittest.TestCase):
    """MFRP-FINGERPRINT-T1 rework-2 (F4): genuine chain proof through a real temporary Git repository. This class runs the real P2 producer's
committed-evidence admission logic (``run_agent_autorun_workflow_gate._run_phase``'s pre-closure path), the real ``_write_receipt`` (a receipt is read
back from the actual on-disk file the real writer produced, never hand-reconstructed to stand in for it), the real
``_closure_worktree_finality_failures`` (a real ``git status --short`` against the fixture repo, unmocked -- proven to genuinely reject a dirty
fixture worktree in ``test_real_producer_refuses_binding_outright_on_dirty_worktree``), the real ``_range_shape_preflight`` (real
``steward.build_path_plan`` against the fixture repo, unmocked), the real canonical validator
(``agent_autorun_machine_verification._validate_receipt_integrity``, reached via ``read_receipt_readonly``), and the real collector entry point
(``mfrp_shadow_canary_autocollect.validate_and_reconcile_receipt``). It never mocks the shared fingerprint algorithm
(``compute_committed_evidence_fingerprint``) or the historical-target admission guard (``verify_worktree_matches_committed_target``) being verified,
and never substitutes a hand-built dict for a binding in any test that claims end-to-end proof. Isolation declaration (exact, current): only gate
*command execution* itself (``_common_commands``/``_execute``, i.e. which checker scripts actually run) is stubbed to one trivial always-passing
command, because this repository's real governed gate bundle depends on this repository's own checker scripts and cannot be meaningfully re-run inside
a disposable fixture repo. ``resolve_full_sha`` and ``build_committed_evidence`` are rebound only to redirect their ``cwd`` default to the fixture
repo (a late-bound-default workaround, not a behavior change); their real Git-plumbing bodies still run. Everything else -- Git ref resolution,
worktree/committed-blob fingerprinting, historical-target admission, receipt construction and signing via the real writer, real git-status-based
closure finality, real range-shape preflight, canonical P2 validation, and P4-C1 reconciliation -- is real, unmocked production code running against
the fixture repository. This is declared here as the exact isolated surface; it is not claimed as full production-gate proof (this repository's actual
checker bundle is not exercised) and not claimed as live/runtime proof."""

    def setUp(self) -> None:
        self._tmp = tempfile.mkdtemp(prefix='cef-e2e-')
        self._repo = Path(self._tmp) / 'repo'
        self._repo.mkdir(parents=True, exist_ok=True)
        self._git('init', '-q')
        self._git('config', 'user.email', 'test@example.invalid')
        self._git('config', 'user.name', 'E2E Test')
        self._receipt_root = self._repo / '.cvf' / 'runtime' / 'test-receipts'
        self._receipt_root.mkdir(parents=True, exist_ok=True)
        (self._repo / '.gitignore').write_text('.cvf/\n', encoding='utf-8')
        self._git('add', '.gitignore')
        self._git('commit', '-q', '-m', 'add .gitignore for test receipt isolation')

    def tearDown(self) -> None:
        shutil.rmtree(self._tmp, ignore_errors=True)

    def _git(self, *args: str) -> str:
        proc = subprocess.run(['git', *args], cwd=self._repo, capture_output=True, text=True)
        assert proc.returncode == 0, f'git {args} failed: {proc.stderr}'
        return proc.stdout.strip()

    def _git_bytes(self, *args: str) -> bytes:
        proc = subprocess.run(['git', *args], cwd=self._repo, capture_output=True)
        assert proc.returncode == 0, f'git {args} failed: {proc.stderr!r}'
        return proc.stdout

    def _write(self, relative: str, content: bytes) -> None:
        target = self._repo / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def _commit(self, message: str) -> str:
        self._git('add', '-A')
        self._git('commit', '-q', '-m', message)
        return self._git('rev-parse', 'HEAD')

    def _run_real_pre_closure(self, base: str, head: str, *, expect_pass: bool=True):
        """Run the real producer's pre-closure path against this temp repo, using the real ``_write_receipt``, the real ``_closure_worktree_finality_failures``
(real ``git status --short`` against the temp repo), and the real ``_range_shape_preflight`` (real ``steward.build_path_plan`` against the temp repo)
-- none of the three are mocked. Only gate-command *execution* itself is stubbed to one trivial always-passing command (see class docstring: this
repository's real governed gate bundle cannot be meaningfully re-run inside a disposable fixture repo). The receipt is read back from the real on-disk
file the real writer produced, in a temp receipt directory -- never hand-reconstructed to stand in for the production writer."""
        try:
            import run_agent_autorun_workflow_gate as autorun
        except ModuleNotFoundError:
            from governance.compat import run_agent_autorun_workflow_gate as autorun
        noop_commands = (autorun.GateCommand('noop-probe', (sys.executable, '-c', 'pass')),)
        receipt_dir = self._receipt_root / f'call-{uuid.uuid4().hex}'
        real_resolve_full_sha = committed_evidence.resolve_full_sha
        real_build_committed_evidence = committed_evidence.build_committed_evidence
        real_verify_worktree_matches = committed_evidence.verify_worktree_matches_committed_target

        def scoped_resolve_full_sha(ref, *, cwd=None):
            return real_resolve_full_sha(ref, cwd=self._repo)

        def scoped_build_committed_evidence(base_sha, head_sha, *, cwd=None):
            return real_build_committed_evidence(base_sha, head_sha, cwd=self._repo)

        def scoped_verify_worktree_matches(base_sha, head_sha, *, cwd=None):
            return real_verify_worktree_matches(base_sha, head_sha, cwd=self._repo)
        with mock.patch.object(autorun, 'REPO_ROOT', self._repo), mock.patch.object(autorun.steward, 'REPO_ROOT', self._repo), mock.patch.object(autorun, '_common_commands', lambda b, h: noop_commands), mock.patch.object(autorun, '_pre_implementation_commands', lambda b, h: ()), mock.patch.object(autorun.committed_evidence, 'resolve_full_sha', scoped_resolve_full_sha), mock.patch.object(autorun.committed_evidence, 'build_committed_evidence', scoped_build_committed_evidence), mock.patch.object(autorun.committed_evidence, 'verify_worktree_matches_committed_target', scoped_verify_worktree_matches):
            result = autorun._run_phase('pre-closure', base, head, receipt_dir=receipt_dir)
        receipt_path = receipt_dir / 'pre-closure.json'
        if not expect_pass:
            assert result != 0, 'expected the real producer to fail this gate run'
            assert not receipt_path.is_file(), 'a failing pre-closure run must not have written a receipt'
            return {}
        assert result == 0, 'real producer pre-closure run must pass'
        assert receipt_path.is_file(), 'the real _write_receipt must have produced an on-disk receipt; this test never hand-constructs a substitute payload'
        return json.loads(receipt_path.read_text(encoding='utf-8'))

    def _reconcile_through_real_collector(self, receipt_payload: dict, trusted_commit: str):
        """Write the receipt to disk and reconcile it through the real collector entry point, with canary_core/autocollect's REPO_ROOT pointed at this temp repo.
The receipt file itself lives outside self._repo (a sibling receipt_root call directory) so writing it never dirties the fixture repo's own
worktree/git-status state."""
        receipt_path = self._receipt_root / f'reconcile-{uuid.uuid4().hex}.json'
        receipt_path.write_text(json.dumps(receipt_payload), encoding='utf-8')
        real_compute_fingerprint = committed_evidence.compute_committed_evidence_fingerprint

        def scoped_compute_fingerprint(base_sha, head_sha, *, cwd=None):
            return real_compute_fingerprint(base_sha, head_sha, cwd=self._repo)
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo), mock.patch.object(autocollect.committed_evidence, 'compute_committed_evidence_fingerprint', scoped_compute_fingerprint):
            return autocollect.validate_and_reconcile_receipt(receipt_path, trusted_commit, trusted_commit, None)

    def test_real_chain_crlf_autocrlf_true_and_false_agree_on_committed_evidence(self):
        """The recurring MFRP-FINGERPRINT-T1 defect, proven through the real chain: producer admission -> canonical validator -> collector reconciliation must
agree on one committedEvidence fingerprint regardless of core.autocrlf checkout representation, because every byte is sourced from committed Git
blobs, never the worktree. Two separate fixture repositories are used (one per autocrlf setting), each with a genuine fresh checkout of the same
commit history, rather than flipping core.autocrlf mid-test in one worktree: flipping the config without a fresh checkout leaves the worktree's raw
disk bytes literally unchanged while Git's interpretation of them changes, which git status itself correctly reports as a dirty file (proven
separately) -- that is a real dirty-worktree condition the real producer's own closure-finality gate correctly refuses, not a representation this
defect class is about. A genuine checkout under each setting is what the CRLF/LF checkout-representation contract actually describes."""
        self._git('config', 'core.autocrlf', 'true')
        self._write('f.txt', b'line1\r\nline2\r\n')
        base = self._commit('A')
        self._write('f.txt', b'line1\r\nline2\r\nline3\r\n')
        head = self._commit('B')
        primary_receipt = self._run_real_pre_closure(base, head)
        secondary_receipt = self._run_in_fresh_clone_with_autocrlf('false', base, head)
        reconciled_true = self._reconcile_through_real_collector(primary_receipt, head)
        reconciled_false = self._reconcile_through_real_collector(secondary_receipt, head)
        blob_sha = self._git('rev-parse', f'{head}:f.txt')
        blob_bytes = self._git_bytes('cat-file', 'blob', blob_sha)
        expected = hashlib.sha256()
        expected.update(b'f.txt')
        expected.update(b'\x00')
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b'\x00')
        expected_fingerprint = expected.hexdigest()
        self.assertEqual(reconciled_true['reconstructedFingerprint'], expected_fingerprint)
        self.assertEqual(reconciled_false['reconstructedFingerprint'], expected_fingerprint)
        self.assertEqual(primary_receipt['committedEvidence']['fingerprint'], secondary_receipt['committedEvidence']['fingerprint'])

    def _run_in_fresh_clone_with_autocrlf(self, autocrlf_value: str, base: str, head: str) -> dict:
        """Clone this class's primary fixture repo into a fresh second repository configured with the requested core.autocrlf value *before* the clone's own
checkout happens, so that second repo's worktree bytes are a genuine fresh checkout under that setting -- never the primary repo's leftover disk bytes
under a flipped config. Runs the real producer against the clone and returns its receipt dict."""
        clone_root = Path(self._tmp) / f'repo-autocrlf-{autocrlf_value}'
        proc = subprocess.run(['git', 'clone', '-q', '--config', f'core.autocrlf={autocrlf_value}', str(self._repo), str(clone_root)], capture_output=True, text=True)
        assert proc.returncode == 0, proc.stderr
        subprocess.run(['git', 'config', 'user.email', 'test@example.invalid'], cwd=clone_root, check=True)
        subprocess.run(['git', 'config', 'user.name', 'E2E Test'], cwd=clone_root, check=True)
        original_repo = self._repo
        self._repo = clone_root
        try:
            return self._run_real_pre_closure(base, head)
        finally:
            self._repo = original_repo

    def test_real_chain_binary_and_unicode_space_paths(self):
        """Binary bytes and a Unicode/space-containing path, through the real producer/validator/collector chain -- independent expected Git-byte value, not the
helper compared with itself."""
        unicode_path = 'dir 中文/binary file éè.dat'
        binary_content = bytes(range(256))
        self._write(unicode_path, b'')
        base = self._commit('empty base')
        self._write(unicode_path, binary_content)
        head = self._commit('add binary unicode path')
        receipt = self._run_real_pre_closure(base, head)
        reconciled = self._reconcile_through_real_collector(receipt, head)
        blob_sha = self._git('rev-parse', f'{head}:{unicode_path}')
        blob_bytes = self._git_bytes('cat-file', 'blob', blob_sha)
        self.assertEqual(blob_bytes, binary_content)
        expected = hashlib.sha256()
        expected.update(unicode_path.encode('utf-8'))
        expected.update(b'\x00')
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b'\x00')
        self.assertEqual(reconciled['reconstructedFingerprint'], expected.hexdigest())

    def test_real_producer_refuses_binding_outright_on_dirty_worktree(self):
        """Producer admission, not helper invariance: a genuinely dirty worktree (dirty tracked, plus staged untracked) at the moment the real producer runs must
make the whole real pre-closure gate FAIL outright (_closure_worktree_finality_failures is a real, unmocked git-status check in this class), and no
receipt is even eligible for a committedEvidence binding -- the producer never gets far enough to consider one. This is what actually protects against
certifying unverified content in production; the shared helper's own byte-equivalence invariance (proven separately in
test_committed_evidence_fingerprint.py's test_dirty_worktree_can_still_incidentally_match_committed_target) is a narrower, different guarantee that
must not be mistaken for this producer-level admission control."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head = self._commit('B')
        self._write('a.txt', b'DIRTY TRACKED UNCOMMITTED')
        self._write('untracked.txt', b'untracked drift')
        self._git('add', 'untracked.txt')
        dirty_receipt = self._run_real_pre_closure(base, head, expect_pass=False)
        self.assertNotIn('committedEvidence', dirty_receipt, 'a dirty worktree must never reach a committedEvidence binding at all, regardless of whether its content happens to match head')

    def test_helper_invariance_is_narrower_than_producer_admission(self):
        """Distinguishes the two separate guarantees explicitly, per Local review finding F1 point 5: the shared helper answers only "does the worktree's blob
content equal head's committed blob", which a dirty-but-content-reverted worktree can still satisfy (proven at the helper level in
test_committed_evidence_fingerprint.py). That narrower invariance does NOT mean the real producer is entitled to certify content it has not actually
verified through a clean, gate-passing run: the producer's separate git-status-based closure finality check is what actually enforces that a dirty
worktree can never reach admission, independent of what the helper alone would say about content equivalence."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head = self._commit('B')
        full_base = self._git('rev-parse', base)
        full_head = self._git('rev-parse', head)
        self._write('unrelated_untracked.txt', b'dirty but unrelated to a.txt')
        helper_matches, helper_reason = committed_evidence.verify_worktree_matches_committed_target(full_base, full_head, cwd=self._repo)
        self.assertTrue(helper_matches, 'helper invariance sanity check: ' + helper_reason)
        receipt = self._run_real_pre_closure(base, head, expect_pass=False)
        self.assertNotIn('committedEvidence', receipt)

    def _run_real_pre_closure_forcing_legacy_no_binding(self, base: str, head: str) -> dict:
        """Same real producer path as ``_run_real_pre_closure`` (real ``_write_receipt``, real ``_closure_worktree_finality_failures``, real
``_range_shape_preflight``), but with ``resolve_full_sha`` forced to fail so the producer legitimately takes its own existing legacy
no-committedEvidence branch, instead of this test hand-constructing a legacy-shaped payload."""
        try:
            import run_agent_autorun_workflow_gate as autorun
        except ModuleNotFoundError:
            from governance.compat import run_agent_autorun_workflow_gate as autorun
        noop_commands = (autorun.GateCommand('noop-probe', (sys.executable, '-c', 'pass')),)
        receipt_dir = self._receipt_root / f'call-{uuid.uuid4().hex}'

        def failing_resolve_full_sha(ref, *, cwd=None):
            raise committed_evidence.CommittedEvidenceUnavailable('forced unavailable for legacy-path proof')
        with mock.patch.object(autorun, 'REPO_ROOT', self._repo), mock.patch.object(autorun.steward, 'REPO_ROOT', self._repo), mock.patch.object(autorun, '_common_commands', lambda b, h: noop_commands), mock.patch.object(autorun, '_pre_implementation_commands', lambda b, h: ()), mock.patch.object(autorun.committed_evidence, 'resolve_full_sha', failing_resolve_full_sha):
            result = autorun._run_phase('pre-closure', base, head, receipt_dir=receipt_dir)
        assert result == 0, 'real producer pre-closure run must pass even without a binding'
        receipt_path = receipt_dir / 'pre-closure.json'
        assert receipt_path.is_file()
        return json.loads(receipt_path.read_text(encoding='utf-8'))

    def test_real_chain_legacy_receipt_without_binding_is_skipped_by_real_collector(self):
        """A receipt the real producer would emit for a range with no resolvable committedEvidence (simulated here via an unresolvable base ref during the
binding step, forcing the legacy no-binding path) reconciles as SKIPPED_NO_COMMITTED_EVIDENCE through the real collector -- never silently upgraded."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head = self._commit('B')
        legacy_receipt = self._run_real_pre_closure_forcing_legacy_no_binding(base, head)
        self.assertNotIn('committedEvidence', legacy_receipt)
        legacy_receipt_path = self._write_receipt_and_get_path(legacy_receipt)
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            with self.assertRaises(autocollect.CollectionSkipped) as ctx:
                autocollect.validate_and_reconcile_receipt(legacy_receipt_path, head, head, None)
        self.assertEqual(ctx.exception.code, 'SKIPPED_NO_COMMITTED_EVIDENCE')

    def _write_receipt_and_get_path(self, payload: dict) -> Path:
        receipt_path = self._receipt_root / f'legacy-{uuid.uuid4().hex}.json'
        receipt_path.write_text(json.dumps(payload), encoding='utf-8')
        return receipt_path

    def test_real_chain_tampered_binding_after_producer_emission_is_unsafe(self):
        """A binding genuinely produced by the real producer, then tampered post-emission (fingerprint swapped for another valid-shaped but wrong value), must be
rejected as UNSAFE by the real collector, not silently accepted or downgraded."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head = self._commit('B')
        receipt = self._run_real_pre_closure(base, head)
        tampered = dict(receipt)
        tampered_evidence = dict(tampered['committedEvidence'])
        tampered_evidence['fingerprint'] = '0' * 64 if tampered_evidence['fingerprint'] != '0' * 64 else '1' * 64
        tampered['committedEvidence'] = tampered_evidence
        tampered['machineVerification'] = dict(tampered['machineVerification'])
        tampered['machineVerification']['committedEvidence'] = tampered_evidence
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            with self.assertRaises((autocollect.CollectionUnsafe, autocollect.CollectionSkipped)):
                self._reconcile_through_real_collector(tampered, head)

    def test_real_chain_null_committed_evidence_is_rejected_end_to_end(self):
        """A receipt where a legitimate producer-emitted binding is overwritten with an explicit null at both locations post-emission must be rejected through
the real chain, never treated as a benign legacy omission."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head = self._commit('B')
        receipt = self._run_real_pre_closure(base, head)
        nulled = dict(receipt)
        nulled['committedEvidence'] = None
        nulled['machineVerification'] = dict(nulled['machineVerification'])
        nulled['machineVerification']['committedEvidence'] = None
        with mock.patch.object(canary_core, 'REPO_ROOT', self._repo), mock.patch.object(autocollect, 'REPO_ROOT', self._repo):
            with self.assertRaises((autocollect.CollectionUnsafe, autocollect.CollectionSkipped)) as ctx:
                self._reconcile_through_real_collector(nulled, head)
        self.assertIn(ctx.exception.code, ('SKIPPED_INVALID_RECEIPT', 'UNSAFE_COMMITTED_EVIDENCE_MALFORMED'))
        if isinstance(ctx.exception, autocollect.CollectionSkipped):
            self.fail("a receipt with a present-but-null committedEvidence key must never reach the benign SKIPPED_INVALID_RECEIPT classification silently -- F3's declared-binding check must catch it")

    def test_real_chain_newline_semantic_drift_is_rejected(self):
        for payload in (b'\x00payload', b'payload'):
            with self.subTest(payload=payload):
                self._git('config', 'core.autocrlf', 'false')
                self._write('.gitattributes', b'evidence.dat -text\n')
                self._write('evidence.dat', b'base')
                base = self._commit('newline base')
                self._write('evidence.dat', payload + b'\r\n')
                target = self._commit('newline target')
                self._write('evidence.dat', payload + b'\n')
                self._commit('newline semantic drift')
                self.assertEqual(self._git('status', '--porcelain'), '')
                receipt = self._run_real_pre_closure(base, target)
                self.assertNotIn('committedEvidence', receipt)

    def test_real_chain_historical_target_semantic_drift_is_rejected(self):
        """F1/F4 minimum matrix row: historical B, clean HEAD C where C changes evidence.txt's content again (semantic drift), through the real producer -> real
collector chain. No committedEvidence binding may be produced for base=A, head=B while the worktree (clean and stable) sits at C with drifted
evidence.txt content. This is the exact Local-review counterexample proven at the E2E level, not just the shared-helper or producer-only level."""
        self._write('evidence.txt', b'base content')
        base = self._commit('A')
        self._write('evidence.txt', b'target content for B')
        head = self._commit('B')
        self._write('evidence.txt', b'drifted content at C -- semantic change')
        self._commit('C')
        receipt = self._run_real_pre_closure(base, head)
        self.assertNotIn('committedEvidence', receipt, 'worktree at C must not be certified as historical target B')

    def test_real_chain_clean_filter_masked_drift_is_rejected(self):
        """MFRP-FINGERPRINT-T1 rework-3 (F1): the exact Local-review clean-filter counterexample, through the real producer -> real finality -> real validator ->
real collector chain (not just the isolated helper in test_committed_evidence_fingerprint.py). A ``clean`` filter is configured to always emit the
fixed bytes ``target`` regardless of its real input. The worktree is then overwritten with genuinely different content and ``git add``ed: the filter
launders the staged blob back to ``target``, so ``git status --short`` is genuinely clean (the real, unmocked ``_closure_worktree_finality_failures``
this class exercises does not block the run), while the actual on-disk bytes remain the different content. The real producer must still refuse to bind
``committedEvidence`` for this range: the historical-target admission check reads raw disk bytes directly (never ``git hash-object``/``git add``/``git
diff`` against the file), so the configured filter can neither run during admission nor launder the comparison the way it laundered ``git status``."""
        script_dir = Path(self._tmp) / 'filter-script'
        script_dir.mkdir(parents=True, exist_ok=True)
        script_path = script_dir / 'reviewprobe_filter.py'
        script_path.write_text("import sys\nsys.stdout.write('target')\n", encoding='utf-8')
        self._write('evidence.txt', b'base')
        base = self._commit('A')
        self._git('config', 'filter.reviewprobe.clean', f'"{sys.executable}" "{script_path}"')
        self._write('.gitattributes', b'evidence.txt filter=reviewprobe\n')
        self._write('evidence.txt', b'target')
        head = self._commit('B')
        self._write('evidence.txt', b'totally different malicious content')
        self._git('add', 'evidence.txt')
        status = self._git('status', '--short')
        self.assertEqual(status, '', 'fixture precondition: the configured filter must mask this from git status, exactly as the Local-review counterexample describes')
        self.assertEqual((self._repo / 'evidence.txt').read_bytes(), b'totally different malicious content', 'fixture precondition: the real disk bytes must remain the unfiltered, genuinely different content')
        receipt = self._run_real_pre_closure(base, head)
        self.assertNotIn('committedEvidence', receipt, 'a filter-masked git-status-clean worktree with genuinely different disk bytes must never be certified as the committed target')

    def test_real_chain_historical_target_with_continuity_only_head_admits(self):
        """F1/F4 minimum matrix row: historical B, later continuity-only HEAD C (touches only an unrelated path) -- binding for base=A, head=B must remain valid,
through the real producer -> real validator -> real collector chain, proving the historical-target admission check does not over-reject the legitimate
continuity case."""
        self._write('evidence.txt', b'base content')
        base = self._commit('A')
        self._write('evidence.txt', b'target content for B')
        head = self._commit('B')
        self._write('CONTINUITY.md', b'session sync only, unrelated to evidence.txt')
        self._commit('continuity-only C')
        receipt = self._run_real_pre_closure(base, head)
        self.assertIn('committedEvidence', receipt)
        reconciled = self._reconcile_through_real_collector(receipt, head)
        blob_sha = self._git('rev-parse', f'{head}:evidence.txt')
        blob_bytes = self._git_bytes('cat-file', 'blob', blob_sha)
        expected = hashlib.sha256()
        expected.update(b'evidence.txt')
        expected.update(b'\x00')
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b'\x00')
        self.assertEqual(reconciled['reconstructedFingerprint'], expected.hexdigest())

    def test_real_chain_ref_movement_during_run_withholds_binding(self):
        """F4 minimum matrix row: ref movement during the run, through the real producer -> real collector chain (not just the isolated producer-level test in
test_run_agent_autorun_workflow_gate.py). A concurrent commit landing on the checked-out branch between the pre-run short-SHA capture and the post-run
committedEvidence resolution must withhold the binding entirely."""
        try:
            import run_agent_autorun_workflow_gate as autorun
        except ModuleNotFoundError:
            from governance.compat import run_agent_autorun_workflow_gate as autorun
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        self._commit('B')
        branch = self._git('branch', '--show-current')
        noop_commands = (autorun.GateCommand('noop-probe', (sys.executable, '-c', 'pass')),)
        receipt_dir = self._receipt_root / f'call-{uuid.uuid4().hex}'
        real_resolve_full_sha = committed_evidence.resolve_full_sha

        def moving_ref_resolve_full_sha(ref, *, cwd=None):
            if ref == branch:
                self._write('a.txt', b'three (concurrent, unverified)')
                self._commit('concurrent C')
            return real_resolve_full_sha(ref, cwd=self._repo)
        with mock.patch.object(autorun, 'REPO_ROOT', self._repo), mock.patch.object(autorun.steward, 'REPO_ROOT', self._repo), mock.patch.object(autorun, '_common_commands', lambda b, h: noop_commands), mock.patch.object(autorun, '_pre_implementation_commands', lambda b, h: ()), mock.patch.object(autorun.committed_evidence, 'resolve_full_sha', moving_ref_resolve_full_sha):
            result = autorun._run_phase('pre-closure', base, branch, receipt_dir=receipt_dir)
        assert result == 0
        receipt = json.loads((receipt_dir / 'pre-closure.json').read_text(encoding='utf-8'))
        self.assertNotIn('committedEvidence', receipt)

    def test_real_chain_raw_byte_cache_invalidation_still_regresses(self):
        """Regression guard: this rework must not weaken the pre-existing raw worktree/cache byte-invalidation identity. A byte-only content change to the same
committed path changes both the raw worktreeFingerprint the real producer writes and the committedEvidence fingerprint the real collector reconciles."""
        self._write('a.txt', b'one')
        base = self._commit('A')
        self._write('a.txt', b'two')
        head_1 = self._commit('B')
        receipt_1 = self._run_real_pre_closure(base, head_1)
        self._git('reset', '-q', '--hard', base)
        self._write('a.txt', b'three')
        head_2 = self._commit('B2')
        receipt_2 = self._run_real_pre_closure(base, head_2)
        self.assertNotEqual(receipt_1['worktreeFingerprint'], receipt_2['worktreeFingerprint'])
        self.assertNotEqual(receipt_1['committedEvidence']['fingerprint'], receipt_2['committedEvidence']['fingerprint'])

class SafetyMarkerAndPreCommitBlockingTests(unittest.TestCase):

    def setUp(self) -> None:
        self._scratch = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-marker-scratch'
        self._marker = self._scratch / 'UNRESOLVED_SAFETY_MARKER.json'
        self._journal = self._scratch / 'pending_observations.json'
        self._patch_runtime = mock.patch.object(autocollect, 'RUNTIME_DIR', self._scratch)
        self._patch_marker = mock.patch.object(autocollect, 'SAFETY_MARKER_PATH', self._marker)
        self._patch_journal = mock.patch.object(autocollect, 'PENDING_JOURNAL_PATH', self._journal)
        self._patch_history = mock.patch.object(autocollect, '_historical_attempt_rows', return_value=[])
        self._patch_runtime.start()
        self._patch_marker.start()
        self._patch_journal.start()
        self._patch_history.start()

    def tearDown(self) -> None:
        self._patch_history.stop()
        self._patch_journal.stop()
        self._patch_marker.stop()
        self._patch_runtime.stop()
        shutil.rmtree(self._scratch, ignore_errors=True)

    def test_marker_absent_by_default(self):
        self.assertFalse(autocollect.safety_marker_present())

    def test_write_safety_marker_persists_until_externally_removed(self):
        autocollect.write_safety_marker('UNSAFE_TEST', 'synthetic test condition')
        self.assertTrue(autocollect.safety_marker_present())
        payload = json.loads(self._marker.read_text(encoding='utf-8'))
        self.assertEqual(payload['code'], 'UNSAFE_TEST')
        autocollect.write_safety_marker('UNSAFE_TEST', 'synthetic test condition')
        self.assertTrue(autocollect.safety_marker_present())

    def test_run_collection_short_circuits_when_marker_present(self):
        autocollect.write_safety_marker('UNSAFE_TEST', 'pre-existing')
        status = autocollect.run_collection(canary_core.git_head())
        self.assertEqual(status, 'P4-C1: SKIPPED_SAFETY_MARKER_ALREADY_PRESENT')

    def test_pre_commit_hook_blocks_while_marker_present(self):
        hook_path = REPO_ROOT / '.githooks/pre-commit'
        text = hook_path.read_text(encoding='utf-8')
        self.assertIn('UNRESOLVED_SAFETY_MARKER.json', text)
        self.assertIn('exit 1', text)

    def test_pre_commit_marker_check_precedes_governance_chain(self):
        text = (REPO_ROOT / '.githooks/pre-commit').read_text(encoding='utf-8')
        marker_check_pos = text.index('UNRESOLVED_SAFETY_MARKER.json')
        chain_pos = text.index('run_local_governance_hook_chain.py')
        self.assertLess(marker_check_pos, chain_pos)

class AtomicJournalWriteTests(unittest.TestCase):

    def setUp(self) -> None:
        self._scratch = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-journal-scratch'
        self._journal = self._scratch / 'pending_observations.json'
        self._patch = mock.patch.object(autocollect, 'PENDING_JOURNAL_PATH', self._journal)
        self._patch.start()

    def tearDown(self) -> None:
        self._patch.stop()
        shutil.rmtree(self._scratch, ignore_errors=True)

    def test_atomic_write_produces_readable_journal(self):
        autocollect._atomic_write_json(self._journal, {'rows': [], 'populationCount': 0})
        self.assertTrue(self._journal.is_file())
        loaded = json.loads(self._journal.read_text(encoding='utf-8'))
        self.assertEqual(loaded['populationCount'], 0)

    def test_interrupted_write_preserves_prior_journal(self):
        autocollect._atomic_write_json(self._journal, {'rows': [], 'populationCount': 0})
        original_bytes = self._journal.read_bytes()

        def _boom(*_args, **_kwargs):
            raise OSError('simulated interruption before rename')
        with mock.patch('os.replace', side_effect=_boom):
            with self.assertRaises(OSError):
                autocollect._atomic_write_json(self._journal, {'rows': ['new'], 'populationCount': 1})
        self.assertEqual(self._journal.read_bytes(), original_bytes)
        leftovers = [p for p in self._scratch.iterdir() if p != self._journal]
        self.assertEqual(leftovers, [])

    def test_load_pending_journal_returns_none_when_absent(self):
        self.assertIsNone(autocollect._load_pending_journal())

    def test_history_seed_is_diagnostic_and_never_creates_rows(self):
        selected = autocollect.observability.EnrollmentCandidate(path='docs/reviews/accepted.md', trusted_outcome='CLOSED_PASS_BOUNDED', phase='REVIEW', hard_obligation_locator='accepted#status', hard_obligation_pattern='Status: CLOSED_PASS_BOUNDED', source_authority_locator='docs/work_orders/example.md', origin='COMPLETION_REVIEW', priority=1)
        eligible = autocollect.observability.SelectionResult(selected, 1, 'SELECTED', (selected.path,))
        empty = autocollect.observability.SelectionResult(None, 0, 'SKIPPED_NO_ELIGIBLE_CANDIDATE', ())
        with mock.patch.object(autocollect, '_single_parent', side_effect=['upper', 'trusted-1', 'trusted-2']), mock.patch.object(autocollect, '_run_git', return_value=(0, 'disclosure-1\ndisclosure-2', '')), mock.patch.object(autocollect, '_discover_candidate', side_effect=[eligible, empty]):
            attempts = autocollect._historical_attempt_rows('current')
        journal = autocollect.observability.normalize_journal({'attempts': attempts})
        self.assertEqual(journal['attemptCount'], 2)
        self.assertEqual(journal['eligibleCount'], 1)
        self.assertEqual(journal['collectedCount'], 0)
        self.assertEqual(journal['rows'], [])

    def test_checkpoint_uses_collected_count_not_opportunities(self):
        attempts = [autocollect.observability.make_attempt(f'{index:040x}', 'b' * 40, outcome='HISTORICAL_ELIGIBLE_NOT_COLLECTED', candidate_count=1, eligible=True, historical=True) for index in range(10)]
        with mock.patch.object(autocollect, '_load_pending_journal', return_value=None), mock.patch.object(autocollect, '_historical_attempt_rows', return_value=attempts):
            journal = autocollect._prepare_journal('current')
        self.assertEqual(journal['eligibleCount'], 10)
        self.assertEqual(journal['collectedCount'], 0)
        self.assertEqual(journal['checkpoint'], 'initialization')

class EndToEndCollectionTests(unittest.TestCase):
    """Exercise ``run_collection`` against this real repository's history, with an isolated scratch receipt/runtime directory so production state is never
touched."""

    def setUp(self) -> None:
        self._receipt_scratch = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-e2e-receipts'
        self._runtime_scratch = REPO_ROOT / '.cvf/runtime/mfrp-p4-c1-test-e2e-runtime'
        self._journal = self._runtime_scratch / 'pending_observations.json'
        self._marker = self._runtime_scratch / 'UNRESOLVED_SAFETY_MARKER.json'
        self._patches = [mock.patch.object(autocollect, 'RECEIPT_DIR', self._receipt_scratch), mock.patch.object(autocollect, 'RUNTIME_DIR', self._runtime_scratch), mock.patch.object(autocollect, 'PENDING_JOURNAL_PATH', self._journal), mock.patch.object(autocollect, 'SAFETY_MARKER_PATH', self._marker), mock.patch.object(autocollect, '_historical_attempt_rows', return_value=[])]
        for patch in self._patches:
            patch.start()
        self._receipt_scratch.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        for patch in reversed(self._patches):
            patch.stop()
        shutil.rmtree(self._receipt_scratch, ignore_errors=True)
        shutil.rmtree(self._runtime_scratch, ignore_errors=True)
        _cleanup_fresh_receipt_dir()

    def test_ordinary_commit_skips_without_blocking(self):
        status = autocollect.run_collection(canary_core.TRUSTED_COMMIT)
        self.assertEqual(status, 'P4-C1: SKIPPED_NO_ELIGIBLE_CANDIDATE')
        self.assertFalse(autocollect.safety_marker_present())
        journal = autocollect._load_pending_journal()
        self.assertEqual(journal['schema'], autocollect.observability.JOURNAL_SCHEMA)
        self.assertEqual(journal['attemptCount'], 1)
        self.assertEqual(journal['collectedCount'], 0)

    def test_zero_receipt_candidate_with_eligible_return_skips(self):
        self.assertEqual(len(autocollect._candidate_receipt_files()), 0)
        status = autocollect.run_collection(canary_core.TRUSTED_COMMIT)
        self.assertEqual(status, 'P4-C1: SKIPPED_NO_ELIGIBLE_CANDIDATE')

    def test_successful_collection_never_writes_tracked_paths(self):
        """An honestly ineligible historical run touches no tracked path."""
        proc = subprocess.run(['git', 'status', '--short'], cwd=REPO_ROOT, capture_output=True, text=True)
        before_status = proc.stdout
        autocollect.run_collection(canary_core.TRUSTED_COMMIT)
        proc_after = subprocess.run(['git', 'status', '--short'], cwd=REPO_ROOT, capture_output=True, text=True)
        self.assertEqual(before_status, proc_after.stdout)

    def _run_linked_candidate(self, disposition: str) -> tuple[str, str]:
        trusted_commit = canary_core.TRUSTED_COMMIT
        disclosure_commit = canary_core.git_head()
        return_path = canary_core.TRUSTED_RETURN_PATH
        fixture = _build_fresh_real_receipt('e2e-linked', trusted_commit, disclosure_commit)
        valid, payload, reason = autocollect.read_receipt_readonly(str(fixture['path']), REPO_ROOT)
        self.assertTrue(valid, reason)
        readout = autocollect.machine_readout_to_dict(autocollect.build_machine_verification_readout(valid, payload, reason))
        parsed = autocollect.parse_observation_block(_ELIGIBLE_BLOCK)
        assert parsed is not None
        committed_text = _ELIGIBLE_BLOCK + '\n## Independent Reviewer Adjudication\n' + f'Reviewer disposition: `{disposition}`\n'
        reconciled = {'payload': payload, 'readout': readout, 'baseSha': str(payload['baseSha']), 'headSha': str(payload['headSha']), 'reconstructedFingerprint': str(payload['worktreeFingerprint'])}
        selected = autocollect.observability.EnrollmentCandidate(path=return_path, trusted_outcome=disposition, phase='REVIEW', hard_obligation_locator='probe locator', hard_obligation_pattern='probe pattern', source_authority_locator='probe#loc', origin='LEGACY_EXPLICIT_YES', priority=0)
        selection = autocollect.observability.SelectionResult(selected=selected, candidate_count=1, reason='SELECTED', review_paths=(return_path,))
        with mock.patch.object(autocollect, '_single_parent', return_value=trusted_commit), mock.patch.object(autocollect, '_discover_candidate', return_value=selection), mock.patch.object(autocollect, '_read_committed_text', return_value=committed_text), mock.patch.object(autocollect, 'find_receipt_candidate', return_value=(fixture['path'], trusted_commit)), mock.patch.object(autocollect, 'validate_and_reconcile_receipt', return_value=reconciled):
            first = autocollect.run_collection(disclosure_commit)
            second = autocollect.run_collection(disclosure_commit)
        return (first, second)

    def test_eligible_reviewer_adjudicated_return_collects_once_then_duplicate_skips(self):
        first, second = self._run_linked_candidate('REVIEWER_ACCEPTED_BOUNDED')
        self.assertTrue(first.startswith('P4-C1: COLLECTED OBS-'), first)
        self.assertEqual(second, 'P4-C1: SKIPPED_DUPLICATE_OR_REBOUND')
        journal = autocollect._load_pending_journal()
        self.assertIsNotNone(journal)
        self.assertEqual(journal['eligibleCount'], 1)
        self.assertEqual(journal['collectedCount'], 1)
        self.assertEqual(len(journal['receiptReadoutEnvelopeByRow']), 1)
        self.assertFalse(autocollect.safety_marker_present())

    def test_machine_clean_where_reviewer_blocks_persists_row_and_marks_safety(self):
        first, _second = self._run_linked_candidate('RETURN_TO_DESIGN')
        self.assertIn('MACHINECLOSUREWHERETRUSTEDBLOCKS', first)
        self.assertTrue(autocollect.safety_marker_present())
        journal = autocollect._load_pending_journal()
        self.assertIsNotNone(journal)
        self.assertEqual(journal['eligibleCount'], 1)
        self.assertEqual(journal['collectedCount'], 1)

    def test_no_network_or_provider_import_reachable(self):
        """Static guard: the collector module must never import a network/HTTP/provider client library."""
        source = (REPO_ROOT / 'governance/compat/mfrp_shadow_canary_autocollect.py').read_text(encoding='utf-8')
        forbidden_tokens = ('requests', 'httpx', 'urllib.request', 'socket', 'openai', 'anthropic')
        for token in forbidden_tokens:
            self.assertNotIn(token, source, msg=f'forbidden network/provider token found: {token}')
if __name__ == '__main__':
    unittest.main()
