import json
import tempfile
import unittest
from pathlib import Path

from governance.compat import check_package_skill_target_state_feasibility as gate


class TargetStateFeasibilityTests(unittest.TestCase):
    def payload(self) -> dict:
        return {
            "schemaVersion": gate.SCHEMA,
            "skillId": "example-skill",
            "sopPhase": "P8",
            "targetState": {
                "status": "ACTIVE",
                "candidateState": "ACTIVE",
                "uatState": "PASSED",
                "certificationState": "CERTIFIED",
                "internalAgentDisposition": "IMPLEMENTED",
                "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                "truthApprovalStatus": "APPROVED",
                "truthAssuranceLevel": "STRICT",
                "adapterContract": "N/A with reason: deferred",
                "adapterEvidence": "N/A with reason: deferred",
            },
            "externalUseClaimed": False,
            "expectedDecisions": {
                "internalActivation": "ACTIVATION_READY",
                "externalBodyRead": gate.EXTERNAL_BODY_DENIED,
                "externalOutputUse": gate.EXTERNAL_OUTPUT_DENIED,
            },
            "blockerRouting": {
                "technicalDecisionOwner": "LOCAL",
                "workerTerminalReturn": "BLOCKED_WITH_REASON",
                "operatorQuestionAllowed": False,
            },
            "checkerSources": sorted(gate.REQUIRED_CHECKERS),
            "mutations": ["REGISTRY_ENTRY", "PACKAGE_SOURCE", "TRUTH_PACKET"],
        }

    def text(self, payload: dict, *, include_paths: bool = True) -> str:
        paths = "\n".join(sorted(set().union(*gate.PROJECTION_PATHS.values()))) if include_paths else ""
        return (
            f"{gate.CONTROL_HEADING}\n\nP8\n\n{gate.CONTRACT_HEADING}\n\n"
            f"```json\n{json.dumps(payload)}\n```\n\n{paths}\n"
        )

    def test_internal_active_with_deferred_external_is_feasible(self) -> None:
        payload = self.payload()
        self.assertEqual(gate.validate_contract(payload, self.text(payload)), [])

    def test_active_external_claim_without_implemented_adapter_fails(self) -> None:
        payload = self.payload()
        payload["externalUseClaimed"] = True
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("requires externalCliMcpDisposition IMPLEMENTED" in item for item in issues))

    def test_implemented_external_adapter_requires_evidence(self) -> None:
        payload = self.payload()
        payload["externalUseClaimed"] = True
        payload["targetState"]["externalCliMcpDisposition"] = "IMPLEMENTED"
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("concrete targetState.adapterContract" in item for item in issues))
        self.assertTrue(any("concrete targetState.adapterEvidence" in item for item in issues))

    def test_phase_lifecycle_contradiction_fails(self) -> None:
        payload = self.payload()
        payload["targetState"]["status"] = "APPROVED"
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("P8 requires targetState.status ACTIVE" in item for item in issues))

    def test_operator_question_routing_fails_closed(self) -> None:
        payload = self.payload()
        payload["blockerRouting"]["operatorQuestionAllowed"] = True
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("operatorQuestionAllowed must be false" in item for item in issues))

    def test_missing_generated_dependency_fails(self) -> None:
        payload = self.payload()
        issues = gate.validate_contract(payload, self.text(payload, include_paths=False))
        self.assertTrue(any("omits inferred dependent projections" in item for item in issues))

    def test_non_package_work_order_is_not_applicable(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "order.md"
            path.write_text("# ordinary work order\n", encoding="utf-8")
            self.assertEqual(gate.check_path(path), [])



class MetadataOnlyFeasibilityTests(unittest.TestCase):
    def payload(self):
        return {"schemaVersion": gate.SCHEMA, "applicability": gate.METADATA_ONLY,
                "scopeId": "bounded-offline-projection", "sourcePaths": ["governance/compat/example.py"],
                "targetState": {k: "UNCHANGED" for k in gate.UNCHANGED_TARGET_FIELDS},
                "externalUseClaimed": False, "expectedDecisions": {"internalActivation": "NOT_EVALUATED_UNCHANGED", "externalBodyRead": gate.EXTERNAL_BODY_DENIED, "externalOutputUse": gate.EXTERNAL_OUTPUT_DENIED},
                "blockerRouting": {"technicalDecisionOwner": "LOCAL", "workerTerminalReturn": "BLOCKED_WITH_REASON", "operatorQuestionAllowed": False},
                "checkerSources": sorted(gate.REQUIRED_CHECKERS), "mutations": []}

    def text(self, payload, paths=None):
        paths = payload["sourcePaths"] if paths is None else paths
        ledger = {"requirements": [{"expectedArtifacts": paths + ["docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md"]}]}
        table = "## Write Ownership\n\n| Path | Role |\n|---|---|\n" + "\n".join("| " + p + " | worker |" for p in ledger["requirements"][0]["expectedArtifacts"])
        return "Worker return path: `docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md`\nworkerReturnPath: `docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md`\n\n" + gate.CONTROL_HEADING + "\n\nBoundary only.\n\n" + gate.CONTRACT_HEADING + "\n\n```json\n" + json.dumps(payload) + "\n```\n\n" + table + "\n\n## Ledger\n\n```acceptance-ledger-json\n" + json.dumps(ledger) + "\n```\n"

    def test_explicit_bounded_metadata_is_feasible(self):
        p = self.payload()
        self.assertEqual(gate.validate_contract(p, self.text(p)), [])

    def test_all_lifecycle_mutations_rejected(self):
        for mutation in gate.PROJECTION_PATHS:
            with self.subTest(mutation=mutation):
                p = self.payload();p["mutations"] = [mutation]
                self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_all_state_and_external_permission_claims_rejected(self):
        for field in gate.UNCHANGED_TARGET_FIELDS:
            with self.subTest(field=field):
                p = self.payload();p["targetState"][field] = "ACTIVE"
                self.assertTrue(gate.validate_contract(p, self.text(p)))
        p = self.payload();p["externalUseClaimed"] = True
        self.assertTrue(gate.validate_contract(p, self.text(p)))
        p = self.payload();p["expectedDecisions"]["internalActivation"] = "ACTIVATION_READY"
        self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_operator_question_requires_literal_json_false(self):
        for value in (0, 0.0, None):
            with self.subTest(value=value):
                p = self.payload();p["blockerRouting"]["operatorQuestionAllowed"] = value
                self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_unknown_or_fake_phase_fields_rejected(self):
        for field in ("skillId", "sopPhase", "registryMutation", "mutationFamilies"):
            p = self.payload();p[field] = "fake"
            self.assertTrue(gate.validate_contract(p, self.text(p)))
        p = self.payload();p["applicability"] = "NONE"
        self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_structured_scope_drift_rejected(self):
        p = self.payload()
        self.assertTrue(gate.validate_contract(p, self.text(p, ["governance/compat/other.py"])))
        text = self.text(p).replace("| governance/compat/example.py | worker |", "| governance/compat/other.py | worker |")
        self.assertTrue(gate.validate_contract(p, text))
        self.assertTrue(gate.validate_contract(p, gate.CONTRACT_HEADING))

    def test_unsafe_lifecycle_generated_and_receipt_paths_rejected(self):
        paths = ["../escape.py", "C:/escape.py", "governance\\compat\\x.py", "governance/../x.py", "governance//x.py"]
        paths += [prefix + "example.json" for prefix in gate.FORBIDDEN_METADATA_SOURCE_PREFIXES]
        paths += ["docs/reviews/use-proof.json", "docs/receipts/example.json"]
        for path in paths:
            with self.subTest(path=path):
                p = self.payload();p["sourcePaths"] = [path]
                self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_disguised_protected_return_basename_cannot_hide_a_source(self):
        p = self.payload()
        disguised = "docs/reference/agent_system_skills/packages/CVF_EVIL_WORKER_RETURN_x.md"
        self.assertTrue(gate.validate_contract(p, self.text(p, p["sourcePaths"] + [disguised])))

    def test_duplicate_effective_ownership_sections_rejected(self):
        p = self.payload()
        for heading in ("## Write Ownership", "## Write Ownership ##", "   ## Write Ownership"):
            with self.subTest(heading=heading):
                extra = "\n" + heading + "\n\n| Path | Role |\n|---|---|\n| docs/reference/agent_system_skills/registry/evil.json | worker |\n"
                self.assertTrue(gate.validate_contract(p, self.text(p) + extra))

    def test_hidden_ownership_example_cannot_replace_real_scope(self):
        p = self.payload()
        text = self.text(p)
        table = text[text.index("## Write Ownership"):text.index("## Ledger")]
        for wrapper in ("```markdown\n{}\n```\n", "<!--\n{}\n-->\n"):
            with self.subTest(wrapper=wrapper):
                example = wrapper.format(table)
                self.assertEqual(gate.validate_contract(p, example + text), [])
                real_drift = text.replace("| governance/compat/example.py | worker |", "| docs/reference/agent_system_skills/registry/evil.json | worker |")
                self.assertTrue(gate.validate_contract(p, example + real_drift))
                hidden_only = text.replace(table, example)
                self.assertTrue(gate.validate_contract(p, hidden_only))

    def test_hidden_only_ownership_table_cannot_supply_write_scope(self):
        p = self.payload()
        text = self.text(p)
        start = text.index("## Write Ownership") + len("## Write Ownership")
        end = text.index("## Ledger")
        rows = text[start:end]
        for wrapper in ("\n```markdown\n{}\n```\n", "\n<!--\n{}\n-->\n"):
            with self.subTest(wrapper=wrapper):
                hidden_rows = wrapper.format(rows)
                self.assertTrue(gate.validate_contract(p, text[:start] + hidden_rows + text[end:]))
                self.assertEqual(gate.validate_contract(p, text[:end] + hidden_rows + text[end:]), [])

    def test_formal_scalar_cardinality_location_and_identity_are_enforced(self):
        p = self.payload();text = self.text(p)
        self.assertTrue(gate.validate_contract(p, text + "\nworkerReturnPath: `docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md`\n"))
        self.assertTrue(gate.validate_contract(p, text.replace("workerReturnPath: `docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md`", "workerReturnPath: `docs/reviews/OTHER.md`")))
        self.assertTrue(gate.validate_contract(p, text.replace("docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-11-07.md", "docs/reference/agent_system_skills/packages/CVF_EVIL_WORKER_RETURN_x.md")))

    def test_duplicate_keys_rejected_by_actual_contract_parser(self):
        p = self.payload();text = self.text(p).replace('"mutations": []', '"mutations": [], "mutations": []')
        _, issues = gate._contract(text)
        self.assertTrue(issues)

    def test_hidden_ledger_cannot_supply_structured_scope(self):
        p = self.payload();text = self.text(p)
        start = text.index("```acceptance-ledger-json")
        ledger = text[start:]
        for wrapper in ("<!--\n{}\n-->\n", "~~~~markdown\n{}\n~~~~\n"):
            with self.subTest(wrapper=wrapper):
                self.assertTrue(gate.validate_contract(p, text[:start] + wrapper.format(ledger)))
                self.assertEqual(gate.validate_contract(p, wrapper.format(ledger) + text), [])

    def test_hidden_metadata_contract_is_not_an_effective_declaration(self):
        p = self.payload();text = self.text(p)
        start = text.index(gate.CONTRACT_HEADING)
        end = text.index("## Write Ownership")
        contract = text[start:end]
        for wrapper in ("<!--\n{}\n-->\n", "~~~~markdown\n{}\n~~~~\n"):
            with self.subTest(wrapper=wrapper):
                _, issues = gate._contract(text[:start] + wrapper.format(contract) + text[end:])
                self.assertTrue(issues)
                actual, issues = gate._contract(wrapper.format(contract) + text)
                self.assertEqual(issues, [])
                self.assertEqual(actual, p)

    def test_symlink_redirect_rejected(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder);(root / "real").mkdir()
            try:
                (root / "linked").symlink_to(root / "real", target_is_directory=True)
            except OSError as exc:
                self.skipTest("Host disallows disposable symlink fixture: " + str(exc))
            p = self.payload();p["sourcePaths"] = ["linked/example.py"]
            with patch.object(gate, "REPO_ROOT", root):
                self.assertTrue(gate.validate_contract(p, self.text(p)))

    def test_original_phase_matrix_stays_original(self):
        original = TargetStateFeasibilityTests()
        for phase in gate.PHASE_STATUS:
            p = original.payload();p["sopPhase"] = phase
            p["targetState"]["status"] = gate.PHASE_STATUS[phase]
            p["targetState"]["candidateState"] = gate.PHASE_STATUS[phase]
            p["expectedDecisions"]["internalActivation"] = gate.PHASE_DECISION[phase]
            self.assertEqual(gate.validate_contract(p, original.text(p)), [], phase)


if __name__ == "__main__":
    unittest.main()
