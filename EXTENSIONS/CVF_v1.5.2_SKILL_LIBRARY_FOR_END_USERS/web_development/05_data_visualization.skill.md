# Chart & Data Visualization

> **Domain:** Web Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Chọn loại biểu đồ phù hợp nhất cho dữ liệu, kèm theo color guidance, accessibility notes, library recommendation, và interactivity level. Dựa trên 25+ chart types.

**Khi nào nên dùng:**
- Build dashboard với nhiều loại data
- Cần chọn chart type phù hợp cho từng metric
- Compare charting libraries (Chart.js vs D3 vs Recharts)
- Optimize chart accessibility & performance

**Không phù hợp khi:**
- Dữ liệu chỉ cần hiển thị bảng/text
- Infographic design (khác data visualization)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Build |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [chart_data_visualization](../../../governance/skill-library/uat/results/UAT-chart_data_visualization.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Loại dữ liệu** | ✅ | Trend, comparison, distribution... | "Revenue trend over 12 months" |
| **Số data points** | ✅ | Ước lượng volume | "~500 points, updated real-time" |
| **Mục đích** | ✅ | What insight cần truyền tải | "Show growth pattern, highlight anomalies" |
| **Framework** | ❌ | React, Vue, vanilla JS... | "React + TypeScript" |
| **Interactive** | ❌ | Static, hover, drill-down | "Hover tooltips + zoom" |
| **Accessibility** | ❌ | WCAG requirements | "Screen reader support" |

---

## ✅ Expected Output

```
CHART RECOMMENDATION: Revenue Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA TYPE: Time-series trend
RECOMMENDED: Area Chart (gradient fill)
ALTERNATIVE: Line Chart (if > 3 series)

LIBRARY:
  1st: Recharts — Best for React, declarative API
  2nd: Chart.js — Lightweight, canvas-based
  3rd: D3.js — If need full customization

COLORS:
  Series 1: #3B82F6 (Blue)
  Series 2: #10B981 (Green)
  Negative:  #EF4444 (Red)
  Grid:      #E5E7EB (Light Gray)

INTERACTIVITY:
  ✅ Hover tooltips with formatted values
  ✅ Crosshair cursor for time comparison
  ✅ Click to drill-down to daily view
  ❌ Avoid: 3D effects, rotating labels

ACCESSIBILITY:
  • aria-label on chart container
  • Data table fallback for screen readers
  • Pattern fills (not just color) for colorblind
  • Keyboard navigation for data points

PERFORMANCE:
  500 points → OK for SVG (Recharts)
  If > 5000 → switch to Canvas (Chart.js)
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Chart type phù hợp data type
- [ ] Library recommendation có reasoning
- [ ] Color palette cho chart specified
- [ ] Accessibility guidelines included
- [ ] Performance notes cho data volume
- [ ] Alternatives provided

**Red flags (cần Reject):**
- ⚠️ Pie chart cho > 5 categories (unreadable)
- ⚠️ 3D charts (distorts perception)
- ⚠️ Chỉ dùng color để phân biệt series (colorblind)
- ⚠️ Không có screen reader fallback

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Pie chart quá nhiều slices | Max 5 slices, group "Others" |
| Colors too similar | Min contrast between series |
| No tooltip on hover | Always add hover data display |
| Chart too small on mobile | Min height 200px, responsive |
| No data table fallback | Provide table for accessibility |

---

## 💡 Tips

1. **Bar > Pie** cho comparison — Easier to read
2. **Line > Area** khi > 3 series — Less visual clutter
3. **Sparklines** cho compact dashboards — Inline mini charts
4. **Data table toggle** — "Show as table" button for a11y
5. **Canvas for big data** — SVG chậm khi > 5000 points

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Loại: Sales funnel - 5 stages (Visit→Lead→Demo→Trial→Paid)
Mục đích: Identify drop-off points
Framework: Next.js + Recharts
Interactive: Hover + click to filter
```

### Output mẫu

```
Chart: Horizontal Funnel Chart
Library: Recharts (custom shape)
Colors: Blue gradient (dark→light per stage)
Drop-off %: Show as annotation between bars
Alternative: Stacked bar if comparing multiple periods
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Next Step

→ [Dashboard](./03_dashboard.skill.md) — Tích hợp charts vào dashboard layout

---

## 🔗 Related Skills

- [Dashboard](./03_dashboard.skill.md)
- [Landing Page](./01_landing_page.skill.md)

---

## 📜 Version History

| Version | Date | Changes |
| ------- | ---- | ------- |
| 1.0.0 | 2026-02-22 | Initial creation, adapted from UI UX Pro Max (MIT) |

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
