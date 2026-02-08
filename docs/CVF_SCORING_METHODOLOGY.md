# CVF Scoring Methodology

> **Created:** Feb 08, 2026  
> **Purpose:** Giải thích phương pháp chấm điểm CVF — self-assessment vs independent review

---

## 1. Tổng Quan

CVF sử dụng **hai lớp đánh giá** để đảm bảo tính khách quan:

| Loại | Điểm | Ngày | File |
|------|-------|------|------|
| Self-Assessment | 9.5/10 | Feb 07, 2026 | `CVF_COMPREHENSIVE_ASSESSMENT_2026-02-07.md` |
| Independent Review | **8.5/10** | Feb 08, 2026 | `CVF_INDEPENDENT_EXPERT_REVIEW_2026-02-08.md` |
| **Calibrated Score** | **8.5/10** | Feb 08, 2026 | Dùng independent score làm chuẩn |

**Quy tắc:** Khi có cả hai đánh giá, điểm Calibrated = điểm Independent Review (bảo thủ hơn, khách quan hơn).

---

## 2. Self-Assessment (Nội Bộ)

### Phương pháp
- Đội ngũ phát triển tự đánh giá theo 10 tiêu chí
- Mỗi tiêu chí: 0-10 điểm
- Trung bình cộng → điểm tổng

### Ưu điểm
- Hiểu rõ context, intent ban đầu
- Đánh giá nhanh sau mỗi version

### Hạn chế (đã được xác nhận)
- **Thiên vị lạc quan** (optimism bias): Self-score thường cao hơn 0.5-1.5 điểm
- Thiếu "devil's advocate" perspective
- Có thể bỏ qua blindspots

---

## 3. Independent Review (Độc Lập)

### Phương pháp
- Chuyên gia bên ngoài đánh giá toàn bộ codebase
- 15 tiêu chí chi tiết, grouped thành 4 nhóm:
  1. Architecture & Design (5 tiêu chí)
  2. Implementation Quality (4 tiêu chí)
  3. Governance & Process (3 tiêu chí)
  4. Documentation & Accessibility (3 tiêu chí)
- Mỗi tiêu chí: 1-5 điểm → scale lên /10

### Ưu điểm
- Khách quan, không bias
- Phát hiện blindspots
- So sánh với industry standards

### Calibration Applied
- Giảm 1 điểm cho: Thiếu empirical validation
- Giảm 0.5 điểm cho: Self-assessment bias trong scoring tools
- Giữ nguyên: Architecture quality, governance depth

---

## 4. Scoring Tool Calibration (v2)

`report_spec_metrics.py` đã được nâng cấp lên v2 với:

| Dimension | v1 (cũ) | v2 (mới) |
|-----------|---------|---------|
| Section existence | ✅ Check | ✅ Check |
| Content depth (word count) | ❌ | ✅ Min thresholds per section |
| Concrete examples | ❌ | ✅ Regex detection |
| Input constraints | ❌ | ✅ Format/type checking |
| Output schema | ❌ | ✅ Structure validation |
| Placeholder penalty | ❌ | ✅ -3pts each (max -15) |

**Kết quả:** Domain averages giảm từ 92-100 (v1) → 84-94 (v2) — phản ánh thực tế hơn.

---

## 5. Quy Trình Cập Nhật

1. Mỗi version mới → chạy self-assessment
2. Mỗi 2-3 versions → yêu cầu independent review
3. Điểm README.md = Calibrated Score (conservative)
4. Cả hai báo cáo được lưu trong `docs/`
5. Delta giữa self vs independent → input cho improvement roadmap

---

## 6. Tiêu Chí Thăng Hạng

| Điểm | Mức | Ý nghĩa |
|-------|-----|---------|
| 9.0+ | Exceptional | Industry-leading, empirically validated |
| 8.0-8.9 | **Excellent** | Production-ready, minor gaps (← CVF hiện tại) |
| 7.0-7.9 | Good | Solid foundation, notable gaps |
| 6.0-6.9 | Adequate | Functional, needs significant work |
| < 6.0 | Needs Work | Not recommended for production |

**CVF hiện tại: 8.5/10 — Excellent.** Để đạt 9.0+, cần hoàn thành roadmap Sprint 1-3.
