<!-- Memory class: SUMMARY_RECORD -->

# CVF W122-T1 Noncoder Intent Orchestration And Starter Path Unification Roadmap

> Date: 2026-04-26
> Status: IMPLEMENTATION-COMPLETE / CLOSURE-READY — All 9 verification gates PASS including live E2E (Alibaba) and release gate bundle (see §5.1)
> Revision: r4 (§5.1 live verification status table added; §8.A7 weak-fallback semantic locked; implementation timestamps added 2026-04-27)
> Scope class: NONCODER ACTIVATION / PRODUCTIZATION / FRONT-DOOR ORCHESTRATION
> Predecessor: W119-T1 CLOSED DELIVERED 2026-04-23; W121-T1 CLOSED DELIVERED 2026-04-26; template quality canonicalization CLOSED DELIVERED 2026-04-26
> Authorization: GC-018 issued `docs/baselines/CVF_GC018_W122_T1_NONCODER_INTENT_ORCHESTRATION_AND_STARTER_PATH_UNIFICATION_AUTHORIZATION_2026-04-27.md`
> Implementation date: 2026-04-27 (CP0–CP6 code and tests delivered; live E2E + release gate pending)
> Wave ID: W122

---

## 0. Why This Is Next

CVF has already crossed the quality and evidence threshold on three critical
layers:

- non-coder governed workflow proof exists on the active Web `/api/execute` path
- public skill/template surfaces are now gated to trusted, agent-ready subsets
- template contracts are now canonicalized and enforced by regression gates

The current bottleneck is no longer corpus quality. It is activation quality.

Today, a non-coder can succeed in CVF, but the entry path is still fragmented:

- template gallery on Home
- quick-try cards
- QuickStart / onboarding flows
- starter handoff state
- Skill Planner on the separate search surface
- skill detail pages with linked guided forms

These surfaces are individually useful, but together they still ask the user to
understand too much of CVF's internal catalog shape.

The next high-value move is to make the front door intent-first:

> A non-coder states what they need in plain language, and CVF routes them into
> the right governed starter path without forcing manual skill/template
> selection first.

---

## 0.5 Reviewer Pushback Integrated — Old vs New (For Codex Alignment)

This section is a **historical change log for revision r2**. Twelve
substantive critiques from the r1 review were integrated here before the later
r3 cleanup.

**Interpretation rule for implementers:** if any wording in §0.5 conflicts with
§0.6 or the operative contract in §4–§6, **r3 / operative sections win**.

Codex MUST acknowledge each old/new pair before starting CP0. Each change is
paired with the surface it affects so it is verifiable.

### Δ1 — Three parallel routing surfaces, not one missing surface

- **OLD (§2 r1):** "useful existing building blocks already exist: ... Skill Planner ..."
- **NEW (§2 r2):** Explicit acknowledgement that
  [intent-detector.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-detector.ts)
  (210 lines), [skill-planner.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-planner.ts)
  (299 lines), and [governed-starter-path.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts)
  (96 lines) are three parallel routing surfaces with overlapping logic. The
  fragmentation is at the library layer, not only at the UI layer.
- **Why:** CP2 cannot "define a routing contract" without first naming which of
  the three becomes source-of-truth and which become adapters or are deprecated.

### Δ2 — Trusted public subset for routing is hard-defined

- **OLD (§4 CP2 r1):** "router must select only from the trusted public subset"
  (subset undefined; readers may assume 51 = 9 wizards + 42 forms).
