# Workflow Spec - Product Brief

## Input Contract
Required inputs: product_goal, target_user, problem, constraints. Inputs must be user-provided business context and must not include raw credentials or regulated secrets.

## Output Contract
Expected output sections: Product summary, User and problem, Scope, Acceptance criteria. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/product_brief.fixture.json
