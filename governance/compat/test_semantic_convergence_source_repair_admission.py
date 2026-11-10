"""Offline source-repair admission tests using real validator and raw resolvers."""
import copy
import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import check_semantic_convergence_control as scec
import semantic_convergence_root_admission as admission
import semantic_convergence_outcome as outcome

def sha(data):
    return hashlib.sha256(data).hexdigest()

def fence(tag, obj):
    return ('```' + tag + '\n' + json.dumps(obj) + '\n```\n').encode()

def block_text(block):
    return fence('json', block)

class SourceRepairAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.root_patch = patch.object(scec, 'REPO_ROOT', self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.now = datetime(2026, 10, 31, 0, 0, tzinfo=timezone.utc)
        self.clock = patch.object(admission, '_utc_now', return_value=self.now)
        self.clock.start()
        self.addCleanup(self.clock.stop)
        self.parent_path = 'docs/reviews/parent.md'
        self.work_path = 'docs/work_orders/work.md'
        self.return_path = 'docs/reviews/return.md'
        self.grant_path = 'docs/baselines/grant.md'
        self.contract_path = 'docs/baselines/contract.md'
        self.operator_path = 'docs/reviews/operator.md'
        self.design_path = 'docs/baselines/design.md'
        self.source_path = 'docs/reviews/source.md'
        self.proof_path = 'docs/reviews/proof.md'
        self.counts = {'partialReadyClosures': 1, 'reviewerScopeExpansions': 1,
                       'sameClaimCorrections': 0, 'nonDecreasingBlockerTransitions': 1}
        self.blockers = ['B1', 'B2']
        self.parent = {'schemaVersion': scec.SCEC_SCHEMA_VERSION, 'problemKey': 'generic',
            'chainMode': 'INITIAL', 'chainOrdinal': 0, 'predecessor': None,
            'blockerDelta': {'prior': [], 'resolved': [], 'retained': [], 'new': self.blockers,
                             'reopened': [], 'current': self.blockers},
            'counters': self.counts, 'claims': [], 'requiredDisposition': 'ROOT_CONTRACT_REQUIRED',
            'successorScope': 'INTEGRATED_ROOT_CONTRACT'}
        self.put(self.parent_path, block_text(self.parent))
        self.put(self.operator_path, ('approved ' + self.work_path + '\n').encode())
        self.put(self.design_path, b'DESIGN B1 B2 unique-design\n')
        self.put(self.source_path, b'SOURCE B1 B2 unique-source\n')
        self.put(self.proof_path, b'proof-one\nproof-two\n')
        self.pin = {'path': self.parent_path, 'sha256': sha(self.get(self.parent_path)),
                    'chainOrdinal': 0, 'blockers': self.blockers, 'counters': self.counts}
        ref = lambda path, loc: {'path': path, 'sha256': sha(self.get(path)), 'locator': loc}
        self.contract = {'schemaVersion': admission.SOURCE_CONTRACT, 'status': 'ACCEPTED_BY_LOCAL',
            'decisionOwner': 'LOCAL', 'scope': 'SOURCE_REPAIR_ONLY', 'problemKey': 'generic',
            'predecessor': self.pin, 'obligations': [
                {'blockerId': b, 'disposition': 'RETENTION_NO_OUTCOME_RESOLUTION',
                 'designEvidence': ref(self.design_path, 'unique-design'),
                 'sourceEvidence': ref(self.source_path, 'unique-source'),
                 'remainderOwner': 'LOCAL product owner'} for b in self.blockers]}
        self.put(self.contract_path, fence('source-repair-contract-json', self.contract))
        self.grant = {'schemaVersion': admission.SOURCE_GRANT,
            'status': 'ACCEPTED_FOR_ONE_BOUNDED_SOURCE_REPAIR_PAIR', 'decisionOwner': 'LOCAL',
            'operatorInstructionEvidence': ref(self.operator_path, 'approved'),
            'route': 'SOURCE_REPAIR_ONLY', 'problemKey': 'generic', 'predecessor': self.pin,
            'sourceContract': {'path': self.contract_path, 'sha256': sha(self.get(self.contract_path))},
            'workOrderPath': self.work_path, 'workerReturnPath': self.return_path,
            'allowedArtifacts': [self.return_path, self.proof_path],
            'effectCeilings': {key: 0 for key in admission.EFFECT_FIELDS},
            'issuedAtUtc': '2026-10-30T23:00:00Z', 'expiresAtUtc': '2026-10-31T02:00:00Z'}
        self.ledger = {'schemaVersion': 'cvf.workOrderAcceptanceLedger@1.0.0',
            'requirements': [{'requirementId': 'R1', 'mandatory': True,
                              'expectedArtifacts': [self.return_path, self.proof_path],
                              'requiredProofIds': ['P1', 'P2']}],
            'proofCatalog': [{'proofId': 'P1', 'kind': 'COMMAND', 'locator': 'proof-one'},
                             {'proofId': 'P2', 'kind': 'COMMAND', 'locator': 'proof-two'}]}
        self.rebuild()

    def put(self, path, content):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def get(self, path):
        return (self.root / path).read_bytes()

    def rebuild(self):
        self.put(self.contract_path, fence('source-repair-contract-json', self.contract))
        self.grant['sourceContract']['sha256'] = sha(self.get(self.contract_path))
        self.put(self.grant_path, fence('source-repair-admission-json', self.grant))
        pointer = {'schemaVersion': admission.SOURCE_POINTER, 'path': self.grant_path,
                   'sha256': sha(self.get(self.grant_path)), 'stage': 'DISPATCH'}
        delta = {'prior': self.blockers, 'resolved': [], 'retained': self.blockers,
                 'new': [], 'reopened': [], 'current': self.blockers}
        self.dispatch = {'schemaVersion': scec.SCEC_SCHEMA_VERSION, 'problemKey': 'generic',
            'chainMode': 'SUCCESSOR', 'chainOrdinal': self.pin['chainOrdinal'] + 1,
            'predecessor': {'path': self.parent_path, 'sha256': self.pin['sha256']},
            'blockerDelta': copy.deepcopy(delta), 'counters': {**self.counts, 'nonDecreasingBlockerTransitions': 2},
            'resolutionEvidence': {}, 'claims': [], 'requiredDisposition': 'ROOT_CONTRACT_REQUIRED',
            'successorScope': 'INTEGRATED_ROOT_CONTRACT', 'rootContractAdmission': pointer}
        work = fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch)
        self.put(self.work_path, work)
        claims = [{'claimId': 'C' + str(i), 'claimClass': 'SCHEMA_COMPATIBILITY',
                   'proofClass': 'EXECUTABLE_BUILDER_VALIDATOR_CONTRACT_TEST',
                   'evidenceRef': self.proof_path} for i in (1, 2)]
        self.returned = {**copy.deepcopy(self.dispatch), 'chainOrdinal': self.pin['chainOrdinal'] + 2,
            'predecessor': {'path': self.work_path, 'sha256': sha(work)},
            'counters': {**self.counts, 'nonDecreasingBlockerTransitions': 3},
            'claims': claims, 'requiredDisposition': 'STOP_REASSESS_ARCHITECTURE',
            'successorScope': 'NO_SUCCESSOR', 'rootContractAdmission': {**pointer, 'stage': 'RETURN'},
            'sourceRepairEvidence': {'P' + str(i): {'claimId': 'C' + str(i), 'evidencePath': self.proof_path,
                 'sha256': sha(self.get(self.proof_path)), 'locator': 'proof-' + ('one' if i == 1 else 'two')}
                 for i in (1, 2)}}
        self.write_return()

    def write_return(self, evidence=None):
        evidence = evidence or {'schemaVersion': 'cvf.workOrderAcceptanceEvidence@1.0.0',
            'executionBaseHead': 'abcdef0', 'results': [{'requirementId': 'R1', 'status': 'PASS',
             'actualArtifacts': [self.return_path, self.proof_path], 'proofRefs': ['P1', 'P2']}]}
        self.put(self.return_path, b'Status: COMPLETE_PENDING_REVIEW\n' +
                 fence('acceptance-evidence-json', evidence) + block_text(self.returned))

    def codes(self, path):
        report = scec.diagnose_file(path, self.get(path).decode(), require_block=True)
        self.assertEqual(report.block_count, 1)
        return {v.code for _, v in report.violations}

    def test_valid_pair_and_retained_blockers(self):
        self.assertEqual(self.codes(self.work_path), set())
        self.assertEqual(self.codes(self.return_path), set())
        self.assertEqual(self.returned['blockerDelta']['current'], self.blockers)
        self.assertEqual(self.returned['requiredDisposition'], 'STOP_REASSESS_ARCHITECTURE')

    def test_grant_mutations_fail_closed(self):
        for key, value in [('route', 'OTHER'), ('problemKey', 'wrong'),
                           ('issuedAtUtc', '2026-10-31T00:00:01Z'),
                           ('expiresAtUtc', '2026-10-31T00:00:00Z'),
                           ('expiresAtUtc', '2026-10-31T04:00:01Z')]:
            with self.subTest(key=key, value=value):
                before = copy.deepcopy(self.grant)
                self.grant[key] = value
                self.rebuild()
                self.assertTrue(self.codes(self.work_path))
                self.grant = before
        for key in admission.EFFECT_FIELDS:
            with self.subTest(effect=key):
                self.grant['effectCeilings'][key] = False
                self.rebuild()
                self.assertTrue(self.codes(self.work_path))
                self.grant['effectCeilings'][key] = 0

    def test_return_binding_mutations_fail_closed(self):
        for change in ('missing', 'extra', 'hash', 'locator', 'claim', 'self', 'ready'):
            with self.subTest(change=change):
                self.rebuild()
                if change == 'missing': self.returned['sourceRepairEvidence'].pop('P1')
                if change == 'extra': self.returned['sourceRepairEvidence']['P3'] = {}
                if change == 'hash': self.returned['sourceRepairEvidence']['P1']['sha256'] = '0' * 64
                if change == 'locator': self.returned['sourceRepairEvidence']['P1']['locator'] = 'proof-two'
                if change == 'claim': self.returned['sourceRepairEvidence']['P1']['claimId'] = 'C2'
                if change == 'self': self.returned['sourceRepairEvidence']['P1']['evidencePath'] = self.return_path
                if change == 'ready': self.returned['requiredDisposition'] = 'READY_WITH_EXECUTABLE_PROOF'
                self.write_return()
                self.assertTrue(self.codes(self.return_path))

    def test_unsafe_nested_arrays_and_expiry_fail(self):
        for value in ([{}], ['P1', 'P1'], ['P1', 'P2', 'extra']):
            self.rebuild()
            ev = {'schemaVersion': 'cvf.workOrderAcceptanceEvidence@1.0.0',
                  'executionBaseHead': 'abcdef0', 'results': [{'requirementId': 'R1', 'status': 'PASS',
                  'actualArtifacts': [self.return_path, self.proof_path], 'proofRefs': value}]}
            self.write_return(ev)
            self.assertTrue(self.codes(self.return_path))
        self.rebuild()
        with patch.object(admission, '_utc_now', return_value=self.now + timedelta(hours=2)):
            self.assertTrue(self.codes(self.return_path))

    def test_ledger_topology_and_raw_pins_rejected(self):
        for kind in ('optional', 'repeated', 'orphan', 'self_only', 'duplicate_locator', 'bad_array'):
            with self.subTest(kind=kind):
                before = copy.deepcopy(self.ledger)
                if kind == 'optional': self.ledger['requirements'][0]['mandatory'] = False
                if kind == 'repeated': self.ledger['requirements'][0]['requiredProofIds'] = ['P1', 'P1']
                if kind == 'orphan': self.ledger['proofCatalog'].append({'proofId': 'P3', 'kind': 'COMMAND', 'locator': 'other'})
                if kind == 'self_only': self.ledger['requirements'][0]['expectedArtifacts'] = [self.return_path]
                if kind == 'duplicate_locator': self.ledger['proofCatalog'][1]['locator'] = 'proof-one'
                if kind == 'bad_array': self.ledger['requirements'][0]['requiredProofIds'] = [{}]
                self.rebuild()
                self.assertTrue(self.codes(self.work_path))
                self.ledger = before
        self.rebuild()
        self.put(self.design_path, b'tampered')
        self.assertTrue(self.codes(self.work_path))

    def test_pointer_and_state_mutations_rejected(self):
        for kind in ('counter', 'blocker', 'ordinal', 'readiness', 'resolution', 'wrong_path'):
            with self.subTest(kind=kind):
                self.rebuild()
                if kind == 'counter': self.dispatch['counters']['partialReadyClosures'] = 0
                if kind == 'blocker': self.dispatch['blockerDelta']['current'] = ['B1']
                if kind == 'ordinal': self.dispatch['chainOrdinal'] = 7
                if kind == 'readiness': self.dispatch['outcomeBinding'] = {'operatorAction': 'INVITE_ACCEPTANCE', 'readiness': None}
                if kind == 'resolution': self.dispatch['resolutionEvidence'] = {'B1': {}}
                if kind == 'wrong_path': self.dispatch['rootContractAdmission']['path'] = '../grant.md'
                self.put(self.work_path, fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch))
                self.assertTrue(self.codes(self.work_path))

    def test_missing_source_obligations_and_writable_authority_rejected(self):
        self.contract['obligations'].pop()
        self.rebuild()
        self.assertTrue(self.codes(self.work_path))
        self.contract['obligations'].append(copy.deepcopy(self.contract['obligations'][0]))
        self.contract['obligations'][1]['blockerId'] = 'B2'
        self.grant['allowedArtifacts'].append(self.operator_path)
        self.rebuild()
        self.assertTrue(self.codes(self.work_path))

    def test_nonfinite_or_duplicate_grant_and_replay_fail(self):
        self.rebuild()
        original = self.get(self.grant_path)
        duplicate = original.replace(b'{"schemaVersion":', b'{"schemaVersion": "duplicate", "schemaVersion":', 1)
        self.put(self.grant_path, duplicate)
        self.assertTrue(self.codes(self.work_path))
        self.put(self.grant_path, original)
        self.returned['chainOrdinal'] += 1
        self.write_return()
        self.assertTrue(self.codes(self.return_path))

    def test_pinned_identity_and_contract_failures(self):
        for kind in ('sha', 'source_hash', 'operator_hash', 'missing_blocker', 'wrong_disposition', 'no_owner', 'source_path'):
            with self.subTest(kind=kind):
                before_g, before_c = copy.deepcopy(self.grant), copy.deepcopy(self.contract)
                if kind == 'sha': self.pin['sha256'] = '0' * 64
                if kind == 'source_hash': self.contract['obligations'][0]['sourceEvidence']['sha256'] = '0' * 64
                if kind == 'operator_hash': self.grant['operatorInstructionEvidence']['sha256'] = '0' * 64
                if kind == 'missing_blocker': self.contract['obligations'].pop()
                if kind == 'wrong_disposition': self.contract['obligations'][0]['disposition'] = 'RESOLVED'
                if kind == 'no_owner': self.contract['obligations'][0]['remainderOwner'] = ''
                if kind == 'source_path': self.contract['obligations'][0]['sourceEvidence']['path'] = '../secret'
                self.rebuild()
                self.assertTrue(self.codes(self.work_path))
                self.grant, self.contract = before_g, before_c
                self.pin = self.grant['predecessor']
        self.rebuild()

    def test_return_nested_shapes_and_exact_proof_set(self):
        for kind in ('actual_object', 'duplicate_actual', 'missing_proof', 'extra_proof', 'other_row', 'wrong_claim', 'non_source'):
            with self.subTest(kind=kind):
                self.rebuild()
                ev = {'schemaVersion': 'cvf.workOrderAcceptanceEvidence@1.0.0',
                    'executionBaseHead': 'abcdef0', 'results': [{'requirementId': 'R1', 'status': 'PASS',
                    'actualArtifacts': [self.return_path, self.proof_path], 'proofRefs': ['P1', 'P2']}]}
                if kind == 'actual_object': ev['results'][0]['actualArtifacts'] = [{}]
                if kind == 'duplicate_actual': ev['results'][0]['actualArtifacts'].append(self.proof_path)
                if kind == 'missing_proof': ev['results'][0]['proofRefs'] = ['P1']
                if kind == 'extra_proof': ev['results'][0]['proofRefs'].append('P3')
                if kind == 'other_row': ev['results'][0]['requirementId'] = 'R2'
                if kind == 'wrong_claim': self.returned['claims'][0]['evidenceRef'] = self.return_path
                if kind == 'non_source': self.returned['claims'][0]['claimClass'] = 'DOCUMENTATION_ONLY'
                self.write_return(ev)
                self.assertTrue(self.codes(self.return_path))

    def test_pointer_malformed_and_source_evidence_without_route(self):
        for value in ('bogus', None, {}, {'schemaVersion': admission.SOURCE_POINTER, 'stage': 'DISPATCH'}):
            self.rebuild()
            self.dispatch['rootContractAdmission'] = value
            self.put(self.work_path, fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch))
            self.assertTrue(self.codes(self.work_path))
        self.rebuild()
        self.dispatch.pop('rootContractAdmission')
        self.dispatch['sourceRepairEvidence'] = {}
        self.put(self.work_path, fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch))
        self.assertIn('SOURCE_REPAIR_EVIDENCE_WITHOUT_RETURN', self.codes(self.work_path))

    def test_return_cannot_change_parent_or_grant(self):
        for kind in ('work_pin', 'grant_pin', 'streak', 'resolved', 'refork'):
            self.rebuild()
            if kind == 'work_pin': self.returned['predecessor']['sha256'] = '0' * 64
            if kind == 'grant_pin': self.returned['rootContractAdmission']['sha256'] = '0' * 64
            if kind == 'streak': self.returned['counters']['nonDecreasingBlockerTransitions'] = 2
            if kind == 'resolved':
                self.returned['blockerDelta']['retained'] = ['B2']
                self.returned['blockerDelta']['resolved'] = ['B1']
                self.returned['blockerDelta']['current'] = ['B2']
            if kind == 'refork': self.returned['predecessor']['path'] = self.parent_path
            self.write_return()
            self.assertTrue(self.codes(self.return_path))

    def test_unapproved_and_stop_predecessor_rejected(self):
        self.rebuild()
        self.dispatch.pop('rootContractAdmission')
        self.put(self.work_path, fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch))
        self.assertIn('MISSING_STOP_REASSESS_ESCALATION', self.codes(self.work_path))
        self.parent['requiredDisposition'] = 'STOP_REASSESS_ARCHITECTURE'
        self.put(self.parent_path, block_text(self.parent))
        self.pin['sha256'] = sha(self.get(self.parent_path))
        self.rebuild()
        self.assertTrue(self.codes(self.work_path))

    def test_nonfinite_opt_in_and_worker_return_authority_rejected(self):
        self.rebuild()
        text = self.get(self.work_path).decode().replace('"successorScope": "INTEGRATED_ROOT_CONTRACT"',
            '"unexpected": NaN, "successorScope": "INTEGRATED_ROOT_CONTRACT"')
        self.put(self.work_path, text.encode())
        self.assertIn('ROOT_ADMISSION_JSON_INVALID', self.codes(self.work_path))
        self.contract_path = 'docs/reviews/CVF_FAKE_WORKER_RETURN_CONTRACT.md'
        self.grant['sourceContract']['path'] = self.contract_path
        self.rebuild()
        self.assertTrue(self.codes(self.work_path))
        self.contract_path = 'docs/baselines/contract.md'
        self.grant['sourceContract']['path'] = self.contract_path
        self.grant_path = 'docs/reviews/CVF_FAKE_WORKER_RETURN_GRANT.md'
        self.rebuild()
        self.assertTrue(self.codes(self.work_path))

    def test_source_proof_regular_file_required(self):
        self.rebuild()
        proof = self.root / self.proof_path
        with patch.object(Path, 'is_symlink', autospec=True,
                          side_effect=lambda path: path == proof):
            self.assertTrue(self.codes(self.return_path))
        parent = proof.parent
        with patch.object(Path, 'is_symlink', autospec=True,
                          side_effect=lambda path: path == parent):
            self.assertTrue(self.codes(self.return_path))

    def test_enrolled_held_outcome_cannot_be_dropped(self):
        anchor_path = 'docs/work_orders/anchor.md'
        anchor = copy.deepcopy(self.parent)
        anchor['counters']['nonDecreasingBlockerTransitions'] = 0
        self.put(anchor_path, block_text(anchor))
        anchor_ref = {'path': anchor_path, 'sha256': sha(self.get(anchor_path))}
        self.parent['chainMode'] = 'SUCCESSOR'
        self.parent['chainOrdinal'] = 1
        self.parent['predecessor'] = anchor_ref
        self.parent['blockerDelta'] = {'prior': self.blockers, 'resolved': [], 'retained': self.blockers,
                                      'new': [], 'reopened': [], 'current': self.blockers}
        history = []
        for name in ('failure-a', 'failure-b'):
            path = 'docs/reviews/' + name + '.md'
            self.put(path, name.encode())
            history.append({'path': path, 'sha256': sha(self.get(path))})
        decision_path = 'docs/reviews/decision.json'
        self.put(decision_path, json.dumps({'schemaVersion': 'cvf.outcomeOperatorDecision@1',
            'milestoneId': 'PRODUCT', 'state': 'HELD', 'instruction': 'Explicit fixture hold'}).encode())
        decision = {'path': decision_path, 'sha256': sha(self.get(decision_path))}
        authority = {'path': 'docs/roadmaps/product.md', 'heading': '## Acceptance'}
        self.put('docs/milestone-coverage-authority.json', json.dumps({'milestones': {'PRODUCT': authority}}).encode())
        registry = {'schemaVersion': outcome.SCHEMA, 'outcomes': {'PRODUCT':
            {'authority': authority, 'anchor': anchor_ref, 'history': history,
             'state': 'HELD', 'decision': decision}}}
        self.put(outcome.REGISTRY, json.dumps(registry).encode())
        binding = {'milestoneId': 'PRODUCT', 'anchor': anchor_ref, 'history': history,
                   'operatorAction': 'NONE', 'readiness': None}
        self.parent['outcomeBinding'] = copy.deepcopy(binding)
        self.put(self.parent_path, block_text(self.parent))
        self.pin['sha256'] = sha(self.get(self.parent_path))
        self.pin['chainOrdinal'] = 1
        self.rebuild()
        self.dispatch['outcomeBinding'] = copy.deepcopy(binding)
        self.returned['outcomeBinding'] = copy.deepcopy(binding)
        coverage = fence(outcome.COVERAGE_TAG, {'milestone': {'id': 'PRODUCT'}, 'authority': authority})
        work = fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch) + coverage
        self.put(self.work_path, work)
        self.returned['predecessor']['sha256'] = sha(work)
        evidence = {'schemaVersion': 'cvf.workOrderAcceptanceEvidence@1.0.0',
                    'executionBaseHead': 'abcdef0', 'results': [{'requirementId': 'R1', 'status': 'PASS',
                    'actualArtifacts': [self.return_path, self.proof_path], 'proofRefs': ['P1', 'P2']}]}
        self.put(self.return_path, b'Status: COMPLETE_PENDING_REVIEW\n' +
                 fence('acceptance-evidence-json', evidence) + block_text(self.returned) + coverage)
        self.assertEqual(self.codes(self.work_path), set())
        self.assertEqual(self.codes(self.return_path), set())
        del self.returned['outcomeBinding']
        self.put(self.return_path, b'Status: COMPLETE_PENDING_REVIEW\n' +
                 fence('acceptance-evidence-json', evidence) + block_text(self.returned))
        self.assertTrue(self.codes(self.return_path))
        self.returned['outcomeBinding'] = copy.deepcopy(binding)
        del self.dispatch['outcomeBinding']
        self.put(self.work_path, fence('acceptance-ledger-json', self.ledger) + block_text(self.dispatch))
        self.assertTrue(self.codes(self.work_path))

    def test_cross_row_proof_cannot_use_global_manifest_path(self):
        other = 'docs/reviews/other-proof.md'
        self.put(other, b'proof-one\nproof-two\n')
        self.ledger['requirements'] = [
            {'requirementId': 'R1', 'mandatory': True,
             'expectedArtifacts': [self.return_path, self.proof_path], 'requiredProofIds': ['P1']},
            {'requirementId': 'R2', 'mandatory': True,
             'expectedArtifacts': [other], 'requiredProofIds': ['P2']}]
        self.grant['allowedArtifacts'] = [self.return_path, self.proof_path, other]
        self.rebuild()
        self.returned['claims'][1]['evidenceRef'] = other
        self.returned['sourceRepairEvidence']['P2']['evidencePath'] = other
        self.returned['sourceRepairEvidence']['P2']['sha256'] = sha(self.get(other))
        evidence = {'schemaVersion': 'cvf.workOrderAcceptanceEvidence@1.0.0',
            'executionBaseHead': 'abcdef0', 'results': [
            {'requirementId': 'R1', 'status': 'PASS',
             'actualArtifacts': [self.return_path, self.proof_path], 'proofRefs': ['P1']},
            {'requirementId': 'R2', 'status': 'PASS',
             'actualArtifacts': [other], 'proofRefs': ['P2']}]}
        self.write_return(evidence)
        self.assertEqual(self.codes(self.return_path), set())
        self.returned['claims'][0]['evidenceRef'] = other
        self.returned['sourceRepairEvidence']['P1']['evidencePath'] = other
        self.returned['sourceRepairEvidence']['P1']['sha256'] = sha(self.get(other))
        self.write_return(evidence)
        self.assertTrue(self.codes(self.return_path))

if __name__ == '__main__':
    unittest.main()
