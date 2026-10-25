# SDK tests

The integration suite exercises the current Python SDK directly with synthetic
contracts. It covers contract validation, registry lifecycle and audit freshness,
context/control refusals, duplicate registration, persistence, and native routing
assignment and approval metadata. It makes no provider, network or skill execution
call and does not establish live governance, release or production readiness.

## Current layout

- `conftest.py`: shared fixtures used by the older unit examples.
- `unit/`: historical fixture-based test scaffolding; passing it alone is not SDK integration proof.
- `integration/test_registry_lifecycle.py`: executable tests against `SkillContract`, `SkillRegistry`, and `SkillRouter`.
- `fixtures/`: sample valid and invalid YAML contracts.
- `_archive/`: historical phase tests, excluded by the SDK CI selection.

## Run native integration tests

From `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT`, expose this directory on
`PYTHONPATH` so the native `sdk` package can be imported. Use the project's
existing Python test dependencies (`pytest` and `PyYAML`).

```bash
PYTHONPATH=. python -m pytest sdk/tests/integration -q
```

PowerShell equivalent:

```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m pytest sdk/tests/integration -q
```

The selected SDK CI unit command is `python -m pytest sdk/tests/unit -q` with the
same import path. The integration command is separate and must collect actual
native SDK tests. No provider adapters are constructed by this integration suite.
