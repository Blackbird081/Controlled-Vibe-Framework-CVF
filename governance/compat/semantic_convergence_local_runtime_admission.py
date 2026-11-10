"""One explicitly bound post-STOP LOCAL verification pair; declared-state only."""
from __future__ import annotations
import hashlib, json, re, os
from datetime import datetime, timezone
from importlib import import_module
from pathlib import Path, PurePosixPath

P = 'cvf.scecPostStopLocalVerifyPointer@1.0.0'
G = 'cvf.scecPostStopLocalVerify@1.0.0'
E = 'cvf.scecLocalVerifyEvidence@1.0.0'
R = 'cvf.scecLocalVerifyResult@1.0.0'
FENCE = re.compile(r'(?ms)^ {0,3}`{3}post-stop-local-verify-admission-json[ \t]*\r?\n(.*?)\r?\n {0,3}`{3}[ \t]*\r?$')
FIELDS = {'schemaVersion','status','decisionOwner','operatorInstructionEvidence','problemKey','predecessor','rootReassessment','sourceContract','workOrderPath','workerReturnPath','allowedArtifacts','attemptPath','localEffects','issuedAtUtc','workCutoffUtc','expiresAtUtc'}
EFFECTS = {'localBuildAttempts','localAppStarts','localBrowserSessions','buildNetworkMode','runtimeNetworkMode','providerCalls','publicWrites','deployments','realDataMutations','destructiveActions'}
HELD = ('providerCalls','publicWrites','deployments','realDataMutations','destructiveActions')
LOCAL = ('localBuildAttempts','localAppStarts','localBrowserSessions')

def _owner(): return import_module((f'{__package__}.' if __package__ else '')+'semantic_convergence_root_admission')
def pointer(block):
    p=block.get('rootContractAdmission')
    return p if isinstance(p,dict) and p.get('schemaVersion')==P else None

def _time(value,a):
    a._need(isinstance(value,str) and a.CANONICAL_UTC_RE.fullmatch(value),'EXPIRED','canonical UTC required')
    try: return datetime.fromisoformat(value.replace('Z','+00:00'))
    except ValueError: raise a._Reject('EXPIRED','invalid UTC') from None

def _attempt_path(value,a):
    a._need(isinstance(value,str) and value.startswith('.cvf/runtime/') and a.safe_path(value)
            and PurePosixPath(value).as_posix()==value and len(PurePosixPath(value).parts)>=3,'PATH','invalid attempt path')

