"""
Pytest configuration and fixtures for CVF testing.

This file is automatically loaded by pytest and provides:
- Common fixtures for test data
- Pytest plugins
- Coverage configuration
"""

import pytest
import yaml
import json
from pathlib import Path
from typing import Dict, Any, List


# ============================================================================
# FIXTURES: Valid Contracts
# ============================================================================

@pytest.fixture
def valid_skill_contract_r0() -> Dict[str, Any]:
    """Valid R0 (Read-only, no side effects) Skill Contract."""
    return {
        "CAPABILITY_ID": "search-documents-v1",
        "DOMAIN": "data",
        "DESCRIPTION": "Search through documents and return matches",
        "RISK_LEVEL": "Low",
        
        "ALLOWED_ARCHETYPES": ["analyzer", "executor"],
        "ALLOWED_PHASES": ["DISCOVERY", "DESIGN", "BUILD"],
        "REQUIRED_DECISIONS": [],
        "REQUIRED_STATUS": "ACTIVE",
        
        "INPUT_FIELDS": [
            {
                "name": "query",
                "type": "string",
                "validation": "length <= 500",
                "required": True
            },
            {
                "name": "limit",
                "type": "integer",
                "validation": "1 <= value <= 100",
                "required": False,
                "default": 10
            }
        ],
        
        "OUTPUT_FIELDS": [
            {
                "name": "results",
                "type": "array",
                "success_criteria": "length >= 0",
                "failure_signals": "null, exception"
            },
            {
                "name": "total_matches",
                "type": "integer",
                "success_criteria": "value >= 0",
                "failure_signals": "negative"
            }
        ],
        
        "SIDE_EFFECTS": [],
        "ROLLBACK_POSSIBILITY": "N/A",
        "IDEMPOTENCY": "Yes",
        "EXPECTED_DURATION": "< 5 seconds",
        
        "KNOWN_FAILURE_MODES": ["timeout", "invalid_query"],
        "WORST_CASE_IMPACT": "No impact - read-only operation",
        "HUMAN_INTERVENTION_REQUIRED": False
    }


@pytest.fixture
def valid_skill_contract_r1() -> Dict[str, Any]:
    """Valid R1 (Controlled side effects) Skill Contract."""
    return {
        "CAPABILITY_ID": "create-comment-v1",
        "DOMAIN": "product",
        "DESCRIPTION": "Create a comment on a task or document",
        "RISK_LEVEL": "Medium",
        
        "ALLOWED_ARCHETYPES": ["executor"],
        "ALLOWED_PHASES": ["BUILD"],
        "REQUIRED_DECISIONS": ["DECISION_ALLOW_COMMENTS"],
        "REQUIRED_STATUS": "ACTIVE",
        
        "INPUT_FIELDS": [
            {
                "name": "task_id",
                "type": "string",
                "validation": "^[A-Z]+-\\d+$",
                "required": True
            },
            {
                "name": "comment_text",
                "type": "string",
                "validation": "length <= 2000",
                "required": True
            }
        ],
        
        "OUTPUT_FIELDS": [
            {
                "name": "comment_id",
                "type": "string",
                "success_criteria": "not empty",
                "failure_signals": "null, empty"
            },
            {
                "name": "created_at",
                "type": "datetime",
                "success_criteria": "is_recent(now)",
                "failure_signals": "future_date, null"
            }
        ],
        
        "SIDE_EFFECTS": ["create database record", "send notification"],
        "ROLLBACK_POSSIBILITY": "Yes - delete comment",
        "IDEMPOTENCY": "No",
        "EXPECTED_DURATION": "< 10 seconds",
        
        "KNOWN_FAILURE_MODES": ["task_not_found", "permission_denied", "text_too_long"],
        "WORST_CASE_IMPACT": "Creates unwanted comment - requires manual deletion",
        "HUMAN_INTERVENTION_REQUIRED": False
    }


