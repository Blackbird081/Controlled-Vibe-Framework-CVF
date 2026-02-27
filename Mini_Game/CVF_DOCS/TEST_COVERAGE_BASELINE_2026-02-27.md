# Test Coverage Baseline - Mini Game

**Date:** 2026-02-27  
**Project:** `Mini_Game/webapp`  
**Command:** `npm run test:coverage`

---

## 1) Coverage gate config

- Runner: Vitest + `@vitest/coverage-v8`
- Config file: `Mini_Game/webapp/vitest.config.ts`
- Script: `npm run test:coverage`

### Current enforced threshold (Phase C uplifted)

- Statements >= **80%**
- Branches >= **60%**
- Functions >= **80%**
- Lines >= **80%**

> Ghi chu: Threshold da duoc nang len sau khi bo sung test cho `progress-service/storage.ts` va `api/telemetry/route.ts`.

---

## 2) Latest measured result (2026-02-27)

Tu `coverage/coverage-summary.json`:

- Statements: **85.54%**
- Branches: **66.99%**
- Functions: **86.36%**
- Lines: **88.31%**

Status: **PASS** (vuot threshold baseline).

---

## 3) Scope duoc tinh coverage

- `src/lib/game-core/color.ts`
- `src/lib/game-core/math.ts`
- `src/lib/game-core/memory.ts`
- `src/lib/game-core/types.ts`
- `src/lib/progress-service/storage.ts`
- `src/app/api/telemetry/route.ts`

---

## 4) Coverage uplift plan (bat buoc cho release chat luong cao)

- [x] Tang test cho `progress-service/storage.ts` (nhanh nhat de tang branch/functions).
- [x] Them test cho telemetry + API route.
- [x] Nang threshold len:
  - Statements >= 80%
  - Branches >= 60%
  - Functions >= 80%
  - Lines >= 80%
- [ ] Muc tieu pre-public release:
  - Statements >= 85%
  - Branches >= 70%
  - Functions >= 85%
  - Lines >= 85%
