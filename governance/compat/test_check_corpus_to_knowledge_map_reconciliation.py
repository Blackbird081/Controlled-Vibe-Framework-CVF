import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_corpus_to_knowledge_map_reconciliation.py")
SPEC = importlib.util.spec_from_file_location("check_corpus_to_knowledge_map_reconciliation", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


VALID_RECONCILED = """
# Knowledge Map

## Knowledge System Reconciliation

- Knowledge task class: SEMANTIC_REGION_MAP
- Source manifest: docs/evidence/manifest.json
- Source manifest hash: abc123
- Enumeration safety: Get-ChildItem docs/source -Recurse -File
- Intake registry or ledger: docs/evidence/intake.json
- Authority assets: manifest-backed source files
- Derived views: semantic regions and graph index
- Semantic region ledger: docs/evidence/regions.json
- Region reconciliation: assets=3; mapped=3; deferred=0; unmapped=0
- Orphan or unmapped assets: none
- Cross-region links: docs/evidence/links.json
- Drift check: PASS
- Rebuildability check: PASS
- Retrieval boundary: bounded lookup only; deeper source review remains required
- Adversarial verification: recomputed totals and challenged source/derived boundary
- Knowledge-map verdict: RECONCILED_VERIFIED
"""


def _messages(issues: list[dict[str, str]]) -> list[str]:
    return [issue["message"] for issue in issues]


def test_valid_reconciled_verified_passes() -> None:
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", VALID_RECONCILED) == []


def test_map_claim_without_section_fails() -> None:
    issues = MODULE._validate_output("docs/reviews/CVF_TEST.md", "# Review\n\nKnowledge-map is complete.")
    assert any("Knowledge System Reconciliation" in message for message in _messages(issues))


def test_verified_rejects_unmapped_assets() -> None:
    invalid = VALID_RECONCILED.replace("mapped=3; deferred=0; unmapped=0", "mapped=2; deferred=0; unmapped=1")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("requires deferred=0 and unmapped=0" in message for message in _messages(issues))


def test_verified_rejects_deferred_assets() -> None:
    invalid = VALID_RECONCILED.replace("mapped=3; deferred=0; unmapped=0", "mapped=2; deferred=1; unmapped=0")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("requires deferred=0 and unmapped=0" in message for message in _messages(issues))


def test_declared_gap_verdict_allows_deferred_assets() -> None:
    bounded = VALID_RECONCILED.replace("mapped=3; deferred=0; unmapped=0", "mapped=2; deferred=1; unmapped=0").replace(
        "RECONCILED_VERIFIED", "RECONCILED_WITH_DECLARED_GAPS"
    )
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", bounded) == []


def test_arithmetic_mismatch_fails() -> None:
    invalid = VALID_RECONCILED.replace("assets=3; mapped=3", "assets=4; mapped=3")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("assets must equal mapped + deferred + unmapped" in message for message in _messages(issues))


def test_reconciled_verdict_rejects_stale_map() -> None:
    invalid = VALID_RECONCILED.replace("Drift check: PASS", "Drift check: STALE_MAP")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("requires drift check PASS" in message for message in _messages(issues))


def test_bare_rg_files_enumeration_fails() -> None:
    invalid = VALID_RECONCILED.replace("Get-ChildItem docs/source -Recurse -File", "rg --files docs/source")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("rg --files --hidden --no-ignore" in message for message in _messages(issues))


def test_ignore_safe_rg_files_enumeration_passes() -> None:
    safe = VALID_RECONCILED.replace("Get-ChildItem docs/source -Recurse -File", "rg --files --hidden --no-ignore docs/source")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", safe) == []


def test_find_in_prose_enumeration_fails() -> None:
    invalid = VALID_RECONCILED.replace(
        "Get-ChildItem docs/source -Recurse -File",
        "Unable to find files in docs/source",
    )
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("rg --files --hidden --no-ignore" in message for message in _messages(issues))


def test_find_command_enumeration_passes() -> None:
    safe = VALID_RECONCILED.replace("Get-ChildItem docs/source -Recurse -File", "find ./docs/source -type f")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", safe) == []


def test_partial_verdict_allows_visible_unmapped_assets() -> None:
    partial = VALID_RECONCILED.replace("mapped=3; deferred=0; unmapped=0", "mapped=1; deferred=1; unmapped=1").replace(
        "Orphan or unmapped assets: none", "Orphan or unmapped assets: docs/source/orphan.md"
    ).replace("RECONCILED_VERIFIED", "PARTIAL")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", partial) == []


def test_binding_requires_checker_reference() -> None:
    issues = MODULE._validate_binding(MODULE.AUTORUN_PATH, "no checker binding")
    assert any(MODULE.THIS_SCRIPT_PATH in message for message in _messages(issues))
