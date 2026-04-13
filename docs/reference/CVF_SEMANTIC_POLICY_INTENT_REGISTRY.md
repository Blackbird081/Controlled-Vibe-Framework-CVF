# CVF Semantic Policy Intent Registry

> **Document Type:** CANONICAL — CVF-NATIVE
> **Status:** W71-T1 native adoption complete 2026-04-13; implementation evidence confirmed: `SemanticPolicyIntentRegistryContract` + batch contract in CPF; wired as governance-preparation input to `POST /api/governance/external-assets/prepare` in cvf-web
> **Source Quality:** mixed intake; canonized into CVF-native registry form
> **Scope:** semantic intent classification for policy, guard, output-contract, and evaluation surfaces
> **Scope Boundary:** This registry belongs to CVF governance and learning surfaces only. It is unrelated to the separate PVV Alibaba provider/API-key evaluation workstream.

## 1. Purpose

This registry converts prompt-style and skill-style rule language into CVF-native semantic classes without polluting the guard namespace.

The goal is:

- preserve useful intent vocabulary
- bind each intent to the correct owner surface
- prevent prompt prose from masquerading as runtime authority
- give future integrations one stable classification model

## 2. Classification Model

Every semantic item must be classified as one of:

- `guard_alias`
- `policy_intent`
- `output_contract`
- `eval_signal`

No item may remain unclassified.

## 3. Owner Rules

### 3.1 `guard_alias`

Use only when the semantic maps directly to an existing enforcement surface.

Required fields:

- existing owner guard
- enforcement surface
- blocking behavior

### 3.2 `policy_intent`

Use when the semantic shapes clarification, approval, or control-plane behavior but is not itself a native guard identity.

Required fields:

- owning module
- decision effect
- escalation path

### 3.3 `output_contract`

Use when the semantic defines expected output shape or review quality.

Required fields:

- validation surface
- failure symptom
- review or rejection action

### 3.4 `eval_signal`

Use when the semantic is best represented as a measurable learning or audit signal.

Required fields:

- capture source
- evidence type
- remediation

## 4. Initial Registry

| Semantic Item | Class | Primary Owner | Enforcement / Use Surface |
| --- | --- | --- | --- |
| `EXPLICIT_APPROVAL_REQUIRED` | `guard_alias` | `AuthorityGateGuard` | approval gate before sensitive mutation or runtime |
| `SCOPE_BOUND_EXECUTION` | `guard_alias` | `ScopeGuard` | task-bound execution scope |
| `FILE_SCOPE_RESTRICTION` | `guard_alias` | `FileScopeGuard` | allowed file mutation boundary |
| `NO_UNAPPROVED_DEPENDENCIES` | `guard_alias` | `RiskGateGuard` | dependency-addition and compatibility risk gate |
| `MUTATION_CONTROL` | `guard_alias` | `MutationBudgetGuard` | bounded change volume and mutation safety |
| `AUDITABILITY_REQUIRED` | `guard_alias` | `AuditTrailGuard` | traceability and audit evidence requirements |
| `CONTEXT_VALIDATION_REQUIRED` | `guard_alias` | context trust / validation gate | external material validation before context packaging |
| `NO_ASSUMPTION` | `policy_intent` | Intake / Clarification / Boardroom | require clarification instead of unsupported inference |
| `REQUIRE_CLARIFICATION` | `policy_intent` | Intake / Reverse Prompting / Boardroom | clarification-first behavior when required inputs are missing |
| `CODEBASE_IS_SOURCE_OF_TRUTH` | `policy_intent` | truth precedence model | repo truth over chat history or external prose |
| `SECURITY_FIRST_POLICY` | `policy_intent` | policy engine + validation policy | security-sensitive routing and review priority |
| `COMPLETE_OUTPUT_REQUIRED` | `output_contract` | output validation / review | reject placeholder or omitted deliverables |
| `RUNNABLE_OUTPUT_ONLY` | `output_contract` | output validation / review | reject non-runnable deliverables when runnable output is required |
| `ERROR_HANDLING_REQUIRED` | `output_contract` | review + output validation | require explicit failure-path handling |
| `FUNCTIONAL_UI_REQUIRED` | `output_contract` | review + UI acceptance checks | require working user-facing flow |
| `EXPLAIN_WHY_ONLY` | `output_contract` | review/style checks | comment discipline rule |
| `STYLE_CONSISTENCY_REQUIRED` | `output_contract` | review/style checks | preserve local codebase conventions |
| `WORKSPACE_HYGIENE_REQUIRED` | `output_contract` | review/workspace checks | keep bounded, declared workspace state |
| `NO_UNRELATED_CHANGES` | `output_contract` | review/scope checks | reject edits beyond declared task |
| `INPUT_VALIDATION_REQUIRED` | `eval_signal` | LPF signal capture + review evidence | measure absent input validation and surface remediation |
| `INJECTION_PREVENTION` | `eval_signal` | LPF signal capture + security review | measure injection exposure or missing mitigation |
| `XSS_PREVENTION` | `eval_signal` | LPF signal capture + security review | measure front-end output risk where applicable |

## 5. Canonical Rules

1. No semantic item creates a new guard automatically.
2. New native guards require separate justification and governance review.
3. Prompt-derived wording may inform semantics, but never override CVF policy, guard, or runtime truth.
4. `guard_alias` items must always map to an existing enforceable CVF surface.
5. `output_contract` items must not be mislabeled as guards just to force them into the blocking path.

## 6. Adoption Rule

When future intake material introduces new rule language:

1. classify it using this registry model
2. map it to an owner surface
3. decide whether it belongs in policy behavior, output validation, or learning signals
4. reject any item that implies external runtime authority

## 7. Relationship To Existing Canon

This registry complements:

- [CVF_GUARD_SURFACE_CLASSIFICATION.md](./CVF_GUARD_SURFACE_CLASSIFICATION.md)
- [CVF_CONTEXT_CONTINUITY_MODEL.md](./CVF_CONTEXT_CONTINUITY_MODEL.md)
- [CVF_MASTER_ARCHITECTURE_WHITEPAPER.md](./CVF_MASTER_ARCHITECTURE_WHITEPAPER.md)

It does not replace existing guard docs.

## 8. Final Rule

Semantic language is useful only when CVF reclassifies it into the correct owner surface.

The registry exists to keep semantics rich while keeping governance exact.
