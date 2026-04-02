# CVF Docs Index

Memory class: POINTER_RECORD

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
  Default memory role: `POINTER_RECORD`
- `assessments/` — đánh giá, audit, reassessment, independent assessment
  Default memory role: `FULL_RECORD`
- `audits/` — audit packet chuyên biệt cho thay đổi lớn, merge review, structural audit, execution preflight audit
  Default memory role: `FULL_RECORD`
- `baselines/` — baseline, snapshot, freeze records, compatibility baselines
  Default memory role: `SUMMARY_RECORD`
- `roadmaps/` — roadmap, remediation plan, stabilization plan, rollout plan
  Default memory role: `SUMMARY_RECORD`
- `reviews/` — review archive theo scope/module
  Default memory role: `FULL_RECORD`
- `logs/` — archive cho các append-only log chain đã rollover khỏi active window
  Default memory role: `SUMMARY_RECORD`

## Placement Rule For New Files

Từ nay về sau:

- file mới trong `docs/` phải đặt vào đúng taxonomy folder,
- không tạo thêm hồ sơ dài hạn mới trực tiếp ở `docs/` root nếu không có lý do đặc biệt,
- nếu là tài liệu governance dài hạn thì phải tuân thủ cả:
  - `CVF_DOCUMENT_NAMING_GUARD.md`
  - `CVF_DOCUMENT_STORAGE_GUARD.md`
  - `CVF_MEMORY_GOVERNANCE_GUARD.md` khi tài liệu đó phục vụ durable memory sau này
  - `reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md` khi file đó là governed packet, evidence doc, closure doc, handoff/tracker sync, hoặc artifact claim có source truth rõ ràng
  - `reference/CVF_QUALITY_ASSESSMENT_STANDARD.md` khi file đó là tranche, wave, hoặc architecture quality scorecard
  - `reference/CVF_MAINTAINABILITY_STANDARD.md` khi file đó đụng hotspot public barrel, barrel smoke test, shared batch helper, shared fixture builder, hoặc summary/evidence layering
  - `reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md` khi task liên quan repository structure, folder cleanup, pre-public packaging, hoặc publication decisions (quy tắc bắt buộc đọc)
  - `reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md` khi file đó liên quan tới pre-public repository cleanup, root lifecycle posture, hoặc extension lifecycle posture
  - `reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md` khi file đó liên quan tới public/private publication posture, module export posture, hoặc selective public distribution
  - `reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md` khi cần cân nhắc mô hình public/private phù hợp trước khi quyết định publication
  - `reference/CVF_PREPUBLIC_P3_READINESS.md` khi chuẩn bị mở `P3`, đánh giá readiness trước relocation, hoặc đối chiếu phase-gate/exposure/export-readiness

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
- `reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md`
- `reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `reference/CVF_MAINTAINABILITY_STANDARD.md`
- `reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `reference/CVF_PREPUBLIC_P3_READINESS.md`
- `reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
- `reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
- `reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- `reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`
- `reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`
- `reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `../governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`

## Pre-Public Restructuring

If the current task is repository cleanup before public packaging:

- `reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md` — **binding protocol: read first**
- `roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `reference/CVF_PREPUBLIC_P3_READINESS.md`
- `reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- `../governance/toolkit/05_OPERATION/CVF_FAST_LANE_GOVERNANCE_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- `../governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- `reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `reference/CVF_REFERENCE_GOVERNED_LOOP.md`
- `reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `../governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md` — rule bắt buộc cập nhật baseline sau mỗi fix/update
- delivered move sets:
  - `P3/CP1` retired-reference-root cleanup
  - `P3/CP2` retained-internal-root relocation
- `CVF_SKILL_LIBRARY/` và `ui_governance_engine/` không còn ở visible repo root; chúng đã được relocate sang `../ECOSYSTEM/reference-roots/retained-internal/`
- `P3/CP3` re-assessment hiện đang `HOLD`; xem:
  - `audits/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_REVIEW_2026-04-02.md`
  - `baselines/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_DELTA_2026-04-02.md`
- `v1.0/` và `v1.1/` vẫn blocked vì reference density và onboarding coupling còn cao
- `REVIEW/` hiện không được coi là next tracked relocation unit
- `P3/CP4` re-assessment cũng đang `HOLD`; xem:
  - `audits/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_REVIEW_2026-04-02.md`
  - `baselines/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_DELTA_2026-04-02.md`
- current unresolved point: isolated `P3` execution path đã rõ, nhưng landing path hợp lệ về `cvf-next` chưa được canon hóa rõ ràng
- `P3/CP5` strategy pivot đã approve:
  - `audits/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_REVIEW_2026-04-02.md`
  - `baselines/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_DELTA_2026-04-02.md`
- practical posture mới:
  - giữ `v1.0/` và `v1.1/` như visible frozen foundation anchors
  - giảm lộ diện bằng navigation / docs mirror / packaging curation, không mặc định ép move vật lý
