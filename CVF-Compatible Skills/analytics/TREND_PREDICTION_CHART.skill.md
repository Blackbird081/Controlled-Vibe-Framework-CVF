# 📈 SKILL: FINANCIAL TREND PREDICTOR
**Version:** 1.0 | **Domain:** Advanced Analytics
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** None

## 🎯 Context
Sử dụng trong Phase B (Design) để nâng cấp Dashboard từ "Báo cáo tĩnh" sang "Dự báo thông minh".

## 📜 Quy tắc thực thi (Vibe Logic)
- **Visual:** Sử dụng `Plotly` với đường nét đứt (dash) cho phần dự báo tương lai.
- **Logic:** Sử dụng thuật toán `Linear Regression` (Hồi quy tuyến tính) đơn giản hoặc `Moving Average` (Trung bình trượt) để tính toán xu hướng.
- **Cảnh báo:** Nếu đường dự báo chạm mức 0, phải đổi màu vùng đó sang Đỏ (Red Zone).

## ✅ Definition of Done
- Biểu đồ phải có 2 phần: Quá khứ (Nét liền) và Tương lai dự báo (Nét đứt/Vùng mờ).
- AI phải giải thích bằng tiếng Việt: "Dựa trên 3 tháng qua, tôi dự báo tháng tới bạn sẽ chi khoảng [X] triệu đồng."