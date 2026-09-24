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
            self.assertEqual(guard.validate_contract(example), [])


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