- `P4/CP1` planning lane đã open:
  - `audits/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P4_CP1_CURATED_FRONT_DOOR_PLANNING_REVIEW_2026-04-02.md`
  - `baselines/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_DELTA_2026-04-02.md`
- practical next step mới:
  - planning-only cho curated front-door navigation
  - define docs mirror boundary + selective export candidates
  - chưa authorize public release, public mirror, hoặc move vật lý mới
- `P4/CP2` docs mirror boundary đã define:
  - `audits/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`
  - `baselines/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`
  - `reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- practical implication mới:
  - future `PUBLIC_DOCS_MIRROR` là curated subset, không phải mirror toàn bộ `docs/`
  - `audits / reviews / baselines / logs / roadmaps` và docs dense vẫn ở private core
  - export-candidate shortlist vẫn là packet riêng tiếp theo
- `P4/CP3` export shortlist đã define:
  - `audits/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P4_CP3_EXPORT_SHORTLIST_DEFINITION_REVIEW_2026-04-02.md`
  - `baselines/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_DELTA_2026-04-02.md`
  - `reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- current export posture:
  - first bounded shortlist: `CVF_GUARD_CONTRACT`, `CVF_v3.0_CORE_GIT_FOR_AI`, `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - broad foundations và `CVF_PLANE_FACADES` chưa vào first wave
  - shortlist vẫn chưa phải publication approval
- `P4/CP4` shortlist packaging boundary đã define:
  - `audits/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`
  - `baselines/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`
  - `reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- current export-packaging posture:
  - `CVF_GUARD_CONTRACT` boundary centers on root guard barrel, typed contracts, engine, explicit guards, and selected runtime helpers
  - `CVF_v3.0_CORE_GIT_FOR_AI` boundary centers on the root barrel plus `ai_commit`, `artifact_staging`, `artifact_ledger`, `process_model`, and `skill_lifecycle`
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` boundary centers on `contracts`, `adapters`, `policy`, `explainability`, and `risk_models`
  - cả ba vẫn là `NEEDS_PACKAGING`, chưa phải package publication
- `P4/CP5` curated front-door navigation đã define:
  - `audits/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_AUDIT_2026-04-02.md`
  - `reviews/CVF_GC019_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_REVIEW_2026-04-02.md`
  - `baselines/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_DELTA_2026-04-02.md`
  - `reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md`
- current front-door posture:
  - Ring 1 root entrypoints: `README.md`, `START_HERE.md`, `ARCHITECTURE.md`
  - Ring 2 guided docs paths are audience-based, không để reader mới rơi thẳng vào evidence-heavy zones
  - `v1.0/` và `v1.1/` vẫn visible nhưng được đẩy xuống intentional depth navigation, không còn là first-click emphasis
- `P4/CP6` root front-door content sync đã deliver:
  - `audits/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_AUDIT_2026-04-03.md`
  - `reviews/CVF_GC019_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_REVIEW_2026-04-03.md`
  - `baselines/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_DELTA_2026-04-03.md`
- current root front-door content result:
  - `README.md` now separates first-click navigation from the deeper private-core chain
  - `START_HERE.md` is now a short audience-routed redirect instead of an outdated extension-first stub
  - `ARCHITECTURE.md` now routes readers toward architecture depth before review-heavy surfaces

## Enterprise Audit Navigation

Nếu cần đóng gói bằng chứng cho audit/release/onboarding:

- `reference/CVF_ENTERPRISE_EVIDENCE_PACK.md`
- `reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md`
- `reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`

## Quality Navigation

Nếu cần đánh giá chất lượng theo cùng một chuẩn qua nhiều wave:

- `reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md`

## Restructuring Navigation

Nếu cần đọc bộ tài liệu chốt cuối cho restructuring thay vì đọc trực tiếp legacy source roots:

- `architecture/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`
- `reviews/CVF_RESTRUCTURING_CURRENT_CYCLE_CLOSURE_REVIEW_2026-03-21.md`
- `reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_2026-03-21.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T1_2026-03-21.md`
- `roadmaps/CVF_WHITEPAPER_W0_SCOPED_BACKLOG_2026-03-21.md`
- `reviews/CVF_WHITEPAPER_FIRST_TRANCHE_PACKET_2026-03-21.md`
- `roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W4_T4_2026-03-22.md`
- `roadmaps/CVF_W4_T4_GOVERNANCE_SIGNAL_BRIDGE_EXECUTION_PLAN_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_GC018_W4_T4_AUTHORIZATION_DELTA_2026-03-22.md`
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
- `reviews/CVF_WHITEPAPER_SCOPE_CLARIFICATION_PACKET_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_SCOPE_CLARIFICATION_DELTA_2026-03-22.md`
- `reviews/CVF_W1_T2_USABLE_INTAKE_SLICE_PACKET_2026-03-22.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T2_2026-03-22.md`
- `roadmaps/CVF_W1_T2_USABLE_INTAKE_SLICE_EXECUTION_PLAN_2026-03-22.md`
- `audits/CVF_W1_T2_CP1_USABLE_INTAKE_CONTRACT_BASELINE_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T2_CP1_USABLE_INTAKE_CONTRACT_BASELINE_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T2_USABLE_INTAKE_SLICE_PLANNING_DELTA_2026-03-22.md`
- `baselines/CVF_W1_T2_CP1_USABLE_INTAKE_CONTRACT_BASELINE_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T2_CP2_UNIFIED_KNOWLEDGE_RETRIEVAL_CONTRACT_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T2_CP3_DETERMINISTIC_CONTEXT_PACKAGING_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T2_CP3_DETERMINISTIC_CONTEXT_PACKAGING_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T2_CP3_DETERMINISTIC_CONTEXT_PACKAGING_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T2_CP4_REAL_CONSUMER_PATH_PROOF_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T2_CP4_REAL_CONSUMER_PATH_PROOF_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T2_CP4_REAL_CONSUMER_PATH_PROOF_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T2_CP5_TRANCHE_CLOSURE_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T2_CP5_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `reviews/CVF_W1_T2_USABLE_INTAKE_SLICE_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T3_2026-03-22.md`
- `reviews/CVF_W1_T3_USABLE_DESIGN_ORCHESTRATION_SLICE_PACKET_2026-03-22.md`
- `roadmaps/CVF_W1_T3_USABLE_DESIGN_ORCHESTRATION_SLICE_EXECUTION_PLAN_2026-03-22.md`
- `audits/CVF_W1_T3_CP1_DESIGN_CONTRACT_BASELINE_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T3_CP1_DESIGN_CONTRACT_BASELINE_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T3_CP1_DESIGN_CONTRACT_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T3_CP2_BOARDROOM_SESSION_CONTRACT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T3_CP2_BOARDROOM_SESSION_CONTRACT_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T3_CP2_BOARDROOM_SESSION_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T3_CP3_ORCHESTRATION_CONTRACT_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T3_CP3_ORCHESTRATION_CONTRACT_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T3_CP3_ORCHESTRATION_IMPLEMENTATION_DELTA_2026-03-22.md`
- `audits/CVF_W1_T3_CP4_DESIGN_CONSUMER_PATH_PROOF_AUDIT_2026-03-22.md`
- `reviews/CVF_GC019_W1_T3_CP4_DESIGN_CONSUMER_PATH_PROOF_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T3_CP4_DESIGN_CONSUMER_PATH_PROOF_DELTA_2026-03-22.md`
- `reviews/CVF_W1_T3_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `baselines/CVF_W1_T3_CANONICAL_RECONCILIATION_DELTA_2026-03-22.md`
- `baselines/CVF_AGENT_HANDOFF_TEMPLATE_CANONICALIZATION_DELTA_2026-03-22.md`
- `baselines/CVF_AGENT_HANDOFF_GUARD_ADOPTION_DELTA_2026-03-22.md`
- `baselines/CVF_AGENT_HANDOFF_TRANSITION_AUTOMATION_DELTA_2026-03-22.md`
- `baselines/CVF_GC020_RUNTIME_HANDOFF_ENFORCEMENT_DELTA_2026-03-22.md`
- `baselines/CVF_GC020_CONTEXT_CONTINUITY_PRINCIPLE_DELTA_2026-03-22.md`
- `baselines/CVF_GC021_FAST_LANE_GOVERNANCE_ADOPTION_DELTA_2026-03-22.md`
- `baselines/CVF_GC021_GC022_ROLE_CLARIFICATION_DELTA_2026-03-22.md`
- `baselines/CVF_GC022_MEMORY_GOVERNANCE_ADOPTION_DELTA_2026-03-22.md`
- `baselines/CVF_README_GOVERNANCE_FRONTDOOR_SYNC_DELTA_2026-03-22.md`
- `baselines/CVF_W1_T2_CLOSURE_DOC_RECONCILIATION_DELTA_2026-03-22.md`
- `baselines/CVF_WHITEPAPER_GC018_W1_T2_AUTHORIZATION_DELTA_2026-03-22.md`
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

`CVF_Important/`, `CVF_Restructure/`, và `CVF Edit/` đã được retire khỏi visible repo root ở `P3/CP1`. Nếu local recovery copy còn tồn tại thì nó chỉ thuộc `.private_reference/legacy/`, không còn là canonical storage path.

`CVF_SKILL_LIBRARY/` và `ui_governance_engine/` đã được relocate khỏi visible repo root ở `P3/CP2` sang `../ECOSYSTEM/reference-roots/retained-internal/`. Chúng vẫn là retained/internal lineage, không phải visible canonical roots.

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
