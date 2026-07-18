# Workflow Spec - Contract Review

## Input Contract
Required inputs: contract_text, review_goal, jurisdiction_context. Inputs must be user-provided business context and must not include raw credentials or regulated secrets.

## Output Contract
Expected output sections: Clause summary, Risk flags, Questions, Escalation note. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/contract_review.fixture.json
