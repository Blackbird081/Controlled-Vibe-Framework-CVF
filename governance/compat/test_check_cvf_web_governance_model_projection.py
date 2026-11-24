from pathlib import Path
import shutil

import pytest

from check_cvf_web_governance_model_projection import GENERATOR, REPO_ROOT, check_projection


WEB = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web"
GUARD = "EXTENSIONS/CVF_GUARD_CONTRACT/src"
PROJECTION = Path(WEB) / "src/lib/generated/governance-model.generated.ts"
RISK_MODEL = Path("docs/concepts/risk-model.md")
LOCAL_SOURCES = (
    Path(GUARD) / "types.ts",
    Path(GUARD) / "guards/authority-gate.guard.ts",
    Path(GUARD) / "guards/phase-gate.guard.ts",
    RISK_MODEL,
)


@pytest.fixture
def checkout(tmp_path: Path) -> Path:
    for path in (*LOCAL_SOURCES, PROJECTION, GENERATOR):
        (tmp_path / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(REPO_ROOT / path, tmp_path / path)
    return tmp_path


def snapshot(root: Path) -> dict[Path, bytes]:
    return {path.relative_to(root): path.read_bytes() for path in root.rglob("*") if path.is_file()}


def test_matches_local_sources_without_writing(checkout: Path) -> None:
    before = snapshot(checkout)
    assert check_projection(checkout) == []
    assert snapshot(checkout) == before


@pytest.mark.parametrize("source", LOCAL_SOURCES)
def test_reports_source_drift_without_regenerating(checkout: Path, source: Path) -> None:
    path = checkout / source
    path.write_bytes(path.read_bytes() + b"\n")
    before = snapshot(checkout)
    assert check_projection(checkout)
    assert snapshot(checkout) == before


def test_rejects_modified_projection_with_original_source_digests(checkout: Path) -> None:
    path = checkout / PROJECTION
    path.write_bytes(path.read_bytes() + b"\n// Unexpected manual edit.\n")
    assert check_projection(checkout)


def test_reports_missing_projection_without_creating_it(checkout: Path) -> None:
    path = checkout / PROJECTION
    path.unlink()
    assert check_projection(checkout)
    assert not path.exists()


def test_ignores_checkout_line_ending_differences(checkout: Path) -> None:
    for relative in (*LOCAL_SOURCES, PROJECTION):
        path = checkout / relative
        path.write_bytes(path.read_bytes().replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"))
    assert check_projection(checkout) == []


def test_reports_missing_generator(tmp_path: Path) -> None:
    assert "Missing Web projection generator" in check_projection(tmp_path)[0]
