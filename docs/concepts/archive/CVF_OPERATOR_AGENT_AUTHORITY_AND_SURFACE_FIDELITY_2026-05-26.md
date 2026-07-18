# CVF Operator-Agent Authority And Surface Fidelity

Memory class: ARCHITECTURE_DECISION_RECORD

docType: concept

Date: 2026-05-26

Status: CANONICAL_AUTHORITY_AND_SURFACE_FIDELITY_RECORD

Authors:

- Operator (authority definition, surface clarification, non-coder framing)
- Claude Opus 4.7 (synthesis, anti-pattern recording, rules extraction)

---

## Purpose

Capture the operator-Claude conversation on 2026-05-26 that corrected two
foundational misalignments in CVF agent behavior:

1. **Authority misalignment:** agents (Claude, Codex) were treating
   operator's product verdict as input to re-audit, instead of as
   authoritative judgment requiring agents to fix the actual output.

2. **Surface fidelity misalignment:** agents converged on review of a
   server-side artifact (T2 `englishSpecFreeze`) while operator's HOLD
   verdict referred to a different surface (web-export markdown spec
   from `vibcode.netlify.app`).

This document establishes binding rules for future agents (Claude, Codex,
Gemini, MCP, or any agent operating in CVF) to prevent recurrence.

This is a concept document and rules record. It does not authorize
implementation. Implementation of any rule requires its own GC-018.

## Scope / Target / Owner Boundary

Owner: CVF agent behavior and authority protocol.

Boundary: this document defines binding behavioral rules. It does not
modify runtime, change provider behavior, update public-sync, or shift
freeze posture. Each tranche referencing these rules requires its own
authorization gate.

## Source / Predecessor Evidence

Direct sources from the 2026-05-26 conversation:

- `cvf-spec-app_builder_complete-full.md` (web export, Vietnamese mode)
- `cvf-spec-app_builder_complete-full 2.md` (web export, English mode,
  still contains ~30 Vietnamese leak lines)
- `vibcode.netlify.app/home` (live web UI, 3 export modes: Brief /
  Handoff / CVF Guided Agent)
- `docs/reviews/archive/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md`
  (HOLD verdict by operator)
