# Failure Recovery - Landing Page Builder

## Failure Modes
Missing required input; ambiguous scope; request asks for publishing, binding commitment, secret handling, or provider/runtime behavior outside this static pack.

## Recovery Actions
Ask for missing input, narrow the scope to the declared outcome, or route to human review when the request exceeds the pack boundary.

## Rollback Policy
No external side effects are permitted. If certification fails, do not expose the pack as certified and keep the previous certified registry unchanged.
