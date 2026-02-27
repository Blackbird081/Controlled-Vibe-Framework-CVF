# Phase C Quality Upgrade - 2026-02-27

**Muc tieu:** Nang cap tu MVP len quality baseline gan checklist `CVF_KID_GAME_QUALITY_CHECKLIST_2026-02-26.md`.

## Pham vi da lam trong dot nay

- [x] Bo sung age profile (`5-6`, `7-8`, `9-10`) de can chinh do kho theo nhom tuoi.
- [x] Bo sung audio controls (mute, volume, UI sfx toggle) + local persistence.
- [x] Bo sung TTS cho cau hoi (manual + auto read) va telemetry su dung TTS.
- [x] Bo sung PWA/offline baseline:
  - `manifest.webmanifest`
  - `service worker` cache shell
  - offline fallback page
- [x] Bat buoc test coverage cho project:
  - them script `npm run test:coverage`
  - them threshold enforcement trong `vitest.config.ts`
  - luu baseline report trong `TEST_COVERAGE_BASELINE_2026-02-27.md`
- [x] Mo rong test suite (22 tests) cho:
  - `progress-service/storage.ts`
  - `api/telemetry/route.ts`
- [x] Nang threshold coverage len:
  - Statements >= 80%
  - Branches >= 60%
  - Functions >= 80%
  - Lines >= 80%
- [x] Bo sung telemetry events cho quality loop:
  - `round_start`
  - `celebration_burst`
  - `age_profile_change`
  - `audio_update`
  - `tts_update`
  - `tts_speak`
- [x] Bo sung thong diep safety: telemetry an danh, khong thu thap PII.
- [x] Dong bo API telemetry allow-list voi event moi.

## Mapping voi checklist

- Checklist Muc 1 (Target users): **Da co profile theo tuoi trong UI/game loop**.
- Checklist Muc 5 (Audio/Accessibility): **Da co mute + volume + UI sfx control**.
- Checklist Muc 5 (Audio/Accessibility): **Da co TTS cho cau hoi va auto-read cho tre nho**.
- Checklist Muc 6 (Safety): **Da hien thi ro pham vi telemetry an danh**.
- Checklist Muc 8 (Telemetry): **Da co event bo sung cho phan tich drop/flow**.
- Checklist Muc 7 (Performance/Reliability): **Da co offline fallback co ban qua service worker**.
- Checklist Muc 9 (Coverage): **Da co command + threshold + baseline evidence**.

## Ket qua quality gate ky thuat

- `npm run lint`: PASS
- `npm run test:run`: PASS
- `npm run build`: PASS

## Backlog tiep theo (Phase C tiep)

- [ ] Them TTS cho cau hoi (uu tien nhom 5-6 tuoi).
- [ ] Cai tien telemetry dashboard de doc completion/drop-off theo profile tuoi.
- [ ] UAT thuc te tren mobile de xac nhan service worker khong gay stale cache.
- [ ] Them co che cap nhat cache tu dong theo version release note.
