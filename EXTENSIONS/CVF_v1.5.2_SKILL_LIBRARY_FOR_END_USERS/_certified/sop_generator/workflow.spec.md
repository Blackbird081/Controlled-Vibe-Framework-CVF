# Workflow Spec - SOP Generator

## Input Contract
Required inputs: process_name, actors, steps, controls. Inputs must be user-provided business context and must not include raw credentials or regulated secrets.

## Output Contract
Expected output sections: Purpose, Procedure, Roles, Controls. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/sop_generator.fixture.json
