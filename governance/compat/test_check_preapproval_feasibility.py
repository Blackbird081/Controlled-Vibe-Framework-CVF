"""Seven grouped defect classes for the opt-in preapproval feasibility guard.

Fixtures are disposable temp directories or temp Git repositories; the real
frozen S1 predecessor is only read and copied, never edited.
"""
import atexit
import copy
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

COMPAT = Path(__file__).resolve().parent
REPO = COMPAT.parents[1]
if str(COMPAT) not in sys.path:
    sys.path.insert(0, str(COMPAT))

import agent_autorun_command_catalog as catalog  # noqa: E402
import check_semantic_convergence_control as scec  # noqa: E402
import local_governance_hook_catalog_pre_commit as pre_commit  # noqa: E402
import local_governance_hook_catalog_reviewer_fast as reviewer_fast  # noqa: E402
import preapproval_feasibility_contract as pf  # noqa: E402

RUNNER = "governance/compat/run_preapproval_feasibility_gate.py"
CHECKER = "governance/compat/check_preapproval_feasibility.py"
PRED = "docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_WORKER_RETURN_2026-10-03.md"
PRED_SHA = "12116c9c696752b487b74de9d6ec75bd3e53e90efad92b8f6a6f7f72512bd6ce"
EVID = "docs/reviews/evidence/resolution-evidence.md"
GOOD_EVID = "# Evidence\n\nresolution-locator-unique\n"
_CHILD_INVOCATIONS = []

def recorded_run(command, **kwargs):
    done = subprocess.run(command, **kwargs)
    _CHILD_INVOCATIONS.append({"category": Path(command[1] if command[0] == "git" else command[2] if len(command) > 2 else command[0]).name,
                               "exitCode": done.returncode})
    return done

@atexit.register
def _write_child_count():
    path = os.environ.get("CVF_PREFEAS_CHILD_LOG")
    if path:
        Path(path).write_text(json.dumps({"completed": len(_CHILD_INVOCATIONS),
                                          "invocations": _CHILD_INVOCATIONS}), encoding="utf-8")

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def digest(obj) -> str:
    return sha(json.dumps(obj, sort_keys=True, ensure_ascii=True, separators=(",", ":")).encode("utf-8"))

def write(root: Path, rel: str, data) -> Path:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data if isinstance(data, bytes) else data.encode("utf-8"))
    return path

@pytest.fixture
def root(tmp_path):
    real = (REPO / PRED).read_bytes()
    assert sha(real) == PRED_SHA, "frozen S1 predecessor changed; fixture binding must be re-derived"
    write(tmp_path, PRED, real)
    return tmp_path

def pred_block() -> dict:
    return scec.find_active_blocks((REPO / PRED).read_text(encoding="utf-8"))[0]

def initial_ok() -> dict:
    empty = {key: [] for key in ("prior", "resolved", "retained", "new", "reopened", "current")}
    counters = {key: 0 for key in scec.REQUIRED_COUNTER_FIELDS}
    return {
        "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": "preapproval-fixture", "chainMode": "INITIAL",
        "chainOrdinal": 0, "predecessor": None, "blockerDelta": empty, "resolutionEvidence": {}, "counters": counters,
        "claims": [], "requiredDisposition": "CONTINUE_BOUNDED", "successorScope": "INITIAL_BOUNDED",
    }

def root_contract() -> dict:
    block = initial_ok()
    block.update(requiredDisposition="ROOT_CONTRACT_REQUIRED", successorScope="INTEGRATED_ROOT_CONTRACT")
    block["counters"]["sameClaimCorrections"] = 2
    return block

def succ(*, streak=2, disposition="STOP_REASSESS_ARCHITECTURE", pred_sha=PRED_SHA, key=None, resolved=(), evidence=None) -> dict:
    pred = pred_block()
    current = pred["blockerDelta"]["current"]
    retained = [item for item in current if item not in resolved]
    block = copy.deepcopy(pred)
    block.update(
        problemKey=key or pred["problemKey"], chainOrdinal=pred["chainOrdinal"] + 1,
        predecessor={"path": PRED, "sha256": pred_sha}, requiredDisposition=disposition,
        resolutionEvidence=evidence or {},
    )
    block["blockerDelta"] = {"prior": list(current), "resolved": list(resolved), "retained": retained, "new": [], "reopened": [], "current": retained}
    block["counters"]["nonDecreasingBlockerTransitions"] = streak
    return block

def reducing(evidence_class="ACCEPTED_REVIEW", locator="resolution-locator-unique", path=EVID, sha_value=None) -> dict:
    victim = pred_block()["blockerDelta"]["current"][0]
    binding = {"evidenceClass": evidence_class, "evidencePath": path, "sha256": sha_value or sha(GOOD_EVID.encode()), "locator": locator}
    return succ(streak=0, disposition="CONTINUE_BOUNDED", resolved=(victim,), evidence={victim: binding})

def make(root, outcome=None, *, name="p", pp=None, queue=None, header=None, tweak=None, prop_bytes=None, comp_bytes=None, evid=GOOD_EVID):
    prop, comp_rel = f"docs/reference/{name}.md", f"docs/reviews/evidence/{name}.json"
    header = header if header is not None else f"Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: {comp_rel}\n"
    data = prop_bytes if prop_bytes is not None else f"# Proposal\n\n{header}\nBody text.\n".encode("utf-8")
    write(root, prop, data)
    outcome = outcome if outcome is not None else initial_ok()
    comp = {
        "schemaVersion": pf.COMPANION_SCHEMA, "proposal": {"path": prop, "sha256": sha(data)},
        "approvalTarget": {"path": prop, "sha256": sha(data), "prospectiveOutcomeSha256": digest(outcome)},
        "prospectiveOutcome": outcome, "phasePrerequisites": pp or {"phase": "documentary-plan", "rows": []}, "requestQueue": queue,
    }
    if tweak:
        tweak(comp)
    if evid is not None:
        write(root, EVID, evid)
    if comp_bytes is not False:
        write(root, comp_rel, comp_bytes if comp_bytes is not None else json.dumps(comp, indent=1))
    return prop, comp_rel

def run_eval(root, prop, **kwargs):
    return pf.evaluate(root, prop, kwargs.pop("target", prop), **kwargs)

def codes(receipt) -> set:
    return {d["code"] for d in receipt["diagnostics"]} | {v["code"] for v in receipt["canonicalViolations"]}

def cli(root, prop, target="__same__", script=RUNNER):
    cmd = [sys.executable, "-B", script, "--repo-root", str(root), "--json"]
    if prop is not None:
        cmd += ["--proposal", prop, "--approval-target", prop if target == "__same__" else target]
    done = recorded_run(cmd, cwd=REPO, capture_output=True, text=True, encoding="utf-8")
    return done.returncode, json.loads(done.stdout)

def git(root, *args):
    recorded_run(["git", "-c", "user.email=t@example.invalid", "-c", "user.name=t", "-c", "commit.gpgsign=false", *args], cwd=root, check=True, capture_output=True)

def git_fixture(root):
    git(root, "init", "-q")
    write(root, "README.txt", "seed\n")
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "seed")

def range_cli(root, base="HEAD", head="HEAD", extra=()):
    cmd = [sys.executable, "-B", CHECKER, "--base", base, "--head", head, "--enforce", "--repo-root", str(root), *extra]
    done = recorded_run(cmd, cwd=REPO, capture_output=True, text=True, encoding="utf-8")
    return done.returncode, done.stdout

# Class 1: real hash-bound frozen predecessor with all four retained blockers.
def test_frozen_predecessor_precondition():
    pred = pred_block()
    assert pred["chainOrdinal"] == 1 and len(pred["blockerDelta"]["current"]) == 4
    assert [pred["counters"][k] for k in scec.REQUIRED_COUNTER_FIELDS] == [0, 0, 1, 1]

@pytest.mark.parametrize("streak,disposition,code", [
    (1, "CONTINUE_BOUNDED", "NON_DECREASING_STREAK_MISMATCH"),
    (2, "CONTINUE_BOUNDED", "MISSING_STOP_REASSESS_ESCALATION"),
])
def test_class1_copied_and_corrected_continue_are_rejected(root, streak, disposition, code):
    prop, _ = make(root, succ(streak=streak, disposition=disposition))
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and code in codes(receipt)
    assert receipt["canonicalBlockCount"] == 1 and receipt["effectAdmission"] is False
    exit_code, cli_receipt = cli(root, prop)
    assert exit_code == 1 and code in codes(cli_receipt)

