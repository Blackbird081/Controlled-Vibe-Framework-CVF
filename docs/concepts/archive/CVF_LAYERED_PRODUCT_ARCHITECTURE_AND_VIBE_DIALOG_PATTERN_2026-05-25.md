# CVF Layered Product Architecture and Vibe Dialog Pattern

Memory class: ARCHITECTURE_DECISION_RECORD

docType: concept

Date: 2026-05-25

Status: CANONICAL_ARCHITECTURE_AND_META_PATTERN_RECORD

Authors:

- Operator (product direction, language layer insights, guided wizard
  philosophy, meta-pattern recognition)
- Claude Opus 4.7 (architecture synthesis, scope simplification, recording)

---

## Purpose

Capture the full architectural arc that emerged from a single operator-Claude
conversation on 2026-05-25 after the L1 multilingual spec-first mediation T1
closure. This document serves two distinct functions:

1. **For Codex and future agents:** explain WHY the VI5 roadmap scope was
   simplified across multiple iterations, so subsequent tranches inherit the
   correct architectural assumptions rather than reverting to earlier (more
   complex) designs.

2. **For CVF as a product:** formalize the discovery that the
   operator-Claude dialog itself IS the canonical Vibe-to-Spec workflow that
   CVF aims to deliver to non-coders. This means CVF should standardize the
   dialog shape as a reusable form, not just implement runtime support for it.

This is a concept document, not a roadmap or work order. It does not
authorize implementation.

## Scope / Target / Owner Boundary

Owner: CVF product architecture and conversational dialog protocol.

Boundary: this document records architectural decisions and a meta-pattern
discovery. It does not change runtime behavior, modify code, authorize
tranches, update public-sync, or shift any freeze posture.

## Source / Predecessor Evidence

Direct sources from the 2026-05-25 conversation:

- `docs/reviews/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md` (HOLD)
- `docs/roadmaps/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_ROADMAP_2026-05-25.md`
- `docs/reviews/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_T1_COMPLETION_2026-05-25.md`
- `docs/reference/CVF_NONCODER_SPEC_FIRST_WEB_FLOW_2026-05-25.md`
- `docs/roadmaps/CVF_VI5_LOCALIZED_NONCODER_READOUT_CONSOLIDATION_ROADMAP_2026-05-25.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/spec-first-mediation.ts`

Related operator philosophy memory:

