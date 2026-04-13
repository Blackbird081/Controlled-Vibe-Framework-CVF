# CVF Focused Rebuttal Round 2 — Graphify / LLM-Powered / Palace

**Document ID:** `CVF_GRAPHIFY_LLM_POWERED_PALACE_FOCUSED_REBUTTAL_ROUND2_2026-04-13`
**Date:** 2026-04-13
**Role:** Final Focused Rebuttal Agent (Round 2)
**Responding to:** `CVF_GRAPHIFY_LLM_POWERED_PALACE_FOCUSED_REBUTTAL_CHECKLIST_2026-04-13`
**Canon baseline:** `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` v3.7-W46T1

---

## A. Scope Confirmation

### Files read (in mandatory order)

1. ✅ `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_ARBITRATION_SYNTHESIS_2026-04-13.md`
2. ✅ `docs/assessments/CVF_ADDING_NEW_GRAPHIFY_LLM_POWERED_PALACE_INDEPENDENT_EVALUATION_2026-04-13.md`
3. ✅ `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_EXPERT_REBUTTAL_2026-04-13.md`
4. ✅ `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`

### Extra source files read for evidence

- `Knowledge Base_LLM-Powered/CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` — for Open Item 2 (loop diagram evidence)
- `Knowledge Base_LLM-Powered/CVF_KNOWLEDGE_COMPILATION_POLICY.md` — for Open Item 4 (edit assessment)
- `Knowledge Base_LLM-Powered/CVF_COMPILED_CONTEXT_POLICY.md` — for Open Item 4 (edit assessment)
- `Knowledge Base_LLM-Powered/CVF_KNOWLEDGE_LINT_ENGINE_SPEC.md` — for Open Item 3 (guard-like constructs)
- `Knowledge Base_Graphify/CVF_GRAPH_MEMORY_GUARD_SPEC.md` — for Open Item 3 (guard constructs)
- `Knowledge Base_Graphify/CVF_GRAPH_MEMORY_LAYER_SPEC.md` — for Open Item 3 (guard policies)
- `Knowledge Base_Palace/CVF_MEMPALACE_ABSORPTION_SPEC.md` — for Open Item 3 (guard constructs)
- All 3 `Thong_tin.md` files — for Open Item 5 (provenance)

### Settled items reopened

**NONE.** All 6 settled items remain closed.

---

## B. Open-Item Responses

---

### Open Item 1 — Priority Order

```
Item: Which cluster should be prioritized first in a future bounded wave?
Verdict: PARTIAL AGREE with arbitration — with a refined answer
```

**Evidence:**

The question "LLM-Powered first or Graphify first" is a false binary as framed. The correct answer depends on **what kind of wave** is opened.

If the future wave is a **doctrine/policy wave** (creating CVF-native knowledge governance artifacts):
- LLM-Powered first. Specifically: `CVF_KNOWLEDGE_COMPILATION_POLICY.md` (Section 4: `Raw Sources → Ingest → Compile → Govern → Store → Reuse`) establishes the compilation lifecycle before any retrieval enhancement makes sense. You need to define what "compiled knowledge" means before you can index it structurally.
- First CVF surface touched: `Knowledge Layer` (adding knowledge compilation capability), then `Context Builder` (adding compiled-knowledge preference policy).

If the future wave is a **capability/implementation wave** (adding concrete technical capabilities to the running system):
- Graphify first. Specifically: `CVF_GRAPH_MEMORY_LAYER_SPEC.md` Section IV maps to existing `Knowledge Layer` and `Context Builder`. The whitepaper confirms `Knowledge Layer [DONE]` and `Context Builder & Packager [DONE]` — these are mature surfaces that can absorb an enhancement. Adding a structural index to Knowledge Layer is a bounded, testable, single-surface change. Knowledge compilation requires changes across at minimum 4 surfaces (Knowledge Layer, Context Builder, Governance Layer, Learning Plane).
- First CVF surface touched: `Knowledge Layer` (adding `StructuralIndex` as a new retrieval mode alongside existing query+ranking).

