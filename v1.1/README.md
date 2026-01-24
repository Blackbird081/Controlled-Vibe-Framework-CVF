# Controlled Vibe Framework (CVF) — v1.1 FINAL

**Framework quản lý dự án theo tinh thần *vibe coding có kiểm soát*.**

---

## Tại sao v1.1?

v1.1 mở rộng từ v1.0 với các ràng buộc kiểm soát chi tiết hơn:
- **INPUT/OUTPUT spec**: hợp đồng vào/ra rõ ràng
- **Agent Archetype + Lifecycle**: phân vai AI, ngăn vượt quyền
- **Command taxonomy**: chuẩn hóa intent → action
- **Execution Spine + AU**: luồng thực thi có truy vết
- **Preset Library**: chính sách hành vi per archetype

**Compatibility note:**
- v1.0 là core baseline đã freeze; không chỉnh sửa.
- v1.1 chỉ *bổ sung* module điều khiển, không đổi cấu trúc/triết lý gốc.
- Bất kỳ project tối giản có thể chạy trên v1.0; bật module v1.1 theo nhu cầu.

---

## Bắt đầu nhanh

| Bạn muốn | Đọc file |
|----------|----------|
| Hiểu trong 5 phút | [QUICK_START.md](QUICK_START.md) |
| Nâng cấp từ v1.0 | [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) |
| Xem ví dụ thực tế | [templates/EXAMPLE_PROJECT.md](templates/EXAMPLE_PROJECT.md) |

---

## Cấu trúc thư mục

```
v1.1 FINAL/
├── architecture/     # Bootstrap, overview kiến trúc
├── governance/       # INPUT/OUTPUT spec, Preset, Fast Track
├── agents/           # Archetype, Lifecycle
├── execution/        # Execution Spine, AU
├── interface/        # Command taxonomy
├── templates/        # Mẫu sẵn sàng dùng
└── (root files)      # README, ROADMAP, RELEASE_NOTES, ...
```

---

## Workflow cơ bản

```
1. Lập INPUT_SPEC
   ↓
2. Chọn Command (CVF:EXECUTE, CVF:DESIGN, ...)
   ↓
3. Gán Archetype + Preset
   ↓
4. Tạo Action Unit (AU)
   ↓
5. Thực thi + Ghi Trace
   ↓
6. Review theo OUTPUT_SPEC
   ↓
7. Merge / Close AU
```

---

## Nguyên tắc cốt lõi

- **Outcome > Code**: quan trọng là sản phẩm làm được gì
- **AI là executor, không phải decision maker**
- **Mọi action phải truy vết**: Command → Archetype → Preset → AU → Trace
- **v1.0 = baseline; v1.1 = opt-in modules**

---

## File quan trọng

| Mục đích | File |
|----------|------|
| Hiểu triết lý | governance/README.md, agents/README.md |
| Lập input/output | governance/INPUT_SPEC.md, OUTPUT_SPEC.md |
| Phân vai agent | agents/CVF_AGENT_ARCHETYPE.md |
| Chọn command | interface/CVF_COMMANDS.md |
| Hiểu execution | execution/CVF_EXECUTION_LAYER.md |
| Task nhỏ nhanh | governance/FAST_TRACK.md |
| Xem mẫu | templates/*.sample.md, templates/EXAMPLE_PROJECT.md |

---

## Trạng thái

- **Version:** 1.1 FINAL
- **Status:** STABLE / FREEZE
- **Thay đổi tiếp theo:** v1.2

---

## License

MIT License — xem [LICENSE](LICENSE)
