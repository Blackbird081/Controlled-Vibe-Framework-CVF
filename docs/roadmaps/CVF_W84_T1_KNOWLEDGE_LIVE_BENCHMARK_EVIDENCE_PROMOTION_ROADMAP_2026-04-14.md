# CVF W84-T1 Roadmap — Knowledge Live Benchmark Evidence Promotion

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Status prerequisite: knowledge-native lane W71-W83 is fully closure-clean and value-delivered
> Purpose: define the only acceptable CVF path for promoting knowledge benchmark evidence beyond the current contract-layer `PROPOSAL_ONLY` posture
> Authority posture: roadmap only; execution requires a fresh bounded `GC-018`

---

## 1. Why This Tranche Exists

W78-T1 closed the knowledge evidence gate using the **contract-layer closure** standard:

- `PROPOSAL_ONLY` evidence
- explicit gate-by-gate assessment
- GC-026 trace record
- decision: `HYBRID / NO SINGLE DEFAULT`

That closure is valid and remains canon.

However, if CVF wants to go beyond contract-layer evidence and claim **live runtime evidence**, that work must happen through a new, formal tranche.

This roadmap exists to prevent quality erosion.

It explicitly rejects low-discipline shortcuts such as:

- committing ad hoc live benchmark files without authorization
- filing lightweight supplement notes instead of a governed evidence packet
- treating exploratory runs as repo truth
- using “it confirms existing canon anyway” as a reason to skip governance

CVF core value must remain higher than convenience. Evidence promotion is therefore a **governed tranche**, not a casual follow-up.

---

## 2. Tranche Identity

**Tranche ID:** `W84-T1`

**Name:** `Knowledge Live Benchmark Evidence Promotion`

**Recommended class:** `VALIDATION_EVIDENCE / GOVERNED_RUNTIME_BENCHMARK`

**Primary targets:**

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
- `docs/baselines/`
- `docs/assessments/`
- `AGENT_HANDOFF.md`

**Secondary reference targets:**

- `docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md`
- `docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md`
- `docs/assessments/CVF_W83_T1_POST_KNOWLEDGE_NATIVE_MASTER_ARCHITECTURE_REASSESSMENT_2026-04-14.md`

---

## 3. Tranche Goal

Run an authorized live benchmark wave that upgrades the knowledge benchmark narrative from:

- contract-layer `PROPOSAL_ONLY`

to:

- governed live-runtime evidence with explicit run manifest, reproducible traces, and a formal decision packet

without weakening any existing canon boundary.

This tranche is **not** allowed to invent a better story than the evidence supports.

If live evidence still supports `HYBRID / NO SINGLE DEFAULT`, the tranche must say so plainly.

---

## 4. Non-Negotiable Quality Principle

The governing principle for W84-T1 is:

> **CVF core value outranks speed, convenience, and shallow “good enough” evidence capture.**

Therefore:

1. every live result must be reproducible enough to audit
2. every benchmark claim must be tied to a declared metric and trace
3. every interpretation must be conservative
4. no evidence may enter repo truth without the full governance chain

If this discipline feels heavy, that is expected. The weight is the quality standard.

---

## 5. Mandatory Inputs

Future agents executing W84-T1 must read these first:

1. `AGENT_HANDOFF.md`
2. `docs/roadmaps/CVF_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_ROADMAP_2026-04-14.md`
3. `docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md`
4. `docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md`
5. `docs/assessments/CVF_W83_T1_POST_KNOWLEDGE_NATIVE_MASTER_ARCHITECTURE_REASSESSMENT_2026-04-14.md`
6. `docs/baselines/CVF_W78_T1_BENCHMARK_EVIDENCE_PACKET_2026-04-14.md`
7. `docs/baselines/CVF_GC026_TRACKER_SYNC_W78_T1_N2_BENCHMARK_EVIDENCE_CLOSURE_2026-04-14.md`
8. any exploratory local benchmark helper only if explicitly authorized into the tranche scope

Do **not** reopen the original Graphify / LLM-Powered / Palace source folders.

---

## 6. Mandatory Outputs

### A. GC-018 authorization

One explicit authorization packet that names:

- benchmark scope
- model/provider lane
- scenario count
- run count
- evidence class target
- out-of-scope shortcuts

### B. Governed live benchmark tool surface

