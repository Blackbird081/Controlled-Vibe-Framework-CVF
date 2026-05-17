"""
conftest.py

Shared test fixtures for the Governance Engine test suite.
"""

import pytest
import sys
import os
import json
import tempfile
import shutil

# Make sure the ai_governance_core root is on PYTHONPATH
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


@pytest.fixture
def tmp_dir():
    """Create a temporary directory for test files, cleaned up after the test."""
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def tmp_json_file(tmp_dir):
    """Create a temporary JSON file and return its path."""
    path = os.path.join(tmp_dir, "test.json")
    with open(path, "w") as f:
        json.dump({}, f)
    return path


@pytest.fixture
def tmp_ledger_file(tmp_dir):
    """Create a temporary empty ledger chain file."""
    path = os.path.join(tmp_dir, "ledger_chain.json")
    with open(path, "w") as f:
        json.dump([], f)
    return path


@pytest.fixture
def sample_governance_result():
    """Sample governance result dict for adapter testing."""
    return {
        "risk_score": 0.65,
        "final_status": "APPROVED",
        "final_decision": "ALLOW",
        "compliance": {
            "status": "PASSED",
            "score": 85,
        },
        "brand": {
            "drift": {"drift_score": 15},
            "freeze": {"freeze": False},
        },
        "override_used": False,
    }