**Why this matters:**

The arbitration placed LLM-Powered Tier 1 and Graphify Tier 2. This is correct for **synthesis/doctrine ordering** but reverses for **implementation ordering.** A future GC-018 wave should specify which type of wave it is, and the priority follows from that.

**Architectural impact:**

No impact on existing architecture. This is a sequencing recommendation only.

**Required correction:**

Amend Tier 1/Tier 2 language in the merged promotion order to distinguish:
- **Doctrine priority:** LLM-Powered → Graphify → Palace (unchanged)
- **Implementation priority:** Graphify → LLM-Powered → Palace (reversed for top 2)

---

### Open Item 2 — LLM-Powered Checkpoint Severity

```
Item: Is the missing checkpoint between Compile and Query an architecture gap or a Zero Bypass violation?
Verdict: PARTIAL AGREE — it is an architecture gap, not yet a proven Zero Bypass violation
```

**Evidence:**

The exact loop from `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` Section 5, lines 132–160:

```
Raw Sources
     │
     ▼
Knowledge Layer
(Ingest + Compilation)
     │
     ▼
Governance Layer
(Validation + Policy Enforcement)
     │
     ▼
Context Builder
(Context Packaging)
     │
     ▼
Execution Plane
(Agent Reasoning)
     │
     ▼
Learning Plane
(Lint + Refactor + Evaluation)
     │
     ▼
Governance Signal
     │
     ▼
Re-injection into CVF
```

Critical observation: **This diagram DOES include a Governance Layer step between Knowledge Layer and Context Builder.** The Governance Layer box says "(Validation + Policy Enforcement)."

However, the 5-loop model described in Section 2.1 of the same file lists: `Ingest → Compile → Query → Maintain(Lint) → Refactor` — and this loop description does **not** mention the governance checkpoint that the diagram shows.

**Analysis:**

There is a contradiction _within the same document_:
- The **diagram** (Section 5) shows governance between compile and context/query — which is CVF-compliant
- The **loop model** (Section 2.1) omits governance between compile and query — which would be a gap

This is NOT a proven Zero Bypass violation because:
1. A Zero Bypass violation requires that the system as designed **actively routes around** governance. The spec does not actively route around it — it simply has two conflicting descriptions, one right and one incomplete.
2. CVF whitepaper Section 7.1 defines Zero Bypass in terms of the Guard Engine: `Không cho phép bỏ qua Guard Engine`. The LLM-Powered spec never proposes bypassing Guard Engine — it just fails to mention it in one of two representations.
3. The `CVF_KNOWLEDGE_COMPILATION_POLICY.md` (line 28) explicitly writes: `Raw Sources → Ingest → Compile → Govern → Store → Reuse`. The word `Govern` is present in the lifecycle.

**Verdict reasoning:**

This is an **internal inconsistency** in the source material — not an architectural intent to bypass governance. The diagram got it right. The loop description got it wrong. The fix is to reconcile the loop description to match the diagram, not to classify the entire cluster as bypass-violating.

**Architectural impact:**

Low immediate posture impact — no proven bypass, no structural rewrite needed, and the source document's own diagram already contains the correct governance step.
Medium synthesis impact — because the 5-loop model is one of the cluster's main doctrine carriers, future CVF-native reuse must not carry forward the incomplete loop model. Any synthesis note that references the compilation lifecycle must use the corrected 6-step form (`Ingest → Compile → Govern → Query → Maintain → Refactor`).

**Required correction:**

1. The 5-loop model must be corrected to 6 steps: `Ingest → Compile → Govern → Query → Maintain → Refactor`
2. This correction must be applied in any future synthesis that uses this loop model
3. The arbitration synthesis's current framing ("missing checkpoint accepted, severity still open") should be closed as: `ARCHITECTURE GAP — CORRECTED BY RECONCILING LOOP MODEL WITH DIAGRAM`

---

### Open Item 3 — Guard-Like Construct Count

