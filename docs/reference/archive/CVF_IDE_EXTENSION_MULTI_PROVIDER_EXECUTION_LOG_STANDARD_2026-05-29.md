# CVF IDE Extension Multi-Provider Execution Log Standard

Memory class: POINTER_RECORD

Status: canonical execution-log standard for IDE-extension and multi-provider
agent sessions; machine-enforced by
`governance/compat/check_multi_provider_execution_log.py`.

## Purpose

This standard closes the blind spot where governed CVF work is performed through
VS Code extensions, Antigravity, browser agents, direct provider scripts, or
other external execution surfaces rather than a single CVF CLI process.

It makes each mixed-agent session readable after the fact: who acted, through
which surface, on which commit range, with what evidence, at what quality/cost
boundary, and with which findings promoted into governance rules.

## Scope

This applies when a CVF batch uses more than one provider, agent tab, IDE
extension, external IDE agent, direct provider script, or delegated execution
surface to draft, implement, review, close, or prove governed work.

It applies to operator-reported sessions even when the agent cannot inspect the
hidden chat history of each extension tab. In that case the log must label the
unobserved parts as operator-reported and rely on commits, diffs, receipts,
tests, and closure artifacts for verification.

## Core Principle

CVF trust belongs to the governed evidence chain, not to a provider name, model
brand, extension tab, or handwritten `PASS` summary.

## Authorized Execution Surface Values

Use the closest value and add a free-text note when needed:

- `VS_CODE_EXTENSION_CODEX`
- `VS_CODE_EXTENSION_CLAUDE_CODE`
- `VS_CODE_EXTENSION_QWEN_CODE`
- `ANTIGRAVITY`
- `CLI`
- `MCP_CLIENT`
- `BROWSER_AGENT`
- `DIRECT_PROVIDER_SCRIPT`
- `LOCAL_SHELL`
- `UNKNOWN_OPERATOR_REPORTED`

## Required Session Log Fields

A multi-provider execution log must include:

- session date and operator-supplied time window;
- provenance workspace and public/provenance boundary;
- base/head commit anchors and changed-file summary when available;
- role-to-provider assignment table;
- Execution Attribution Block separating roadmap/order authorship, worker
  execution, review/closure ownership, provider/model, execution surface,
  evidence basis, and attribution boundary;
- invocation surface for each agent or provider lane;
- source basis for each claim: `OPERATOR_REPORTED`, `GIT_VERIFIED`,
  `TEST_VERIFIED`, `RECEIPT_VERIFIED`, `DIFF_VERIFIED`,
  `COST_LEDGER_VERIFIED`, or `UNVERIFIED_REPORTED`;
- roadmap/work-order trace for governed closures;
- quality findings and whether each is handled by an existing rule, new written
  rule, or future machine check;
- cost fields when known: effort level, token counts, live-call counts,
  observed wall time, and estimated cost source;
- claim boundary separating provider-method proof, governed-route proof,
  documentation-only closure, runtime implementation, and public-readiness
  claims.

## Execution Attribution Block

Every mixed-agent or multi-provider session log must include this exact section
header and a table with these columns:

| Artifact or range | Roadmap/order author | Worker/executor | Reviewer/closer | Provider/model | Execution surface | Evidence basis | Attribution boundary |
|---|---|---|---|---|---|---|---|

The block answers the operational question before any quality claim is made:
who authored the roadmap or work order, who executed it, who reviewed or closed
it, which provider/model and surface were used, and what evidence supports that
assignment.

Rules:

- do not infer hidden IDE, Antigravity, or extension-tab ownership from commit
  author alone;
- use `OPERATOR_REPORTED` when ownership comes from the operator rather than
  from an artifact the repo can inspect;
- use `UNKNOWN_OPERATOR_REPORTED` only with an explicit attribution boundary;
- split roadmap/order authorship from worker execution when different agents or
  providers participated;
- label mixed or corrected commits as mixed attribution instead of assigning
  the whole range to one model.

## PASS And Quality Boundary

Governance hooks passing is necessary but not sufficient evidence of product
quality.

A session log must not treat `CLOSED_PASS`, `CLOSED_PASS_BOUNDED`, or hook PASS
as proof of:

- code design quality;
- provider output quality;
- governed-route behavior when calls bypassed `/api/execute`;
- public readiness;
- production readiness;
- cost optimization;
- correctness of hidden extension-tab reasoning.

Those claims require separate tests, receipts, source review, cost ledger, or
operator acceptance evidence.

## Direct Provider Proof Rule

A script that calls OpenAI, DeepSeek, Alibaba, or another provider endpoint
directly may only be logged as `provider method capability proof` unless it
also passes through the governed CVF route or the release gate required by the
live governance proof standard.

Direct-provider proof must record:

- provider and model;
- HTTP status or transport status;
- method under test;
- output-shape validation actually performed;
- diagnostic classification for failures;
- whether missing keys, skipped calls, or empty streams would fail the proof.

## Cost And Quality Attribution Rule

When multiple agents contribute to one commit or wave, the log must distinguish
between:

- operator-reported model ownership;
- commit-level evidence;
- files actually changed;
- manual corrections by another agent;
- gate hardening or cleanup mixed into the same commit.

If attribution is mixed, the log must say so instead of assigning the whole
commit to one provider.

## Finding-To-Rule Disposition

Every post-session finding must be classified as one of:

- `RULE_EXISTS`: already covered by a written CVF rule;
- `RULE_ADDED`: covered by this or another newly added written rule;
- `MACHINE_CHECK_CANDIDATE`: should become a gate/check;
- `DESIGN_REVIEW_REQUIRED`: cannot be solved by rule text alone;
- `N/A_WITH_REASON`: out of scope for the session.

## Violation Conditions

A multi-provider batch is not ready for closure review when:

- agent/provider lanes are unnamed or surface-less;
- IDE extension or Antigravity work is described as CLI execution without
  evidence;
- a direct provider proof is claimed as governance behavior proof;
- a hook PASS is used as a substitute for code-quality review;
- cost claims lack token, wall-time, pricing, or explicit `unknown` evidence;
- mixed commits are attributed to one model without noting corrections or
  shared ownership.
- the `Execution Attribution Block` is missing, lacks the required columns, or
  fails to separate roadmap/order author from worker/executor.

## Machine Guard

The mandatory guard is:

```powershell
python governance/compat/check_multi_provider_execution_log.py --base <baseHead> --head HEAD --enforce
```

The guard runs in the agent autorun workflow and local governance hook chain.
It fails changed multi-provider logs when provider/model, tool surface,
evidence basis, commit evidence, quality findings, cost boundary, direct
provider proof boundary, Execution Attribution Block, or claim boundary are
missing.

## Related Artifacts

- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`
- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `docs/logs/`
- `governance/compat/check_multi_provider_execution_log.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`
- `governance/compat/run_local_governance_hook_chain.py`

## Final Clause

This standard records and governs execution attribution. It does not claim that
CVF can inspect hidden IDE-extension chat history, provider internal reasoning,
or third-party agent memory. Only artifacts, diffs, tests, receipts, logs, and
explicit operator reports are evidence.
