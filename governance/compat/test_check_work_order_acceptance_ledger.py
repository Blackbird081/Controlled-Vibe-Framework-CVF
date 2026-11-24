import importlib.util
import json
import subprocess
from pathlib import Path
import pytest

MODULE_PATH = Path(__file__).with_name("check_work_order_acceptance_ledger.py")
SPEC = importlib.util.spec_from_file_location("acceptance_ledger", MODULE_PATH)
module = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(module)


def work_order():
    return '''```acceptance-ledger-json
{"schemaVersion":"cvf.workOrderAcceptanceLedger@1.0.0","requirements":[{"requirementId":"R1","mandatory":true,"expectedArtifacts":["a.txt"],"requiredProofIds":["P1"]}],"proofCatalog":[{"proofId":"P1","kind":"COMMAND","locator":"t"}]}
```'''


def worker_return(status="COMPLETE_PENDING_REVIEW", row_status="PASS", artifact="a.txt", proof="P1"):
    return f'''Status: {status}
```acceptance-evidence-json
{{"schemaVersion":"cvf.workOrderAcceptanceEvidence@1.0.0","executionBaseHead":"abcdef0","results":[{{"requirementId":"R1","actualArtifacts":["{artifact}"],"proofRefs":["{proof}"],"status":"{row_status}"}}]}}
```'''


def test_positive_join():
    assert module.validate_return(work_order(), worker_return(), {"a.txt"}) == []


def test_fast_gate_requires_dispatcher_ledger_before_worker_return():
    gate = "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`"
    assert any("must occur exactly once; found 0" in issue for issue in module.validate_dispatch_ledger(gate))
    assert module.validate_dispatch_ledger(gate + "\n" + work_order()) == []
    assert module.validate_dispatch_ledger("requiredGate: `python another_gate.py`") == []


def test_git_observed_unclaimed_artifact_fails():
    issues = module.validate_return(work_order(), worker_return(), {"a.txt", "extra.txt"})
    assert any("Git observed unclaimed artifact" in issue for issue in issues)


def test_terminal_reducer_blocks_false_complete():
    issues = module.validate_return(work_order(), worker_return(row_status="BLOCKED"), {"a.txt"})
    assert any("deterministic reducer BLOCKED_WITH_REASON" in issue for issue in issues)


def test_missing_artifact_and_unbound_proof_fail():
    issues = module.validate_return(work_order(), worker_return(artifact="b.txt", proof="P2"), {"b.txt"})
    assert any("dispatcher-owned" in issue for issue in issues)
    assert any("required proof" in issue for issue in issues)


def test_missing_and_unknown_rows_fail_closed():
    missing = worker_return().replace('"results":[{', '"results":[]')
    assert module.validate_return(work_order(), missing, set())
    unknown = worker_return().replace('"R1"', '"R2"')
    assert any("unknown or duplicate" in issue for issue in module.validate_return(work_order(), unknown, {"a.txt"}))


@pytest.fixture
def return_repo(tmp_path, monkeypatch):
    def git(*args):
        return subprocess.check_output(["git", *args], cwd=tmp_path, stderr=subprocess.PIPE).decode().strip()
    git("init", "-q")
    git("config", "user.name", "Return test")
    git("config", "user.email", "return-test@example.invalid")
    git("config", "core.autocrlf", "false")
    git("config", "core.hooksPath", str(tmp_path / "no-hooks"))
    wo = work_order().replace('["a.txt"]', '["out.txt","return.md"]')
    (tmp_path / "order.md").write_text(wo, encoding="utf-8")
    git("add", "."); git("commit", "-qm", "base")
    base = git("rev-parse", "HEAD")
    ret = worker_return(artifact="out.txt").replace('"abcdef0"', json.dumps(base))
    ret = ret.replace('["out.txt"]', '["out.txt","return.md"]')
    (tmp_path / "return.md").write_text(ret, encoding="utf-8")
    (tmp_path / "out.txt").write_bytes(b"original\ncontent\n")
    git("add", "."); git("commit", "-qm", "return")
    end = git("rev-parse", "HEAD")
    monkeypatch.setattr(module, "ROOT", tmp_path)
    def observe(endpoint=None):
        return module.observe_return_endpoint(base, endpoint or end, "order.md", "return.md",
            (tmp_path / "order.md").read_text(encoding="utf-8"),
            (tmp_path / "return.md").read_text(encoding="utf-8"))
    return tmp_path, git, base, end, wo, ret, observe


