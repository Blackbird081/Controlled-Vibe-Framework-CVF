import { Template } from '@/types';

export const hrTemplates: Template[] = [
    {
        id: 'meeting_notes',
        name: 'Biên bản Cuộc họp',
        icon: '📝',
        description: 'Tạo biên bản họp có cấu trúc từ ghi chú thô',
        category: 'content',
        fields: [
            { id: 'meeting_topic', type: 'text', label: 'Chủ đề cuộc họp', placeholder: 'VD: Họp review sprint tháng 5', required: true, section: 'required', hint: 'Tên và mục đích chính của cuộc họp', example: 'Review tiến độ dự án CRM tháng 5 và lập kế hoạch Q3' },
            { id: 'raw_notes', type: 'textarea', label: 'Ghi chú thô / nội dung đã thảo luận', placeholder: 'Dán ghi chú rời, bullet points, hoặc tóm tắt những gì đã nói...', required: true, rows: 6, section: 'required', hint: 'Không cần viết đẹp, AI sẽ sắp xếp lại thành biên bản chuẩn', example: 'Sprint 3 trễ 2 tuần do thiếu API docs từ bên kia\nQuyết định: dời deadline sang 15/6\nTuấn sẽ gửi API spec trước 25/5\nHà lo phần testing plan' },
            { id: 'attendees', type: 'text', label: 'Người tham dự', placeholder: 'VD: Tuấn (PM), Hà (Dev), Mai (QA)', required: false, section: 'advanced', hint: 'Tên và vai trò người tham dự để gán action items đúng người', example: 'Tuấn (PM), Hà (Backend Dev), Mai (QA), Nam (Sales)' },
            { id: 'meeting_date', type: 'text', label: 'Ngày họp', placeholder: 'VD: 20/05/2026', required: false, section: 'advanced', hint: 'Ngày để ghi vào header biên bản' },
        ],
        intentPattern: `INTENT:
Tôi muốn tạo biên bản cuộc họp về [meeting_topic].

NGÀY HỌP: [meeting_date]
NGƯỜI THAM DỰ: [attendees]

GHI CHÚ THÔ / NỘI DUNG ĐÃ THẢO LUẬN:
[raw_notes]

OUTPUT FORMAT:
- Thông tin cuộc họp → Tóm tắt → Nội dung thảo luận → Quyết định đã đưa ra → Action Items (người phụ trách + deadline)

SUCCESS CRITERIA:
- Biên bản rõ ràng, có thể gửi thẳng cho người liên quan
- Action items phải có người phụ trách cụ thể
- Quyết định phải được tách riêng khỏi thảo luận`,
        outputExpected: ['Thông tin cuộc họp', 'Tóm tắt', 'Nội dung thảo luận chính', 'Quyết định đã đưa ra', 'Action Items'],
        outputTemplate: `# Biên bản Cuộc họp

**Chủ đề:** [meeting_topic]
**Ngày:** [meeting_date]
**Tham dự:** [attendees]

---

## Tóm tắt
(1-2 câu tóm tắt mục đích và kết quả chính)

## Nội dung thảo luận
1. ...
2. ...

## Quyết định đã đưa ra
- [ ] ...
- [ ] ...

## Action Items
| Người phụ trách | Việc cần làm | Deadline |
| --- | --- | --- |
| ... | ... | ... |`,
        difficulty: 'easy',
    },
    {
        id: 'job_description',
        name: 'Mô tả Công việc (JD)',
        icon: '💼',
        description: 'Soạn JD chuyên nghiệp để đăng tuyển dụng hoặc lưu nội bộ',
        category: 'business',
        fields: [
            { id: 'position_title', type: 'text', label: 'Tên vị trí tuyển dụng', placeholder: 'VD: Senior Backend Developer, Marketing Manager', required: true, section: 'required', hint: 'Tên vị trí chính xác như sẽ đăng lên job board', example: 'Senior Backend Developer (Node.js / PostgreSQL)' },
            { id: 'responsibilities', type: 'textarea', label: 'Trách nhiệm / công việc chính', placeholder: 'Liệt kê các công việc, nhiệm vụ chính của vị trí này...', required: true, rows: 5, section: 'required', hint: 'Mỗi nhiệm vụ 1 dòng. Không cần viết đẹp, AI sẽ format lại', example: 'Xây dựng và maintain REST API\nReview code cho junior\nTư vấn kiến trúc hệ thống\nPhối hợp với team product để estimate feature' },
            { id: 'requirements', type: 'textarea', label: 'Yêu cầu ứng viên', placeholder: 'Kỹ năng, kinh nghiệm, bằng cấp yêu cầu...', required: true, rows: 4, section: 'required', hint: 'Phân biệt must-have và nice-to-have nếu có thể', example: 'Must: 3+ năm Node.js, hiểu SQL/NoSQL\nNice: kinh nghiệm microservices, đã làm fintech' },
            { id: 'department', type: 'text', label: 'Phòng ban / team', placeholder: 'VD: Engineering, Growth Marketing', required: false, section: 'advanced', hint: 'Để đặt vị trí vào đúng context tổ chức', example: 'Engineering — Platform Team' },
            { id: 'benefits', type: 'textarea', label: 'Quyền lợi / benefits', placeholder: 'Lương, bảo hiểm, remote, thưởng...', required: false, rows: 3, section: 'advanced', hint: 'Nêu những điểm hấp dẫn để thu hút ứng viên', example: 'Lương thỏa thuận, remote 3 ngày/tuần, cổ phần ESOP, bảo hiểm sức khỏe 24/7' },
        ],
        intentPattern: `INTENT:
Tôi muốn soạn JD (mô tả công việc) cho vị trí [position_title].

PHÒNG BAN: [department]

TRÁCH NHIỆM CHÍNH:
[responsibilities]

YÊU CẦU ỨNG VIÊN:
[requirements]

QUYỀN LỢI:
[benefits]

OUTPUT FORMAT:
- Tên vị trí → Mô tả công ty/team (nếu có) → Trách nhiệm → Yêu cầu (must/nice) → Quyền lợi → Cách ứng tuyển

SUCCESS CRITERIA:
- JD rõ ràng, chuyên nghiệp, không mơ hồ
- Phân biệt must-have và nice-to-have
- Có thể đăng thẳng lên LinkedIn hoặc TopCV`,
        outputExpected: ['Tên vị trí & Mô tả tổng quan', 'Trách nhiệm chính', 'Yêu cầu ứng viên', 'Quyền lợi & Môi trường làm việc'],
        outputTemplate: `# [position_title]

## Về vị trí này
(Mô tả 2-3 câu về vai trò và tầm quan trọng của vị trí)

## Trách nhiệm chính
- ...
- ...
- ...

## Yêu cầu ứng viên
**Bắt buộc (Must-have):**
- ...

**Ưu tiên (Nice-to-have):**
- ...

## Quyền lợi
- ...
- ...`,
        difficulty: 'easy',
    },
    {
        id: 'performance_review',
        name: 'Đánh giá Hiệu suất Nhân viên',
        icon: '⭐',
        description: 'Viết nhận xét đánh giá hiệu suất nhân viên có cấu trúc',
        category: 'business',
        fields: [
            { id: 'employee_role', type: 'text', label: 'Vị trí / vai trò nhân viên', placeholder: 'VD: Junior Developer, Sales Executive', required: true, section: 'required', hint: 'Tên vị trí để AI đặt đúng bối cảnh đánh giá', example: 'Junior Backend Developer — Engineering Team' },
            { id: 'achievements', type: 'textarea', label: 'Thành tích / kết quả nổi bật', placeholder: 'Những việc làm tốt, milestone đạt được, phản hồi tích cực...', required: true, rows: 5, section: 'required', hint: 'Càng cụ thể càng tốt: số liệu, dự án, phản hồi của đồng nghiệp', example: 'Hoàn thành module thanh toán trước deadline 1 tuần\nCode review rate cao nhất team tháng 4\nTự học thêm Redis và áp dụng vào production' },
            { id: 'improvement_areas', type: 'textarea', label: 'Điểm cần cải thiện', placeholder: 'Kỹ năng hoặc hành vi cần phát triển...', required: false, rows: 3, section: 'required', hint: 'Nhận xét mang tính xây dựng, có thể hành động được', example: 'Cần chủ động hơn trong việc hỏi yêu cầu thay vì đợi\nCần improve kỹ năng estimate task' },
            { id: 'review_period', type: 'text', label: 'Kỳ đánh giá', placeholder: 'VD: Q1 2026, 6 tháng đầu 2026', required: false, section: 'advanced', hint: 'Khoảng thời gian được đánh giá', example: 'Q2 2026 (tháng 4 - tháng 6)' },
            { id: 'goals_next_period', type: 'textarea', label: 'Mục tiêu kỳ tiếp theo', placeholder: 'KPIs hoặc mục tiêu phát triển cho kỳ tới...', required: false, rows: 3, section: 'advanced', hint: 'Mục tiêu cụ thể, đo lường được để nhân viên biết phải cải thiện gì', example: 'Lead 1 feature end-to-end\nĐạt điểm 8+/10 trong code review từ senior' },
        ],
        intentPattern: `INTENT:
Tôi muốn viết đánh giá hiệu suất cho nhân viên vị trí [employee_role].

KỲ ĐÁNH GIÁ: [review_period]

THÀNH TÍCH NỔI BẬT:
[achievements]

ĐIỂM CẦN CẢI THIỆN:
[improvement_areas]

MỤC TIÊU KỲ TIẾP THEO:
[goals_next_period]

OUTPUT FORMAT:
- Tổng quan đánh giá → Thành tích nổi bật → Điểm mạnh → Điểm cần phát triển → Mục tiêu kỳ tiếp theo → Kết luận

SUCCESS CRITERIA:
- Nhận xét cụ thể, không chung chung
- Cân bằng giữa ghi nhận và feedback xây dựng
- Mục tiêu kỳ tới phải SMART (cụ thể, đo được)`,
        outputExpected: ['Tổng quan đánh giá', 'Thành tích nổi bật', 'Điểm mạnh', 'Điểm cần phát triển', 'Mục tiêu kỳ tiếp theo'],
        outputTemplate: `# Đánh giá Hiệu suất — [employee_role]
**Kỳ đánh giá:** [review_period]

---

## Tổng quan
(Nhận xét tổng thể 2-3 câu)

## Thành tích nổi bật
- ...
- ...

## Điểm mạnh
- ...
- ...

## Điểm cần phát triển
- ...
- ...

## Mục tiêu kỳ tiếp theo
| Mục tiêu | Chỉ số thành công | Deadline |
| --- | --- | --- |
| ... | ... | ... |

## Kết luận
(1-2 câu tổng kết và định hướng)`,
        difficulty: 'easy',
    },
];