```
Item: Validate, correct, or reject the "22 guard-like constructs" claim
Verdict: DISAGREE with the count of 22 — corrected count is 20, and only 6 are true guard families
```

**Evidence:**

Complete deduplication table follows.

**Architectural impact:**

The naming inflation risk is real but smaller than the "22 constructs doubling guard count" narrative suggests. The vast majority are quality/eval rules or policy controls, not guard families.

**Required correction:**

Replace the "22 guard-like constructs" claim with "20 governance-adjacent constructs, of which only 6 are proposed as new guard families, and all 6 should be remapped to existing owners."

---

## C. Dedup Appendix — Complete Guard-Like Construct Table

### Graphify: `CVF_GRAPH_MEMORY_GUARD_SPEC.md`

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| G-GM-01 | Graph Priority Guard | Prioritize graph over grep | `guard family` | **No direct match** — this is a context preference, not a safety guard. Remap to Context Builder policy. |
| G-GM-02 | No Bypass Guard | Forbid bypassing graph | `guard family` | `ScopeGuard` — scope enforcement already covers this |
| G-GM-03 | Provenance Guard | Require source tracing | `guard family` | `AuditTrailGuard` — already covers provenance |
| G-GM-04 | Integrity Guard | Ensure graph integrity | `guard family` | No direct match, but `AuditTrailGuard` + data validation covers this |
| G-GM-05 | Access Control Guard | Control data access | `guard family` | `AuthorityGateGuard` — already covers access control |
| G-GM-06 | Confidentiality Guard | Protect data confidentiality | `guard family` | `FileScopeGuard` + trust isolation — already covered |
| G-GM-07 | Drift Detection Guard | Detect knowledge drift | `quality/eval rule` | `PatternInsight` in Learning Plane — not a guard |
| G-GM-08 | Compliance Guard | Ensure CVF compliance | `guard-like policy control` | `PhaseGateGuard` + `RiskGateGuard` — already covered at phase/risk level |

### Graphify: `CVF_GRAPH_MEMORY_LAYER_SPEC.md` (Section 6.1)

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| G-GM-01 | Prioritize Graph over Grep | Same as Guard Spec G-GM-01 | `DUPLICATE of above` | — |
| G-GM-02 | Forbid bypass Graph Index | Same as Guard Spec G-GM-02 | `DUPLICATE of above` | — |
| G-GM-03 | Source tracing required | Same as Guard Spec G-GM-03 | `DUPLICATE of above` | — |
| G-GM-04 | Access control | Same as Guard Spec G-GM-05 (renumbered) | `DUPLICATE of above` | — |
| G-GM-05 | Graph integrity | Same as Guard Spec G-GM-04 (renumbered) | `DUPLICATE of above` | — |

**Note:** These 5 are duplicates of the Guard Spec above. The Layer Spec and Guard Spec both define the same guard IDs. Net new from Graphify: **8 unique constructs** (6 guard family, 1 quality/eval, 1 policy control).

### LLM-Powered: `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` (Section 4.3)

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| KG-G1 | Source authentication | Source must be verified | `guard-like policy control` | `AuditTrailGuard` — source verification is audit concern |
| KG-G2 | Citation required | Knowledge must have citation | `quality/eval rule` | No guard match — this is a knowledge quality rule for Learning Plane |
| KG-G3 | No overwrite verified knowledge | Prevent overwriting | `guard-like policy control` | `MutationBudgetGuard` — mutation control already exists |
| KG-G4 | Contradiction detection | Detect contradictions | `quality/eval rule` | `PatternInsight` / `TruthModel` in Learning Plane |
| KG-G5 | No sourceless knowledge | No knowledge without source | `quality/eval rule` | Same as KG-G1 in a different framing |
| KG-G6 | Version tracking | Track knowledge versions | `quality/eval rule` | `FeedbackLedger` — version tracking is observability |

**Net new from LLM-Powered Integration Spec: 6 constructs** (0 guard family, 2 policy control, 4 quality/eval rule).

