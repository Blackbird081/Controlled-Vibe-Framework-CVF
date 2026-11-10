"""Local mechanical doctor/readiness regressions; no provider or remote service."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'governance/compat'))
import test_workspace_activation as activation_fixture


def ps(script, *args, cwd=None):
    return subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
                           '-File', str(script), *map(str, args)], cwd=cwd,
                          capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=90)


class ReadinessTests(unittest.TestCase):
    def setUp(self):
        self.fixture = activation_fixture.ActivationTests('test_positive_core_only_and_independent_held_action')
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root, self.core = self.fixture.root, self.fixture.core
        self.receipt = self.root / '.cvf/workspace-activation.json'
        self.receipt.unlink()
        self.probe = self.fixture.base / 'probe.ps1'
        helper = ROOT / 'scripts/lib/downstream_governance/CvfDownstreamGateProfile.ps1'
        self.probe.write_text(
            'param([string]$Project,[string]$Core)\n'
            f". '{str(helper).replace(chr(39), chr(39)*2)}'\n"
            '$manifest = Get-Content (Join-Path $Project ".cvf/manifest.json") -Raw | ConvertFrom-Json\n'
            'Get-CvfGateProfileDoctorChecks -ProjectPath $Project -CorePath $Core -ManifestObj $manifest | ConvertTo-Json -Depth 30\n', encoding='utf-8')

    def probe_result(self):
        result = ps(self.probe, '-Project', self.root, '-Core', self.core, cwd=self.root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return json.loads(result.stdout)

    def test_missing_receipt_pending_preserves_failed_act(self):
        result = self.probe_result()
        self.assertTrue(result['InitialAssessmentRequired'], result)
        rows = result['Checks']
        self.assertEqual([r['Name'] for r in rows if not r['Passed']], ['Gate CVF-DG-ACT-01'])
        self.assertFalse(self.receipt.exists())

    def test_missing_receipt_does_not_mask_invalid_policy_or_source(self):
        policy = self.root / '.cvf/policy.json'
        original = policy.read_bytes()
        for invalid in ['{', '{"workspaceActivationSourcePolicy":"INVALID"}']:
            policy.write_text(invalid, encoding='utf-8')
            self.assertFalse(self.probe_result()['InitialAssessmentRequired'])
        policy.write_bytes(original)
        self.fixture.git(self.core, 'remote', 'set-url', 'origin', 'https://example.invalid/wrong')
        self.assertFalse(self.probe_result()['InitialAssessmentRequired'])

    def test_existing_malformed_or_stale_receipt_is_not_pending(self):
        for content in ['{', '{}', json.dumps(self.fixture.receipt)]:
            self.receipt.write_text(content, encoding='utf-8')
            # Existing valid review is assessed, not first-assessment pending either.
            self.assertFalse(self.probe_result()['InitialAssessmentRequired'])

    def test_installation_damage_is_not_pending(self):
        module = self.root / 'scripts/cvf_gates/cvf_dg_continuity.py'
        module.write_bytes(module.read_bytes() + b'\n# damaged\n')
        self.assertFalse(self.probe_result()['InitialAssessmentRequired'])


class DoctorCliTests(unittest.TestCase):
    def test_real_doctor_and_generated_wrapper_pending_not_broken(self):
        with tempfile.TemporaryDirectory(prefix='cvf-readiness-cli-') as tmp:
            workspace = Path(tmp)
            core = workspace / '.Controlled-Vibe-Framework-CVF'
            def git(*args):
                return subprocess.run(['git', '-C', str(core), *args], check=True,
                                      capture_output=True, text=True).stdout.strip()
            subprocess.run(['git', 'clone', '--quiet', '--shared', '--no-hardlinks', str(ROOT), str(core)],
                           check=True, capture_output=True)
            changed = ['scripts/new-cvf-workspace.ps1',
                       'governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md',
                       'scripts/lib/downstream_governance/CvfDownstreamGateProfile.ps1',
                       'scripts/check_cvf_workspace_agent_enforcement.ps1',
                       'scripts/install_cvf_workspace_root_wrappers.ps1']
            for relative in changed:
                shutil.copyfile(ROOT / relative, core / relative)
            shutil.copyfile(ROOT / 'governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_CONTINUATION.md', core / 'AGENT_HANDOFF.md')
            git('config', 'user.name', 'Readiness fixture')
            git('config', 'user.email', 'fixture@example.invalid')
            git('add', *changed, 'AGENT_HANDOFF.md')
            git('commit', '-qm', 'local readiness source fixture')
            # Local bare origin supplies actual freshness checks without network.
            origin = workspace / 'origin.git'
            subprocess.run(['git', 'clone', '--quiet', '--bare', str(core), str(origin)], check=True, capture_output=True)
            subprocess.run(['git', '--git-dir', str(origin), 'update-ref', 'refs/heads/main', git('rev-parse', 'HEAD')], check=True, capture_output=True)
            git('remote', 'set-url', 'origin', str(origin))
            git('fetch', '--quiet', 'origin', '+refs/heads/main:refs/remotes/origin/main')
            bootstrap = ps(core / 'scripts/new-cvf-workspace.ps1', '-WorkspaceRoot', workspace, '-ProjectName', 'Sample')
            self.assertEqual(bootstrap.returncode, 0, bootstrap.stdout + bootstrap.stderr)
            project = workspace / 'Sample'
            manifest_path = project / '.cvf/manifest.json'
            manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
            manifest['cvfCoreRepository'] = str(origin)
            manifest_path.write_text(json.dumps(manifest), encoding='utf-8')
            doctor = core / 'scripts/check_cvf_workspace_agent_enforcement.ps1'
            pending = ps(doctor, '-ProjectPath', project)
            self.assertEqual(pending.returncode, 2, pending.stdout + pending.stderr)
            self.assertIn('RESULT: INSTALLED_ASSESSMENT_REQUIRED', pending.stdout)
            self.assertIn('Gate CVF-DG-ACT-01', pending.stdout)
            self.assertNotIn('RESULT: PASS', pending.stdout)
            self.assertFalse((project / '.cvf/workspace-activation.json').exists())
            # A repeated bootstrap must not silently adopt this deliberately local-origin fixture.
            wrapper = ps(workspace / 'New-CVF-Governed-Project.ps1', '-ProjectName', 'Sample')
            self.assertEqual(wrapper.returncode, 1, wrapper.stdout + wrapper.stderr)
            self.assertIn('BLOCKED_EXISTING_PROJECT_IDENTITY', wrapper.stdout + wrapper.stderr)
            self.assertNotIn('Running workspace-wide new-project gate', wrapper.stdout)
            # A missing baseline file must remain an ordinary failure, not pending.
            (project / 'AGENTS.md').unlink()
            broken = ps(doctor, '-ProjectPath', project)
            self.assertEqual(broken.returncode, 1, broken.stdout + broken.stderr)
            self.assertIn('RESULT: FAIL', broken.stdout)
            self.assertNotIn('RESULT: INSTALLED_ASSESSMENT_REQUIRED', broken.stdout)

    def test_generated_wrapper_reporting_boundary(self):
        # Child-script fixtures exercise reporting/exit propagation only; real controls above.
        for installer in ('install_cvf_workspace_root_wrappers.ps1', 'install_cvf_workspace_root_wrappers_public.ps1'):
            self._check_generated_wrapper_reporting(installer)

    def _check_generated_wrapper_reporting(self, installer):
        with tempfile.TemporaryDirectory(prefix='cvf-wrapper-report-') as tmp:
            workspace = Path(tmp)
            scripts = workspace / '.Controlled-Vibe-Framework-CVF/scripts'
            scripts.mkdir(parents=True)
            (scripts / 'new-cvf-workspace.ps1').write_text('exit 0\n', encoding='utf-8')
            (scripts / 'check_cvf_workspace_new_project_enforcement.ps1').write_text('throw "UNEXPECTED_WORKSPACE_GATE"\n', encoding='utf-8')
            installed = ps(ROOT / 'scripts' / installer, '-WorkspaceRoot', workspace)
            self.assertEqual(installed.returncode, 0, installed.stdout + installed.stderr)
            doctor = scripts / 'check_cvf_workspace_agent_enforcement.ps1'
            for exit_code, lines, pending in [
                (2, ['RESULT: INSTALLED_ASSESSMENT_REQUIRED'], True),
                (2, ['RESULT: FAIL'], False),
                (1, ['RESULT: INSTALLED_ASSESSMENT_REQUIRED'], False),
                (2, ['RESULT: INSTALLED_ASSESSMENT_REQUIRED', 'RESULT: FAIL'], False),
            ]:
                doctor.write_text('\n'.join('Write-Host "' + line + '"' for line in lines) + '\nexit ' + str(exit_code) + '\n', encoding='utf-8')
                result = ps(workspace / 'New-CVF-Governed-Project.ps1', '-ProjectName', 'Sample')
                with self.subTest(exit_code=exit_code, lines=lines):
                    self.assertEqual(result.returncode, exit_code, result.stdout + result.stderr)
                    self.assertEqual('first action assessment is required' in result.stdout, pending)
                    self.assertNotIn('Running workspace-wide new-project gate', result.stdout)


if __name__ == '__main__':
    unittest.main()