# Class 2: correct STOP validates but cannot release.
@pytest.mark.parametrize("builder", [succ, root_contract], ids=["stop", "root-contract"])
def test_class2_valid_escalation_is_hold_and_nonzero(root, builder):
    prop, _ = make(root, builder())
    receipt = run_eval(root, prop)
    assert receipt["canonicalViolations"] == [] and receipt["technicalDisposition"] == "HOLD"
    assert receipt["effectAdmission"] is False and receipt["operatorApprovalRequired"] is True
    exit_code, cli_receipt = cli(root, prop)
    assert exit_code == 2 and cli_receipt["technicalDisposition"] == "HOLD"

# Class 3: identity, digest, declaration and path drift all reject.
def _m(outcome=None, **kw):
    return lambda root: make(root, outcome if outcome is not None else initial_ok(), **kw)[0]

def _tweak(fn):
    return lambda root: make(root, tweak=fn)[0]

MUTATIONS = {
    "stale-predecessor-digest": (lambda r: make(r, succ(pred_sha="f" * 64))[0], "PREDECESSOR_HASH_MISMATCH"),
    "problem-key-rename": (lambda r: make(r, succ(key="renamed-key"))[0], "PREDECESSOR_PROBLEM_KEY_MISMATCH"),
    "predecessor-bytes-drift": (lambda r: (write(r, PRED, (REPO / PRED).read_bytes() + b"\n"), make(r, succ())[0])[1], "PREDECESSOR_HASH_MISMATCH"),
    "predecessor-missing": (lambda r: (( r / PRED).unlink(), make(r, succ())[0])[1], "PREDECESSOR_PATH_UNREADABLE"),
    "companion-line-missing": (_m(header="Preapproval-Feasibility: REQUIRED\n"), "COMPANION_MISSING"),
    "companion-file-missing": (_m(comp_bytes=False), "COMPANION_UNREADABLE"),
    "companion-malformed-json": (_m(comp_bytes="{not json"), "COMPANION_MALFORMED_JSON"),
    "companion-duplicate-key": (_m(comp_bytes='{"schemaVersion": "a", "schemaVersion": "b"}'), "COMPANION_MALFORMED_JSON"),
    "companion-invalid-utf8": (_m(comp_bytes=b"\xff\xfe{}"), "COMPANION_MALFORMED_JSON"),
    "marker-duplicate": (_m(header="Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"), "MARKER_DUPLICATE"),
    "marker-malformed": (_m(header="Preapproval-Feasibility: required\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"), "MARKER_MALFORMED"),
    "companion-duplicate": (_m(header="Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"), "COMPANION_DUPLICATE"),
    "companion-without-marker": (_m(header="Preapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"), "MARKER_MISSING"),
    "companion-traversal": (_m(header="Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: ../x.json\n"), "COMPANION_PATH_INVALID"),
    "companion-absolute": (_m(header="Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: /x.json\n"), "COMPANION_PATH_INVALID"),
    "companion-backslash": (_m(header="Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: a\\x.json\n"), "COMPANION_PATH_INVALID"),
    "proposal-invalid-utf8": (_m(prop_bytes=b"# P\n\xff\xfe\n"), "PROPOSAL_NOT_UTF8"),
    "proposal-hash-drift": (_tweak(lambda c: c["proposal"].update(sha256="0" * 64)), "PROPOSAL_HASH_DRIFT"),
    "proposal-path-mismatch": (_tweak(lambda c: c["proposal"].update(path="docs/reference/other.md")), "PROPOSAL_PATH_MISMATCH"),
    "target-path-mismatch": (_tweak(lambda c: c["approvalTarget"].update(path="docs/reference/other.md")), "TARGET_PATH_MISMATCH"),
    "target-hash-drift": (_tweak(lambda c: c["approvalTarget"].update(sha256="0" * 64)), "TARGET_HASH_DRIFT"),
    "outcome-digest-drift": (_tweak(lambda c: c["prospectiveOutcome"].update(chainOrdinal=0, problemKey="drifted")), "OUTCOME_DIGEST_DRIFT"),
    "unknown-top-field": (_tweak(lambda c: c.update(extra=1)), "COMPANION_SHAPE"),
    "wrong-schema-version": (_tweak(lambda c: c.update(schemaVersion="cvf.preapprovalFeasibility.v0")), "COMPANION_SCHEMA_INVALID"),
    "outcome-not-active-scec": (_m(outcome={"schemaVersion": "other", "problemKey": "x"}), "OUTCOME_NOT_ACTIVE_SCEC"),
}

@pytest.mark.parametrize("name", sorted(MUTATIONS))
def test_class3_mutation_is_rejected(root, name):
    build, code = MUTATIONS[name]
    prop = build(root)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and code in codes(receipt), codes(receipt)
    assert receipt["effectAdmission"] is False

def test_class3_target_argument_must_equal_proposal(root):
    prop, _ = make(root)
    assert "APPROVAL_TARGET_MISMATCH" in codes(run_eval(root, prop, target="docs/reference/other.md"))
    assert "APPROVAL_TARGET_MISMATCH" in codes(run_eval(root, prop, target=None))

def _link_dir(link: Path, target: Path) -> bool:
    link.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.symlink(target, link, target_is_directory=True)
        return True
    except (OSError, NotImplementedError):
        pass
    if os.name == "nt":
        done = recorded_run(["cmd", "/c", "mklink", "/J", str(link), str(target)], capture_output=True)
        return done.returncode == 0
    return False

def test_class3_link_escape_outside_root_is_rejected(root, tmp_path_factory):
    outside = tmp_path_factory.mktemp("outside")
    secret = write(outside, "secret.md", "secret-locator\n")
    if not _link_dir(root / "docs/reviews/evidence/escape", outside):
        pytest.skip("directory link creation unavailable")
    assert (root / "docs/reviews/evidence/escape/secret.md").read_text(encoding="utf-8") == "secret-locator\n"
    evidence = {"path": "docs/reviews/evidence/escape/secret.md", "sha256": sha(secret.read_bytes()), "locator": "secret-locator"}
    prop, _ = make(root, pp={"phase": "p", "rows": [_row(evidence=evidence)]})
    assert "PREREQ_EVIDENCE_UNREADABLE" in codes(run_eval(root, prop))

# Class 4: legitimate reduction needs bound resolution evidence and stays effect-free.
def test_class4_reducing_delta_with_bound_evidence_is_feasible(root):
    prop, _ = make(root, reducing())
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "FEASIBLE" and receipt["canonicalViolations"] == []
    assert receipt["effectAdmission"] is False and receipt["operatorApprovalRequired"] is True

@pytest.mark.parametrize("name,kwargs,evid,code", [
    ("bytes-mutated", {}, GOOD_EVID + "tampered\n", "RESOLUTION_EVIDENCE_HASH_MISMATCH"),
    ("locator-absent", {"locator": "not-in-evidence"}, GOOD_EVID, "RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND"),
    ("locator-ambiguous", {"locator": "resolution-locator-unique", "sha_value": sha((GOOD_EVID * 2).encode())}, GOOD_EVID * 2, "RESOLUTION_EVIDENCE_LOCATOR_AMBIGUOUS"),
    ("bad-class", {"evidence_class": "CHAT_SUMMARY"}, GOOD_EVID, "RESOLUTION_EVIDENCE_INVALID_EVIDENCE_CLASS"),
    ("unsafe-path", {"path": "../escape.md"}, GOOD_EVID, "RESOLUTION_EVIDENCE_PATH_UNSAFE"),
    ("unreadable-path", {"path": "docs/reviews/evidence/absent.md"}, GOOD_EVID, "RESOLUTION_EVIDENCE_PATH_UNREADABLE"),
])
def test_class4_resolution_evidence_mutations_fail(root, name, kwargs, evid, code):
    prop, _ = make(root, reducing(**kwargs), evid=evid)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and code in codes(receipt)

def test_class4_label_only_resolution_is_rejected(root):
    outcome = reducing()
    outcome["resolutionEvidence"] = {}
    prop, _ = make(root, outcome)
    assert "RESOLUTION_EVIDENCE_MISSING_BINDING" in codes(run_eval(root, prop))

# Class 5: legacy and unmarked material is unaffected; explicit mode never accepts zero objects.
def test_class5_unmarked_documents_are_not_applicable_in_range_and_invalid_explicitly(root):
    write(root, "docs/reference/ordinary.md", "# Ordinary\n\nNo declarations.\n")
    receipt = run_eval(root, "docs/reference/ordinary.md", explicit=False)
    assert receipt["technicalDisposition"] == "NOT_APPLICABLE" and receipt["canonicalBlockCount"] == 0
    explicit = run_eval(root, "docs/reference/ordinary.md")
    assert explicit["technicalDisposition"] == "INVALID" and "PROPOSAL_UNMARKED" in codes(explicit)
    assert cli(root, "docs/reference/ordinary.md")[0] == 1

