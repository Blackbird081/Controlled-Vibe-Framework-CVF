# CVF DIAGRAM VALIDATION GUARD

> **Guard ID:** GOV-OP-016
> **Layer:** 05_OPERATION
> **Status:** ACTIVE
> **Enforcement:** Automated via CI/CD + Manual Review

## 1. Mục đích (Purpose)

CVF áp dụng triết lý "Documentation is Code". Nếu Sơ đồ luồng (State Machine Diagram) và Code thực thi bị sai lệch (Documentation Drift), hệ thống quản trị sẽ mất tính toàn vẹn. 

Guard này đảm bảo: **100% Sơ đồ State Machine và TypeScript/Python Implementation phải khớp nhau và được validate tự động.**

## 2. Phạm vi áp dụng (Scope)

**Áp dụng CẤP BÁCH** đối với:
- Tất cả các nâng cấp (upgrades).
- Tất cả các Extention/Module mới.
- Bất kỳ Folder/Files mới nào có chứa logic State Machine / Governance Pipeline.

## 3. Quy định Bắt buộc (The Rule)

1. **Phải có Sơ đồ (Must Have Diagram):** 
   Mọi State Machine hoặc Workflow được lập trình BẮT BUỘC phải đi kèm 1 file Markdown chứa biểu đồ `mermaid` (loại `stateDiagram-v2`).

2. **Phải đồng nhất (Must Be Consistent):**
   Biểu đồ cấu trúc sơ đồ Mermaid KHÔNG ĐƯỢC CHỨA:
   - `missingStates` (Trạng thái có trong code nhưng sơ đồ thiếu).
   - `extraStates` (Trạng thái có trên sơ đồ nhưng code không hỗ trợ).
   - `missingTransitions` (Code có logic chuyển nhưng sơ đồ vẽ thiếu mũi tên).
   - `extraTransitions` (Sơ đồ vẽ mũi tên sai, code không có luồng này).

3. **Phải báo cáo trong Commit/PR:**
   Không một Developer hay AI Agent nào được quyền Merge Code nếu hệ thống Diagram Validator (tại `governance/diagram_validation/diagram.validator.ts`) báo lỗi.

## 4. Hành động (Triggering Action)

**Agent Process:**
1. Khi Agent xây dựng 1 StateMachine, nó phải gọi Tool/Skill vẽ Mermaid.
2. Agent phải tự gọi file `diagram.validator.ts` của Node.js (tồn tại trong `CVF_v1.1.1`) để tự kiểm tra đối chiếu.
3. Nếu phát hiện sai, Agent phải tự fix cấu trúc Mermaid HOẶC fix Code cho khớp.

**Pipeline Process:**
- Hệ thống CI/CD phải được bổ sung script tương đương `governance/compat/check_diagram_validation.py` để quét tự động tất cả các file state machine / mermaid trong project.

## 5. Vi phạm (Violation Handling)

Bất cứ nhánh (branch) hoặc tính năng nào vi phạm quy tắc này sẽ lập tức bị **BLOCK** khỏi quy trình Deploy.

---
*Verified against: CVF Unified Roadmap 2026 (Track I - Hardening CVF)*
