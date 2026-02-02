# QA Checklist – Vibecode Starter Kit v0.1

*Checklist để clean basecode trước khi tag v0.1.0 và launch.*

---

## 1. Cấu trúc Repo

### 1.1. Tổ chức JOBs cho user mới

**Vấn đề:** Hiện tại có 7 JOB (JOB-001 → JOB-103) là lịch sử build của kit. User mới có thể bị choáng hoặc nhầm lẫn.

**Giải pháp đề xuất:**

- [ ] Di chuyển JOB-001 → JOB-103 sang `_history/` hoặc `owner/build-history/`
- [ ] Giữ lại `examples/` với 2 JOB mẫu đã có (đủ cho user tham khảo)
- [ ] Đảm bảo `jobs/`, `blueprints/`, `contracts/`, `logs/` trống sạch cho user

**Hoặc:**

- [ ] Thêm note trong README: "Các JOB-001 đến JOB-103 là lịch sử build của kit này, bạn có thể xóa hoặc giữ làm tham khảo"

---

### 1.2. Thêm file VERSION/CHANGELOG

- [ ] Thêm version trong README.md: `v0.1.0`
- [ ] Tạo file `CHANGELOG.md`:
  ```md
  # Changelog

  ## v0.1.0 (2024-XX-XX)
  - Initial release
  - Docs: Overview, Playbook, Quickstart 7 ngày
  - Templates: JOB, Blueprint, Contracts, Log
  - Scripts: vibe.py CLI tool
  - Examples: 2 JOB mẫu
  - Prompts: Master prompts cho ChatGPT & Claude
  - Product: Brief, Packages, Sales Page draft
  - Launch: 30-day launch plan
  ```

---

## 2. Format [OWNER_TODO]

### 2.1. Vấn đề phát hiện

Có **2 format khác nhau** đang được dùng:

1. **Inline format:** `[OWNER_TODO]` hoặc `[OWNER_TODO: mô tả...]` (89 instances)
2. **HTML comment:** `<!-- OWNER_TODO: mô tả... -->` (29 instances)

**Files có HTML comment format:**
- `docs/01_overview.md` (7 instances)
- `docs/02_vibecode_playbook.md` (13 instances)
- `docs/03_quickstart_7_days.md` (10 instances)
- `product/PACKAGES.md` (2 instances)
- `product/PRODUCT_BRIEF.md` (2 instances)

### 2.2. Quyết định cần làm

- [ ] **Option A:** Chuẩn hóa tất cả sang inline format `[OWNER_TODO: ...]`
  - Ưu: Visible khi đọc, dễ search
  - Nhược: Hiển thị trong rendered markdown

- [ ] **Option B:** Giữ HTML comment cho hướng dẫn dài, inline cho nhắc ngắn
  - Ưu: Clean hơn khi render
  - Nhược: Inconsistent

**Recommend:** Option A - thống nhất inline format vì:
- Dễ grep toàn repo: `grep -r "\[OWNER_TODO" .`
- User thấy ngay cần điền gì

### 2.3. Lệnh để search tất cả TODO

```bash
grep -rn "OWNER_TODO" --include="*.md" .
```

---

## 3. Scripts/vibe.py

### 3.1. Điểm tốt

- [x] Dùng `Path(__file__).resolve().parent` → chạy được từ bất kỳ đâu
- [x] Có error handling cho file không tồn tại
- [x] Có skip khi file đã tồn tại (không overwrite)
- [x] Help text rõ ràng với examples

### 3.2. Điểm cần cải thiện

- [ ] Template path trong `cmd_new()` hardcode: `templates/jobs/JOB-intake-template.md`
  - Nhưng file thật là: `templates/jobs/JOB-intake-example.md`
  - **Cần kiểm tra template files có đúng tên không**

- [ ] Verify template files tồn tại:
  ```bash
  ls templates/jobs/
  ls templates/blueprints/
  ls templates/contracts/
  ls templates/logs/
  ```

### 3.3. Test lệnh