def test_endpoint_eol_only_is_labeled_and_raw_bytes_preserved(return_repo, capsys):
    root, git, base, end, wo, ret, observe = return_repo
    raw = b"original\r\ncontent\r\n"
    (root / "out.txt").write_bytes(raw)
    paths, issues = observe()
    assert issues == [] and paths == {"out.txt", "return.md"}
    assert module.validate_return(wo, ret, paths) == []
    assert module.check_return_acceptance("order.md", "return.md", wo, ret, end) == []
    assert (root / "out.txt").read_bytes() == raw
    assert "EOL_ONLY_GIT_CONTENT_EQUIVALENCE: out.txt" in capsys.readouterr().out


def test_endpoint_ignores_later_paths_but_discloses_them(return_repo, capsys):
    root, git, base, end, wo, ret, observe = return_repo
    (root / "later.txt").write_text("unrelated continuity or worker output", encoding="utf-8")
    git("add", "."); git("commit", "-qm", "later")
    (root / "untracked.txt").write_text("pending", encoding="utf-8")
    paths, issues = observe()
    assert issues == [] and module.validate_return(wo, ret, paths) == []
    output = capsys.readouterr().out
    assert 'Post-return net committed paths' in output and '"later.txt"' in output
    assert '"untracked.txt"' in output
    assert any("unclaimed" in issue for issue in module.validate_return(wo, ret, module.git_observed_paths(base)))
    assert any("unclaimed" in issue for issue in module.check_return_acceptance("order.md", "return.md", wo, ret))


def test_endpoint_still_rejects_in_range_unclaimed_file(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    (root / "extra.txt").write_text("inside interval", encoding="utf-8")
    git("add", "."); git("commit", "--amend", "--no-edit", "-q")
    paths, issues = observe(git("rev-parse", "HEAD"))
    assert issues == []
    assert any("unclaimed" in issue for issue in module.validate_return(wo, ret, paths))


@pytest.mark.parametrize("choice", ["short", "missing", "earlier", "later", "nonancestor"])
def test_endpoint_rejects_wrong_or_unbound_commit(return_repo, choice):
    root, git, base, end, wo, ret, observe = return_repo
    candidate = end[:8] if choice == "short" else "f" * 40 if choice == "missing" else base
    if choice in ("later", "nonancestor"):
        if choice == "nonancestor":
            git("checkout", "--detach", base)
        (root / "other.txt").write_text("later", encoding="utf-8")
        git("add", "."); git("commit", "-qm", "other")
        candidate = git("rev-parse", "HEAD")
        if choice == "nonancestor":
            git("checkout", "--detach", end)
    assert observe(candidate)[1]


@pytest.mark.parametrize("path", ["order.md", "return.md", "out.txt"])
@pytest.mark.parametrize("committed", [False, True])
def test_endpoint_rejects_bound_content_drift(return_repo, path, committed):
    root, git, base, end, wo, ret, observe = return_repo
    (root / path).write_bytes((root / path).read_bytes() + b"\nchanged\n")
    if committed:
        git("add", "."); git("commit", "-qm", "drift")
    assert observe()[1]


def test_endpoint_does_not_trust_assume_unchanged_stat_cache(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    git("update-index", "--assume-unchanged", "out.txt")
    (root / "out.txt").write_bytes(b"altered!\ncontent\n")
    assert git("diff", "--name-only", "HEAD") == ""
    assert any("working-copy bound-file drift" in issue for issue in observe()[1])


def test_endpoint_detects_staged_change_even_if_worktree_restored(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    old = (root / "out.txt").read_bytes()
    (root / "out.txt").write_bytes(b"staged replacement\n")
    git("add", "out.txt")
    (root / "out.txt").write_bytes(old)
    assert any("staged bound-file drift" in issue for issue in observe()[1])


def test_endpoint_rejects_committed_mode_change(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    git("update-index", "--chmod=+x", "out.txt")
    git("commit", "-qm", "mode drift")
    assert any("committed bound-file drift" in issue for issue in observe()[1])


def test_endpoint_requires_regular_existing_bound_file(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    (root / "out.txt").unlink()
    assert observe()[1]


def test_endpoint_binary_newline_change_is_not_text_equivalence(return_repo):
    root, git, base, end, wo, ret, observe = return_repo
    (root / "out.txt").write_bytes(b"binary\0\n")
    git("add", "."); git("commit", "--amend", "--no-edit", "-q")
    new_end = git("rev-parse", "HEAD")
    (root / "out.txt").write_bytes(b"binary\0\r\n")
    assert any("working-copy bound-file drift" in issue for issue in observe(new_end)[1])
