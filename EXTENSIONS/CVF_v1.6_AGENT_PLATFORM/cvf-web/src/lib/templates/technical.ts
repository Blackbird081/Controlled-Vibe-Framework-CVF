import { Template } from '@/types';

export const technicalTemplates: Template[] = [
    {
        id: 'system_design_wizard',
        name: '🔧 Thiết kế Hệ thống',
        icon: '🔧',
        description: 'Multi-step wizard tạo System Design Document qua 5 bước. Requirements → Estimations → Design → Deep Dive → Review',
        category: 'technical',
        fields: [],
        intentPattern: '',
        outputExpected: ['System Design Doc', 'Architecture Diagram', 'API Design', 'Scaling Strategy'],
    },
    {
        id: 'code_review',
        name: 'Review Code',
        icon: '💻',
        description: 'Review code về chất lượng, security, performance',
        category: 'technical',
        fields: [
            { id: 'code', type: 'textarea', label: 'Code cần review', placeholder: 'Paste code vào đây...', required: true, rows: 10, section: 'required', hint: 'Paste đoạn code cần review. Nên bao gồm cả import và context xung quanh', example: 'function processPayment(amount, currency) {\n  // ... your code here\n}' },
            { id: 'language', type: 'text', label: 'Ngôn ngữ', placeholder: 'VD: Python, TypeScript...', required: true, section: 'required', hint: 'Ngôn ngữ lập trình của đoạn code', example: 'TypeScript' },
            { id: 'context', type: 'textarea', label: 'Context', placeholder: 'Code này làm gì? Thuộc module nào?', required: false, rows: 2, section: 'advanced', hint: 'Nơi code được sử dụng, mục đích của nó trong hệ thống', example: 'Function xử lý thanh toán trong module Billing, gọi bởi PaymentController' },
            { id: 'focus', type: 'multiselect', label: 'Focus areas', options: ['Security', 'Performance', 'Readability', 'Best Practices'], required: false, section: 'advanced', hint: 'Chọn các khía cạnh bạn muốn AI tập trung review' },
        ],
        intentPattern: `INTENT:
Tôi muốn review code [language].

CODE:
\`\`\`[language]
[code]
\`\`\`

CONTEXT: [context]
FOCUS AREAS: [focus]

SUCCESS CRITERIA:
- Phát hiện bugs và issues
- Đề xuất improvements
- Đánh giá overall quality`,
        outputExpected: ['Issues Found', 'Security Concerns', 'Performance Issues', 'Suggestions', 'Overall Rating'],
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
    },
];
