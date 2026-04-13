# CVF W72-T2 Knowledge Compilation Doctrine Uplift Roadmap

Memory class: FULL_RECORD

> Date: 2026-04-14
> Tranche: `W72-T2`
> Class: `DOCUMENTATION / GOVERNANCE UPLIFT`
> Posture: `RECOMMENDED NEXT TRANCHE / NO CODE / NO RUNTIME`
> Source packet: `Graphify / LLM-Powered / Palace` assessment chain + `W72-T1 StructuralIndex`

---

## 1. Executive Verdict

The best next tranche after `W72-T1 CP2` is:

`W72-T2 — Knowledge Compilation Doctrine Uplift`

This is the highest-leverage next move because:

1. `W72-T1` already closed the first bounded implementation gap by landing `StructuralIndexContract` inside the Knowledge Layer.
2. The strongest remaining accepted value from the intake packet is still the `LLM-Powered` doctrine:
   `Ingest -> Compile -> Govern -> Query -> Maintain -> Refactor`
3. CVF now has an implemented structural retrieval capability, but it still lacks a clean CVF-native doctrine packet for:
   - what a compiled knowledge artifact is
   - how compilation is governed before query
   - how maintenance/refactor operations map into existing owner surfaces
4. Opening another implementation tranche before this doctrine uplift would violate the repo's own priority standard and would increase the risk of local optimizations without owner-surface clarity.

Therefore, the default recommendation for any future agent is:

`do W72-T2 first`

Do not spend time re-deciding whether Graphify or LLM-Powered should go next unless a new contradiction appears.

---

## 2. Why This Tranche Is Better Than The Alternatives

### Better than another Graphify implementation tranche

- `StructuralIndex` already exists in CPF after `W72-T1`.
- The next marginal value is not "more graph code"; it is making the knowledge lifecycle above that code explicit and CVF-native.
- Without doctrine, future Graphify expansion risks drifting into ad hoc retrieval preference or pseudo-governance.

### Better than Palace follow-up

- Palace runtime and code remain rejected in current form.
- Its accepted value is vocabulary only, not the main driver of the next uplift.

### Better than PVV reopen

- PVV/API-key lane remains paused in handoff.
- This knowledge uplift is local, additive, and does not depend on secrets or provider availability.

### Better than whitepaper-first work

- Whitepaper edits would be premature before the doctrine packet is stabilized.
- W72-T2 should produce the doctrine/governance packet that later whitepaper work can reference.

---

## 3. Governing Inputs

The next agent must use this read order:

1. `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
2. `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
3. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md`
4. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_PROMOTION_AND_REJECTION_MAP_2026-04-13.md`
5. `docs/baselines/CVF_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_GC021_FAST_LANE_AUDIT_2026-04-13.md`
6. `docs/baselines/CVF_GC018_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_AUTHORIZATION_2026-04-13.md`

Do not restart from the 3 source folders unless a factual contradiction is found.

---

## 4. Tranche Objective

Produce a CVF-native doctrine/governance packet that absorbs the accepted `LLM-Powered` value into existing owner surfaces, while explicitly relating it to the newly landed `StructuralIndex` enhancement.

The packet must answer these 4 questions clearly:

1. What is a `Compiled Knowledge Artifact` in CVF terms?
2. Where does `Govern` sit between `Compile` and `Query`, and what does that gate mean?
3. How do compiled artifacts, structural index retrieval, and context packaging relate without creating a new architecture surface?
4. Which maintenance/refactor responsibilities belong to Knowledge Layer, Context Builder, and Learning Plane?

---

## 5. Hard Boundaries

### In scope

- CVF-native doctrine and governance documentation
- owner-surface clarification
- lifecycle clarification for knowledge compilation
- compiled-context governance framing
- maintenance/refactor owner mapping
- handoff update for default next step

### Out of scope

- no code changes
- no runtime changes
- no provider lane work
- no CLI reopening
- no new guard family
- no Palace code rescue
- no whitepaper canonical rewrite
- no new default policy that claims graph-first or compiled-first superiority without benchmark evidence

---

## 6. Expected Authorization Posture

This tranche should be opened as a docs/governance-first wave.

Recommended authorization shape:

- First choice: `GC-021` Fast Lane, if scope remains documentation-only and additive
- Escalate to `GC-018` only if the packet expands into canon-surface promotion or any implementation-adjacent change

The next agent should not stall on "what should be proposed". The proposal is already defined by this roadmap.

---

## 7. Deliverables

The next agent should produce these outputs in order.