def _check(block,artifact,previous,resolver,ledger):
    a=_owner(); p=pointer(block)
    a._need(p is not None and set(p)=={'schemaVersion','path','sha256','stage'} and a.safe_path(p['path']) and a._is_sha(p['sha256']) and p['stage'] in ('DISPATCH','RETURN'),'POINTER','invalid pointer')
    a._need(a.safe_path(artifact) and callable(resolver) and isinstance(previous,dict) and callable(ledger),'CONTEXT','actual resolvers required')
    grant=a._authority_json({'path':p['path'],'sha256':p['sha256']},resolver,FENCE,'GRANT')
    a._need(set(grant)==FIELDS and grant['schemaVersion']==G and grant['status']=='ACCEPTED_FOR_ONE_BOUNDED_LOCAL_VERIFY_PAIR' and grant['decisionOwner']=='LOCAL' and grant['problemKey']==block['problemKey'],'GRANT','invalid local grant')
    stop=a._stop_pin(grant['predecessor']); source=grant['sourceContract']
    op,_=a._located(grant['operatorInstructionEvidence'],resolver,'EVIDENCE')
    a._need(a._object_ref(source) and source['path'].startswith('docs/baselines/'),'SOURCE','invalid source contract')
    a._pinned_text(source['path'],source['sha256'],resolver,'SOURCE',roots=('docs/baselines/',))
    ref=grant['rootReassessment']; a._need(a._object_ref(ref) and ref['path'].startswith(a.GOVERNED_ROOTS) and '_WORKER_RETURN_' not in ref['path'],'REASSESSMENT','invalid owner')
    doc=a._authority_json(ref,resolver,a.POST_STOP_REASSESSMENT_FENCE_RE,'REASSESSMENT')
    a._need(set(doc)==a.POST_STOP_REASSESSMENT_FIELDS and doc['schemaVersion']==a.POST_STOP_REASSESSMENT_SCHEMA and doc['status']==a.POST_STOP_REASSESSMENT_STATUS and doc['decisionOwner']=='LOCAL' and doc['scope']=='INTEGRATED_ROOT_CONTRACT' and doc['problemKey']==grant['problemKey'] and doc['stoppedPredecessor']=={'path':stop['path'],'sha256':stop['sha256']} and doc['sourceContract']==source,'REASSESSMENT','identity mismatch')
    rows=doc['obligations']; a._need(isinstance(rows,list) and rows and all(isinstance(x,dict) and set(x)=={'blockerId','disposition','designEvidence','sourceEvidence'} and x['disposition']=='RETENTION_NO_OUTCOME_RESOLUTION' for x in rows),'REASSESSMENT','retention required')
    ids=[x['blockerId'] for x in rows]; a._need(len(set(ids))==len(ids) and set(ids)==set(stop['blockers']),'REASSESSMENT','blocker coverage mismatch')
    authority={p['path'],source['path'],op['path'],stop['path'],ref['path']}
    for row in rows:
        design,_=a._located(row['designEvidence'],resolver,'REASSESSMENT',roots=('docs/baselines/',)); evidence,text=a._located(row['sourceEvidence'],resolver,'REASSESSMENT',roots=('docs/reviews/',))
        a._need(design['path']==source['path'] and design['sha256']==source['sha256'] and row['blockerId'] in text,'REASSESSMENT','obligation evidence mismatch'); authority.add(evidence['path'])
    a._pinned_text(stop['path'],stop['sha256'],resolver,'STOP'); work=grant['workOrderPath']; ret=grant['workerReturnPath']; allowed=grant['allowedArtifacts']
    a._need(len({p['path'],source['path'],op['path'],stop['path'],ref['path']})==5 and a.safe_path(work) and work.startswith('docs/work_orders/') and work.endswith('.md') and a.safe_path(ret) and ret.startswith('docs/reviews/') and ret.endswith('.md') and work!=ret and work not in authority and ret not in authority,'PATH','authority paths collide')
    a._need(isinstance(allowed,list) and allowed and all(a.safe_path(x) for x in allowed) and len(allowed)==len(set(allowed)) and ret in allowed and work not in allowed and not authority.intersection(allowed),'MANIFEST','invalid artifact manifest')
    work_bytes=a._read_bound(work,resolver); a._need(isinstance(work_bytes,bytes) and len(work_bytes)<=a.MAX_EVIDENCE_BYTES,'WORK_ORDER','unreadable work order')
    obj,issues=ledger(work_bytes.decode('utf-8','strict')); a._need(obj is not None and not issues and set(allowed)=={x for row in obj['requirements'] for x in row['expectedArtifacts']},'MANIFEST','ledger mismatch')
    effects=grant['localEffects']; a._need(isinstance(effects,dict) and set(effects)==EFFECTS and all(type(effects[x]) is int and effects[x] in (0,1) for x in LOCAL) and all(type(effects[x]) is int and effects[x]==0 for x in HELD),'EFFECT','invalid local or held ceilings')
    a._need(effects['buildNetworkMode'] in ('NONE','PUBLIC_UNAUTHENTICATED_BUILD') and effects['runtimeNetworkMode'] in ('NONE','LOCAL_LOOPBACK_INTERNAL_BRIDGE') and (effects['localBuildAttempts'] or effects['buildNetworkMode']=='NONE') and (effects['localAppStarts'] or effects['localBrowserSessions'] or effects['runtimeNetworkMode']=='NONE'),'EFFECT','invalid network mode')
    _attempt_path(grant['attemptPath'],a); issued,cutoff,expiry=(_time(grant[x],a) for x in ('issuedAtUtc','workCutoffUtc','expiresAtUtc')); a._need(issued<cutoff<expiry and (expiry-issued).total_seconds()<=3600,'EXPIRED','invalid finite window')
    a._need(('outcomeBinding' in block)==('outcomeBinding' in previous) and block.get('outcomeBinding')==previous.get('outcomeBinding'),'CHAIN','outcome binding drift')
    if 'outcomeBinding' in block:
        binding=block['outcomeBinding']; a._need(isinstance(binding,dict) and binding.get('operatorAction')=='NONE' and binding.get('readiness') is None,'CHAIN','outcome must stay held')
    stage=p['stage']; delta=block['blockerDelta']; counters=block['counters']; pin=stop['counters']; blockers=set(stop['blockers'])
    a._need(set(delta['prior'])==blockers and set(delta['current'])==blockers and set(delta['retained'])==blockers and not (delta['resolved'] or delta['new'] or delta['reopened']) and not block.get('resolutionEvidence') and all(counters[x]==pin[x] for x in a.COUNTER_FIELDS[:3]) and counters['nonDecreasingBlockerTransitions']==pin['nonDecreasingBlockerTransitions']+(1 if stage=='DISPATCH' else 2),'CHAIN','history/counters not retained')
    if stage=='DISPATCH':
        a._need(artifact==work and block['predecessor']=={'path':stop['path'],'sha256':stop['sha256']} and previous.get('problemKey')==grant['problemKey'] and previous.get('chainOrdinal')==stop['chainOrdinal'] and previous.get('counters')==pin and set(previous.get('blockerDelta',{}).get('current',[]))==blockers and previous.get('requiredDisposition')=='STOP_REASSESS_ARCHITECTURE' and previous.get('successorScope')=='NO_SUCCESSOR' and block['chainOrdinal']==stop['chainOrdinal']+1 and block['requiredDisposition']=='ROOT_CONTRACT_REQUIRED' and block['successorScope']=='INTEGRATED_ROOT_CONTRACT' and not block.get('localVerifyEvidence'),'DISPATCH','invalid stopped successor')
        a._need(not any(a.RUNTIME_READINESS_CLAIM_RE.search(str(x.get('evidenceRef',''))) for x in block['claims']),'DISPATCH','readiness claim forbidden')
    else:
        a._need(artifact==ret and block['predecessor']=={'path':work,'sha256':hashlib.sha256(work_bytes).hexdigest()} and previous.get('rootContractAdmission')=={**p,'stage':'DISPATCH'} and previous.get('chainOrdinal')==stop['chainOrdinal']+1 and block['chainOrdinal']==stop['chainOrdinal']+2 and block['requiredDisposition']=='STOP_REASSESS_ARCHITECTURE' and block['successorScope']=='NO_SUCCESSOR','RETURN','invalid return successor')
        ev=block.get('localVerifyEvidence'); a._need(isinstance(ev,dict) and set(ev)=={'schemaVersion','outcome','result','reason'} and ev['schemaVersion']==E and ev['outcome'] in ('OBSERVED','BLOCKED','NOT_RUN'),'RETURN','invalid result')
        a._need((ev['reason'] is None if ev['outcome']=='OBSERVED' else isinstance(ev['reason'],str) and 0<len(ev['reason'].strip())<=500),'RETURN','invalid result reason')
        target,text=a._located(ev['result'],resolver,'PROOF',roots=('',)); a._need(target['path'] in allowed and target['path'] not in authority|{work,ret},'PROOF','result path not independent')
        try: result=json.loads(text,object_pairs_hook=a._no_duplicates,parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))
        except ValueError: raise a._Reject('PROOF','invalid result JSON') from None
        a._need(isinstance(result,dict) and set(result)=={'schemaVersion','attemptPath','workOrder','grant','outcome','observations'} and result['schemaVersion']==R and result['attemptPath']==grant['attemptPath'] and result['workOrder']=={'path':work,'sha256':hashlib.sha256(work_bytes).hexdigest()} and result['grant']=={'path':p['path'],'sha256':p['sha256']} and result['outcome']==ev['outcome'] and isinstance(result['observations'],dict) and bool(result['observations']),'PROOF','result identity mismatch')
    return grant

