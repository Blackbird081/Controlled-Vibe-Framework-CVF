# CVF Docs Index

Trạng thái: Chỉ mục lưu trữ chính thức cho `docs/`.

## Purpose

- Chuẩn hóa nơi đặt tài liệu trong `docs/`
- Giúp human và Agent tìm đúng loại hồ sơ nhanh hơn
- Biến việc phân loại tài liệu thành quy ước bắt buộc cho mọi file mới

## Storage Taxonomy

### Core learning docs

- `concepts/` — khái niệm, mô hình, nguyên lý
- `guides/` — hướng dẫn theo persona/team
- `tutorials/` — walkthrough từng bước
- `cheatsheets/` — tra cứu nhanh
- `case-studies/` — tình huống áp dụng thực tế

### Governance and record docs

- `reference/` — tài liệu chuẩn, authoritative, long-lived
- `assessments/` — đánh giá, audit, reassessment, independent assessment
- `audits/` — audit packet chuyên biệt cho thay đổi lớn, merge review, structural audit, execution preflight audit
- `baselines/` — baseline, snapshot, freeze records, compatibility baselines
- `roadmaps/` — roadmap, remediation plan, stabilization plan, rollout plan
- `reviews/` — review archive theo scope/module
- `logs/` — archive cho các append-only log chain đã rollover khỏi active window

## Placement Rule For New Files

Từ nay về sau:

- file mới trong `docs/` phải đặt vào đúng taxonomy folder,
- không tạo thêm hồ sơ dài hạn mới trực tiếp ở `docs/` root nếu không có lý do đặc biệt,
- nếu là tài liệu governance dài hạn thì phải tuân thủ cả:
  - `CVF_DOCUMENT_NAMING_GUARD.md`
  - `CVF_DOCUMENT_STORAGE_GUARD.md`

## Approved Root-Level Files

Các file sau được phép ở `docs/` root như canonical entrypoint hoặc cross-cutting artifact:

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

Mọi file dài hạn khác phải vào taxonomy folder phù hợp.

## Root Status

`docs/` root đã được chuẩn hóa về allowlist chính thức.

Điều này có nghĩa:

- chỉ các file nằm trong danh sách `Approved Root-Level Files` mới được phép ở `docs/` root,
- mọi file dài hạn mới khác phải vào taxonomy folder phù hợp,
- nếu root phát sinh file ngoài allowlist, đó là drift cần được sửa chứ không phải ngoại lệ mặc định.

## Migration Plan

Kế hoạch migration có kiểm soát cho các file lịch sử đang ở `docs/` root:

- `roadmaps/CVF_DOCUMENT_MIGRATION_PLAN_2026-03-06.md` — completed baseline cleanup

## Path Recovery

Nếu gặp path cũ hoặc tab IDE stale sau migration:

- `reference/CVF_CANONICAL_PATH_MAP_2026-03-06.md`

## Release Navigation

Nếu cần xác định baseline/release line/module status hiện hành:

- `reference/CVF_RELEASE_MANIFEST.md`
- `reference/CVF_MODULE_INVENTORY.md`
- `reference/CVF_MATURITY_MATRIX.md`
- `reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `reference/CVF_REFERENCE_GOVERNED_LOOP.md`
- `reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `../governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md` — rule bắt buộc cập nhật baseline sau mỗi fix/update

## Enterprise Audit Navigation

Nếu cần đóng gói bằng chứng cho audit/release/onboarding:

- `reference/CVF_ENTERPRISE_EVIDENCE_PACK.md`
- `reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md`
- `reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`

## Restructuring Navigation

Nếu cần đọc bộ tài liệu chốt cuối cho restructuring thay vì đọc trực tiếp `CVF_Important/REVIEW FOLDER`:

