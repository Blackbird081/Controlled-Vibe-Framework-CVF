# Workflow Spec - Proposal Writer

## Input Contract
Required inputs: customer_need, scope, timeline, constraints. Inputs must be user-provided business context and must not include raw credentials or regulated secrets.

## Output Contract
Expected output sections: Executive summary, Scope, Timeline, Terms and risks. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/proposal_writer.fixture.json