@pytest.mark.parametrize("text", [
    "Use `Preapproval-Feasibility: REQUIRED` and `Preapproval-Feasibility-Companion: x.json` inline.\n",
    "```\nPreapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/x.json\n```\n",
    "  Preapproval-Feasibility: REQUIRED indented prose\n",
])
def test_class5_inline_fenced_and_indented_examples_do_not_activate(text):
    assert pf.parse_declarations("# T\n\n" + text)[0] == "UNMARKED"

@pytest.mark.parametrize("path", ["docs/reference/archive/old.md", "docs/guides/g.md", "README.md", "docs/reference/x.txt"])
def test_class5_ineligible_paths_are_rejected(root, path):
    write(root, path, "# Doc\n")
    assert "PROPOSAL_NOT_ELIGIBLE" in codes(run_eval(root, path))

def test_class5_range_ignores_unrelated_and_legacy_changes(tmp_path):
    git_fixture(tmp_path)
    write(tmp_path, "docs/reference/legacy.md", "# Legacy\n\n```json\n" + json.dumps(initial_ok()) + "\n```\n")
    write(tmp_path, "docs/reviews/evidence/unrelated.json", "{}")
    write(tmp_path, "docs/guides/other.md", "# other\n")
    code, out = range_cli(tmp_path)
    assert code == 0 and "evaluatedMarked=0" in out and "NOT_APPLICABLE" in out and "not approval feasibility" in out

# Class 6: package identity, discovery, cap truth and phase prerequisites.
def _queue(rows, ceiling=10, promised=False, coverage="COMPLETE"):
    return {"rows": rows, "requestCeiling": ceiling, "promisedFullCoverage": promised, "coverageDisposition": coverage}

def _exact(rid, name):
    return {"rowId": rid, "kind": "EXACT_NPM_METADATA", "packageName": name, "discoveryLocator": None}

@pytest.mark.parametrize("name", ["cliui", "@puppeteer/browsers", "JSONStream", "a.b-c_d"])
def test_class6_publisher_identities_are_accepted(root, name):
    prop, _ = make(root, queue=_queue([_exact("r1", name)]))
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "FEASIBLE" and receipt["queue"]["exact"] == 1 and receipt["coverageDisposition"] == "COMPLETE"

@pytest.mark.parametrize("name", ["@puppeteer/browsers/yargs", "yargs/cliui", "@scope", "@/x", "pkg name", "cliui\n", "@scope/pkg\n", "cliui\r\n", "a%2Fb", "a?b", "a#b", "a\\b", "../x", "..", "", None, 7])
def test_class6_nested_locators_and_unsafe_names_are_rejected(root, name):
    prop, _ = make(root, queue=_queue([_exact("r1", name)]))
    assert "QUEUE_EXACT_IDENTITY_INVALID" in codes(run_eval(root, prop))

def test_class6_discovery_rows_are_never_exact(root):
    discovery = {"rowId": "d1", "kind": "DISCOVERY", "packageName": None, "discoveryLocator": "lock path hypothesis"}
    receipt = run_eval(root, make(root, queue=_queue([discovery, _exact("e1", "cliui")]))[0])
    assert receipt["queue"]["exact"] == 1 and receipt["queue"]["discovery"] == 1 and receipt["queue"]["total"] == 2
    for bad in ({"packageName": "cliui"}, {"discoveryLocator": " "}):
        prop, _ = make(root, queue=_queue([{**discovery, **bad}]))
        assert "QUEUE_DISCOVERY_INVALID" in codes(run_eval(root, prop))
    prop, _ = make(root, queue=_queue([{**_exact("e2", "cliui"), "discoveryLocator": "x"}]))
    assert "QUEUE_EXACT_IDENTITY_INVALID" in codes(run_eval(root, prop))

@pytest.mark.parametrize("queue,code", [
    (_queue([_exact("a", "x1"), _exact("b", "x2")], 1, False, "COMPLETE"), "QUEUE_COVERAGE_FALSE"),
    (_queue([_exact("a", "x1"), _exact("b", "x2")], 1, True, "PARTIAL"), "QUEUE_FULL_COVERAGE_PROMISED"),
    (_queue([_exact("a", "x1")], 5, False, "PARTIAL"), "QUEUE_COVERAGE_FALSE"),
    (_queue([_exact("a", "x1"), _exact("a", "x2")]), "QUEUE_ROW_ID_DUPLICATE"),
    (_queue([_exact("a", "x1")], True), "QUEUE_CEILING_INVALID"),
    (_queue([_exact("a", "x1")], -1), "QUEUE_CEILING_INVALID"),
    (_queue([_exact("a", "x1")], 5, "yes"), "QUEUE_PROMISE_INVALID"),
    (_queue([{"rowId": "a", "kind": "OTHER", "packageName": None, "discoveryLocator": None}]), "QUEUE_KIND_INVALID"),
    ({"rows": []}, "QUEUE_SHAPE"),
])
def test_class6_queue_truthfulness_mutations_fail(root, queue, code):
    assert code in codes(run_eval(root, make(root, queue=queue)[0]))

def test_class6_over_cap_partial_is_truthful_and_feasible(root):
    rows = [_exact(f"r{i}", f"pkg{i}") for i in range(5)]
    receipt = run_eval(root, make(root, queue=_queue(rows, 3, False, "PARTIAL"))[0])
    assert receipt["technicalDisposition"] == "FEASIBLE" and receipt["coverageDisposition"] == "PARTIAL"
    assert receipt["queue"] == {"exact": 5, "discovery": 0, "total": 5, "cap": 3, "unrequested": 2}

def _row(rid="r1", required=True, evidence=None, deferred=None):
    return {"requirementId": rid, "requiredForPhase": required, "evidence": evidence, "deferredToPhase": deferred}

def _ev(data=GOOD_EVID, **over):
    return {"path": EVID, "sha256": sha(data.encode()), "locator": "resolution-locator-unique", **over}

def test_class6_phase_prerequisites_required_and_deferred_rows(root):
    rows = [_row("need", True, _ev()), _row("later", False, None, "production")]
    receipt = run_eval(root, make(root, pp={"phase": "documentary-plan", "rows": rows})[0])
    assert receipt["technicalDisposition"] == "FEASIBLE" and receipt["prerequisites"] == {"examined": 1, "deferred": 1}

@pytest.mark.parametrize("rows,code", [
    ([_row(evidence=_ev(sha256="0" * 64))], "PREREQ_EVIDENCE_HASH_MISMATCH"),
    ([_row(evidence=_ev(locator="absent-locator"))], "PREREQ_LOCATOR_NOT_FOUND"),
    ([_row(evidence=_ev(path="../x.md"))], "PREREQ_EVIDENCE_UNREADABLE"),
    ([_row(evidence=None)], "PREREQ_EVIDENCE_SHAPE"),
    ([_row(evidence=_ev(), deferred="later")], "PREREQ_REQUIRED_HAS_DEFERRAL"),
    ([_row(required=False, deferred="documentary-plan")], "PREREQ_DEFERRAL_INVALID"),
    ([_row(required=False, deferred=None)], "PREREQ_DEFERRAL_INVALID"),
    ([_row(required=False, evidence=_ev(), deferred="later")], "PREREQ_DEFERRED_HAS_EVIDENCE"),
    ([_row("a", False, None, "later"), _row("a", False, None, "later")], "PREREQ_ID_DUPLICATE"),
    ([_row(required="yes")], "PREREQ_REQUIRED_FLAG_INVALID"),
    ([{"requirementId": "r"}], "PREREQ_ROW_SHAPE"),
])
def test_class6_prerequisite_mutations_fail(root, rows, code):
    assert code in codes(run_eval(root, make(root, pp={"phase": "documentary-plan", "rows": rows})[0]))

# Class 7: actual subprocess caller, drift reruns and real early catalog composition.
def test_class7_caller_receipt_binds_final_bytes_and_writes_nothing(root):
    prop, comp = make(root, reducing())
    before = sorted(str(p) for p in root.rglob("*"))
    exit_code, receipt = cli(root, prop)
    assert exit_code == 0 and receipt["technicalDisposition"] == "FEASIBLE" and receipt["schemaVersion"] == pf.RECEIPT_SCHEMA
    assert receipt["proposal"]["sha256"] == sha((root / prop).read_bytes()) == receipt["approvalTarget"]["sha256"]
    assert receipt["companion"]["sha256"] == sha((root / comp).read_bytes())
    assert receipt["prospectiveOutcomeSha256"] == digest(reducing()) and receipt["canonicalBlockCount"] == 1
    assert receipt["effectAdmission"] is False and receipt["operatorApprovalRequired"] is True
    assert sorted(str(p) for p in root.rglob("*")) == before