def validate(block,artifact,previous,resolver,ledger):
    a=_owner()
    try: _check(block,artifact,previous,resolver,ledger); return []
    except a._Reject as exc: return [exc.violation]
    except (ValueError,TypeError,KeyError,UnicodeError,AttributeError): return [a.BlockViolation('ROOT_ADMISSION_V2_LOCAL','malformed local admission')]

def live(grant,root,now=None):
    a=_owner()
    try:
        now=now or datetime.now(timezone.utc); issued,cutoff,expiry=(_time(grant[x],a) for x in ('issuedAtUtc','workCutoffUtc','expiresAtUtc'))
        a._need(issued<=now<cutoff<expiry,'EXPIRED','live release outside window'); value=grant['attemptPath']; _attempt_path(value,a)
        target=Path(root)/PurePosixPath(value); base=Path(root).resolve(); a._need(target.parent.resolve().is_relative_to(base),'PATH','outside root')
        for part in (target,*target.parents):
            if part==Path(root): break
            try: info=part.lstat()
            except FileNotFoundError: continue
            a._need(not part.is_symlink() and not getattr(info,'st_file_attributes',0)&0x400 and not (hasattr(part,'is_junction') and part.is_junction()),'PATH','reparse path refused')
        a._need(not target.exists(),'ATTEMPT','attempt already reserved'); return []
    except a._Reject as exc: return [exc.violation]
    except (ValueError,KeyError,OSError,TypeError): return [a.BlockViolation('ROOT_ADMISSION_V2_LOCAL','invalid live release')]


def attempts_in_fences(text, scec):
    """Only real eligible fences opt in; quoted prose stays inert."""
    for language, body in scec._iter_fenced_blocks(text):
        if language not in ("", "json"):
            continue
        decoded = scec._decode_json_unicode_escapes(body)
        if P in decoded and scec.SCEC_SCHEMA_VERSION in decoded and '"rootContractAdmission"' in decoded:
            return True
    return False
