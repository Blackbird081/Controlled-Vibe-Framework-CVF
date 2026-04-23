# CVF W115-T1 Non-Coder Onboarding Experience Roadmap

> Date: 2026-04-23
> Status: PLANNED
> Memory class: SUMMARY_RECORD
> Scope class: PRODUCT UX / FIRST-RUN EXPERIENCE
> Predecessor: W114-T1 (Non-Coder Value Maximization — CLOSED DELIVERED)
> Wave ID: W115

## 0. Problem Statement

W114 proved CVF delivers real non-coder value. The next product question is:

> Can a non-technical person reach that value without reading documentation?

Current friction observed:
- Provider key setup is required before any governed run is possible, but the UI does not guide a new user through this step.
- The main dashboard shows templates, but there is no clear "start here" signal.
- The governance evidence panel (added in W114-CP5) appears only after execution; new users do not know it exists.
- The QuickStart modal was repaired in W109 but still requires the user to find it.

## 1. Goal

> A non-coder visits CVF Web for the first time, completes setup, runs a first governed task, and understands what CVF did — in under 5 minutes, without reading a README.

This is a product usability goal, not a governance architecture goal.

## 2. Architecture Boundary

Allowed changes:
- Web UI components under `src/components/` and `src/app/(dashboard)/`
- First-run state detection using `localStorage` (client-only, no server state)
- Settings modal flow and provider setup guidance
- Template "Try" quick-path shortcut

Not allowed:
- Changes to governance runtime, `/api/execute` logic, or Guard Contract
- Changes to auth, RBAC, or session handling
- New API routes (except where a lightweight status check is needed)
- Mock mode for governance behavior claims

## 3. Checkpoints

### CP1: First-Run State Detection

Deliver:
- Detect unconfigured state on page load (no provider key in settings).
- Show a persistent but dismissable setup banner/callout in the main dashboard when no key is configured.
- Banner links directly to Settings → Provider Keys with the relevant section pre-scrolled.

Acceptance:
- A new user sees the setup prompt without navigating.
- Dismissal is stored in `localStorage` and survives page reload.
- Existing configured users see no change.

### CP2: "Try This" Quick-Path on Top Templates

Deliver:
- The 3 highest-traffic non-coder templates each get a "Try" button that pre-fills a sample prompt.
- Clicking "Try" opens the execution surface with the sample prompt already populated.
- The sample prompt is chosen to demonstrate governance evidence (a borderline-risk or knowledge-native task, not a trivial one).

Acceptance:
- Single click from template card to populated execution surface.
- No configuration required to use the pre-filled path (user still needs a provider key, but the prompt step is removed).
- At least one "Try" sample exercises the governance evidence panel.

### CP3: Progressive Disclosure Onboarding Tour

Deliver:
- A one-time dismissable overlay (shown on first authenticated visit) that highlights:
  1. Where to pick a task (template gallery).
  2. What the governance panel means (30-word plain-language label).
  3. How to configure a provider (link to Settings).
- Tour state stored in `localStorage`.
- Overlay is opaque only for new users; experienced users are never interrupted.

Acceptance:
- Tour renders correctly at all three target viewport widths (mobile/tablet/desktop).
- Dismissing the tour stores `cvf_onboarding_seen=1` in `localStorage`.
- Tour does not conflict with existing QuickStart modal trigger.

### CP4: Onboarding Friction Audit and Evidence

Deliver:
- A written friction audit: step-by-step walkthrough of the "new user → first governed output" path, annotated with blockers and time cost per step.
- Time-to-first-output measurement (target: ≤ 5 minutes from first page load).
- Assessment filed at `docs/assessments/CVF_W115_T1_ONBOARDING_FRICTION_AUDIT_2026-04-23.md`.

Acceptance:
- Audit covers at least: landing, setup, template selection, execution, evidence viewing.
- No regression in existing navigation or governance flows (full Vitest + lint + build pass).
- Time-to-first-output is explicitly measured and recorded.

## 4. Verification Rules

```bash
# Unit tests + lint + build (required after each CP)
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run test:run
npm run lint
npm run build

# Full release gate (required at CP4 closure)
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode valid only for UI structure tests. Governance behavior claims require live API-backed evidence.

## 5. Non-Goals

- Full interactive tutorial with branching paths.
- Email onboarding sequences.
- Analytics or event tracking for onboarding steps.
- Changes to backend governance logic.
- Provider key auto-provisioning.

## 6. Exit Criteria

W115 closes when:
- A new user can reach first governed output without reading README (verified by friction audit).
- CP1 banner appears and dismisses correctly for new vs returning users.
- CP2 "Try" quick-path works on top 3 non-coder templates.
- CP3 tour renders, dismisses, and persists correctly.
- Full release gate PASS (live governance `8 passed`, UI mock `6 passed`).

## 7. Recommended Execution Order

CP1 → CP2 → CP3 → CP4.

CP1 and CP2 are independent and can be developed in parallel. CP4 closes the tranche with evidence.
