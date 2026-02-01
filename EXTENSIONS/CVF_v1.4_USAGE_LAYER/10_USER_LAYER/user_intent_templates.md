Mục tiêu của file này

Giúp người dùng khai báo ý định đúng cách mà không cần hiểu CVF, prompt engineering hay execution rules.

Intent không phải yêu cầu chi tiết, mà là mô tả điều bạn muốn đạt được.

Nguyên tắc viết intent

Intent hợp lệ phải:

Viết bằng ngôn ngữ tự nhiên

Tập trung vào mục tiêu cuối cùng, không phải cách làm

Không ra lệnh cho AI suy luận như thế nào

Intent không được:

Chỉ đạo từng bước suy nghĩ

Ép kết quả cụ thể

Can thiệp vào execution

Cấu trúc intent chuẩn (User-facing)
INTENT:
[Tôi muốn đạt được điều gì?]


CONTEXT (nếu có):
[Bối cảnh ngắn gọn, dữ kiện chính]


SUCCESS CRITERIA:
[Làm sao biết kết quả là đạt yêu cầu?]

Người dùng chỉ cần 3 phần trên.

Ví dụ intent hợp lệ
Ví dụ 1 – Phân tích
INTENT:
Tôi muốn hiểu rủi ro chính của phương án A so với phương án B.


CONTEXT:
Đây là quyết định đầu tư ngắn hạn, dữ liệu có thể chưa đầy đủ.


SUCCESS CRITERIA:
Xác định rõ 3–5 rủi ro quan trọng nhất và mức độ ảnh hưởng của chúng.
Ví dụ 2 – Hỗ trợ quyết định
INTENT:
Tôi cần một khuyến nghị để chọn phương án phù hợp nhất.


CONTEXT:
Quyết định ảnh hưởng đến team 10 người, ưu tiên ổn định hơn tốc độ.


SUCCESS CRITERIA:
Có kết luận rõ ràng và nêu được lý do chính.
Ví dụ intent KHÔNG hợp lệ
Ví dụ sai 1 – Can thiệp execution
Hãy suy nghĩ từng bước và dùng framework XYZ để phân tích.

❌ Lý do: can thiệp cách AI làm việc

Ví dụ sai 2 – Ép kết quả
Hãy chứng minh rằng phương án A là tốt nhất.

❌ Lý do: định hướng kết quả trước

Điều gì xảy ra sau khi bạn gửi intent?

CVF kiểm tra intent có hợp lệ không

Intent được ánh xạ sang preset phù hợp

CVF core (v1.3.1) thực thi và kiểm soát

Bạn nhận kết quả đã được validate

Bạn không cần tham gia các bước này.

Trách nhiệm

Người dùng chịu trách nhiệm về ý định đưa ra

CVF chịu trách nhiệm về cách thực thi và kiểm soát

Ghi nhớ nhanh

Nếu bạn đang mô tả cách AI nên suy nghĩ, bạn đang làm sai. Nếu bạn mô tả bạn muốn đạt được điều gì, bạn đang làm đúng.