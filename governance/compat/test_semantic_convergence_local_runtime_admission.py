"""Offline end-to-end LOCAL VERIFY contract regression fixtures."""
from __future__ import annotations
import copy, hashlib, json, tempfile, unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
import check_semantic_convergence_control as scec
import semantic_convergence_local_runtime_admission as local
from test_semantic_convergence_root_admission import (PostStopFixture, STOP_PATH, V2_SOURCE_PATH, V2_REASSESS_PATH, V2_GRANT_PATH, V2_WORK_PATH, V2_RETURN_PATH, V2_EP_PATH, _sha, _markdown, _fence)

class LocalVerifyTests(PostStopFixture):
    def setup_local(self):
        self.build()
        for row in self.reassess['obligations']: row['disposition']='RETENTION_NO_OUTCOME_RESOLUTION'
        rr=_fence('root-reassessment-json',self.reassess); self._write(V2_REASSESS_PATH,rr)
        self.grant.pop('effectCeilings'); self.grant['schemaVersion']=local.G
        self.grant['status']='ACCEPTED_FOR_ONE_BOUNDED_LOCAL_VERIFY_PAIR'; self.grant['rootReassessment']={'path':V2_REASSESS_PATH,'sha256':_sha(rr)}
        self.grant['attemptPath']='.cvf/runtime/local-test/attempt'
        self.grant['localEffects']={'localBuildAttempts':1,'localAppStarts':1,'localBrowserSessions':1,'buildNetworkMode':'PUBLIC_UNAUTHENTICATED_BUILD','runtimeNetworkMode':'LOCAL_LOOPBACK_INTERNAL_BRIDGE','providerCalls':0,'publicWrites':0,'deployments':0,'realDataMutations':0,'destructiveActions':0}
        now=datetime.now(timezone.utc).replace(microsecond=0); fmt=lambda x:x.strftime('%Y-%m-%dT%H:%M:%SZ')
        self.grant.update(issuedAtUtc=fmt(now-timedelta(minutes=2)),workCutoffUtc=fmt(now+timedelta(minutes=20)),expiresAtUtc=fmt(now+timedelta(minutes=30)))
        self.write_pair()
    def write_pair(self,outcome='BLOCKED'):
        raw=_fence('post-stop-local-verify-admission-json',self.grant);self._write(V2_GRANT_PATH,raw); gh=_sha(raw)
        d=self.dispatch_block();d['rootContractAdmission']={'schemaVersion':local.P,'path':V2_GRANT_PATH,'sha256':gh,'stage':'DISPATCH'}
        wb=_markdown(d,ledger=self.ledger).encode();self._write(V2_WORK_PATH,wb)
        outcome_body={'schemaVersion':local.R,'attemptPath':self.grant['attemptPath'],'workOrder':{'path':V2_WORK_PATH,'sha256':_sha(wb)},'grant':{'path':V2_GRANT_PATH,'sha256':gh},'outcome':outcome,'observations':{'state':'fixture'}}
        data=json.dumps(outcome_body,indent=2).encode();self._write(V2_EP_PATH,data)
        r=copy.deepcopy(d);r['chainOrdinal']+=1;r['predecessor']={'path':V2_WORK_PATH,'sha256':_sha(wb)};r['counters']['nonDecreasingBlockerTransitions']+=1;r['requiredDisposition']='STOP_REASSESS_ARCHITECTURE';r['successorScope']='NO_SUCCESSOR';r['rootContractAdmission']['stage']='RETURN'
        r['localVerifyEvidence']={'schemaVersion':local.E,'outcome':outcome,'result':{'path':V2_EP_PATH,'sha256':_sha(data),'locator':'"schemaVersion"'},'reason':None if outcome=='OBSERVED' else 'fixture blocker'}
        self._write(V2_RETURN_PATH,_markdown(r).encode());self.dispatch=d;self.returned=r
    def diagnosed(self,path): return scec.diagnose_file(path,(self.root/path).read_text(),require_block=True)
    def test_full_pair_all_outcomes(self):
        self.setup_local()
        for outcome in ('OBSERVED','BLOCKED','NOT_RUN'):
            self.write_pair(outcome)
            for p in (V2_WORK_PATH,V2_RETURN_PATH): self.assertEqual(self.diagnosed(p).violations,(),(outcome,p,self.diagnosed(p).violations))
    def test_invalid_effects_and_missing_binding_fail(self):
        self.setup_local()
        for value in (True,2,-1):
            self.grant['localEffects']['localBuildAttempts']=value;self.write_pair()
            self.assertTrue(self.diagnosed(V2_WORK_PATH).violations)
        self.setup_local();self.returned['localVerifyEvidence']['result']['sha256']='0'*64
        self._write(V2_RETURN_PATH,_markdown(self.returned).encode());self.assertTrue(self.diagnosed(V2_RETURN_PATH).violations)
    def test_historical_grant_does_not_release_after_expiry(self):
        self.setup_local(); now=datetime.now(timezone.utc)
        self.assertFalse(local.live(self.grant,self.root,now=now))
        self.assertTrue(local.live(self.grant,self.root,now=now+timedelta(hours=1)))
        (self.root/self.grant['attemptPath']).mkdir(parents=True)
        self.assertTrue(local.live(self.grant,self.root,now=now))
    def test_predecessor_drift_and_fake_resolution_fail(self):
        self.setup_local();self.dispatch['counters']['nonDecreasingBlockerTransitions']=0
        self._write(V2_WORK_PATH,_markdown(self.dispatch,ledger=self.ledger).encode());self.assertTrue(self.diagnosed(V2_WORK_PATH).violations)
        self.setup_local();self.returned['blockerDelta']['resolved']=[self.blockers[0]];self.returned['blockerDelta']['retained'].remove(self.blockers[0]);self.returned['blockerDelta']['current'].remove(self.blockers[0])
        self._write(V2_RETURN_PATH,_markdown(self.returned).encode());self.assertTrue(self.diagnosed(V2_RETURN_PATH).violations)
    def test_expired_structural_pair_and_later_assessment_preserve_stop(self):
        self.setup_local(); now=datetime.now(timezone.utc).replace(microsecond=0); fmt=lambda x:x.strftime('%Y-%m-%dT%H:%M:%SZ')
        self.grant.update(issuedAtUtc=fmt(now-timedelta(hours=2)),workCutoffUtc=fmt(now-timedelta(hours=1,minutes=40)),expiresAtUtc=fmt(now-timedelta(hours=1,minutes=30)));self.write_pair()
        self.assertEqual(self.diagnosed(V2_RETURN_PATH).violations,())
        later=copy.deepcopy(self.returned); later.pop('rootContractAdmission');later.pop('localVerifyEvidence');later['chainOrdinal']+=1;later['predecessor']={'path':V2_RETURN_PATH,'sha256':_sha((self.root/V2_RETURN_PATH).read_bytes())};later['counters']['nonDecreasingBlockerTransitions']+=1
        path='docs/reviews/CVF_TEST_LATER_ASSESSMENT.md';self._write(path,_markdown(later).encode());codes={v.code for _,v in self.diagnosed(path).violations}
        self.assertIn('SUCCESSOR_AFTER_STOP_REASSESS',codes);self.assertNotIn('PREDECESSOR_BLOCK_INVALID',codes)
    def test_outcome_binding_cannot_change_without_hash_shortcut(self):
        self.setup_local();prev=copy.deepcopy(self.stop_block);prev['outcomeBinding']={'operatorAction':'NONE','readiness':None}
        with patch.object(local,'_owner',return_value=scec._admission):
            violations=local.validate(self.dispatch,V2_WORK_PATH,prev,scec._repo_source_regular_bytes_resolver,scec.validate_work_order)
        self.assertTrue(any('outcome binding' in v.message for v in violations))
    def test_live_marker_quoted_immunity_and_unicode(self):
        prose='Example only: '+local.P+' '+scec.SCEC_SCHEMA_VERSION+' "rootContractAdmission"'
        self.assertFalse(local.attempts_in_fences(prose,scec))
        malformed='```json\n{"schemaVersion":"'+scec.SCEC_SCHEMA_VERSION+'","rootContractAdmission":{"schemaVersion":"'+local.P+'"}\n```'
        self.assertTrue(local.attempts_in_fences(malformed.replace('rootContractAdmission','rootContract\\u0041dmission'),scec))
