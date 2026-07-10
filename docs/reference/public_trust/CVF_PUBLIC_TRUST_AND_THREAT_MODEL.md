# CVF Public Trust And Threat Model

Status: ACTIVE_REFERENCE

Memory class: FULL_RECORD

## Purpose

Define the operator trust outcome and expose public-facing threat status
without turning doctrine into an unsupported implementation claim.

## Scope / Applies To

Applies to public-safe CVF claims, demos, evidence summaries, and operator
decision points. It does not replace security review or runtime threat testing.

## Trust Outcome

CVF should help an operator answer five questions without reading internal
implementation history:

1. What is allowed and forbidden?
2. What stage is the work in?
3. What evidence supports the current claim?
4. Can I stop, review, or decline freeze?
5. Who owns the decision?

The operator remains the decision owner. A PASS, receipt, or agent statement is
evidence within a named boundary, not a transfer of accountability.

## Control Status Vocabulary

- `IMPLEMENTED_CONTROL`: a current CVF source, checker, or required workflow
  directly addresses the threat within its stated scope.
- `PARTIAL_CONTROL`: controls exist but do not cover every surface, provider,
  execution mode, or public claim.
- `POSTURE_ONLY`: desired behavior is documented but no general enforcement is
  claimed.

## Threat Register

| Threat | Failure mode | Current status | Current control or evidence | Residual boundary |
| --- | --- | --- | --- | --- |
| False PASS | a PASS is stated without matching evidence | IMPLEMENTED_CONTROL | closure-quality and machine-closure gates require command-backed evidence | external tools and ungoverned repos remain outside coverage |
| Mock/live confusion | structural mock evidence is presented as live governance proof | IMPLEMENTED_CONTROL | mandatory live governance proof separates UI-only mock checks from live claims | ordinary docs examples remain non-live unless explicitly proven |
| Scope escape | an agent edits outside authorized paths or repo role | IMPLEMENTED_CONTROL | work-order scope, AOT changed-set evidence, and repository-boundary standard | enforcement depends on the governed workflow being used |
| Stale redispatch | closed or held work is dispatched from stale continuity | IMPLEMENTED_CONTROL | next-move freshness and dependency-release evidence guards | external chat or copied prompts can still be stale |
| Receipt forgery | a plausible receipt is mistaken for independent proof | PARTIAL_CONTROL | schemas constrain shape; closure review and command evidence check meaning | JSON schema validation cannot prove events occurred |
| Validation theater | shallow checks are used to imply broad correctness | PARTIAL_CONTROL | claim-boundary and closure-diff requirements constrain claims | test adequacy still requires engineering judgment |
| Provider boundary confusion | one provider/lane result is generalized to all providers | PARTIAL_CONTROL | provider-specific evidence and public boundary standards limit claims | provider capability changes and untested lanes remain volatile |
| Evidence durability overclaim | local or transient evidence is called durable | PARTIAL_CONTROL | storage-class, export-disposition, and durable-evidence references distinguish surfaces | external retention and hosted durability require separate proof |
| Prompt injection through context | untrusted text is treated as authority | PARTIAL_CONTROL | source verification and provider-memory boundary require CVF-governed authority | runtime content isolation is not universally claimed |
| Cost drift | repeated scans, tool calls, or live reruns consume quota without value | PARTIAL_CONTROL | live-run diagnostics and optional BUILD-loop metrics expose waste | no universal automated budget controller exists |
| Trust overclaim | doctrine or UI wording is presented as measured user trust | POSTURE_ONLY | this model requires bounded language and operator checkpoints | no user-study or product-effect claim is made here |

## Operator Checkpoints

At intake, the operator should see scope and exclusions. Before execution, the
operator should see risk and evidence requirements. At review, the operator
should see what changed, what passed, and what remains unproven. Freeze is a
separate decision, not an automatic consequence of implementation success.

## Public Communication Rules

- Name the proof mode: structural, static, mock, live, hosted, or production.
- Cite the exact artifact or command supporting a claim.
- State residual limitations next to the positive result.
- Do not convert provider-local memory, external advice, or private provenance
  detail into public authority.
- Do not claim trust improvement without measured user evidence.

## Claim Boundary

This artifact defines trust outcomes and a current threat-control map. It does
not prove complete mitigation, production security, hosted freshness, provider
parity, or measured operator trust.
