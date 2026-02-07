# Dashboard

> **Domain:** Web Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07
> **Source:** Vibecode Kit v4.0

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Bảng điều khiển quản lý dữ liệu
- Admin panel cho hệ thống
- Analytics/reporting dashboard
- Data visualization

**Không phù hợp khi:**
- Cần public-facing website → Dùng Landing Page
- App có nhiều features → Dùng SaaS App
- Chỉ cần CRUD đơn giản → Dùng simple admin template

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Mục đích** | Dashboard để làm gì? | ✅ | "Theo dõi sales và inventory" |
| **Data chính** | Dữ liệu nào cần hiển thị? | ✅ | "Revenue, orders, products, customers" |
| **KPIs** | 4-6 metrics quan trọng | ✅ | "Total revenue, Orders today, Conversion rate" |
| **Người dùng** | Ai sẽ xem dashboard? | ✅ | "CEO, Sales manager" |
| **Actions** | Cần thao tác gì? | ❌ | "Filter by date, Export to Excel" |
| **Dark mode** | Cần dark mode không? | ❌ | "Có, user làm việc nhiều giờ" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Dashboard layout hoàn chỉnh
- KPI cards với số liệu chính
- Charts phù hợp với loại data
- Tables với filter/sort
- Responsive design

**Cấu trúc tiêu chuẩn:**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌────────────────────────────────────────┐   │
│  │          │ │              HEADER                    │   │
│  │          │ │  Search | Date Filter | Profile       │   │
│  │          │ └────────────────────────────────────────┘   │
│  │  SIDEBAR │ ┌────────────────────────────────────────┐   │
│  │          │ │                                        │   │
│  │  • Home  │ │  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │   │
│  │  • Sales │ │  │KPI1│ │KPI2│ │KPI3│ │KPI4│         │   │
│  │  • Users │ │  └────┘ └────┘ └────┘ └────┘         │   │
│  │  • ...   │ │                                        │   │
│  │          │ │  ┌─────────────┐ ┌─────────────┐      │   │
│  │          │ │  │   CHART 1   │ │   CHART 2   │      │   │
│  │          │ │  └─────────────┘ └─────────────┘      │   │
│  │          │ │                                        │   │
│  │          │ │  ┌─────────────────────────────┐      │   │
│  │          │ │  │       DATA TABLE            │      │   │
│  │          │ │  └─────────────────────────────┘      │   │
│  └──────────┘ └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] KPI cards hiển thị metrics quan trọng
- [ ] Charts phù hợp với loại data
- [ ] Tables có filter/sort/pagination
- [ ] Date range picker hoạt động
- [ ] Dark mode toggle (nếu yêu cầu)
- [ ] Loading states có

**Red flags (cần Reject):**
- ⚠️ Data quá nhiều, không focus
- ⚠️ Charts sai loại (pie cho trend data)
- ⚠️ Không có loading states
- ⚠️ Mobile view không đọc được

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Quá nhiều data | Focus 4-6 KPIs chính |
| Chart sai loại | Line=trends, Bar=compare, Pie=parts |
| Không có context | Thêm comparison (vs last week) |
| Mobile bị vỡ | Test responsive từ đầu |
| Loading chậm | Lazy load, pagination |

---

## 💡 Tips

1. **4-6 KPIs là đủ** — Quá nhiều = không ai xem
2. **Chart phải dễ đọc** — Color contrast, labels rõ
3. **Comparison adds context** — "+15% vs last week"
4. **Dark mode cho heavy use** — Người dùng nhiều giờ cần dark
5. **Export là must-have** — CSV/Excel cho analysis

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Mục đích: Sales dashboard cho e-commerce
Data chính: Orders, revenue, products, customers
KPIs: 
  1. Total Revenue (today/week/month)
  2. Orders count + trend
  3. Average Order Value
  4. Conversion Rate
  5. Top Products
Người dùng: CEO, Sales Manager
Actions: Filter by date, Export to Excel
Dark mode: Có
```

### Output mẫu:
```
Dashboard với:
- 4 KPI cards (Revenue, Orders, AOV, Conversion)
- Line chart: Revenue trend (30 days)
- Bar chart: Top 5 products by revenue
- Table: Recent orders (filter, sort, pagination)
- Date picker: Today/7d/30d/Custom
- Export button: Excel/CSV
- Dark mode toggle
```

### Đánh giá:
- ✅ 4 KPIs rõ ràng
- ✅ Charts phù hợp (line cho trend, bar cho compare)
- ✅ Table có filter/sort
- ✅ Export có
- ✅ Dark mode OK
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [SaaS App](./02_saas_app.skill.md)
- [Blog / Documentation](./04_blog_docs.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Dashboard**, tiếp tục với:
→ [Blog / Documentation](./04_blog_docs.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain*
