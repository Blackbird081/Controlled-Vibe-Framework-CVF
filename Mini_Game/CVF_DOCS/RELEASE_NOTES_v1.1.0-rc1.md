# Release Notes - v1.1.0-rc1

**Date:** 2026-02-27  
**Scope:** `Mini_Game/webapp`  
**Type:** Feature uplift release candidate (post-MVP, full 8-proposal engineering delivery)

---

## 1) Highlights

- Hoan tat trien khai engineering cho full 8 de xuat nang cap theo 2 truc: learning value + engagement.
- UI duoc bo cuc lai theo tab view (`Play / Parent / Settings`) de giam scroll va de quan sat.
- Nhoi day gameplay loop voi mini-game logic + adaptive tuning + learning suggestion.
- Mo rong reward/progression thanh avatar + pet + detective tool unlock.

---

## 2) New modules (this RC cycle)

- `src/lib/adaptive-engine/`
- `src/lib/learning-path-service/`
- `src/lib/content-bank/`
- `src/lib/rewards-service/`
- `src/lib/report-service/`
- `src/lib/experiment-service/`

---

## 3) Full 8-proposal implementation status

1. Age differentiation (real behavior): PASS
   - Age profile `5-6 / 7-8 / 9-10` doi noi dung + pace + hint theo game.
   - Evidence: `src/lib/content-bank/index.ts`, `src/app/page.tsx`.
2. Adaptive Difficulty Engine: PASS
   - Rolling window tuning theo ket qua gan day (accuracy/speed/time).
   - Evidence: `src/lib/adaptive-engine/index.ts`, `src/lib/adaptive-engine/adaptive-engine.test.ts`.
3. Personal learning path: PASS
   - Skill profile theo game + goi y bai yeu uu tien.
   - Evidence: `src/lib/learning-path-service/index.ts`, `src/lib/learning-path-service/learning-path-service.test.ts`.
4. Parent/Teacher dashboard: PASS
   - Weekly report (trend, weak spot, recommendation, teacher summary).
   - Evidence: `src/lib/report-service/index.ts`, `src/components/ui-shell/ParentModePanel.tsx`.
5. Game loop expansion: PASS
   - Them mini-game `logic` va quest progress tuong ung.
   - Evidence: `src/lib/game-core/logic.ts`, `src/lib/game-core/logic.test.ts`, `src/app/page.tsx`.
6. Meta-progression depth: PASS
   - Reward loop mo rong unlock/equip detective tool.
   - Evidence: `src/lib/rewards-service/index.ts`, `src/app/page.tsx`.
7. Accessibility & safety: PASS
   - Color assist mode, TTS control, per-session play cap.
   - Evidence: `src/lib/game-core/color.ts`, `src/lib/progress-service/storage.ts`, `src/app/page.tsx`.
8. A/B test + telemetry baseline: PASS
   - Sticky experiment assignment + exposure event + expanded event schema.
   - Evidence: `src/lib/experiment-service/index.ts`, `src/lib/telemetry.ts`, `src/app/api/telemetry/route.ts`.

---

## 4) Telemetry schema updates

- Added:
  - `experiment_exposure`
  - `boss_round_start`
  - `boss_round_win`
  - `boss_round_fail`
  - `daily_chest_open`
  - `sticker_unlock`
  - `self_challenge_win`
  - `weekly_report_view`
- Synced allow-list for:
  - `zone_enter`, `zone_unlock`, `node_complete`, `language_switch`

---

## 5) Quality gate snapshot (2026-02-27)

- Lint: PASS (`npm run lint`)
- Unit tests: PASS (`npm run test:run`, 51 tests)
- Build: PASS (`npm run build`)

---

## 6) QA/UAT changelog focus (quick checklist)

- Verify age profile switch changes prompt style + round behavior in all 4 mini-games.
- Verify adaptive band changes after streak good/bad rounds, no abrupt impossible jumps.
- Verify learning recommendation points to weakest skill and can jump direct to target game.
- Verify Parent tab shows weekly trend, weak area and teacher summary without layout break.
- Verify logic mini-game sequence generation validity across age groups.
- Verify reward unlock/equip for avatar/pet/tool persists after reload.
- Verify color assist markers + session cap stop play when remaining time reaches 0.
- Verify telemetry emits `experiment_exposure` once per profile/session flow and API allow-list accepts new events.

---

## 7) Known gap before public

- Pilot UAT real users chua co ket qua dien day du trong `PILOT_UAT_RESULTS_2026-02-26.md`.
- Public release gate van can close KPI + sign-off matrix sau pilot.
