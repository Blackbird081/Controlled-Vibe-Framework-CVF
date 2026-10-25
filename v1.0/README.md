# Controlled Vibe Framework (CVF) — v1.0 FINAL

**Controlled Vibe Framework (CVF)** là một framework quản lý dự án theo tinh thần *vibe coding có kiểm soát* — được thiết kế cho những người **không cần giỏi code**, nhưng **chịu trách nhiệm về chất lượng sản phẩm cuối cùng**.

CVF giúp bạn:

- Làm việc với AI một cách có cấu trúc
- Kiểm soát tiến trình và quyết định
- Tránh “vibe quá đà” dẫn đến sai hướng hoặc sản phẩm không dùng được

---

## 🎯 CVF DÙNG KHI NÀO?

Sử dụng CVF khi bạn:

- Có **ý tưởng hoặc bài toán**, nhưng không muốn (hoặc không cần) tự viết code
- Là **product owner, quản lý, chuyên gia nghiệp vụ**, hoặc người kiểm tra chất lượng
- Làm việc với **AI / developer / team nhỏ**
- Muốn đảm bảo: *kết quả cuối cùng đúng ý*, không chỉ “chạy được”

CVF **không thay thế kỹ năng code**, nhưng **thay thế sự mơ hồ**.

---

## 🧠 TRIẾT LÝ CỐT LÕI

- **Outcome > Code**  
  Quan trọng là *sản phẩm làm được gì*, không phải *viết bằng cách nào*.

- **Control without micromanagement**  
  Kiểm soát bằng cấu trúc, không phải bằng can thiệp chi tiết.

- **Decisions are first-class citizens**  
  Quyết định phải được ghi lại để tránh tranh cãi về sau.

- **AI là công cụ thực thi, không phải người ra quyết định**.

Chi tiết xem thêm: [`CVF_MANIFESTO.md`](CVF_MANIFESTO.md)

---

## 🧩 CẤU TRÚC TỔNG THỂ

CVF được chia theo **tầng rõ ràng**, mỗi tầng có vai trò riêng:

- **Root (Core / Constitution)**  
  Luật chơi, triết lý, freeze, quyết định — *không động vào khi đã chốt*.

- **docs/**  
  Ghi chú tư duy, domain, logic — *không ảnh hưởng execution*.

- **phases/**  
  4 phase vận hành dự án: Discovery → Design → Build → Review.

- **governance/**  
  Checklist, gate, chuẩn kỷ luật — *ngăn sai ngay từ đầu*.

- **ai/**  
  Cách sử dụng AI một cách có kiểm soát.

- **templates/**  
  Mẫu khởi tạo project để dùng ngay.

Không có file nào là “thừa”.  
Không có file nào “để cho đẹp”.

---

## 🚀 BẮT ĐẦU MỘT PROJECT VỚI CVF

**Không chỉnh sửa framework. Không copy rời rạc.**

### Cách dùng chuẩn

1. Tạo một repository mới cho project của bạn
2. Copy toàn bộ thư mục **CVF v1.0 FINAL** vào project
3. Thực hiện theo:  
   👉 [`governance/PROJECT_INIT_CHECKLIST.md`](governance/PROJECT_INIT_CHECKLIST.md)
4. Bắt đầu Phase A — Discovery

CVF hướng dẫn *bạn phải làm gì*, không ép *bạn làm như thế nào*.

---

## 🛑 NHỮNG ĐIỀU CVF KHÔNG LÀM

- Không dạy lập trình
- Không thay bạn quyết định
- Không tự động hóa suy nghĩ
- Không “thông minh hộ” người dùng

CVF tồn tại để bạn **kiểm soát quá trình**, không để quá trình kiểm soát bạn.

---

## 🔒 TRẠNG THÁI FRAMEWORK

- **Version:** v1.0 FINAL  
- **Status:** FREEZE  
- Mọi thay đổi logic hoặc cấu trúc → **v1.1 trở đi**

Xem chi tiết tại: [`FRAMEWORK_FREEZE.md`](FRAMEWORK_FREEZE.md)

---

## 📌 GHI CHÚ CUỐI

Nếu bạn chỉ đọc **một file duy nhất**, hãy đọc file này.  
Nếu bạn chỉ làm **một việc duy nhất**, hãy **giữ kỷ luật theo framework**.

CVF không giúp bạn đi nhanh hơn.  
CVF giúp bạn **không đi sai**.

---
