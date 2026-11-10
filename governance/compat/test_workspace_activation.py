"""Disposable production-source and installed-consumer activation regressions."""
import copy
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / "scripts/lib/downstream_governance"
sys.path.insert(0, str(LIB))
import cvf_workspace_activation as activation
import cvf_dg_install as installer
from test_downstream_gate_profile import make_project
from test_milestone_coverage import fixture, block


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ActivationTests(unittest.TestCase):
    def git(self, core, *args):
        return subprocess.run(["git", "-C", str(core), *args], check=True,
                              capture_output=True, text=True).stdout.strip()

    def commit_core(self, core):
        self.git(core, "init", "-q")
        self.git(core, "config", "user.name", "fixture")
        self.git(core, "config", "user.email", "fixture@example.invalid")
        if not self.git(core, "remote"):
            self.git(core, "remote", "add", "origin", "https://example.invalid/core")
        self.git(core, "add", ".")
        self.git(core, "commit", "-qm", "production source fixture")
        return self.git(core, "rev-parse", "HEAD")

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.root, self.core = self.base / "project", self.base / "core"
        self.root.mkdir()
        make_project(self.root)
        self.lib = self.core / activation.FAMILY
        shutil.copytree(LIB, self.lib, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        mapped = "governance/compat/check_gate_to_role_closeability.py"
        (self.core / mapped).parent.mkdir(parents=True)
        shutil.copyfile(ROOT / mapped, self.core / mapped)
        self.commit = self.commit_core(self.core)
        self.profile = installer.load_profile(self.lib)
        self.assertEqual(installer.install(self.root, self.lib, self.core, self.commit)["status"], "FRESH_INSTALLED")
        self.write(".cvf/manifest.json", {"cvfCoreCommit": self.commit, "cvfCoreRelativePath": "../core", "cvfCoreRepository": "https://example.invalid/core"})
        self.write(".cvf/policy.json", {"workspaceActivationSourcePolicy": "CORE_ONLY"})
        self.packet = "docs/work_orders/action.md"
        self.put(self.packet, "Status: DRAFT\n\n" + block(fixture(self.root)))
        self.binding = {"packet": self.packet, "sha256": sha(self.root / self.packet), "criteria": ["H01"]}
        self.put("proof/review.txt", "Local reviewed evidence")
        self.put("proof/invoke.txt", "cvf_downstream_gate_runner.py run --phase pre-dispatch")
        self.receipt = {"schemaVersion": "cvf.workspaceActivation@1.0.0",
            "identity": activation.comparison(self.root, self.profile)["identity"],
            "actions": [self.binding], "sourcePolicy": "CORE_ONLY", "reviewer": "Local reviewer", "authority": "project owner",
            "supplemental": [{**activation.comparison(self.root, self.profile)["supplementalRequirement"],
                "owner": "project owner", "actions": ["docs/work_orders/other.md"], "disposition": "HELD",
                "independenceEvidence": [self.review("INDEPENDENCE", activation.SUPPLEMENTAL_ID)]}],
            "controls": [{"id": cid, "owner": "Local", "authority": "project owner", "reason": "reviewed scope",
                          "actions": [self.packet], "actionBindings": [self.binding], "criteria": ["H01"], "disposition": "APPLIED",
                          "evidence": self.ref("proof/review.txt"), "configuredInvocation": self.ref("proof/invoke.txt"),
                          "invocationEvidence": [self.review("INVOCATION", cid)]}
                         for cid in activation.expected_inventory(self.profile)]}
        self.save()

    def put(self, path, value):
        dest = self.root / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(value, encoding="utf-8")

    def write(self, path, value):
        self.put(path, json.dumps(value))

    def ref(self, path):
        return {"path": path, "sha256": sha(self.root / path)}

    def review(self, purpose, control, binding=None):
        binding = self.binding if binding is None else binding
        name = f"proof/{purpose}-{control}-{binding['sha256']}.json"
        self.write(name, {"action": binding, "purpose": purpose, "controlId": control,
                          "reviewer": "independent fixture reviewer", "authority": "project review", "decision": "ACCEPTED"})
        return self.ref(name)

    def save(self):
        self.write(".cvf/workspace-activation.json", self.receipt)

    def check(self, packets=None):
        return activation.check_activation(self.root, self.profile, packets or [self.packet], "pre-dispatch")

    def codes(self):
        return {x.code for x in self.check().findings}

    def test_positive_core_only_and_independent_held_action(self):
        self.assertTrue(self.check().ok, self.check().findings)
        row = self.receipt["controls"][0]
        row["disposition"], row["actions"] = "HELD", ["docs/work_orders/other.md"]
        row["independenceEvidence"] = [self.review("INDEPENDENCE", row["id"])]
        self.save()
        self.assertTrue(self.check().ok, self.check().findings)
        self.receipt["supplemental"][0]["actions"] = [self.packet]
        self.save()
        self.assertIn("ACT_SUPPLEMENTAL_HELD", self.codes())

    def test_unknown_supplemental_cannot_be_omitted_or_independence_unbound(self):
        original = copy.deepcopy(self.receipt["supplemental"])
        self.receipt["supplemental"] = []
        self.save()
        self.assertIn("ACT_SUPPLEMENTAL_UNASSESSED", self.codes())
        self.receipt["supplemental"] = copy.deepcopy(original)
        self.receipt["supplemental"][0].pop("independenceEvidence")
        self.save()
        self.assertIn("ACT_INDEPENDENCE_UNPROVED", self.codes())
        other = {**self.binding, "packet": "docs/work_orders/other.md"}
        self.receipt["supplemental"][0]["independenceEvidence"] = [self.review("INDEPENDENCE", activation.SUPPLEMENTAL_ID, other)]
        self.save()
        self.assertIn("ACT_INDEPENDENCE_UNPROVED", self.codes())

    def test_action_same_path_output_and_budget_change_stale(self):
        original = (self.root / self.packet).read_text()
        for field, value in (("output", "different result"), ("budgetMinutes", 999)):
            data = fixture(self.root)
            data["action"][field] = value
            self.put(self.packet, "Status: DRAFT\n\n" + block(data))
            self.assertIn("ACT_ACTION_STALE", self.codes())
            self.put(self.packet, original)

    def test_each_packet_criteria_and_invocation_evidence_bound(self):
        other = "docs/work_orders/second.md"
        data = fixture(self.root)
        data["action"]["selected"] = ["H02"]
        self.put(other, "Status: DRAFT\n\n" + block(data))
        binding = {"packet": other, "sha256": sha(self.root / other), "criteria": ["H02"]}
        self.receipt["actions"].append(binding)
        self.receipt["supplemental"][0]["independenceEvidence"].append(self.review("INDEPENDENCE", activation.SUPPLEMENTAL_ID, binding))
        for row in self.receipt["controls"]:
            row["actions"].append(other)
            row["actionBindings"].append(binding)
            row["invocationEvidence"].append(self.review("INVOCATION", row["id"], binding))
        self.save()
        checked = self.check([self.packet, other])
        self.assertIn("ACT_CRITERIA_UNASSESSED", {x.code for x in checked.findings})
        for row in self.receipt["controls"]:
            row["criteria"].append("H02")
        self.save()
        self.assertTrue(self.check([self.packet, other]).ok)
        self.receipt["controls"][0]["invocationEvidence"] = [self.review("INVOCATION", self.receipt["controls"][0]["id"], binding)]
        self.save()
        self.assertIn("ACT_APPLIED_UNPROVED", self.codes())

    def test_omitted_control_and_missing_invocation_elements(self):
        row = self.receipt["controls"].pop()
        self.save()
        self.assertIn("ACT_INVENTORY_MISMATCH", self.codes())
        self.receipt["controls"].append(row)
        for key in ("invocationEvidence", "configuredInvocation"):
            old = row.pop(key)
            self.save()
            self.assertIn("ACT_APPLIED_UNPROVED", self.codes())
            row[key] = old

    def test_copied_receipt_stale_policy_and_tamper(self):
        self.receipt["identity"]["projectRootSha256"] = "0" * 64
        self.save()
        self.assertIn("ACT_IDENTITY_STALE", self.codes())
        self.receipt["identity"]["projectRootSha256"] = hashlib.sha256(str(self.root.resolve()).encode()).hexdigest()
        self.save()
        self.write(".cvf/policy.json", {"workspaceActivationSourcePolicy": "CORE_ONLY", "changed": True})
        self.assertIn("ACT_IDENTITY_STALE", self.codes())
        self.put("proof/invoke.txt", "tampered")
        self.assertIn("ACT_APPLIED_UNPROVED", self.codes())

    def test_core_only_never_opens_pack_and_dirty_core_refuses(self):
        marker = self.base / "CVF_RULE_PACKS/ACTIVE_RULE_PACK.json"
        marker.parent.mkdir()
        marker.write_text("not json")
        self.assertEqual(activation.comparison(self.root, self.profile)["delivery"]["mode"], "CORE_ONLY")
        self.assertTrue(self.check().ok)
        (self.core / activation.FAMILY / "cvf_dg_common.py").write_text("tampered")
        self.assertIn("ACT_CORE_INTEGRITY", self.codes())

    def test_marker_core_cannot_claim_current_bundle(self):
        marker = self.base / "marker"
        marker.mkdir()
        (marker / "source").write_text("marker only")
        pin = self.commit_core(marker)
        self.write(".cvf/manifest.json", {"cvfCoreCommit": pin, "cvfCoreRelativePath": "../marker", "cvfCoreRepository": "https://example.invalid/core"})
        self.assertFalse(self.check().ok)
        with self.assertRaises(ValueError):
            activation.comparison(self.root, self.profile)

    def make_pack(self):
        pack = self.base / "CVF_RULE_PACKS/operator-local"
        source = pack / "source"
        profile = installer.load_profile(self.lib)
        artifacts = []
        for name in [*profile["installedFiles"], "downstream_pr_gates.yml.template"]:
            relative = profile.get("coreSources", {}).get(name, f"{activation.FAMILY}/{name}")
            target = source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(self.core / relative, target)
            artifacts.append({"targetPath": target.relative_to(self.base).as_posix(), "sourceSha256": sha(target)})
        manifest = pack / "RULE_PACK_MANIFEST.json"
        manifest.write_text(json.dumps({"profileName": "operator-local", "sourceCommit": self.commit,
                                       "artifactCount": len(artifacts), "artifacts": artifacts}))
        (pack.parent / "ACTIVE_RULE_PACK.json").write_text(json.dumps({"activeProfile": "operator-local",
            "sourceCommit": self.commit, "artifactCount": len(artifacts), "activeProfilePath": manifest.relative_to(self.base).as_posix()}))
        return source, manifest

    def test_permitted_pack_manifest_identity_and_tamper(self):
        _, manifest = self.make_pack()
        self.write(".cvf/policy.json", {"workspaceActivationSourcePolicy": "CORE_AND_SUPPLEMENTAL"})
        observed = activation.comparison(self.root, self.profile)
        self.assertEqual(observed["supplementalRequirement"]["sourceSha256"], sha(manifest))
        self.assertEqual(activation.comparison(self.root, self.profile, True)["delivery"]["mode"], "CORE_ONLY")
        self.receipt["identity"], self.receipt["sourcePolicy"] = observed["identity"], "CORE_AND_SUPPLEMENTAL"
        self.receipt["supplemental"][0].update(observed["supplementalRequirement"])
        self.receipt["supplemental"][0]["sourceSha256"] = "0" * 64
        self.save()
        self.assertIn("ACT_SUPPLEMENTAL_INVALID", self.codes())
        target = manifest.parent / "source" / activation.FAMILY / "cvf_dg_common.py"
        target.write_text("tampered")
        with self.assertRaises(ValueError):
            activation.comparison(self.root, self.profile)

    def test_reviewed_supplemental_upgrade_preserves_old_core_pin_and_custom_ci(self):
        source, manifest = self.make_pack()
        old = self.base / "oldcore"
        shutil.copytree(self.core, old, ignore=shutil.ignore_patterns(".git"))
        old_profile = copy.deepcopy(self.profile)
        old_profile["profileId"], old_profile["profileVersion"] = "cvf.downstreamGateProfile@1.3.0", "1.3.0"
        old_profile["controls"] = [r for r in old_profile["controls"] if r["id"] != activation.CONTROL_ID]
        old_profile["installedFiles"].remove("cvf_workspace_activation.py")
        (old / activation.FAMILY / "cvf_downstream_gate_profile.json").write_text(json.dumps(old_profile))
        (old / activation.FAMILY / "cvf_workspace_activation.py").unlink()
        old_pin = self.commit_core(old)
        self.write(".cvf/manifest.json", {"cvfCoreCommit": old_pin, "cvfCoreRelativePath": "../oldcore", "cvfCoreRepository": "https://example.invalid/core"})
        self.put(".github/workflows/cvf-downstream-gates.yml", "custom owner CI")
        result = installer.install(self.root, source / activation.FAMILY, source, old_pin, upgrade=True)
        self.assertEqual(result["status"], "UPGRADED_CI_RECONCILIATION_REQUIRED")
        self.assertEqual((self.root / ".github/workflows/cvf-downstream-gates.yml").read_text(), "custom owner CI")
        policy = {"workspaceActivationSourcePolicy": "CORE_AND_SUPPLEMENTAL", "workspaceActivationExecutableSource": "OPERATOR_LOCAL_PACK"}
        self.write(".cvf/policy.json", policy)
        self.assertIn("ACT_UPGRADE_UNPROVED", self.codes())
        lock = json.loads((self.root / ".cvf/gate-profile.lock.json").read_text())
        upgrade = {"schemaVersion": "cvf.workspaceActivationUpgrade@1.0.0", "decision": "ACCEPTED",
            "reviewer": "Local independent", "authority": "project upgrade review", "reviewEvidence": self.ref("proof/review.txt"),
            "expected": {"projectCoreCommit": old_pin, "deliveryManifestSha256": sha(manifest),
                         **{k: lock[k] for k in ("profileSha256", "runnerSha256", "bundleSha256")}}}
        self.write("proof/upgrade.json", upgrade)
        policy["workspaceActivationUpgrade"] = self.ref("proof/upgrade.json")
        self.write(".cvf/policy.json", policy)
        observed = activation.comparison(self.root, self.profile)
        self.assertEqual(observed["identity"]["sourceRoute"], "AUTHORIZED_SUPPLEMENTAL")
        self.assertEqual(observed["identity"]["coreCommit"], old_pin)
        self.receipt["identity"], self.receipt["sourcePolicy"] = observed["identity"], "CORE_AND_SUPPLEMENTAL"
        self.receipt["supplemental"] = [{**observed["supplementalRequirement"], "owner": "Local",
            "actions": [self.packet], "disposition": "ASSESSED",
            "reviewEvidence": [self.review("SUPPLEMENTAL_ASSESSMENT", activation.SUPPLEMENTAL_ID)]}]
        self.save()
        self.assertTrue(self.check().ok, self.check().findings)
        with self.assertRaises(ValueError):
            activation.comparison(self.root, self.profile, True)
        policy["workspaceActivationUpgrade"]["sha256"] = "0" * 64
        self.write(".cvf/policy.json", policy)
        self.assertIn("ACT_UPGRADE_UNPROVED", self.codes())

    def test_installed_runner_invokes_activation(self):
        runner = self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
        cmd = [sys.executable, "-B", str(runner), "run", "--phase", "pre-dispatch", "--project-root", str(self.root), "--packet", self.packet, "--json", "--no-receipt"]
        lock = json.loads((self.root / ".cvf/gate-profile.lock.json").read_text())
        for flag, key in (("--expect-profile-sha256", "profileSha256"), ("--expect-runner-sha256", "runnerSha256"), ("--expect-bundle-sha256", "bundleSha256")):
            cmd += [flag, lock[key]]
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, check=False)
        data = json.loads(result.stdout)
        self.assertEqual(result.returncode, 0, result.stdout)
        control = next(x for x in data["results"] if x["controlId"] == activation.CONTROL_ID)
        self.assertEqual(control["outcome"], "PASS", control)
        original = copy.deepcopy(self.receipt)
        for mutation in ("omit_hold", "omit_independence", "action_bytes"):
            self.receipt = copy.deepcopy(original)
            if mutation == "omit_hold":
                self.receipt["supplemental"] = []
            elif mutation == "omit_independence":
                self.receipt["supplemental"][0].pop("independenceEvidence")
            else:
                self.put(self.packet, (self.root / self.packet).read_text() + "\nchanged output/budget contract")
            self.save()
            denied = subprocess.run(cmd, env=env, capture_output=True, text=True, check=False)
            actual = next(x for x in json.loads(denied.stdout)["results"] if x["controlId"] == activation.CONTROL_ID)
            self.assertEqual(actual["outcome"], "FAIL", (mutation, actual))
            self.assertNotEqual(denied.returncode, 0)
        self.receipt = copy.deepcopy(original)
        self.put(self.packet, "Status: DRAFT\n\n" + block(fixture(self.root)))
        self.receipt["controls"].pop()
        self.save()
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, check=False)
        control = next(x for x in json.loads(result.stdout)["results"] if x["controlId"] == activation.CONTROL_ID)
        self.assertEqual(control["outcome"], "FAIL")
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