def test_class7_drift_after_feasible_receipt_fails_on_rerun(root):
    prop, _ = make(root, reducing())
    assert cli(root, prop)[0] == 0
    (root / prop).write_bytes((root / prop).read_bytes() + b"edited after receipt\n")
    exit_code, receipt = cli(root, prop)
    assert exit_code == 1 and "PROPOSAL_HASH_DRIFT" in codes(receipt)
    prop, _ = make(root, reducing(), name="second")
    assert cli(root, prop)[0] == 0
    write(root, EVID, GOOD_EVID + "changed\n")
    assert "RESOLUTION_EVIDENCE_HASH_MISMATCH" in codes(cli(root, prop)[1])

def test_class7_missing_arguments_return_invalid_receipt_nonzero(root):
    exit_code, receipt = cli(root, None)
    assert exit_code == 1 and receipt["technicalDisposition"] == "INVALID" and "PROPOSAL_NOT_ELIGIBLE" in codes(receipt)

def _guard_entries(commands):
    return [i for i, cmd in enumerate(commands) if any("check_preapproval_feasibility.py" in part for part in cmd)]

def test_class7_catalogs_contain_exactly_one_adjacent_guard_command():
    common = [cmd.command for cmd in catalog._common_commands("base", "head")]
    surfaces = [common, [entry[1] for entry in pre_commit.PRE_COMMIT_CHECKS], [entry[1] for entry in reviewer_fast.REVIEWER_FAST_CHECKS]]
    for commands in surfaces:
        (guard,) = _guard_entries(commands)
        scec_at = [i for i, cmd in enumerate(commands) if any("check_semantic_convergence_control.py" in part for part in cmd)]
        assert scec_at == [guard - 1] and "--enforce" in commands[guard]
        assert any("check_core_guard_self_protection.py" in part for cmd in commands for part in cmd)
        assert any("check_work_order_dispatch_quality.py" in part for cmd in commands for part in cmd)
    assert common[_guard_entries(common)[0]][-5:] == ("--base", "base", "--head", "head", "--enforce")

def test_class7_catalog_routes_execute_against_disposable_git_fixture(root):
    git_fixture(root)
    surfaces = [[c.command for c in catalog._common_commands("HEAD", "HEAD")], [e[1] for e in pre_commit.PRE_COMMIT_CHECKS], [e[1] for e in reviewer_fast.REVIEWER_FAST_CHECKS]]
    commands = [list(cmds[_guard_entries(cmds)[0]]) for cmds in surfaces]
    prop, comp = make(root, reducing())

    def run_routes():
        return [recorded_run([sys.executable, "-B", *c[1:], "--repo-root", str(root)], cwd=REPO, capture_output=True, text=True, encoding="utf-8") for c in commands]

    assert all(d.returncode == 0 and "evaluatedMarked=1" in d.stdout for d in run_routes())
    write(root, comp, (root / comp).read_text(encoding="utf-8").replace('"CONTINUE_BOUNDED"', '"STOP_REASSESS_ARCHITECTURE"'))
    assert all(d.returncode == 1 and "OUTCOME_DIGEST_DRIFT" in d.stdout for d in run_routes())

def test_class3_range_fails_marked_proposal_with_omitted_companion(tmp_path):
    git_fixture(tmp_path)
    make(tmp_path, header="Preapproval-Feasibility: REQUIRED\n", name="nocomp")
    code, out = range_cli(tmp_path)
    assert code == 1 and "COMPANION_MISSING" in out and "evaluatedMarked=1" in out

def test_class7_companion_only_edit_reevaluates_unchanged_proposal(root):
    git_fixture(root)
    prop, comp = make(root, reducing())
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "proposal and companion")
    assert range_cli(root)[0] == 0
    data = json.loads((root / comp).read_text(encoding="utf-8"))
    data["prospectiveOutcome"]["counters"]["sameClaimCorrections"] = 9
    write(root, comp, json.dumps(data))
    code, out = range_cli(root)
    assert code == 1 and "companionReferencingProposals=1" in out and "OUTCOME_DIGEST_DRIFT" in out
    git(root, "add", "-A")
    git(root, "commit", "-q", "-m", "companion drift")
    code, out = range_cli(root, base="HEAD~1", head="HEAD")
    assert code == 1 and "OUTCOME_DIGEST_DRIFT" in out

def test_class7_range_reports_hold_truthfully_without_failing(tmp_path):
    git_fixture(tmp_path)
    prop, _ = make(tmp_path, root_contract())
    code, out = range_cli(tmp_path)
    assert code == 0 and "HOLD" in out and "does not release" in out and prop in out
    code, out = range_cli(tmp_path, base="not-a-ref", head="HEAD")
    assert code == 1 and "could not be resolved fail-closed" in out

def test_range_preserves_unicode_proposal_and_companion_paths(tmp_path):
    git_fixture(tmp_path)
    prop, comp = make(tmp_path, name="\u0111\u1ec1-xu\u1ea5t")
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-qm", "unicode proposal")
    data = json.loads((tmp_path / comp).read_text())
    data["approvalTarget"]["sha256"] = "0" * 64
    write(tmp_path, comp, json.dumps(data))
    code, out = range_cli(tmp_path)
    assert code == 1 and "TARGET_HASH_DRIFT" in out and prop in out
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-qm", "unicode drift")
    assert range_cli(tmp_path, base="HEAD~1")[0] == 1

def test_range_does_not_skip_escaping_unreadable_proposal(tmp_path, tmp_path_factory):
    git_fixture(tmp_path)
    outside = tmp_path_factory.mktemp("range-outside")
    write(outside, "bad.md", "# Marked\nPreapproval-Feasibility: REQUIRED\n")
    if not _link_dir(tmp_path / "docs/reference/escape", outside):
        pytest.skip("directory link creation unavailable")
    prop = "docs/reference/escape/bad.md"
    git(tmp_path, "add", "-N", "--", prop)
    code, out = range_cli(tmp_path)
    assert code == 1 and "PROPOSAL_UNREADABLE" in out and "evaluatedMarked=1" in out


# Released S1 packet regression: preapproval must compose the bound production
# return route before FEASIBLE, without running its downstream commands.
def work_order_fixture(root, body, outcome=None):
    prop, comp_path = make(root, outcome, prop_bytes=body)
    work_order = "docs/work_orders/bound-source.md"
    write(root, work_order, body)
    comp = json.loads((root / comp_path).read_bytes())
    comp["proposal"]["path"] = comp["approvalTarget"]["path"] = work_order
    write(root, comp_path, json.dumps(comp))
    return work_order


@pytest.mark.parametrize("field", [
    "workerReturnPath: docs/reviews/return.md\n",
    "", "workerReturnPath: `docs/reviews/return.md`\nworkerReturnPath: `docs/reviews/other.md`\n",
])
def test_bound_return_parser_rejects_before_feasible(root, field):
    body = ("# Work order\nPreapproval-Feasibility: REQUIRED\n"
            "Preapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n" + field).encode()
    prop = work_order_fixture(root, body)
    code, receipt = cli(root, prop)
    assert code == 1 and receipt["technicalDisposition"] == "INVALID"
    assert "WORKER_RETURN_ROUTE_UNBUILDABLE" in codes(receipt)
    assert receipt["effectAdmission"] is False


def test_actual_released_s1_order_fails_route_and_corrected_copy_passes(root):
    rel = "docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_C1_S1_INTEGRATED_SOURCE_2026-10-08.md"
    raw = recorded_run(
        ["git", "show", f"4eb79b34ca4422f598cd2a052ca2698283b71230:{rel}"],
        cwd=REPO, capture_output=True, check=True,
    ).stdout
    assert sha(raw) == "62f7f7f6d6450363871f47e73b10fb9bf27c9c0069c927def5d8da70d6d2ad9b"
    # Copy exact real packet text; rebind only the disposable fixture companion.
    body = raw.replace(b"Preapproval-Feasibility-Companion: docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_C1_S1_INTEGRATED_SOURCE_2026-10-08.json", b"Preapproval-Feasibility-Companion: docs/reviews/evidence/p.json")
    prop = work_order_fixture(root, body)
    assert "WORKER_RETURN_ROUTE_UNBUILDABLE" in codes(cli(root, prop)[1])
    old = b"workerReturnPath: docs/reviews/CVF_NCR_C1_S1_INTEGRATED_SOURCE_WORKER_RETURN_2026-10-08.md"
    fixed = body.replace(old, old.replace(b": ", b": `") + b"`")
    prop = work_order_fixture(root, fixed)
    code, receipt = cli(root, prop)
    assert code == 0 and receipt["technicalDisposition"] == "FEASIBLE"
    assert receipt["effectAdmission"] is False


