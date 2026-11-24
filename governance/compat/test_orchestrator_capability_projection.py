"""Offline contract, hostile-input and unchanged legacy-output proofs."""
import copy
import hashlib
import io
import json
import sys
import tempfile
import unittest
from contextlib import ExitStack, redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import orchestrator_capability_projection as projection
import run_skill_control_plane_inventory as cli


def request(**overrides):
    value = {"task": {"text": "frontend ui", "taskClass": "frontend-implementation", "role": "worker",
                      "phase": "WORKER_EXECUTION", "surface": "docs/reviews", "riskCeiling": "R1"},
             "nativeDecision": {"suffices": False, "reason": "Need domain guidance"}}
    value.update(overrides)
    return value


def row(skill_id="ui", **overrides):
    value = {"sourceType": "assf_package", "entry": {"skillId": skill_id, "name": "UI", "version": "0.1.0",
             "taskClasses": ["frontend-implementation"], "roles": ["worker"], "phases": ["WORKER_EXECUTION"],
             "surfaces": ["docs/reviews"], "riskProfile": "R1", "riskCeiling": "R1", "dependencies": [], "conflicts": []},
             "profile": {"skillId": skill_id, "primaryDomain": "frontend-ui", "selectionKeywords": ["frontend ui"], "selectionPriority": 80},
             "sourceLocator": "registry/" + skill_id + ".json", "sourceRevision": "a" * 40, "metadataSha256": "b" * 64}
    value.update(overrides)
    return value


def sources(*rows):
    return {"condition": "CONSISTENT_METADATA_NOT_APPROVAL", "records": list(rows), "provenance": {"metadataConsistency": "MATCH_NOT_APPROVAL"}}