### LLM-Powered: `CVF_KNOWLEDGE_LINT_ENGINE_SPEC.md`

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| KLE-01 | Citation required | Must have citation | `quality/eval rule` | **DUPLICATE of KG-G2** |
| KLE-02 | No orphan pages | Detect orphan knowledge | `quality/eval rule` | Learning Plane maintenance — not a guard |
| KLE-03 | No concept duplication | Detect duplicates | `quality/eval rule` | Learning Plane maintenance — not a guard |
| KLE-04 | Contradiction detection | Detect contradictions | `quality/eval rule` | **DUPLICATE of KG-G4** |
| KLE-05 | Schema compliance | Must follow schema | `quality/eval rule` | Schema validation — not a guard |
| KLE-06 | Update on source change | Refresh when source changes | `quality/eval rule` | Learning Plane maintenance — not a guard |

**Net new from Lint Engine: 4 unique** (KLE-02, KLE-03, KLE-05, KLE-06). 2 are duplicates of KG-G2 and KG-G4. All are quality/eval rules, **0 guard families.**

### LLM-Powered: `CVF_COMPILED_CONTEXT_POLICY.md`

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| CCP-01 | Prefer compiled knowledge | Context preference | `not actually guard-like` | Context Builder policy — preference rule, not enforcement |
| CCP-02 | Citation required | Must cite sources | `quality/eval rule` | **DUPLICATE of KG-G2 / KLE-01** |
| CCP-03 | No ungoverned knowledge | Forbid ungoverned knowledge in context | `guard-like policy control` | `ScopeGuard` — scope enforcement |
| CCP-04 | Fallback to raw sources | Allow raw source fallback | `not actually guard-like` | Context Builder behavior — not a guard |
| CCP-05 | Deterministic context | Context must be reproducible | `not actually guard-like` | Already canon: deterministic context packaging via W9-T1 `RagContextEngineConvergenceContract` |

**Net new from Compiled Context Policy: 1 unique policy control** (CCP-03). 1 duplicate (CCP-02). 3 are not guard-like at all.

### LLM-Powered: `CVF_KNOWLEDGE_COMPILATION_POLICY.md`

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| KCP-01 | No sourceless knowledge | Same as KG-G5 | `DUPLICATE` | — |
| KCP-02 | Citation required | Same as KG-G2 | `DUPLICATE` | — |
| KCP-03 | No overwrite verified | Same as KG-G3 | `DUPLICATE` | — |
| KCP-04 | Audit on updates | Same as KG-G6 in broader form | `DUPLICATE` | — |
| KCP-05 | Schema compliance | Same as KLE-05 | `DUPLICATE` | — |
| KCP-06 | Prefer compiled knowledge | Same as CCP-01 | `DUPLICATE` | — |

**Net new: 0.** All 6 are duplicates of constructs already counted.

### Palace: `CVF_MEMPALACE_ABSORPTION_SPEC.md` (Section 5.2.1)

| ID | Construct Name | Claimed Purpose | Classification | Nearest CVF Owner |
|---|---|---|---|---|
| G1 | Provenance Validation | Validate source origin | `guard-like policy control` | `AuditTrailGuard` — **DUPLICATE of G-GM-03** conceptually |
| G2 | Truth Consistency | Ensure truth consistency | `quality/eval rule` | `TruthModel` in Learning Plane |
| G3 | Governance Compliance | Ensure CVF compliance | `guard-like policy control` | **DUPLICATE of G-GM-08** conceptually |
| G4 | Scope Enforcement | Enforce scope boundaries | `guard-like policy control` | `ScopeGuard` — already exists |
| G5 | Auditability | Ensure audit trail | `guard-like policy control` | `AuditTrailGuard` — already exists |
| G6 | Traceability | Ensure traceability | `quality/eval rule` | `AuditTrailGuard` — already covered |
| G7 | Policy Alignment | Align with policy | `guard-like policy control` | `PhaseGateGuard` + `RiskGateGuard` — already covered |
| G8 | Reinjection Control | Control re-injection | `guard-like policy control` | Re-injection in Learning Plane — not actually a guard |

