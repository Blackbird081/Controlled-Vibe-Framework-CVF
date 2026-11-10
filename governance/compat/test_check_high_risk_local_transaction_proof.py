"""Positive, adversarial and real-Git scope tests for HRLTP admission."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock

from governance.compat import check_high_risk_local_transaction_proof as guard


def complete_contract():
    # Independently authored fixture: do not derive expected values from guard constants.
    return {
        "transactionTarget": "scripts/local_writer.ps1 guarded append transaction",
        "productionPathPeer": {"kind": "REAL_SECOND_PROCESS", "invocationPath": "scripts/local_writer.ps1", "mutationPath": "Invoke-GuardedAppend"},
        "deterministicBarrierProtocol": {"events": ["READY", "START_ATTEMPT", "ATTEMPTING", "PARENT_RELEASE", "ENTERED", "COMPLETE"], "timeoutRole": "DEADLOCK_SAFETY_ONLY"},
        "enteredBeforeReleaseOracle": "REJECT_ENTRY_BEFORE_PARENT_RELEASE",
        "postAcquireFailureInjection": {"point": "AFTER_ACQUIRE_BEFORE_MUTATION", "cleanupProof": "SUBSEQUENT_PEER_ACQUIRES"},
        "semanticSecurityTuple": {"fields": ["ownerSid", "protectionState", "inheritanceState", "aces"], "aceFields": ["sid", "rights", "accessType", "isInherited", "inheritanceFlags", "propagationFlags"], "normalization": "SORT_COMPLETE_ACE_TUPLES"},
        "rollbackExactness": {"comparison": "SEMANTIC_PRESTATE_EQUALS_POST_ROLLBACK", "adversaries": ["EXTRA_ALLOW", "DENY", "INHERITED", "WRONG_OWNER"]},
        "finalEvidenceHashBinding": {"algorithm": "SHA256", "scope": "EXACT_RETURN_BYTES", "capture": "BEFORE_AND_AFTER_FINAL_REQUIRED_GATE", "equality": "REQUIRED", "postGateMutation": "FORBIDDEN"},
        "independentProbeRequired": {"required": True, "owner": "LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER", "workerReturnDisposition": "PENDING_REVIEWER_EXECUTION"},
    }


def packet(contract=None):
    return ("# Test Work Order\n\nHigh-Risk Local Transaction Proof Applicability: REQUIRED\n\n"
            "## High-Risk Local Transaction Proof Contract\n\n```json\n" +
            json.dumps(complete_contract() if contract is None else contract) + "\n```\n")


class ContractTests(unittest.TestCase):
    def test_complete_contract_accepted(self):
        self.assertEqual(guard.check_text(packet()), [])

    def test_every_missing_field_rejected(self):
        for field in complete_contract():
            with self.subTest(field=field):
                value = complete_contract()
                del value[field]
                self.assertTrue(guard.check_text(packet(value)))

    def test_every_empty_field_rejected(self):
        for field in complete_contract():
            with self.subTest(field=field):
                value = complete_contract()
                value[field] = ""
                self.assertTrue(guard.check_text(packet(value)))

    def test_each_risk_family_without_marker_rejected(self):
        cases = ["Implement cross-process locking around the writer.",
                 "Coordinate two processes with an interprocess file lock.",
                 "Implement durable append with rollback.",
                 "Harden the DACL on the produced file.",
                 "Inject post-acquire failure to prove cleanup."]
        for text in cases:
            with self.subTest(text=text):
                self.assertTrue(guard.check_text("## Implementation Contract\n" + text))

    def test_split_lines_risk_detected(self):
        self.assertTrue(guard.check_text("## Scope\nImplement durable append\nwith rollback."))

    def test_inline_code_risk_detected(self):
        self.assertTrue(guard.check_text("## Scope\nHarden `DACL` for the artifact."))

    def test_safe_nonapplicable_accepted(self):
        self.assertEqual(guard.check_text("High-Risk Local Transaction Proof Applicability: NOT_APPLICABLE_WITH_REASON - pure documentation spelling corrections\n"), [])

    def test_false_nonapplicable_rejected(self):
        self.assertTrue(guard.check_text("High-Risk Local Transaction Proof Applicability: NOT_APPLICABLE_WITH_REASON - simple implementation\n## Scope\nChange ownership of output files."))

    def test_unrelated_packet_accepted(self):
        self.assertEqual(guard.check_text("# Work Order\nFix documentation links."), [])

    def test_fenced_example_marker_does_not_opt_in(self):
        self.assertEqual(guard.check_text("## Example\n```text\nHigh-Risk Local Transaction Proof Applicability: REQUIRED\nImplement cross-process locking.\n```\n"), [])

    def test_inline_example_marker_does_not_opt_in(self):
        self.assertEqual(guard.check_text("The token `High-Risk Local Transaction Proof Applicability: REQUIRED` is documented."), [])

    def test_html_comment_does_not_opt_in(self):
        self.assertEqual(guard.check_text("<!-- High-Risk Local Transaction Proof Applicability: REQUIRED -->"), [])

    def test_forbidden_and_historical_sections_not_authority(self):
        self.assertEqual(guard.check_text("## Forbidden Scope\nCross-process locking.\n## Historical Evidence\nChanged ownership and DACL."), [])

    def test_negative_instruction_not_authority(self):
        self.assertEqual(guard.check_text("## Scope\nDo not change DACL ownership."), [])

    def test_positive_after_negative_still_triggers(self):
        self.assertTrue(guard.check_text("## Scope\nDo not use networking. Implement cross-process locking."))

    def test_invalid_disposition_rejected(self):
        self.assertTrue(guard.check_text("High-Risk Local Transaction Proof Applicability: OPTIONAL"))

    def test_placeholder_nonapplicable_rejected(self):
        for reason in ["TODO", "N/A", "<reason>", "TBD later"]:
            with self.subTest(reason=reason):
                self.assertTrue(guard.check_text("High-Risk Local Transaction Proof Applicability: NOT_APPLICABLE_WITH_REASON - " + reason))

    def test_duplicate_declaration_rejected(self):
        self.assertTrue(guard.check_text(packet() + "High-Risk Local Transaction Proof Applicability: REQUIRED\n"))

    def test_duplicate_section_rejected(self):
        self.assertTrue(guard.check_text(packet() + "## High-Risk Local Transaction Proof Contract\n"))

    def test_duplicate_json_key_rejected(self):
        self.assertTrue(guard.check_text(packet().replace('"required": true', '"required": false, "required": true')))

    def test_extra_json_key_rejected(self):
        value = complete_contract()
        value["bypass"] = True
        self.assertTrue(guard.check_text(packet(value)))

    def test_malformed_json_rejected(self):
        self.assertTrue(guard.check_text(packet().replace('"transactionTarget":', '"transactionTarget"')))

    def test_wrong_json_root_rejected(self):
        self.assertTrue(guard.check_text(packet([])))

    def test_unclosed_fence_rejected(self):
        self.assertTrue(guard.check_text(packet().rsplit("```", 1)[0]))

    def test_two_fences_rejected(self):
        self.assertTrue(guard.check_text(packet() + "```json\n{}\n```\n"))

    def test_shape_only_peer_rejected(self):
        value = complete_contract()
        value["productionPathPeer"]["kind"] = "MUTEX_SHAPE_ONLY"
        self.assertTrue(guard.check_text(packet(value)))

    def test_placeholder_paths_rejected(self):
        value = complete_contract()
        value["productionPathPeer"]["mutationPath"] = "<actual path>"
        self.assertTrue(guard.check_text(packet(value)))

    def test_timeout_proof_rejected(self):
        value = complete_contract()
        value["deterministicBarrierProtocol"]["timeoutRole"] = "PROVES_EXCLUSION"
        self.assertTrue(guard.check_text(packet(value)))

    def test_reordered_barrier_rejected(self):
        value = complete_contract()
        value["deterministicBarrierProtocol"]["events"].reverse()
        self.assertTrue(guard.check_text(packet(value)))

    def test_each_security_field_and_ace_component_required(self):
        for collection in ["fields", "aceFields"]:
            for item in complete_contract()["semanticSecurityTuple"][collection]:
                with self.subTest(collection=collection, item=item):
                    value = complete_contract()
                    value["semanticSecurityTuple"][collection].remove(item)
                    self.assertTrue(guard.check_text(packet(value)))

    def test_duplicate_semantic_component_rejected(self):
        value = complete_contract()
        value["semanticSecurityTuple"]["aceFields"].append("sid")
        self.assertTrue(guard.check_text(packet(value)))

    def test_unhashable_semantic_component_rejected(self):
        value = complete_contract()
        value["semanticSecurityTuple"]["aceFields"][0] = {}
        self.assertTrue(guard.check_text(packet(value)))

    def test_each_rollback_adversary_required(self):
        for item in complete_contract()["rollbackExactness"]["adversaries"]:
            with self.subTest(item=item):
                value = complete_contract()
                value["rollbackExactness"]["adversaries"].remove(item)
                self.assertTrue(guard.check_text(packet(value)))

    def test_missing_postacquire_cleanup_rejected(self):
        value = complete_contract()
        value["postAcquireFailureInjection"]["cleanupProof"] = "PARENT_EXITED"
        self.assertTrue(guard.check_text(packet(value)))

    def test_unstable_evidence_hash_rejected(self):
        for field, invalid in [("equality", "OPTIONAL"), ("postGateMutation", "ALLOWED"), ("scope", "NORMALIZED_TEXT"), ("capture", "BEFORE_GATE_ONLY")]:
            with self.subTest(field=field):
                value = complete_contract()
                value["finalEvidenceHashBinding"][field] = invalid
                self.assertTrue(guard.check_text(packet(value)))

    def test_worker_as_probe_owner_rejected(self):
        value = complete_contract()
        value["independentProbeRequired"]["owner"] = "IMPLEMENTATION_WORKER"
        self.assertTrue(guard.check_text(packet(value)))

    def test_integer_true_not_boolean_rejected(self):
        value = complete_contract()
        value["independentProbeRequired"]["required"] = 1
        self.assertTrue(guard.check_text(packet(value)))

    def test_standard_example_matches_checker(self):
        path = guard.REPO_ROOT / "docs/reference/CVF_HIGH_RISK_LOCAL_TRANSACTION_PROOF_STANDARD_2026-09-22.md"
        _, blocks = guard._markdown(path.read_text(encoding="utf-8"))
        examples = [json.loads(body) for _, language, body in blocks if language == "json"]
        self.assertTrue(examples, "canonical standard must carry an executable contract example")
        for example in examples:
            validator = guard.validate_creation_contract if example.get("profile") == "CREATE_ONLY_PROVISIONING" else guard.validate_contract
            self.assertEqual(validator(example), [])


def creation_fixture(machine=False):
    result = {
        'profile': 'CREATE_ONLY_PROVISIONING', 'phase': 'SOURCE_PREPARATION',
        'target': {'productionEntry':'scripts/create.ps1','accountIdentity':'example-agent','roots':['C:\\Test\\Control']},
        'allowedEffects': {'existingResources':'READ_ONLY','newResources':'CREATE_ONLY_ATOMIC','groupMembership':'NO_MUTATION','applyEffect':'FORBIDDEN'},
        'preconditions': {'collision':'DENY_NO_OWNERSHIP','parent':'VERIFY_NO_REPARSE_OR_UNSAFE_REPLACEMENT','identity':'PINNED_OS_IDENTITY','ambiguity':'STOP'},
        'exclusiveCreate': {'primitive':'FAIL_IF_EXISTS_WITH_INITIAL_SECURITY','contenderProof':'INJECTED_FAKE_ONLY','ordering':'EXPLICIT_EVENT_HANDSHAKE_NO_TIMEOUT_ORACLE','collisionOracle':'ONE_CREATOR_LOSER_NO_OWNERSHIP_OR_MUTATION'},
        'securityReadback': {'fields':['ownerSid','protectionState','inheritanceState','aces'],'aceFields':['sid','rights','accessType','isInherited','inheritanceFlags','propagationFlags'],'normalization':'SORT_COMPLETE_ACE_TUPLES','adversaries':['EXTRA_ALLOW','DENY','INHERITED','WRONG_OWNER'],'evidence':'SYNTHETIC_CONSTRUCTION_ONLY'},
        'failureDisposition': {'ownership':'RETURNED_STABLE_IDENTITY_ONLY','action':'DISABLE_CREATED_ACCOUNT_RETAIN_RESOURCES_AND_EVIDENCE','ambiguous':'STOP_NO_NAME_BASED_ACTION','cleanupFailure':'RETAIN_AND_REPORT_NO_AUTORETRY'},
        'independentProbe': {'required':True,'owner':'LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER','workerReturnDisposition':'PENDING_REVIEWER_EXECUTION','scope':'FAKE_SOURCE_ONLY'},
        'finalEvidenceHashBinding': {'algorithm':'SHA256','scope':'EXACT_RETURN_BYTES','capture':'BEFORE_AND_AFTER_FINAL_REQUIRED_GATE','equality':'REQUIRED','postGateMutation':'FORBIDDEN'},
        'claimBoundary':'SOURCE_ONLY_NO_HOST_READINESS', 'machineBindings':None,
    }
    if machine:
        result['phase']='MACHINE_VERIFICATION'
        result['allowedEffects']['applyEffect']='SEPARATELY_AUTHORIZED_TEST_ONLY'
        result['exclusiveCreate']['contenderProof']='REAL_PRODUCTION_PATH_SECOND_PROCESS'
        result['securityReadback']['evidence']='ACTUAL_CREATED_RESOURCE_READBACK'
        result['independentProbe']['scope']='REAL_MACHINE_ONLY'
        result['claimBoundary']='MACHINE_EVIDENCE_ONLY_NO_T3_T4_CLAIM'
        result['machineBindings']={'sourceCommit':'a'*40,'sourceFile':'scripts/create.ps1','sourceSha256':'b'*64,'sourceReceiptPath':'docs/source.md','sourceReceiptSha256':'c'*64,'independentReviewPath':'docs/review.md','independentReviewSha256':'d'*64,'hostId':'TEST-HOST','operatorSid':'S-1-5-21-1-2-3-1001','accountName':'example-agent','resourceRoots':['C:\\Test\\Control'],'allowedEffects':['CREATE_ABSENT_ACCOUNT','CREATE_ABSENT_DIRECTORY_WITH_INITIAL_SECURITY','DISABLE_SAME_CREATED_SID_ON_FAILURE','WRITE_NEW_AUDIT_RECEIPT'],'operatorAuthorizationPath':'docs/auth.md','operatorAuthorizationSha256':'e'*64,'startUtc':'2026-11-09T03:00:00Z','deadlineUtc':'2026-11-09T04:00:00Z','maxApplyAttempts':1,'auditCustodyPath':'C:\\Audit\\receipt.json','compensation':{'account':'DISABLE_SAME_CREATED_SID_ONLY','resources':'RETAIN_WITH_INVENTORY','ambiguity':'STOP_NO_NAME_BASED_ACTION','failure':'RETAIN_REPORT_NO_AUTORETRY'}}
    return result


def creation_packet(value):
    return ('High-Risk Local Transaction Proof Applicability: REQUIRED\nHigh-Risk Local Transaction Proof Profile: CREATE_ONLY_PROVISIONING\n\n## High-Risk Local Transaction Proof Contract\n```json\n' + json.dumps(value) + '\n```\n')


class CreationProfileTests(unittest.TestCase):
    def test_positive_phases_and_legacy(self):
        for value in [creation_fixture(), creation_fixture(True)]:
            self.assertEqual(guard.check_text(creation_packet(value)), [])
        self.assertEqual(guard.check_text(packet()), [])

    def test_each_top_key_and_nested_key_is_required(self):
        for machine in (False, True):
            original=creation_fixture(machine)
            for field in original:
                value=creation_fixture(machine); del value[field]
                self.assertTrue(guard.check_text(creation_packet(value)), field)
            for field, obj in original.items():
                if isinstance(obj, dict):
                    for child in obj:
                        value=creation_fixture(machine); del value[field][child]
                        self.assertTrue(guard.check_text(creation_packet(value)), (field,child))

    def test_each_security_member_and_machine_effect(self):
        for collection in ('fields','aceFields','adversaries'):
            for item in creation_fixture()['securityReadback'][collection]:
                value=creation_fixture(); value['securityReadback'][collection].remove(item)
                self.assertTrue(guard.check_text(creation_packet(value)))
        for item in creation_fixture(True)['machineBindings']['allowedEffects']:
            value=creation_fixture(True); value['machineBindings']['allowedEffects'].remove(item)
            self.assertTrue(guard.check_text(creation_packet(value)))

    def test_phase_confusion_and_security_fail_closed(self):
        cases=[('phase','OTHER'),('machineBindings',{}),('claimBoundary','MACHINE_EVIDENCE_ONLY_NO_T3_T4_CLAIM')]
        for field, replacement in cases:
            value=creation_fixture(); value[field]=replacement
            self.assertTrue(guard.check_text(creation_packet(value)))
        for section,field,replacement in [('allowedEffects','applyEffect','SEPARATELY_AUTHORIZED_TEST_ONLY'),('exclusiveCreate','contenderProof','REAL_PRODUCTION_PATH_SECOND_PROCESS'),('independentProbe','required',1),('finalEvidenceHashBinding','equality','OPTIONAL'),('failureDisposition','ownership','BY_NAME')]:
            value=creation_fixture(); value[section][field]=replacement
            self.assertTrue(guard.check_text(creation_packet(value)))
        value=creation_fixture(True); value['securityReadback']['evidence']='SYNTHETIC_CONSTRUCTION_ONLY'
        self.assertTrue(guard.check_text(creation_packet(value)))

    def test_machine_binding_invalid_fields(self):
        cases={'sourceCommit':'F'*40,'sourceFile':'../escape','sourceSha256':'x'*64,'sourceReceiptPath':'C:/bad','sourceReceiptSha256':'','independentReviewPath':'a/../b','independentReviewSha256':'X'*64,'hostId':'TBD','operatorSid':'S-1-5-32-544','accountName':'other','resourceRoots':['C:\\Other'],'allowedEffects':['CREATE_ABSENT_ACCOUNT'],'operatorAuthorizationPath':'a\\b','operatorAuthorizationSha256':'1','startUtc':'2026-11-09','deadlineUtc':'2026-11-10T04:00:01Z','maxApplyAttempts':True,'auditCustodyPath':'C:\\Test\\Control\\file','compensation':{}}
        for key, replacement in cases.items():
            with self.subTest(key=key):
                value=creation_fixture(True); value['machineBindings'][key]=replacement
                self.assertTrue(guard.check_text(creation_packet(value)))

    def test_selector_and_json_rejection(self):
        valid=creation_packet(creation_fixture())
        for bad in [valid.replace('CREATE_ONLY_PROVISIONING\n','OTHER\n',1),valid.replace('REQUIRED\n','NOT_APPLICABLE_WITH_REASON - source\n',1), valid+'High-Risk Local Transaction Proof Profile: CREATE_ONLY_PROVISIONING\n',valid.replace('"profile":', '"profile":"x", "profile":',1),valid.replace('High-Risk Local Transaction Proof Profile: CREATE_ONLY_PROVISIONING\n','')]:
            self.assertTrue(guard.check_text(bad))
        value=creation_fixture(); value['extra']='bypass'
        self.assertTrue(guard.check_text(creation_packet(value)))

    def test_scope_mixing_and_negative_text(self):
        base=creation_packet(creation_fixture())
        for text in ['Implement cross-process locking.', 'Change existing resource ownership.', 'Change ownership and DACL of existing resources.', 'Modify security on pre-existing resources.', 'Implement durable write with rollback.', 'Implement exact-rollback.']:
            self.assertTrue(guard.check_text('## Allowed Scope\n'+text+'\n'+base),text)
        self.assertEqual(guard.check_text('## Forbidden Scope\nDo not change existing resource ownership.\n'+base),[])
        self.assertEqual(guard.check_text('## Allowed Scope\nCreate an absent account and directory.\n'+base),[])

    def test_windows_paths_and_time(self):
        for path in ['C:\\Test\\..\\Other','\\\\server\\share','C:\\Test:ads','C:\\Test\\Control\\.', 'C:\\Test\\bad*name', 'C:\\Test\\bad?name', 'C:\\Test\\bad|name', 'C:\\Test\\bad\"name', 'C:\\Test\\bad<name', 'C:\\Test\\bad>name', 'C:\\Test\\bad\x01name', 'C:\\Test\\CON']:
            value=creation_fixture(); value['target']['roots']=[path]
            self.assertTrue(guard.check_text(creation_packet(value)),path)
        value=creation_fixture(True); value['machineBindings']['deadlineUtc']='2026-11-09T02:00:00Z'
        self.assertTrue(guard.check_text(creation_packet(value)))
        value=creation_fixture(True); value['machineBindings']['auditCustodyPath']='D:\\Audit\\receipt.json'
        self.assertEqual(guard.check_text(creation_packet(value)),[])


class GitScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="cvf-hrltp-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "user.name", "Test")
        self.write("docs/work_orders/old.md", "## Scope\nImplement cross-process locking.")
        self.git("add", ".")
        self.git("commit", "-qm", "baseline")
        self.base = self.git("rev-parse", "HEAD").strip()

    def git(self, *args):
        result = subprocess.run(["git", *args], cwd=self.root, capture_output=True, text=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def write(self, path, text):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    def test_no_historical_retroactivity(self):
        self.assertEqual(guard.check_repository(self.root, self.base), (0, []))

    def test_untracked_space_path_detected(self):
        self.write("docs/work_orders/new packet.md", "## Scope\nHarden DACL.")
        count, errors = guard.check_repository(self.root, self.base)
        self.assertEqual(count, 1)
        self.assertIn("new packet.md", errors[0])

    def test_staged_change_detected(self):
        self.write("docs/work_orders/old.md", "## Scope\nImplement named mutex.")
        self.git("add", ".")
        self.assertTrue(guard.check_repository(self.root, self.base)[1])

    def test_unstaged_change_detected(self):
        self.write("docs/work_orders/old.md", "## Scope\nImplement durable write with rollback.")
        self.assertTrue(guard.check_repository(self.root, self.base)[1])

    def test_committed_range_detected(self):
        self.write("docs/work_orders/new.md", "## Scope\nHandle post-acquire failure.")
        self.git("add", ".")
        self.git("commit", "-qm", "new")
        self.assertTrue(guard.check_repository(self.root, self.base)[1])

    def test_non_work_order_ignored(self):
        self.write("docs/reference/example.md", "## Scope\nHarden DACL.")
        self.assertEqual(guard.check_repository(self.root, self.base), (0, []))

    def test_deleted_work_order_skipped(self):
        (self.root / "docs/work_orders/old.md").unlink()
        self.assertEqual(guard.check_repository(self.root, self.base), (0, []))

    def test_invalid_range_fails_closed_under_enforce(self):
        with mock.patch.object(guard, "REPO_ROOT", self.root), contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(guard.main(["--base", "nonexistent", "--enforce"]), 1)
        self.assertIn("scope/read failure", output.getvalue())

    def test_findings_advisory_without_enforce(self):
        self.write("docs/work_orders/new.md", "## Scope\nHarden DACL.")
        with mock.patch.object(guard, "REPO_ROOT", self.root), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(guard.main([]), 0)
            self.assertEqual(guard.main(["--enforce"]), 1)


if __name__ == "__main__":
    unittest.main()
