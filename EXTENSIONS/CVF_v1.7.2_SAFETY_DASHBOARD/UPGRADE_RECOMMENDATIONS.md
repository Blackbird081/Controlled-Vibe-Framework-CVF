# CVF V2.1 — Khuyến Cáo Nâng Cấp Tiếp Theo

> **Cập nhật**: 2026-02-23
> **Phiên bản hiện tại**: V2.1.0

---

## 🔴 HIGH IMPACT

| # | Feature | Mô tả | Effort |
|---|---|---|---|
| 1 | **E2E Tests (Playwright)** | Test full user flow trên browser — click R3 → verify hardStop → freeze | ~2h |
| 2 | **Custom Strategy Builder** | UI tạo governance profile tùy chỉnh (drag thresholds, set policies) | ~3h |

## 🟡 MEDIUM IMPACT

| # | Feature | Mô tả | Effort |
|---|---|---|---|
| 3 | **i18n (Đa ngôn ngữ)** | Vietnamese ↔ English toggle | ~1.5h |
| 4 | **PWA + Offline** | Service worker → installable, work offline | ~1h |
| 5 | **Undo/Redo** | Command pattern — cho phép undo risk/phase change | ~2h |
| 6 | **IndexedDB Migration** | Thay localStorage → IndexedDB cho datasets lớn + binary data | ~1.5h |

## 🟢 ADVANCED

| # | Feature | Mô tả | Effort |
|---|---|---|---|
| 7 | **AI Risk Assessment** | Integrate LLM API phân tích code diff → tự suggest R-level | ~4h+ |
| 8 | **Role-based Access** | Login + JWT → Admin vs Viewer — cần backend | ~5h+ |
