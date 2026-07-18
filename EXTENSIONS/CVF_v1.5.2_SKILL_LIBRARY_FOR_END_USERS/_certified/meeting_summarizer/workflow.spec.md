# Workflow Spec - Meeting Summarizer

## Input Contract
Required inputs: meeting_notes, participants, desired_outcome. Inputs must be user-provided business context and must not include raw credentials or regulated secrets.

## Output Contract
Expected output sections: Summary, Decisions, Action items, Risks. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/meeting_summarizer.fixture.json
