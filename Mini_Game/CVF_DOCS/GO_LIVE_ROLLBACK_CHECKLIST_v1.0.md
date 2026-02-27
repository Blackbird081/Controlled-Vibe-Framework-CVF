# Go-Live & Rollback Checklist - Mini Game v1.0

## A) Go-Live Readiness

### Product & UX
- [x] 3 mini game hoat dong on dinh.
- [x] Parent Mode + PIN lock hoat dong.
- [x] Onboarding va feedback UX ro rang.
- [ ] Pilot UAT voi nguoi dung that dat pass criteria.

### Quality
- [x] `npm run lint` PASS
- [x] `npm run test:run` PASS
- [x] `npm run build` PASS
- [x] Perf benchmark lab PASS

### Compliance
- [ ] Media asset license audit PASS.
- [x] Khong thu thap PII trong telemetry co ban.

### Operations
- [x] Co release notes RC.
- [x] Co bug/test/change history.
- [ ] Chot owner theo doi post-release (24h/72h).

---

## B) Go-Live Steps

1. Dong tat ca blocker (pilot + asset license).
2. Freeze code va tai lieu release.
3. Tag release `v1.0.0`.
4. Publish huong dan su dung cho phu huynh.
5. Theo doi 24h dau:
   - crash
   - bug report
   - parent feedback

---

## C) Rollback Trigger

Rollback ngay neu co 1 trong cac truong hop:
- Loi Critical lam app khong choi duoc.
- Parent Mode/PIN lock bi bypass.
- Loi safety/privacy nghiem trong.

---

## D) Rollback Steps

1. Tam dung phat hanh ban moi.
2. Quay lai ban on dinh gan nhat (`v1.0.0-rc1` snapshot).
3. Ghi incident vao `BUG_HISTORY.md`.
4. Mo lai CVF Phase C de fix.
5. Re-run gate: lint/test/build/perf truoc khi phat hanh lai.
