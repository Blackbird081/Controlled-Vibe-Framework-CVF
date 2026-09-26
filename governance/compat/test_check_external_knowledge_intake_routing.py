from __future__ import annotations

import importlib.util
import copy
import hashlib
import json
import tempfile
from unittest.mock import patch
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_external_knowledge_intake_routing.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_external_knowledge_intake_routing", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_BLOCK = """
External knowledge intake routing: REQUIRED

## External Knowledge Intake Routing

| Field | Value |
| --- | --- |
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
| Input type | External-agent returned output |
| Chain map route | External returned output -> absorption table -> promote/adapt/reject/block |
| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |
| Owner surface | docs/reviews/ |
| Disposition | CHANGED_DISPOSITION |
| Claim boundary | Bounded routing evidence only; no universal interception |
"""

VALID_CLOSURE_BLOCK = """
## Repository Absorption Closure Eligibility

| Field | Value |
| --- | --- |
| Source verification basis | PINNED_SOURCE_AND_LOCAL_BEHAVIORAL_READS |
| Architecture novelty | NO_NEW_ARCHITECTURE |
| Existing-owner overlap | OWNER_EXISTS |
| Practical adaptation value | ADAPTATION_VALUE_FOUND |
| Selected value conversion | ALL_SELECTED_VALUES_IMPLEMENTED_OR_GOVERNED_DEFERRED |
| Deferred or unreviewed scope | NONE |
| Closure eligibility | ELIGIBLE_ALL_SOURCES_TERMINAL |
"""


class ExternalKnowledgeIntakeRoutingTests(unittest.TestCase):
    def test_valid_explicit_block_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            VALID_BLOCK,
        )

        self.assertEqual([], violations)

    def test_missing_chain_map_citation_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "docs/reference/external_agent_review/"
            "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md",
            "docs/reference/external_agent_review/OTHER.md",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("missing chain map citation" in item for item in violations))

    def test_missing_section_fails(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            "External knowledge intake routing: REQUIRED\n",
        )

        self.assertTrue(any("missing `## External Knowledge Intake Routing`" in item for item in violations))

    def test_invalid_input_type_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| Input type | External-agent returned output |",
            "| Input type | Random outside input |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("Input type" in item for item in violations))

    def test_internal_governed_input_requires_real_local_source(self) -> None:
        text = VALID_BLOCK.replace(
            "| Input type | External-agent returned output |",
            "| Input type | Internal governed input (no external intake) |\n"
            "| Internal source | docs/reference/external_agent_review/"
            "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |",
        )
        self.assertEqual([], MODULE.check_text("docs/reviews/CVF_INTERNAL_RETURN.md", text))

        missing = text.replace(
            "| Internal source | docs/reference/external_agent_review/"
            "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |\n",
            "",
        )
        self.assertTrue(any("Internal source" in item for item in
                            MODULE.check_text("docs/reviews/CVF_INTERNAL_RETURN.md", missing)))

        outside = text.replace(
            "| Internal source | docs/reference/external_agent_review/"
            "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |",
            "| Internal source | ../../outside.md |",
        )
        self.assertTrue(any("Internal source" in item for item in
                            MODULE.check_text("docs/reviews/CVF_INTERNAL_RETURN.md", outside)))

    def test_matching_guard_without_guard_or_na_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |",
            "| Matching local-view guard | manual review only |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("Matching local-view guard" in item for item in violations))

    def test_matching_guard_na_with_reason_passes(self) -> None:
        text = VALID_BLOCK.replace(
            "| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |",
            "| Matching local-view guard | N/A with reason: this is doc-only closure evidence |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertEqual([], violations)

    def test_unrelated_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_ONLY_COMPLETION_2026-06-19.md",
            "Status: CLOSED_PASS_BOUNDED\n",
        )

        self.assertEqual([], violations)

    def test_archive_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/archive/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            "External knowledge intake routing: REQUIRED\n",
        )

        self.assertEqual([], violations)

    def test_absorption_closure_requires_eligibility_block(self) -> None:
        text = "Status: CLOSED_RECONCILED\n\n" + VALID_BLOCK
        violations = MODULE.check_text(
            "docs/reviews/CVF_REPOSITORY_ABSORPTION_CLOSURE.md", text
        )
        self.assertTrue(any("closure claim missing" in item for item in violations))

    def test_source_verified_terminal_absorption_closure_passes(self) -> None:
        text = "Status: CLOSED_RECONCILED\n\n" + VALID_BLOCK + VALID_CLOSURE_BLOCK
        self.assertEqual([], MODULE.check_text(
            "docs/reviews/CVF_REPOSITORY_ABSORPTION_CLOSURE.md", text
        ))

    def test_architecture_overlap_does_not_substitute_for_value_conversion(self) -> None:
        text = (
            "Status: CLOSED_RECONCILED\n\n" + VALID_BLOCK +
            VALID_CLOSURE_BLOCK.replace(
                "ALL_SELECTED_VALUES_IMPLEMENTED_OR_GOVERNED_DEFERRED", "INCOMPLETE"
            )
        )
        violations = MODULE.check_text(
            "docs/reviews/CVF_REPOSITORY_ABSORPTION_CLOSURE.md", text
        )
        self.assertTrue(any("terminal selected-value conversion" in item for item in violations))

    def test_packet_only_incomplete_closure_fails_closed(self) -> None:
        text = (
            "Status: CLOSED_RECONCILED\n\n" + VALID_BLOCK +
            VALID_CLOSURE_BLOCK
            .replace("PINNED_SOURCE_AND_LOCAL_BEHAVIORAL_READS", "OPERATOR_SCOPE_EXIT_WITH_EVIDENCE")
            .replace("ALL_SELECTED_VALUES_IMPLEMENTED_OR_GOVERNED_DEFERRED", "INCOMPLETE")
            .replace("NONE", "43 deferred source paths")
            .replace("ELIGIBLE_ALL_SOURCES_TERMINAL", "NOT_ELIGIBLE_SOURCE_REVIEW_INCOMPLETE")
        )
        violations = MODULE.check_text(
            "docs/reviews/CVF_REPOSITORY_ABSORPTION_CLOSURE.md", text
        )
        self.assertTrue(any("ineligible source-review" in item for item in violations))


class CoordinationBindingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.patch = patch.object(MODULE, "REPO_ROOT", self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.path = "docs/work_orders/CVF_EXTERNAL_AGENT_SAMPLE.md"
        self.parent = "docs/roadmaps/CVF_EXTERNAL_AGENT_PARENT.md"
        self.contract = copy.deepcopy(MODULE.EXPECTED_CONTRACT)
        self.binding = {**self.contract, "contractSha256": hashlib.sha256(
            json.dumps(self.contract, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest(), "parentArtifact": None}
        self.write(MODULE.METHOD_PATH, "## Machine Coordination Contract\n\n```json\n" + json.dumps(self.contract) + "\n```\n")
        self.write(
            MODULE.RELAY_PATH,
            "## Research-Assisted Repository Absorption Profile\n\n```json\n"
            + json.dumps(MODULE.EXPECTED_RESEARCH_ASSISTED_PROFILE)
            + "\n```\n",
        )
        self.write(MODULE.CORE_PATH, json.dumps({"currentMode": "external_repo_absorption"}))
        self.artifact(self.path)

    def write(self, path, text):
        full = self.root / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(text, encoding="utf-8")

    def artifact(self, path, binding=None):
        self.write(path, VALID_BLOCK + "\n## External/Local Coordination Binding\n\n```json\n" + json.dumps(self.binding if binding is None else binding, ensure_ascii=False) + "\n```\n")

    def state(self, binding=None):
        value = copy.deepcopy(self.binding if binding is None else binding)
        value["parentArtifact"] = self.path
        self.write(MODULE.STATE_BINDING, json.dumps({"stateKey": "externalLocalAbsorptionCoordination", "value": value}))

    def program(self, **updates):
        value = {
            "schemaVersion": MODULE.ACTIVE_PROGRAM_SCHEMA,
            "programId": "PILOT-THREE-REPO",
            "status": MODULE.ACTIVE_PROGRAM_STATUS,
            "sourceIds": ["agw", "qm", "dsh"],
            "sourceStates": {"agw": "INCOMPLETE", "qm": "INCOMPLETE", "dsh": "INCOMPLETE"},
            "nextSourceId": "qm",
            "nextActionClass": "CONTINUE_ACTIVE_PROGRAM",
            "expansionAllowed": False,
            "exitDisposition": "RETAIN_ACTIVE_PROGRAM",
            "exitEvidence": [],
            "operatorScopeDecision": None,
            "chainBoundary": "INDEPENDENT_PER_SOURCE_LANES_ONLY",
        }
        value.update(updates)
        self.write(MODULE.ACTIVE_PROGRAM_PATH, json.dumps({
            "stateKey": "activeExternalAbsorptionProgram", "value": value
        }))
        self.write(MODULE.NEXT_MOVE_PATH, json.dumps({
            "stateKey": "nextAllowedMove",
            "value": (
                f"PROGRAM_ID={value['programId']}; NEXT_SOURCE_ID={value['nextSourceId']}; "
                "NEXT_ACTION_CLASS=CONTINUE_ACTIVE_PROGRAM; EXPANSION_ALLOWED=false"
            ),
        }))
        return value

    def test_valid_changed_workorder_and_state(self):
        self.state()
        self.assertEqual([], MODULE.check_paths([self.path, MODULE.STATE_BINDING]))

    def test_each_wrong_invariant_rejected_even_when_sot_agrees(self):
        for key in self.binding["invariants"]:
            with self.subTest(key=key):
                wrong = copy.deepcopy(self.binding)
                wrong["invariants"][key] = "WRONG_BUT_CONSISTENT"
                self.artifact(self.path, wrong)
                self.state(wrong)
                errors = MODULE.check_paths([self.path, MODULE.STATE_BINDING])
                self.assertEqual(2, sum("invariants contradict" in e for e in errors))

    def test_missing_binding_fails(self):
        self.write(self.path, VALID_BLOCK)
        self.assertTrue(MODULE.check_paths([self.path]))

    def test_stale_digest_and_unknown_fields_fail(self):
        for field, value in [("contractSha256", "stale"), ("extra", True)]:
            wrong = copy.deepcopy(self.binding)
            wrong[field] = value
            self.artifact(self.path, wrong)
            self.assertTrue(MODULE.check_paths([self.path]))

    def test_missing_parent_and_unsafe_parent_fail(self):
        for parent in [self.parent, "../escape.md", "D:/outside.md", "docs/reviews/../outside.md", 1]:
            wrong = {**self.binding, "parentArtifact": parent}
            self.artifact(self.path, wrong)
            self.assertTrue(MODULE.check_paths([self.path]))

    def test_parent_contradiction_is_read_without_history_scan(self):
        self.artifact(self.path, {**self.binding, "parentArtifact": self.parent})
        wrong = copy.deepcopy(self.binding)
        wrong["invariants"]["finalDecisionOwner"] = "EXTERNAL"
        self.artifact(self.parent, wrong)
        self.assertTrue(MODULE.check_paths([self.path]))

    def test_cycle_fails(self):
        self.artifact(self.path, {**self.binding, "parentArtifact": self.parent})
        self.artifact(self.parent, {**self.binding, "parentArtifact": self.path})
        self.assertTrue(any("cycle" in e for e in MODULE.check_paths([self.path])))

    def test_depth_limit_fails(self):
        paths = [self.path] + [f"docs/reviews/parent{i}.md" for i in range(9)]
        for i, path in enumerate(paths):
            self.artifact(path, {**self.binding, "parentArtifact": paths[i + 1] if i + 1 < len(paths) else None})
        self.assertTrue(any("depth" in e for e in MODULE.check_paths([self.path])))

    def test_missing_state_on_absorption_continuity_fails(self):
        self.assertTrue(any(MODULE.STATE_BINDING in e for e in MODULE.check_paths([MODULE.CORE_PATH])))

    def test_deleted_state_cannot_be_hidden_by_mode_change(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"unrelated"}')
        self.assertTrue(MODULE.check_paths([MODULE.STATE_BINDING, MODULE.CORE_PATH]))

    def test_null_state_parent_fails(self):
        self.write(MODULE.STATE_BINDING, json.dumps({"stateKey": "externalLocalAbsorptionCoordination", "value": self.binding}))
        self.assertTrue(MODULE.check_paths([MODULE.STATE_BINDING]))

    def test_canonical_method_and_state_cannot_jointly_weaken_owner(self):
        wrong = copy.deepcopy(self.contract)
        wrong["invariants"]["finalDecisionOwner"] = "EXTERNAL"
        self.write(MODULE.METHOD_PATH, "## Machine Coordination Contract\n```json\n" + json.dumps(wrong) + "\n```\n")
        self.assertTrue(any("supported invariant schema" in e for e in MODULE.check_paths([self.path])))

    def test_research_assisted_profile_cannot_be_weakened(self):
        wrong = copy.deepcopy(MODULE.EXPECTED_RESEARCH_ASSISTED_PROFILE)
        wrong["contradictionAuthority"] = "REMOTE_RECONCILIATION_ALLOWED"
        self.write(
            MODULE.RELAY_PATH,
            "## Research-Assisted Repository Absorption Profile\n```json\n"
            + json.dumps(wrong)
            + "\n```\n",
        )
        errors = MODULE.check_paths([self.path])
        self.assertTrue(any("research-assisted absorption profile" in e for e in errors))

    def test_changed_relay_owner_is_checked_directly(self):
        self.assertEqual([], MODULE.check_coordination([MODULE.RELAY_PATH]))

    def test_malformed_duplicate_json_and_duplicate_sections_fail(self):
        text = (self.root / self.path).read_text(encoding="utf-8")
        for changed in [text.replace('"contractId":', '"contractId":null,"contractId":', 1), text + text, text.replace('"contractId":', 'bad-json:', 1)]:
            self.write(self.path, changed)
            self.assertTrue(MODULE.check_paths([self.path]))

    def test_utf8_error_fails_closed(self):
        (self.root / self.path).write_bytes(b"\xff")
        self.assertTrue(MODULE.check_paths([self.path]))

    def test_untouched_history_and_unrelated_change_not_reopened(self):
        self.write(self.parent, "invalid historical binding")
        self.write("docs/reviews/unrelated.md", "Ordinary UI layout correction.")
        self.assertEqual([], MODULE.check_paths(["docs/reviews/unrelated.md"]))
        self.assertEqual([], MODULE.check_paths([self.path]))

    def test_shared_parent_read_once_per_coordination_check(self):
        second = "docs/reviews/CVF_EXTERNAL_AGENT_SECOND.md"
        self.artifact(self.parent)
        linked = {**self.binding, "parentArtifact": self.parent}
        self.artifact(self.path, linked)
        self.artifact(second, linked)
        original = Path.read_text
        reads = []
        def tracked(path, *args, **kwargs):
            reads.append(path)
            return original(path, *args, **kwargs)
        with patch.object(Path, "read_text", tracked):
            self.assertEqual([], MODULE.check_coordination([self.path, second]))
        self.assertEqual(1, reads.count((self.root / self.parent).resolve()))
        self.assertEqual(1, reads.count((self.root / MODULE.METHOD_PATH).resolve()))
        self.assertEqual(1, reads.count((self.root / MODULE.RELAY_PATH).resolve()))
        self.assertEqual(5, len(reads))

    def test_changed_collector_includes_state_and_handoff(self):
        paths = []
        MODULE._add_changed_path(paths, MODULE.STATE_BINDING)
        MODULE._add_changed_path(paths, MODULE.ACTIVE_PROGRAM_PATH)
        MODULE._add_changed_path(paths, "AGENT_HANDOFF_V61_2026-09-13.md")
        self.assertEqual(3, len(paths))

    def test_active_program_with_in_batch_next_source_passes(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        self.program()
        self.assertEqual([], MODULE.check_coordination([MODULE.CORE_PATH, MODULE.ACTIVE_PROGRAM_PATH]))

    def test_active_program_rejects_next_source_outside_batch(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        self.program(nextSourceId="ARCH-ABS-009")
        errors = MODULE.check_coordination([MODULE.CORE_PATH, MODULE.ACTIVE_PROGRAM_PATH])
        self.assertTrue(any("must belong to the active program" in item for item in errors))

    def test_active_program_rejects_next_move_projection_mismatch(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        self.program()
        self.write(MODULE.NEXT_MOVE_PATH, json.dumps({
            "stateKey": "nextAllowedMove", "value": "Next is ARCH-ABS-009"
        }))
        errors = MODULE.check_coordination([MODULE.CORE_PATH, MODULE.NEXT_MOVE_PATH])
        self.assertTrue(any("does not project" in item for item in errors))

    def test_missing_active_program_fails_in_multi_repo_mode(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        errors = MODULE.check_coordination([MODULE.CORE_PATH])
        self.assertTrue(any(MODULE.ACTIVE_PROGRAM_PATH in item for item in errors))

    def test_incomplete_program_cannot_exit_or_expand(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        for updates, phrase in [
            ({"expansionAllowed": True}, "expansionAllowed=false"),
            ({"nextActionClass": "ADMIT_OTHER_PROGRAM"}, "continue the active program"),
            ({"exitDisposition": "TERMINAL_ACCOUNTING_ACCEPTED"}, "retain its program boundary"),
        ]:
            with self.subTest(updates=updates):
                self.program(**updates)
                errors = MODULE.check_coordination([MODULE.CORE_PATH, MODULE.ACTIVE_PROGRAM_PATH])
                self.assertTrue(any(phrase in item for item in errors))

    def test_terminal_exit_requires_all_terminal_and_evidence(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        states = {"agw": "TERMINAL_ACCEPTED", "qm": "INCOMPLETE", "dsh": "TERMINAL_DEFERRED_WITH_TRIGGER"}
        self.program(status="TERMINAL_ACCOUNTED", sourceStates=states,
                     exitDisposition="TERMINAL_ACCOUNTING_ACCEPTED")
        errors = MODULE.check_coordination([MODULE.CORE_PATH, MODULE.ACTIVE_PROGRAM_PATH])
        self.assertTrue(any("terminal source accounting" in item for item in errors))

    def test_operator_scope_exit_requires_governed_decision(self):
        self.write(MODULE.CORE_PATH, '{"currentMode":"multi_repo_absorption_local_recovery"}')
        self.state()
        self.program(status="SCOPE_EXIT_AUTHORIZED", exitDisposition="OPERATOR_SCOPE_DECISION")
        errors = MODULE.check_coordination([MODULE.CORE_PATH, MODULE.ACTIVE_PROGRAM_PATH])
        self.assertTrue(any("operatorScopeDecision" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
