from governance.compat import check_agent_workspace_runtime_boundary as guard


def test_queue_family_set_is_stable():
    assert guard.QUEUE_FAMILIES == (
        "intake",
        "dispatch",
        "review",
        "session_sync",
        "parked",
    )


def test_agent_workspace_runtime_boundary_gate_passes_current_tree():
    violations, _changed_count = guard.run_check("HEAD", "HEAD")
    assert violations == []
