#!/usr/bin/env python3
"""Changed-work-order admission for declared local transaction proof plans.

This static guard checks contract completeness, not runtime truth. It includes
staged, unstaged and untracked work orders plus an optional committed range.
Unchanged historical artifacts and other document families are not evaluated.
"""
from __future__ import annotations

import argparse
import datetime as dt
import ntpath
import json
import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
APPLICABILITY = "High-Risk Local Transaction Proof Applicability"
CONTRACT_HEADING = "High-Risk Local Transaction Proof Contract"
REQUIRED_FIELDS = (
    "transactionTarget", "productionPathPeer", "deterministicBarrierProtocol",
    "enteredBeforeReleaseOracle", "postAcquireFailureInjection",
    "semanticSecurityTuple", "rollbackExactness", "finalEvidenceHashBinding",
    "independentProbeRequired",
)
BARRIER_EVENTS = ["READY", "START_ATTEMPT", "ATTEMPTING", "PARENT_RELEASE", "ENTERED", "COMPLETE"]
SECURITY_FIELDS = ["ownerSid", "protectionState", "inheritanceState", "aces"]
ACE_FIELDS = ["sid", "rights", "accessType", "isInherited", "inheritanceFlags", "propagationFlags"]
ADVERSARIES = ["EXTRA_ALLOW", "DENY", "INHERITED", "WRONG_OWNER"]
RISK_PATTERNS = {
    "cross-process locking": re.compile(r"\b(?:cross[- ]process\s+(?:lock\w*|mutex\w*|exclusion)|inter[- ]?process\s+(?:file\s+)?lock\w*|(?:named|process[- ]shared)\s+mutex)\b", re.I),
    "durable mutation with rollback": re.compile(r"\b(?:durable\s+(?:append\w*|writ\w*|mutation)|(?:append\w*|writ\w*)\s+durably)\b[\s\S]*?\brollback\b|\brollback\b[\s\S]*?\bdurable\s+(?:append\w*|writ\w*|mutation)\b", re.I),
    "ownership/DACL mutation": re.compile(r"\b(?:ownership|owner\s+SID|DACL|ACL)\b[\s\S]*?\b(?:mutat\w*|harden\w*|restor\w*|chang\w*|set\w*)\b|\b(?:mutat\w*|harden\w*|restor\w*|chang\w*|set)\b[\s\S]*?\b(?:ownership|owner\s+SID|DACL|ACL)\b", re.I),
    "post-acquire failure": re.compile(r"\bpost[- ]acquir\w*\b[\s\S]*?\b(?:fail\w*|except\w*|inject\w*|cleanup)\b|\b(?:fail\w*|except\w*|inject\w*)\b[\s\S]*?\bafter\s+(?:lock\s+)?acqui\w*\b", re.I),
}
EXCLUDED_HEADINGS = re.compile(
    r"\b(?:examples?|historical|history|references?|source verification|authority|"
    r"claim boundary|forbidden|out.of.scope|negative search|evidence reuse|"
    r"scaffold provenance|checker source read.ahead|learning disposition)\b", re.I,
)
PLACEHOLDER = re.compile(r"\b(?:TODO\w*|TBD|FIXME|PLACEHOLDER|N/?A|UNKNOWN|UNSPECIFIED)\b|<[^>]*>", re.I)


def _meaningful(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip()) and not PLACEHOLDER.search(value)


def _markdown(text: str) -> tuple[list[tuple[str, str]], list[tuple[str, str, str]]]:
    """Return visible prose and fenced blocks with their current section.

    Fenced samples cannot create declarations/headings. HTML comments cannot
    hide an actual declaration from the parser by creating a second one.
    """
    text = re.sub(r"<!--[\s\S]*?-->", "", text)
    prose, fences = [], []
    heading = ""
    fence = None
    body: list[str] = []
    language = ""
    for line in text.splitlines():
        if fence:
            if re.fullmatch(r"\s{0,3}" + re.escape(fence[0]) + "{" + str(len(fence)) + r",}\s*", line):
                fences.append((heading, language, "\n".join(body)))
                fence, body = None, []
            else:
                body.append(line)
            continue
        match = re.match(r"^\s{0,3}(`{3,}|~{3,})([^\s]*)\s*$", line)
        if match:
            fence, language = match.groups()
            continue
        match = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", line)
        if match:
            heading = match.group(1)
        prose.append((heading, line))
    if fence:
        fences.append((heading, "UNTERMINATED", "\n".join(body)))
    return prose, fences