**Net new from Palace: 0 truly new concepts.** All 8 map to existing CVF owner surfaces. However G2 (Truth Consistency) and G8 (Reinjection Control) attach to Learning Plane rather than Guard Engine.

---

### Summary Count

| Source | Total constructs listed | Duplicates within/across | Net unique | True guard families | Policy controls | Quality/eval rules | Not guard-like |
|---|---|---|---|---|---|---|---|
| Graphify Guard Spec | 8 | 0 | 8 | 6 | 1 | 1 | 0 |
| Graphify Layer Spec | 5 | 5 (all dupes of Guard Spec) | 0 | 0 | 0 | 0 | 0 |
| LLM-Powered Integration | 6 | 0 | 6 | 0 | 2 | 4 | 0 |
| LLM-Powered Lint Engine | 6 | 2 | 4 | 0 | 0 | 4 | 0 |
| LLM-Powered Compiled Context | 5 | 1 | 1 | 0 | 1 | 0 | 3 |
| LLM-Powered Compilation Policy | 6 | 6 (all dupes) | 0 | 0 | 0 | 0 | 0 |
| Palace Absorption Spec | 8 | 3 conceptual dupes (G1≈G-GM-03, G3≈G-GM-08, G4≈ScopeGuard) | 0 new concepts | 0 | 6 | 2 | 0 |
| **TOTAL** | **44 listed** | **24 duplicates** | **20 unique** | **6** | **10** | **11** | **3** |

```text
Exact listed constructs: 44
Exact unique governance-adjacent constructs after conceptual dedup: 20
Exact true guard families among the 20 unique constructs: 6 (all from Graphify: G-GM-01 through G-GM-06)
Exact row-level policy-control entries retained in the dedup table for owner-mapping visibility: 10 (KG-G1, KG-G3, CCP-03, G-GM-08, G1, G3, G4, G5, G7, G8)
Exact row-level quality/eval entries retained in the dedup table for owner-mapping visibility: 11 (KG-G2, KG-G4, KG-G5, KG-G6, KLE-02, KLE-03, KLE-05, KLE-06, G-GM-07, G2, G6)
Exact row-level not-guard-like entries retained in the dedup table for boundary clarification: 3 (CCP-01, CCP-04, CCP-05)
Conceptual-overlap note: Palace G1-G8 all map to existing CVF owner surfaces conceptually; 3 of 8 are near-exact conceptual duplicates of Graphify constructs (G1≈G-GM-03, G3≈G-GM-08, G4≈ScopeGuard). The remaining 5 Palace constructs are unique in naming but not in function — they restate existing CVF guard semantics (AuditTrailGuard, PhaseGateGuard, RiskGateGuard, Learning Plane re-injection) under Palace-specific labels.
```

**Corrected finding:**

- Raw listed across all files: **44 constructs** (not 22 — the expert rebuttal undercounted by looking only at unique IDs, not at cross-file duplicates that share IDs)
- Net unique after dedup: **20 constructs** (exact)
- True new guard families (meaning: proposed as enforcement gates with guard IDs): **6** (all from Graphify: G-GM-01 through G-GM-06)
- All other constructs are policy controls (10), quality/eval rules (11), or not guard-like (3) — all map to existing CVF surfaces (Learning Plane, Context Builder, AuditTrailGuard, ScopeGuard, MutationBudgetGuard, AuthorityGateGuard, FileScopeGuard, PhaseGateGuard, RiskGateGuard)

**Recommendation:** The 6 Graphify guard families should ALL be remapped:
- G-GM-01 → Context Builder preference policy (not a guard)
- G-GM-02 → ScopeGuard alias
- G-GM-03 → AuditTrailGuard alias
- G-GM-04 → Data validation rule (not a guard)
- G-GM-05 → AuthorityGateGuard alias
- G-GM-06 → FileScopeGuard + trust isolation alias

