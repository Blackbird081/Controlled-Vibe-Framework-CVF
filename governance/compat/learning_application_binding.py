"""F2G learning enrollment and dispatch plans. Declared joins, never semantic acceptance."""
from __future__ import annotations
import re
from pathlib import Path
from typing import Any
try:
    from parent_learning_evidence import _safe_file, strict_json_loads, validate_parent_evidence
except ModuleNotFoundError:
    from governance.compat.parent_learning_evidence import _safe_file, strict_json_loads, validate_parent_evidence

REGISTRY = 'docs/reference/downstream_gate_profile/downstream_finding_intake_registry.json'
HOME = 'docs/reviews/learnings/'
BLOCK = re.compile(r'^```learning-application-plan-json[ \t]*\r?\n(.*?)^```[ \t]*$', re.M | re.S)
SCHEMA = 'cvf.learningApplicationPlan@1.0.0'

def issue(path: str, code: str, message: str) -> dict[str, str]:
    return dict(path=path, type=code, message=message)

def find_rows(root: Path) -> tuple[list[dict], list[dict]]:
    target, err = _safe_file(root, REGISTRY)
    if target is None:
        return [], [issue(REGISTRY, 'application_registry_invalid', err)]
    try:
        data = strict_json_loads(target.read_bytes())
        rows = [f for e in data['entries'] for f in e['findings']]
        if any(not isinstance(f, dict) for f in rows):
            raise ValueError('findings must be objects')
    except (OSError, ValueError, TypeError, KeyError) as exc:
        return [], [issue(REGISTRY, 'application_registry_invalid', str(exc))]
    errors, selected = [], []
    ids = [f.get('id') for f in rows]
    for f in rows:
        if 'dispatchBindingRequired' not in f:
            continue
        if type(f['dispatchBindingRequired']) is not bool:
            errors.append(issue(REGISTRY, 'dispatch_obligation_invalid', 'dispatchBindingRequired must be boolean'))
            continue
        if f['dispatchBindingRequired'] is False:
            continue
        fid, record, pe = f.get('id'), f.get('learningRecordPath'), f.get('parentEvidence')
        if not isinstance(fid,str) or not fid.strip() or ids.count(fid) != 1:
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','obligation ID must be globally unique'))
            continue
        if not isinstance(record,str) or not record.startswith(HOME) or not record.endswith('.md') or '/archive/' in record:
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','obligation needs an active learningRecordPath'))
            continue
        typed_issues = validate_parent_evidence(pe, fid, root)
        if typed_issues:
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','obligation parent evidence invalid: '+typed_issues[0]['message']))
            continue
        if pe['decision']['state'] not in ('ACCEPT','MERGE'):
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','obligation needs typed ACCEPT/MERGE evidence'))
            continue
        refs = pe.get('implementation',{}).get('evidence',[])
        controls = [r for r in refs if isinstance(r,dict) and str(r.get('fragment','')).startswith('control:')]
        if pe.get('implementation',{}).get('state') != 'IMPLEMENTED_BOUNDED' or len(controls) != 1:
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','obligation needs exactly one implemented control'))
            continue
        source = pe.get('source',{}).get('evidence',{})
        if source.get('path') != record:
            errors.append(issue(REGISTRY,'dispatch_obligation_invalid','learningRecordPath must join the typed source'))
            continue
        selected.append(dict(id=fid, record=record, control={k:controls[0][k] for k in ('path','sha256')}))
    return selected, errors

def is_record(path: str, text: str) -> bool:
    return (path.startswith(HOME) and path.endswith('.md') and '/archive/' not in path
            and Path(path).name not in ('README.md','LEARNING_RECORD_TEMPLATE.md')
            and not Path(path).name.endswith('_TEMPLATE.md'))

def validate_changed(root: Path, path: str, text: str) -> list[dict[str,str]]:
    """Forward-only: caller invokes only for new/content-changed governed artifacts."""
    if '/archive/' in path:
        return []
    record = is_record(path,text)
    order = path.startswith('docs/work_orders/') and path.endswith('.md') and bool(re.search(r'^docType:\s*work_order\s*$',text,re.M))
    if not (record or order):
        return []
    rows, errors = find_rows(root)
    if errors:
        return errors
    if record:
        # Use exact metadata declarations outside code fences, not quoted template examples.
        visible = re.sub(r'^```[^\n]*\n.*?^```[^\n]*$', '', text, flags=re.M|re.S)
        ids = re.findall(r'^parentFindingId:\s*(\S+)\s*$',visible,re.M)
        if len(ids) != 1:
            return [issue(path,'learning_not_enrolled','learning needs exactly one parentFindingId in the existing parent registry')]
        target, err = _safe_file(root,REGISTRY)
        if target is None:
            return [issue(path,'learning_not_enrolled',err)]
        allrows = [f for e in strict_json_loads(target.read_bytes())['entries'] for f in e['findings']]
        matches = [f for f in allrows if f.get('id') == ids[0] and isinstance(f.get('parentEvidence'),dict)
                   and f['parentEvidence'].get('source',{}).get('evidence',{}).get('path') == path]
        if len(matches) != 1:
            return [issue(path,'learning_not_enrolled','parentFindingId must join one typed source record at this path')]
        return []  # Parent validator independently verifies every pin/state/receipt.
    if not rows:
        return []
    blocks = BLOCK.findall(text)
    if len(blocks) != 1:
        return [issue(path,'learning_plan_missing','dispatch needs exactly one learning-application-plan-json block')]
    try:
        plan = strict_json_loads(blocks[0].encode('utf-8'))
        if set(plan) != {'schemaVersion','bindings'} or plan['schemaVersion'] != SCHEMA or not isinstance(plan['bindings'],list):
            raise ValueError('invalid closed-shape plan')
        bindings = plan['bindings']
        if any(not isinstance(b,dict) or set(b) != {'findingId','control','action','verificationPlan'} for b in bindings):
            raise ValueError('invalid binding shape')
    except (ValueError, TypeError, KeyError) as exc:
        return [issue(path,'learning_plan_invalid',str(exc))]
    required = {r['id']:r for r in rows}
    seen = set()
    for b in bindings:
        fid = b['findingId']
        if not isinstance(fid,str) or fid in seen or fid not in required:
            errors.append(issue(path,'learning_plan_invalid','binding ID missing, duplicate or unregistered'))
            continue
        seen.add(fid)
        if b['control'] != required[fid]['control']:
            errors.append(issue(path,'learning_control_drift',f'{fid} control path/hash differs from registry'))
        for key in ('action','verificationPlan'):
            if not isinstance(b[key],str) or not b[key].strip() or b[key].strip().upper() in ('TODO','TBD','N/A','NONE','UNKNOWN'):
                errors.append(issue(path,'learning_plan_invalid',f'{fid} {key} needs a concrete statement'))
    if set(required) != seen:
        errors.append(issue(path,'learning_obligation_omitted','dispatch did not bind all active registry obligations'))
    return errors