def test_bound_builder_uses_snapshot_and_does_not_run_commands(root, monkeypatch):
    body = ("Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"
            "workerReturnPath: `docs/reviews/return.md`\n").encode()
    prop = work_order_fixture(root, body)
    original = pf.worker_return_gate.build_commands
    observed = []
    def spy(*args, **kwargs):
        # Simulate a later on-disk mutation: construction must consume the
        # proposal snapshot whose hash was joined, not re-read changed bytes.
        write(root, prop, "workerReturnPath: malformed\n")
        result = original(*args, **kwargs)
        observed.extend(result)
        return result
    monkeypatch.setattr(pf.worker_return_gate, "build_commands", spy)
    def forbidden(*args, **kwargs): raise AssertionError("preapproval executed a downstream command")
    monkeypatch.setattr(pf.worker_return_gate.subprocess, "run", forbidden)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "FEASIBLE"
    ledger = next(c.command for c in observed if c.name == "work-order acceptance ledger")
    assert ledger[-5:] == ("--work-order", prop, "--return", "docs/reviews/return.md", "--enforce")
    assert receipt["proposal"]["sha256"] == sha(body)


def test_unbound_command_composition_is_not_feasibility(root, monkeypatch):
    body = ("Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"
            "workerReturnPath: `docs/reviews/return.md`\n").encode()
    prop = work_order_fixture(root, body)
    original = pf.worker_return_gate.build_commands
    monkeypatch.setattr(pf.worker_return_gate, "build_commands", lambda *a, **kw: original())
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID"
    assert "WORKER_RETURN_ROUTE_UNBUILDABLE" in codes(receipt)


def test_held_work_order_does_not_require_execution_route(root):
    body = b"Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\n"
    prop = work_order_fixture(root, body, root_contract())
    code, receipt = cli(root, prop)
    assert code == 2 and receipt["technicalDisposition"] == "HOLD"


# NCR_PREFEAS_ROOT_BUILD_ACTION_V1: optional requestedAction, scoped typed result,
# exercised through the real evaluator, CLI subprocess and range subprocess.
RB_BASE = "docs/baselines/CVF_GC018_ROOT_BUILD_FIXTURE.md"
RB_TEXT = "# Baseline\n\nroot-build-baseline-locator\nroot-build-scope-locator\n"
RB_ACTION = {"kind": "INTEGRATED_ROOT_CONTRACT_BUILD", "runtimeReadinessClaim": False}
RB_SCOPED = "FEASIBLE_FOR_INTEGRATED_ROOT_BUILD"
NO_ACTION = object()

def rb_row(rid, path=RB_BASE, data=RB_TEXT, **over):
    locator = "root-build-baseline-locator" if rid == "ROOT_BUILD_BASELINE" else "root-build-scope-locator"
    evidence = {"path": path, "sha256": sha(data.encode()), "locator": locator}
    return {"requirementId": rid, "requiredForPhase": True, "evidence": evidence, "deferredToPhase": None, **over}

def rb_rows(**kw):
    return [rb_row("ROOT_BUILD_BASELINE", **kw), rb_row("ROOT_BUILD_SCOPE", **kw)]

def root_build(root, *, outcome=None, action=RB_ACTION, phase="PRE_DISPATCH_INTEGRATED_ROOT_CONTRACT_BUILD", rows=None,
               doc_type="docType: work_order\n", return_line="workerReturnPath: `docs/reviews/return.md`\n",
               base_text=RB_TEXT, name="rb", family="docs/work_orders", tweak=None, extra_files=None):
    prop, comp_rel = f"{family}/{name}.md", f"docs/reviews/evidence/{name}.json"
    data = (f"# Work order\n{doc_type}Preapproval-Feasibility: REQUIRED\n"
            f"Preapproval-Feasibility-Companion: {comp_rel}\n{return_line}").encode("utf-8")
    outcome = outcome if outcome is not None else root_contract()
    comp = {
        "schemaVersion": pf.COMPANION_SCHEMA, "proposal": {"path": prop, "sha256": sha(data)},
        "approvalTarget": {"path": prop, "sha256": sha(data), "prospectiveOutcomeSha256": digest(outcome)},
        "prospectiveOutcome": outcome, "phasePrerequisites": {"phase": phase, "rows": rows if rows is not None else rb_rows()},
        "requestQueue": None,
    }
    if action is not NO_ACTION:
        comp["requestedAction"] = action
    if tweak:
        tweak(comp)
    for rel, text in {RB_BASE: base_text, EVID: GOOD_EVID, **(extra_files or {})}.items():
        write(root, rel, text)
    write(root, prop, data)
    write(root, comp_rel, json.dumps(comp, indent=1))
    return prop, comp_rel

def other_scope_root() -> dict:
    block = root_contract()
    block["successorScope"] = "NO_SUCCESSOR"
    return block

def cli_text(root, prop):
    cmd = [sys.executable, "-B", RUNNER, "--repo-root", str(root), "--proposal", prop, "--approval-target", prop]
    done = recorded_run(cmd, cwd=REPO, capture_output=True, text=True, encoding="utf-8")
    return done.returncode, done.stdout.splitlines()[0]

def test_root_build_valid_action_yields_only_scoped_result(root):
    prop, _ = root_build(root)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == pf.ROOT_BUILD_DISPOSITION == RB_SCOPED
    assert receipt["diagnostics"] == [] and receipt["canonicalViolations"] == [] and receipt["prerequisites"]["examined"] == 2
    assert receipt["runtimeReadiness"] is False and receipt["effectAdmission"] is False and receipt["operatorApprovalRequired"] is True
    code, cli_receipt = cli(root, prop)
    assert code == 0 and cli_receipt == receipt
    code, line = cli_text(root, prop)
    assert code == 0 and f"technicalDisposition={RB_SCOPED}" in line
    assert line.endswith("effectAdmission=false operatorApprovalRequired=true runtimeReadiness=false")

@pytest.mark.parametrize("phase", ["documentary-plan", "PRE_DISPATCH_INTEGRATED_ROOT_CONTRACT_BUILD"])
def test_root_build_without_action_stays_hold_even_with_matching_phase(root, phase):
    prop, _ = root_build(root, action=NO_ACTION, phase=phase)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "HOLD" and "runtimeReadiness" not in receipt
    code, cli_receipt = cli(root, prop)
    assert code == 2 and cli_receipt["technicalDisposition"] == "HOLD"

def test_root_build_valid_stop_with_action_stays_hold(root):
    prop, _ = root_build(root, outcome=succ())
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "HOLD" and receipt["canonicalViolations"] == [] and "runtimeReadiness" not in receipt
    assert cli(root, prop)[0] == 2

def test_no_action_receipt_shape_and_ordinary_feasible_are_unchanged(root):
    prop, _ = make(root, reducing())
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "FEASIBLE" and set(receipt) == set(pf.new_receipt(prop))
    assert cli(root, prop)[0] == 0