- **NEW (CP1 r2):** The W122 trusted routing target is the **wizard family
  (9 entries)** mapped in
  [governed-starter-path.ts:24-34](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts#L24-L34).
  Expansion to form templates (≤42) is explicitly out of scope and deferred to
  a follow-up wave.
- **Why:** Prevents §1 product claim from over-promising; aligns router with
  existing trusted handoff map.

### Δ3 — CP1 and CP2 merged; new CP0 added

- **OLD (§4 r1):** CP1 = surface lock; CP2 = routing contract; CP3 = unification.
- **NEW (§4 r2):** **CP0** = pre-flight + contract decisions (file-of-truth,
  trusted subset, GC-023 pre-flight, feature flag scaffold). **CP1** = router
  contract **and** canonical surface chosen together. CP2..CP6 keep numbering
  but tightened.
- **Why:** Picking a canonical front door without first knowing what routing
  logic it must host inverts the dependency. Reviewer recommended merge.

### Δ4 — Routing source-of-truth file declared

- **OLD:** Implicit; CP2 listed three "likely surfaces" without picking one.
- **NEW (CP0 + CP1):** A new
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-router.ts` is the
  facade and source of truth. `intent-detector.ts` becomes its phase/risk
  classifier dependency. `governed-starter-path.ts` becomes its handoff
  serializer dependency. `skill-planner.ts` is **wrapped** (kept for the
  browse-side Skill Planner UI) — no behavior change in this wave.
- **Why:** Eliminates "three parallel routers" and gives CP3 a single contract
  to converge on.

### Δ5 — CP4 demotion is reframed (not a walk-back of W121)

- **OLD (§4 CP4 r1):** "Skill Library Repositioning" — read as demotion of work
  just shipped in W121.
- **NEW (CP4 r2):** Explicit framing — W121 made the catalog **trustworthy**;
  W122 makes it **non-mandatory at first touch**. Two distinct claims, not a
  reversal.
- **Why:** Auditor-readable rationale; preserves W121 evidence integrity.

### Δ6 — CP5 evidence continuity is now testable

- **OLD (§4 CP5 r1):** "no loss of `templateId`, approval, or evidence receipt
  continuity" — descriptive, not assertable.
- **NEW (CP5 r2):** Concrete assertion — for the same `userInput`, an
  intent-routed run and a direct template-driven run MUST produce evidence
  receipts with identical
  `{templateId, phase, riskLevel, approvalState, knowledgeReceiptId?}`
  fields. Diff = empty set.
- **Why:** Gives CP5 a real close gate.

### Δ7 — CP6 evidence runner mode is committed

- **OLD (§4 CP6 r1):** "time-to-first-action / friction notes" — subjective.
- **NEW (§8.A6 r2):** Runner mode pre-decided by audit evidence: Playwright
  live (`tests/e2e/intent-first-flow.live.spec.ts`) + one trace field
  `intentRoutedAt`. Screenshots-only path explicitly rejected. (See §8.A6.)
- **Why:** Avoids descriptive-only evidence; aligns with live-call governance
  rule.

### Δ8 — Verification block names every test file up-front

- **OLD (§5 r1):** Placeholder `<targeted W122 tests>`.
- **NEW (§5 r2):** Required test files enumerated:
  `intent-router.test.ts` (snapshot matrix + weak-confidence fallback),
  `governed-starter-path.test.ts` (extended for low-confidence),
  `intent-router-evidence-parity.test.ts` (CP5 assertion),
  one Playwright E2E: `tests/e2e/intent-first-flow.live.spec.ts` (live provider call).
- **Why:** Prevents the wave from closing on UI-only mock assertions.

### Δ9 — GC-023 pre-flight on Home explicitly included

- **OLD:** Not mentioned; [home/page.tsx](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/page.tsx)
  is 817 lines and not in
  [exception registry](governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json).
- **NEW (CP0 r2):** Pre-flight step: confirm `home/page.tsx` line budget. If
  CP3 needs to add intent-first UI, extract `IntentEntry.tsx` as a sibling
  component instead of appending to Home.
- **Why:** Pre-commit hook will block otherwise; prevents mid-CP3 surprise.

### Δ10 — Feature flag and rollback plan declared

- **OLD:** Not present.
- **NEW (CP0 + §6 r2):** Unified front door lives behind a settings flag
  (`CVF_INTENT_FIRST_FRONT_DOOR=true|false`, default false during build,
  default true only after CP6 evidence pack closes). Rollback = flip flag, no
  code revert needed.
- **Why:** UX repositioning has higher regression blast radius; safe rollback
  is required for a non-coder-facing wave.

### Δ11 — i18n contract written into the router

- **OLD:** Not specified; existing surfaces are bilingual but not contractually.
- **NEW (CP1 r2):** Router MUST accept VN + EN inputs from day one. Any other
  language MUST trigger weak-confidence fallback (clarification or browse), not
  a guessed route.
- **Why:** Existing intent-detector regex is already bilingual; codifying it
  prevents accidental EN-only regression.

### Δ12 — Onboarding surfaces are named, not paraphrased

- **OLD (CP1 r1):** "onboarding wizard / onboarding tour" listed without paths.
- **NEW (CP0 r2):** CP0 produces an inventory file
  `docs/reviews/W122_ENTRY_SURFACE_INVENTORY.md` listing exact path + line range
  for every entry surface before CP1 classifies them.
- **Why:** Avoids classifying surfaces by name only; auditor needs file refs.

---

## 0.6 Codex Contract Corrections — r3

Three implementation-contract corrections are added in r3 so W122 does not
encode the wrong Web/runtime assumptions before GC-018 opens.

### C1 — Router namespace split is explicit

- `starterKey` = the suggestion namespace used by
  `STARTER_TEMPLATE_MAP` keys (example: `app-builder`)
- `recommendedTemplateId` = the resolved wizard template id value used by Home
  / starter handoff / execution launch (example: `app_builder_wizard`)

W122 MUST not use one `templateId` label to mean both namespaces.

### C2 — Frontend feature flag contract is client-visible by default

The default W122 feature flag contract is
`NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true|false`.

If the owner later wants a server-backed runtime flag, that is a separate
implementation choice and must be documented explicitly instead of silently
reusing the client toggle name.

### C3 — Evidence parity uses a declared parity object, not the raw receipt

Current `GovernanceEvidenceReceipt` does not expose every field named in r2.
Therefore CP4/CP5 MUST compare a declared parity object that may combine:

- receipt-native fields from `governanceEvidenceReceipt`
- routed execution metadata already known outside the receipt
- optional trace metadata such as `intentRoutedAt`

W122 does not require mutating `GovernanceEvidenceReceipt` unless that is an
intentional implementation choice.

---

## 1. Product Claim Target

W122 should make this bounded claim true:

> A non-coder can begin from one canonical front door, describe intent in plain
> language (VN or EN), receive a recommended **wizard-family** governed starter
> path, and continue into the existing trusted execution flow with visible
> rationale and evidence continuity equal to direct template-driven runs.

This is bounded to:

- the wizard-family subset (9 starter wizards) of the public trusted catalog
- the existing governed Web execution path
- current provider-readiness and evidence boundaries
- recommendation and orchestration, not autonomous unrestricted planning

Form-template routing (≤42) is explicitly **out of scope** for W122.

---

## 2. Current State Readout

As of the current repo state:

- public Web catalog is reduced to `27` public, agent-ready skills
- template registry is `53` objects total with `42` runnable form templates and `9` wizards
- form-template mapping coverage is complete and public linked templates are fully trusted
- targeted template/front-door regression gate passes `45/45`

Useful existing building blocks already exist, but they are fragmented at **two
layers**, not one:

**UI layer surfaces:**

- [home/page.tsx](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/page.tsx) template gallery + quick-try path (817 lines)
- [QuickStart.tsx](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/QuickStart.tsx) (267 lines)
- [SkillPlanner.tsx](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SkillPlanner.tsx) (291 lines)
- [TemplateSuggester.tsx](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/TemplateSuggester.tsx) (95 lines)
- linked guided forms from skill detail pages

**Library layer (three parallel routing surfaces — Δ1):**

- [intent-detector.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-detector.ts) — phase/risk/suggestedTemplates classifier (210 lines)
- [skill-planner.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-planner.ts) — independent skill plan generator (299 lines)
- [governed-starter-path.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts) — wizard handoff serializer (96 lines)

The gap is not missing infrastructure. The gap is that the library-layer
fragmentation propagates upward into incoherent first-run UX.

---

## 3. Non-Goals

- No broad skill-corpus expansion
- No reopening template-quality canonicalization as an active tranche
- No full architecture reopen
- No provider-parity claim expansion
- No free-form planner authority that bypasses trusted template contracts
- No regression to non-trusted public surfaces
- No raw-key handling changes beyond existing readiness/evidence boundaries
- **No expansion of the trusted routing subset beyond the 9 wizards (Δ2)**
- **No removal of `skill-planner.ts` or its UI in this wave (Δ4)**

---

## 4. Checkpoints

### CP0 — Pre-flight & Contract Decisions (NEW — Δ3, Δ9, Δ10, Δ12)

**Deliver**

Before any router or UI work begins, produce a single pre-flight artifact
covering:

1. **Entry surface inventory** — `docs/reviews/W122_ENTRY_SURFACE_INVENTORY.md`
   with path + line range + current first-run role for each existing entry
   surface (Home, QuickStart, SkillPlanner, TemplateSuggester, skill detail,
   onboarding components — exact files to be discovered, not paraphrased).
2. **GC-023 pre-flight** — confirm or register exception for any file that
   CP1–CP4 will modify, especially `home/page.tsx` (currently 817 lines).
   Decision: extend Home OR extract `IntentEntry.tsx`. Output recorded in the
   pre-flight artifact.
3. **Feature flag scaffold** —
   `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` wired through to the canonical
   surface (default `false` during build).
4. **Source-of-truth declaration** — confirm new file
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-router.ts` is
   the routing facade. `intent-detector.ts` and `governed-starter-path.ts`
   become its dependencies. `skill-planner.ts` is wrapped (no behavior change).

**Acceptance**

- pre-flight artifact merged before CP1 starts
- feature flag toggleable end-to-end (off path = current behavior unchanged)
- GC-023 pre-commit hook passes locally on a no-op router-file commit

### CP1 — Router Contract v1 + Canonical Front-Door Surface (MERGED — Δ3, Δ4, Δ11)

**Deliver**

Define **and** implement the bounded routing contract in
`intent-router.ts`, and at the same time declare which UI surface hosts it as
the canonical first-run front door. The two decisions are merged because
neither is meaningful without the other.

The router takes plain-language user intent (VN or EN) and returns:

- `starterKey` from the wizard-family subset (9 entries)
- resolved `recommendedTemplateId` from that `starterKey`
- routing rationale in plain language
- friendly phase/risk framing
- `confidence` score
- explicit `fallback` path when confidence is weak

Hard contract rules:

- router output `starterKey` MUST exist in
  [governed-starter-path.ts STARTER_TEMPLATE_MAP](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts#L24-L34)
- router output `recommendedTemplateId` MUST equal the resolved `.id` value for
  that `starterKey`
- weak-confidence MUST degrade to clarification or guided browse, never a
  guessed route id
- input language other than VN or EN MUST trigger weak-confidence fallback

Surface lock — the canonical front door is one of: Home, dedicated
launcher, or upgraded QuickStart (owner decides at §8.2). Other entry
surfaces are classified primary / supporting / browse / legacy-but-retained
by reference to the CP0 inventory.

**Acceptance**

- `intent-router.ts` exists and exports a typed contract
- routing never returns a non-wizard or non-trusted target
- canonical surface declared and wired to the router behind the feature flag
- bilingual contract verified by a regression test

### CP2 — Home / QuickStart / Onboarding Unification

**Deliver**

Unify the current entry surfaces so they consume the **same**
`intent-router.ts` and present the **same** starter-path language.

Expected result:

- first-run user sees one dominant next action
- QuickStart and onboarding no longer feel like separate product modes
- starter handoff card uses the same recommendation language as the planner

**Acceptance**

- only one routing core (`intent-router.ts`) drives all first-run entry surfaces
- a user can move from onboarding to execution without re-entering the same context
- provider readiness, starter path, and execution CTA appear as one coherent flow
- behind feature flag = unified path; flag off = current behavior bit-identical

### CP3 — Skill Library Repositioning (REFRAMED — Δ5)

**Deliver**

Keep the skill library and skill detail routes, but reposition them as browse
and explanation surfaces rather than the main activation path.

> Framing note (Δ5): W121 made the catalog **trustworthy**; W122 makes it
> **non-mandatory at first touch**. These are two distinct claims; CP3 is not
> a walk-back of W121.

Expected changes may include:

- copy that points users back to the canonical intent-first path
- clearer differentiation between "browse capabilities" and "start a task"
- preserving linked guided forms without making catalog navigation mandatory

**Acceptance**

- users can still browse the library
- the product no longer implies that catalog traversal is the preferred first step
- no trusted activation route is lost
- `skill-planner.ts` is unchanged (browse-side use only — Δ4)

### CP4 — Evidence Continuity Guard (PROMOTED — was CP5, now testable, Δ6)

**Deliver**

Verify that intent-first routing does not weaken governance evidence continuity.

**Concrete assertion (replaces vague "preserved" wording):**

> For any seeded `userInput` in the W122 case set, an intent-routed run and a
> direct template-driven run targeting the same `recommendedTemplateId` MUST
> produce a declared parity object whose field-set diff is the empty set.
>
> Minimum W122 parity fields:
> `{recommendedTemplateId, phase, riskLevel, decision, approvalId?, knowledgeCollectionId?}`
>
> This parity object may combine receipt-native fields and routed execution
> metadata outside the receipt.

Knowledge-assisted continuity (when knowledge is present) is included.

**Acceptance**

- `intent-router-evidence-parity.test.ts` exists and passes
- diff is asserted at field level, not by descriptive review
- approval and risk visibility identical between routed and direct runs
- roadmap does not force `GovernanceEvidenceReceipt` type expansion unless
  explicitly chosen during implementation

### CP5 — Adoption Evidence Pack (CONCRETIZED — was CP6, Δ7)

**Deliver**

Create a W122 evidence pack focused on activation quality rather than corpus
quality, using the Playwright-live runner + `intentRoutedAt` trace field
(per §8.A6 pre-decision). `intentRoutedAt` may live in Playwright trace or
artifact metadata; it is not required to be persisted on
`GovernanceEvidenceReceipt` in W122.

Minimum cases:

1. plain-language app/build intent (VN)
2. plain-language documentation/operations intent (EN)
3. plain-language review/analysis intent (VN)
4. low-confidence intent → clarification or safe fallback
5. knowledge-assisted intent-first journey
6. non-VN/non-EN input → weak-confidence fallback (Δ11)

Capture per case:

- user input
- recommended path
- whether clarification was needed
- final governed wizard template used (`recommendedTemplateId`)
- evidence continuity fields present (CP4 parity-object assertion result)
- `intentRoutedAt` timestamp from trace / evidence artifact metadata

**Acceptance**

- evidence distinguishes routing quality from governance quality
- live governance claims remain backed by real provider calls
- summary explains whether W122 reduced activation friction for non-coders
- `tests/e2e/intent-first-flow.live.spec.ts` produced reproducible artifact, not screenshots-only

### CP6 — Closure & Doc Sync (NEW — replaces former CP6 sync work)

**Deliver**

- update `AGENT_HANDOFF.md` with W122 closure summary
- sync public-facing docs (README, GET_STARTED) to reflect intent-first path
- flip `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` default to `true` only after
  CP4 + CP5 close
- record W122 closure in `docs/baselines/`

**Acceptance**

- AGENT_HANDOFF reflects the canonical front door and feature-flag state
- no public doc overstates the trusted routing subset (still wizard-family)
- baseline note links to evidence pack and parity test result

---

## 5. Verification Plan (Δ8)

Required test files — placeholder eliminated. All MUST exist and pass before
W122 closes:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

# CP1 — router contract
npx vitest run src/lib/intent-router.test.ts

# CP2 — handoff continuity (extended for weak-confidence)
npx vitest run src/lib/governed-starter-path.test.ts

# CP4 — evidence parity (the key new gate)
npx vitest run src/lib/intent-router-evidence-parity.test.ts

# Existing governance gates that MUST stay green
npx vitest run \
  src/lib/templates/governance-enforcement.test.ts \
  src/lib/skill-corpus-governance.test.ts \
  src/lib/skill-template-map.test.ts

# CP5 — live E2E (real provider key required, per feedback rule)
# path follows existing tests/e2e/ convention (see §8.A6)
npx playwright test tests/e2e/intent-first-flow.live.spec.ts

# Release gate
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode remains valid only for UI-structure assertions. Any claim about
governed execution behavior, risk gating, approval flow, evidence receipt, or
knowledge-assisted route behavior MUST use live provider-backed proof
(Alibaba or DeepSeek key per established feedback).

---

## 5.1 Live Verification Status (Codex Q2 — 2026-04-27)

This sub-section tracks which verification gates have actually been run
versus which are still pending. It exists because the Codex review pass
flagged that the live Playwright spec and the release gate bundle had
**not** been executed at review time, so claims about the Alibaba lane were
not yet validated end-to-end.

| Gate | Status | Last run | Notes |
| --- | --- | --- | --- |
| `intent-router.test.ts` (12 tests) | ✅ PASS | 2026-04-27 | Local vitest after weak-fallback fix |
| `intent-router-evidence-parity.test.ts` (10 tests) | ✅ PASS | 2026-04-27 | Local vitest after fixture audit |
| `governed-starter-path.test.ts` (2 tests) | ✅ PASS | 2026-04-27 | Local vitest |
| `templates/governance-enforcement.test.ts` (11 tests) | ✅ PASS | 2026-04-27 | Local vitest |
| `skill-template-map.test.ts` (11 tests) | ✅ PASS | 2026-04-27 | Local vitest |
| `front-door-rewrite-regression.test.ts` (11 tests) | ✅ PASS | 2026-04-27 | Local vitest |
| `QuickStart.test.tsx` (1 test) | ✅ PASS | 2026-04-27 | Local vitest |
| `tests/e2e/intent-first-flow.live.spec.ts` | ✅ PASS | 2026-04-27 | 6 passed / 2 skipped (J1 skipped when flag=true); J3.1 BLOCK + J3.2 ALLOW both valid |
| `python scripts/run_cvf_release_gate_bundle.py --json` | ✅ PASS | 2026-04-27 | 7/7 checks PASS: build, tsc, provider readiness, secrets scan, docs governance, E2E mock, E2E live |
| TypeScript compile (`tsc --noEmit`) on touched files | ✅ PASS | 2026-04-27 | 0 new errors on `intent-router.ts`, `IntentEntry.tsx`, `home/page.tsx`, parity test |

**All verification gates PASSED on 2026-04-27.** W122 is closure-ready.

Evidence:

- `intent-first-flow.live.spec.ts`: 6 passed / 2 skipped (J1 correctly skipped when `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`; J3.1 = BLOCK + J3.2 = ALLOW, both valid governed outcomes on Alibaba `qwen-turbo`).
- `run_cvf_release_gate_bundle.py --json`: 7/7 PASS — build, tsc, provider readiness, secrets scan, docs governance, E2E mock, E2E live governance.

---

## 6. Exit Criteria

W122 closes only when:

- one canonical non-coder front door is declared and implemented
- existing entry surfaces converge on the **same** `intent-router.ts` core
- intent routing selects only from the **wizard-family (9)** subset
- skill-library browsing remains available but is no longer the primary first-run path
- evidence continuity is field-level identical between routed and direct runs (CP4)
- a W122 activation evidence pack exists, produced by `tests/e2e/intent-first-flow.live.spec.ts` (§8.A6)
- public/handoff docs are synchronized to the new activation model without overstating claims
- **(Δ10/C2)** `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` feature flag is wired
  and rollback-tested; default flips to `true` only after CP4 + CP5 close
- **(Δ9)** all GC-023 line budgets satisfied; any modified file ≥ approved limit has registry entry

---

## 7. Recommended Execution Order

CP0 → CP1 → CP2 → CP3 → CP4 → CP5 → CP6

Reasoning:

- CP0 locks contract decisions and pre-flight before any irreversible work
- CP1 builds the routing core + canonical surface together (merged, Δ3)
- CP2 uses that core to simplify first-run UX
- CP3 repositions browse surfaces after the primary path is stable
- CP4 proves evidence parity at field level (testable)
- CP5 closes the tranche with activation-focused evidence
- CP6 syncs docs and flips the feature flag default

---

## 8. Execution Lock For Delegated Agent

W122 is now locked for delegated implementation. The decisions that were open in
r2 are closed here so the next agent does not stop to re-ask them.

### Locked Execution Decisions

1. **Allowed change surface**
   W122 may change Web UX/orchestration surfaces **and** may refine the bounded
   starter-path helper contracts directly involved in intent routing:
   `intent-detector.ts`, `governed-starter-path.ts`, and the new
   `intent-router.ts`. No broader architecture reopen is authorized.
2. **Canonical front door**
   The canonical first-run front door is **an upgraded QuickStart flow**,
   surfaced as the dominant CTA from Home and reused by supporting entry
   surfaces. Home may host the entry CTA and handoff presentation, but W122
   should not turn `home/page.tsx` into the full routing implementation body if
   an extracted `IntentEntry.tsx` keeps GC-023 cleaner.
3. **Evidence timing**
   W122 closes with the **live evidence runner in the same tranche**. CP5 is not
   split to W123.

With these decisions locked, the only remaining gate before implementation is a
fresh `GC-018`. Once `GC-018` opens, CP0 may begin without further product
scoping questions.

---

### §8.A — Audit-Grounded Execution Locks

These three questions were audited against the current repo state on 2026-04-26.
Recommendations are grounded in file-level evidence and are now promoted to
execution locks for the delegated implementation. If a future operator wants to
override one of them, that is a re-scope event and should happen before a new
continuation roadmap, not inside W122 execution.

---

#### A4 — Trusted routing subset = wizard-family (9) ✓ RECOMMENDED

**Evidence:**

- [intent-detector.ts:107–117](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-detector.ts#L107-L117)
  `TEMPLATE_PATTERNS` contains **exactly 9 entries**, one-to-one with the 9 keys
  in [governed-starter-path.ts:24–34](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts#L24-L34)
  `STARTER_TEMPLATE_MAP`. The classifier and the handoff map are already
  aligned for the wizard family — zero new mapping work required.
- The 42 form templates under
  [src/lib/templates/](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/)
  have **no intent-pattern classification**. Routing to them requires (a) a new
  42-entry intent map, (b) a disambiguation rule when both a wizard and a form
  match the same intent (e.g. "marketing" hits the wizard **and** `marketing.ts`
  forms). Neither (a) nor (b) is in scope for W122.
- Wizard family is the natural "guided starter" surface for non-coders — it is
  multi-step, governed, and form-progressive. Form templates require prior
  knowledge of what to use.

**Execution lock:** trusted routing subset = **wizard-only (9)** for
W122. Form routing is a follow-up wave. The router MUST be designed so adding
forms is a **config addition** (extend `TEMPLATE_PATTERNS` and
`STARTER_TEMPLATE_MAP`) with no code refactor needed.

---

#### A5 — Create new `src/lib/intent-router.ts` as routing facade ✓ RECOMMENDED

**Evidence:**

- `intent-detector.ts` (210 lines) — pure phase/risk/suggestedTemplates
  classifier; clean, single concern. Should remain unchanged as a dependency.
- `governed-starter-path.ts` (96 lines) — handoff serializer (storage +
  `resolveGovernedStarterTemplate`). Distinct concern from routing decisions.
- `skill-planner.ts` (299 lines) — industry-based multi-skill plan generator
  using CSV reasoning rules. **Completely separate concern** — used only by the
  browse-side `SkillPlanner.tsx` component. Not relevant to intent routing.
- The router contract = `detectIntent()` + `resolveGovernedStarterTemplate()` +
  fallback rule + typed output. This is **~50–80 lines of glue** — not a
  reimplementation.

**Execution lock:** create `src/lib/intent-router.ts` as a new file (~80 lines)
that:

- imports and delegates to `detectIntent()` — **no duplicate regex patterns**
- imports and delegates to `resolveGovernedStarterTemplate()` for handoff
- owns fallback logic (weak-confidence, non-VN/EN language trigger)
- owns feature-flag check (`NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`)
- exports a single `routeIntent(userInput: string): IntentRouteResult` function

`skill-planner.ts` is **not touched** in this wave (browse-only, Δ4 holds).

**Hard constraint:** the new file MUST NOT copy or re-declare any
phase/risk/template regex. All classification is delegated to
`intent-detector.ts`. Violation = duplicate logic, silent divergence over time.

---

#### A6 — CP5 evidence runner = Playwright live + one trace field ✓ RECOMMENDED

**Evidence:**

- Playwright infra is already operational:
  [tests/e2e/noncoder-governance-live.spec.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/noncoder-governance-live.spec.ts)
  (73 lines, real Alibaba call, `postLiveGovernedExecution` helper),
  [governance-gate-live.spec.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/governance-gate-live.spec.ts)
  (67 lines), two playwright configs (live + mock). The pattern cost for a new
  spec is ~70–80 lines.
- Alibaba and DeepSeek keys are available and pre-authorized for governance E2E
  calls.
- Human-session log (option c) is not reproducible and cannot satisfy the
  "governance assertions must use real AI calls" rule already in effect on this
  project.
- Full in-product telemetry pipeline (option b pure) is invasive and out of
  scope for an activation UX wave.

**Execution lock:** hybrid approach — primary (a) + minimal (b) augmentation:

- **Primary (a):** add
  `tests/e2e/intent-first-flow.live.spec.ts` (~80 lines, following the
  `noncoder-governance-live` pattern). Covers CP5 cases 1–4 + case 6
  (non-VN/EN fallback). Asserts CP4 evidence parity inline: same `userInput`
  via intent-router vs. direct `recommendedTemplateId` → parity-object diff of
  `{recommendedTemplateId, phase, riskLevel, decision, approvalId?, knowledgeCollectionId?}` = ∅.
- **Minimal (b) augment:** add `intentRoutedAt: ISO8601 | null` to the
  Playwright trace or evidence artifact metadata. Extending
  `GovernanceEvidenceReceipt` is optional, not required by W122.
- **Case 5 (knowledge-assisted):** seed knowledge receipt using the existing
  `tests/e2e/utils.ts` helper pattern; assert continuity.

Option (c) human-session log is **explicitly rejected** as the sole runner.
It may be used as supplementary notes only, not as the primary evidence
artifact.

---

#### A7 — Weak-confidence fallback semantic = NO routed target ✓ LOCKED

This sub-decision was raised as an open question in the Codex review pass on
2026-04-27. It is now locked here so future agents do not re-litigate it.

**Question raised:**

> Does "weak-confidence fallback" mean (a) router returns no wizard target at
> all, OR (b) router returns a tentative wizard target that requires explicit
> user confirmation before opening?

**Decision:** **(a) — router returns NO routed target on weak confidence.**

**Evidence and reasoning:**

- §1 product claim is "receive a recommended **governed** starter path". A
  guessed wizard label in the result object is not "governed" — it is a guess
  surfaced as if it were a recommendation.
- CP1 hard contract (this roadmap §4 CP1) already states: *"weak-confidence
  MUST degrade to clarification or guided browse, never a guessed
  `templateId`"*. Option (b) would surface a `templateId` whose only status is
  "the router could not justify it" — that contradicts the CP1 wording.
- A "tentative wizard label + confirm" UX requires the user to decide whether
  to trust a label the router itself flagged as low confidence. That pushes
  the disambiguation cost back onto the non-coder, defeating the W122
  activation goal.
- Implementation cost is symmetric — both (a) and (b) require nullable
  fields or a discriminated union. (a) is simpler and forecloses ambiguity.

**Implementation contract (now in code):**

- `IntentRouteResult.{starterKey, recommendedTemplateId, recommendedTemplateLabel}`
  are typed `string | null`.
- On `confidence === 'weak'` (any reason: empty / unsupported_language /
  weak_confidence), all three fields MUST be `null`.
- Consumers (e.g., `IntentEntry.tsx`) MUST disable any "Start governed path"
  CTA when `recommendedTemplateId === null`. The user is shown the rationale,
  the fallback suggestion, and a path to browse the library.
- `home/page.tsx` `handleIntentRoute` MUST refuse to open a wizard when
  `recommendedTemplateId === null` (no-op guard).

**Test enforcement:**

- [intent-router.test.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-router.test.ts)
  tests 5/6/7 assert `recommendedTemplateId === null && recommendedTemplateLabel === null && starterKey === null` on each weak path.
- [intent-router-evidence-parity.test.ts](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/intent-router-evidence-parity.test.ts)
  fixtures use only strong-detection inputs; helper throws if a fixture
  inadvertently goes weak (defensive).

**Override path:** if a future wave wants the "tentative + confirm" UX,
that is a re-scope event and requires a new roadmap with explicit fallback
contract redesign. It is not a W122 implementation choice.
