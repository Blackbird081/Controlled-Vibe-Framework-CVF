import { Template } from '@/types';

export const templates: Template[] = [
    // BUSINESS TEMPLATES
    {
        id: 'strategy_analysis',
        name: 'Strategy Analysis',
        icon: '📊',
        description: 'Phân tích chiến lược kinh doanh, so sánh các phương án',
        category: 'business',
        fields: [
            { id: 'topic', type: 'text', label: 'Chủ đề chiến lược', placeholder: 'VD: Mở rộng thị trường miền Trung', required: true, section: 'required' },
            { id: 'context', type: 'textarea', label: 'Bối cảnh', placeholder: 'Mô tả ngành, quy mô, thị trường...', required: true, rows: 4, section: 'required' },
            { id: 'options', type: 'textarea', label: 'Các phương án (nếu có)', placeholder: 'Liệt kê các options đang cân nhắc', required: false, rows: 3, section: 'advanced' },
            { id: 'constraints', type: 'text', label: 'Ràng buộc', placeholder: 'Budget, timeline, resources...', required: false, section: 'advanced' },
            { id: 'priority', type: 'select', label: 'Ưu tiên', options: ['Growth', 'Stability', 'Cost Optimization'], default: 'Growth', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn phân tích chiến lược [topic].

CONTEXT:
[context]

OPTIONS:
[options]

CONSTRAINTS:
[constraints]

PRIORITY: [priority]

SUCCESS CRITERIA:
- Phân tích rõ ưu/nhược điểm
- Xác định rủi ro chính  
- Đưa ra khuyến nghị có căn cứ`,
        outputExpected: ['Executive Summary', 'SWOT Analysis', 'Options Comparison', 'Risk Assessment', 'Recommendations'],
    },
    {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        icon: '⚠️',
        description: 'Đánh giá rủi ro với kế hoạch giảm thiểu',
        category: 'business',
        fields: [
            { id: 'subject', type: 'text', label: 'Chủ đề đánh giá', placeholder: 'VD: Dự án cloud migration', required: true, section: 'required' },
            { id: 'description', type: 'textarea', label: 'Mô tả chi tiết', placeholder: 'Mô tả dự án/quyết định cần đánh giá', required: true, rows: 4, section: 'required' },
            { id: 'stakeholders', type: 'text', label: 'Stakeholders', placeholder: 'Ai bị ảnh hưởng?', required: false, section: 'advanced' },
            { id: 'timeline', type: 'text', label: 'Timeline', placeholder: 'Thời gian thực hiện', required: false, section: 'advanced' },
            { id: 'tolerance', type: 'select', label: 'Risk Tolerance', options: ['Low', 'Medium', 'High'], default: 'Medium', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá rủi ro của [subject].

DESCRIPTION:
[description]

STAKEHOLDERS: [stakeholders]
TIMELINE: [timeline]
RISK TOLERANCE: [tolerance]

SUCCESS CRITERIA:
- Xác định 5-10 rủi ro chính
- Phân loại theo mức độ (High/Medium/Low)
- Đề xuất mitigation cho mỗi rủi ro`,
        outputExpected: ['Risk Matrix', 'Top Risks', 'Mitigation Plans', 'Contingency Plans', 'Recommendations'],
    },
    {
        id: 'competitor_review',
        name: 'Competitor Review',
        icon: '🔍',
        description: 'Phân tích đối thủ cạnh tranh',
        category: 'business',
        fields: [
            { id: 'company', type: 'text', label: 'Công ty của bạn', placeholder: 'Tên và mô tả ngắn', required: true, section: 'required' },
            { id: 'competitors', type: 'textarea', label: 'Đối thủ chính', placeholder: 'Liệt kê các đối thủ cần phân tích', required: true, rows: 3, section: 'required' },
            { id: 'industry', type: 'text', label: 'Ngành', placeholder: 'VD: E-commerce, Fintech...', required: true, section: 'required' },
            { id: 'criteria', type: 'textarea', label: 'Tiêu chí so sánh', placeholder: 'Giá, chất lượng, marketing, tech...', required: false, rows: 2, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn phân tích đối thủ cạnh tranh trong ngành [industry].

MY COMPANY: [company]

COMPETITORS:
[competitors]

COMPARISON CRITERIA:
[criteria]

SUCCESS CRITERIA:
- Ma trận so sánh các đối thủ
- Điểm mạnh/yếu từng đối thủ
- Cơ hội khác biệt hóa`,
        outputExpected: ['Competitor Matrix', 'SWOT per Competitor', 'Differentiation Opportunities', 'Market Positioning'],
    },

    // TECHNICAL TEMPLATES
    {
        id: 'code_review',
        name: 'Code Review',
        icon: '💻',
        description: 'Review code về chất lượng, security, performance',
        category: 'technical',
        fields: [
            { id: 'code', type: 'textarea', label: 'Code cần review', placeholder: 'Paste code vào đây...', required: true, rows: 10, section: 'required' },
            { id: 'language', type: 'text', label: 'Ngôn ngữ', placeholder: 'VD: Python, TypeScript...', required: true, section: 'required' },
            { id: 'context', type: 'textarea', label: 'Context', placeholder: 'Code này làm gì? Thuộc module nào?', required: false, rows: 2, section: 'advanced' },
            { id: 'focus', type: 'multiselect', label: 'Focus areas', options: ['Security', 'Performance', 'Readability', 'Best Practices'], required: false, section: 'advanced' },
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
        name: 'Architecture Review',
        icon: '🏗️',
        description: 'Review kiến trúc hệ thống',
        category: 'technical',
        fields: [
            { id: 'system', type: 'text', label: 'Tên hệ thống', placeholder: 'VD: Payment Service', required: true, section: 'required' },
            { id: 'description', type: 'textarea', label: 'Mô tả kiến trúc', placeholder: 'Các components, data flow, integrations...', required: true, rows: 6, section: 'required' },
            { id: 'requirements', type: 'textarea', label: 'Requirements', placeholder: 'NFRs: scalability, availability...', required: false, rows: 3, section: 'advanced' },
            { id: 'concerns', type: 'text', label: 'Điểm lo ngại', placeholder: 'Có gì cần focus?', required: false, section: 'advanced' },
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

    // CONTENT TEMPLATES
    {
        id: 'documentation',
        name: 'Documentation',
        icon: '📝',
        description: 'Tạo technical documentation',
        category: 'content',
        fields: [
            { id: 'subject', type: 'text', label: 'Chủ đề', placeholder: 'VD: API Authentication Guide', required: true, section: 'required' },
            { id: 'content', type: 'textarea', label: 'Nội dung cần document', placeholder: 'Mô tả feature/API/process...', required: true, rows: 6, section: 'required' },
            { id: 'audience', type: 'select', label: 'Đối tượng', options: ['Developers', 'End Users', 'Admins', 'All'], default: 'Developers', required: false, section: 'advanced' },
            { id: 'format', type: 'select', label: 'Format', options: ['Tutorial', 'Reference', 'How-to', 'Explanation'], default: 'Reference', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn tạo documentation cho [subject].

CONTENT:
[content]

AUDIENCE: [audience]
FORMAT: [format]

SUCCESS CRITERIA:
- Cấu trúc rõ ràng
- Có examples
- Dễ follow`,
        outputExpected: ['Overview', 'Prerequisites', 'Step-by-step Guide', 'Examples', 'Troubleshooting', 'FAQ'],
    },
    {
        id: 'email_template',
        name: 'Email Templates',
        icon: '📧',
        description: 'Tạo email chuyên nghiệp',
        category: 'content',
        fields: [
            { id: 'purpose', type: 'text', label: 'Mục đích email', placeholder: 'VD: Follow-up sau meeting', required: true, section: 'required' },
            { id: 'context', type: 'textarea', label: 'Context', placeholder: 'Tình huống cụ thể...', required: true, rows: 4, section: 'required' },
            { id: 'recipient', type: 'text', label: 'Người nhận', placeholder: 'VD: Khách hàng, đồng nghiệp...', required: false, section: 'advanced' },
            { id: 'tone', type: 'select', label: 'Tone', options: ['Formal', 'Professional', 'Friendly', 'Urgent'], default: 'Professional', required: false, section: 'advanced' },
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
    },

    // RESEARCH TEMPLATES
    {
        id: 'data_analysis',
        name: 'Data Analysis',
        icon: '📊',
        description: 'Phân tích dữ liệu và rút insights',
        category: 'research',
        fields: [
            { id: 'dataset', type: 'textarea', label: 'Mô tả dataset', placeholder: 'Loại data, sources, format...', required: true, rows: 4, section: 'required' },
            { id: 'questions', type: 'textarea', label: 'Câu hỏi nghiên cứu', placeholder: 'Bạn muốn tìm hiểu điều gì?', required: true, rows: 3, section: 'required' },
            { id: 'methods', type: 'text', label: 'Phương pháp', placeholder: 'VD: Regression, clustering...', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn phân tích dữ liệu.

DATASET:
[dataset]

RESEARCH QUESTIONS:
[questions]

METHODS: [methods]

SUCCESS CRITERIA:
- Insights rõ ràng
- Có supporting evidence
- Actionable recommendations`,
        outputExpected: ['Dataset Overview', 'Key Findings', 'Statistical Analysis', 'Visualizations', 'Insights', 'Recommendations'],
    },
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
    return templates.filter(t => t.category === category);
}

export function generateIntent(template: Template, values: Record<string, string>): string {
    let intent = template.intentPattern;

    Object.entries(values).forEach(([key, value]) => {
        intent = intent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || 'N/A');
    });

    return intent;
}
