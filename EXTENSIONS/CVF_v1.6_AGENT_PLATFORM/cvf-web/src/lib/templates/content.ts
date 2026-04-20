import { Template } from '@/types';

export const contentTemplates: Template[] = [
    {
        id: 'content_strategy_wizard',
        name: '✍️ Chiến lược Nội dung',
        icon: '✍️',
        description: 'Multi-step wizard tạo Content Strategy với governed packet và live path để đối soát',
        category: 'content',
        difficulty: 'medium',
        fields: [],
        intentPattern: '',
        outputExpected: ['Content Strategy', 'Editorial Calendar', 'Content Pillars', 'Channel Plan'],
    },
    {
        id: 'documentation',
        name: 'Tài liệu Kỹ thuật',
        icon: '📝',
        description: 'Biến knowledge rời rạc thành tài liệu handoff hoặc hướng dẫn dễ hiểu để người không chuyên vẫn dùng và bàn giao tiếp được',
        category: 'content',
        fields: [
            { id: 'subject', type: 'text', label: 'Tài liệu này nói về việc gì?', placeholder: 'Tên quy trình, tính năng hoặc phần việc cần bàn giao', required: true, section: 'required', hint: 'Đặt tên theo góc nhìn người đọc, không cần dùng thuật ngữ kỹ thuật.', example: 'Quy trình tiếp nhận khách hàng mới và gửi báo giá' },
            { id: 'currentNotes', type: 'textarea', label: 'Bạn đang có những ghi chú / thông tin gì?', placeholder: 'Dán các ý chính, ghi chú rời, bước làm hiện tại, câu hỏi thường gặp...', required: true, rows: 6, section: 'required', hint: 'Có thể rất thô cũng được. AI sẽ sắp xếp lại thành tài liệu có cấu trúc.', example: 'Khách đi từ form đăng ký -> sales gọi lại trong 2h -> nếu đủ điều kiện thì gửi báo giá trong ngày. Hay bị hỏi: bao lâu triển khai, cần chuẩn bị gì.' },
            { id: 'readerGoal', type: 'text', label: 'Người đọc cần làm được gì sau khi đọc?', placeholder: 'Kết quả thực tế người đọc cần đạt được', required: true, section: 'required', hint: 'Đây là mục tiêu thực dụng của tài liệu.', example: 'Nhân viên mới có thể xử lý lead đầu vào mà không phải hỏi lại team lead.' },
            { id: 'audience', type: 'select', label: 'Ai sẽ dùng tài liệu này?', options: ['Người mới tiếp nhận', 'Người vận hành nội bộ', 'Khách hàng / end user', 'Quản lý / approver'], default: 'Người vận hành nội bộ', required: false, section: 'advanced', hint: 'Chọn nhóm người đọc chính để AI điều chỉnh giọng điệu và độ chi tiết.' },
            { id: 'mustPreserve', type: 'textarea', label: 'Những thuật ngữ / bước nào phải giữ nguyên?', placeholder: 'Tên tài liệu, tên bước, rule nội bộ, cam kết pháp lý...', required: false, rows: 2, section: 'advanced', hint: 'Nếu có tên gọi nội bộ hoặc câu chữ bắt buộc giữ nguyên, ghi ở đây.', example: 'Giữ nguyên tên gói Enterprise Plus, SLA phản hồi 2 giờ, và checklist đủ điều kiện lead.' },
        ],
        intentPattern: `INTENT:
Tôi muốn biến phần knowledge / ghi chú này thành tài liệu dễ dùng và dễ handoff.

CHỦ ĐỀ:
[subject]

NGUỒN GHI CHÚ / THÔNG TIN:
[currentNotes]

NGƯỜI ĐỌC CẦN LÀM ĐƯỢC:
[readerGoal]

AI SẼ DÙNG TÀI LIỆU NÀY CHO:
[audience]

NHỮNG GÌ PHẢI GIỮ NGUYÊN:
[mustPreserve]

SUCCESS CRITERIA:
- Tổ chức lại nội dung cho người không chuyên vẫn follow được
- Chỉ ra bước làm, rule cần nhớ, và lỗi hay gặp
- Kết thúc bằng checklist hoặc next step rõ ràng
- Không yêu cầu người đọc hiểu API hoặc developer internals`,
        outputExpected: ['Mục tiêu tài liệu', 'Các bước hoặc quy tắc chính', 'Ví dụ / tình huống', 'Lỗi hay gặp và cách xử lý', 'Checklist bàn giao'],
        difficulty: 'easy',
        outputTemplate: `# Operational Documentation Packet

## 1. What This Document Is For
- Topic
- Who should use it
- What they should achieve

## 2. The Main Flow
- Step-by-step actions
- Key decisions or branches

## 3. Rules To Keep In Mind
- Required constraints
- Terms or phrases that must stay unchanged

## 4. Practical Example
- A realistic scenario
- What good execution looks like

## 5. Common Confusion And Fixes
- Common mistake
- How to recover

## 6. Handoff Checklist
- What to verify before passing work on`,
        sampleOutput: `# Operational Documentation Packet

## 1. What This Document Is For
- This guide explains how the team receives a new inbound lead and turns it into a same-day quotation.
- It is written for new sales operators.

## 2. The Main Flow
1. Check whether the form submission is complete.
2. Call the lead within 2 hours.
3. Confirm project type, budget range, and timeline.
4. If the lead is qualified, send the correct quote package the same day.

## 3. Rules To Keep In Mind
- Keep the Enterprise Plus package name unchanged.
- Never promise a timeline before qualification is complete.
- Escalate any legal or procurement question to the manager.

## 4. Practical Example
- A lead asks for automation support for a 30-person team.
- The operator confirms needs, checks budget fit, and sends the approved quote template.

## 5. Common Confusion And Fixes
- If the lead asks for pricing before qualification, explain the quick intake first.
- If required information is missing, pause and request the missing items before quoting.

## 6. Handoff Checklist
- Lead status updated
- Qualification notes stored
- Quote sent or escalation recorded`,
    },
    {
        id: 'email_template',
        name: 'Mẫu Email',
        icon: '📧',
        description: 'Tạo email chuyên nghiệp',
        category: 'content',
        fields: [
            { id: 'purpose', type: 'text', label: 'Mục đích email', placeholder: 'VD: Follow-up sau meeting', required: true, section: 'required', hint: 'Tóm tắt mục đích chính của email', example: 'Follow-up sau cuộc họs với khách hàng về dự án mới' },
            { id: 'context', type: 'textarea', label: 'Context', placeholder: 'Tình huống cụ thể...', required: true, rows: 4, section: 'required', hint: 'Mô tả tình huống, mối quan hệ, và những gì cần nhắc đến trong email', example: 'Đã họs với Giám đốc công ty ABC về giải pháp CRM. Họ quan tâm gói Enterprise, cần báo giá chi tiết.' },
            { id: 'recipient', type: 'text', label: 'Người nhận', placeholder: 'VD: Khách hàng, đồng nghiệp...', required: false, section: 'advanced', hint: 'Vai trò / chức danh của người nhận', example: 'Giám đốc CNTT công ty ABC' },
            { id: 'tone', type: 'select', label: 'Tone', options: ['Formal', 'Professional', 'Friendly', 'Urgent'], default: 'Professional', required: false, section: 'advanced', hint: 'Formal = rất trang trọng, Professional = chuyên nghiệp, Friendly = thân thiện' },
        ],
        intentPattern: `INTENT:
Tôi muốn soạn email [purpose].

CONTEXT:
[context]

RECIPIENT: [recipient]
TONE: [tone]

SUCCESS CRITERIA:
- Chuyên nghiệp
- Rõ ràng call-to-action
- Phù hợp context`,
        outputExpected: ['Subject Line', 'Opening', 'Body', 'Call to Action', 'Closing'],
        difficulty: 'easy',
    },
];
