# Compliance Checklist

> **Domain:** Legal & Contracts  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng:**
- Launch sản phẩm ở thị trường mới
- Audit compliance định kỳ
- Chuẩn bị cho external audit

**Không phù hợp khi:**
- Complex multi-jurisdiction → Cần specialist

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Business type** | Loại hình | ✅ | "SaaS B2B" |
| **Target markets** | Thị trường | ✅ | "Vietnam, EU, Singapore" |
| **Data collected** | Data thu thập | ✅ | "Email, name, payment" |
| **Data storage** | Lưu trữ | ✅ | "AWS Singapore" |

---

## ✅ Expected Output

- Checklist theo jurisdiction
- Key requirements và action items
- Priority ranking

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Cover đúng jurisdictions
- [ ] Requirements actionable
- [ ] Priority ranking hợp lý
- [ ] Include documentation needs

**Red flags:**
- ⚠️ Missing major regulations
- ⚠️ Outdated requirements

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Start with data map** — Know what you collect
2. **Check all markets** — Each có laws khác nhau
3. **Document everything** — Audits need proof
4. **Regular review** — Laws change

---

## 🔗 Next Step

Sau khi hoàn thành **Compliance Checklist**, tiếp tục với:
→ [Terms of Service](./03_terms_of_service.skill.md)

---

*Compliance Checklist Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Market: VN + EU
Data: PII + payment via Stripe
Sản phẩm: StockFlow
```

### Output mẫu:
```markdown
# Compliance Checklist

- GDPR: DSAR process, DPA với Stripe
- Privacy Policy: legal basis + cookies
- Data retention: 12 tháng (audit logs)
- Security: MFA cho admin, audit log
- Tax/Invoice: xuất hóa đơn VAT
```

### Đánh giá:
- ✅ Checklist đúng thị trường
- ✅ Bao phủ data + security + tax
- ✅ Hành động cụ thể
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Terms of Service](./03_terms_of_service.skill.md)
- [IP Protection](./05_ip_protection.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Compliance Checklist**, tiếp tục với:
→ [IP Protection](./05_ip_protection.skill.md)

---

*CVF Skill Library v1.5.2 | Legal & Contracts Domain*