### Deliverable A

`docs/reference/CVF_KNOWLEDGE_COMPILATION_LIFECYCLE_POLICY_2026-04-14.md`

Purpose:

- define the corrected 6-step lifecycle in CVF-native terms
- explain each step's owner surface
- make `Govern` explicit between `Compile` and `Query`

### Deliverable B

`docs/reference/CVF_COMPILED_KNOWLEDGE_ARTIFACT_STANDARD_2026-04-14.md`

Purpose:

- define what a compiled knowledge artifact is
- define minimum provenance/governance expectations
- clarify that prompt/config/schema files are not governance authority by themselves

### Deliverable C

`docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md`

Purpose:

- define how compiled artifacts may feed context packaging
- relate compiled artifacts to `KnowledgeQuery`, `KnowledgeRanking`, and `StructuralIndex`
- preserve fallback to raw sources under governance

### Deliverable D

`docs/reference/CVF_KNOWLEDGE_MAINTENANCE_AND_REFACTOR_OWNER_MAP_2026-04-14.md`

Purpose:

- map lint, contradiction detection, drift, orphan detection, staleness, and refactor operations to existing CVF owners
- keep them out of standalone-engine inflation

### Deliverable E

`AGENT_HANDOFF.md` update

Purpose:

- record `W72-T2` as the default next recommended tranche
- prevent future agents from re-litigating the queue

---

## 8. Required Content Rules

The next agent must preserve these decisions:

1. `LLM-Powered` is the primary doctrine source.
2. `Graphify` is an enhancement to Knowledge Layer, not a new layer.
3. `StructuralIndex` remains a retrieval mode, not a lifecycle step.
4. `Palace` contributes vocabulary only.
5. `Schema -> Governance Layer` direct mapping is rejected.
6. `Persistent Wiki` as parallel authority is rejected.
7. `G-GM-*` guard family remains rejected.
8. `Compiled-first` and `graph-first` may be discussed as candidate preferences, not declared as defaults.

---

## 9. Work Sequence

### Step 1 — Build The Doctrine Packet Skeleton

Before drafting prose, create a compact matrix:

- accepted concept
- original source cluster
- CVF owner surface
- doctrine effect
- rejected overreach to strip out

Goal:

- prevent policy drift and vocabulary inflation

### Step 2 — Write Lifecycle Policy First

Write Deliverable A before anything else.

Goal:

- lock the 6-step lifecycle as the governing spine for the rest of the packet

### Step 3 — Define The Artifact Standard

Write Deliverable B second.

Goal:

- ensure `Compile` has a governed output, not just a philosophical description

### Step 4 — Define Context Governance

Write Deliverable C third.

Goal:

- connect compiled artifacts to actual Knowledge Layer / Context Builder behavior without opening new runtime surfaces

### Step 5 — Define Maintenance Ownership

Write Deliverable D fourth.

Goal:

- prevent lint/refactor/drift language from turning into a parallel subsystem

### Step 6 — Update Handoff

Write Deliverable E last.

Goal:

- make the repo's default continuation explicit

---

## 10. Definition Of Done

This tranche is done when:

1. the 4 doctrine docs exist in CVF-native language
2. the corrected lifecycle appears consistently everywhere
3. `Govern` is explicit and not optional
4. compiled knowledge is defined without creating a parallel runtime
5. maintenance/refactor operations are mapped to existing owner surfaces
6. no new guard family or architecture surface is introduced
7. `AGENT_HANDOFF.md` names `W72-T2` as the default next tranche

---

## 11. Stop Conditions

The next agent must stop and escalate only if one of these happens:

1. the doctrine packet cannot be written without reopening rejected top-line verdicts
2. the work starts requiring code changes
3. the work starts requiring whitepaper canon edits to stay coherent
4. a real owner-surface contradiction is found between synthesis note and current repo truth

If none of those happen, the next agent should finish the doctrine packet in one pass.

---

## 12. Follow-On After W72-T2

Only after `W72-T2` is clean should the repo consider the next follow-on candidate:

`W72-T3 — benchmarked knowledge preference / compiled-context follow-up`

Possible later branches from there:

1. benchmark whether compiled artifacts should become preferred context input
2. benchmark whether structural index should influence retrieval preference
3. reopen W7-aligned vocabulary enrichment for Palace metadata only

None of those should start before `W72-T2` closes.

---

*Prepared 2026-04-14 as the default next-tranche recommendation for the Graphify / LLM-Powered / Palace lane after W72-T1 StructuralIndex closure.*
