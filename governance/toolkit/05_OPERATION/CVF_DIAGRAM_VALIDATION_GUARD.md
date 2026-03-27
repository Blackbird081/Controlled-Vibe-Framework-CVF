# CVF Diagram Validation Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active diagram-to-implementation consistency contract for governed state machines and workflow diagrams.
**Applies to:** All humans and AI agents introducing or changing state-machine or workflow logic that should be represented by a Mermaid diagram.
**Enforced by:** `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/diagram_validation/diagram.validator.ts`

## Purpose

- preserve the CVF principle that documentation is code
- stop state-machine diagrams from drifting away from the implementation
- block merges where the declared workflow and executable workflow no longer match

## Rule

Every governed state machine or workflow implementation MUST ship with a matching Mermaid diagram and the diagram MUST stay consistent with the implementation.

### Scope

This applies urgently to:

- all upgrades
- all new extensions or modules
- any new folder or file that contains state-machine or governance-pipeline logic

### Required Diagram Contract

1. every state machine or workflow implementation MUST have a Markdown file containing a Mermaid `stateDiagram-v2`
2. the diagram MUST NOT contain:
   - `missingStates`
   - `extraStates`
   - `missingTransitions`
   - `extraTransitions`
3. no developer or AI agent may merge code while the diagram validator reports inconsistency

### Triggering Action

Agent process:

1. when building a state machine, generate or update the Mermaid diagram
2. run the validator against the implementation and the diagram
3. fix the Mermaid structure or the code until they match

Pipeline process:

- CI or equivalent validation should run the diagram validator for the governed surface
- future repo-level automation may add a dedicated `check_diagram_validation.py`, but the current guard already requires the validator path above to be treated as authoritative

## Enforcement Surface

- implementation-side validation runs through `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/diagram_validation/diagram.validator.ts`
- manual review must block any branch or feature where state-machine code and Mermaid diagram disagree
- remediation requires updating the diagram or the code until the validator no longer reports structural mismatch

## Related Artifacts

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/diagram_validation/diagram.validator.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/diagram_validation/diagram.consistency.check.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/diagram_validation/state.diagram.generator.ts`
- `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`

## Final Clause

If the code says one workflow and the diagram says another, governance truth is already broken even before runtime fails.