def risk_triggers(prose: list[tuple[str, str]]) -> list[str]:
    sections: dict[str, list[str]] = {}
    for heading, line in prose:
        if EXCLUDED_HEADINGS.search(heading) or heading == CONTRACT_HEADING:
            continue
        if line.startswith(("#", ">")) or APPLICABILITY in line:
            continue
        # Negative instructions do not authorize the named operation. Limit the
        # exclusion to one sentence so an adjacent positive instruction counts.
        for sentence in re.split(r"(?<=[.!?;])\s+", line):
            if re.match(r"^\s*(?:[-*]\s*)?(?:do not|never|must not|forbidden:|not authorized:)\b", sentence, re.I):
                continue
            sections.setdefault(heading, []).append(sentence.replace("`", ""))
    return [name for name, pattern in RISK_PATTERNS.items()
            if any(pattern.search("\n".join(lines)) for lines in sections.values())]


def _unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def validate_contract(contract: object) -> list[str]:
    errors: list[str] = []

    def keys(value: object, expected: list[str] | tuple[str, ...], field: str) -> bool:
        if not isinstance(value, dict) or set(value) != set(expected):
            errors.append(f"{field}: expected exactly {', '.join(expected)}")
            return False
        return True

    def exact(value: object, expected: object, field: str) -> None:
        if type(value) is not type(expected) or value != expected:
            errors.append(f"{field}: required {expected!r}")

    def members(value: object, expected: list[str], field: str) -> None:
        if (not isinstance(value, list) or not all(isinstance(item, str) for item in value)
                or len(value) != len(expected) or set(value) != set(expected)):
            errors.append(f"{field}: required complete unique set {expected!r}")

    if not keys(contract, REQUIRED_FIELDS, "contract"):
        return errors
    if not _meaningful(contract["transactionTarget"]):
        errors.append("transactionTarget: specify a non-placeholder guarded mutation target")
    peer = contract["productionPathPeer"]
    if keys(peer, ["kind", "invocationPath", "mutationPath"], "productionPathPeer"):
        exact(peer["kind"], "REAL_SECOND_PROCESS", "productionPathPeer.kind")
        for field in ("invocationPath", "mutationPath"):
            if not _meaningful(peer[field]):
                errors.append(f"productionPathPeer.{field}: specify the actual guarded production path")
    barrier = contract["deterministicBarrierProtocol"]
    if keys(barrier, ["events", "timeoutRole"], "deterministicBarrierProtocol"):
        exact(barrier["events"], BARRIER_EVENTS, "deterministicBarrierProtocol.events")
        exact(barrier["timeoutRole"], "DEADLOCK_SAFETY_ONLY", "deterministicBarrierProtocol.timeoutRole")
    exact(contract["enteredBeforeReleaseOracle"], "REJECT_ENTRY_BEFORE_PARENT_RELEASE", "enteredBeforeReleaseOracle")
    injection = contract["postAcquireFailureInjection"]
    if keys(injection, ["point", "cleanupProof"], "postAcquireFailureInjection"):
        exact(injection["point"], "AFTER_ACQUIRE_BEFORE_MUTATION", "postAcquireFailureInjection.point")
        exact(injection["cleanupProof"], "SUBSEQUENT_PEER_ACQUIRES", "postAcquireFailureInjection.cleanupProof")
    security = contract["semanticSecurityTuple"]
    if keys(security, ["fields", "aceFields", "normalization"], "semanticSecurityTuple"):
        members(security["fields"], SECURITY_FIELDS, "semanticSecurityTuple.fields")
        members(security["aceFields"], ACE_FIELDS, "semanticSecurityTuple.aceFields")
        exact(security["normalization"], "SORT_COMPLETE_ACE_TUPLES", "semanticSecurityTuple.normalization")
    rollback = contract["rollbackExactness"]
    if keys(rollback, ["comparison", "adversaries"], "rollbackExactness"):
        exact(rollback["comparison"], "SEMANTIC_PRESTATE_EQUALS_POST_ROLLBACK", "rollbackExactness.comparison")
        members(rollback["adversaries"], ADVERSARIES, "rollbackExactness.adversaries")
    binding = contract["finalEvidenceHashBinding"]
    required_binding = {"algorithm": "SHA256", "scope": "EXACT_RETURN_BYTES", "capture": "BEFORE_AND_AFTER_FINAL_REQUIRED_GATE", "equality": "REQUIRED", "postGateMutation": "FORBIDDEN"}
    if keys(binding, list(required_binding), "finalEvidenceHashBinding"):
        for field, value in required_binding.items():
            exact(binding[field], value, f"finalEvidenceHashBinding.{field}")
    probe = contract["independentProbeRequired"]
    if keys(probe, ["required", "owner", "workerReturnDisposition"], "independentProbeRequired"):
        exact(probe["required"], True, "independentProbeRequired.required")
        exact(probe["owner"], "LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER", "independentProbeRequired.owner")
        exact(probe["workerReturnDisposition"], "PENDING_REVIEWER_EXECUTION", "independentProbeRequired.workerReturnDisposition")
    return errors


