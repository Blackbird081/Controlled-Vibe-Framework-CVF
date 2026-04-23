<!-- Memory class: SUMMARY_RECORD -->

# CVF W119-T1 Non-Coder Adoption Scenario Lock

> Date: 2026-04-23
> Status: LOCKED
> Roadmap: `docs/roadmaps/CVF_W119_T1_NONCODER_ADOPTION_PROOF_AND_EVIDENCE_UX_ROADMAP_2026-04-23.md`
> Evidence boundary: live governance claims require a real `/api/execute` provider call.

---

## Locked Claim

A non-coder can complete a first useful governed workflow in CVF Web, including project knowledge use and evidence receipt, without reading architecture docs and without raw-key leakage.

This lock is bounded to the active CVF Web governed `/api/execute` path, Alibaba/DashScope-compatible live lane, local in-process/file-backed knowledge store behavior, and tested workspace/bootstrap patterns.

---

## Scenario 1 — First Governed Output

**User story:** A non-coder opens Web, sees whether a live task can run, chooses a safe documentation/business task, and receives a useful governed result.

**Input fixture:**

- Template: `documentation`
- Intent: `Create a simple handoff checklist for onboarding a new sales assistant.`
- Required fields: practical onboarding notes, target reader, expected output.
- Risk: `R1`
- Expected decision: `ALLOW`

**Expected user-visible evidence:**

- Provider/model shown.
- Governance decision shown.
- Policy snapshot and envelope/receipt id shown.
- Output validation hint shown when present.

**Proof mode:** live API-backed `/api/execute`; UI rendering may be covered by mock tests but cannot close the scenario alone.

---

## Scenario 2 — Knowledge-Assisted Project Task

**User story:** A non-coder loads project knowledge, runs a task against that collection, and sees that CVF used project knowledge.

**Input fixture:**

- Ingest route: `POST /api/knowledge/ingest`
- Collection id: `w119-lumencart-project`
- Knowledge facts: LumenCart, night-market vendors, offline-first, checkout under 30 seconds.
- Execute template: `business_strategy_wizard`
- Intent: `Use project knowledge to create a decision memo for LumenCart onboarding.`
- Expected decision: `ALLOW`

**Expected user-visible evidence:**

- Knowledge source is `retrieval`.
- Collection id is `w119-lumencart-project`.
- Injected chunk count is greater than zero.
- Output contains at least two locked project terms.

**Proof mode:** live API-backed ingest + `/api/execute`; route metadata and raw assessment must not contain raw provider keys.

---

## Scenario 3 — Evidence Handoff

**User story:** A non-coder can copy or export a compact receipt explaining what CVF did before handing the result to another person or agent.

**Input fixture:**

- Reuse the successful governed run from Scenario 1 or Scenario 2.
- Receipt fields: decision, risk, provider, model, routing decision, policy snapshot, envelope id, knowledge source/collection/chunks, approval id when present.

**Expected user-visible evidence:**

- A "What CVF did" panel remains visible after the run completes.
- Export/copy includes a compact receipt section.
- Receipt has an id derived from route-returned evidence, not from a raw key or hidden secret.

**Proof mode:** UI/unit tests may verify rendering/export shape; closure still requires live route evidence pack plus release gate.

---

## Boundary Rules

- Mock checks are UI-only and must not be described as governance proof.
- Workspace doctor status means enforcement artifacts are ready; it does not prove provider reachability.
- Live task readiness means a compatible provider key is present; it must show source name/status only, never the key value.
- Web remains governance-inherited on the active governed route, not the full CVF runtime.
