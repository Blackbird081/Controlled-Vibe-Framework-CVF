# CVF Archetype Mapping (v1.6 → v1.1)

> **Ngày:** 08/02/2026  
> **Mục tiêu:** Chuẩn hóa vai trò v1.6 (Agent Platform) theo archetype v1.1 để đảm bảo tính nhất quán governance.

---

## 1. Mapping chính thức

| v1.6 Role | v1.1 Archetype | Trọng trách cốt lõi | Gợi ý enforcement |
|---|---|---|---|
| **Orchestrator** | **Supervisor** | Điều phối workflow, phân rã nhiệm vụ, quyết định dừng/tiếp tục | Buộc check risk/authority trước khi assign |
| **Architect** | **Planning** | Thiết kế giải pháp, kiến trúc, ràng buộc kỹ thuật | Yêu cầu rõ assumptions + constraints |
| **Builder** | **Execution** | Triển khai, viết code/spec/output cụ thể | Bắt buộc theo format output + scope guard |
| **Reviewer** | **Analysis** | Đánh giá, phát hiện rủi ro, xác nhận chất lượng | Kiểm checklist + flag missing evidence |

---

## 2. Lý do mapping

- v1.1 là chuẩn archetype gốc của CVF, đã được dùng cho governance rules + risk model.  
- v1.6 chỉ là **UI role naming** để người dùng dễ hiểu.  
- Mapping giúp **giữ nguyên logic enforcement** giữa các phiên bản, tránh lệch hành vi.

---

## 3. Hướng dẫn áp dụng

- **Multi-agent workflow:**  
  - Luôn hiển thị role v1.6, nhưng lưu `archetype` v1.1 trong state.  
  - Dùng archetype cho enforcement (risk gate, phase gate, audit).

- **Single-agent workflow:**  
  - Nếu user chọn “1 AI = nhiều vai”, hệ thống tự map theo workflow sequence:  
    Orchestrator → Architect → Builder → Reviewer.

- **Wizard / Spec generation:**  
  - Khi người dùng chọn template, role mặc định nên là **Architect (Planning)**.  
  - Khi generate output cuối, role mặc định là **Builder (Execution)**.

---

## 4. Chú ý tương thích

- Mapping này **không thay đổi dữ liệu cũ**, chỉ là lớp tương thích.  
- Các file trong v1.1 vẫn giữ nguyên thuật ngữ archetype.  
- v1.6 UI chỉ cần hiển thị mapping để người dùng hiểu “vai trò nào tương ứng với archetype nào”.

---

## 5. Liên kết liên quan

- `governance/skill-library/specs/CVF_RISK_AUTHORITY_MAPPING.md`  
- `governance/skill-library/specs/CVF_SKILL_RISK_AUTHORITY_LINK.md`  
- `docs/CVF_WORKFLOW_IMPACT_REVIEW_2026-02-07.md`

