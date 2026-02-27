# CVF Full 8 Proposals Execution Roadmap

**Date:** 2026-02-27  
**Scope:** `Mini_Game/webapp`  
**Owner:** CVF Engineering

---

## 1) Goal

Nang cap toan bo 8 de nghi theo 2 truc:
- Gia tri hoc tap (learning value)
- Do bam choi (engagement retention)

---

## 2) 8 proposals and delivery target

1. Age differentiation (real behavior):
   - DONE (engineering): age-specific content/rules/feedback integrated.
2. Adaptive Difficulty Engine:
   - DONE (engineering): dynamic tuning by recent rounds (accuracy + speed + timeout).
3. Personal learning path:
   - DONE (engineering): per-skill profile + weak-skill recommendation in gameplay loop.
4. Parent/Teacher dashboard:
   - DONE (engineering): weekly report, trend, weak spot, teacher summary.
5. Game loop expansion:
   - DONE (engineering): added logic mini-game and typed stats integration.
6. Meta progression depth:
   - DONE (engineering): detective tool unlock/equip progression added.
7. Accessibility & safety upgrade:
   - DONE (engineering): color assist mode + session cap + settings polish.
8. A/B test + telemetry baseline:
   - DONE (engineering): experiment assignment + exposure event + telemetry expansion.

---

## 3) Execution phases

### Phase U1 - Core intelligence
- Proposal #2, #3
- New modules:
  - `src/lib/adaptive-engine/`
  - `src/lib/learning-path-service/`
- Status: DONE

### Phase U2 - Gameplay scale + progression depth
- Proposal #5, #6
- New game key and generation flow
- Tool unlock flow linked to rewards/progression
- Status: DONE

### Phase U3 - Parent/safety/experiments
- Proposal #4, #7, #8
- Dashboard expansion
- Safety controls and accessibility toggles
- Experiment assignment + telemetry schema extension
- Status: DONE

---

## 4) Definition of done (engineering)

- `npm run test:run` PASS
- `npm run lint` PASS
- `npm run build` PASS
- No runtime error in local dev flow
- Updated docs:
  - this roadmap
  - implementation summary in release notes / phase progress

---

## 5) Risks and controls

- Risk: adding new mini-game can break typed stats/report.
  - Control: update `MiniGameKey` centrally and fix all typed records + tests.
- Risk: adaptive loop may create unstable difficulty jumps.
  - Control: clamp tuning values and use 10-round rolling window.
- Risk: telemetry scope creep.
  - Control: strict event allow-list in API route.

---

## 6) Post-implementation actions

1. Execute pilot UAT with real users and collect KPI in `PILOT_UAT_REAL_USERS_v1.0.md`.
2. Monitor D1/D7 retention + drop-off telemetry to validate balancing assumptions.
3. Close release sign-off matrix and flip pre-public gate verdict when UAT passes.
