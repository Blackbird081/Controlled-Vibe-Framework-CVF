# CVF CANONICAL PATH MAP (2026-03-06)

Trạng thái: Bảng đối chiếu canonical path sau đợt chuẩn hóa `docs/`.

## Purpose

- giúp human và Agent tra nhanh `path cũ -> path mới`
- giảm risk copy nhầm legacy path vào tài liệu mới
- làm reference ngắn cho các tab IDE stale sau migration

## Rule

- mọi link mới phải dùng canonical path mới
- path cũ chỉ còn giá trị lịch sử để đối chiếu
- nếu gặp link cũ trong file mới, phải sửa về canonical path

## 1. Immediate IDE Tab Mappings

Các tab stale đã thấy trong IDE:

- `docs/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
  -> `docs/assessments/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
- `REVIEW/independent_tester_assessment_2026-03-06.md`
  -> `docs/assessments/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
- `CVF_Phase Governance Protocol/De_xuat/Review/DANH_GIA_DOC_LAP_CVF_TOAN_DIEN_2026-03-06.md`
  -> `docs/reviews/cvf_phase_governance/CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md`

## 2. Review Archive Mappings

- `CVF_Phase Governance Protocol/De_xuat/Review/*`
  -> `docs/reviews/cvf_phase_governance/*`

Ví dụ:

- `EXECUTIVE_REVIEW_CVF_BASELINE_2026-03-06.md`
  -> `docs/reviews/cvf_phase_governance/CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`
- `ROADMAP_HOAN_THIEN_CVF_TOAN_DIEN_2026-03-06.md`
  -> `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`

## 3. Assessment Mappings

Mọi assessment/baseline verdict dài hạn đã được đưa về `docs/assessments/`.

Các canonical examples:

- `docs/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
  -> `docs/assessments/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`
- `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
  -> `docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
- `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-28.md`
  -> `docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-28.md`
- `docs/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md`
  -> `docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md`
- `docs/CVF_FULL_PROJECT_ASSESSMENT_2026-02-24.md`
  -> `docs/assessments/CVF_FULL_PROJECT_ASSESSMENT_2026-02-24.md`
- `docs/CVF_PRE_FIX_ASSESSMENT_2026-02-25.md`
  -> `docs/assessments/CVF_PRE_FIX_ASSESSMENT_2026-02-25.md`
- `docs/CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`
  -> `docs/assessments/CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`
- `docs/CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_2026-02-25.md`
  -> `docs/assessments/CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_2026-02-25.md`
- `docs/CVF_VS_UUPM_COMPARISON_2026-02-22.md`
  -> `docs/assessments/CVF_VS_UUPM_COMPARISON_2026-02-22.md`
- `docs/CVF_AI_RESEARCH_SKILLS_ASSESSMENT_2026-02-26.md`
  -> `docs/assessments/CVF_AI_RESEARCH_SKILLS_ASSESSMENT_2026-02-26.md`

## 4. Baseline Mappings

- `docs/CVF_CORE_COMPAT_BASELINE.md`
  -> `docs/baselines/CVF_CORE_COMPAT_BASELINE.md`
- `docs/CVF_TESTER_BASELINE_2026-02-25.md`
  -> `docs/baselines/CVF_TESTER_BASELINE_2026-02-25.md`

## 5. Roadmap Mappings

Mọi roadmap remediation/upgrade/integration dài hạn đã được đưa về `docs/roadmaps/`.

Canonical examples:

- `docs/CVF_INTEGRATION_ROADMAP_2026-02-24.md`
  -> `docs/roadmaps/CVF_INTEGRATION_ROADMAP_2026-02-24.md`
- `docs/CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md`
  -> `docs/roadmaps/CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md`
- `docs/CVF_SKILL_UPGRADE_ROADMAP_2026-02-22.md`
  -> `docs/roadmaps/CVF_SKILL_UPGRADE_ROADMAP_2026-02-22.md`
- `docs/CVF_TECHNICAL_STABILIZATION_ROADMAP_2026-02-22.md`
  -> `docs/roadmaps/CVF_TECHNICAL_STABILIZATION_ROADMAP_2026-02-22.md`
- `docs/CVF_V161_WEBUI_INTEGRATION_ROADMAP.md`
  -> `docs/roadmaps/CVF_V161_WEBUI_INTEGRATION_ROADMAP.md`

## 6. Reference Mappings

Mọi reference docs authoritative đã được đưa về `docs/reference/`.

Canonical examples:

- `docs/CVF_ARCHITECTURE_MAP.md`
  -> `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `docs/CVF_ARCHITECTURE_DIAGRAMS.md`
  -> `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`
- `docs/CVF_POSITIONING.md`
  -> `docs/reference/CVF_POSITIONING.md`
- `docs/CVF_ADOPTION_STRATEGY.md`
  -> `docs/reference/CVF_ADOPTION_STRATEGY.md`
- `docs/CVF_SKILL_LIFECYCLE.md`
  -> `docs/reference/CVF_SKILL_LIFECYCLE.md`
- `docs/CVF_WHITEPAPER_GIT_FOR_AI.md`
  -> `docs/reference/CVF_WHITEPAPER_GIT_FOR_AI.md`
- `docs/CVF_WEB_TOOLKIT_GUIDE.md`
  -> `docs/reference/CVF_WEB_TOOLKIT_GUIDE.md`
- `docs/CVF_v16_AGENT_PLATFORM.md`
  -> `docs/reference/CVF_v16_AGENT_PLATFORM.md`
- `docs/CVF_HYPERVISOR_STRATEGY.md`
  -> `docs/reference/CVF_HYPERVISOR_STRATEGY.md`
- `docs/CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md`
  -> `docs/reference/CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md`
- `docs/CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md`
  -> `docs/reference/CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md`
- `docs/CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md`
  -> `docs/reference/CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md`
- `docs/CVF_IN_VSCODE_GUIDE.md`
  -> `docs/reference/CVF_IN_VSCODE_GUIDE.md`

## 7. Final Note

Canonical storage taxonomy hiện hành:

- `docs/reference/`
- `docs/assessments/`
- `docs/baselines/`
- `docs/roadmaps/`
- `docs/reviews/`

Nếu nghi ngờ path nào là chuẩn, ưu tiên tra:

1. `docs/INDEX.md`
2. `docs/reference/README.md`
3. file này