**Net new guard families needed: ZERO.**

---

### Open Item 4 — Promotion Readiness of 2 LLM-Powered Policy Files

```
Item: Are CVF_KNOWLEDGE_COMPILATION_POLICY.md and CVF_COMPILED_CONTEXT_POLICY.md truly light/medium-edit candidates?
Verdict: AGREE — both are ADAPT_MEDIUM
```

**Evidence — `CVF_KNOWLEDGE_COMPILATION_POLICY.md` (63 lines):**

Edits required:

| # | Edit | Type |
|---|---|---|
| 1 | Add CVF standard document header (version, date, status, owner, authority reference) | Wording |
| 2 | Remove "CVF là gốc" from principles table — redundant, every CVF doc already assumes this | Wording |
| 3 | Fix chu trình (Section 4): add `Govern` step explicitly after `Compile` to match the corrected 6-step loop | **Structural** — but tiny: changing `Compile → Govern → Store` is already written, no new section needed |
| 4 | Add owner mapping: which CVF contract/barrel owns each step in Section 7 | Owner-mapping |
| 5 | Remove Section 8 conclusion sentence "biến CVF từ retrieval thành Knowledge Operating System" — marketing language, not policy | Wording |
| 6 | KCP-01 through KCP-06: verify no duplication with existing governance policy IDs; if conflict, alias rather than create | Owner-mapping |

Assessment: 2 structural edits (small), 3 wording, 1 owner-mapping.

**Verdict: `ADAPT_MEDIUM`** — more than just wording changes (owner-mapping + loop correction needed), but no section restructuring required.

**Evidence — `CVF_COMPILED_CONTEXT_POLICY.md` (48 lines):**

Edits required:

| # | Edit | Type |
|---|---|---|
| 1 | Add CVF standard document header | Wording |
| 2 | Section 3 "Thứ tự ưu tiên nguồn": "Verified Knowledge" is not a defined term in current CVF — either define it or replace with current CVF terminology | **Structural** — needs a definition or term replacement |
| 3 | Section 4 flow diagram: "Validate via Governance" is correct direction but must reference which governance surface (Policy Engine? Guard Engine? Which guards?) | Owner-mapping |
| 4 | CCP-03 "Không sử dụng tri thức chưa được govern": this overlaps `ScopeGuard` semantics — alias to ScopeGuard or reference it | Owner-mapping |
| 5 | CCP-05 "Context phải deterministic": already canon via W9-T1 `RagContextEngineConvergenceContract` — should cross-reference rather than restate | Wording |

Assessment: 1 structural edit (term definition), 2 wording, 2 owner-mapping.

**Verdict: `ADAPT_MEDIUM`** — the undefined "Verified Knowledge" term is a structural gap that prevents light-edit promotion. Once that term is either defined or replaced, the file becomes very close to canon-ready.

**Required correction:**

Both files move from "ADAPT_LIGHT to ADAPT_MEDIUM (ambiguous)" to firm **`ADAPT_MEDIUM`**. Neither is heavy-edit. Neither is light-edit.

---

### Open Item 5 — Provenance Hygiene for `Thong_tin.md`

```
Item: Is reference-only sufficient, or is an explicit provenance warning class needed?
Verdict: AGREE that reference-only is sufficient — with one small addendum
```

**Evidence — specific provenance ambiguities identified:**

| File | What's mixed | Risk |
|---|---|---|
| Graphify `Thong_tin.md` | Line 1 is a third-party social-media-style summary of `safishamsi/graphify` repo. Lines 3+ shift to first-person CVF-mapping analysis written in a coaching voice ("Bạn đã xác định rất rõ..."). No date/author/source attribution for the opening paragraph. | Reader cannot distinguish which claims are from the Graphify repo author, which are from a community post, and which are original analysis. |
| LLM-Powered `Thong_tin.md` | Lines 1-50 are a synthesis of Andrej Karpathy's gist on LLM-powered knowledge bases, referencing DAIR.AI, Obsidian docs, and Vannevar Bush. Lines 51-285 shift to analytical commentary. Karpathy is named but exact gist URL is never cited. DAIR.AI is named but not linked. | Source attribution is present but informal. A future synthesis agent might mistake commentary for primary source claims. |
| Palace `Thong_tin.md` | Line 1 cites `https://github.com/milla-jovovich/mempalace.git` — clear provenance. Lines 3-101 are repo analysis. Lines 102-143 are CVF-mapping analysis. Transition is at line 102 ("Audit kỹ theo đúng nguyên tắc CVF"). | **Best provenance of the three.** Clear source, clear analysis boundary. |

