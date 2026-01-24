# Hướng dẫn áp dụng CVF v1.1 vào dự án thực tế

> **Version:** 1.1 | **Status:** STABLE  
> **Purpose:** Hướng dẫn từng bước sử dụng CVF khi làm việc với AI

---

## 🎯 Tổng quan

CVF (Controlled Vibe Framework) giúp bạn kiểm soát AI khi phát triển phần mềm thông qua:
- **Spec trước, code sau** — Định nghĩa rõ input/output trước khi AI động tay
- **Role rõ ràng** — AI biết mình là Builder, Reviewer, hay Debugger
- **Trace mọi thứ** — Ghi lại mọi thay đổi để audit và rollback

---

## 🚀 Quy trình 5 bước

```
┌──────────────────────────────────────────────────────────────────┐
│  1. INIT    →  2. SPEC    →  3. ASSIGN   →  4. EXECUTE  →  5. REVIEW  │
│  Khởi tạo      Viết spec     Gán role       Thực thi       Duyệt      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bước 1: Khởi tạo Project

### Tạo cấu trúc folder theo CVF

```
my-app/
├── specs/
│   ├── INPUT_SPEC.md      ← Yêu cầu đầu vào
│   └── OUTPUT_SPEC.md     ← Kết quả mong đợi
├── traces/                 ← Ghi log AI actions
│   └── AU_001.md
├── src/                    ← Code
├── DECISIONS.md           ← Quyết định quan trọng
└── CHANGELOG.md           ← Lịch sử thay đổi
```

### Checklist khởi tạo

- [ ] Tạo folder structure
- [ ] Copy templates từ CVF v1.1
- [ ] Xác định scope và mục tiêu
- [ ] Gán roles: Owner, Reviewer, AI agents

---

## Bước 2: Viết INPUT_SPEC

### Template

```markdown
# INPUT_SPEC — [Tên App]

## Mục tiêu
[Mô tả app làm gì, cho ai dùng]

## Yêu cầu chức năng
1. [Feature 1]
2. [Feature 2]
3. ...

## Tech Stack
- Frontend: [React/Vue/...]
- Backend: [Node/Python/...]
- Database: [PostgreSQL/MongoDB/...]

## Constraints
- Thời gian: [X ngày/tuần]
- Budget: [nếu có]
- Không được: [các giới hạn]

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

### Ví dụ thực tế

```markdown
# INPUT_SPEC — Task Manager App

## Mục tiêu
App quản lý công việc cá nhân, chạy trên web, offline-first.

## Yêu cầu chức năng
1. CRUD tasks với title, description, due date
2. Phân loại theo project/tag
3. Filter và search
4. Sync khi có mạng

## Tech Stack
- Frontend: React + TypeScript
- Storage: IndexedDB + optional cloud sync
- UI: Tailwind CSS

## Constraints
- Không dùng external UI library
- Bundle size < 200KB
- Phải hoạt động offline

## Acceptance Criteria
- [ ] Tạo/sửa/xóa task hoạt động offline
- [ ] Data persist sau reload
- [ ] Search < 100ms với 1000 tasks
```

---

## Bước 3: Gán Command + Archetype + Preset

### Bảng mapping chuẩn

| Task | Command | Archetype | Preset | Khi nào dùng |
|------|---------|-----------|--------|--------------|
| Thiết kế architecture | `/plan` | Planner | Balanced | Đầu project |
| Viết code mới | `/create` | Builder | Balanced | Phát triển feature |
| Sửa code có sẵn | `/modify` | Builder | Balanced | Cải tiến |
| Review code | `/review` | Reviewer | Strict | Trước merge |
| Fix bugs | `/debug` | Debugger | Minimal | Khi có lỗi |
| Tìm hiểu/research | `/research` | Researcher | Minimal | Khi cần info |
| Refactor | `/refactor` | Refactorer | Balanced | Cải thiện code |

### Preset levels

| Preset | Stop Condition | Review | Dùng khi |
|--------|----------------|--------|----------|
| **Minimal** | Khi xong task | Optional | Task nhỏ, low risk |
| **Balanced** | Sau mỗi file/component | Required | Hầu hết tasks |
| **Strict** | Sau mỗi function | Mandatory + Tests | Critical, risky |

---

## Bước 4: Thực thi với AI

### Format prompt chuẩn CVF

