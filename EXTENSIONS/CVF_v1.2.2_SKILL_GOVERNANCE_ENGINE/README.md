# CVF-SGE v2.0
Controlled Vibe Framework – Self-Governed Execution Engine

---

## 1. Mục tiêu

CVF-SGE v2.0 là một Execution Framework có khả năng:

- Quản lý nhiều nguồn skill (static + dynamic)
- Đánh giá risk và cost trước khi thực thi
- Tự xếp hạng và chọn skill tối ưu
- Ghi nhận đầy đủ execution, cost và audit trail
- Tự tiến hóa thông qua historical weighting

Đây không phải là skill repository.
Đây là một runtime intelligence layer có governance tích hợp.

---

## 2. Kiến trúc tổng thể

/policy → Quy tắc & ngưỡng kiểm soát
/internal_ledger → Lưu trữ trạng thái & lịch sử
/runtime → Thực thi & kiểm soát hợp đồng
/fusion → Quyết định chọn skill đa yếu tố


Luồng chính:

Candidate Search
→ Semantic Ranking
→ Historical Weight
→ Cost Optimization
→ Final Selection
→ Contract Enforcement
→ Execution
→ Logging & Cost Ledger

---

## 3. Nguồn Skill được hỗ trợ

Framework hỗ trợ 4 loại nguồn:

- ai_research_skills
- awesome_claude_skills
- skills_sh
- acontext_dynamic (injected runtime)

Dynamic skill injection được quản lý qua internal ledger và không bypass governance.

---

## 4. Governance Model

Governance được phân tầng:

- Global Policy (risk & execution rules)
- Domain Policy (domain-specific constraint)
- Risk Matrix (weighted factors)
- Cost Control Policy (token & runtime limits)

Mọi execution phải đi qua:

- Risk threshold check
- Contract validation
- Cost evaluation
- Revocation check

Không có execution trực tiếp.

---

## 5. Fusion Intelligence

Fusion layer hoạt động theo pipeline:

1. candidate.search.ts  
   → Lọc skill theo domain + keyword

2. semantic.rank.ts  
   → Chấm điểm ngữ nghĩa theo query

3. historical.weight.ts  
   → Tăng trọng số theo usage & maturity

4. cost.optimizer.ts  
   → Trừ điểm theo estimated cost

5. final.selector.ts  
   → Chọn skill cuối cùng theo risk threshold

Fusion không thực thi.
Fusion chỉ quyết định.

---

## 6. Internal Ledger

Internal ledger đảm bảo:

- Skill registry
- Revocation tracking
- Execution logging
- Cost tracking
- Audit trail

Mọi hành động đều có thể truy vết.

---

## 7. Runtime Layer

Runtime chịu trách nhiệm:

- Load skill hợp lệ
- Enforce contract
- Execute handler
- Log execution
- Ghi cost

Runtime không quyết định chọn skill.
Runtime không tự ý bypass policy.

---

## 8. Tính chất hệ thống

- Deterministic execution pipeline
- Multi-factor skill selection
- Risk-aware
- Cost-aware
- Audit-ready
- Extensible nhưng không phá vỡ cấu trúc

---

## 9. Không phải

- Không phải chatbot
- Không phải skill marketplace
- Không phải LLM wrapper đơn thuần

Đây là một Self-Governed Execution Engine.

---

## 10. Versioning

Current Version: v2.0

Nếu cần bổ sung:

- Multi-agent governance
- Phase binding enforcement
- External compliance layer

→ Sẽ nâng lên v2.1 và bổ sung layer mới
không thay đổi core structure.

---

End of README.