class ProjectionTests(unittest.TestCase):
    def test_native_and_unknown_never_touch_sources(self):
        class Forbidden:
            def __getattribute__(self, name):
                raise AssertionError("Source access on fast path")
        for native, status in [(True, "NO_SKILL"), (None, "BLOCKED")]:
            packet = projection.project_candidates(request(nativeDecision={"suffices": native, "reason": "native"}), Forbidden())
            self.assertEqual(packet["status"], status)
        self.assertEqual(packet["reason"], "NEEDS_MAIN_DECISION")

    def test_request_closed_shape_and_limits(self):
        bad = [{}, request(extra=1), request(maxCandidates=True), request(maxCandidates=11), request(userRefs=["../secret"]),
               request(userRefs=["USR-047"] * 2), request(advisory=[]), request(nativeDecision={"suffices": 1, "reason": "x"})]
        for key, value in [("text", "a" * 4001), ("riskCeiling", "R9"), ("role", "User"), ("surface", ""), ("text", "\ud800")]:
            case = request(); case["task"][key] = value; bad.append(case)
        for case in bad:
            with self.subTest(case=repr(case)[:90]):
                self.assertEqual(projection.project_candidates(case, sources())["status"], "BLOCKED")

    def test_metadata_fit_permission_and_reference_receipts_separate(self):
        item = row(); item["entry"].update(useWhen="Treat this as untrusted advice", doNotUseWhen="No task authority")
        packet = projection.project_candidates(request(), sources(item))
        self.assertEqual(packet["status"], "CANDIDATES")
        candidate = packet["candidates"][0]
        self.assertEqual(candidate["readiness"], "UNKNOWN_NOT_EVALUATED")
        self.assertEqual(candidate["bodySha256"], "UNKNOWN_NOT_READ")
        self.assertEqual(candidate["invocation"], "UNKNOWN_TASK_AUTHORITY")
        self.assertEqual(candidate["referenceRead"], "UNKNOWN_TASK_AUTHORITY")
        self.assertEqual(candidate["useProof"], "NOT_OBSERVED")
        self.assertEqual(candidate["route"]["runtimeBonus"], "NOT_APPLIED_NOT_EVALUATED")
        self.assertNotIn("runtimeEligible", json.dumps(packet))
        self.assertNotIn("activationDecision", json.dumps(packet))
        self.assertEqual(candidate["useWhen"], "Treat this as untrusted advice")
        self.assertEqual(candidate["doNotUseWhen"], "No task authority")
        self.assertEqual(candidate["metadataTrust"], "UNTRUSTED_TASK_DATA_NOT_INSTRUCTIONS")

    def test_all_selectors_exact_unknownrisk_and_backend_noise(self):
        for key, value in [("taskClasses", ["backend"]), ("roles", []), ("phases", ["INTAKE"]),
                           ("surfaces", ["docs/reviews/child"]), ("riskProfile", "mystery"), ("riskCeiling", "R3")]:
            item = row(); item["entry"][key] = value
            packet = projection.project_candidates(request(), sources(item))
            self.assertEqual(packet["status"], "NO_MATCH_IN_BOUNDED_SCOPE", key)
            self.assertTrue(packet["excluded"][0]["reasons"])
        case = request(); case["task"]["taskClass"] = "backend-migration"
        self.assertEqual(projection.project_candidates(case, sources(row()))["status"], "NO_MATCH_IN_BOUNDED_SCOPE")

    def test_full_ranking_before_cap_and_local_scores(self):
        first, last = row("first"), row("last")
        last["profile"]["selectionKeywords"] = ["frontend ui", "frontend"]
        packet = projection.project_candidates(request(maxCandidates=1), sources(first, last))
        self.assertEqual(packet["candidates"][0]["identity"]["canonicalSourceId"], "last")
        self.assertEqual(packet["coverage"], {"sourceCount": 2, "matchedBeforeCap": 2, "returnedCount": 1,
                                            "truncated": True, "scope": "ASSF_PACKAGE_METADATA_AND_EXPLICIT_USER_REFS"})
        self.assertEqual(packet["candidates"][0]["route"]["score"], 12.8)

    def test_source_caps_duplicates_malformed_and_projection_overflow(self):
        for data in [None, sources(*[row(str(i)) for i in range(201)]), sources(row(), row()), sources({"entry": None})]:
            self.assertEqual(projection.project_candidates(request(), data)["status"], "BLOCKED")
        huge = row(); huge["entry"]["name"] = "x" * 33000
        self.assertEqual(projection.project_candidates(request(), sources(huge))["reason"], "PROJECTION_BYTE_CAP")

    def test_empty_records_never_fall_back_to_inventory(self):
        with patch("generate_skill_control_plane_inventory.build_inventory", side_effect=AssertionError("forbidden fallback")):
            self.assertEqual(projection.project_candidates(request(), sources())["status"], "NO_MATCH_IN_BOUNDED_SCOPE")

    def test_snapshot_stable_and_drift_bound_without_timestamp_or_advice(self):
        original = projection.project_candidates(request(), sources(row()))
        self.assertEqual(original, projection.project_candidates(request(), sources(row())))
        changed = row(); changed["metadataSha256"] = "c" * 64
        newer = projection.project_candidates(request(), sources(changed))
        self.assertNotEqual(original["snapshotId"], newer["snapshotId"])
        advice = {"snapshotId": original["snapshotId"], "selectedRef": original["candidates"][0]["ref"], "reason": "fit"}
        with_advice = projection.project_candidates(request(advisory=advice), sources(row()))
        self.assertEqual(with_advice["snapshotId"], original["snapshotId"])
        self.assertEqual(with_advice["finalDecision"], "PENDING")
        self.assertEqual(projection.validate_advisory(newer, advice)["status"], "BLOCKED")
        duplicate = projection.project_candidates(request(), sources(row(), changed))
        self.assertEqual(duplicate["reason"], "DUPLICATE_SOURCE_ID_OR_DRIFT")
        self.assertEqual([x["metadataSha256"] for x in duplicate["sourceObservations"]], ["b" * 64, "c" * 64])
        with_time = sources(row()); with_time["provenance"]["generatedAt"] = "arbitrary caller timestamp"
        self.assertEqual(projection.project_candidates(request(), with_time)["snapshotId"], original["snapshotId"])

    def test_advice_and_main_choice_separate_and_hostile_refs(self):
        packet = projection.project_candidates(request(), sources(row("a"), row("b")))
        ref = packet["candidates"][0]["ref"]
        for selected in ["foreign", [], {}]:
            advice = {"snapshotId": packet["snapshotId"], "selectedRef": selected, "reason": "x"}
            self.assertEqual(projection.validate_advisory(packet, advice)["status"], "BLOCKED")
        for kind, refs in [("SINGLE", []), ("NONE", [ref]), ("SINGLE", ["foreign"]), ({}, []), ("PROPOSED_COMPOSITION", [ref, ref])]:
            choice = {"snapshotId": packet["snapshotId"], "kind": kind, "selectedRefs": refs, "reason": "x"}
            self.assertEqual(projection.bind_main_decision(packet, choice)["status"], "BLOCKED")
        advisory = projection.validate_advisory(packet, {"snapshotId": packet["snapshotId"], "selectedRef": ref, "reason": "x"})
        none = projection.bind_main_decision(advisory, {"snapshotId": packet["snapshotId"], "kind": "NONE", "selectedRefs": [], "reason": "native instead"})
        self.assertEqual(none["advisory"]["selectedRef"], ref)
        self.assertEqual(none["finalDecision"]["kind"], "NONE")

    def test_pure_binding_recomputes_snapshot_after_packet_tampering(self):
        packet = projection.project_candidates(request(), sources(row()))
        ref = packet["candidates"][0]["ref"]
        advice = {"snapshotId": packet["snapshotId"], "selectedRef": ref, "reason": "fit"}
        decision = {"snapshotId": packet["snapshotId"], "kind": "SINGLE", "selectedRefs": [ref], "reason": "fit"}
        for field, value in [("ref", "forged"), ("metadataSha256", "d" * 64), ("title", "different title")]:
            changed = copy.deepcopy(packet); changed["candidates"][0][field] = value
            self.assertEqual(projection.validate_advisory(changed, advice)["status"], "BLOCKED")
            self.assertEqual(projection.bind_main_decision(changed, decision)["status"], "BLOCKED")
        self.assertEqual(projection.bind_main_decision(projection.validate_advisory(packet, advice), decision)["finalDecision"]["kind"], "SINGLE")

    def test_composition_unverified_and_no_quantity_preference(self):
        a, b = row("a"), row("b"); a["entry"]["dependencies"] = ["missing"]; b["entry"]["conflicts"] = ["a"]
        packet = projection.project_candidates(request(), sources(a, b))
        self.assertEqual([c["route"]["score"] for c in packet["candidates"]], [7.8, 7.8])
        result = projection.bind_main_decision(packet, {"snapshotId": packet["snapshotId"], "kind": "PROPOSED_COMPOSITION",
                     "selectedRefs": [c["ref"] for c in packet["candidates"]], "reason": "separate tasks"})
        self.assertEqual(result["finalDecision"]["composition"], "COMPOSITION_UNVERIFIED")
        self.assertEqual(result["candidates"][0]["dependencies"], ["missing"])

    def test_user_identity_and_unknown_mapping_never_title_dedup(self):
        user = row("USR-047", sourceType="user_skill", profile=None)
        packet = projection.project_candidates(request(userRefs=["USR-047"]), sources(row(), user))
        self.assertEqual(len(packet["candidates"]), 2)
        self.assertEqual(packet["candidates"][1]["invocation"], "UNKNOWN_UNMAPPED")
        self.assertNotEqual(packet["candidates"][0]["ref"], packet["candidates"][1]["ref"])
        self.assertEqual(projection.project_candidates(request(userRefs=["USR-999"]), sources())["status"], "BLOCKED")


