# PHASE_STATUS — CVF v1.1 FINAL

> **Version:** 1.1 | **Status:** STABLE

---

## ⚠️ Lưu ý quan trọng

**CVF v1.1 không sử dụng Phase-based workflow như v1.0.**

Thay vào đó, v1.1 sử dụng **Execution Spine** với Action Units:

| v1.0 (Phase-based) | v1.1 (Execution Spine) |
|--------------------|------------------------|
| Discovery → Design → Build → Review | INPUT_SPEC → Command → AU → OUTPUT_SPEC |
| Fixed sequential phases | Flexible Action Units |
| Phase gates | Continuous trace |
| Milestone-driven | Deliverable-driven |

---

## Nếu bạn cần Phase tracking

Nếu project của bạn vẫn cần phase-based tracking (ví dụ: reporting cho stakeholders), có 2 options:

### Option 1: Dùng v1.0 phases song song
```
/project/
├── phases/           ← v1.0 phase tracking
│   └── PHASE_STATUS.md
└── execution/        ← v1.1 Action Units
    └── AU_traces/
```

### Option 2: Map AU sang Phase
| Phase (v1.0) | Action Units (v1.1) |
|--------------|---------------------|
| Discovery | AU với Researcher/Planner archetype |
| Design | AU với Planner archetype |
| Build | AU với Builder archetype |
| Review | AU với Reviewer archetype |

---

## Framework Release Status

| Component | Version | Status |
|-----------|---------|--------|
| CVF Core (v1.0) | 1.0 | ✅ FROZEN |
| Architecture Layer | 1.1 | ✅ STABLE |
| Governance Layer | 1.1 | ✅ STABLE |
| Agent Layer | 1.1 | ✅ STABLE |
| Interface Layer | 1.1 | ✅ STABLE |
| Execution Layer | 1.1 | ✅ STABLE |
| Templates | 1.1 | ✅ STABLE |

---

## Xem thêm
- [v1.0 phases/](../v1.0/phases/) — Phase-based workflow gốc
- [execution/CVF_EXECUTION_LAYER.md](execution/CVF_EXECUTION_LAYER.md) — Execution Spine v1.1
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) — Chuyển từ v1.0 sang v1.1