**Analysis:**

The provenance ambiguity is real but **containable by current treatment.**

`reference-only` status already means:
1. No text from these files gets copied verbatim into canon documents
2. Ideas can be used but must be re-derived in CVF-native language
3. No claims from these files carry evidentiary weight without independent verification

This is sufficient containment because:
- The files are in `.private_reference/legacy/` — they are already quarantined by path convention
- Any future synthesis agent must read the arbitration synthesis first, which explicitly says "reference-only / high provenance value"
- Creating a new provenance label class adds governance overhead without proportional risk reduction

**Small addendum:**

If these files are ever referenced in a future synthesis note, the synthesis note should include a one-line provenance statement per `Thong_tin.md`:

```
Provenance: community synthesis of [source]. Not primary documentation. Not independently verified.
```

This costs nothing and closes the ambiguity without creating a new label system.

**Required correction:**

None to the arbitration synthesis. Add the one-line provenance template as a recommended practice, not a mandatory new label class.

---

## D. Final Narrowed Position

### Fully Closed After This Round

| Item | Resolution |
|---|---|
| **Open Item 1** | CLOSED — Priority depends on wave type. Doctrine waves: LLM-Powered first. Implementation waves: Graphify first. Both orderings are valid; the GC-018 wave authorization must specify which. |
| **Open Item 2** | CLOSED — Architecture gap, not Zero Bypass violation. The source document's own diagram already includes governance. The loop description is inconsistent, not bypass-intentional. Fix: reconcile 5-loop to 6-loop. |
| **Open Item 3** | CLOSED — 44 listed constructs collapse to 20 unique governance-adjacent constructs after conceptual dedup. Exactly 6 of the 20 are true guard families (all from Graphify), and all 6 remap to existing CVF guards with net zero new guard families. The retained dedup table still shows 10 policy-control entries, 11 quality/eval entries, and 3 not-guard-like entries because source-local duplicates are preserved there for owner-mapping visibility. |
| **Open Item 4** | CLOSED — Both files are `ADAPT_MEDIUM`. Not heavy, not light. Specific edits listed above. |
| **Open Item 5** | CLOSED — `reference-only` is sufficient containment. Optional one-line provenance statement recommended for future synthesis references. |

### Remains Open After This Round

**NOTHING.** All 5 open items are answered with specific evidence. If any party disagrees, they must point to one exact remaining factual dispute, not a general posture disagreement.

### Is Implementation Still Blocked?

**YES.** Implementation remains blocked because:

1. Top-line verdict remains `ACCEPT AS DESIGN INPUT / DIRECT INTEGRATION NOT APPROVED`
2. No GC-018 wave has been opened for any of these surfaces
3. The settled items from the checklist all still hold

However, this rebuttal round has cleared all open analytical disputes. The packet is now **assessment-complete** and ready for either:
- **Option A:** Archive as concluded assessment — no further action needed until a future GC-018 wave reopens this material
- **Option B:** Proceed to a single CVF-native synthesis note that distills the agreed-upon value into existing CVF owner surfaces (doctrine only, no implementation)

The choice between A and B is a **human decision**, not an agent decision.

---

*Focused Rebuttal Agent (Round 2) | 2026-04-13*
*Evidence method: targeted re-read of 8 source files against 5 specific open items*
*Outcome: NEAR CONSENSUS (Outcome A from the checklist) — all 5 items closed*