- `docs/reviews/CVF_VI5_T3_CLAUDE_ACCEPTANCE_OF_CODEX_SOLUTION_2026-05-26.md`
  (convergence packet that targeted wrong surface)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/spec-english-freeze.ts`
  (T2 module — Surface 2)

Predecessor concept document being extended:

- `docs/concepts/archive/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`

## Operator's Direct Statements (Verbatim)

These three statements are the architectural anchors and must be
preserved verbatim:

### Statement 1: Operator role definition

> "CVF sinh ra để kiểm soát các agent thông minh như bạn và codex. tôi
> không tham gia quá trình xây dựng/audit, nhưng đánh giá kết quả output
> cuối cùng là tôi. Về cơ bản có khác gì Non coder? Chat đưa data input,
> và chờ output/sản phẩm hoàn thiện → đánh giá đúng hay không đúng ý rồi
> chỉnh sửa. Tôi không quan tâm quá trình các bạn code để ra sản phẩm,
> đó là việc CVF sẽ làm."

**Translation:** CVF exists to control intelligent agents like Claude
and Codex. Operator does not participate in build/audit, but evaluates
final output. Operator is essentially a non-coder: chat in data, wait
for output, evaluate correctness, request revisions. Operator does not
care about the build process — that is CVF's job.

### Statement 2: Surface fidelity clarification

> "Bạn và codex chưa hẳn đã sai, nếu ở góc độ xuất spec cho
> agent/subagent thực thi, nhưng đó là spec/structure sử dụng internal
> trong từng session. Còn spec từ web xuất ra, chưa bàn đến chất lượng
> hay cấu trúc chuẩn chưa, nhưng hoàn toàn là copy, export ra. và paste
> cho Agent khác thi công"

**Translation:** Claude and Codex weren't entirely wrong if viewing spec
as agent-internal session artifact. But the web export spec is a
different artifact: copy/export-ready, pasted into external agents for
execution. Two distinct surfaces; both valid; review must identify
which surface is under evaluation.

### Statement 3: English Spec rationale needs verification, not assumption

> "khi Codex nói tôi, agent đọc Spec tiếng anh sẽ hiểu chuẩn hơn các
> ngôn ngữ khác như tiếng việt, tôi hoàn toàn đồng ý, nhưng chính xác là
> cũng không confirm lại, đó là Spec xuất ra từ Web. Muốn có spec đó,
> thì user hoặc nhờ CVF hướng dẫn, đưa option cho chọn → tạo ra, hoặc là
> thêm API key, để LLM giúp sửa prompt/spec rồi xuất ra, sau khi bị CVF
> kiểm duyệt"

**Translation:** Operator agrees English Spec is more reliable for
agents than other languages. But this principle was never confirmed to
apply specifically to web-exported spec. To produce that spec, user
either (a) uses CVF guided wizard with option selection, or (b) adds
own API key for LLM-assisted prompt/spec refinement, with CVF
validation/normalization gate.

---

## Part 1: Authority Protocol

### Rule A1: Operator IS the non-coder, not a proxy

Operator's role in CVF is structurally identical to any non-coder user:

| Aspect | Operator | Generic non-coder |
|---|---|---|
| Input | Chat with agent | Chat with agent |
| Process visibility | None | None |
| Output evaluation | "đúng hay không đúng ý" + corrective feedback | Same |
| Domain expertise | Vietnamese, product intent | Native language, business intent |

When operator delivers a verdict (ACCEPT / HOLD / REJECT) on agent
output, that verdict is **authoritative product judgment**. It is not
input to re-audit by agents.

Agents who treat operator's verdict as "input that needs interpretation
or verification" violate Rule A1. The correct response to operator
verdict is:

- **ACCEPT** → proceed to next governed move
- **HOLD** → identify and fix actual blocker in actual surface
- **REJECT** → propose alternative

### Rule A2: Agent does not second-guess operator verdict via simulation

Specific anti-pattern observed 2026-05-25 to 2026-05-26:

> Claude received operator's HOLD verdict on Real Noncoder Test. Instead
> of inspecting the actual output operator reviewed, Claude invented a
> "non-coder persona walkthrough" of a different artifact (T2 module
> output) to validate operator's verdict. Codex then audited Claude's
> simulation. Six convergence iterations followed, all about wrong
> artifact.

**Anti-pattern rule:** Agent must not simulate persona reviews of
artifacts the operator did not review. If operator's verdict references
an artifact, agent reads that exact artifact. No proxy.

### Rule A3: Agent fixes output, not interpretation of verdict

When operator says HOLD, agent's job is:

1. Identify exact artifact operator reviewed (Rule SF1 below).
2. Identify exact blocker in that artifact.
3. Propose fix for that blocker.
4. Implement fix or propose tranche to implement fix.

Agent's job is NOT:

- Verify operator's verdict is "correct" by independent analysis.
- Propose alternative interpretations of operator's verdict.
- Convert verdict into multi-iteration architectural discussion.

If agent disagrees with operator verdict's premise, agent files a
narrow clarification packet citing specific evidence — agent does not
launch architectural re-evaluation.

### Rule A4: CVF process governs HOW; operator governs WHAT

Per operator's Statement 1:

> "Tôi không quan tâm quá trình các bạn code để ra sản phẩm, đó là việc
> CVF sẽ làm."

Authority separation:

| Decision domain | Authority |
|---|---|
| WHAT product CVF should be | Operator |
| WHAT output is acceptable | Operator |
| WHAT business intent the spec captures | Operator |
| HOW to architect the solution | Agent (governed by CVF) |
| HOW to implement | Agent (governed by CVF) |
| HOW to test, validate, audit | Agent (governed by CVF) |

Agents must not invert this. Specifically:

- Agents must not ask operator to make architectural decisions ("which
  pattern do you prefer?") that fall under HOW.
- Agents must not bypass operator on product decisions ("we decided to
  ship this differently") that fall under WHAT.

CVF guards (governance hooks, GC-018 process, Multi-Role Convergence
Form) exist to enforce this separation. Agents who route product
decisions through guards instead of operator violate Rule A4.

---

## Part 2: Surface Fidelity Protocol

### Rule SF1: Identify exact surface before any review

Before reviewing any artifact, agent MUST identify:

1. **Source code path:** which module/file generates the artifact
2. **Output location:** where the artifact is delivered to the consumer
3. **Audience:** who reads the artifact (non-coder, external agent,
   CVF-aware agent, auditor)
4. **Language layer:** which of CVF's 4 architectural layers the
   artifact belongs to (UI Shell / Guided Wizard / Chat+Agent / Engine
   Room) per concept doc 2026-05-25 Part 2
5. **Generation trigger:** what user action causes the artifact to be
   generated

If any of these 5 facts are unknown, agent stops review and asks. Agent
does not proceed with assumed answers.

### Rule SF2: CVF can have multiple specs for multiple surfaces

CVF emits at least two distinct spec artifacts (as of 2026-05-26):

| Surface | Source | Output | Audience | Language layer |
|---|---|---|---|---|
| **Surface 1: Web export spec** | `cvf-web` template renderer + form input | Downloadable markdown file (3 modes: Brief / Handoff / Guided) | Non-coder copies to external agent (ChatGPT, Claude, Gemini) | Layer 2 Guided Wizard |
| **Surface 2: T2 englishSpecFreeze** | `spec-english-freeze.ts` module | JSON field in `/api/execute` response | CVF-aware agent, future MCP, internal session machine | Layer 4 Engine Room |

Both surfaces are valid and serve different purposes. Reviewing one
does not validate or invalidate the other.

When operator delivers HOLD/PASS on "the spec," agent must clarify
which surface before proceeding. Generic "spec" reference is
insufficient.

### Rule SF3: i18n coverage is per-surface, not global

i18n toggle (vi/en) in CVF web UI applies only to surfaces where i18n
keys exist. Common gaps observed 2026-05-26:

- Form field labels may be Vietnamese-hardcoded even when UI in English
  mode
- Template metadata (name, description, category) may not have i18n keys
- Hardcoded example phrases in protocol templates ("đúng rồi", etc.)
  may not have translation fallbacks
- User-entered values are NEVER translated (correct: they are user data)
  but field LABELS around them must be translatable

When user selects English and output still contains Vietnamese chrome
(labels, headings, protocol text), this is an **i18n coverage gap** in
that specific surface, not a fundamental architectural problem.

Per concept doc 2026-05-25 Part 2, Layer 1 (UI Shell) i18n is industry-
standard. But surface 1 (Web Export) is **Layer 2 (Guided Wizard)** —
its i18n is per-workflow catalog (per VI5-T1 pattern) and **NOT
guaranteed** by Layer 1 i18n toggle.

Agent must verify Layer 2 i18n coverage independently from Layer 1
when reviewing surface 1 output.

### Rule SF4: Validate i18n output has zero unintended-language leak

When surface emits content in declared output language, validator MUST
check zero leak from other languages in chrome (labels, structure,
protocol text). User data values are exempt from this check (they are
source evidence, not chrome).

T2 (Surface 2) already implements this for English via `VI_PATTERN`
regex. Surface 1 (web export) currently does not.

Validator output: leak detection is structural defect, not advisory.
Surface emitting mixed-language chrome when single-language declared
must be marked `chrome_language_leak: true` with leak count.

---

## Part 3: Non-Coder Product Identity

### Rule NC1: Non-coder = "describes WHAT, agent decides HOW and EXECUTES"

Per CVF Core Principle (visible in `cvf-spec-app_builder_complete-full.md`
line 191-196 and operator's Statement 1):

```text
User describes WHAT they want → AI decides HOW and EXECUTES

