# CHANGE_HISTORY - Mini Game

## 2026-02-26 - Baseline Web App Construction
- Scaffolded `Mini_Game/webapp` using Next.js + TypeScript.
- Implemented Mini Game 1 (Math Quick Answer).
- Added progress service (score/combo/streak/highscore/badges).
- Added Parent Mode with daily time limit.
- Added Phaser playground scene for engine integration.
- Added telemetry endpoint `/api/telemetry`.
- Consolidated CVF markdown docs under `Mini_Game/CVF_DOCS`.

## 2026-02-26 - MVP Completion (CVF Plan Aligned)
- Completed Mini Game 2 (Memory) and Mini Game 3 (Color Reflex).
- Added anti-frustration hint logic after repeated wrong answers.
- Added parent daily report (round/correct/wrong/accuracy).
- Extended telemetry events: `game_switch`, `hint_shown`.
- Added unit tests with Vitest for game-core and progress-service.
- Passed gates: `lint`, `test:run`, `build`.
- Updated CVF docs bundle (INPUT/OUTPUT/DECISIONS/RISK/UAT) to completed status.
- Added performance benchmark script and evidence file.
- Passed performance gate in lab setup: LCP 1804ms, FPS 53.6.

## 2026-02-26 - Post-MVP Hardening
- Added Parent PIN lock for settings safety.
- Added first-run onboarding modal.
- Added keyboard shortcuts for accessibility and fast play (`1-4`, `R`).
- Re-ran quality gate: lint/test/build PASS.
- Re-ran performance benchmark: avg LCP 650.67ms, avg FPS 60.4 (PASS).

## 2026-02-26 - Pre-Public Release Documentation Pack
- Added pilot UAT real users checklist.
- Added asset/license audit report.
- Added release notes `v1.0.0-rc1`.
- Added go-live + rollback checklist.
- Added pre-public release gate file with PASS/PENDING/BLOCKED status.

## 2026-02-26 - Legacy Asset Separation
- Moved `background.jpg` and `win.mp3` to `Mini_Game/legacy/streamlit_assets/`.
- Updated `Mini_Game/app.py` to resolve assets from legacy folder (Streamlit still runnable).
- Updated asset audit and pre-public gate: asset license blocker removed for webapp release scope.

## 2026-02-26 - Gate Decision Update
- Pre-public gate updated to:
  - `READY FOR INTERNAL PILOT`
  - `NOT READY FOR PUBLIC RELEASE` (pending pilot UAT real users)
