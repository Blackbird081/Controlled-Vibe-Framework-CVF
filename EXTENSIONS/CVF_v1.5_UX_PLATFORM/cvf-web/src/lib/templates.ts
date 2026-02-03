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

    // MARKETING & SEO TEMPLATES (Phase 1)
    {
        id: 'seo_audit',
        name: 'SEO Audit',
        icon: '🔍',
        description: 'Đánh giá website về Technical SEO, On-page, Off-page',
        category: 'marketing',
        fields: [
            { id: 'url', type: 'text', label: 'URL Website', placeholder: 'https://example.com', required: true, section: 'required' },
            { id: 'industry', type: 'text', label: 'Ngành/Lĩnh vực', placeholder: 'VD: E-commerce, SaaS, Blog...', required: true, section: 'required' },
            { id: 'keywords', type: 'textarea', label: 'Target Keywords', placeholder: 'Các từ khóa đang target', required: false, rows: 2, section: 'advanced' },
            { id: 'competitors', type: 'text', label: 'Đối thủ chính', placeholder: '2-3 website đối thủ', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn audit SEO cho website [url].

INDUSTRY: [industry]
TARGET KEYWORDS: [keywords]
COMPETITORS: [competitors]

SUCCESS CRITERIA:
- Đánh giá Technical SEO (SSL, speed, mobile)
- Đánh giá On-page SEO (title, meta, content)
- Đánh giá Off-page SEO (backlinks)
- Xác định priority issues`,
        outputExpected: ['Technical SEO Report', 'On-Page Analysis', 'Content Quality Score', 'Priority Issues', 'Action Plan'],
    },
    {
        id: 'copywriting_evaluation',
        name: 'Copywriting Evaluation',
        icon: '✍️',
        description: 'Đánh giá và cải thiện marketing copy',
        category: 'marketing',
        fields: [
            { id: 'copy', type: 'textarea', label: 'Copy Text', placeholder: 'Paste đoạn copy cần đánh giá...', required: true, rows: 6, section: 'required' },
            { id: 'type', type: 'select', label: 'Loại Copy', options: ['Headline', 'Ad', 'Email', 'Landing Page', 'Product Description'], default: 'Headline', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Đối tượng mục tiêu', required: true, section: 'required' },
            { id: 'cta', type: 'text', label: 'Mục tiêu CTA', placeholder: 'Mua hàng, đăng ký, tải app...', required: true, section: 'required' },
            { id: 'tone', type: 'select', label: 'Tone of Voice', options: ['Professional', 'Casual', 'Urgent', 'Friendly', 'Premium'], default: 'Professional', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá [type] copy.

COPY:
[copy]

TARGET AUDIENCE: [audience]
CTA GOAL: [cta]
TONE: [tone]

SUCCESS CRITERIA:
- Đánh giá clarity, benefits, emotional triggers
- Đánh giá CTA effectiveness
- Đề xuất cải thiện
- Viết lại phiên bản tối ưu`,
        outputExpected: ['Copy Score (/10)', 'Strengths', 'Issues', 'Rewritten Version', 'A/B Test Ideas'],
    },
    {
        id: 'landing_page_cro',
        name: 'Landing Page CRO',
        icon: '🎯',
        description: 'Tối ưu conversion rate cho landing pages',
        category: 'marketing',
        fields: [
            { id: 'url', type: 'text', label: 'Landing Page URL', placeholder: 'https://example.com/landing', required: true, section: 'required' },
            { id: 'goal', type: 'select', label: 'Mục tiêu conversion', options: ['Sign up', 'Purchase', 'Download', 'Contact', 'Free Trial'], default: 'Sign up', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Đối tượng mục tiêu', required: true, section: 'required' },
            { id: 'traffic', type: 'select', label: 'Traffic Source', options: ['Paid Ads', 'Organic', 'Email', 'Social', 'Mixed'], default: 'Mixed', required: false, section: 'advanced' },
            { id: 'currentCR', type: 'text', label: 'Current Conversion Rate', placeholder: 'VD: 2.5%', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn tối ưu conversion rate cho landing page [url].

CONVERSION GOAL: [goal]
TARGET AUDIENCE: [audience]
TRAFFIC SOURCE: [traffic]
CURRENT CR: [currentCR]

SUCCESS CRITERIA:
- Đánh giá above the fold elements
- Xác định friction points
- Priority quick wins
- Đề xuất A/B tests`,
        outputExpected: ['CRO Score (/100)', 'Above the Fold Analysis', 'Friction Points', 'Quick Wins', 'A/B Test Suggestions'],
    },
    {
        id: 'pricing_strategy',
        name: 'Pricing Strategy Review',
        icon: '💰',
        description: 'Đánh giá và tối ưu pricing strategy',
        category: 'marketing',
        fields: [
            { id: 'product', type: 'text', label: 'Sản phẩm/Dịch vụ', placeholder: 'Mô tả offering', required: true, section: 'required' },
            { id: 'currentPrice', type: 'text', label: 'Giá hiện tại', placeholder: 'Pricing structure hiện tại', required: true, section: 'required' },
            { id: 'model', type: 'select', label: 'Pricing Model', options: ['One-time', 'Subscription', 'Tiered', 'Freemium', 'Usage-based'], default: 'Subscription', required: true, section: 'required' },
            { id: 'target', type: 'select', label: 'Target Customer', options: ['B2B Enterprise', 'B2B SMB', 'B2C Premium', 'B2C Mass'], default: 'B2B SMB', required: true, section: 'required' },
            { id: 'competitors', type: 'text', label: 'Giá đối thủ', placeholder: 'Pricing của competitors', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá pricing strategy cho [product].

CURRENT PRICING: [currentPrice]
MODEL: [model]
TARGET: [target]
COMPETITOR PRICES: [competitors]

SUCCESS CRITERIA:
- Value-based pricing analysis
- Competitive positioning
- Pricing psychology
- Đề xuất tối ưu`,
        outputExpected: ['Pricing Assessment', 'Value Analysis', 'Competitive Position', 'Optimization Opportunities', 'Recommended Structure'],
    },
    {
        id: 'content_quality',
        name: 'Content Quality Checklist',
        icon: '📄',
        description: 'Đánh giá chất lượng content với E-E-A-T',
        category: 'marketing',
        fields: [
            { id: 'content', type: 'textarea', label: 'Content URL/Text', placeholder: 'Link hoặc paste nội dung', required: true, rows: 4, section: 'required' },
            { id: 'type', type: 'select', label: 'Content Type', options: ['Blog', 'Guide', 'Landing page', 'Product page', 'How-to'], default: 'Blog', required: true, section: 'required' },
            { id: 'keyword', type: 'text', label: 'Target Keyword', placeholder: 'Từ khóa chính muốn rank', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Đối tượng đọc content', required: true, section: 'required' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá chất lượng [type] content.

CONTENT:
[content]

TARGET KEYWORD: [keyword]
AUDIENCE: [audience]

SUCCESS CRITERIA:
- E-E-A-T assessment
- SEO optimization check
- Readability score
- Gap analysis vs competitors`,
        outputExpected: ['Content Score (/10)', 'SEO Analysis', 'Readability Report', 'E-E-A-T Assessment', 'Improvement Recommendations'],
    },
    {
        id: 'email_campaign',
        name: 'Email Campaign Review',
        icon: '📧',
        description: 'Đánh giá email marketing campaigns',
        category: 'marketing',
        fields: [
            { id: 'email', type: 'textarea', label: 'Email Content', placeholder: 'Paste full email (subject + body)', required: true, rows: 8, section: 'required' },
            { id: 'type', type: 'select', label: 'Email Type', options: ['Newsletter', 'Promotional', 'Transactional', 'Nurture', 'Re-engagement'], default: 'Promotional', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Segment này là ai?', required: true, section: 'required' },
            { id: 'goal', type: 'select', label: 'Campaign Goal', options: ['CTR', 'Sales', 'Engagement', 'Re-engagement'], default: 'CTR', required: true, section: 'required' },
        ],
        intentPattern: `INTENT:
Tôi muốn review [type] email campaign.

EMAIL:
[email]

AUDIENCE: [audience]
GOAL: [goal]

SUCCESS CRITERIA:
- Subject line effectiveness
- Body content quality
- CTA clarity
- Mobile-friendliness`,
        outputExpected: ['Email Score (/10)', 'Subject Line Analysis', 'Content Review', 'Deliverability Check', 'Rewritten Version'],
    },
    {
        id: 'social_ad_review',
        name: 'Social Media Ad Review',
        icon: '📱',
        description: 'Tối ưu ads trên Facebook, Instagram, TikTok',
        category: 'marketing',
        fields: [
            { id: 'creative', type: 'textarea', label: 'Ad Creative', placeholder: 'Mô tả image/video hoặc link', required: true, rows: 3, section: 'required' },
            { id: 'copy', type: 'textarea', label: 'Ad Copy', placeholder: 'Headline + Primary text + CTA', required: true, rows: 4, section: 'required' },
            { id: 'platform', type: 'select', label: 'Platform', options: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube'], default: 'Facebook', required: true, section: 'required' },
            { id: 'objective', type: 'select', label: 'Campaign Objective', options: ['Traffic', 'Conversions', 'Leads', 'Awareness', 'Engagement'], default: 'Conversions', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Demographics, interests, behaviors', required: true, section: 'required' },
        ],
        intentPattern: `INTENT:
Tôi muốn review [platform] ad cho mục tiêu [objective].

CREATIVE:
[creative]

AD COPY:
[copy]

AUDIENCE: [audience]

SUCCESS CRITERIA:
- Creative effectiveness (thumb-stopping)
- Copy quality (hook, benefits, CTA)
- Platform optimization
- Predicted performance`,
        outputExpected: ['Ad Score (/10)', 'Creative Analysis', 'Copy Review', 'Platform Optimization', 'A/B Test Ideas', 'Rewritten Ad'],
    },
    {
        id: 'brand_voice',
        name: 'Brand Voice Consistency',
        icon: '🎙️',
        description: 'Đảm bảo brand voice nhất quán',
        category: 'marketing',
        fields: [
            { id: 'brand', type: 'text', label: 'Brand Name', placeholder: 'Tên thương hiệu', required: true, section: 'required' },
            { id: 'industry', type: 'text', label: 'Industry', placeholder: 'Ngành nghề', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: 'Customer persona chính', required: true, section: 'required' },
            { id: 'samples', type: 'textarea', label: 'Sample Content', placeholder: '3-5 samples từ các channels khác nhau', required: true, rows: 6, section: 'required' },
            { id: 'values', type: 'text', label: 'Brand Values', placeholder: 'Core values của brand', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá brand voice consistency cho [brand].

INDUSTRY: [industry]
TARGET AUDIENCE: [audience]
BRAND VALUES: [values]

SAMPLE CONTENT:
[samples]

SUCCESS CRITERIA:
- Voice attributes assessment
- Cross-channel consistency
- Tone appropriateness
- Improvement recommendations`,
        outputExpected: ['Voice Audit', 'Consistency Score (/10)', 'Voice Attributes', 'Tone Matrix', 'Language Guidelines'],
    },

    // PRODUCT & UX TEMPLATES (Phase 2)
    {
        id: 'ab_test_review',
        name: 'A/B Test Review',
        icon: '🧪',
        description: 'Đánh giá A/B test design và results',
        category: 'product',
        fields: [
            { id: 'hypothesis', type: 'textarea', label: 'Hypothesis', placeholder: 'Giả thuyết: Nếu... thì...', required: true, rows: 2, section: 'required' },
            { id: 'metric', type: 'text', label: 'Primary Metric', placeholder: 'VD: Conversion rate, CTR...', required: true, section: 'required' },
            { id: 'variants', type: 'textarea', label: 'Variants', placeholder: 'Control vs Treatment descriptions', required: true, rows: 3, section: 'required' },
            { id: 'sampleSize', type: 'text', label: 'Sample Size', placeholder: 'Số users mỗi variant', required: false, section: 'advanced' },
            { id: 'results', type: 'textarea', label: 'Results (nếu có)', placeholder: 'Kết quả từ tool', required: false, rows: 3, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn review A/B test.

HYPOTHESIS: [hypothesis]
PRIMARY METRIC: [metric]
VARIANTS: [variants]
SAMPLE SIZE: [sampleSize]
RESULTS: [results]

SUCCESS CRITERIA:
- Hypothesis quality check
- Statistical validity
- Sample size adequacy
- Result interpretation`,
        outputExpected: ['Test Design Assessment', 'Statistical Analysis', 'Winner Recommendation', 'Next Steps'],
    },
    {
        id: 'accessibility_audit',
        name: 'Accessibility Audit',
        icon: '♿',
        description: 'Kiểm tra WCAG compliance',
        category: 'product',
        fields: [
            { id: 'url', type: 'text', label: 'Page URL', placeholder: 'https://example.com/page', required: true, section: 'required' },
            { id: 'level', type: 'select', label: 'WCAG Level', options: ['A', 'AA', 'AAA'], default: 'AA', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'Target Users', placeholder: 'Đối tượng sử dụng có disability nào?', required: false, section: 'advanced' },
            { id: 'issues', type: 'textarea', label: 'Known Issues', placeholder: 'Các issues đã biết', required: false, rows: 3, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn audit accessibility cho page [url].

TARGET WCAG LEVEL: [level]
TARGET USERS: [audience]
KNOWN ISSUES: [issues]

SUCCESS CRITERIA:
- Visual accessibility check
- Keyboard navigation
- Screen reader compatibility
- Color contrast analysis`,
        outputExpected: ['WCAG Compliance Score', 'Critical Issues', 'Recommended Fixes', 'Testing Checklist'],
    },
    {
        id: 'user_flow_analysis',
        name: 'User Flow Analysis',
        icon: '🔄',
        description: 'Phân tích và tối ưu user journeys',
        category: 'product',
        fields: [
            { id: 'flow', type: 'textarea', label: 'User Flow', placeholder: 'Mô tả các steps từ entry đến goal', required: true, rows: 6, section: 'required' },
            { id: 'goal', type: 'text', label: 'Conversion Goal', placeholder: 'VD: Complete purchase', required: true, section: 'required' },
            { id: 'dropoff', type: 'textarea', label: 'Drop-off Points', placeholder: 'Các điểm users rời khỏi flow', required: false, rows: 3, section: 'advanced' },
            { id: 'metrics', type: 'text', label: 'Current Metrics', placeholder: 'Conversion rates at each step', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn phân tích user flow.

FLOW DESCRIPTION:
[flow]

CONVERSION GOAL: [goal]
DROP-OFF POINTS: [dropoff]
CURRENT METRICS: [metrics]

SUCCESS CRITERIA:
- Friction point identification
- Drop-off analysis
- Optimization recommendations
- Quick wins vs long-term fixes`,
        outputExpected: ['Flow Diagram', 'Friction Analysis', 'Drop-off Causes', 'Optimization Roadmap'],
    },
    {
        id: 'ux_heuristic_evaluation',
        name: 'UX Heuristic Evaluation',
        icon: '📋',
        description: 'Đánh giá UX theo Nielsen\'s 10 Heuristics',
        category: 'product',
        fields: [
            { id: 'product', type: 'text', label: 'Product/Feature', placeholder: 'Tên sản phẩm hoặc feature', required: true, section: 'required' },
            { id: 'description', type: 'textarea', label: 'Description', placeholder: 'Mô tả product/feature', required: true, rows: 4, section: 'required' },
            { id: 'url', type: 'text', label: 'URL (nếu có)', placeholder: 'Link đến product', required: false, section: 'advanced' },
            { id: 'focus', type: 'text', label: 'Focus Areas', placeholder: 'Các areas cần focus', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn đánh giá UX heuristics cho [product].

DESCRIPTION: [description]
URL: [url]
FOCUS AREAS: [focus]

SUCCESS CRITERIA:
- Đánh giá theo Nielsen's 10 Heuristics
- Severity rating cho issues
- Priority recommendations
- Before/After examples`,
        outputExpected: ['Heuristic Scores', 'Issue Severity Matrix', 'Top Issues', 'Recommendations'],
    },
    {
        id: 'feature_prioritization',
        name: 'Feature Prioritization',
        icon: '🎯',
        description: 'RICE/ICE framework cho feature prioritization',
        category: 'product',
        fields: [
            { id: 'features', type: 'textarea', label: 'Feature List', placeholder: 'Danh sách features cần prioritize', required: true, rows: 6, section: 'required' },
            { id: 'goal', type: 'text', label: 'Product Goal', placeholder: 'Mục tiêu product hiện tại', required: true, section: 'required' },
            { id: 'constraints', type: 'text', label: 'Constraints', placeholder: 'Budget, timeline, resources...', required: false, section: 'advanced' },
            { id: 'framework', type: 'select', label: 'Framework', options: ['RICE', 'ICE', 'MoSCoW', 'Kano'], default: 'RICE', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn prioritize features bằng [framework] framework.

FEATURES:
[features]

PRODUCT GOAL: [goal]
CONSTRAINTS: [constraints]

SUCCESS CRITERIA:
- Score mỗi feature theo framework
- Prioritized list
- Quick wins identification
- Roadmap suggestion`,
        outputExpected: ['Scoring Matrix', 'Prioritized List', 'Quick Wins', 'Roadmap Recommendation'],
    },
    {
        id: 'user_persona',
        name: 'User Persona Development',
        icon: '👤',
        description: 'Tạo user personas dựa trên data',
        category: 'product',
        fields: [
            { id: 'product', type: 'text', label: 'Product/Service', placeholder: 'Tên sản phẩm/dịch vụ', required: true, section: 'required' },
            { id: 'data', type: 'textarea', label: 'User Data', placeholder: 'Demographics, behaviors, interviews...', required: true, rows: 6, section: 'required' },
            { id: 'segments', type: 'text', label: 'User Segments', placeholder: 'Các segments đã biết', required: false, section: 'advanced' },
            { id: 'goals', type: 'text', label: 'Business Goals', placeholder: 'Mục tiêu kinh doanh', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn tạo user personas cho [product].

USER DATA:
[data]

SEGMENTS: [segments]
BUSINESS GOALS: [goals]

SUCCESS CRITERIA:
- 2-4 distinct personas
- Demographics, goals, pain points
- Jobs to be done
- Decision criteria`,
        outputExpected: ['Persona Profiles', 'User Journey Maps', 'Pain Points', 'Opportunities'],
    },
    {
        id: 'error_handling_ux',
        name: 'Error Handling UX',
        icon: '⚠️',
        description: 'Cải thiện cách handle errors',
        category: 'product',
        fields: [
            { id: 'errors', type: 'textarea', label: 'Current Error Messages', placeholder: 'Paste các error messages hiện tại', required: true, rows: 6, section: 'required' },
            { id: 'context', type: 'text', label: 'Error Context', placeholder: 'Form, checkout, login, etc.', required: true, section: 'required' },
            { id: 'audience', type: 'text', label: 'User Type', placeholder: 'Technical users hay end users?', required: false, section: 'advanced' },
            { id: 'tone', type: 'select', label: 'Brand Tone', options: ['Friendly', 'Professional', 'Technical', 'Playful'], default: 'Friendly', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn cải thiện error handling UX cho context [context].

CURRENT ERRORS:
[errors]

USER TYPE: [audience]
BRAND TONE: [tone]

SUCCESS CRITERIA:
- Error message clarity
- User guidance
- Recovery options
- Consistent tone`,
        outputExpected: ['Error Analysis', 'Rewritten Messages', 'UX Improvements', 'Best Practices'],
    },
    {
        id: 'onboarding_review',
        name: 'Onboarding Experience Review',
        icon: '🚀',
        description: 'Tối ưu first-time user experience',
        category: 'product',
        fields: [
            { id: 'product', type: 'text', label: 'Product', placeholder: 'Tên sản phẩm', required: true, section: 'required' },
            { id: 'flow', type: 'textarea', label: 'Current Onboarding Flow', placeholder: 'Mô tả các steps hiện tại', required: true, rows: 6, section: 'required' },
            { id: 'ttv', type: 'text', label: 'Time to Value', placeholder: 'Hiện tại bao lâu để user thấy value?', required: false, section: 'advanced' },
            { id: 'dropoff', type: 'text', label: 'Drop-off Rate', placeholder: '% users drop-off during onboarding', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn review onboarding experience cho [product].

CURRENT FLOW:
[flow]

TIME TO VALUE: [ttv]
DROP-OFF RATE: [dropoff]

SUCCESS CRITERIA:
- Identify friction points
- Reduce time to value
- Progressive disclosure
- Personalization opportunities`,
        outputExpected: ['Onboarding Assessment', 'Friction Points', 'Optimization Recommendations', 'Metrics to Track'],
    },

    // SECURITY & COMPLIANCE TEMPLATES (Phase 3)
    {
        id: 'api_security',
        name: 'API Security Checklist',
        icon: '🔒',
        description: 'OWASP Top 10 API security audit',
        category: 'security',
        fields: [
            { id: 'endpoints', type: 'textarea', label: 'API Endpoints', placeholder: 'List các endpoints cần audit', required: true, rows: 4, section: 'required' },
            { id: 'authType', type: 'select', label: 'Authentication', options: ['JWT', 'OAuth', 'API Key', 'Session', 'None'], default: 'JWT', required: true, section: 'required' },
            { id: 'apiType', type: 'select', label: 'API Type', options: ['REST', 'GraphQL', 'gRPC', 'WebSocket'], default: 'REST', required: true, section: 'required' },
            { id: 'dataSensitivity', type: 'select', label: 'Data Sensitivity', options: ['Public', 'Internal', 'Confidential', 'PII', 'PCI'], default: 'Internal', required: true, section: 'required' },
        ],
        intentPattern: `INTENT:
Tôi muốn audit API security.

ENDPOINTS:
[endpoints]

AUTH TYPE: [authType]
API TYPE: [apiType]
DATA SENSITIVITY: [dataSensitivity]

SUCCESS CRITERIA:
- OWASP API Top 10 check
- Authentication/Authorization review
- Input validation
- Rate limiting assessment`,
        outputExpected: ['Security Score', 'Vulnerability Assessment', 'Critical Issues', 'Remediation Guide'],
    },
    {
        id: 'gdpr_compliance',
        name: 'GDPR Compliance Review',
        icon: '🇪🇺',
        description: 'EU data protection compliance check',
        category: 'security',
        fields: [
            { id: 'product', type: 'text', label: 'Website/App', placeholder: 'URL hoặc tên app', required: true, section: 'required' },
            { id: 'dataCollected', type: 'textarea', label: 'Data Collected', placeholder: 'Types of personal data', required: true, rows: 3, section: 'required' },
            { id: 'purpose', type: 'textarea', label: 'Processing Purpose', placeholder: 'Why data is collected', required: true, rows: 2, section: 'required' },
            { id: 'thirdParties', type: 'text', label: 'Third Parties', placeholder: 'Analytics, payment, ads...', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn review GDPR compliance cho [product].

DATA COLLECTED:
[dataCollected]

PROCESSING PURPOSE: [purpose]
THIRD PARTIES: [thirdParties]

SUCCESS CRITERIA:
- Consent mechanism check
- User rights implementation
- Privacy policy review
- Cookie compliance`,
        outputExpected: ['Compliance Score', 'Gap Analysis', 'Privacy Policy Review', 'Remediation Plan'],
    },
    {
        id: 'privacy_policy_audit',
        name: 'Privacy Policy Audit',
        icon: '📜',
        description: 'Privacy policy review và cải thiện',
        category: 'security',
        fields: [
            { id: 'policy', type: 'textarea', label: 'Policy URL/Text', placeholder: 'Link hoặc paste policy', required: true, rows: 6, section: 'required' },
            { id: 'businessType', type: 'select', label: 'Business Type', options: ['E-commerce', 'SaaS', 'Mobile App', 'Website', 'Marketplace'], default: 'SaaS', required: true, section: 'required' },
            { id: 'markets', type: 'text', label: 'Target Markets', placeholder: 'US, EU, APAC, Global...', required: true, section: 'required' },
            { id: 'dataTypes', type: 'text', label: 'Data Types', placeholder: 'Types of personal data collected', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn audit privacy policy.

POLICY:
[policy]

BUSINESS TYPE: [businessType]
TARGET MARKETS: [markets]
DATA TYPES: [dataTypes]

SUCCESS CRITERIA:
- Required elements check
- Readability assessment
- Regional compliance
- Third-party coverage`,
        outputExpected: ['Compliance Score', 'Missing Elements', 'Readability Score', 'Improvement Suggestions'],
    },
    {
        id: 'incident_response',
        name: 'Incident Response Plan',
        icon: '🚨',
        description: 'Security incident response planning',
        category: 'security',
        fields: [
            { id: 'companySize', type: 'select', label: 'Company Size', options: ['Startup', 'SMB', 'Enterprise'], default: 'SMB', required: true, section: 'required' },
            { id: 'industry', type: 'text', label: 'Industry', placeholder: 'Tech, Finance, Healthcare...', required: true, section: 'required' },
            { id: 'criticalSystems', type: 'textarea', label: 'Critical Systems', placeholder: 'Most important systems/data', required: true, rows: 3, section: 'required' },
            { id: 'currentPlan', type: 'textarea', label: 'Current Plan (nếu có)', placeholder: 'Existing IRP', required: false, rows: 3, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn xây dựng/review incident response plan.

COMPANY SIZE: [companySize]
INDUSTRY: [industry]
CRITICAL SYSTEMS: [criticalSystems]
CURRENT PLAN: [currentPlan]

SUCCESS CRITERIA:
- Team roles definition
- Severity levels
- Response procedures
- Communication templates`,
        outputExpected: ['IRP Assessment', 'Team Roles', 'Response Playbooks', 'Communication Templates'],
    },
    {
        id: 'data_handling',
        name: 'Data Handling Review',
        icon: '📊',
        description: 'Data lifecycle management review',
        category: 'security',
        fields: [
            { id: 'dataTypes', type: 'textarea', label: 'Data Types', placeholder: 'PII, PCI, PHI, Business data...', required: true, rows: 3, section: 'required' },
            { id: 'sources', type: 'text', label: 'Data Sources', placeholder: 'Where data comes from', required: true, section: 'required' },
            { id: 'storage', type: 'text', label: 'Storage Systems', placeholder: 'Databases, cloud, files...', required: true, section: 'required' },
            { id: 'regulations', type: 'text', label: 'Regulations', placeholder: 'GDPR, HIPAA, PCI-DSS...', required: false, section: 'advanced' },
        ],
        intentPattern: `INTENT:
Tôi muốn review data handling practices.

DATA TYPES: [dataTypes]
DATA SOURCES: [sources]
STORAGE SYSTEMS: [storage]
REGULATIONS: [regulations]

SUCCESS CRITERIA:
- Classification scheme
- Retention policies
- Security controls
- Deletion procedures`,
        outputExpected: ['Data Inventory', 'Classification Matrix', 'Gap Analysis', 'Policy Recommendations'],
    },
    {
        id: 'tos_review',
        name: 'Terms of Service Review',
        icon: '📋',
        description: 'Terms of Service coverage và fairness',
        category: 'security',
        fields: [
            { id: 'tos', type: 'textarea', label: 'ToS URL/Text', placeholder: 'Link hoặc paste ToS', required: true, rows: 6, section: 'required' },
            { id: 'serviceType', type: 'select', label: 'Service Type', options: ['SaaS', 'Marketplace', 'Mobile App', 'Website', 'API'], default: 'SaaS', required: true, section: 'required' },
            { id: 'model', type: 'select', label: 'Business Model', options: ['Subscription', 'Free', 'Freemium', 'One-time', 'Usage-based'], default: 'Subscription', required: true, section: 'required' },
            { id: 'markets', type: 'text', label: 'Target Markets', placeholder: 'US, EU, Global...', required: true, section: 'required' },
        ],
        intentPattern: `INTENT:
Tôi muốn review Terms of Service.

TOS:
[tos]

SERVICE TYPE: [serviceType]
BUSINESS MODEL: [model]
TARGET MARKETS: [markets]

SUCCESS CRITERIA:
- Essential sections coverage
- User-friendliness
- Fairness assessment
- Regional compliance`,
        outputExpected: ['ToS Score', 'Coverage Analysis', 'Fairness Review', 'Improvement Suggestions'],
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

/**
 * Generate a complete CVF specification document
 * Ready for copy/paste into any AI (ChatGPT, Claude, Gemini, etc.)
 */
export function generateCompleteSpec(
    template: Template,
    values: Record<string, string>,
    userIntent?: string
): string {
    const date = new Date().toISOString().split('T')[0];
    const intent = generateIntent(template, values);

    // Build user input section
    const userInputLines = Object.entries(values)
        .filter(([, value]) => value && value.trim())
        .map(([key, value]) => {
            const field = template.fields.find(f => f.id === key);
            const label = field?.label || key;
            return `- **${label}:** ${value}`;
        })
        .join('\n');

    // Build expected output section
    const expectedOutput = template.outputExpected
        ?.map(item => `- ${item}`)
        .join('\n') || '- Comprehensive analysis\n- Actionable recommendations';

    const spec = `---
# CVF Task Specification
**Generated:** ${date}
**Template:** ${template.name}
**Category:** ${template.category}
---

## 📋 Context

**Template:** ${template.icon} ${template.name}

${template.description}

---

## 📝 User Input

${userInputLines || '(No input provided)'}

---

## 🎯 Task

${intent}

---

## 📤 Expected Output Format

${expectedOutput}

---

## 💡 Instructions for AI

Please analyze the information provided above and generate a comprehensive response that:
1. Addresses all the success criteria listed in the Task section
2. Follows the Expected Output Format structure
3. Provides actionable insights and recommendations
4. Uses clear, professional language
5. Includes specific examples where applicable

---

> **CVF v1.5 UX Platform**
> Copy this entire specification and paste into your preferred AI assistant (ChatGPT, Claude, Gemini, etc.)
`;

    return spec;
}

