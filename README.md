# Controlled Vibe Framework (CVF)

**Framework quản lý dự án theo tinh thần *vibe coding có kiểm soát*.**

---

## Chọn phiên bản

| Bạn cần gì? | Phiên bản | Thư mục |
|-------------|-----------|---------|
| Project nhỏ, nhanh, đơn giản | **v1.0** | [v1.0/](./v1.0/) |
| Người mới bắt đầu vibe coding | **v1.0** | [v1.0/](./v1.0/) |
| Kiểm soát input/output rõ ràng | **v1.1** | [v1.1/](./v1.1/) |
| Multi-agent, phân vai AI | **v1.1** | [v1.1/](./v1.1/) |
| Cần audit, trace đầy đủ | **v1.1** | [v1.1/](./v1.1/) |

---

## So sánh nhanh

| Tính năng | v1.0 | v1.1 |
|-----------|:----:|:----:|
| Triết lý core (Outcome > Code) | ✅ | ✅ |
| Phase-based (A→D) | ✅ | ✅ (kế thừa) |
| Governance cơ bản | ✅ | ✅ |
| INPUT/OUTPUT spec | ❌ | ✅ |
| Agent Archetype + Lifecycle | ❌ | ✅ |
| Command taxonomy | ❌ | ✅ |
| Execution Spine + AU trace | ❌ | ✅ |
| Preset Library | ❌ | ✅ |
| Fast Track | ❌ | ✅ |

---

## Nguyên tắc

- **v1.0 là baseline**, luôn hợp lệ, không thay đổi
- **v1.1 là mở rộng opt-in**, không phá core v1.0
- Chọn phiên bản theo mức độ phức tạp của project
- Có thể bắt đầu với v1.0, bật module v1.1 khi cần

---

## Bắt đầu

### Với v1.0 (đơn giản)
1. Vào thư mục [v1.0/](./v1.0/)
2. Đọc [README.md](./v1.0/README.md)
3. Làm theo [PROJECT_INIT_CHECKLIST](./v1.0/governance/PROJECT_INIT_CHECKLIST.md)
4. Bắt đầu Phase A — Discovery

### Với v1.1 (kiểm soát chi tiết)
1. Vào thư mục [v1.1/](./v1.1/)
2. Đọc [QUICK_START.md](./v1.1/QUICK_START.md) — 5 phút
3. Nếu đang dùng v1.0, xem [MIGRATION_GUIDE.md](./v1.1/MIGRATION_GUIDE.md)
4. Xem [EXAMPLE_PROJECT](./v1.1/templates/EXAMPLE_PROJECT.md) để hiểu luồng

---

## Cấu trúc repo

```
Controlled-Vibe-Framework-CVF/
├── README.md          ← Bạn đang ở đây
├── v1.0/              ← Baseline (freeze)
│   ├── README.md
│   ├── CVF_MANIFESTO.md
│   ├── phases/
│   ├── governance/
│   ├── ai/
│   └── ...
├── v1.1/              ← Mở rộng (freeze)
│   ├── README.md
│   ├── QUICK_START.md
│   ├── MIGRATION_GUIDE.md
│   ├── architecture/
│   ├── agents/
│   ├── execution/
│   ├── interface/
│   ├── governance/
│   ├── templates/
│   └── ...
└── docs/
    └── VERSION_COMPARISON.md
```

---

## Triết lý cốt lõi

- **Outcome > Code**: quan trọng là sản phẩm làm được gì
- **Control without micromanagement**: kiểm soát bằng cấu trúc
- **Decisions are first-class citizens**: quyết định phải được ghi lại
- **AI là executor, không phải decision maker**

---

## License

MIT License

---

## Đóng góp

Xem [CONTRIBUTING.md](./v1.0/CONTRIBUTING.md) để biết cách đóng góp.

---

**CVF không giúp bạn đi nhanh hơn. CVF giúp bạn không đi sai.**