PROFILE = "High-Risk Local Transaction Proof Profile"
CREATE_PROFILE = "CREATE_ONLY_PROVISIONING"
CREATE_FIELDS = ("profile", "phase", "target", "allowedEffects", "preconditions", "exclusiveCreate", "securityReadback", "failureDisposition", "independentProbe", "finalEvidenceHashBinding", "claimBoundary", "machineBindings")
MACHINE_FIELDS = ("sourceCommit", "sourceFile", "sourceSha256", "sourceReceiptPath", "sourceReceiptSha256", "independentReviewPath", "independentReviewSha256", "hostId", "operatorSid", "accountName", "resourceRoots", "allowedEffects", "operatorAuthorizationPath", "operatorAuthorizationSha256", "startUtc", "deadlineUtc", "maxApplyAttempts", "auditCustodyPath", "compensation")
MACHINE_EFFECTS = ["CREATE_ABSENT_ACCOUNT", "CREATE_ABSENT_DIRECTORY_WITH_INITIAL_SECURITY", "DISABLE_SAME_CREATED_SID_ON_FAILURE", "WRITE_NEW_AUDIT_RECEIPT"]
MIXED_SCOPE = re.compile(r"\b(?:(?:change|modify|update|alter|harden|restore|repair|mutate)\b[^.\n;]{0,100}\b(?:ownership|owner|security|acl|dacl)\b[^.\n;]{0,100}\b(?:of|on|for)\s+(?:(?:the|an?)\s+)?(?:existing|pre[- ]existing)\b|cross[- ]process\s+(?:lock\w*|mutex\w*|exclusion)|inter[- ]?process\s+(?:file\s+)?lock\w*|(?:named|process[- ]shared)\s+mutex|(?:mutat\w*|chang\w*|modify\w*|updat\w*|harden\w*|restor\w*|repair\w*)\s+(?:(?:the|an?)\s+)?(?:existing|pre[- ]existing)\b|(?:existing|pre[- ]existing)\s+(?:resources?|accounts?|security|acl|dacl|ownership)\s+(?:mutat\w*|chang\w*|modif\w*|updat\w*|harden\w*|restor\w*|repair\w*)|(?:durable\s+(?:append\w*|writ\w*|mutation)|(?:append\w*|writ\w*)\s+durably)[\s\S]*?\brollback\b|\bexact[- ]rollback\b|\brollback\b[\s\S]*?\bdurable\s+(?:append\w*|writ\w*|mutation))", re.I)


