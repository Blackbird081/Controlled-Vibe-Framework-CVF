import { Template } from '@/types';

export const technicalTemplates: Template[] = [
    {
        id: 'system_design_wizard',
        name: '🔧 Thiết kế Hệ thống',
        icon: '🔧',
        description: 'Multi-step wizard tạo System Design Document với governed packet và live path để đối soát',
        category: 'technical',
        difficulty: 'advanced',
        fields: [],
        intentPattern: '',
        outputExpected: ['System Design Doc', 'Architecture Diagram', 'API Design', 'Scaling Strategy'],
    },
    {
        id: 'code_review',
        name: 'Review Code',
        icon: '💻',
        description: 'Biến đoạn logic hoặc phần build gây lo ngại thành một gói review dễ hiểu để non-coder biết chỗ nào cần sửa và cần handoff gì cho builder',
        category: 'technical',
        fields: [
            { id: 'workSample', type: 'textarea', label: 'Phần cần xem', placeholder: 'Dán đoạn code, pseudo-code, logics, hoặc file text liên quan', required: true, rows: 10, section: 'required', hint: 'Bạn có thể dán code thật, logic gần đúng, hoặc phần output hiện tại. Không cần chuẩn kỹ thuật tuyệt đối miễn là AI hiểu thứ cần review.', example: 'function processPayment(amount, currency) {\n  if (!amount) return;\n  return runPayment(amount, currency);\n}' },
            { id: 'goal', type: 'text', label: 'Phần này đang phục vụ việc gì?', placeholder: 'Mô tả kết quả mà phần này phải làm được', required: true, section: 'required', hint: 'Nói bằng ngôn ngữ công việc: lưu đơn, gửi email, tính tiền, lọc dữ liệu...', example: 'Xử lý thanh toán và chỉ trả kết quả thành công khi giao dịch thật sự hoàn tất' },
            { id: 'worry', type: 'textarea', label: 'Điều gì làm bạn lo hoặc thấy sai?', placeholder: 'Mô tả dấu hiệu bất thường, bug, hoặc nỗi lo hiện tại', required: true, rows: 3, section: 'required', hint: 'Bạn có thể nêu lỗi hiện ra, kết quả sai, hoặc cảm giác phần này mong manh/khó tin.', example: 'Thỉnh thoảng hệ thống báo thanh toán thành công dù gateway timeout, và tôi không biết có bị thu tiền 2 lần không.' },
            { id: 'mustPreserve', type: 'textarea', label: 'Những gì phải giữ nguyên', placeholder: 'Luồng, dữ liệu, tích hợp, hành vi không được phá', required: false, rows: 2, section: 'advanced', hint: 'Nếu review này dẫn tới chỉnh sửa sau đó, phần nào phải được giữ nguyên?', example: 'Không đổi contract trả về cho mobile app, không bỏ logging phục vụ đối soát.' },
            { id: 'focus', type: 'multiselect', label: 'Muốn tập trung vào đâu?', options: ['Sai logic nghiệp vụ', 'Rủi ro dữ liệu / bảo mật', 'Tốc độ / độ ổn định', 'Dễ sửa và dễ bàn giao'], required: false, section: 'advanced', hint: 'Chọn góc nhìn bạn muốn AI ưu tiên.' },
        ],
        intentPattern: `INTENT:
Tôi muốn review phần build / logic này theo cách mà người không chuyên vẫn hiểu được.

PHẦN CẦN XEM:
[workSample]

MỤC TIÊU CỦA NÓ:
[goal]

ĐIỀU ĐANG GÂY LO / DẤU HIỆU SAI:
[worry]

NHỮNG GÌ PHẢI GIỮ NGUYÊN:
[mustPreserve]

ƯU TIÊN REVIEW:
[focus]

SUCCESS CRITERIA:
- Analyze the code sample and identify key risks in plain-language terms
- Phân biệt điều gì chỉ là cảnh báo và điều gì có thể gây lỗi thật
- Đưa ra brief handoff rõ để builder sửa
- Không biến câu trả lời thành code-review jargon dump

OUTPUT FORMAT (use these exact section headings in English):
## Intended Outcome
## What Looks Healthy
## Main Risks
## Builder Handoff Brief
## Acceptance Checklist`,
        outputExpected: ['Điểm đang ổn', 'Vấn đề cần xử lý', 'Mức độ ảnh hưởng', 'Brief handoff cho builder', 'Checklist xác nhận sau sửa'],
        difficulty: 'medium',
        outputTemplate: `# Plain-Language Build Review

## 1. Intended Outcome
- What this part is supposed to do
- What success should look like

## 2. What Looks Healthy
- Behaviors that already seem correct

## 3. Main Risks
- Risk
- Why it matters in business/user terms
- Evidence from the sample

## 4. Builder Handoff Brief
- What to inspect first
- What likely needs fixing
- What must be preserved

## 5. Acceptance Checklist
- Checks to run after the fix`,
        sampleOutput: `# Plain-Language Build Review

## 1. Intended Outcome
- This payment step should only mark an order as paid after the gateway really confirms success.
- Success means the customer is charged once, the order status is correct, and the mobile app gets a stable response.

## 2. What Looks Healthy
- The flow is short enough that a builder can inspect it quickly.
- Currency is passed together with amount, so the business intent is visible.

## 3. Main Risks
- The current flow can stop early without a clear failure path.
- If the gateway times out, the app may still move forward without enough proof that payment really succeeded.
- That creates a real business risk: duplicate charge handling, wrong order state, and hard-to-trust support cases.

## 4. Builder Handoff Brief
- Inspect how timeout, retry, and final confirmation are handled.
- Add an explicit failure state instead of silently returning.
- Preserve the current mobile response contract and logging trail.

## 5. Acceptance Checklist
- Failed or timed-out payments do not mark the order as successful.
- Success is only returned after a confirmed gateway response.
- Existing mobile consumers still receive the same output shape.`,
    },
    {
        id: 'architecture_review',
        name: 'Review Kiến trúc',
        icon: '🏗️',
        description: 'Review kiến trúc hệ thống',
        category: 'technical',
        fields: [
            { id: 'system', type: 'text', label: 'Tên hệ thống', placeholder: 'VD: Payment Service', required: true, section: 'required', hint: 'Tên hệ thống hoặc service cần review kiến trúc', example: 'Order Management Service' },
            { id: 'description', type: 'textarea', label: 'Mô tả kiến trúc', placeholder: 'Các components, data flow, integrations...', required: true, rows: 6, section: 'required', hint: 'Mô tả các thành phần, luồng dữ liệu, và các hệ thống liên quan', example: 'Microservice architecture: API Gateway → Order Service → Payment Service → Notification. Dùng PostgreSQL + Redis cache.' },
            { id: 'requirements', type: 'textarea', label: 'Requirements', placeholder: 'NFRs: scalability, availability...', required: false, rows: 3, section: 'advanced', hint: 'Yêu cầu phi chức năng: hiệu năng, khả dụng, bảo mật', example: '99.9% uptime, <200ms response time, hỗ trợ 10K concurrent users' },
            { id: 'concerns', type: 'text', label: 'Điểm lo ngại', placeholder: 'Có gì cần focus?', required: false, section: 'advanced', hint: 'Những điểm bạn đang lo lắng về kiến trúc hiện tại', example: 'Database có thể là bottleneck khi scale lên 100K users' },
        ],
        intentPattern: `INTENT:
Tôi muốn review kiến trúc của [system].

ARCHITECTURE:
[description]

REQUIREMENTS:
[requirements]

CONCERNS: [concerns]

SUCCESS CRITERIA:
- Đánh giá design principles
- Phát hiện bottlenecks
- Đề xuất improvements`,
        outputExpected: ['Architecture Assessment', 'Strengths', 'Weaknesses', 'Bottlenecks', 'Recommendations'],
        difficulty: 'advanced',
    },
];
