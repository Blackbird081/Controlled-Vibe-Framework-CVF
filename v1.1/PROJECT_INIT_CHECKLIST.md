# PROJECT_INIT_CHECKLIST — CVF v1.1

> **Version:** 1.1 | **Status:** STABLE  
> **Purpose:** Checklist khởi tạo project mới với CVF v1.1

---

## 📋 Pre-flight Checklist

### 1. Xác định Scope & Version

- [ ] Project scope và mục tiêu được document
- [ ] Quyết định dùng v1.0 only hay v1.0 + v1.1 modules
- [ ] List modules v1.1 sẽ bật:
  - [ ] INPUT_SPEC / OUTPUT_SPEC
  - [ ] Agent Archetypes
  - [ ] EGL Presets
  - [ ] Command Taxonomy
  - [ ] Execution Spine
  - [ ] Fast Track

### 2. Team & Roles

- [ ] **Project Owner** được gán: `________________`
- [ ] **Spec Owner(s)** được gán: `________________`
- [ ] **Reviewer(s)** được gán: `________________`
- [ ] **AI Agent roles** được map:

  | Agent | Archetype | Preset |
  |-------|-----------|--------|
  | | | |

### 3. Governance Setup

- [ ] INPUT_SPEC template được copy từ `templates/INPUT_SPEC.sample.md`
- [ ] OUTPUT_SPEC template được copy từ `templates/OUTPUT_SPEC.sample.md`
- [ ] Preset policy được chọn (Minimal / Balanced / Strict)
- [ ] Stop conditions được define

### 4. Infrastructure

- [ ] Trace location được chọn: `________________`
- [ ] Version control setup (git branch strategy)
- [ ] Backup/rollback plan documented
- [ ] Communication channel cho team

### 5. Documentation

- [ ] Project README.md created
- [ ] DECISIONS.md initialized
- [ ] CHANGELOG.md initialized

---

## 🚀 Quick Start Commands

```bash
# 1. Copy templates
cp templates/INPUT_SPEC.sample.md project/INPUT_SPEC.md
cp templates/OUTPUT_SPEC.sample.md project/OUTPUT_SPEC.md
cp templates/AU_trace.sample.md project/traces/

# 2. Initialize tracking
touch project/DECISIONS.md
touch project/CHANGELOG.md

# 3. Ready to execute!
```

---

## ✅ Go/No-Go Criteria

| Criteria | Required | Status |
|----------|----------|--------|
| Project scope defined | ✅ Yes | [ ] |
| At least 1 Spec Owner assigned | ✅ Yes | [ ] |
| At least 1 Reviewer assigned | ✅ Yes | [ ] |
| Trace location configured | ✅ Yes | [ ] |
| INPUT_SPEC drafted | ✅ Yes | [ ] |
| OUTPUT_SPEC drafted | ✅ Yes | [ ] |
| Preset selected | 🟡 Recommended | [ ] |
| Backup plan documented | 🟡 Recommended | [ ] |

**→ All "Required" items must be checked before starting execution.**

---

## 📝 Signature

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Owner | | | |
| Spec Owner | | | |
| Lead Reviewer | | | |

---

## Xem thêm

- [QUICK_START.md](QUICK_START.md) — Hướng dẫn nhanh 5 phút
- [USAGE.md](USAGE.md) — Workflow chi tiết
- [governance/EGL_PRESET_LIBRARY.md](governance/EGL_PRESET_LIBRARY.md) — Chọn preset phù hợp
