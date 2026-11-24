# Dùng kỹ năng và mẫu kết quả

## Bắt đầu từ kết quả bạn muốn

Chọn [mẫu trên Trang chủ](/home) để viết bản đặc tả. Nêu mục tiêu, thông tin đầu vào, các giới hạn và dấu hiệu cho thấy kết quả đạt yêu cầu. Tải bản đặc tả và gửi cho agent phụ trách công việc.

## Xem các gói dành cho agent

[Thư viện kỹ năng](/skills) liệt kê các gói dành cho agent và giải thích giới hạn sử dụng. Xem phạm vi của từng gói và dùng các bước kiểm phù hợp với công việc. Tình trạng chứng nhận và khả dụng của từng mục có thể khác nhau.

Ví dụ, nếu cần bản tổng hợp bán hàng theo tuần, hãy ghi khoảng ngày, tệp nguồn và những cột hoặc số tổng cần kiểm tra. Bản đặc tả giúp agent biết cần những thông tin gì và giúp bạn đối chiếu trước khi nhận kết quả.

<!-- Text Encoding Exception: retains localized reader text and navigation symbols. -->
## Bổ sung gói kỹ năng

Trước hết xác định nhu cầu lặp lại và kiểm tra agent đã có khả năng đó hay chưa. Dùng lại nguồn gốc qua adapter được theo dõi; giữ rõ xuất xứ và các phụ thuộc. Gói mới cần chứng nhận ASSF phù hợp và bài thử chốt trước khi chạy. Khi danh mục thay đổi, chạy lại bài thử gợi ý. Local quyết định tiếp nhận; có tên trong danh mục không tự cấp quyền chạy.

## Chuẩn bị gói dùng lại

1. Nêu việc lặp lại, đầu vào, kết quả mong muốn và người dùng. Đưa ví dụ đầu vào và kết quả thực tế.
2. Ghi điều kiện tiên quyết, phạm vi, mức sàn rủi ro, quyền hạn, ranh giới thực thi và điểm agent phải dừng. Giữ nguồn gốc và theo dõi adapter cùng các phụ thuộc.
3. Bổ sung kiểm tra độ đầy đủ, chất lượng, dữ liệu thiếu và cách xử lý lỗi thường gặp. Chốt bài thử có thể xem xét trước khi chạy; có chứng nhận ASSF áp dụng trước khi tiếp nhận.
4. Quản lý phiên bản, xác thực bằng công cụ hiện có và chỉ công bố theo quy trình được phép. Khi danh mục thay đổi, chạy lại bài thử gợi ý Jev.

Ví dụ, bản tổng kết doanh số tuần cần nêu khoảng thời gian, tệp nguồn được phép, các tổng cần tính, định dạng kết quả và cách kiểm tra số liệu. Nếu thiếu nguồn hoặc nguồn ngoài phạm vi cho phép, agent cần hỏi thay vì tự tạo số liệu.