ACTION_CASES = {
    "null": (dict(action=None), "ACTION_SHAPE"),
    "list": (dict(action=[]), "ACTION_SHAPE"),
    "empty": (dict(action={}), "ACTION_SHAPE"),
    "missing-claim": (dict(action={"kind": pf.ROOT_BUILD_KIND}), "ACTION_SHAPE"),
    "extra-field": (dict(action={**RB_ACTION, "extra": 1}), "ACTION_SHAPE"),
    "kind-padded": (dict(action={**RB_ACTION, "kind": "INTEGRATED_ROOT_CONTRACT_BUILD "}), "ACTION_KIND_INVALID"),
    "kind-lower": (dict(action={**RB_ACTION, "kind": "integrated_root_contract_build"}), "ACTION_KIND_INVALID"),
    "kind-null": (dict(action={**RB_ACTION, "kind": None}), "ACTION_KIND_INVALID"),
    "kind-number": (dict(action={**RB_ACTION, "kind": 1}), "ACTION_KIND_INVALID"),
    "claim-true": (dict(action={**RB_ACTION, "runtimeReadinessClaim": True}), "ACTION_READINESS_CLAIM_INVALID"),
    "claim-zero": (dict(action={**RB_ACTION, "runtimeReadinessClaim": 0}), "ACTION_READINESS_CLAIM_INVALID"),
    "claim-string": (dict(action={**RB_ACTION, "runtimeReadinessClaim": "false"}), "ACTION_READINESS_CLAIM_INVALID"),
    "claim-null": (dict(action={**RB_ACTION, "runtimeReadinessClaim": None}), "ACTION_READINESS_CLAIM_INVALID"),
    "phase-other": (dict(phase="documentary-plan"), "ACTION_PHASE_MISMATCH"),
    "phase-case": (dict(phase="pre_dispatch_integrated_root_contract_build"), "ACTION_PHASE_MISMATCH"),
    "not-work-order-family": (dict(family="docs/reference"), "ACTION_PROPOSAL_NOT_WORK_ORDER"),
    "doctype-missing": (dict(doc_type=""), "ACTION_PROPOSAL_NOT_WORK_ORDER"),
    "doctype-wrong": (dict(doc_type="docType: baseline\n"), "ACTION_PROPOSAL_NOT_WORK_ORDER"),
    "doctype-duplicate": (dict(doc_type="docType: work_order\ndocType: work_order\n"), "ACTION_PROPOSAL_NOT_WORK_ORDER"),
    "doctype-fenced-only": (dict(doc_type="```\ndocType: work_order\n```\n"), "ACTION_PROPOSAL_NOT_WORK_ORDER"),
    "continue-bounded": (dict(outcome=initial_ok()), "ACTION_DISPOSITION_MISMATCH"),
    "ready-reducing": (dict(outcome=reducing()), "ACTION_DISPOSITION_MISMATCH"),
    "stale-predecessor": (dict(outcome=succ(pred_sha="f" * 64)), "PREDECESSOR_HASH_MISMATCH"),
    "proposal-hash-drift": (dict(tweak=lambda c: c["proposal"].update(sha256="0" * 64)), "PROPOSAL_HASH_DRIFT"),
    "outcome-digest-drift": (dict(tweak=lambda c: c["prospectiveOutcome"].update(problemKey="drifted")), "OUTCOME_DIGEST_DRIFT"),
    "unknown-top-field": (dict(tweak=lambda c: c.update(extra=1)), "COMPANION_SHAPE"),
    "baseline-row-missing": (dict(rows=[rb_row("ROOT_BUILD_SCOPE")]), "ROOT_BUILD_ROW_MISSING"),
    "scope-row-missing": (dict(rows=[rb_row("ROOT_BUILD_BASELINE")]), "ROOT_BUILD_ROW_MISSING"),
    "rows-empty": (dict(rows=[]), "ROOT_BUILD_ROW_MISSING"),
    "baseline-row-duplicate": (dict(rows=[*rb_rows(), rb_row("ROOT_BUILD_BASELINE")]), "PREREQ_ID_DUPLICATE"),
    "baseline-row-deferred": (dict(rows=[rb_row("ROOT_BUILD_SCOPE"), rb_row("ROOT_BUILD_BASELINE", requiredForPhase=False, evidence=None, deferredToPhase="later")]), "ROOT_BUILD_ROW_NOT_REQUIRED"),
    "scope-row-other-path": (dict(rows=[rb_row("ROOT_BUILD_BASELINE"), rb_row("ROOT_BUILD_SCOPE", path="docs/baselines/CVF_GC018_OTHER.md")],
                                  extra_files={"docs/baselines/CVF_GC018_OTHER.md": RB_TEXT}), "ROOT_BUILD_BASELINE_PATH_INVALID"),
    "path-not-baselines": (dict(rows=rb_rows(path="docs/reference/CVF_GC018_X.md"), extra_files={"docs/reference/CVF_GC018_X.md": RB_TEXT}), "ROOT_BUILD_BASELINE_PATH_INVALID"),
    "path-prefix-wrong": (dict(rows=rb_rows(path="docs/baselines/X.md"), extra_files={"docs/baselines/X.md": RB_TEXT}), "ROOT_BUILD_BASELINE_PATH_INVALID"),
    "path-not-markdown": (dict(rows=rb_rows(path="docs/baselines/CVF_GC018_X.txt"), extra_files={"docs/baselines/CVF_GC018_X.txt": RB_TEXT}), "ROOT_BUILD_BASELINE_PATH_INVALID"),
    "path-unsafe": (dict(rows=rb_rows(path="docs/baselines/../baselines/CVF_GC018_X.md")), "PREREQ_EVIDENCE_UNREADABLE"),
    "baseline-bytes-drift": (dict(base_text=RB_TEXT + "drift\n"), "PREREQ_EVIDENCE_HASH_MISMATCH"),
    "locator-absent": (dict(rows=[rb_row("ROOT_BUILD_BASELINE"), {**rb_row("ROOT_BUILD_SCOPE"), "evidence": {**rb_row("ROOT_BUILD_SCOPE")["evidence"], "locator": "absent-locator"}}]), "PREREQ_LOCATOR_NOT_FOUND"),
    "return-missing": (dict(return_line=""), "WORKER_RETURN_ROUTE_UNBUILDABLE"),
    "return-bare": (dict(return_line="workerReturnPath: docs/reviews/return.md\n"), "WORKER_RETURN_ROUTE_UNBUILDABLE"),
    "return-duplicate": (dict(return_line="workerReturnPath: `docs/reviews/a.md`\nworkerReturnPath: `docs/reviews/b.md`\n"), "WORKER_RETURN_ROUTE_UNBUILDABLE"),
}

@pytest.mark.parametrize("name", sorted(ACTION_CASES))
def test_root_build_hostile_variants_fail_closed(root, name):
    kwargs, code = ACTION_CASES[name]
    prop, _ = root_build(root, **kwargs)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and code in codes(receipt), codes(receipt)
    assert "runtimeReadiness" not in receipt and receipt["effectAdmission"] is False
    assert cli(root, prop)[0] == 1

@pytest.mark.parametrize("outcome", [succ(streak=1), other_scope_root()], ids=["stop-wrong-streak", "root-other-scope"])
def test_root_build_canonical_invalid_or_wrong_scope_is_invalid(root, outcome):
    prop, _ = root_build(root, outcome=outcome)
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and (receipt["canonicalViolations"] or "ACTION_DISPOSITION_MISMATCH" in codes(receipt))
    assert "runtimeReadiness" not in receipt and cli(root, prop)[0] == 1

def test_root_build_nested_baseline_within_family_is_scoped(root):
    path = "docs/baselines/sub/CVF_GC018_X.md"
    prop, _ = root_build(root, rows=rb_rows(path=path), extra_files={path: RB_TEXT})
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == RB_SCOPED
    assert receipt["runtimeReadiness"] is False and receipt["effectAdmission"] is False
    assert cli(root, prop)[0] == 0

def test_root_build_duplicate_action_key_is_malformed_json(root):
    prop, comp = root_build(root)
    text = (root / comp).read_text(encoding="utf-8")
    write(root, comp, text.replace('"requestedAction":', '"requestedAction": {}, "requestedAction":'))
    assert "COMPANION_MALFORMED_JSON" in codes(run_eval(root, prop))

def test_root_build_and_ordinary_share_the_production_route_builder(root, monkeypatch):
    original, seen = pf.worker_return_gate.build_commands, []
    def spy(*args, **kwargs):
        seen.append((args, kwargs["work_order_text"]))
        return original(*args, **kwargs)
    monkeypatch.setattr(pf.worker_return_gate, "build_commands", spy)
    monkeypatch.setattr(pf.worker_return_gate.subprocess, "run", lambda *a, **k: pytest.fail("downstream command executed"))
    scoped, _ = root_build(root)
    ordinary = work_order_fixture(root, b"Preapproval-Feasibility: REQUIRED\nPreapproval-Feasibility-Companion: docs/reviews/evidence/p.json\nworkerReturnPath: `docs/reviews/return.md`\n")
    assert run_eval(root, scoped)["technicalDisposition"] == RB_SCOPED and run_eval(root, ordinary)["technicalDisposition"] == "FEASIBLE"
    assert [args for args, _ in seen] == [((), scoped), ((), ordinary)]
    assert seen[0][1] == (root / scoped).read_text(encoding="utf-8")

def test_root_build_unbound_command_composition_is_invalid(root, monkeypatch):
    original = pf.worker_return_gate.build_commands
    prop, _ = root_build(root)
    monkeypatch.setattr(pf.worker_return_gate, "build_commands", lambda *a, **kw: original())
    receipt = run_eval(root, prop)
    assert receipt["technicalDisposition"] == "INVALID" and "WORKER_RETURN_ROUTE_UNBUILDABLE" in codes(receipt)

