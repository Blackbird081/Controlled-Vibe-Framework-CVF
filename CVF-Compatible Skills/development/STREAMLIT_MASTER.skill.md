# 🎨 SKILL: STREAMLIT MASTER (UI/UX)
**Version:** 1.1 | **Domain:** Development
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** Partial (AGT-029 Frontend Forge)

## 🎯 Context
Sử dụng khi xây dựng giao diện Web Local cho người dùng phổ thông.

## ⛔ Constraints
- KHÔNG dùng biểu đồ mặc định của Matplotlib (xấu/tĩnh). PHẢI dùng `plotly.express`.
- KHÔNG để giao diện bị "tràn" (cluttered). PHẢI dùng `st.columns`, `st.tabs`, và `st.expander`.
- KHÔNG dùng màu mặc định nếu user yêu cầu "hiện đại". PHẢI dùng bảng màu `Primary: #FF4B4B` hoặc `Custom Themes`.

## ✅ Definition of Done
- App phải có `st.set_page_config` (Icon & Title).
- Có thanh trạng thái `st.progress` hoặc `st.spinner` khi xử lý dữ liệu.
- Responsive: Giao diện phải nhìn ổn trên cả màn hình nhỏ.