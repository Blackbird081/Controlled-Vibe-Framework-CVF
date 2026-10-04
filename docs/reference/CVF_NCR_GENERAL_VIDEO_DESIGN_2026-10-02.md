# CVF NCR General Video Design - Reuse-First Text Handoff

Memory class: POINTER_RECORD

Status: LOCAL_ACCEPTED_DESIGN_ONLY

docType: reference

Date: 2026-10-02

Batch ID: CVF-NCR-GENERAL-VIDEO-DESIGN

EPISTEMIC_PROCESS_NA_WITH_REASON: private text design only; claim-to-source joins and static checks live in `docs/reviews/evidence/cvf-ncr-general-video-design-2026-10-02.json`.

## Purpose

Thiết kế bằng văn bản cho một video nội bộ, tiếng Việt, khoảng bốn phút, tỉ lệ 16:9, giải thích CVF tổng thể cho người mới giao AI việc code. Tài liệu này gồm brief, dàn ý, lời dẫn đề xuất, storyboard dạng chữ, mốc thời gian ước tính và danh sách kiểm tra sẵn sàng sản xuất. Nó là bản bàn giao văn bản dùng lại được, không phải video, không phải tài nguyên media.

## Scope

Nguồn được chấp nhận: [Quick Orientation](../guides/CVF_QUICK_ORIENTATION.md), [General Guide completion review](../reviews/CVF_CVF_NCR_GENERAL_USER_GUIDE_REFRESH_COMPLETION_2026-10-02.md), [VOM completion review](../reviews/CVF_CVF_NCR_VOM_QUICK_START_CLAIM_ALIGNMENT_COMPLETION_2026-10-02.md), [Lifecycle standard](CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md), [Product Positioning](../../ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md), [Approval Continuity carrier](../../governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md#governance-latency-and-approval-continuity). Quyết định D096 (phạm vi thiết kế nội bộ) và D097 (reuse-first) nằm trong roadmap NCR. Mọi mệnh đề trong lời dẫn nối với mã claim `C01`-`C19` trong evidence JSON, cùng nguồn, mức bằng chứng và giới hạn.

Ngoài phạm vi: ảnh, âm thanh, slide, video, ghi hình, demo UI/IDE, chạy code, gọi provider, dịch vụ trả phí, đăng tải, đọc hoặc chạy skill/mirror của công cụ bên thứ ba, cài dependency, tạo file dự án công cụ, pipeline render tự chế.

## Reuse-First Brief

| Trường | Giá trị |
|---|---|
| Đối tượng | Người mới, kể cả không viết code, sắp giao AI việc code |
| Thông điệp | CVF là hạ tầng quản trị: bạn đặt mục tiêu và ranh giới, AI agent làm việc được giao, người review quyết định từ bằng chứng |
| Ngôn ngữ | Tiếng Việt |
| Tỉ lệ khung hình | 16:9 |
| Thời lượng dự kiến | 240 giây (ước tính kế hoạch, chưa đo giọng đọc hay phát lại) |
| Phạm vi phát hành | Nội bộ, riêng tư, DEFERRED_PRIVATE_ONLY |
| Hướng sản xuất | Ưu tiên dùng lại repository hiện có đáp ứng yêu cầu (D097). HyperFrames là ứng viên ưu tiên, chưa được duyệt làm renderer; khả năng tương thích và phiên bản UNKNOWN/NOT_VERIFIED |
| Nơi lưu brief | Chính tài liệu này; giữ lại, không dựng lại khi chọn công cụ |
| Chi phí | Phiên worker UNKNOWN (không có đồng hồ đo), không khẳng định bằng không; không phát sinh API/dịch vụ trả phí/tài nguyên mua thêm |

## Outline

| Cảnh | Bắt đầu (s) | Kết thúc (s) | Thời lượng (s) | Nội dung |
|---|---|---|---|---|
| S01 | 0 | 15 | 15 | Mở đầu: câu hỏi giao việc cho AI |
| S02 | 15 | 40 | 25 | CVF là gì, không là gì |
| S03 | 40 | 65 | 25 | Ba vai trò |
| S04 | 65 | 95 | 30 | Bảy quyết định |
| S05 | 95 | 115 | 20 | Thẻ minh họa và giao việc có ranh giới |
| S06 | 115 | 135 | 20 | Kết quả đúng mong đợi |
| S07 | 135 | 160 | 25 | Agent làm và trả bằng chứng |
| S08 | 160 | 190 | 30 | Reviewer quyết định |
| S09 | 190 | 215 | 25 | Thẩm quyền và mức rủi ro |
| S10 | 215 | 240 | 25 | Đã chứng minh gì, đi đâu tiếp |

Tổng 240 s; các đoạn liền kề từ 0 đến 240. Mốc là ước tính kế hoạch, không phải thời lượng render hay giọng đọc đo được.

## Scene Handoff

Mỗi cảnh có: lời dẫn, chữ trên màn hình, ý đồ hình ảnh (đề xuất slide/sơ đồ khái niệm), nhu cầu tài nguyên (chưa tạo) và mã claim. Từ S05 đến S08 thẻ "VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ" luôn hiện để cảnh dùng lại riêng lẻ vẫn rõ trạng thái.

### S01 | 0-15 | 15 s
- Narration: Khi bạn giao cho AI một việc viết code, ai đặt ranh giới, ai làm việc, và bằng chứng nằm ở đâu? Trong khoảng bốn phút, ta xem CVF trả lời thế nào qua một ví dụ nhỏ.
- On-screen: Giao AI việc code: ai làm gì?
- Visual intent: Thẻ tiêu đề chữ trên nền đơn sắc, ba dấu hỏi nhỏ: ranh giới, người làm, bằng chứng.
- Asset needs: nền đơn sắc, phông chữ hỗ trợ tiếng Việt; chưa tạo.
- Claims: C01

### S02 | 15-40 | 25 s
- Narration: CVF là hạ tầng quản trị cho AI agent: một lớp luật và bằng chứng nằm giữa người giao việc, AI agent và nơi agent thực thi. CVF không viết code thay bạn. Nó không phải IDE, không phải công cụ tự viết code, cũng không phải công cụ tạo agent.
- On-screen: CVF là: luật + bằng chứng. CVF không phải: IDE, công cụ tự viết code, công cụ tạo agent.
- Visual intent: Bảng hai cột "là" và "không phải"; cột phải làm mờ nhẹ.
- Asset needs: bảng văn bản, biểu tượng đơn giản; chưa tạo.
- Claims: C02, C03

### S03 | 40-65 | 25 s
- Narration: Có ba vai trò. Bạn, con người, nêu mục tiêu và ranh giới, rồi xem kết quả. AI agent làm đúng phần việc được giao, trong phạm vi đã nêu, và trả bằng chứng. CVF đặt luật, danh tính, quyền và bằng chứng, nhưng chỉ tại những điểm đã được tích hợp, hoặc theo quy trình bạn yêu cầu agent tuân theo.
- On-screen: Bạn: mục tiêu và ranh giới. AI agent: làm việc được giao, trả bằng chứng. CVF: luật và bằng chứng tại điểm đã tích hợp.
- Visual intent: Ba khối ngang nối bằng mũi tên; khối CVF có chú thích "chỉ tại điểm đã tích hợp".
- Asset needs: sơ đồ ba khối; chưa tạo.
- Claims: C04, C05

### S04 | 65-95 | 30 s
- Narration: Công việc có quản trị đi qua bảy quyết định: intake, design, spec, work order, build, review và freeze. Đây là bảy quyết định, không phải bảy tài liệu hay bảy lần xin phép. Việc nhỏ có thể gộp lại trong một yêu cầu rõ ràng, và bằng chứng đã được chấp nhận thì dùng lại, không chạy lại từ đầu.
- On-screen: INTAKE - DESIGN - SPEC - WORK ORDER - BUILD - REVIEW - FREEZE. Bảy quyết định, không phải bảy tài liệu.
- Visual intent: Dải bảy chặng sáng lần lượt theo lời dẫn; dòng chú thích "gộp được, dùng lại bằng chứng".
- Asset needs: dải sơ đồ bảy chặng; chưa tạo.
- Claims: C06, C07

### S05 | 95-115 | 20 s
- Narration: Ví dụ minh họa, chưa chạy thật, dữ liệu giả. Bạn có một ứng dụng liệt kê chi tiêu và muốn thêm bộ lọc theo tháng. Bạn giao việc có ranh giới: mục tiêu, hai file được sửa, những điều không được làm, và khi nào agent phải dừng lại để hỏi.
- On-screen: VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ. Mục tiêu: lọc chi tiêu theo tháng. Được sửa: src/expenses/ExpenseList.tsx và src/expenses/ExpenseList.test.tsx. Dữ liệu thử: 5 khoản chi giả tự nhập trong test. Không được: sửa file khác, thêm thư viện, gọi mạng, dùng dữ liệu thật.
- Visual intent: Thẻ trạng thái cố định phía trên; bên dưới là khung yêu cầu giao việc dạng chữ, không phải ảnh chụp giao diện thật.
- Asset needs: khung văn bản mô phỏng yêu cầu; chưa tạo; không ảnh chụp UI/IDE.
- Claims: C09, C10

### S06 | 115-135 | 20 s
- Narration: Bạn mô tả kết quả đúng. Chọn tháng ba năm 2026 thì chỉ hiện khoản chi tháng ba. Tháng không có khoản nào thì hiện dòng thông báo không có khoản chi. Để trống bộ lọc thì hiện tất cả. Ngày sai định dạng thì bị bỏ qua và không làm ứng dụng lỗi.
- On-screen: VÍ DỤ MINH HỌA. Bốn trường hợp: có tháng, tháng trống, bỏ lọc, ngày sai định dạng.
- Visual intent: Bốn ô nhỏ, mỗi ô một trường hợp với dữ liệu giả vẽ tay dạng bảng chữ; không hiển thị kết quả chạy.
- Asset needs: bảng bốn ô, dữ liệu giả viết tay; chưa tạo.
- Claims: C09, C11

### S07 | 135-160 | 25 s
- Narration: Theo cách làm được mô tả, agent chỉ sửa hai file đã nêu, thêm vài test cho bốn trường hợp trên và chạy test của hai file đó. Khi xong, agent trả danh sách file đã đổi, kết quả test, và những gì nó chưa kiểm tra. Đây là thực hành mong đợi, không phải kết quả đã chạy.
- On-screen: VÍ DỤ MINH HỌA. Mong đợi: hai file, test cho bốn trường hợp, báo cáo gồm phần chưa kiểm tra. Chưa chạy thật.
- Visual intent: Sơ đồ khái niệm một agent với hai file; mẫu báo cáo ba dòng để trống, không có số liệu hay dấu "đạt".
- Asset needs: sơ đồ khái niệm, mẫu báo cáo trống; chưa tạo; không biên nhận giả.
- Claims: C09, C12, C13

### S08 | 160-190 | 30 s
- Narration: Bạn, hay người review, quyết định từ bằng chứng. Danh sách file có đúng hai file không? Báo cáo có ca tháng trống và ca ngày sai định dạng không? Agent nói gì là chưa kiểm tra? Rồi chấp nhận, yêu cầu sửa, hoặc dừng. Nếu agent muốn sửa file ngoài danh sách, đó là đổi ranh giới: phải quyết định lại, agent không tự làm.
- On-screen: VÍ DỤ MINH HỌA. Xem: danh sách file, các ca kiểm thử, phần chưa kiểm tra. Quyết định: chấp nhận / sửa / dừng. Sửa file ngoài danh sách = đổi ranh giới.
- Visual intent: Danh sách ba câu hỏi review, rẽ ba nhánh quyết định; một nhánh phụ "đổi ranh giới" quay lại bước giao việc.
- Asset needs: sơ đồ rẽ nhánh; chưa tạo.
- Claims: C09, C13, C14, C08

### S09 | 190-215 | 25 s
- Narration: Sau khi chấp nhận, chỉ làm bước đã được giao đúng thẩm quyền. Đưa lên môi trường thật, gửi dữ liệu ra ngoài hay dùng dữ liệu thật là tác động mới, cần phê duyệt riêng. Mức rủi ro phụ thuộc hành động và môi trường, không chỉ số file được sửa.
- On-screen: Tác động mới cần phê duyệt riêng: môi trường thật, gửi dữ liệu ra ngoài, dữ liệu thật. Rủi ro theo hành động và môi trường.
- Visual intent: Một đường ranh giới kẻ ngang; phía trên "trong phạm vi đã giao", phía dưới ba tác động mới. Không gán mức R0-R3 cho việc thật.
- Asset needs: sơ đồ ranh giới; chưa tạo.
- Claims: C15, C16, C08

### S10 | 215-240 | 25 s
- Narration: Nội dung này dựa trên tài liệu hướng dẫn. Nó chưa chứng minh CVF kiểm soát mọi agent hay mọi phiên làm việc, chưa chứng minh nhà cung cấp AI cụ thể đã sẵn sàng, và chưa chứng minh sẵn sàng cho môi trường thật. Để đi tiếp, hãy đọc hướng dẫn bắt đầu và hướng dẫn cho người không viết code trong repository.
- On-screen: Chưa chứng minh: kiểm soát mọi agent, nhà cung cấp cụ thể, sẵn sàng môi trường thật. Đọc tiếp: GET_STARTED, VOM Quick Start (tài liệu nội bộ).
- Visual intent: Hai cột "Đã có trong tài liệu" và "Chưa chứng minh"; dòng cuối liệt kê tên hai tài liệu nội bộ, không có địa chỉ công khai hay lời kêu gọi đăng ký.
- Asset needs: bảng hai cột; chưa tạo.
- Claims: C17, C18, C19

## Production-Readiness Checklist

Mọi mục chưa kiểm tra là UNKNOWN/NOT_VERIFIED. Local đánh giá trong một packet riêng trước khi dùng bất kỳ repository nào; tài liệu này không khẳng định gì về công cụ.

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Quan sát upstream mới, thu thập, ghim phiên bản, đối chiếu delta và tái dùng bằng chứng phần không đổi | UNKNOWN | Không lấy mirror hay repository trong packet này |
| Giấy phép và dependency | UNKNOWN | Chưa kiểm tra |
| Ánh xạ brief và cảnh vào quy trình hiện hành của công cụ | NOT_VERIFIED | Không khẳng định schema hay lệnh nào |
| Render thử cục bộ có kiểm chứng | NOT_VERIFIED | Chưa render |
| Giọng đọc, media, provider: khả dụng và chi phí | UNKNOWN | Không gọi provider, không dịch vụ trả phí |
| Tương thích HyperFrames, phiên bản sản xuất được chọn | NOT_VERIFIED | Ứng viên ưu tiên, chưa được duyệt |
| Duyệt nội dung cuối của operator | PENDING_FUTURE_DECISION | Quyết định riêng |
| Quyết định phát hành | PENDING_FUTURE_DECISION | Quyết định riêng; chấp nhận thiết kế không cấp quyền này |

## Proof Anchors

| Proof | Neo trong tài liệu |
|---|---|
| PROOF-OWNER | Outline, Scene Handoff, mốc thời gian ước tính |
| PROOF-AUTHORITY | Scope, Brief (D096/D097), Claim Boundary |
| PROOF-IDENTITY | S03 vai trò Human/agent/CVF |
| PROOF-RECOVERY | S05-S08 ví dụ minh họa, bằng chứng và quyết định của reviewer |
| PROOF-BOUNDARY | Brief (riêng tư, chi phí UNKNOWN), Production-Readiness Checklist |

## Claim Boundary

Chỉ là thiết kế văn bản riêng tư. Mốc thời gian là ước tính kế hoạch, chưa đo giọng đọc hay phát lại; chưa có media, bản render, ghi hình hay demo. Ví dụ lọc chi tiêu theo tháng là NOT_EXECUTED_ILLUSTRATIVE: không test nào đã chạy, không kết quả thành công nào được nêu. Không có nghiên cứu người dùng hay xem thử. Không khẳng định hỗ trợ cài đặt/giao diện tiếng Việt của VOM, số lượng skill hay provider hiện tại, kiểm soát mọi agent, chấp nhận bền vững, sẵn sàng production, HyperFrames tương thích hay đã chọn. Quyết định sản xuất, giọng đọc, demo trực tiếp, duyệt nội dung cuối và phát hành là các quyết định tương lai riêng biệt.

Text Encoding Exception: this Vietnamese design document uses Vietnamese letters with diacritics throughout; it adds no other non-ASCII symbol class.