@pytest.fixture
def valid_skill_contract_r2() -> Dict[str, Any]:
    """Valid R2 (Elevated permissions) Skill Contract."""
    return {
        "CAPABILITY_ID": "deploy-to-staging-v1",
        "DOMAIN": "devops",
        "DESCRIPTION": "Deploy code to staging environment",
        "RISK_LEVEL": "High",
        
        "ALLOWED_ARCHETYPES": ["executor"],
        "ALLOWED_PHASES": ["BUILD"],
        "REQUIRED_DECISIONS": ["DECISION_DEPLOY_APPROVED", "DECISION_STAGING_READY"],
        "REQUIRED_STATUS": "ACTIVE",
        
        "INPUT_FIELDS": [
            {
                "name": "git_ref",
                "type": "string",
                "validation": "branch|tag format",
                "required": True
            },
            {
                "name": "skip_tests",
                "type": "boolean",
                "validation": "must be False",
                "required": False,
                "default": False
            }
        ],
        
        "OUTPUT_FIELDS": [
            {
                "name": "deployment_id",
                "type": "string",
                "success_criteria": "not empty",
                "failure_signals": "null"
            },
            {
                "name": "status",
                "type": "string",
                "success_criteria": "in [success, warning]",
                "failure_signals": "failed, error"
            }
        ],
        
        "SIDE_EFFECTS": ["start deployment", "run tests", "update DNS"],
        "ROLLBACK_POSSIBILITY": "Yes - rollback to previous deployment",
        "IDEMPOTENCY": "No",
        "EXPECTED_DURATION": "5-30 minutes",
        
        "KNOWN_FAILURE_MODES": ["tests_failed", "invalid_ref", "server_down"],
        "WORST_CASE_IMPACT": "Broken staging environment - affects team",
        "HUMAN_INTERVENTION_REQUIRED": True
    }


@pytest.fixture
def invalid_skill_contract_missing_field() -> Dict[str, Any]:
    """Invalid contract - missing required field."""
    return {
        "CAPABILITY_ID": "incomplete-skill-v1",
        # Missing DOMAIN, DESCRIPTION, etc.
        "ALLOWED_ARCHETYPES": ["executor"]
    }


@pytest.fixture
def invalid_skill_contract_bad_risk() -> Dict[str, Any]:
    """Invalid contract - invalid RISK_LEVEL value."""
    return {
        "CAPABILITY_ID": "bad-risk-v1",
        "DOMAIN": "data",
        "DESCRIPTION": "Test skill",
        "RISK_LEVEL": "Unknown",  # Invalid - should be Low/Medium/High/Critical
        "ALLOWED_ARCHETYPES": ["executor"],
        "ALLOWED_PHASES": ["BUILD"],
        "REQUIRED_DECISIONS": [],
        "REQUIRED_STATUS": "ACTIVE",
        "INPUT_FIELDS": [],
        "OUTPUT_FIELDS": [],
        "SIDE_EFFECTS": [],
        "ROLLBACK_POSSIBILITY": "N/A",
        "IDEMPOTENCY": "Yes",
        "EXPECTED_DURATION": "< 5 seconds",
        "KNOWN_FAILURE_MODES": [],
        "WORST_CASE_IMPACT": "None",
        "HUMAN_INTERVENTION_REQUIRED": False
    }


# ============================================================================
# FIXTURES: Test Data
# ============================================================================

@pytest.fixture
def test_fixtures_path() -> Path:
    """Path to test fixtures directory."""
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_contracts_dir(test_fixtures_path: Path) -> Path:
    """Directory containing sample contracts."""
    return test_fixtures_path / "valid_contracts"


@pytest.fixture
def mock_registry_data() -> Dict[str, List[str]]:
    """Mock registry containing capability IDs by domain."""
    return {
        "data": ["search-documents-v1", "export-data-v1"],
        "devops": ["deploy-to-staging-v1", "restart-service-v1"],
        "product": ["create-comment-v1", "assign-task-v1"],
        "security": ["audit-access-v1"]
    }


# ============================================================================
# FIXTURES: Mocks & Test Helpers
# ============================================================================

@pytest.fixture
def mock_audit_logger():
    """Mock audit logger for testing."""
    class MockAuditLogger:
        def __init__(self):
            self.logs = []
        
        def log(self, event: str, details: Dict[str, Any]):
            self.logs.append({"event": event, "details": details})
        
        def get_logs(self) -> List[Dict[str, Any]]:
            return self.logs
    
    return MockAuditLogger()


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


# ============================================================================
# HOOKS
# ============================================================================

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Provide extra information on test failures.
    """
    outcome = yield
    rep = outcome.get_result()
    
    if rep.failed and call.when == "call":
        # Add extra information for debugging
        if hasattr(item, 'callspec') and hasattr(item.callspec, 'params'):
            rep.sections.append(("Test Info", str(item.callspec.params)))
