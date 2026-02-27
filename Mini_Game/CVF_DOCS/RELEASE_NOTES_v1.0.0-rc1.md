# Release Notes - Mini Game v1.0.0-rc1

**Release type:** Release Candidate (pre-public)  
**Date:** 2026-02-26

---

## Highlights

- Hoan thanh 3 mini game:
  - Toan Nhanh
  - Nho Hinh
  - Phan Xa Mau
- Parent Mode day du:
  - Gioi han phut/ngay
  - Daily report (round/correct/wrong/accuracy)
  - PIN lock cho setting phu huynh
- Onboarding lan dau + keyboard shortcuts (`1-4`, `R`)
- Telemetry co ban + benchmark performance

## Quality gates

- Lint: PASS
- Unit test: PASS
- Build: PASS
- Perf benchmark lab: PASS
  - Avg LCP: 650.67 ms
  - Avg FPS: 60.4

## Known limits (chua public final)

- Chua hoan tat pilot UAT voi nguoi dung that.
- Legacy Streamlit assets duoc giu tam thoi (`Mini_Game/legacy/streamlit_assets`), khong thuoc release scope webapp.

## Next target

- Hoan tat pilot UAT nguoi dung that.
- Chot `v1.0.0` public release.