- [ ] Test `python scripts/vibe.py --help`
- [ ] Test `python scripts/vibe.py new TEST-001`
- [ ] Test `python scripts/vibe.py pack-architect TEST-001`
- [ ] Test `python scripts/vibe.py pack-coder TEST-001 STEP-1`
- [ ] Test `python scripts/vibe.py log TEST-001 "Test note"`
- [ ] Cleanup: xóa TEST-001 files sau khi test

---

## 4. Prompts

### 4.1. Consistency check

- [x] Architect prompt nhắc đúng cấu trúc thư mục: `jobs/`, `blueprints/`, `contracts/`, `logs/`
- [x] Coder prompt nhắc đúng format STEP + GATE
- [x] Cả 2 prompt đều dùng term nhất quán: "Chủ", "Kiến trúc sư/Architect", "Thợ/Coder"

### 4.2. Điểm cần verify

- [ ] Architect prompt line 158-161 liệt kê paths → verify vẫn đúng
- [ ] Coder prompt nhắc `contracts/<job_id>-contracts.md` → đúng pattern

---

## 5. Docs Consistency

### 5.1. Cross-reference check

- [ ] `01_overview.md` → chỉ giới thiệu, không đi sâu quy trình
- [ ] `02_playbook.md` → quy trình chi tiết, không lặp lại overview
- [ ] `03_quickstart.md` → step-by-step 7 ngày, không lặp lại philosophy

### 5.2. Naming consistency

Verify tên sản phẩm thống nhất:
- [ ] Search "Vibecode Starter Kit" → đúng tên chính thức
- [ ] Search "Vibecode kit" (lowercase) → cân nhắc sửa thành tên chính thức
- [ ] Search "Vibecode Playbook" → chỉ dùng cho tên file, không phải tên sản phẩm

---

## 6. Product & Pricing

### 6.1. Placeholder check

- [ ] Search `XXX.000` để tìm giá chưa điền
- [ ] Search `X slot` để tìm số slot chưa điền
- [ ] Đảm bảo không có giá "cứng" cũ bị sót

### 6.2. Bio & Contact consistency

- [ ] Bio trong Sales Page ↔ Bio trong Launch docs → nhất quán
- [ ] Contact info placeholder ở tất cả nơi cần

---

## 7. Launch Plan

### 7.1. Kênh thực tế

- [ ] `LAUNCH_30D_OVERVIEW.md` → điền kênh thực tế
- [ ] `CONTENT_CALENDAR_30D.md` → điền Day 1 thực tế

### 7.2. Metrics mục tiêu

- [ ] Điền mục tiêu số người mua
- [ ] Điền mục tiêu doanh thu
- [ ] Điền định nghĩa "thành công"

---

## 8. Pre-Launch Checklist

### Technical

- [ ] Clean repo: di chuyển/xóa JOB history
- [ ] Chuẩn hóa OWNER_TODO format
- [ ] Test vibe.py hoạt động đúng
- [ ] Tag `v0.1.0` trong git

### Content

- [ ] Điền tất cả [OWNER_TODO] trong Sales Page
- [ ] Điền bio, giá, link thanh toán
- [ ] Điền Day 1 trong calendar

### Infrastructure

- [ ] Link thanh toán hoạt động
- [ ] Form đăng ký quan tâm sẵn sàng
- [ ] Repo/zip sẵn sàng để gửi

---

## Thực hiện

**Ưu tiên 1 (Critical):**
1. Verify template files cho vibe.py
2. Chuẩn hóa OWNER_TODO format
3. Điền Sales Page essentials (giá, bio, CTA)

**Ưu tiên 2 (Important):**
1. Clean JOB history
2. Test vibe.py commands
3. Điền Launch metrics

**Ưu tiên 3 (Nice to have):**
1. Thêm CHANGELOG.md
2. Cross-check docs consistency
3. Thêm tests cho vibe.py

---

*Checklist này nên được tick dần trước khi Day 1 launch.*
