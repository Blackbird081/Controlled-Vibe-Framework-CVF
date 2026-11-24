# Mô hình rủi ro

CVF dùng R0–R3 để thể hiện mức rủi ro tăng dần. R4 là trạng thái bị chặn và không bao giờ chạy. Thiếu thông tin được tính là R3. Rủi ro có thể tăng khi có thêm thông tin; mức khai báo thấp không làm giảm mức hiệu lực.

| Mức | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| R0 | Thụ động, không có tác động bên ngoài | Đọc hoặc định dạng văn bản được cung cấp |
| R1 | Công việc nhỏ, có giới hạn và có thể hoàn tác | Thay đổi cục bộ trong phạm vi đã thống nhất |
| R2 | Tác động hoặc quyền hạn cao hơn | Thay đổi liên quan API bên ngoài, bảo mật hoặc hành vi quản trị |
| R3 | Tác động cao, chưa rõ hoặc khó hoàn tác | Thay đổi phá hủy hoặc thiếu thông tin để đánh giá |
| R4 | Bị chặn | Không bao giờ thực thi |

Rủi ro phụ thuộc vào việc thực tế, không chỉ tên chức năng. Mức hiệu lực xét nội dung, mức sàn chứng nhận áp dụng và mức khai báo cao hơn. Máy chủ xác định mức này. Tên giai đoạn, vai trò hay mẫu không tự cấp quyền; quyền phụ thuộc giai đoạn, vai trò, rủi ro và quy tắc áp dụng. R1 không mặc nhiên cần phê duyệt. Công việc rủi ro cao hơn tuân theo biện pháp và ranh giới phê duyệt tương ứng.

Trước khi giao việc cho agent, xác định dữ liệu, tác động bên ngoài và khả năng hoàn tác. Xem agent đã làm gì và thông tin còn chưa chắc chắn trước khi chấp nhận kết quả. Xem các quyết định liên quan trong [vòng đời công việc](lifecycle.md).

## Những điều cần xem xét

Đánh giá quyền hạn, khả năng mở rộng phạm vi, khả năng hoàn tác, khả năng giải thích và phụ thuộc vào hệ thống bên ngoài. Xem ai có thể thấy dữ liệu và điều gì xảy ra nếu thao tác thất bại. Dùng mức rủi ro cao nhất áp dụng, gồm cả mức sàn của gói chứng nhận; không giảm mức vì trình duyệt khai báo thấp hơn.

## Ví dụ: kết nối bên ngoài

Xác định dịch vụ, dữ liệu sẽ gửi, tác động dự kiến, trần chi phí và người có quyền duyệt kết nối. Công việc liên quan API ngoài hoặc bảo mật ít nhất là R2; thông tin chưa rõ có thể cần R3. Xem phạm vi và biện pháp thực tế trước khi hành động.

<!-- Text Encoding Exception: preserves localized reader text and existing navigation symbols. -->
