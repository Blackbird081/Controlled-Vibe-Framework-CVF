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
| Skill/Capability governance | **v1.2** | [EXTENSIONS/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |
| Agent-agnostic skill registry | **v1.2** | [EXTENSIONS/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |

---

## So sánh nhanh

| Tính năng | v1.0 | v1.1 | v1.2 (Extension) |
|-----------|:----:|:----:|:----------------:|
| Triết lý core (Outcome > Code) | ✅ | ✅ | ✅ |
| Phase-based (A→D) | ✅ | ✅ | ✅ |
| Governance cơ bản | ✅ | ✅ | ✅ |
| INPUT/OUTPUT spec | ❌ | ✅ | ✅ |
| Agent Archetype + Lifecycle | ❌ | ✅ | ✅ |
| Command taxonomy | ❌ | ✅ | ✅ |
| Execution Spine + AU trace | ❌ | ✅ | ✅ |
| **Skill Contract Spec** | ❌ | ❌ | ✅ |
| **Skill Registry Model** | ❌ | ❌ | ✅ |
| **Capability Risk Model (R0-R3)** | ❌ | ❌ | ✅ |
| **Agent Adapter Boundary** | ❌ | ❌ | ✅ |
| **External Skill Ingestion** | ❌ | ❌ | ✅ |

---

## Nguyên tắc

- **v1.0 là baseline**, luôn hợp lệ, không thay đổi (FROZEN)
- **v1.1 là mở rộng opt-in**, không phá core v1.0 (FROZEN)
- **v1.2+ là EXTENSIONS**, mở rộng capability layer, agent-agnostic
- Chọn phiên bản theo mức độ phức tạp của project
- Có thể bắt đầu với v1.0, bật module v1.1/v1.2 khi cần

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

### Với v1.2 Extension (Capability Layer)
1. Vào thư mục [EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/)
2. Đọc [README.md](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/README.md)
3. Xem [SKILL_CONTRACT_SPEC.md](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/SKILL_CONTRACT_SPEC.md) để hiểu chuẩn skill
4. Tham khảo [examples/](./EXTENSIONS/examples/) cho các mẫu thực tế

---

## Cấu trúc repo

```
Controlled-Vibe-Framework-CVF/
├── README.md              ← Bạn đang ở đây
├── v1.0/                  ← Core Baseline (FROZEN)
│   ├── CVF_MANIFESTO.md
│   ├── phases/
│   ├── governance/
│   └── ...
├── v1.1/                  ← Extended Control (FROZEN)  
│   ├── architecture/
│   ├── agents/
│   ├── execution/
│   └── ...
├── EXTENSIONS/            ← Capability Extensions (v1.2+)
│   ├── CVF_v1.2_CAPABILITY_EXTENSION/
│   │   ├── README.md
│   │   ├── ARCHITECTURE_OVERVIEW.md
│   │   ├── SKILL_CONTRACT_SPEC.md
│   │   ├── SKILL_REGISTRY_MODEL.md
│   │   ├── CAPABILITY_RISK_MODEL.md
│   │   ├── CAPABILITY_LIFECYCLE.md
│   │   └── ...
│   └── examples/
│       ├── canonical_skill_contracts/
│       ├── skill_registry_examples/
│       └── external_skill_rewrite/
└── docs/
    ├── VERSION_COMPARISON.md
    ├── CVF_EXPERT_REVIEW_v1.2.md   ← Đánh giá & Roadmap v1.3
    └── ...
```

### Giải thích cấu trúc:
- **`v1.0/`, `v1.1/`**: Core versions, đã FROZEN, không thay đổi
- **`EXTENSIONS/`**: Chứa các capability extensions (v1.2, v1.3...), opt-in, không phá core
- **`docs/`**: Tài liệu tổng hợp, so sánh versions, roadmap

---

## 🚀 Roadmap

### v1.2 — Capability Extension (Hiện tại)
- ✅ Skill Contract Specification
- ✅ Skill Registry Model
- ✅ Capability Risk Model (R0-R3)
- ✅ Agent Adapter Boundary
- ✅ External Skill Ingestion Rules
- ✅ Backward Compatibility Policy

### v1.3 — Implementation & Tooling (Đang phát triển)
> *Dựa trên [CVF Expert Review v1.2](./docs/CVF_EXPERT_REVIEW_v1.2.md)*

- 🔲 Reference Implementation (Python/TypeScript SDK)
- 🔲 CLI Tool (`cvf-validate`)
- 🔲 End-to-End Examples
- 🔲 Agent Adapters (Claude, GPT, local LLM)
- 🔲 CI/CD Integration Templates

---

## Triết lý cốt lõi

- **Outcome > Code**: quan trọng là sản phẩm làm được gì
- **Control without micromanagement**: kiểm soát bằng cấu trúc
- **Decisions are first-class citizens**: quyết định phải được ghi lại
- **AI là executor, không phải decision maker**
- **Skills được thuần hóa, không được tự do** *(v1.2+)*

---

## License

MIT License

---

## Đóng góp

Xem [CONTRIBUTING.md](./v1.0/CONTRIBUTING.md) để biết cách đóng góp.

---

**CVF không giúp bạn đi nhanh hơn. CVF giúp bạn không đi sai.**
