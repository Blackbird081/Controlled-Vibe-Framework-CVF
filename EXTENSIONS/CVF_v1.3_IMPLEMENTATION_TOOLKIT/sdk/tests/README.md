# Testing Framework for CVF

This directory contains the testing infrastructure for CVF v1.3+.

## Structure

```
tests/
├── conftest.py                    # Pytest configuration & fixtures
├── pytest_cvf_plugin/
│   ├── __init__.py
│   ├── validators.py              # Contract validation tests
│   └── fixtures.py                # Reusable test fixtures
├── unit/
│   ├── test_skill_contract.py
│   ├── test_registry.py
│   ├── test_adapters.py
│   └── test_validators.py
├── integration/
│   ├── test_full_lifecycle.py
│   └── test_agent_adapters.py
├── fixtures/
│   ├── valid_contracts/           # Valid contract examples
│   ├── invalid_contracts/         # Invalid contract examples
│   └── sample_data.yaml           # Test data
└── README.md
```

## Quick Start

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_skill_contract.py

# With coverage report
pytest --cov=sdk --cov-report=html
```

## Writing Tests

See individual test files for patterns and best practices.
