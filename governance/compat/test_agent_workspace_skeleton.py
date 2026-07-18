import importlib.util
from pathlib import Path


CHECKER_PATH = Path(__file__).resolve().with_name("check_agent_workspace_skeleton.py")
SPEC = importlib.util.spec_from_file_location("check_agent_workspace_skeleton", CHECKER_PATH)
CHECKER = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(CHECKER)


def test_lane_list_covers_required_workspace_lanes() -> None:
    assert set(CHECKER.LANES) == {
        "intake",
        "dispatch",
        "execution",
        "worker_return",
        "review",
        "accepted_material",
        "session_sync",
        "parked",
        "blocked",
        "archive_ready",
    }


def test_current_skeleton_is_valid() -> None:
    violations, _ = CHECKER.run_check("HEAD", "HEAD")
    assert violations == []
