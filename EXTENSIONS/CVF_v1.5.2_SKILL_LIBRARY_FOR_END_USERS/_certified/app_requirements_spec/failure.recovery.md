# Failure Recovery - App Requirements Spec

## Failure Modes
Missing app goal; unclear user workflow; request asks for direct code execution, deployment, credential handling, production changes, or provider/runtime behavior outside this static pack.

## Recovery Actions
Ask for the missing product goal or workflow inputs, narrow the spec to a bounded first version, or route to human review when the request exceeds the pack boundary.

## Rollback Policy
No external side effects are permitted. If certification fails, do not expose the pack as certified and keep the previous certified registry unchanged.
