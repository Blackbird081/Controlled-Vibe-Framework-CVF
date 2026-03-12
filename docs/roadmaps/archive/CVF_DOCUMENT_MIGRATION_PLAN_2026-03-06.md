# CVF DOCUMENT MIGRATION PLAN (2026-03-06)

Trạng thái: Migration plan đã hoàn tất. `Wave 1A`, `Wave 1B`, `Wave 2`, `Wave 3`, và `Wave 4` đã hoàn tất trong ngày `2026-03-06`.

> **Purpose:** Dọn cấu trúc `docs/` theo taxonomy mới mà không làm vỡ tham chiếu ổn định  
> **Authority:** `docs/INDEX.md` + `CVF_DOCUMENT_NAMING_GUARD.md` + `CVF_DOCUMENT_STORAGE_GUARD.md`

---

## 1. Goal

Chuẩn hóa `docs/` theo 2 nguyên tắc:

1. **Mọi file mới** phải đặt đúng taxonomy folder.
2. **File cũ ở root** sẽ được migration theo batch an toàn, có cập nhật reference đầy đủ.

Roadmap này không nhằm “dọn đẹp” đơn thuần.  
Nó nhằm biến `docs/` thành một kho hồ sơ có cấu trúc, dễ tra soát và ít drift hơn về lâu dài.

---

## 2. Migration Principles

- Không di chuyển hàng loạt trong một batch nếu chưa rõ impact boundary.
- Mỗi batch migration phải:
  - rename/move,
  - update references,
  - giữ canonical location rõ ràng,
  - tránh tạo trạng thái nửa cũ nửa mới.
- Các root-level file đang được dùng rộng rãi chỉ nên di chuyển khi có đủ lợi ích và reference map rõ.
- Khi một file đã được migrate, mọi link mới phải trỏ tới vị trí mới.

---

## 3. Current Root-Level Docs Classification

### A. Approved root-level files

Các file này được chốt là canonical entrypoint hoặc cross-cutting artifact:

- `BUG_HISTORY.md`
- `CHEAT_SHEET.md`
- `CVF_ARCHITECTURE_DECISIONS.md`
- `CVF_CORE_KNOWLEDGE_BASE.md`
- `CVF_INCREMENTAL_TEST_LOG.md`
- `GET_STARTED.md`
- `HOW_TO_APPLY_CVF.md`
- `INDEX.md`
- `VERSIONING.md`
- `VERSION_COMPARISON.md`

### B. Remaining candidate for `docs/reference/`

- No remaining reference candidates in current baseline.

### C. Remaining candidate for `docs/assessments/`

- No remaining assessment candidates in current baseline.

### D. Remaining candidate for `docs/baselines/`

- No remaining baseline candidates from the initial Wave 1 scope.

### E. Remaining candidate for `docs/roadmaps/`

- No remaining roadmap candidates from the initial Wave 1 scope.

### F. Already migrated in completed waves

Da di chuyen khoi `docs/` root:

- `CVF_CORE_COMPAT_BASELINE.md` -> `docs/baselines/`
- `CVF_TESTER_BASELINE_2026-02-25.md` -> `docs/baselines/`
- `CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md` -> `docs/assessments/`
- `CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md` -> `docs/assessments/`
- `CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md` -> `docs/assessments/`
- `CVF_INTEGRATION_ROADMAP_2026-02-24.md` -> `docs/roadmaps/`
- `CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md` -> `docs/roadmaps/`
- `CVF_SKILL_UPGRADE_ROADMAP_2026-02-22.md` -> `docs/roadmaps/`
- `CVF_TECHNICAL_STABILIZATION_ROADMAP_2026-02-22.md` -> `docs/roadmaps/`
- `CVF_V161_WEBUI_INTEGRATION_ROADMAP.md` -> `docs/roadmaps/`
- `CVF_FULL_PROJECT_ASSESSMENT_2026-02-24.md` -> `docs/assessments/`
- `CVF_PRE_FIX_ASSESSMENT_2026-02-25.md` -> `docs/assessments/`
- `CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md` -> `docs/assessments/`
- `CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_2026-02-25.md` -> `docs/assessments/`
- `CVF_VS_UUPM_COMPARISON_2026-02-22.md` -> `docs/assessments/`
- `CVF_AI_RESEARCH_SKILLS_ASSESSMENT_2026-02-26.md` -> `docs/assessments/`
- `CVF_ARCHITECTURE_MAP.md` -> `docs/reference/`
- `CVF_ARCHITECTURE_DIAGRAMS.md` -> `docs/reference/`
- `CVF_POSITIONING.md` -> `docs/reference/`
- `CVF_ADOPTION_STRATEGY.md` -> `docs/reference/`
- `CVF_SKILL_LIFECYCLE.md` -> `docs/reference/`
- `CVF_WHITEPAPER_GIT_FOR_AI.md` -> `docs/reference/`
- `CVF_WEB_TOOLKIT_GUIDE.md` -> `docs/reference/`
- `CVF_v16_AGENT_PLATFORM.md` -> `docs/reference/`
- `CVF_HYPERVISOR_STRATEGY.md` -> `docs/reference/`
- `CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md` -> `docs/reference/`
- `CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md` -> `docs/reference/`
- `CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md` -> `docs/reference/`
- `CVF_IN_VSCODE_GUIDE.md` -> `docs/reference/`
- `CVF_INDEPENDENT_ASSESSMENT_2026-02-28.md` -> `docs/assessments/`

### G. Review archive already migrated

Các file review của `CVF_Phase Governance Protocol` đã được chuyển vào:

- `docs/reviews/cvf_phase_governance/`

---