def test_root_build_receipt_does_not_survive_drift(root):
    prop, comp = root_build(root)
    assert cli(root, prop)[0] == 0
    write(root, RB_BASE, RB_TEXT + "edited after receipt\n")
    code, receipt = cli(root, prop)
    assert code == 1 and "PREREQ_EVIDENCE_HASH_MISMATCH" in codes(receipt)
    prop, comp = root_build(root, name="second")
    assert cli(root, prop)[0] == 0
    data = json.loads((root / comp).read_text(encoding="utf-8"))
    data["prospectiveOutcome"]["counters"]["sameClaimCorrections"] = 9
    write(root, comp, json.dumps(data))
    code, receipt = cli(root, prop)
    assert code == 1 and "OUTCOME_DIGEST_DRIFT" in codes(receipt)

def test_root_build_range_counts_and_displays_scoped_result_separately(tmp_path):
    git_fixture(tmp_path)
    root_build(tmp_path)
    root_build(tmp_path, name="held", action=NO_ACTION)
    code, out = range_cli(tmp_path, extra=("--json",))
    report = json.loads(out)
    assert code == 0 and report["counts"] == {"FEASIBLE": 0, RB_SCOPED: 1, "HOLD": 1, "INVALID": 0}
    assert report["coverage"]["evaluatedMarked"] == 2
    assert [r["runtimeReadiness"] for r in report["receipts"] if r["technicalDisposition"] == RB_SCOPED] == [False]
    code, out = range_cli(tmp_path)
    assert code == 0 and f"{RB_SCOPED} coverage=" in out and "SCOPED: 1" in out and "runtimeReadiness=false" in out
    assert "evaluatedMarked=2" in out and "scoped root-build or HOLD" in out

def test_root_build_range_fails_on_companion_only_drift_and_invalid_action(tmp_path):
    git_fixture(tmp_path)
    prop, comp = root_build(tmp_path)
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-q", "-m", "root build proposal")
    assert range_cli(tmp_path)[0] == 0
    data = json.loads((tmp_path / comp).read_text(encoding="utf-8"))
    data["requestedAction"]["runtimeReadinessClaim"] = True
    data["approvalTarget"]["prospectiveOutcomeSha256"] = digest(data["prospectiveOutcome"])
    write(tmp_path, comp, json.dumps(data))
    code, out = range_cli(tmp_path)
    assert code == 1 and "companionReferencingProposals=1" in out and "ACTION_READINESS_CLAIM_INVALID" in out


# Actual post-STOP v2 dispatch, with isolated authority bytes and a real Git/CLI route.
V2_STOP = "docs/reviews/CVF_NCR_R2_W05_BOUND_SOURCE_LOCAL_COMPLETION_REVIEW_2026-10-19.md"
V2_STOP_SHA = "37d2905184e28fe2e27d574241a69200c49e5338a094b8b2826809e8ce797a42"
V2_LOCATORS = {
    "BOUND_DESTINATION_NOT_ENFORCED": "| LR1 | HIGH | Signed challenge at foreign-web.invalid",
    "BOUND_ISSUED_AUTHORITY_NOT_IMMUTABLE": "| LR2 | HIGH | Unissued profile invokes once",
    "BOUND_ACTUAL_LEDGER_OWNER_JOIN_MISSING": "| LR3 | CRITICAL | After challenge, swapping the actual orchestrator.ledger",
}
V2_SOURCE = "docs/baselines/CVF_GC018_TEST_V2_SOURCE.md"
V2_OPERATOR = "docs/baselines/CVF_TEST_V2_OPERATOR.md"
V2_REASSESS = "docs/reviews/CVF_TEST_V2_REASSESSMENT.md"
V2_GRANT = "docs/baselines/CVF_TEST_V2_GRANT.md"
V2_PROP = "docs/work_orders/strict-v2.md"
V2_COMP = "docs/reviews/evidence/strict-v2.json"
V2_RETURN = "docs/reviews/CVF_TEST_V2_RETURN.md"
V2_PROOF = "governance/compat/test_fixture_v2_proof.py"
V2_EFFECTS = ("providerCalls", "networkCalls", "publicWrites", "deployments",
              "realDataMutations", "destructiveActions", "productRuntimeStarts")


def _v2_fence(tag, value):
    return "# Authority\n\n```" + tag + "\n" + json.dumps(value) + "\n```\n"


def _v2_companion(root, fixture):
    comp = json.loads((root / V2_COMP).read_text(encoding="utf-8"))
    data = (root / fixture["prop"]).read_bytes()
    comp["proposal"]["sha256"] = comp["approvalTarget"]["sha256"] = sha(data)
    comp["prospectiveOutcome"] = fixture["outcome"]
    comp["approvalTarget"]["prospectiveOutcomeSha256"] = digest(fixture["outcome"])
    write(root, V2_COMP, json.dumps(comp))


def _v2_grant_refresh(root, fixture):
    raw = _v2_fence("post-stop-root-admission-json", fixture["grant"])
    write(root, V2_GRANT, raw)
    fixture["outcome"]["rootContractAdmission"]["sha256"] = sha(raw.encode())
    _v2_companion(root, fixture)