```markdown
[Command]: /create
[Archetype]: Builder
[Preset]: Balanced

[Task]: 
Tạo component Login form với email/password validation

[INPUT_SPEC Reference]: 
specs/INPUT_SPEC.md#authentication

[OUTPUT Expected]: 
- src/components/LoginForm.tsx
- src/hooks/useAuth.ts
- src/components/__tests__/LoginForm.test.tsx

[Constraints]:
- React + TypeScript
- Dùng Zod cho validation
- Không dùng third-party UI lib
- Error messages tiếng Việt

[Stop Condition]:
Dừng sau khi hoàn thành component, chờ review trước khi tiếp tục
```

### Tips khi prompt AI

1. **Cụ thể hóa output** — Liệt kê chính xác files sẽ tạo
2. **Reference spec** — Link tới INPUT_SPEC section liên quan
3. **Đặt constraints rõ** — AI cần biết giới hạn
4. **Stop condition** — AI không tự ý làm thêm

---

## Bước 5: Trace & Review

### Ghi trace sau mỗi Action Unit

```markdown
# AU-001: Login Form Component

## Metadata
- **Date**: 2026-01-24
- **Command**: /create
- **Archetype**: Builder
- **Preset**: Balanced

## Input
Tạo Login form với email/password validation theo spec

## Output
- ✅ src/components/LoginForm.tsx (45 lines)
- ✅ src/hooks/useAuth.ts (32 lines)
- ✅ src/components/__tests__/LoginForm.test.tsx (28 lines)

## Status
✅ Complete

## Review
- **Reviewer**: [Tên]
- **Date**: 2026-01-24
- **Result**: Approved
- **Notes**: Đã thêm rate limiting cho submit button

## Changes from original
- Thêm debounce 300ms cho validation
- Đổi error message format
```

### Review checklist

- [ ] Code match với OUTPUT_SPEC?
- [ ] Không vượt scope của task?
- [ ] Tests pass?
- [ ] Không có security issues?
- [ ] Performance acceptable?

---

## 🔄 Fast Track (cho task nhỏ)

Nếu task thỏa **TẤT CẢ** điều kiện sau, có thể dùng Fast Track:

| Điều kiện | Threshold |
|-----------|-----------|
| Duration | < 2 giờ |
| Scope | 1-2 files, isolated |
| Risk | Low (không ảnh hưởng core) |
| Dependencies | Không có |

### Fast Track workflow

```
INPUT_SPEC (brief) → /command + Archetype → Execute → Trace (minimal) → Done
```

**Vẫn phải trace**, chỉ skip formal review.

---

## 📋 Templates sẵn có

| Template | Mục đích | Location |
|----------|----------|----------|
| INPUT_SPEC.sample.md | Mẫu spec đầu vào | v1.1/templates/ |
| OUTPUT_SPEC.sample.md | Mẫu spec đầu ra | v1.1/templates/ |
| AU_trace.sample.md | Mẫu ghi trace | v1.1/templates/ |
| EXAMPLE_PROJECT.md | Ví dụ hoàn chỉnh | v1.1/templates/ |

---

## 💡 Tips & Best Practices

### DO ✅

- Viết spec trước khi yêu cầu AI code
- Chia task lớn thành nhiều Action Units nhỏ
- Review mọi output của AI trước khi merge
- Giữ trace cho mọi thay đổi
- Dùng Preset phù hợp với risk level
- Commit thường xuyên với message rõ ràng

### DON'T ❌

- Để AI tự quyết định scope
- Skip trace vì "task nhỏ"
- Merge output mà không review
- Dùng Full Flow cho task 30 phút
- Mix nhiều archetype trong 1 Action Unit
- Yêu cầu AI làm quá nhiều thứ trong 1 prompt

---

## 🎯 Quick Start Checklist

```
□ 1. Tạo folder structure (specs/, traces/, src/)
□ 2. Viết INPUT_SPEC.md — mục tiêu, features, constraints
□ 3. Viết OUTPUT_SPEC.md — deliverables, acceptance criteria
□ 4. Với mỗi task:
    □ Chọn Command + Archetype + Preset
    □ Format prompt theo template
    □ Execute với AI
    □ Ghi trace
    □ Review output
□ 5. Repeat cho task tiếp theo
```

---

## Xem thêm

- [QUICK_START.md](../v1.1/QUICK_START.md) — Bắt đầu trong 5 phút
- [USAGE.md](../v1.1/USAGE.md) — Hướng dẫn chi tiết
- [CVF_COMMANDS.md](../v1.1/interface/CVF_COMMANDS.md) — Danh sách commands
- [EGL_PRESET_LIBRARY.md](../v1.1/governance/EGL_PRESET_LIBRARY.md) — Preset policies
- [EXAMPLE_PROJECT.md](../v1.1/templates/EXAMPLE_PROJECT.md) — Ví dụ hoàn chỉnh
