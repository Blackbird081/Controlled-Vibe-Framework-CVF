# CVF CPF Typecheck Cleanup Delta (2026-03-26)

Memory class: SUMMARY_RECORD

Status: canonical receipt for cleaning legacy TypeScript drift in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` so package-level typecheck returns to a clean state.

## Purpose

- remove legacy typecheck noise that obscured new Control Plane work
- restore truthful `npm run check` status for `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
- align older test fixtures with current shared types and test-runner globals

## What Changed

- updated `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tsconfig.json` to load `vitest/globals`
- repaired stale `RankableKnowledgeItem` fixtures in boardroom and reverse-prompting tests
- verified the previously failing clarification-refinement and knowledge-query test files typecheck cleanly under the corrected config

## Operational Effect

From this delta onward, `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` returns to a clean package-level TypeScript posture for the previously failing legacy test surfaces.

## Verification

- `npm run check` in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` -> PASS
- focused Vitest batch for the repaired test surfaces -> PASS
