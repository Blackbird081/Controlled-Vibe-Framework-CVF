# CVF ARCHITECTURE CHECK GUARD — Mandatory Structure Review Before Adding to CVF

> **Type:** Governance Policy
> **Effective:** 2026-03-05
> **Status:** Active
> **Enforced by:** Convention + AI Agent System Prompt + PR review

---

## 0. CVF EXTENSION RULES — ƯỨU TIÊN CAO NHẤT

Ba quy tắc này áp dụng cho **mọi thứ** được thêm vào CVF. Chúng có ưu tiên cao hơn mọi quy tắc khác.

| # | Rule | Nội dung |
|---|------|----------|
| **R1** | **Cấu trúc hiện tại luôn là chuẩn** | CVF hiện tại là ground truth. Không được redefine hay replace cấu trúc cũ — phải viết ADR + approval nếu muốn thay đổi |
| **R2** | **Addition phải tương thích, không thay thế** | Mọi version mới interoperate với version cũ. Không silent-replace. Test backward compat trước khi propose |
| **R3** | **Naming và Governance theo chuẩn CVF** | Version: `CVF_v[x.y]_[TEN]`. Layer: `LAYER [N] — [MÔ_TẢ]`. Guard: `CVF_[MỤC_ĐÍCH]_GUARD.md`. Không tùy tiện đặt tên |

> **Vi phạm bất kỳ rule nào → proposal bị reject ngay, không cần review tiếp.**
> Xem full detail: `docs/CVF_CORE_KNOWLEDGE_BASE.md` Section XIV.

---

## 1. PURPOSE

**Before proposing or implementing anything new in CVF** — a new version, layer, extension, module, or feature — you MUST first read and understand the current CVF architecture through `docs/CVF_CORE_KNOWLEDGE_BASE.md`.

This ensures:
- **No duplication** — new additions don't overlap with existing features already implemented
- **Correct layer placement** — every addition lands in the right architectural layer (1 → 5)
- **Backward compatibility** — new layers do not break or bypass existing layers below them
- **Structural coherence** — CVF grows in a planned, non-contradictory way

> **Why this matters:**
> CVF has 5 layers and 13+ versions. Without reading the Knowledge Base first,
> it is easy to propose something that already exists, conflicts with an existing layer,
> or violates a core principle established in a prior version.

---

## 2. THE MANDATORY RULE

> 🚨 **NON-NEGOTIABLE:**
> Every proposal for a **new feature, version, layer, extension, or module** MUST begin by reading `docs/CVF_CORE_KNOWLEDGE_BASE.md` and explicitly stating:
> 1. **Which Layer** it belongs to (Layer 1–5)
> 2. **Whether it overlaps** with any existing version/module
> 3. **Which existing parts** it builds upon or extends
> 4. **Which principles** from Section XI it must not violate

### What Triggers This Guard?

| Action | Triggers Check? |
|--------|:--------------:|
| Proposing a new CVF version (e.g., v1.8, v2.0) | ✅ |
| Adding a new layer, module, or component | ✅ |
| Creating a new extension folder under `EXTENSIONS/` | ✅ |
| Adding a new governance guard or policy | ✅ |
| Refactoring an existing layer's architecture | ✅ |
| Adding individual skills to an existing domain | ❌ |
| Fixing a bug in existing code | ❌ |
| Updating documentation for existing feature | ❌ |
| Adding tests for existing features | ❌ |

---

## 3. REQUIRED CHECKLIST (Fill Before Proposing)

Before submitting any proposal, explicitly answer all 9 questions from `docs/CVF_CORE_KNOWLEDGE_BASE.md` Section XII:

```
ARCHITECTURE CHECK CHECKLIST
══════════════════════════════════════════════════════════════════
[ ] 1. Layer placement: This belongs to Layer ___
        (1=Core | 2=Tools | 2.5=Safety Runtime | 3=Platform | 4=Safety UI | 5=Adapter)

[ ] 2. Principle compliance: Does NOT violate any of the 9 principles in Section XI
        Specifically, I checked: _______________________

[ ] 3. Overlap check: Compared with existing versions in Section III
        No overlap found with: ________________________
        OR: Intentionally EXTENDS (not duplicates): _______

[ ] 4. Risk model: Uses R0–R3 notation OR provides mapping if using different notation

[ ] 5. Safety Kernel: Does NOT bypass the 5-layer Safety Kernel described in Section VI

[ ] 6. Governance: Will call appropriate Governance Guards (Section VII)

[ ] 7. Compatibility: Will pass compatibility gates
        (governance/compat/check_core_compat.py)

[ ] 8. ADR: Will create ADR entry in docs/CVF_ARCHITECTURE_DECISIONS.md

[ ] 9. KB Update: If architecture changes, will update docs/CVF_CORE_KNOWLEDGE_BASE.md
══════════════════════════════════════════════════════════════════
All 9 boxes must be checked before implementation begins.
```

