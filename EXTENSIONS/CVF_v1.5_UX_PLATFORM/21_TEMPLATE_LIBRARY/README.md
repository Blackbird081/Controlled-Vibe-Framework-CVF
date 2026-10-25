# 📚 Template Library

**CVF v1.5 — User Experience Platform**

---

## Mục đích

Template Library cung cấp **intent patterns sẵn sàng sử dụng** cho các use cases phổ biến.

User chỉ cần:

1. Chọn template phù hợp
2. Điền thông tin vào placeholders
3. Submit

---

## Domains

| Domain | Templates | Mô tả |
|--------|:---------:|-------|
| 📈 **BUSINESS/** | 5 | Strategy, risk, competitor |
| 🔧 **TECHNICAL/** | 5 | Code, architecture, security |
| ✍️ **CONTENT/** | 5 | Docs, reports, emails |
| 🔬 **RESEARCH/** | 3 | Literature, data analysis |

---

## Cách sử dụng

### Bước 1: Chọn Domain

```
BUSINESS/    → Phân tích kinh doanh
TECHNICAL/   → Review kỹ thuật
CONTENT/     → Tạo nội dung
RESEARCH/    → Nghiên cứu
```

### Bước 2: Chọn Template

Mỗi template có:

- **Mô tả** — Khi nào dùng
- **Form Fields** — Cần điền gì
- **Intent Pattern** — Copy & paste
- **Output Expected** — Kết quả mong đợi

### Bước 3: Điền Form

Thay thế `[placeholder]` bằng thông tin thực tế.

### Bước 4: Submit

- Via CLI: `cvf user submit --preset [template]`
- Via Web: Chọn template → Điền form → Submit

---

## Template Format

Mỗi template tuân theo format chuẩn:

```markdown
# [Template Name]

## Mô tả ngắn
## Khi nào dùng
## Form Fields
## Intent Pattern
## Output Expected
## Examples
```

---

## Quick Access

### 📈 Business Templates

| Template | File |
|----------|------|
| Strategy Analysis | [strategy_analysis.md](BUSINESS/strategy_analysis.md) |
| Risk Assessment | [risk_assessment.md](BUSINESS/risk_assessment.md) |
| Competitor Review | [competitor_review.md](BUSINESS/competitor_review.md) |
| Market Research | [market_research.md](BUSINESS/market_research.md) |
| Business Proposal | [business_proposal.md](BUSINESS/business_proposal.md) |

### 🔧 Technical Templates

| Template | File |
|----------|------|
| Code Review | [code_review.md](TECHNICAL/code_review.md) |
| Architecture Review | [architecture_review.md](TECHNICAL/architecture_review.md) |
| Security Audit | [security_audit.md](TECHNICAL/security_audit.md) |
| Performance Review | [performance_review.md](TECHNICAL/performance_review.md) |
| API Design Review | [api_design_review.md](TECHNICAL/api_design_review.md) |

### ✍️ Content Templates

| Template | File |
|----------|------|
| Documentation | [documentation.md](CONTENT/documentation.md) |
| Report Writing | [report_writing.md](CONTENT/report_writing.md) |
| Email Templates | [email_templates.md](CONTENT/email_templates.md) |
| Blog Writing | [blog_writing.md](CONTENT/blog_writing.md) |
| Presentation | [presentation.md](CONTENT/presentation.md) |

### 🔬 Research Templates

| Template | File |
|----------|------|
| Literature Review | [literature_review.md](RESEARCH/literature_review.md) |
| Data Analysis | [data_analysis.md](RESEARCH/data_analysis.md) |
| Survey Analysis | [survey_analysis.md](RESEARCH/survey_analysis.md) |

---

## Đóng góp Template

Xem [GOVERNANCE/template_contribution.md](../GOVERNANCE/template_contribution.md)

---

*Template Library — CVF v1.5 UX Platform*