def _safe_repo(value: object) -> bool:
    return bool(_meaningful(value) and isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*", value) and all(x not in (".", "..") for x in value.split("/")))


def _windows_path(value: object) -> bool:
    if not _meaningful(value) or not isinstance(value, str) or not re.fullmatch(r"[A-Za-z]:\\[^\\/:]+(?:\\[^\\/:]+)*", value):
        return False
    return all(part not in (".", "..") and not part.endswith((".", " ")) and not re.search(r'[<>"|?*\x00-\x1f]', part) and not re.fullmatch(r"(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?", part, re.I) for part in value[3:].split("\\"))


def validate_creation_contract(contract: object) -> list[str]:
    errors: list[str] = []
    def keys(value: object, expected: tuple | list, label: str) -> bool:
        if not isinstance(value, dict) or set(value) != set(expected):
            errors.append(f"{label}: expected exact keys {', '.join(expected)}")
            return False
        return True
    def exact(value: object, expected: object, label: str) -> None:
        if type(value) is not type(expected) or value != expected:
            errors.append(f"{label}: required {expected!r}")
    def members(value: object, expected: list, label: str) -> None:
        if not isinstance(value, list) or not all(isinstance(x, str) for x in value) or len(value) != len(expected) or set(value) != set(expected):
            errors.append(f"{label}: required complete unique set")
    def constants(value: object, expected: dict, label: str) -> None:
        if keys(value, tuple(expected), label):
            for k, v in expected.items(): exact(value[k], v, f"{label}.{k}")
    if not keys(contract, CREATE_FIELDS, "creation contract"):
        return errors
    exact(contract['profile'], CREATE_PROFILE, 'profile')
    phase = contract['phase']
    if phase not in ('SOURCE_PREPARATION', 'MACHINE_VERIFICATION') or not isinstance(phase, str):
        errors.append('phase: invalid phase')
        return errors
    machine = phase == 'MACHINE_VERIFICATION'
    target = contract['target']
    target_ok = keys(target, ('productionEntry', 'accountIdentity', 'roots'), 'target')
    if target_ok:
        if not _safe_repo(target['productionEntry']): errors.append('target.productionEntry: invalid repository path')
        if not _meaningful(target['accountIdentity']): errors.append('target.accountIdentity: invalid identity')
        roots = target['roots']
        if not isinstance(roots, list) or not roots or not all(_windows_path(x) for x in roots) or len({x.casefold() for x in roots}) != len(roots): errors.append('target.roots: invalid or duplicate roots')
    constants(contract['allowedEffects'], {'existingResources':'READ_ONLY','newResources':'CREATE_ONLY_ATOMIC','groupMembership':'NO_MUTATION','applyEffect':'SEPARATELY_AUTHORIZED_TEST_ONLY' if machine else 'FORBIDDEN'}, 'allowedEffects')
    constants(contract['preconditions'], {'collision':'DENY_NO_OWNERSHIP','parent':'VERIFY_NO_REPARSE_OR_UNSAFE_REPLACEMENT','identity':'PINNED_OS_IDENTITY','ambiguity':'STOP'}, 'preconditions')
    constants(contract['exclusiveCreate'], {'primitive':'FAIL_IF_EXISTS_WITH_INITIAL_SECURITY','contenderProof':'REAL_PRODUCTION_PATH_SECOND_PROCESS' if machine else 'INJECTED_FAKE_ONLY','ordering':'EXPLICIT_EVENT_HANDSHAKE_NO_TIMEOUT_ORACLE','collisionOracle':'ONE_CREATOR_LOSER_NO_OWNERSHIP_OR_MUTATION'}, 'exclusiveCreate')
    security = contract['securityReadback']
    if keys(security, ('fields','aceFields','normalization','adversaries','evidence'), 'securityReadback'):
        members(security['fields'], SECURITY_FIELDS, 'securityReadback.fields')
        members(security['aceFields'], ACE_FIELDS, 'securityReadback.aceFields')
        members(security['adversaries'], ADVERSARIES, 'securityReadback.adversaries')
        exact(security['normalization'], 'SORT_COMPLETE_ACE_TUPLES', 'securityReadback.normalization')
        exact(security['evidence'], 'ACTUAL_CREATED_RESOURCE_READBACK' if machine else 'SYNTHETIC_CONSTRUCTION_ONLY', 'securityReadback.evidence')
    constants(contract['failureDisposition'], {'ownership':'RETURNED_STABLE_IDENTITY_ONLY','action':'DISABLE_CREATED_ACCOUNT_RETAIN_RESOURCES_AND_EVIDENCE','ambiguous':'STOP_NO_NAME_BASED_ACTION','cleanupFailure':'RETAIN_AND_REPORT_NO_AUTORETRY'}, 'failureDisposition')
    constants(contract['independentProbe'], {'required':True,'owner':'LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER','workerReturnDisposition':'PENDING_REVIEWER_EXECUTION','scope':'REAL_MACHINE_ONLY' if machine else 'FAKE_SOURCE_ONLY'}, 'independentProbe')
    constants(contract['finalEvidenceHashBinding'], {'algorithm':'SHA256','scope':'EXACT_RETURN_BYTES','capture':'BEFORE_AND_AFTER_FINAL_REQUIRED_GATE','equality':'REQUIRED','postGateMutation':'FORBIDDEN'}, 'finalEvidenceHashBinding')
    exact(contract['claimBoundary'], 'MACHINE_EVIDENCE_ONLY_NO_T3_T4_CLAIM' if machine else 'SOURCE_ONLY_NO_HOST_READINESS', 'claimBoundary')
    binding = contract['machineBindings']
    if not machine:
        exact(binding, None, 'machineBindings')
    elif keys(binding, MACHINE_FIELDS, 'machineBindings'):
        for k, length in [('sourceCommit',40), ('sourceSha256',64), ('sourceReceiptSha256',64), ('independentReviewSha256',64), ('operatorAuthorizationSha256',64)]:
            if not isinstance(binding[k], str) or not re.fullmatch('[0-9a-f]{%d}' % length, binding[k]): errors.append(f'machineBindings.{k}: invalid hash')
        for k in ('sourceFile','sourceReceiptPath','independentReviewPath','operatorAuthorizationPath'):
            if not _safe_repo(binding[k]): errors.append(f'machineBindings.{k}: invalid repository path')
        if not _meaningful(binding['hostId']): errors.append('machineBindings.hostId: invalid host')
        if not isinstance(binding['operatorSid'], str) or not re.fullmatch(r'S-1-5-21-(?:\d+-){3}\d+', binding['operatorSid']): errors.append('machineBindings.operatorSid: invalid SID')
        if target_ok:
            exact(binding['sourceFile'], target['productionEntry'], 'machineBindings.sourceFile')
            exact(binding['accountName'], target['accountIdentity'], 'machineBindings.accountName')
            exact(binding['resourceRoots'], target['roots'], 'machineBindings.resourceRoots')
        members(binding['allowedEffects'], MACHINE_EFFECTS, 'machineBindings.allowedEffects')
        exact(binding['maxApplyAttempts'], 1, 'machineBindings.maxApplyAttempts')
        try:
            times = [binding[x] for x in ('startUtc','deadlineUtc')]
            if not all(isinstance(x, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', x) for x in times): raise ValueError()
            start, end = [dt.datetime.strptime(x, '%Y-%m-%dT%H:%M:%SZ') for x in times]
            if not dt.timedelta(0) < end - start <= dt.timedelta(hours=24): raise ValueError()
        except (ValueError, TypeError): errors.append('machineBindings: invalid finite UTC window')
        audit = binding['auditCustodyPath']
        if not _windows_path(audit): errors.append('machineBindings.auditCustodyPath: invalid absolute path')
        elif target_ok and isinstance(target['roots'], list) and all(_windows_path(x) for x in target['roots']):
            for root in target['roots']:
                try:
                    if ntpath.commonpath([audit.casefold(), root.casefold()]) == root.casefold(): errors.append('machineBindings.auditCustodyPath: inside resource root')
                except ValueError:
                    pass  # Different drive cannot be inside the root.
        constants(binding['compensation'], {'account':'DISABLE_SAME_CREATED_SID_ONLY','resources':'RETAIN_WITH_INVENTORY','ambiguity':'STOP_NO_NAME_BASED_ACTION','failure':'RETAIN_REPORT_NO_AUTORETRY'}, 'machineBindings.compensation')
    return errors


def check_text(text: str) -> list[str]:
    prose, fences = _markdown(text)
    declarations = [line.split(":", 1)[1].strip() for _, line in prose
                    if re.match(r"^" + re.escape(APPLICABILITY) + r"\s*:", line)]
    triggers = risk_triggers(prose)
    profiles = [line.split(":", 1)[1].strip() for _, line in prose if re.match(r"^" + re.escape(PROFILE) + r"\s*:", line)]
    if len(profiles) > 1 or (profiles and profiles[0] != CREATE_PROFILE):
        return ["invalid or duplicate high-risk proof profile"]
    if profiles:
        operational = "\n".join(line for heading, line in prose if not EXCLUDED_HEADINGS.search(heading) and heading != CONTRACT_HEADING and not line.startswith(("#", ">")) and not re.match(r"^\s*(?:[-*]\s*)?(?:do not|never|must not|forbidden:|not authorized:)\b", line, re.I))
        if MIXED_SCOPE.search(operational):
            return ["CREATE_ONLY_PROVISIONING cannot authorize mixed existing-resource or lock/rollback scope"]
    headings = [line for _, line in prose if re.fullmatch(r"##\s+" + re.escape(CONTRACT_HEADING) + r"\s*", line)]
    if profiles and (len(declarations) != 1 or declarations[0] != "REQUIRED"):
        return ["CREATE_ONLY_PROVISIONING requires REQUIRED applicability"]
    if not declarations:
        return ([f"missing {APPLICABILITY} declaration; risk triggers: {', '.join(triggers)}"]
                if triggers or headings else [])
    if len(declarations) != 1:
        return ["exactly one applicability declaration is required"]
    disposition = declarations[0]
    if disposition.startswith("NOT_APPLICABLE_WITH_REASON - "):
        if triggers:
            return [f"NOT_APPLICABLE_WITH_REASON contradicts risk triggers: {', '.join(triggers)}"]
        if not _meaningful(disposition.partition(" - ")[2]):
            return ["NOT_APPLICABLE_WITH_REASON requires a non-placeholder reason"]
        if headings:
            return ["NOT_APPLICABLE_WITH_REASON cannot carry a REQUIRED contract section"]
        return []
    if disposition != "REQUIRED":
        return ["invalid applicability: use REQUIRED or NOT_APPLICABLE_WITH_REASON - <reason>"]
    blocks = [(language, body) for heading, language, body in fences if heading == CONTRACT_HEADING]
    if len(headings) != 1 or len(blocks) != 1 or blocks[0][0] != "json":
        return [f"REQUIRED needs one ## {CONTRACT_HEADING} section with exactly one closed json fence"]
    try:
        contract = json.loads(blocks[0][1], object_pairs_hook=_unique_object,
                              parse_constant=lambda value: (_ for _ in ()).throw(ValueError(f"invalid constant {value}")))
    except (ValueError, RecursionError) as error:
        return [f"invalid contract JSON: {error}"]
    return validate_creation_contract(contract) if profiles else validate_contract(contract)


def _git(root: Path, *args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=root, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args)} failed: {result.stderr.decode('utf-8', 'replace').strip()}")
    return result.stdout


def _paths(raw: bytes) -> set[str]:
    return {part.decode("utf-8", "strict") for part in raw.split(b"\0") if part}


def check_repository(root: Path, base: str | None = None, head: str = "HEAD") -> tuple[int, list[str]]:
    """Read range-only files from head; local changed files from the worktree."""
    committed = _paths(_git(root, "diff", "--name-only", "-z", "--diff-filter=ACMRT", f"{base}..{head}")) if base else set()
    local = set()
    for args in [("diff", "--name-only", "-z"), ("diff", "--cached", "--name-only", "-z"),
                 ("ls-files", "--others", "--exclude-standard", "-z")]:
        local.update(_paths(_git(root, *args)))
    findings, checked = [], 0
    for path in sorted(committed | local):
        if not (path.startswith("docs/work_orders/") and path.endswith(".md")):
            continue
        if path in local:
            target = root / path
            if not target.exists():
                continue  # Deleted work orders grant no current authority.
            text = target.read_text(encoding="utf-8-sig")
        else:
            text = _git(root, "show", f"{head}:{path}").decode("utf-8-sig")
        checked += 1
        findings.extend(f"{path}: {error}" for error in check_text(text))
    return checked, findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    try:
        checked, findings = check_repository(REPO_ROOT, args.base, args.head)
    except (OSError, RuntimeError, UnicodeError) as error:
        checked, findings = 0, [f"scope/read failure: {error}"]
    print(f"High-risk local transaction proof: {'NON_COMPLIANT' if findings else 'COMPLIANT'}; checked={checked}; findings={len(findings)}")
    for finding in findings:
        print(f"- {finding}")
    return 1 if findings and args.enforce else 0


if __name__ == "__main__":
    raise SystemExit(main())