---

## 4. WORKFLOW

```
INTENT: Add something new to CVF
    ↓
STEP 1: READ docs/CVF_CORE_KNOWLEDGE_BASE.md (entire document)
    ↓
STEP 2: FILL ARCHITECTURE CHECK CHECKLIST (9 questions above)
    ↓
STEP 3: PROPOSE with explicit answers to all 9 questions
    ↓
STEP 4: REVIEW (human or governance agent validates checklist)
    ↓
    ├── ✅ All 9 checked → PROCEED to implement
    └── ❌ Any unchecked → RETURN to Step 1
    ↓
STEP 5: IMPLEMENT
    ↓
STEP 6: CREATE ADR ENTRY (ADR Guard)
    ↓
STEP 7: UPDATE docs/CVF_CORE_KNOWLEDGE_BASE.md if architecture changed
    ↓
STEP 8: COMMIT + PUSH
```

---

## 5. MANDATORY PREAMBLE FOR AI AGENTS

When an AI agent (Antigravity or any other) is asked to add something new to CVF, it MUST begin its response with this preamble before proposing anything:

```
## Architecture Check (CVF_ARCHITECTURE_CHECK_GUARD)

I have read docs/CVF_CORE_KNOWLEDGE_BASE.md.

**Layer placement:** Layer [N] — [Layer name]
**Existing overlap check:** [what I compared against and found]
**Extends/builds upon:** [specific existing version or module]
**Principles verified:** [which of the 9 principles apply and how respected]
**Compat gate:** [will/won't need to run check_core_compat.py]
```

If the AI agent cannot provide this preamble, the proposal is **invalid** and must be rejected.

---

## 6. WHAT TO DO WHEN KNOWLEDGE BASE IS OUTDATED

If you discover that `docs/CVF_CORE_KNOWLEDGE_BASE.md` does not reflect the current state of CVF:

1. **STOP** — do not proceed with the new addition
2. **UPDATE** `docs/CVF_CORE_KNOWLEDGE_BASE.md` first
3. **THEN** re-run the Architecture Check Checklist against the updated baseline
4. **DOCUMENT** the discrepancy in `docs/CVF_ARCHITECTURE_DECISIONS.md`

> The Knowledge Base must always reflect reality, not aspirations.
> Outdated Knowledge Base = invalid baseline = unreliable guard.

---

## 7. RELATION TO EXISTING GUARDS

| Guard | Covers | Does NOT cover |
|-------|--------|----------------|
| **Bug Guard** | What broke + how fixed | Structural placement of new additions |
| **Test Guard** | What was tested + results | Whether new addition fits architecture |
| **ADR Guard** | Why architecture decisions were made | Whether addition overlaps with existing |
| **Skill Intake Record** | What skills were added | Layer placement or structural compatibility |
| **Architecture Check Guard** ← **THIS** | **Structure review before ANY new addition** | Bug fixes, skill additions, doc updates |

All five guards together form **complete traceability** for CVF:

```
Bug fix               → Bug Guard
Test run              → Test Guard
Skill added           → Skill Intake Record
Architecture decision → ADR Guard
NEW addition proposed → Architecture Check Guard  ← THIS
```

---

## 8. KNOWLEDGE BASE MAINTENANCE RULE

`docs/CVF_CORE_KNOWLEDGE_BASE.md` is a **permanent governance document**.
Its location (`docs/`) is fixed and must NOT be moved or renamed.

It MUST be updated when:

| Event | Action required |
|-------|----------------|
| New CVF version released | Update version table (Section III) |
| New layer added | Update architecture diagram (Section II) |
| Risk model changes | Update Section V |
| New governance guard added | Update Section VII |
| File structure changes | Update Section IX |
| Quality metrics updated | Update Section X |

It does NOT need updating for:
- Individual skill additions
- Bug fixes
- Documentation updates for existing features
- Test additions

---

End of Architecture Check Guard Policy.
