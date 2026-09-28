import importlib.util
from pathlib import Path

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
