# USAGE — CVF v1.1

> **Version:** 1.1 | **Status:** STABLE  
> **Compatible:** v1.0 baseline (additive)

---

## 1. Nguyên tắc cốt lõi

| # | Nguyên tắc | Mô tả |
|---|------------|-------|
| 1 | **v1.0 = baseline luôn hợp lệ** | Mọi project bắt đầu từ v1.0; v1.1 là opt-in |
| 2 | **Spec trước, code sau** | INPUT_SPEC + OUTPUT_SPEC phải có trước khi AI động tay |
| 3 | **Archetype quyết định hành vi** | Mỗi agent có role rõ ràng, không vượt scope |
| 4 | **Trace là bắt buộc** | Mọi thay đổi phải ghi trace, kể cả Fast Track |
| 5 | **Review trước merge** | Output chỉ được merge sau khi Human approve |

---

## 2. Workflow chuẩn (5 bước)

### Bước 1: Khởi tạo Project

```markdown
□ Xác định scope và mục tiêu
□ Chọn modules v1.1 cần bật (hoặc chỉ dùng v1.0)
□ Điền PROJECT_INIT_CHECKLIST.md
□ Gán roles: Owner, Reviewer, AI Agents
```

### Bước 2: Lập Spec

```markdown
□ Viết INPUT_SPEC.md — định nghĩa yêu cầu, constraints
□ Viết OUTPUT_SPEC.md — định nghĩa deliverables, acceptance criteria
□ Review specs với stakeholders
□ Lock specs trước khi thực thi
```

### Bước 3: Gán Command + Archetype + Preset

```markdown
□ Chọn Command phù hợp: /create, /modify, /review, /debug...
□ Map tới Archetype: Builder, Reviewer, Debugger...
□ Apply Preset từ EGL_PRESET_LIBRARY.md
□ Xác nhận binding trong CVF_COMMANDS.md
```

### Bước 4: Thực thi Action Units

```markdown
□ Chia task thành Action Units nhỏ (1 AU = 1 việc cụ thể)
□ Thực thi trong sandbox/isolation
□ Ghi trace cho mỗi AU: input → action → output → status
□ Không merge trực tiếp — đợi review
```

### Bước 5: Review & Merge
```
□ Human review output của AI
□ Chạy validation theo OUTPUT_SPEC
□ Approve hoặc request changes
□ Merge vào main branch
□ Update CHANGELOG.md
```

---

## 3. Khi nào dùng gì?

| Tình huống | Dùng | Lý do |
|------------|------|-------|
| Project mới, nhỏ | v1.0 only | Đủ kiểm soát, ít overhead |
| Project phức tạp, nhiều AI | v1.0 + v1.1 full | Cần spec chặt, trace đầy đủ |
| Task nhanh < 2h | v1.1 Fast Track | Giảm ceremony, giữ trace |
| Task critical/risky | v1.1 Full + Strict Preset | Maximum control |
| Debugging/hotfix | v1.1 + Debugger archetype | Focused scope |

---

## 4. Do's and Don'ts

### ✅ DO
- Viết spec trước khi yêu cầu AI code
- Chia task lớn thành nhiều Action Units
- Review mọi output của AI trước khi merge
- Giữ trace cho mọi thay đổi
- Dùng Preset phù hợp với risk level

### ❌ DON'T
- Để AI tự quyết định scope
- Skip trace vì "task nhỏ"
- Merge output mà không review
- Dùng Full Flow cho task 30 phút
- Mix nhiều archetype trong 1 AU

---

## 5. Tips & Tricks

### 💡 Tip 1: Template-first
Dùng templates có sẵn trong `templates/` folder thay vì viết từ đầu.

### 💡 Tip 2: Preset chaining
Có thể dùng Balanced Preset cho phần lớn task, chỉ switch sang Strict khi cần.

### 💡 Tip 3: Trace location
Đặt trace cùng folder với output để dễ review:
```
/feature-x/
  ├── code.py
  └── AU_trace.md
```

### 💡 Tip 4: Fast Track criteria
Nếu task thỏa ALL điều kiện sau → dùng Fast Track:
- Duration < 2h
- Scope isolated (không ảnh hưởng files khác)
- Risk thấp
- Không cần approval chain

### 💡 Tip 5: Rollback plan
Luôn có backup trước khi AI thực thi task lớn. Git branch hoặc copy folder.

---

## 6. Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│                   CVF v1.1 WORKFLOW                     │
├─────────────────────────────────────────────────────────┤
│  INPUT_SPEC  →  Command  →  Archetype  →  Preset       │
│       ↓            ↓           ↓            ↓          │
│  Requirements   /create    Builder     Balanced        │
│       ↓            ↓           ↓            ↓          │
│  Action Unit  →  Execute  →  Trace  →  Review          │
│       ↓            ↓           ↓            ↓          │
│  OUTPUT_SPEC  ←  Validate ←  Approve ←  Merge          │
└─────────────────────────────────────────────────────────┘
```

---

## Xem thêm
- [QUICK_START.md](QUICK_START.md) — Bắt đầu trong 5 phút
- [governance/INPUT_SPEC.md](governance/INPUT_SPEC.md) — Chi tiết spec đầu vào
- [governance/FAST_TRACK.md](governance/FAST_TRACK.md) — Khi nào được rút gọn
- [templates/](templates/) — Templates sẵn có