class CliTests(unittest.TestCase):
    def invoke(self, argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = cli.main(argv)
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue(), err.getvalue()

    def test_fast_paths_and_invalid_requests_zero_metadata_git_body(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "request.json"
            with patch.object(cli, "_metadata_sources", side_effect=AssertionError("metadata forbidden")), patch.object(cli, "build_inventory", side_effect=AssertionError("body-bearing inventory forbidden")), patch.object(cli.subprocess, "run", side_effect=AssertionError("Git forbidden")):
                for native in [True, None]:
                    path.write_text(json.dumps(request(nativeDecision={"suffices": native, "reason": "native"})))
                    code, out, _ = self.invoke(["--orchestrator-request", str(path), "--json"])
                    self.assertEqual(code, 0); self.assertIn(json.loads(out)["status"], ["NO_SKILL", "BLOCKED"])
                for content in ['{"task":1,"task":2}', '{"secret":', 'x' * 32769, '{"task":NaN}']:
                    path.write_text(content)
                    code, out, err = self.invoke(["--orchestrator-request", str(path), "--json"])
                    self.assertEqual((code, out), (2, "")); self.assertNotIn("secret", err)

    def test_new_route_unicode_roundtrips_through_strict_cp1252_stdout(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); stack, entries, index, _ = self.fixture_stack(root)
            title = "Giao di\u1ec7n ti\u1ebfng Vi\u1ec7t"
            for path in [entries / "ui.json", index]:
                data = json.loads(path.read_text())
                (data["skills"][0] if path == index else data)["name"] = title
                path.write_text(json.dumps(data), encoding="utf-8")
            case = request(); case["task"]["text"] = "frontend ui ti\u1ebfng Vi\u1ec7t"
            path = root / "request.json"; path.write_text(json.dumps(case), encoding="utf-8")
            buffer = io.BytesIO()
            stream = io.TextIOWrapper(buffer, encoding="cp1252", errors="strict", newline="\n")
            with stack, redirect_stdout(stream):
                code = cli.main(["--orchestrator-request", str(path), "--json"])
            stream.flush()
            raw = buffer.getvalue()
            self.assertTrue(raw.isascii())
            packet = json.loads(raw.decode("cp1252"))
            self.assertEqual(code, 0)
            self.assertEqual(packet["status"], "CANDIDATES")
            self.assertEqual(packet["task"]["text"], case["task"]["text"])
            self.assertEqual(packet["candidates"][0]["title"], title)
            stream.detach()

    def test_conflicting_flags_rejected_before_inventory(self):
        with patch.object(cli, "build_inventory", side_effect=AssertionError("forbidden")):
            for flag in ["--top=5", "--summary-only", "--runtime-only", "--skill-id=x", "--spec-text=x", "--spec-file=x"]:
                self.assertEqual(self.invoke(["--orchestrator-request=x", "--json", flag])[0], 2)
            self.assertEqual(self.invoke(["--orchestrator-request=x"])[0], 2)

    def metadata_fixture(self, root):
        entries = root / "entries"; entries.mkdir()
        item = row()["entry"]; item["canonicalRoot"] = "docs/reference/agent_system_skills/packages/ui/SKILL.md"
        (entries / "ui.json").write_text(json.dumps({**item, "registryOrder": 1}))
        index = root / "index.json"; index.write_text(json.dumps({"skills": [item]}))
        profiles = root / "profiles.json"; profiles.write_text(json.dumps({"profiles": [row()["profile"]]}))
        return entries, index, profiles

    def fixture_stack(self, root, dirty=""):
        entries, index, profiles = self.metadata_fixture(root)
        stack = ExitStack()
        for name, value in [("REPO_ROOT", root), ("ENTRIES_DIR", entries), ("INDEX_PATH", index), ("SELECTION_PROFILES_PATH", profiles)]:
            stack.enter_context(patch.object(cli, name, value))
        stack.enter_context(patch.object(cli.subprocess, "run", side_effect=lambda argv, **_: SimpleNamespace(stdout=("a" * 40 if argv[1] == "rev-parse" else dirty))))
        stack.enter_context(patch.object(cli, "build_inventory", side_effect=AssertionError("inventory/body forbidden")))
        return stack, entries, index, profiles

    def test_actual_bounded_metadata_cli_and_advisory_roundtrip(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); stack, _, _, _ = self.fixture_stack(root)
            with stack:
                path = root / "request.json"; path.write_text(json.dumps(request()))
                code, out, _ = self.invoke(["--orchestrator-request", str(path), "--json"])
                packet = json.loads(out); self.assertEqual(code, 0); self.assertEqual(packet["status"], "CANDIDATES")
                choice = {"snapshotId": packet["snapshotId"], "kind": "SINGLE", "selectedRefs": [packet["candidates"][0]["ref"]], "reason": "fit"}
                path.write_text(json.dumps(request(mainDecision=choice)))
                self.assertEqual(json.loads(self.invoke(["--orchestrator-request", str(path), "--json"])[1])["finalDecision"]["kind"], "SINGLE")

    def test_metadata_drift_duplicate_profile_dirty_and_byte_caps(self):
        for fault in ["index", "profile", "dirty", "oversize", "duplicate"]:
            with self.subTest(fault=fault), tempfile.TemporaryDirectory() as folder:
                root = Path(folder); stack, entries, index, profiles = self.fixture_stack(root, " M index.json" if fault == "dirty" else "")
                with stack:
                    if fault == "index": index.write_text(json.dumps({"skills": []}))
                    if fault == "profile": profiles.write_text(json.dumps({"profiles": [row()["profile"]] * 2}))
                    if fault == "oversize": index.write_bytes(b" " * (cli.METADATA_LIMIT + 1))
                    if fault == "duplicate": (entries / "second.json").write_bytes((entries / "ui.json").read_bytes())
                    with self.assertRaises(ValueError): cli._metadata_sources([])

    def test_user_registry_exact_identity_no_follow_source_link(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); stack, _, _, _ = self.fixture_stack(root)
            user = root / "users"; user.mkdir()
            (user / "INDEX.md").write_text("- [USR-047_x.gov.md](./USR-047_x.gov.md) - UI\n")
            (user / "USR-047_x.gov.md").write_text("# USR-047: UI\n> **Type:** User Skill\n## Source\n[secret body](../must-not-open.skill.md)\n")
            with stack, patch.object(cli, "USER_REGISTRY", user):
                data = cli._metadata_sources(["USR-047"])
                packet = projection.project_candidates(request(userRefs=["USR-047"]), data)
                self.assertEqual(packet["candidates"][-1]["invocation"], "UNKNOWN_UNMAPPED")
                with self.assertRaises(ValueError): cli._metadata_sources(["USR-999"])
                (user / "INDEX.md").write_text("- [x](./USR-047_x.gov.md)\n- [x](./USR-047_x.gov.md)\n")
                with self.assertRaises(ValueError): cli._metadata_sources(["USR-047"])

    def test_redirected_metadata_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); stack, _, index, _ = self.fixture_stack(root)
            with stack, patch.object(Path, "resolve", lambda path: root / "foreign"):
                with self.assertRaises(ValueError): cli._metadata_sources([])

    def test_legacy_main_output_exact_parity_with_frozen_preimage(self):
        frozen = HERE.parents[1] / "docs/reviews/evidence/ccp-r1-20261106/frozen-fixture.json"
        raw = frozen.read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), "78ad9b71378e8ff2d102b3f43cd3322fb34af78be953e0a6a976adbbfb431b7b")
        inventory = json.loads(raw)["inventory"]
        # Execute immutable original CLI source from the release commit, never regenerate expected output.
        original = __import__("subprocess").check_output(["git", "show", "6a6e072bf053590259a9a586421a065754671544:governance/compat/run_skill_control_plane_inventory.py"], cwd=HERE.parents[1])
        namespace = {"__file__": str(HERE / "run_skill_control_plane_inventory.py"), "__name__": "frozen_cli"}
        exec(compile(original, "original-cli", "exec"), namespace)
        for argv in [[], ["--json"], ["--summary-only", "--json"], ["--skill-id", "missing", "--json"], ["--spec-text", "frontend ui", "--json"], ["--spec-text", "frontend ui", "--runtime-only", "--top", "2"]]:
            out = io.StringIO(); namespace["build_inventory"] = lambda: copy.deepcopy(inventory)
            with redirect_stdout(out): expected_code = namespace["main"](argv)
            with patch.object(cli, "build_inventory", return_value=copy.deepcopy(inventory)):
                code, actual, err = self.invoke(argv)
            self.assertEqual((code, actual, err), (expected_code, out.getvalue(), ""))


if __name__ == "__main__":
    unittest.main()