## 4. Migration Waves

## Wave 1 — Safe governance records with clear taxonomy

Ưu tiên:

- `docs/assessments/`
- `docs/baselines/`
- `docs/roadmaps/`

Lý do:

- nhóm này có taxonomy rõ nhất,
- ít gây tranh cãi về placement,
- giúp giảm rối trong root nhanh nhất.

### Wave 1 targets

- `CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
- `CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
- `CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md`
- `CVF_CORE_COMPAT_BASELINE.md`
- `CVF_TESTER_BASELINE_2026-02-25.md`
- `CVF_INTEGRATION_ROADMAP_2026-02-24.md`
- `CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md`
- `CVF_SKILL_UPGRADE_ROADMAP_2026-02-22.md`
- `CVF_TECHNICAL_STABILIZATION_ROADMAP_2026-02-22.md`
- `CVF_V161_WEBUI_INTEGRATION_ROADMAP.md`

Wave 1A status:

- `2026-03-06` -> executed for:
  - `CVF_CORE_COMPAT_BASELINE.md`
  - `CVF_TESTER_BASELINE_2026-02-25.md`
  - `CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
  - `CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
  - `CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md`

Wave 1B status:

- `2026-03-06` -> executed for:
  - `CVF_INTEGRATION_ROADMAP_2026-02-24.md`
  - `CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md`
  - `CVF_SKILL_UPGRADE_ROADMAP_2026-02-22.md`
  - `CVF_TECHNICAL_STABILIZATION_ROADMAP_2026-02-22.md`
  - `CVF_V161_WEBUI_INTEGRATION_ROADMAP.md`

## Wave 2 — Extended assessments and domain comparison docs

- `CVF_FULL_PROJECT_ASSESSMENT_2026-02-24.md`
- `CVF_PRE_FIX_ASSESSMENT_2026-02-25.md`
- `CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`
- `CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_2026-02-25.md`
- `CVF_VS_UUPM_COMPARISON_2026-02-22.md`
- `CVF_AI_RESEARCH_SKILLS_ASSESSMENT_2026-02-26.md`

Wave 2 status:

- `2026-03-06` -> executed for:
  - `CVF_FULL_PROJECT_ASSESSMENT_2026-02-24.md`
  - `CVF_PRE_FIX_ASSESSMENT_2026-02-25.md`
  - `CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`
  - `CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_2026-02-25.md`
  - `CVF_VS_UUPM_COMPARISON_2026-02-22.md`
  - `CVF_AI_RESEARCH_SKILLS_ASSESSMENT_2026-02-26.md`

## Wave 3 — Reference docs

- `CVF_ARCHITECTURE_MAP.md`
- `CVF_ARCHITECTURE_DIAGRAMS.md`
- `CVF_POSITIONING.md`
- `CVF_ADOPTION_STRATEGY.md`
- `CVF_SKILL_LIFECYCLE.md`
- `CVF_WHITEPAPER_GIT_FOR_AI.md`
- `CVF_WEB_TOOLKIT_GUIDE.md`
- `CVF_v16_AGENT_PLATFORM.md`

Wave 3 status:

- `2026-03-06` -> executed for:
  - `CVF_ARCHITECTURE_MAP.md`
  - `CVF_ARCHITECTURE_DIAGRAMS.md`
  - `CVF_POSITIONING.md`
  - `CVF_ADOPTION_STRATEGY.md`
  - `CVF_SKILL_LIFECYCLE.md`
  - `CVF_WHITEPAPER_GIT_FOR_AI.md`
  - `CVF_WEB_TOOLKIT_GUIDE.md`
  - `CVF_v16_AGENT_PLATFORM.md`

## Wave 4 — Root exception review

Đánh giá lại xem một số file đang giữ ở root có thực sự cần ở root nữa không:

- `CHEAT_SHEET.md`
- `HOW_TO_APPLY_CVF.md`
- `VERSIONING.md`
- `VERSION_COMPARISON.md`

Wave 4 status:

- `2026-03-06` -> executed decisions:
  - approved root-level allowlist fixed in `docs/INDEX.md`
  - naming exception allowlist updated in `CVF_DOCUMENT_NAMING_GUARD.md`
  - storage allowlist updated in `CVF_DOCUMENT_STORAGE_GUARD.md`
  - remaining legacy candidates removed from `docs/` root

---

## 5. Batch Execution Checklist

Mỗi batch migration phải làm đủ:

1. Xác nhận group file và taxonomy đích
2. Di chuyển file
3. Cập nhật toàn bộ references
4. Cập nhật `docs/INDEX.md` nếu taxonomy thay đổi
5. Cập nhật README/KB nếu canonical location thay đổi
6. Ghi rõ trong changelog/review nếu file là governance evidence quan trọng

---

## 6. Recommended Next Batch

Không còn batch migration bắt buộc trong baseline hiện tại.

Từ thời điểm này:

- file mới phải theo taxonomy hiện hành,
- mọi root-level addition mới cần governance approval rõ ràng,
- cleanup tiếp theo chỉ phát sinh nếu repo tạo thêm legacy drift mới.

---

## 7. Exit Condition

Migration plan này được xem là hoàn thành khi:

- file mới không còn phát sinh sai taxonomy,
- phần lớn governance records đã rời khỏi `docs/` root,
- `docs/` root chỉ còn:
  - entrypoints,
  - canonical cross-cutting files,
  - approved exceptions.

Trạng thái hiện tại: **COMPLETED**

---

## 8. Final Note

Taxonomy mới đã có hiệu lực cho file mới.  
Migration plan này đã hoàn thành vai trò dọn baseline lịch sử mà không làm vỡ canonical references.