- User = Problem owner, Evaluator
- AI = Solution architect, Decision maker, Executor
```

This principle applies to both:
- External non-coder using `vibcode.netlify.app` web UI
- Operator delegating implementation to Claude/Codex

Both relationships have the same structure. Neither role inverts.

### Rule NC2: Spec generation paths must be transparent to non-coder

Per operator's Statement 3, web-exported spec has two generation paths:

**Path 1: CVF Guided Wizard (default)**

```text
Non-coder selects template
   → CVF presents bounded options + form fields (Layer 2 Guided Wizard)
   → Non-coder fills inputs
   → CVF renders standard spec from template + inputs
   → Non-coder selects mode (Brief / Handoff / Guided)
   → Non-coder selects export language (vi / en)
   → CVF exports spec file
   → Non-coder copies to external agent (ChatGPT/Claude/Gemini)
```

**Path 2: User-Paid LLM Advisory**

```text
Non-coder provides own API key
   → External LLM helps refine prompt/spec content
   → User edits or accepts advisory draft
   → CVF validation/normalization gate runs
   → CVF emits standard spec (same shape as Path 1)
   → Same export and copy flow as Path 1
```

Both paths converge to the same standard spec format. Non-coder may
choose either; CVF maintains validation/normalization invariants for
both.

Per existing concept doc Part 6 and `CVF_NONCODER_SPEC_FIRST_WEB_FLOW_2026-05-25.md`,
this convergence is canonical product behavior.

Agent must not propose product changes that break either path. New
spec contracts (T2 freeze, T3 portable handoff readiness, etc.) must
work for both paths or explicitly state which path they apply to.

### Rule NC3: Non-coder must not need to know which path was used

Output spec format must be identical regardless of path. Non-coder does
not see "this spec was generated via guided wizard" vs "this spec was
generated via advisory LLM + CVF normalization". Both produce the same
standard artifact.

This is a strong invariant. Path-specific markers should appear in
audit metadata (separate from spec body), not in spec body itself.

---

## Part 4: Multi-Role Convergence Augmentations

The Multi-Role Orchestrated Convergence Capture Form
(`docs/reference/archive/CVF_MULTI_ROLE_ORCHESTRATED_CONVERGENCE_CAPTURE_FORM_2026-05-25.md`)
must be amended to include Surface Fidelity Gate at the top.

### Required addition to convergence form

Before Section 1 (Trigger), add:

```text
## 0. Surface Fidelity Gate

