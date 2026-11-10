import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'scripts/new-cvf-workspace.ps1'

class OnboardingContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='cvf-onboard-')
        self.workspace = Path(self.tmp.name)
        self.core = self.workspace / '.Controlled-Vibe-Framework-CVF'
        subprocess.run(['git', 'clone', '--quiet', '--shared', '--no-hardlinks', str(ROOT), str(self.core)], check=True, capture_output=True)
        # Private provenance maps this public-only handoff during export.
        shutil.copyfile(ROOT / 'governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_CONTINUATION.md', self.core / 'AGENT_HANDOFF.md')
        for rel in ('scripts/new-cvf-workspace.ps1', 'scripts/check_cvf_workspace_agent_enforcement.ps1',
                    'scripts/install_cvf_workspace_root_wrappers.ps1', 'scripts/lib/downstream_governance/CvfDownstreamGateProfile.ps1',
                    'governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md'):
            shutil.copyfile(ROOT / rel, self.core / rel)
        subprocess.run(['git', '-C', str(self.core), 'add', 'AGENT_HANDOFF.md', 'scripts/new-cvf-workspace.ps1', 'scripts/check_cvf_workspace_agent_enforcement.ps1', 'scripts/install_cvf_workspace_root_wrappers.ps1', 'scripts/lib/downstream_governance/CvfDownstreamGateProfile.ps1', 'governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md'], check=True, capture_output=True)
        subprocess.run(['git', '-C', str(self.core), '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'public handoff fixture'], check=True, capture_output=True)
        subprocess.run(['git', '-C', str(self.core), 'remote', 'set-url', 'origin', 'https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git'], check=True, capture_output=True)
        self.project = self.workspace / 'Sample'

    def tearDown(self):
        self.tmp.cleanup()

    def bootstrap(self):
        return subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(SCRIPT), '-WorkspaceRoot', str(self.workspace), '-ProjectName', 'Sample'], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=90)

    def test_production_fresh_repeat_and_custom_preserved(self):
        first = self.bootstrap()
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        policy_path = self.project / '.cvf/policy.json'
        manifest_path = self.project / '.cvf/manifest.json'
        policy = json.loads(policy_path.read_text(encoding='utf-8-sig'))
        self.assertEqual(policy['workspaceActivationSourcePolicy'], 'CORE_ONLY')
        self.assertEqual(policy['workspaceActivationExecutableSource'], 'PINNED_CORE')
        self.assertFalse((self.project / '.cvf/workspace-activation.json').exists())
        helper = self.core / 'scripts/lib/downstream_governance/cvf_workspace_activation.py'
        check = subprocess.run([sys.executable, '-B', str(helper), '--project', str(self.project)], capture_output=True, text=True, timeout=30)
        self.assertEqual(check.returncode, 2, check.stdout + check.stderr)
        comparison = json.loads(check.stdout)
        self.assertEqual(comparison['status'], 'REVIEW_REQUIRED', comparison)
        self.assertEqual(comparison['sourcePolicy'], 'CORE_ONLY')
        runner = self.core / 'scripts/lib/downstream_governance/cvf_downstream_gate_runner.py'
        dispatch = subprocess.run([sys.executable, '-B', str(runner), 'run', '--phase', 'pre-dispatch', '--project-root', str(self.project), '--trusted', '--json', '--no-receipt'], capture_output=True, text=True, timeout=30)
        self.assertNotEqual(dispatch.returncode, 0, dispatch.stdout + dispatch.stderr)
        self.assertFalse(next(row for row in json.loads(dispatch.stdout)['results'] if row['controlId'] == 'CVF-DG-ACT-01')['ok'])
        old_manifest = manifest_path.read_bytes()
        old_policy = policy_path.read_bytes()
        repeat = self.bootstrap()
        self.assertEqual(repeat.returncode, 0, repeat.stdout + repeat.stderr)
        self.assertEqual(old_manifest, manifest_path.read_bytes())
        self.assertEqual(old_policy, policy_path.read_bytes())
        custom_policy = dict(policy, custom=True)
        custom_bytes = json.dumps(custom_policy).encode()
        policy_path.write_bytes(custom_bytes)
        repeat = self.bootstrap()
        self.assertEqual(repeat.returncode, 0, repeat.stdout + repeat.stderr)
        self.assertEqual(custom_bytes, policy_path.read_bytes())
        self.assertEqual(old_manifest, manifest_path.read_bytes())
        historical = json.loads(old_manifest.decode('utf-8-sig'))
        historical['cvfCoreCommit'] = '0' * 40
        manifest_path.write_text(json.dumps(historical), encoding='utf-8')
        before = {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts}
        rejected = self.bootstrap()
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn('BLOCKED_EXISTING_PROJECT_IDENTITY', rejected.stdout + rejected.stderr)
        after = {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts}
        self.assertEqual(before, after)
        manifest_path.write_bytes(old_manifest)
        lock_path = self.project / '.cvf/gate-profile.lock.json'
        lock = json.loads(lock_path.read_text(encoding='utf-8-sig'))
        installed = self.project / 'scripts/cvf_gates/cvf_dg_common.py'
        installed_original = installed.read_bytes()
        installed.write_bytes(installed_original + b'\n# tampered\n')
        before = {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts}
        rejected = self.bootstrap()
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn('BLOCKED_EXISTING_PROJECT_IDENTITY', rejected.stdout + rejected.stderr)
        self.assertEqual(before, {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts})
        installed.write_bytes(installed_original)
        lock['profileId'] = 'cvf.downstreamGateProfile@1.2.0'
        lock_path.write_text(json.dumps(lock), encoding='utf-8')
        before = {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts}
        rejected = self.bootstrap()
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn('BLOCKED_EXISTING_PROJECT_IDENTITY', rejected.stdout + rejected.stderr)
        self.assertEqual(before, {str(p.relative_to(self.workspace)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.workspace.rglob('*') if p.is_file() and '.git' not in p.parts})

    def test_line_endings_equivalent(self):
        target = self.core / 'scripts/lib/downstream_governance/cvf_workspace_activation.py'
        data = target.read_bytes().replace(b'\r\n', b'\n')
        target.write_bytes(data.replace(b'\n', b'\r\n'))
        result = self.bootstrap()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_source_skew_blocks_without_mutation(self):
        self.project.mkdir()
        (self.project / 'sentinel.txt').write_text('keep', encoding='utf-8')
        before = {str(p.relative_to(self.project)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.project.rglob('*') if p.is_file()}
        target = self.core / 'scripts/lib/downstream_governance/cvf_workspace_activation.py'
        target.write_bytes(target.read_bytes() + b'\n# skew\n')
        result = self.bootstrap()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('BLOCKED_WORKSPACE_SOURCE_SKEW', result.stdout + result.stderr)
        after = {str(p.relative_to(self.project)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.project.rglob('*') if p.is_file()}
        self.assertEqual(before, after)
        self.assertFalse((self.workspace / 'New-CVF-Governed-Project.ps1').exists())
        self.assertFalse((self.workspace / 'WORKSPACE_RULES.md').exists())
        target.write_bytes((ROOT / 'scripts/lib/downstream_governance/cvf_workspace_activation.py').read_bytes())
        doctor = self.core / 'scripts/check_cvf_workspace_agent_enforcement.ps1'
        doctor.write_bytes(doctor.read_bytes() + b'\n# skew\n')
        mismatch = self.bootstrap()
        self.assertNotEqual(mismatch.returncode, 0)
        self.assertIn('BLOCKED_WORKSPACE_SOURCE_SKEW', mismatch.stdout + mismatch.stderr)
        self.assertEqual(before, {str(p.relative_to(self.project)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.project.rglob('*') if p.is_file()})
        doctor.write_bytes((ROOT / 'scripts/check_cvf_workspace_agent_enforcement.ps1').read_bytes())
        target.unlink()
        missing = self.bootstrap()
        self.assertNotEqual(missing.returncode, 0)
        self.assertIn('workspace kit is incomplete', missing.stdout + missing.stderr)
        self.assertEqual(before, {str(p.relative_to(self.project)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.project.rglob('*') if p.is_file()})

if __name__ == '__main__':
    unittest.main()
