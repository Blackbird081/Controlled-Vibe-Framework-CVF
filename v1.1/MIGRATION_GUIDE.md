# MIGRATION GUIDE — v1.0 → v1.1
Version: 1.1 | Status: STABLE

## Mục đích
Hướng dẫn project đang dùng CVF v1.0 bật thêm module v1.1 mà không phá cấu trúc hiện tại.

## Nguyên tắc
- v1.0 vẫn hợp lệ; không bắt buộc nâng cấp
- v1.1 là opt-in; bật module nào cần module đó
- Không sửa core v1.0; chỉ thêm artefact v1.1

---

## Khi nào nên nâng cấp?

| Tình huống | Giữ v1.0 | Bật v1.1 |
|------------|----------|----------|
| Project nhỏ, 1-2 người, nhanh | ✅ | Không cần |
| Cần ràng buộc input/output rõ | | ✅ |
| Multi-agent, cần phân vai | | ✅ |
| Cần trace AU chi tiết | | ✅ |
| Cần audit/review nghiêm ngặt | | ✅ |
| Task nhỏ cần fast track có kiểm soát | | ✅ |

---

## Các bước nâng cấp

### Bước 1: Giữ nguyên cấu trúc v1.0
Không xóa, không sửa các file:
- phases/ (A→D)
- governance/ (checklist, gate)
- ai/ (role spec, usage log)
- DECISIONS.md, FRAMEWORK_FREEZE.md

### Bước 2: Thêm thư mục v1.1 modules
Tạo các thư mục mới bên cạnh cấu trúc v1.0:
```
your-project/
├── (giữ nguyên v1.0)
├── architecture/       ← thêm mới
├── agents/             ← thêm mới
├── execution/          ← thêm mới
├── interface/          ← thêm mới
└── governance/         ← bổ sung file v1.1
```

### Bước 3: Copy file v1.1 cần dùng
Tùy nhu cầu, copy từ v1.1 FINAL:

**Nếu cần INPUT/OUTPUT spec:**
- governance/INPUT_SPEC.md
- governance/OUTPUT_SPEC.md

**Nếu cần Agent control:**
- agents/CVF_AGENT_ARCHETYPE.md
- agents/CVF_AGENT_LIFECYCLE.md
- governance/EGL_PRESET_LIBRARY.md

**Nếu cần Command taxonomy:**
- interface/CVF_COMMANDS.md

**Nếu cần Execution Spine:**
- execution/CVF_EXECUTION_LAYER.md

**Nếu cần Fast Track:**
- governance/FAST_TRACK.md

### Bước 4: Cập nhật workflow
- Trước khi tạo task → lập INPUT_SPEC
- Trước khi thực thi → gán Command + Archetype + Preset
- Trong khi thực thi → tạo AU, ghi trace
- Sau khi xong → review theo OUTPUT_SPEC

### Bước 5: Ghi nhận quyết định
Thêm vào DECISIONS.md:
```
## DC-XXX: Bật module CVF v1.1
- Date: YYYY-MM-DD
- Decision: Bật INPUT/OUTPUT spec, Agent Archetype, Execution Spine
- Rationale: Project cần kiểm soát chi tiết hơn
- Impact: Thêm bước lập spec và trace AU
```

---

## Mapping Phase v1.0 → Command v1.1

| Phase v1.0 | Command v1.1 tương đương |
|------------|--------------------------|
| Phase A — Discovery | CVF:PROPOSE (Exploration/Analysis) |
| Phase B — Design | CVF:DESIGN, CVF:DECIDE |
| Phase C — Build | CVF:EXECUTE |
| Phase D — Review | CVF:REVIEW, CVF:AUDIT |

Có thể dùng song song: Phase để định hướng tổng, Command để kiểm soát từng action.

---

## Lưu ý quan trọng
- Không xóa phases/; vẫn dùng được song song với Execution Spine
- Không sửa FRAMEWORK_FREEZE v1.0; chỉ thêm file mới
- Nếu conflict, ưu tiên rule v1.0 (baseline) trừ khi có quyết định rõ ràng

---

## Rollback
Nếu v1.1 không phù hợp:
- Xóa các thư mục/file v1.1 đã thêm
- Quay về workflow v1.0 thuần
- Không ảnh hưởng core v1.0