- `memory/project_operator_absorption_philosophy_2026-05-24.md` (referenced in
  Claude's external context, captures earlier "READING != ABSORPTION" insight)

Inbound external validation:

- `.private_reference/legacy/CVF 25.05/Gop_y.md` (outside-view GAP analysis
  that correctly understood CVF after the public catalog sync)

---

## Part 1: The Architectural Arc (Why VI5 Scope Shrank)

This section explains the FOUR scope simplifications that happened in
sequence during the operator-Claude dialog. Each simplification was triggered
by an operator clarification that revealed a hidden assumption Claude was
carrying.

### Iteration 1 — Codex's Initial VI5 Design (15 localized fields)

**Codex's design:** A single `localizedNonCoderReadout.vi5.v1` field with 15
sub-fields, each requiring Vietnamese translation maintained alongside
implementation.

**Hidden assumption:** "Vietnamese non-coder UX = translate everything CVF
emits into Vietnamese."

**Why this felt right initially:** Real Non-Coder Usage Test HOLD result said
"Vietnamese users see mixed-language output and miss what to do next." The
obvious fix is to translate everything.

**Why this was wrong:** It treats CVF as a translation product. F-1
diminishing returns lesson (recorded 2026-05-15) was implicitly being
violated.

### Iteration 2 — Claude's First Refinement (Phase-aware design)

**Claude proposed:** Two readouts (VibePhaseReadout + SpecHandoffReadout)
with ~10 fields total. Group localized strings by user journey phase.

**Hidden assumption removed:** "All fields are flat and equal."

**New hidden assumption:** "We still own translating field labels."

**Why this was better:** Recognized that Spec freeze is a state transition,
not just a data point. UI affordances differ before vs after freeze.

**Why this was still incomplete:** Still bundling Vietnamese asset strings
inside the readout payload, instead of leveraging standard i18n.

### Iteration 3 — Operator's First Clarification (Language phase transition)

**Operator stated:**

> "Non coder - dùng promt input tiếng việt... Trong quá trình tinh chỉnh vẫn
> viết tiếng việt → đây là Vibe code; nhưng đã chốt final Spec là tiếng Anh
> vì để Agent đọc và thi công."

**What this revealed:** Mixed-language output observed in L1 sample was NOT
a design problem to fix. It was the natural transition between language
phases:

| Phase | Language | Reason |
| --- | --- | --- |
| Vibe iteration | Vietnamese | User thinks freely |
| Spec freeze | English | Agent reads precisely |
| Output review | Vietnamese (probably) | User judges result |

**Scope impact:** VI5 doesn't need to "fix" the language mix. It needs to
make the transition explicit and safe. The English-only Spec is a feature.

### Iteration 4 — Operator's Second Clarification (i18n for UI shell)

**Operator stated:**

> "Tất cả các mục cố định trên UI, chúng ta xử lý bằng i18n, giao diện chuyển
> đổi qua lại, ai thích dùng gì thì dùng, vừa đẹp vừa chuyên nghiệp."

**What this revealed:** UI labels (buttons, headings, menu items) are i18n's
job, not VI5's job. This is industry standard for any modern web product.
VI5 was incorrectly trying to own UI localization in addition to language
state.

**Scope impact:** VI5 only needs to emit language CODES (vi/en) and i18n key
references on the response payload. The UI team owns translation files. VI5
does not bundle Vietnamese strings.

Also revealed: a Vietnamese person might choose to input in English. Language
detection is per-request, not session-wide. CVF should not force Vietnamese
on Vietnamese users.

### Iteration 5 — Operator's Third Clarification (Engine room invariant)

**Operator stated:**

> "Tương tự, các workflow chạy ngầm cũng nên là tiếng anh toàn bộ. vì đó là
> việc của agent/LLM."

**What this revealed:** A FOURTH layer exists that previous iterations
ignored. Backend workflow logic, governance receipts, audit traces, internal
state — all should be English always. User never sees raw internal. They see
CURATED presentation strings sourced from per-workflow catalog files
(en.json / vi.json).

**Scope impact:** Workflow logic is English-only. VI5 does not translate any
workflow internals at runtime. Vietnamese strings shown to user inside guided
steps come from pre-built catalog files versioned with the workflow.

Also revealed: a Guided Wizard pattern, not a free-form chat pattern. Users
pick from bounded options. Free-form is fallback ("Khác"), not primary path.

### Iteration 6 — Operator's Fourth Clarification (Meta-pattern recognition)

**Operator stated:**

> "Tôi vừa phát hiện, đây cũng là 1 kiểu trao đổi của non coder với agent/llm
> trước khi ra final spec. Tại sao không chuẩn hóa luôn? có form chuẩn đúng
> kiểu CVF"

**What this revealed:** This entire operator-Claude conversation IS the
Vibe-to-Spec workflow that CVF aims to deliver. Operator is the
"non-coder" (in the sense of: person with product intent who is not
implementing). Claude is the "agent". The conversation iteratively refined
intent until a frozen Spec emerged.

**Scope impact (meta-level):** CVF should standardize this dialog shape as a
reusable conversation form, not just implement runtime support for one
instance of it.

---

## Part 2: The 4-Layer Product Architecture (Canonical)

The four iterations converged on a layered architecture where each layer has
an independent language rule. This is now CVF's canonical product
architecture:

```text
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: UI SHELL                                       │
│ Language: i18n EN/VI toggle (user-selected, global)     │
│ Owner: UI team / standard i18n library                  │
│ Examples: buttons, menu labels, page titles             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 2: GUIDED WIZARD                              │ │
│ │ Language: per-workflow presentation catalog         │ │
│ │ Owner: workflow author (en.json + vi.json per pack) │ │
│ │ Examples: step questions, option labels             │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ LAYER 3: USER CHAT + AGENT RESPONSE             │ │ │
│ │ │ Language: user picks per message, agent echoes  │ │ │
│ │ │ Owner: user freedom; provider response matching │ │ │
│ │ │ Examples: vibe input, agent clarification reply │ │ │
│ │ │ ┌─────────────────────────────────────────────┐ │ │ │
│ │ │ │ LAYER 4: ENGINE ROOM (Spec + Workflow + ... │ │ │ │
│ │ │ │ Language: ALWAYS English (invariant)        │ │ │ │
│ │ │ │ Owner: CVF runtime                          │ │ │ │
│ │ │ │ Examples: Spec contract, workflow state,    │ │ │ │
│ │ │ │ governance receipt, audit trace, agent      │ │ │ │
│ │ │ │ execution payload                           │ │ │ │
│ │ │ └─────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Layer invariants:**

| Layer | Language rule | Authority |
| --- | --- | --- |
| 1 UI Shell | i18n catalog, user toggle | UI team |
| 2 Guided Wizard | per-workflow catalog (en.json/vi.json) | workflow author |
| 3 User chat + agent response | user picks, provider echoes | user/provider |
| 4 Engine room | English only, no exceptions | CVF runtime |

**Why this matters:**

- No language drift in agent execution (Layer 4 stable)
- No translation maintenance burden for runtime (Layers 4 and 1 use catalogs)
- User freedom preserved (Layer 3)
- Professional global UX (Layer 1)
- Future languages add linearly (add new catalog files, no code change)

---

## Part 3: The Guided Wizard Product Identity

CVF is a **Guided Wizard** product, not a **Free-form Chat** product:

| Dimension | Free-form Chat (ChatGPT-style) | Guided Wizard (CVF) |
| --- | --- | --- |
| User burden | High — must write clear prompts | Low — choose from options |
| Drift risk | High — user goes off-topic | Low — options bound scope |
| Output quality | Variable (depends on prompt skill) | Stable (input is structured) |
| Time to result | Long (multiple corrections) | Short (sequential clarifications) |
| Trust signal | Implicit (must trust output) | Explicit (saw each choice) |
| Non-coder fit | Poor (assumes prompt-writing) | Good (feels like form) |
| Localization | Hard (translate prose) | Easy (catalog of options) |

**Operator's stated rationale:**

> "Làm sao để đọc đúng ý nghĩa của tiếng việt ở data input do user nhập vào,
> từ đó gợi ý cho họ chọn các option do CVF hướng dẫn qua từng bước, đưa ra
> nhiều option cho user lựa chọn, hạn chế user viết → nhanh, và chuẩn, hạn
> chế user lan man lạc đề tốn time correct lại thông tin"

**Implementation implications:**

- Each workflow ships with step definitions, not raw prompt templates
- Each step presents bounded options (typically 3-5), with optional
  freeform fallback ("Khác (mô tả ngắn)")
- Free-form text is a last resort, not the primary input mode
- Each user choice maps to a structured Spec field, not loose prose
- Spec is constructed cumulatively step-by-step, not parsed from a long
  prompt at the end

---

## Part 4: The Vibe-to-Spec Conversation Pattern (Meta-Pattern)

The operator-Claude dialog on 2026-05-25 demonstrated the canonical
Vibe-to-Spec conversation shape. This shape repeats every time a non-coder
brings intent to CVF and walks away with a frozen Spec.

### Observed phases in the operator-Claude dialog

| Phase | Operator action | Claude action |
| --- | --- | --- |
| 1. Initial vague intent | "Đánh giá codex vừa làm xong" | Read + evaluate |
| 2. Surface artifact | Show Codex's VI5 roadmap | Frame analysis |
| 3. Claude proposes | Suggest 4 improvements | Wait for feedback |
| 4. Operator clarifies #1 | "Đề xuất 1 không cần" + state language phase model | Internalize |
| 5. Claude refines | Phase-aware redesign | Wait |
| 6. Operator clarifies #2 | "i18n cho UI" | Internalize |
| 7. Claude refines | i18n-aware redesign | Wait |
| 8. Operator clarifies #3 | "Workflow ngầm là EN + guided wizard" | Internalize |
| 9. Claude refines | 4-layer redesign + Guided Wizard identity | Wait |
| 10. Operator clarifies #4 (meta) | "Đây là vibe-to-spec, chuẩn hóa luôn?" | Recognize meta |
| 11. Frozen Spec | This document | Filed |

### Generalized Vibe-to-Spec phases

For ANY non-coder + CVF agent conversation:

```text
Phase 0: User has intent (often vague, often in native language)
   ↓
Phase 1: User surfaces intent (chat, template choice, or artifact reference)
   ↓
Phase 2: Agent presents understanding + bounded options
   ↓
Phase 3: User clarifies or selects (often reveals hidden assumptions)
   ↓
Phase 4: Agent refines understanding (Spec draft updates)
   ↓
[Loop Phase 2-4 until user signals ready to freeze]
   ↓
Phase 5: Agent presents draft Spec for user approval
   ↓
Phase 6: User approves or requests final edits
   ↓
Phase 7: Spec frozen (English, immutable, agent control point)
   ↓
Phase 8: Agent executes from Spec; user reviews output (in user language)
```

### Key properties of a Vibe-to-Spec conversation

1. **User leads intent, agent leads structure.** User says what they want;
   agent enforces that it gets captured cleanly.
2. **Each clarification reveals a hidden assumption.** Agent should
   recognize this and update internal model, not just patch surface text.
3. **Free-form is fallback, options are primary.** Agent presents bounded
   choices; freeform input ("Khác") only when options miss.
4. **Spec is the freeze contract, not the running transcript.** Conversation
   can drift; Spec must not.
5. **Conversation can take many iterations.** No fixed step count. Quality
   is signaled by user satisfaction, not by reaching step N.
6. **Output language matches input language; Spec language is always EN.**
   No exceptions.

---

## Part 5: Final VI5 Scope (Frozen After Iteration 5)

After 5 simplifications, VI5 scope is:

### Required response fields

**`languageState`** (5 sub-fields):

- `userInputLanguage` (detected per request: vi/en/auto)
- `userFacingResponseLanguage` (matches userInputLanguage)
- `engineRoomLanguage` (always "en", invariant)
- `specContractLanguage` (always "en" — CVF intent declaration; not an
  enforcement claim on existing Spec body content)
- `uiLayerLanguage` (from i18n session, exposed not owned)

Note (added per Multi-Role Convergence Correction 2026-05-25): the earlier
draft of this Part listed `specLanguage` as an invariant claim. That was
premature because VI5-T0 baseline audit had not yet verified whether
L1 T1's `normalizedExecutionSpec` body is empirically English. The corrected
structure separates intent (`specContractLanguage`), observed state
(`specBoundary.observedSpecBodyLanguage`), and enforcement
(`specBoundary.englishFreezeEnforced`). VI5-T1 reports state; VI5-T2 Spec
English Freeze enforces it. See acceptance packet
`docs/reviews/CVF_VI5_MULTI_ROLE_CONVERGENCE_CLAUDE_ACCEPTANCE_2026-05-25.md`.

**`guidedStepState`** (7 sub-fields):
- `currentStep` (numbered identifier)
- `totalSteps` (optional, when estimable)
- `stepIntent` (machine-readable purpose, EN)
- `presentedQuestion` (text in userInputLanguage)
- `presentedOptions` (array: optionId/optionLabel/optionDescription)
- `allowFreeformAlternative` (boolean)
- `userMustChoose` (boolean, vs multi-select or skip)

**`specBoundary`** (6 sub-fields per Multi-Role Convergence correction):

- `frozen` (boolean)
- `specBlockLanguage` (always "en" — intent declaration for new Spec
  emission, not retroactive claim)
- `observedSpecBodyLanguage` ("en" | "vi" | "mixed" | "unknown" —
  empirical result from VI5-T0 baseline audit of L1 T1 output)
- `englishFreezeEnforced` (false in VI5-T1; true only after VI5-T2 Spec
  English Freeze ships)
- `frozenAt` (ISO timestamp)
- `editAfterFreezeWarning` (boolean)

### Required workflow asset

Per workflow that supports non-coder guided mode:

```text
governance/workflows/<workflow_id>/presentation/
  en.json   # English presentation strings (default, agent-readable)
  vi.json   # Vietnamese presentation strings
```

### Estimated implementation size

- ~150-200 lines for VI5 readout module
- ~40-80 lines per workflow presentation catalog
- VI5-T1 ships with Strategy pack catalog (1 pack proof)
- Post-VI5 tranche scales to remaining packs

### What VI5 does NOT do

- Does not localize UI labels (i18n's job)
- Does not translate Spec content (Spec stays EN)
- Does not translate workflow internals at runtime
- Does not bundle Vietnamese workflow strings (catalog is per-workflow)
- Does not support free-form chat as primary input mode
- Does not translate governance receipts or audit traces
- Does not change provider/adapter/route behavior

---

## Part 6: Proposed Standardization of Vibe-to-Spec Conversation Form

This is the new direction emerging from operator's meta-pattern recognition
in iteration 6.

**Proposition:** CVF should ship a canonical conversation form template
that captures the Vibe-to-Spec dialog structure. This serves multiple
audiences:

1. **Non-coder users (runtime):** structures their conversation with CVF
   agent to reach frozen Spec efficiently
2. **Workflow authors (design time):** template for designing new workflow
   step sequences
3. **CVF internal sessions (this document is an instance):** standardizes
   how operator-agent design conversations are captured for posterity
4. **External feedback channels:** structured form for outside-view
   feedback (similar to Gop_y.md pattern)

**Proposed template artifact:** see companion file
`docs/reference/CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md`
(to be created).

This document does not authorize building runtime support for the form. It
records that the form template is the next architectural artifact worth
creating.

### Companion Pattern: Multi-Role Orchestrated Convergence

The Vibe-to-Spec form governs non-coder-to-agent intent refinement. It is not
the full protocol for agent-internal audit, rebuttal, role assignment,
delegation, and convergence.

For internal CVF work where an operator/CEO intent is decomposed by an
orchestrator across multiple roles, agents, or bounded subagents, use the
companion template:

`docs/reference/CVF_MULTI_ROLE_ORCHESTRATED_CONVERGENCE_CAPTURE_FORM_2026-05-25.md`

This companion form generalizes two-agent rebuttal into N-role convergence:

```text
Operator / CEO intent
  -> Orchestrator assigns bounded role lanes
  -> Workers, reviewers, auditors, and specialists produce independent outputs
  -> Integrator records accepted, rejected, deferred, and unresolved findings
  -> Operator receives the final delivery packet
```

This is a governed operating protocol, not a claim that CVF currently has a
live autonomous subagent scheduler or runtime worker isolation.

---

## Part 7: Implications for Codex on Future Tranches

Codex should read this document before working on any tranche that touches:

- multilingual / i18n behavior
- user-facing readout formatting
- workflow presentation
- chat / dialog flow
- Spec generation or freeze
- non-coder UX

### Anti-patterns Codex should avoid

Each iteration in Part 1 captured an anti-pattern. Codex should not revert
to any of these:

1. **Don't bundle Vietnamese strings in runtime readout payloads.** Use
   catalog files (en.json/vi.json) versioned with workflows. Reference by
   key.
2. **Don't translate workflow internals.** Engine room stays English.
3. **Don't try to localize the Spec itself.** Spec is agent contract,
   English only.
4. **Don't assume free-form chat as primary input.** Guided options first,
   freeform fallback.
5. **Don't force user input language.** Vietnamese users may write English
   by choice.
6. **Don't conflate UI labels with workflow presentation.** i18n owns UI
   labels; workflow catalog owns step presentation.

### When in doubt

If a scope feels like it's growing to translate more things, check this
document's Part 1 history. The same simplification probably applies.

If a scope feels like it's reinventing i18n, stop. Use standard i18n.

If a scope feels like it's making the Spec localized, stop. Spec is English.

---

## Part 8: Implications for the Real Non-Coder Usage Test

The original test was BLOCKED on language mediation. After VI5 implementation:

- Backend workflow runs English (correct, no change)
- Spec freezes English (correct, no change)
- User-facing readout uses presentation catalog (per workflow language)
- UI labels use i18n toggle (independent of test)
- Real noncoder test redo should use Vietnamese input + verify guided
  options appear in Vietnamese + verify Spec block is English + verify
  output language matches input

The test PASS criteria become more concrete after the 4-layer architecture
is in place. Operator no longer needs to evaluate "is this Vietnamese
enough" subjectively. Test becomes: "can the user pick options without
needing to read raw English from layer 4?"

---

## Part 9: Cross-Reference to Inbound External Feedback

`Gop_y.md` (CVF 25.05) identified 9 GAPs. The architecture clarified here
implicitly addresses some of them:

| Gop_y GAP | This document addresses |
| --- | --- |
| GAP 1 (Agent Reading Protocol) | Part 7 "When in doubt" rules are partial agent protocol |
| GAP 2 (Outcome Pack Taxonomy) | Part 5 "presentation catalog per workflow" structure |
| GAP 4 (Memory continuity L0-L3) | Out of scope here; remains pending |
| GAP 5 (Operations Cockpit) | Part 3 "trust signal" implicit; cockpit pending |
| GAP 6 (External Capability Admission) | Out of scope here; ES1/C7B/C7C cover skills |

This is not a substitute for handling those GAPs in their own tranches.

---

## Decision / Recommendation / Disposition

**Decisions recorded:**

1. CVF's canonical product architecture is the 4-layer model (Part 2).
2. CVF's product identity is Guided Wizard, not Free-form Chat (Part 3).
3. VI5 final scope is the 3-field design (Part 5), with Spec language
   handled as three empirical fields (`specContractLanguage` /
   `observedSpecBodyLanguage` / `englishFreezeEnforced`) rather than a
   single premature invariant claim.
4. The Vibe-to-Spec conversation pattern is the canonical dialog shape
   for non-coder + CVF agent interaction (Part 4).
5. The dialog shape should be standardized as a form template (Part 6).
6. The agent-internal companion pattern is **Multi-Role Orchestrated
   Convergence**, not a "two-agent" pattern. Canonical template:
   `docs/reference/CVF_MULTI_ROLE_ORCHESTRATED_CONVERGENCE_CAPTURE_FORM_2026-05-25.md`.
   This supports two agents as a special case but generalizes to N roles
   (orchestrator, planner, workers, reviewers, auditors, integrator,
   specialist subagents) per CVF's existing role architecture.

**Recommendations for next steps (in priority order):**

1. **Update VI5 roadmap** to reflect the frozen Part 5 scope (replaces 15
   fields with 3 fields; adds presentation catalog requirement).
2. **Create the Vibe-to-Spec Conversation Capture Form template** as a
   companion reference document (Part 6).
3. **Dispatch VI5-T1** with Strategy pack presentation catalog only.
4. **Run Real Non-Coder Usage Test redo** after VI5-T1 with Vietnamese
   input.
5. **Scale presentation catalogs** to remaining 9 packs (separate tranche).
6. **Set up i18n** for UI shell (parallel-eligible with above).
7. **Address Gop_y GAPs** in priority order after VI5/i18n stable.

**Disposition:** architecture decision recorded. No implementation
authorized by this document. Each numbered recommendation requires its own
fresh GC-018 and work order before implementation.

---

## Protocol / Contract / Requirements

This document is an Architecture Decision Record (ADR) and meta-pattern
record. It establishes the following contracts for any subsequent tranche:

- The 4-layer language architecture (Part 2) is non-negotiable. Any tranche
  that would blur layer boundaries (e.g., translate Layer 4 internals, or
  bundle Layer 1 strings into Layer 2 payloads) must first amend or
  supersede this document.
- The Guided Wizard product identity (Part 3) governs UX decisions. Any
  tranche that would default to free-form chat as primary input mode must
  first amend or supersede this document.
- The frozen VI5 scope (Part 5) is the authoritative scope for VI5
  implementation. Any expansion requires a new GC-018 explicitly referencing
  this section.
- The 6 anti-patterns (Part 7) are binding for all future tranches that
  touch multilingual, i18n, workflow presentation, dialog flow, or Spec
  generation.

## Enforcement / Verification

Enforcement is by reference, not by automated guard:

- Future tranche GC-018 packets that touch the scopes listed in Part 7
  must cite this document as predecessor evidence and explicitly state
  whether they preserve or amend the architecture.
- Code reviewers should flag any PR that bundles language assets into
  runtime payloads, translates Layer 4 internals, or makes Spec
  multilingual.
- Operator-Claude or operator-Codex design conversations should follow
  the form template (companion document) and may cite this document as
  the canonical worked example.

Verification: this document does not require automated test. Verification
is operational — each subsequent tranche that respects the architecture
is implicit confirmation. A tranche that violates the architecture without
amendment is a defect.

## Related Artifacts

Direct predecessors (within the same conversation):

- `docs/reviews/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md`
- `docs/roadmaps/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_ROADMAP_2026-05-25.md`
- `docs/reviews/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_T1_COMPLETION_2026-05-25.md`
- `docs/reference/CVF_NONCODER_SPEC_FIRST_WEB_FLOW_2026-05-25.md`
- `docs/roadmaps/CVF_VI5_LOCALIZED_NONCODER_READOUT_CONSOLIDATION_ROADMAP_2026-05-25.md`

Companion artifact:

- `docs/reference/CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md`

Implementation reference:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/spec-first-mediation.ts`

Operator philosophy memory:

- `memory/project_operator_absorption_philosophy_2026-05-24.md`

Inbound external validation:

- `.private_reference/legacy/CVF 25.05/Gop_y.md`
- `.private_reference/legacy/CVF 25.05/CLAUDE_REVIEW_OF_GOP_Y_2026-05-25.md`

Standards referenced:

- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/archive/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`
- F-1 Diminishing Returns Stop Rule (referenced in AGENTS.md)

## Claim Boundary

This document records architectural decisions and a meta-pattern discovery
from a single 2026-05-25 operator-Claude conversation. It does not claim:

- implemented VI5 runtime behavior;
- implemented Vibe-to-Spec form runtime support;
- multilingual translation quality;
- presentation catalog implementation;
- Real Non-Coder Usage Test PASS;
- hosted readiness;
- production readiness;
- public release readiness;
- broad agent-control completeness;
- freeze posture changes.

The document's purpose is to preserve the reasoning chain so future tranches
inherit the correct architectural assumptions rather than rediscovering them
under time pressure.
