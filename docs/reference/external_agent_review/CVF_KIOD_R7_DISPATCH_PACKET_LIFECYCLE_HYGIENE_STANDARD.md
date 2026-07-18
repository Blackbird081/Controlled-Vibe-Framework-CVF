# CVF KIOD-R7 Dispatch Packet Lifecycle Hygiene Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-01

## Purpose

Define conservative lifecycle hygiene rules for CVF dispatch packets
(docs/baselines/ and docs/work_orders/).  A dispatch packet becomes stale when
the session evolves - a new active handoff supersedes the one the packet was
authored against, a lane is closed but the packet still carries
`Status: DISPATCH_READY`, or a specific provider or model name is encoded in a
normative role field.  This standard names the three rules, the checker that
enforces them (changed-range only), and the authorized remediation path for each.

## Scope / Applies To

Applies to changed `docs/baselines/*.md` and `docs/work_orders/*.md` files that
carry `Status: DISPATCH_READY`.  Archive-qualified paths
(`/archive/`) and non-dispatch-ready artifacts are excluded.

Does not apply to docs/reviews/, docs/roadmaps/, docs/audits/, or any unchanged
historical artifact.

## Rules

### LH-01 - Stale Active-Handoff Reference

**Trigger:** A changed dispatch-ready artifact references a non-archive
`AGENT_HANDOFF*.md` file that differs from the value of `activeHandoff` in
`CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`.

**Rationale:** When the operator opens a new active handoff the previous one
moves to `CVF_SESSION/handoffs/archive/`.  A dispatch packet that still names
the old handoff unqualified is operating against a superseded governance anchor
and must be updated or retired.

**Compliant form:** Either (a) update the reference to the current active
handoff, or (b) qualify the old name with its archive path so the checker
recognises it as historical context.

**Exempt:** Any occurrence of the stale handoff name that appears immediately
after an `archive/` path prefix is treated as an archive-qualified historical
citation and is not flagged.

### LH-02 - Closed-Lane Stale DISPATCH_READY

**Trigger:** A changed dispatch-ready artifact's lane key (extracted from
`Batch ID:` field or filename) appears within a 200-character window of a
closed-status token (`CLOSED_PASS_BOUNDED`, `CLOSED_PASS`,
`CLOSED_PASS_BOUNDED_INCOMPLETE`) in the active session front door
(`CVF_SESSION_MEMORY.md`), active session state
(`CVF_SESSION/ACTIVE_SESSION_STATE.json`), or current active handoff text.

**Rationale:** Once a lane is recorded as closed, any surviving
`DISPATCH_READY` artifact for that lane is a lifecycle residue that may mislead
future workers into re-executing already-closed scope.

**Compliant form:** Archive or update the dispatch packet to carry a closed
status.  Do not create a new execution loop for a lane the operator has already
closed.

**Exempt:** Artifacts where the lane key appears only alongside non-closed
status tokens (e.g. `DISPATCH_READY`, `HOLD`) in the active session text.

### LH-03 - Provider-Specific Normative Role Assignment

**Trigger:** A changed dispatch-ready artifact's `## Agent Roles` table or
`rolePattern` field contains a specific AI-provider or model name
(e.g. `Claude`, `GPT-4`, `Gemini`, `Codex`, `DeepSeek`, `Qwen`, `Mistral`,
`LLaMA`, `ChatGPT`, `OpenAI`, `Anthropic`) in a normative owner or worker cell.

**Rationale:** CVF dispatch is role-based, not provider-bound.  Hard-wiring a
provider name as the required worker, dispatcher, or reviewer breaks
multi-provider routing and violates the role-neutrality principle in
`docs/reference/guard_orientation/README.md`.

**Compliant form:** Use role terms only: `worker`, `reviewer/closer`,
`dispatcher`, `operator`, or `session-sync steward`.  Provider names may appear
in evidence rows, prior-run receipts, or historical commentary outside the
normative role cells.

## Checker

`governance/compat/check_dispatch_packet_lifecycle_hygiene.py`

The checker accepts `--base`, `--head`, and `--enforce` arguments identical to
other range-aware CVF checkers.  It reads only changed paths within the supplied
range plus uncommitted worktree state.  Unchanged historical artifacts are never
inspected.

## Remediation

| Rule | Symptom | Required fix |
|---|---|---|
| LH-01 | Stale handoff name in dispatch packet | Update to current `activeHandoff` or archive-qualify the old reference |
| LH-02 | `DISPATCH_READY` packet for a closed lane | Archive the packet or update status to reflect the closed state |
| LH-03 | Provider name in `## Agent Roles` or `rolePattern` | Replace with neutral role term |

## Wiring

This checker is wired into:

- `governance/compat/agent_autorun_command_catalog.py` (`_common_commands`)
- `governance/compat/local_governance_hook_catalog_pre_commit.py`
- `governance/compat/local_governance_hook_catalog_pre_push.py`
- `governance/compat/local_governance_hook_catalog_reviewer_fast.py`

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external knowledge intake routing guard implementation |
| Chain map route | KIOD-R7 work order -> dispatch packet lifecycle hygiene standard -> checker wiring |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_KIOD_R7_DISPATCH_PACKET_LIFECYCLE_HYGIENE_STANDARD.md` |
| Disposition | CONFIRMED_EXISTING - guard-maintenance standard authored under KIOD-R7 scope |
| Claim boundary | lifecycle hygiene standard and checker only; no runtime, package, provider, public, dashboard, adapter, or production-readiness claim |

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: This standard defines conservative static
rules for dispatch packet lifecycle hygiene checks.  It does not make
evidence-heavy predictions, run experiments, or compare competing hypotheses.
The rules follow directly from the KIOD-R7 work order scope and the CVF
role-neutrality principle.  No prediction, evidence comparison, or
contradiction-gap disposition is applicable.

## Claim Boundary

This standard defines lifecycle hygiene rules for changed dispatch-ready
artifacts only.  It does not authorize runtime changes, provider-routing
behavior, package activation, public-sync, Web/UI changes, MCP/CLI adapter
implementation, or production-readiness claims.  The checker enforces
conservative changed-range rules; it does not infer broad historical closure
semantics.
