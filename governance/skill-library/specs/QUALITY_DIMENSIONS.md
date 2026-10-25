# CVF Quality Dimensions

> **Created:** Feb 08, 2026  
> **Purpose:** Phân tách rõ ràng 3 chiều chất lượng thay vì gộp chung 1 điểm duy nhất

---

## 1. Tổng Quan

CVF đo lường chất lượng qua **3 chiều độc lập** (không phải 1 điểm tổng hợp):

```
┌─────────────────────────────────────────────────────────────┐
│                    CVF Quality Model                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Spec Quality │  │  UAT Score  │  │ User Satisfaction │   │
│  │  (Input)     │  │  (Output)   │  │  (Experience)     │   │
│  │              │  │             │  │                   │   │
│  │ Nội dung     │  │ Kết quả     │  │ Trải nghiệm      │   │
│  │ .skill.md    │  │ thực tế     │  │ thực tế của       │   │
│  │ có đầy đủ,   │  │ chạy UAT    │  │ người dùng        │   │
│  │ cụ thể?     │  │ có đạt?     │  │                   │   │
│  ├─────────────┤  ├─────────────┤  ├──────────────────┤   │
│  │ 0-100 pts   │  │ 0-100 pts   │  │ ⭐ 1-5 stars     │   │
│  │ Auto-scored  │  │ Semi-auto   │  │ Manual feedback   │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dimension 1: Spec Quality (Input Quality)

### Đo gì?

Chất lượng của **file .skill.md** — spec có đầy đủ, cụ thể, actionable không?

### Công cụ

`report_spec_metrics.py` (v2 calibrated)

### Thang điểm

| Range | Quality | Gate |
|-------|---------|------|
| 85-100 | ✅ Excellent | PASS |
| 70-84 | 🟢 Good | PASS |
| 50-69 | ⚠️ Needs Review | REVIEW |
| 0-49 | ❌ Not Ready | FAIL |

### Tiêu chí

- Content depth (word count per section)
- Concrete examples (quoted strings, numbers, code blocks)
- Input constraints (format, type, validation)
- Output schema (structure, format)
- Placeholder penalty (generic/TBD content)

### Hiển thị trong

- `.gov.md` → `## Spec Score` block
- Domain reports → `spec_metrics_report.md`
- Dashboard → Spec Quality column

---

## 3. Dimension 2: UAT Score (Output Quality)

### Đo gì?

Kết quả **User Acceptance Testing** thực tế — skill có hoạt động đúng không?

### Công cụ

`score_uat.py` + badge system

### Thang điểm

| Badge | Meaning |
|-------|---------|
| ✅ VALIDATED | UAT passed, skill đáng tin cậy |
| ❌ FAILED | UAT failed, cần fix |
| ⚠️ NEEDS_UAT | Có thay đổi sau UAT, cần re-test |
| 🔘 NOT_RUN | Chưa chạy UAT |

### UAT Criteria

1. Output follows expected format
2. Stays within declared scope
3. Risk level appropriate
4. No hallucinated information
5. Edge cases handled

### Hiển thị trong

- `.gov.md` → `## UAT Binding` block + badge
- UAT reports → `uat_score_report.md`
- Dashboard → UAT Badge column

---

## 4. Dimension 3: User Satisfaction (Experience Quality)

### Đo gì?

**Trải nghiệm thực tế** của người dùng khi sử dụng skill — dễ hiểu? hữu ích? muốn dùng lại?

### Công cụ

Manual feedback (chưa auto)

### Thang điểm

| Stars | Meaning |
|-------|---------|
| ⭐⭐⭐⭐⭐ | Exceptional — dùng hàng ngày |
| ⭐⭐⭐⭐ | Great — rất hữu ích |
| ⭐⭐⭐ | Good — đáp ứng nhu cầu cơ bản |
| ⭐⭐ | Fair — có nhưng thiếu |
| ⭐ | Poor — không hữu ích |

### Feedback Fields

```yaml
user_satisfaction:
  rating: 4          # 1-5 stars
  used_count: 12     # Số lần đã dùng
  would_reuse: true  # Có muốn dùng lại?
  feedback: "Clear instructions, but output format could be more structured"
  last_used: 2026-02-08
```

### Hiển thị trong

- `.gov.md` → `## User Feedback` block (future)
- Aggregate reports → satisfaction dashboard
- Skill ranking → sort by satisfaction

---

## 5. Composite View (Không Phải Composite Score)

> ⚠️ **Quan trọng:** Ba chiều này KHÔNG được cộng thành 1 điểm tổng.

Thay vào đó, hiển thị parallel:

```
┌────────────────────────────────┬──────────┬──────────┬──────────┐
│ Skill                          │ Spec     │ UAT      │ Sat.     │
├────────────────────────────────┼──────────┼──────────┼──────────┤
│ 01_model_selection             │ 87 ✅    │ ✅ VALID │ ⭐⭐⭐⭐    │
│ 02_prompt_evaluation           │ 91 ✅    │ 🔘 N/R   │ —        │
│ 03_output_quality_check        │ 72 🟢    │ ❌ FAIL  │ ⭐⭐      │
└────────────────────────────────┴──────────┴──────────┴──────────┘
```

### Lý do không cộng

1. **Spec Quality cao + UAT fail** = spec viết đẹp nhưng không hoạt động → vẫn cần fix
2. **Spec Quality thấp + UAT pass** = spec chưa tốt nhưng skill vẫn work → cần cải thiện spec
3. **Cả hai tốt + User không hài lòng** = gap giữa technical quality và UX

---

## 6. Decision Matrix

| Spec | UAT | Satisfaction | Action |
|------|-----|-------------|--------|
| ✅ | ✅ | ⭐⭐⭐⭐+ | **Ship it** — ready for production |
| ✅ | ✅ | ⭐⭐-⭐⭐⭐ | Investigate UX gap |
| ✅ | ❌ | — | Fix skill implementation |
| ⚠️/❌ | ✅ | — | Improve spec documentation |
| ⚠️/❌ | ❌ | — | Priority fix — both dimensions weak |
| Any | 🔘 | — | Run UAT first |

---

## 7. Integration Points

### Hiện tại (đã implement)

- [x] Spec Quality → `report_spec_metrics.py` (v2)
- [x] UAT Score → `score_uat.py` + badges
- [x] Spec Score in `.gov.md` → `inject_spec_scores.py`
- [x] Version Lock → `check_version_sync.py`

### Roadmap (chưa implement)

- [ ] User Satisfaction feedback form
- [ ] Composite dashboard view
- [ ] Automated stale detection (satisfaction > 30 days old)
- [ ] Skill ranking by composite quality
