# CVF System Unification Web Alignment Delta

> Date: `2026-03-20`
> Type: Post-fix baseline delta
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Prior delta: `docs/baselines/CVF_SYSTEM_UNIFICATION_PHASE1_DELTA_2026-03-19.md`
> Scope: User-facing Web UI, prompt export, and non-coder semantics alignment to the canonical `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE` model

---

## 1. Purpose

This delta records the next implementation wave after backend/shared-contract alignment.

Its purpose is to preserve a separate comparison anchor for the moment when CVF stopped being canonically correct only in backend/runtime surfaces and became materially aligned in the user-facing Web layer as well.

---

## 2. What Changed In This Delta

### User-facing semantics aligned

- natural-language intent detection now defaults to canonical `INTAKE` instead of legacy `DISCOVERY`
- friendly labels and non-coder labels now expose `INTAKE` and `FREEZE`
- project progress and guard dashboard now show the canonical 5-phase model
- approval mock data and UI examples no longer use legacy `DISCOVERY` as the primary phase example

### Guided execution surfaces aligned

- phase checklist model now uses canonical phases and adds an explicit `FREEZE` checklist
- phase gate modal now supports the additional freeze closure step
- agent chat phase metadata, badges, and gate behavior now align to canonical uppercase phases
- workflow visualizer now presents the full `Intake -> Design -> Build -> Review -> Freeze` sequence

### Spec and prompt truthfulness improved

- `SpecExport` no longer markets Full Mode as a 4-phase protocol
- exported Full Mode prompt now explicitly includes `FREEZE` as a closure step
- help content, docs data, and AI provider guidance now describe the canonical 5-phase model
- app builder and development template guidance were updated to include freeze closure language

---

## 3. Verification Evidence

Executed on `2026-03-20`:

- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/lib/agent-chat.test.ts src/lib/non-coder-language.test.ts src/lib/cvf-checklists.test.ts src/components/WorkflowVisualizer.test.tsx src/components/AgentChatMessageBubble.test.tsx src/components/DecisionLogSidebar.test.tsx src/components/AgentChat.test.tsx`
  - result: `7 test files, 142 passed`
- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/lib/guard-runtime-adapter.test.ts src/app/api/execute/route.test.ts`
  - result: `2 test files, 86 passed`
- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/components/SpecExport.test.tsx src/components/AppBuilderWizard.test.tsx`
  - result: `2 test files, 38 passed`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
  - result: pass

---

## 4. Current Posture After This Delta

Web posture is now:

- canonically aligned in its core non-coder labels, progress indicators, guard dashboard, phase gating, workflow visualizer, and exported full-mode prompt
- substantially less likely to teach or reinforce the old `4-phase / 6-guard` worldview

Still not fully closed:

- cross-extension workflow realism remains open
- controlled execution loop is clearer in UX, but still not fully implemented as one end-to-end canonical runtime everywhere
- some legacy alias support remains in compatibility-facing text and parsing paths by design

---

## 5. Gap Readout After This Delta

- `G1 canonical guard model drift`: `MATERIALLY REDUCED`
- `G4 Web UI model drift`: `MATERIALLY REDUCED`
- `G5 docs and product framing drift`: `PARTIALLY REDUCED`
- `G2 governance not fully executable`: still open outside the already-remediated runtime and shared-contract path
- `G3 cross-extension workflow scaffolding`: still open
- `G6 controlled autonomy loop incomplete`: still open

---

## 6. Next Comparison Anchor

The next reconciliation should focus on:

1. governance ownership mapping for every critical control
2. real `intent -> plan -> approve -> execute -> review -> freeze` loop execution
3. replacing scaffolded workflow behavior with real cross-extension execution
4. final documentation and positioning alignment once runtime truth is fully closed

---

## 7. Current Verdict

- Web/UI alignment status: `STRONG PROGRESS`
- Prompt/export truthfulness: `MATERIALLY IMPROVED`
- Whole-system integration status: `IMPROVED BUT STILL PARTIAL`
- Recommended next priority: `CONTROL LOOP CLOSURE AND CROSS-EXTENSION WORKFLOW REALIZATION`