If a benchmark runner file is committed, it must be committed **as an authorized tranche artifact**, not as an orphan helper.

It must document:

- required env vars
- provider/model choice
- skip behavior without credentials
- exact command to run
- trace/log output format

### C. Run manifest

One manifest that records:

- all scenarios
- all runs
- timestamps
- provider/model
- run IDs
- pass/fail status
- operator/reviewer sign-off fields

### D. Live evidence packet

One governed evidence packet with:

- per-scenario results
- per-gate assessment
- variance across runs
- latency numbers
- precision comparison against baseline
- explicit evidence class
- explicit decision

### E. Post-run quality assessment

One assessment that answers:

- did the evidence actually improve certainty?
- does canon need to change?
- is current policy confirmed or challenged?

### F. GC-026 sync

One tracker sync recording the outcome.

### G. Handoff update

One handoff update stating:

- W84 outcome
- whether canon changed
- whether benchmark tooling remains approved for future reuse

---

## 7. Required Benchmark Design

At minimum, W84-T1 must include:

1. **3 distinct scenarios**
2. **2 independent runs per scenario**
3. **compiled-context path**
4. **raw-query baseline path**
5. **the same question set across both paths**
6. **declared precision metric**
7. **declared consistency rule**

The benchmark must be designed so the model can only answer correctly from the provided context, not from general world knowledge.

If contamination risk exists, the scenario design is insufficient and must be redone.

---

## 8. Exact Execution Order

### Step 1 — Authorization first

Write and approve GC-018 before committing any benchmark runner or evidence note.

No exceptions.

### Step 2 — Tool formalization

Only after authorization, formalize the live benchmark runner as a governed tranche artifact.

If a local exploratory file already exists, it must be reviewed and either:

- adopted into W84 scope explicitly, or
- kept out of repo truth

### Step 3 — Manifest freeze

Freeze:

- scenarios
- metrics
- provider/model
- pass criteria
- run count

before running benchmarks.

### Step 4 — Execute live runs

Run the benchmark as declared.

Do not edit scenarios midstream to “improve” results.

### Step 5 — Evidence packet

Write the evidence packet from actual run output only.

### Step 6 — Assessment and decision

Write the quality assessment deciding one of:

- `HYBRID / NO SINGLE DEFAULT CONFIRMED`
- `COMPILED-PREFERRED DEFAULT SUPPORTED`
- `GRAPH-INFORMED DEFAULT SUPPORTED`
- `LIVE EVIDENCE INCONCLUSIVE`

### Step 7 — Sync and handoff

Record the result in GC-026 and handoff.

---

## 9. Hard Boundaries

W84-T1 must **not**:

- relitigate W71-W83 absorption closure
- bypass GC-018 with a “small note” or “supplement”
- commit exploratory benchmark code outside tranche scope
- change policy defaults without explicit evidence packet conclusion
- cherry-pick only successful runs
- hide failed or noisy runs
- downgrade the standard because the live run is expensive

If the evidence is mixed, record it as mixed.

If the evidence is weak, record it as weak.

CVF quality is preserved by honesty, not by favorable framing.

---

## 10. Exit Criteria

`W84-T1` is closure-ready only when all of the following are true:

1. GC-018 authorization exists
2. live benchmark tool surface is formally scoped
3. run manifest exists
4. live evidence packet exists
5. post-run quality assessment exists
6. GC-026 sync exists
7. handoff states the result and canon impact clearly

If any one of these is missing, W84-T1 is not closure-ready.

---

## 11. Canon Decision Rule

W84-T1 does **not** automatically force a canon change.

The allowed outcomes are:

- live evidence confirms current canon
- live evidence supports a stricter default
- live evidence remains inconclusive

Any canon change after W84 must be promoted through its own explicitly documented decision path.

---

## 12. Rebuttal To Easy Paths

The following are explicitly rejected as non-CVF-compliant for this topic:

- “commit the live benchmark file first, document later”
- “add one supplement note only”
- “it only confirms existing policy, so no tranche is needed”
- “12 calls is too small for full governance, but enough for repo truth”

These are all forms of evidence laundering.

CVF must not accept them.

---

*Filed: 2026-04-14*
*This roadmap defines the only acceptable CVF-standard path for live knowledge benchmark evidence promotion.*
