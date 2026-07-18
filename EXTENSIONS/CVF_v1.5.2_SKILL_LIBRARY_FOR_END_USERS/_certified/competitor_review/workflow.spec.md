# Workflow Spec - Competitor Review

## Input Contract
Required inputs: market, competitors, offering, audience, decision_goal. Inputs must be user-provided market context, competitor names or descriptions, and the business decision the review should support. Inputs must not include raw credentials, private customer records, or regulated secrets.

## Output Contract
Expected output sections: Market frame, Competitor matrix, Positioning risks, Recommended next moves. Output is advisory, bounded to the declared pack, and must preserve governance receipt evidence.

## Deterministic Fixture Path
tests/fixtures/workflow/competitor_review.fixture.json