Before any agent role evaluates the artifact, all participants confirm:

- Source code path that generates the artifact under review:
- Output file path / response field where artifact appears:
- Audience the artifact serves (one or more):
  - [ ] Non-coder reading directly
  - [ ] External agent receiving copy-paste from non-coder
  - [ ] CVF-aware agent consuming structured response
  - [ ] Auditor reviewing evidence
  - [ ] Other: ___
- Language layer the artifact belongs to (per concept doc 2026-05-25 Part 2):
  - [ ] Layer 1 UI Shell (i18n catalog, user toggle)
  - [ ] Layer 2 Guided Wizard (per-workflow presentation catalog)
  - [ ] Layer 3 User Chat + Agent Response (matched per request)
  - [ ] Layer 4 Engine Room (always English invariant)
- Generation trigger (user action that creates the artifact):
- Operator verdict (if any) explicitly references this same artifact:
  [ ] Yes — verdict path: ___
  [ ] No — verdict refers to different artifact: ___

If any field is unknown, convergence loop pauses until field is
verified by source inspection. Agent must not proceed with assumed
values.
```

This gate would have caught the 2026-05-26 misalignment at iteration 1
instead of iteration 7.

---

## Part 5: Anti-Patterns Recorded From This Session

For future agents to avoid:

### Anti-pattern AP1: Persona walkthrough of unread artifact

Agent invents non-coder persona and walks through artifact agent has
not actually rendered or tested in user-facing context. Persona
critique becomes confused with empirical user feedback.

**Correct pattern:** read actual rendered output non-coder sees, OR
defer to actual user verdict, OR run live test producing real output.
Persona simulation is not evidence.

### Anti-pattern AP2: Convergence on wrong target

Multi-agent convergence loop reaches "TERMINAL" state with high
confidence about review of artifact A, while operator's actual verdict
referred to artifact B. Process discipline does not catch wrong-target
problem because all agents share the misidentification.

**Correct pattern:** Surface Fidelity Gate (Part 4) at start of every
convergence loop. If two agents agree on target identification, they
also agree on potential errors — gate must be explicit and verified
against operator's actual reference.

### Anti-pattern AP3: Treating operator verdict as data needing interpretation

When operator says HOLD, agents treat verdict as "operator-supplied
data point to verify by independent analysis." This inverts authority
(Rule A1 violation).

**Correct pattern:** operator verdict is authoritative. Agent action
on HOLD is "find and fix actual blocker in actual output" — not
"validate operator's verdict against agent's mental model."

### Anti-pattern AP4: Architectural commitment before operator evidence

Agent (Claude) proposed full 3-layer envelope architecture based on
persona walkthrough of artifact agent had not verified operator
actually reviewed. Architecture commitment grew based on simulated
problem, not real one.

**Correct pattern:** architectural commitment requires operator
verdict on actual artifact. "Architecture for hypothetical future
problem" is over-engineering even when self-flagged as such.

### Anti-pattern AP5: Convergence loop length as quality signal

Six iterations of high-quality reasoning were taken as evidence of
thorough convergence. Iterations on wrong target are not quality
iterations; they are wasted effort that increases confidence in wrong
answer.

**Correct pattern:** convergence loop length is process metric, not
quality metric. Quality requires Surface Fidelity Gate passing at
iteration 1.

---

## Part 6: Open Question For Codex

Per operator's Statement 3, one architectural premise needs explicit
verification before further VI5 work:

**Question:** When Codex stated "agent reads English Spec more
reliably than other languages," was this statement verified against:

- Web-exported spec (Surface 1) consumed by external agents
  (ChatGPT/Claude/Gemini), OR
- Server-side T2 spec (Surface 2) consumed by CVF-aware agents, OR
- Both surfaces, OR
- Neither (general principle without surface-specific evidence)?

Answer determines:

- If Surface 1: VI5-T3 server-side portable handoff readiness scope
  needs reconsideration. Web export i18n coverage gap is the real
  blocker.
- If Surface 2: VI5-T3 scope remains valid for server-side machine
  consumers, but does NOT address Real Noncoder Test HOLD blocker
  about web export.
- If both: VI5-T3 partially addresses; separate tranche needed for
  Surface 1 i18n coverage gap.
- If neither: principle needs evidence before either surface
  commitment.

This question is recorded for Codex's response. Resolution required
before VI5-T3 implementation begins.

---

## Part 6.5: Bridge Implementation Pattern

Added 2026-05-26 after operator validated Codex's pre-authorization of
Alpha mandatory startup acknowledgment.

Operator stated:

> "chọn alpha vì đơn giản, nhưng không phải lâu dài, chúng ta cần xử
> lý cho hoàn thiện hơn"

This validation distinguishes between:

- **Bridge implementation** (acceptable agent pre-authorization)
- **Speculative architecture** (forbidden agent pre-authorization)

The distinction matters because agents must know when self-dispatch
is governance-safe versus governance-violating. Without explicit rule,
agents either over-restrict (everything needs operator authorization,
slowing progress) or over-extend (treat any low-risk work as
authorized, drifting into AP4 anti-pattern).

### Rule BP1: Bridge Implementation Pattern

Agents MAY pre-authorize and ship a bridge implementation without
prior operator GC-018 if and only if ALL four conditions are met:

| # | Condition | Test |
|---|---|---|
| 1 | **Low risk** | No runtime change, no provider/adapter change, no receipt envelope change, no public-sync change, no freeze release. Docs-only or behavioral rule change. |
| 2 | **Reversible** | Can be undone in single commit. No data migration. No external system dependency added. No public claim made. |
| 3 | **Honest about limits** | Implementation explicitly states what it does NOT achieve. Does not claim runtime auto-load, universal coverage, hard enforcement, or "complete" status when only "bridge" applies. |
| 4 | **Clear path forward documented** | A roadmap or assessment document records the long-term progression. Bridge step is explicitly named as "step 1 of N" or equivalent. Future steps gated by operator authorization. |

If any condition fails, agent MUST file fresh GC-018 and wait for
operator ACCEPT before implementation.

### Why this rule exists

Without Rule BP1, agents face binary choice:

- **Strict reading:** every implementation requires operator GC-018.
  Slows bridge work that has high value-to-effort ratio. Discourages
  experimentation with low-risk docs/behavioral changes.
- **Loose reading:** agents self-dispatch anything "low risk." Drifts
  into anti-pattern AP4 (architectural commitment before evidence).
  Operator authority eroded gradually.

Rule BP1 provides middle ground: agent self-dispatch acceptable for
bridge work meeting all 4 conditions, blocked for everything else.

### Example: Alpha mandatory startup acknowledgment

Reference: commit `910043af` (CLAUDE.md + AGENTS.md additions).

| BP1 Condition | Alpha satisfies? |
|---|---|
| 1 Low risk | YES — docs-only change to instruction files |
| 2 Reversible | YES — single revert restores prior CLAUDE.md/AGENTS.md |
| 3 Honest about limits | YES — text explicitly says "soft-accountability requirement only. It does not claim runtime auto-load, universal tool support, MCP availability, or hidden cross-agent memory transfer" |
| 4 Clear path forward | YES — `CVF_CROSS_AGENT_MEMORY_AND_AUTO_LOAD_ASSESSMENT_2026-05-26.md` (committed earlier) documents 4-step progression with Alpha as Step 1 |

All 4 conditions met. Pre-authorization acceptable.

### Counter-example: Speculative architecture commitment

Hypothetical: agent decides to build cvf-mcp-server scaffold without
operator authorization "because it's clearly needed eventually."

| BP1 Condition | Hypothetical satisfies? |
|---|---|
| 1 Low risk | NO — new runtime, server hosting, dependency on availability |
| 2 Reversible | NO — once deployed, agents start depending on it; rolling back affects integrations |
| 3 Honest about limits | Possibly — depends on documentation |
| 4 Clear path forward | Maybe — but path itself is speculation, not evidence-based |

Conditions 1 and 2 fail. Pre-authorization NOT acceptable. Requires
fresh GC-018.

### Anti-pattern relationships

Rule BP1 complements existing anti-patterns:

- AP4 (architectural commitment before evidence): violated by any
  pre-authorization that fails BP1 conditions 1, 2, or 4.
- AP3 (treating operator verdict as data needing interpretation):
  Rule BP1 does NOT override operator verdict on artifact already
  reviewed. BP1 applies only to NEW bridge implementations.
- Rule A4 (CVF process governs HOW; operator governs WHAT): bridge
  implementations under BP1 are HOW decisions (procedural mechanism).
  If implementation would change WHAT (product behavior, user-visible
  output, public claim), BP1 does not apply.

### Operator override

Operator may at any time:

- Add additional conditions to BP1 (e.g., for specific surfaces).
- Suspend BP1 entirely if pre-authorization pattern produces
  unintended drift.
- Retroactively reject a bridge implementation that satisfied BP1
  but operator no longer wants. Agent must revert and file fresh
  GC-018 for any replacement.

BP1 is a default permission, not an entitlement.

### Recording bridge implementations

When agent ships under BP1, commit message MUST include phrase
"bridge implementation per Rule BP1" so operator can identify and
review later.

Each bridge implementation MUST cite which clear-path-forward
document (Condition 4) it ships under.

---

## Part 7: Rules Catalog (Summary For Quick Reference)

| Rule | Statement |
|---|---|
| A1 | Operator IS the non-coder, not a proxy |
| A2 | Agent does not second-guess operator verdict via simulation |
| A3 | Agent fixes output, not interpretation of verdict |
| A4 | CVF process governs HOW; operator governs WHAT |
| SF1 | Identify exact surface before any review |
| SF2 | CVF can have multiple specs for multiple surfaces |
| SF3 | i18n coverage is per-surface, not global |
| SF4 | Validate i18n output has zero unintended-language leak |
| NC1 | Non-coder = "describes WHAT, agent decides HOW and EXECUTES" |
| NC2 | Spec generation paths must be transparent to non-coder |
| NC3 | Non-coder must not need to know which path was used |
| AP1 | Anti-pattern: persona walkthrough of unread artifact |
| AP2 | Anti-pattern: convergence on wrong target |
| AP3 | Anti-pattern: treating operator verdict as data needing interpretation |
| AP4 | Anti-pattern: architectural commitment before operator evidence |
| AP5 | Anti-pattern: convergence loop length as quality signal |
| BP1 | Bridge implementation pattern (agent pre-authorization acceptable if low risk + reversible + honest about limits + clear path forward documented) |

Cross-reference to Multi-Role Convergence Form Section 0 (Surface
Fidelity Gate) for enforcement at loop start.

Cross-reference to `CVF_CROSS_AGENT_MEMORY_PROGRESSION_ROADMAP_2026-05-26.md`
for canonical example of BP1 clear-path-forward documentation (Alpha
shipped under BP1 referencing this roadmap).

---

## Protocol / Contract / Requirements

This document establishes:

1. **Authority Protocol (Part 1, Rules A1-A4):** binding for all agents
   responding to operator verdict.

2. **Surface Fidelity Protocol (Part 2, Rules SF1-SF4):** binding for
   all agents reviewing any CVF artifact.

3. **Non-Coder Product Identity (Part 3, Rules NC1-NC3):** binding for
   all agents designing or modifying user-facing surfaces.

4. **Multi-Role Convergence augmentation (Part 4):** Multi-Role
   Orchestrated Convergence Capture Form must be amended to include
   Surface Fidelity Gate (Section 0) before any future use.

5. **Anti-patterns (Part 5):** all listed patterns are forbidden.
   Future occurrence requires explicit operator waiver in GC-018.

## Enforcement / Verification

Enforcement is by reference, not by automated guard:

- Future GC-018 packets touching operator-facing surfaces must cite
  this document as predecessor evidence.
- Convergence loops must execute Surface Fidelity Gate (Part 4) before
  Section 1.
- Code review must flag persona-walkthrough critique not backed by
  actual rendered output.
- Operator verdict on any output is authoritative and not subject to
  agent re-audit.

No automated test enforces these rules. Verification is operational:
each subsequent agent action that respects the rules is implicit
confirmation. Actions that violate rules without explicit operator
waiver are defects.

## Related Artifacts

Source conversations and artifacts:

- `cvf-spec-app_builder_complete-full.md` (web export, Vietnamese mode)
- `cvf-spec-app_builder_complete-full 2.md` (web export, English mode,
  mixed-language leak evidence)
- `docs/reviews/archive/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md`
- `docs/reviews/archive/CVF_VI5_T2_NONCODER_READABILITY_REVIEW_CLAUDE_TO_CODEX_2026-05-25.md`
  (Claude's persona walkthrough — example of AP1)
- `docs/reviews/archive/CVF_VI5_SPEC_STRUCTURE_3LAYER_PROPOSAL_CLAUDE_TO_CODEX_2026-05-25.md`
  (Claude's 3-layer envelope — example of AP4)
- `docs/reviews/archive/CVF_VI5_T3_CODEX_REBUTTAL_AND_SOLUTION_TO_CLAUDE_2026-05-25.md`
  (Codex correction packet — partially correct, but still wrong-target
  per AP2)
- `docs/reviews/CVF_VI5_T3_CLAUDE_ACCEPTANCE_OF_CODEX_SOLUTION_2026-05-26.md`
  (convergence "TERMINAL" on wrong target — example of AP5)

Predecessor concept document:

- `docs/concepts/archive/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`
  (4-layer architecture; this document extends with authority + surface
  fidelity protocols)

Companion templates:

- `docs/reference/archive/CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md`
  (user-to-agent conversation form)
- `docs/reference/archive/CVF_MULTI_ROLE_ORCHESTRATED_CONVERGENCE_CAPTURE_FORM_2026-05-25.md`
  (agent-internal convergence form — needs Section 0 augmentation per
  Part 4)

Web product surface:

- `vibcode.netlify.app/home` (live web UI)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` (web app source)

## Claim Boundary

This document does not claim:

- Implementation of any rule
- Automated enforcement of any rule
- Resolution of the VI5-T3 surface fidelity issue (open question Part 6)
- Web export i18n coverage gap fix (separate tranche required)
- Validator implementation for SF4
- Multi-Role Convergence Form amendment commit (separate update
  required)
- Hosted readiness
- Production readiness
- Public release readiness
- Freeze posture changes

The document records authority and surface fidelity protocols that all
future agents must respect. Each rule's implementation, enforcement,
or measurement requires its own GC-018 and work order.

Operator may reject, amend, or accept this document via the standard
review interface (ACCEPT / HOLD with specific objection / REJECT).
Default disposition pending operator review: PROPOSED_CANONICAL.