- `architecture/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`
- `reviews/CVF_RESTRUCTURING_CURRENT_CYCLE_CLOSURE_REVIEW_2026-03-21.md`
- `reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_2026-03-21.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T1_2026-03-21.md`
- `roadmaps/CVF_WHITEPAPER_W0_SCOPED_BACKLOG_2026-03-21.md`
- `reviews/CVF_WHITEPAPER_FIRST_TRANCHE_PACKET_2026-03-21.md`
- `roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- `roadmaps/CVF_W1_T1_CONTROL_PLANE_EXECUTION_PLAN_2026-03-21.md`
- `audits/CVF_W1_T1_CP1_CONTROL_PLANE_FOUNDATION_AUDIT_2026-03-21.md`
- `reviews/CVF_GC019_W1_T1_CP1_CONTROL_PLANE_FOUNDATION_REVIEW_2026-03-21.md`
- `baselines/CVF_W1_T1_CP1_CONTROL_PLANE_IMPLEMENTATION_DELTA_2026-03-21.md`
- `audits/CVF_W1_T1_CP2_KNOWLEDGE_CONTEXT_WRAPPER_ALIGNMENT_AUDIT_2026-03-21.md`
- `reviews/CVF_GC019_W1_T1_CP2_KNOWLEDGE_CONTEXT_WRAPPER_ALIGNMENT_REVIEW_2026-03-21.md`
- `baselines/CVF_W1_T1_CP2_KNOWLEDGE_CONTEXT_IMPLEMENTATION_DELTA_2026-03-21.md`
- `audits/CVF_W1_T1_CP3_GOVERNANCE_CANVAS_REPORTING_INTEGRATION_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T1_CP3_GOVERNANCE_CANVAS_REPORTING_INTEGRATION_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T1_CP3_GOVERNANCE_CANVAS_PACKET_DELTA_2026-03-22.md`
- `baselines/CVF_W1_T1_CP3_GOVERNANCE_CANVAS_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T1_CP4_SELECTED_CONTROLLED_INTELLIGENCE_SURFACE_ALIGNMENT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T1_CP4_SELECTED_CONTROLLED_INTELLIGENCE_SURFACE_ALIGNMENT_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T1_CP4_SELECTED_CONTROLLED_INTELLIGENCE_PACKET_DELTA_2026-03-22.md`
- `baselines/CVF_W1_T1_CP4_SELECTED_CONTROLLED_INTELLIGENCE_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T1_CP5_TRANCHE_CLOSURE_REVIEW_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T1_CP5_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T1_CP5_TRANCHE_CLOSURE_PACKET_DELTA_2026-03-22.md`
- `reviews/CVF_W1_T1_CONTROL_PLANE_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T1_CONTROL_PLANE_TRANCHE_CLOSURE_DELTA_2026-03-22.md`
- `reviews/CVF_W2_T1_EXECUTION_PLANE_TRANCHE_PACKET_2026-03-22.md`
- `reviews/CVF_WHITEPAPER_REALIZATION_RECONCILIATION_REVIEW_2026-03-22.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W2_T1_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_GC018_W2_T1_AUTHORIZATION_DELTA_2026-03-22.md`
- `roadmaps/CVF_W2_T1_EXECUTION_PLANE_EXECUTION_PLAN_2026-03-22.md`
- `audits/CVF_W2_T1_CP1_EXECUTION_PLANE_FOUNDATION_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W2_T1_CP1_EXECUTION_PLANE_FOUNDATION_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_EXECUTION_PLANE_PLANNING_DELTA_2026-03-22.md`
- `baselines/CVF_W2_T1_CP1_EXECUTION_PLANE_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W2_T1_CP2_MCP_GATEWAY_WRAPPER_ALIGNMENT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W2_T1_CP2_MCP_GATEWAY_WRAPPER_ALIGNMENT_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_CP2_MCP_GATEWAY_WRAPPER_ALIGNMENT_PACKET_DELTA_2026-03-22.md`
- `baselines/CVF_W2_T1_CP2_MCP_GATEWAY_WRAPPER_ALIGNMENT_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W2_T1_CP3_ADAPTER_EVIDENCE_EXPLAINABILITY_INTEGRATION_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W2_T1_CP3_ADAPTER_EVIDENCE_EXPLAINABILITY_INTEGRATION_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_CP3_ADAPTER_EVIDENCE_EXPLAINABILITY_INTEGRATION_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W2_T1_CP4_AUTHORIZATION_BOUNDARY_ALIGNMENT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W2_T1_CP4_AUTHORIZATION_BOUNDARY_ALIGNMENT_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_CP4_AUTHORIZATION_BOUNDARY_ALIGNMENT_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W2_T1_CP5_TRANCHE_CLOSURE_REVIEW_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W2_T1_CP5_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_CP5_TRANCHE_CLOSURE_PACKET_DELTA_2026-03-22.md`
- `reviews/CVF_W2_T1_EXECUTION_PLANE_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W2_T1_EXECUTION_PLANE_TRANCHE_CLOSURE_DELTA_2026-03-22.md`
- `reviews/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_PACKET_2026-03-22.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W3_T1_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_GC018_W3_T1_AUTHORIZATION_DELTA_2026-03-22.md`
- `roadmaps/CVF_W3_T1_GOVERNANCE_EXPANSION_EXECUTION_PLAN_2026-03-22.md`
- `audits/CVF_W3_T1_CP1_GOVERNANCE_EXPANSION_FOUNDATION_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W3_T1_CP1_GOVERNANCE_EXPANSION_FOUNDATION_REVIEW_2026-03-22.md`
- `baselines/CVF_W3_T1_GOVERNANCE_EXPANSION_PLANNING_DELTA_2026-03-22.md`
- `baselines/CVF_W3_T1_CP1_GOVERNANCE_EXPANSION_IMPLEMENTATION_DELTA_2026-03-22.md`
- `reviews/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_CLOSURE_DELTA_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_REALIZATION_RECONCILIATION_DELTA_2026-03-22.md`
- `reviews/CVF_BASELINE_INTEGRITY_REVIEW_2026-03-21.md`
- `reviews/CVF_EA_CROSS_CHECK_RECONCILIATION_2026-03-21.md`
- `baselines/CVF_BASELINE_ERRATA_MATRIX_2026-03-21.md`
- `baselines/CVF_BASELINE_ASSERTION_CLASSIFICATION_2026-03-21.md`
- `baselines/CVF_RESTRUCTURING_CANONICAL_DOC_PROMOTION_DELTA_2026-03-21.md`
- `baselines/CVF_RESTRUCTURING_CURRENT_CYCLE_CLOSURE_DELTA_2026-03-21.md`
- `baselines/CVF_WHITEPAPER_COMPLETION_PLANNING_DELTA_2026-03-21.md`
- `baselines/CVF_WHITEPAPER_GC018_W0_AUTHORIZATION_DELTA_2026-03-21.md`
- `baselines/CVF_WHITEPAPER_W0_DISCOVERY_SCOPING_DELTA_2026-03-21.md`
- `baselines/CVF_WHITEPAPER_GC018_W1_T1_AUTHORIZATION_DELTA_2026-03-21.md`
- `baselines/CVF_W1_T1_CONTROL_PLANE_PLANNING_DELTA_2026-03-21.md`

`CVF_Important/REVIEW FOLDER` vẫn được giữ làm reference archive cho packet này, nhưng không còn là canonical storage path.

## Conformance Navigation

Nếu cần chạy hoặc tra cứu conformance baseline:

- `reference/CVF_CONFORMANCE_SCENARIOS.md`
- `reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md`

## Automated Enforcement

Gate kỹ thuật hiện hành cho `docs/**/*.md`:

- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`

Gate kỹ thuật cho active test log window:

- `python governance/compat/check_incremental_test_log_rotation.py --enforce`
