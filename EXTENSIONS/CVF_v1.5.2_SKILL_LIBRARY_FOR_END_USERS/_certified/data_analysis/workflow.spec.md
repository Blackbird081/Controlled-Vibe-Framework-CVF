# Workflow Spec - Data Analysis

## Input Contract
Required inputs: dataset_summary, question, metrics, timeframe, constraints. Inputs must be bounded user-provided data summaries or metric extracts and must not include raw credentials, payment credentials, regulated health data, or requests for external data retrieval.

## Output Contract
Expected output sections: Data frame, Key findings, Caveats, Recommended actions. Output is analytical and advisory, requires human review before operational or financial reliance, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/data_analysis.fixture.json