def v2_dispatch_fixture(root):
    stop_bytes = (REPO / V2_STOP).read_bytes()
    assert sha(stop_bytes) == V2_STOP_SHA
    write(root, V2_STOP, stop_bytes)
    stop = scec.find_active_blocks(stop_bytes.decode("utf-8"))[0]
    blockers = list(stop["blockerDelta"]["current"])
    assert set(blockers) == set(V2_LOCATORS) and stop["counters"] == {
        "partialReadyClosures": 0, "reviewerScopeExpansions": 0,
        "sameClaimCorrections": 0, "nonDecreasingBlockerTransitions": 2,
    }
    source = "# Fixture source\n\nroot-build-baseline-locator\nroot-build-scope-locator\n" + "".join(
        f"DESIGN-OBLIGATION {blocker}: fixture design\n" for blocker in blockers)
    operator = "# Operator\n\nFIXTURE OPERATOR INSTRUCTION RECORD: bounded pair approved.\n"
    write(root, V2_SOURCE, source)
    write(root, V2_OPERATOR, operator)
    write(root, V2_PROOF, "fixture proof assertion\n")
    source_ref = {"path": V2_SOURCE, "sha256": sha(source.encode())}
    stop_ref = {"path": V2_STOP, "sha256": V2_STOP_SHA}
    reassess = {
        "schemaVersion": "cvf.scecIntegratedRootReassessment@1.0.0",
        "status": "ACCEPTED_BY_LOCAL", "decisionOwner": "LOCAL",
        "scope": "INTEGRATED_ROOT_CONTRACT", "problemKey": stop["problemKey"],
        "stoppedPredecessor": stop_ref, "sourceContract": source_ref,
        "obligations": [{
            "blockerId": b,
            "designEvidence": {**source_ref, "locator": f"DESIGN-OBLIGATION {b}"},
            "sourceEvidence": {**stop_ref, "locator": V2_LOCATORS[b]},
        } for b in blockers],
    }
    reassess_text = _v2_fence("root-reassessment-json", reassess)
    write(root, V2_REASSESS, reassess_text)
    ledger = {
        "schemaVersion": "cvf.workOrderAcceptanceLedger@1.0.0",
        "requirements": [{"requirementId": "R1", "mandatory": True,
                          "expectedArtifacts": [V2_RETURN, V2_PROOF], "requiredProofIds": ["P1"]}],
        "proofCatalog": [{"proofId": "P1", "kind": "COMMAND", "locator": "fixture proof assertion"}],
    }
    body = ("# Work order\ndocType: work_order\nPreapproval-Feasibility: REQUIRED\n"
            f"Preapproval-Feasibility-Companion: {V2_COMP}\n"
            f"workerReturnPath: `{V2_RETURN}`\n"
            "```acceptance-ledger-json\n" + json.dumps(ledger) + "\n```\n")
    write(root, V2_PROP, body)
    grant = {
        "schemaVersion": "cvf.scecPostStopRootAdmission@2.0.0",
        "status": "ACCEPTED_FOR_ONE_BOUNDED_POST_STOP_ROOT_PAIR", "decisionOwner": "LOCAL",
        "operatorInstructionEvidence": {"path": V2_OPERATOR, "sha256": sha(operator.encode()),
                                        "locator": "FIXTURE OPERATOR INSTRUCTION RECORD"},
        "problemKey": stop["problemKey"],
        "predecessor": {**stop_ref, "chainOrdinal": stop["chainOrdinal"],
                        "blockers": blockers, "counters": dict(stop["counters"])},
        "rootReassessment": {"path": V2_REASSESS, "sha256": sha(reassess_text.encode())},
        "sourceContract": source_ref, "workOrderPath": V2_PROP, "workerReturnPath": V2_RETURN,
        "allowedArtifacts": [V2_RETURN, V2_PROOF],
        "effectCeilings": {name: 0 for name in V2_EFFECTS},
        "expiresAtUtc": (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    grant_text = _v2_fence("post-stop-root-admission-json", grant)
    write(root, V2_GRANT, grant_text)
    outcome = {
        "schemaVersion": scec.SCEC_SCHEMA_VERSION, "problemKey": stop["problemKey"],
        "chainMode": "SUCCESSOR", "chainOrdinal": stop["chainOrdinal"] + 1,
        "predecessor": stop_ref,
        "blockerDelta": {"prior": blockers, "resolved": [], "retained": blockers,
                         "new": [], "reopened": [], "current": blockers},
        "resolutionEvidence": {}, "counters": {**stop["counters"], "nonDecreasingBlockerTransitions": 3},
        "claims": [], "requiredDisposition": "ROOT_CONTRACT_REQUIRED",
        "successorScope": "INTEGRATED_ROOT_CONTRACT",
        "rootContractAdmission": {"schemaVersion": "cvf.scecPostStopRootAdmissionPointer@2.0.0",
                                  "path": V2_GRANT, "sha256": sha(grant_text.encode()), "stage": "DISPATCH"},
    }
    rows = [rb_row("ROOT_BUILD_BASELINE", path=V2_SOURCE, data=source),
            rb_row("ROOT_BUILD_SCOPE", path=V2_SOURCE, data=source)]
    comp = {
        "schemaVersion": pf.COMPANION_SCHEMA,
        "proposal": {"path": V2_PROP, "sha256": sha(body.encode())},
        "approvalTarget": {"path": V2_PROP, "sha256": sha(body.encode()),
                           "prospectiveOutcomeSha256": digest(outcome)},
        "prospectiveOutcome": outcome,
        "phasePrerequisites": {"phase": pf.ROOT_BUILD_PHASE, "rows": rows},
        "requestQueue": None, "requestedAction": RB_ACTION,
    }
    write(root, V2_COMP, json.dumps(comp))
    return {"prop": V2_PROP, "outcome": outcome, "grant": grant}


def test_v2_actual_identity_passes_dedicated_cli_and_git_range(tmp_path):
    git_fixture(tmp_path)
    fixture = v2_dispatch_fixture(tmp_path)
    prop = fixture["prop"]
    code, receipt = cli(tmp_path, prop)
    assert code == 0 and receipt["technicalDisposition"] == RB_SCOPED
    assert receipt["canonicalBlockCount"] == 1 and receipt["canonicalViolations"] == []
    assert receipt["proposal"] == {"path": prop, "sha256": sha((tmp_path / prop).read_bytes())}
    assert receipt["approvalTarget"]["sha256"] == receipt["proposal"]["sha256"]
    assert receipt["runtimeReadiness"] is False and receipt["effectAdmission"] is False
    assert receipt["prerequisites"] == {"examined": 2, "deferred": 0}
    code, output = range_cli(tmp_path, extra=("--json",))
    report = json.loads(output)
    assert code == 0 and report["coverage"]["evaluatedMarked"] == 1
    assert report["counts"][RB_SCOPED] == 1 and report["receipts"][0] == receipt


def test_v2_same_outcome_wrong_actual_artifact_identity_is_invalid(tmp_path):
    fixture = v2_dispatch_fixture(tmp_path)
    wrong = "docs/work_orders/wrong-identity.md"
    write(tmp_path, wrong, (tmp_path / V2_PROP).read_bytes())
    comp = json.loads((tmp_path / V2_COMP).read_text(encoding="utf-8"))
    comp["proposal"]["path"] = comp["approvalTarget"]["path"] = wrong
    write(tmp_path, V2_COMP, json.dumps(comp))
    code, receipt = cli(tmp_path, wrong)
    assert code == 1 and receipt["canonicalBlockCount"] == 1
    assert "ROOT_ADMISSION_V2_DISPATCH" in codes(receipt) and receipt["technicalDisposition"] == "INVALID"
    assert receipt["effectAdmission"] is False


def test_v2_missing_artifact_context_rejects_with_real_snapshot_resolvers(tmp_path):
    fixture = v2_dispatch_fixture(tmp_path)
    snap = pf.Snapshot(tmp_path)
    result = scec.validate_block(
        fixture["outcome"], predecessor_hash_resolver=snap.sha256,
        predecessor_block_resolver=snap.blocks, evidence_bytes_resolver=snap.read,
    )
    assert result.is_active and "ROOT_ADMISSION_V2_CONTEXT" in {v.code for v in result.violations}


@pytest.mark.parametrize("mutation,expected", [
    ("grant-missing", "ROOT_ADMISSION_V2_GRANT"),
    ("grant-drift", "ROOT_ADMISSION_V2_GRANT"),
    ("grant-malformed", "ROOT_ADMISSION_V2_GRANT"),
    ("pointer-hash-drift", "ROOT_ADMISSION_V2_GRANT"),
    ("pointer-unsafe", "ROOT_ADMISSION_V2_POINTER"),
    ("source-drift", "ROOT_ADMISSION_V2_SOURCE"),
    ("reassessment-drift", "ROOT_ADMISSION_V2_REASSESSMENT"),
    ("operator-drift", "ROOT_ADMISSION_V2_EVIDENCE"),
    ("ledger-invalid", "ROOT_ADMISSION_V2_WORK_ORDER"),
    ("manifest-wrong", "ROOT_ADMISSION_V2_MANIFEST"),
    ("writable-authority", "ROOT_ADMISSION_V2_MANIFEST"),
    ("expired", "ROOT_ADMISSION_V2_EXPIRED"),
    ("ordinary-stop", "SUCCESSOR_AFTER_STOP_REASSESS"),
])
def test_v2_authority_and_stop_mutations_reject_real_cli(tmp_path, mutation, expected):
    fixture = v2_dispatch_fixture(tmp_path)
    if mutation == "grant-missing":
        (tmp_path / V2_GRANT).unlink()
    elif mutation in {"grant-drift", "source-drift", "reassessment-drift", "operator-drift"}:
        path = {"grant-drift": V2_GRANT, "source-drift": V2_SOURCE,
                "reassessment-drift": V2_REASSESS, "operator-drift": V2_OPERATOR}[mutation]
        write(tmp_path, path, (tmp_path / path).read_bytes() + b"drift\n")
    elif mutation == "grant-malformed":
        raw = (tmp_path / V2_GRANT).read_text(encoding="utf-8")
        write(tmp_path, V2_GRANT, raw.replace('"status":', '"status": "X", "status":', 1))
        fixture["outcome"]["rootContractAdmission"]["sha256"] = sha((tmp_path / V2_GRANT).read_bytes())
        _v2_companion(tmp_path, fixture)
    elif mutation == "pointer-hash-drift":
        fixture["outcome"]["rootContractAdmission"]["sha256"] = "f" * 64
        _v2_companion(tmp_path, fixture)
    elif mutation == "pointer-unsafe":
        fixture["outcome"]["rootContractAdmission"]["path"] = "../escape.md"
        _v2_companion(tmp_path, fixture)
    elif mutation == "ledger-invalid":
        write(tmp_path, V2_PROP, (tmp_path / V2_PROP).read_bytes().replace(b'"mandatory": true', b'"mandatory": "yes"'))
        _v2_companion(tmp_path, fixture)
    elif mutation in {"manifest-wrong", "writable-authority"}:
        fixture["grant"]["allowedArtifacts"].append(
            "docs/reviews/unlisted.md" if mutation == "manifest-wrong" else V2_SOURCE)
        _v2_grant_refresh(tmp_path, fixture)
    elif mutation == "expired":
        fixture["grant"]["expiresAtUtc"] = "2000-01-01T00:00:00Z"
        _v2_grant_refresh(tmp_path, fixture)
    else:
        fixture["outcome"].pop("rootContractAdmission")
        _v2_companion(tmp_path, fixture)
    code, receipt = cli(tmp_path, fixture["prop"])
    assert code == 1 and receipt["canonicalBlockCount"] == 1
    assert expected in codes(receipt), (mutation, codes(receipt))
    assert receipt["technicalDisposition"] == "INVALID" and receipt["effectAdmission"] is False
