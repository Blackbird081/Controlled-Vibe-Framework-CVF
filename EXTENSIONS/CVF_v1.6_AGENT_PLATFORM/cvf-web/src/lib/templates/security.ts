import { Template } from '@/types';

export const securityTemplates: Template[] = [
    {
        id: 'security_assessment_wizard',
        name: '🔐 Đánh giá Bảo mật',
        icon: '🔐',
        description: 'Multi-step wizard tạo Security Assessment Report qua 5 bước. Scope → Threats → Vulns → Risk → Review',
        category: 'security',
        fields: [],
        intentPattern: '',
        outputExpected: ['Security Assessment', 'Threat Model', 'Risk Matrix', 'Remediation Plan'],
    },
    {
        id: 'api_security',
        name: 'Checklist Bảo mật API',
        icon: '🔒',
        description: 'OWASP Top 10 API security audit',
        category: 'security',
        fields: [
            { id: 'endpoints', type: 'textarea', label: 'API Endpoints', placeholder: 'List các endpoints cần audit', required: true, rows: 4, section: 'required', hint: 'Liệt kê các endpoints với method và mô tả ngắn', example: 'POST /api/auth/login\nGET /api/users/:id\nPUT /api/users/:id\nDELETE /api/users/:id' },
            { id: 'authType', type: 'select', label: 'Authentication', options: ['JWT', 'OAuth', 'API Key', 'Session', 'None'], default: 'JWT', required: true, section: 'required', hint: 'Phương thức xác thực hiện tại của API' },
            { id: 'apiType', type: 'select', label: 'API Type', options: ['REST', 'GraphQL', 'gRPC', 'WebSocket'], default: 'REST', required: true, section: 'required', hint: 'Loại API đang sử dụng' },
            { id: 'dataSensitivity', type: 'select', label: 'Data Sensitivity', options: ['Public', 'Internal', 'Confidential', 'PII', 'PCI'], default: 'Internal', required: true, section: 'required', hint: 'Mức độ nhạy cảm của dữ liệu qua API: PII = thông tin cá nhân, PCI = thanh toán' },
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
        name: 'Kiểm tra Tuân thủ GDPR',
        icon: '🇪🇺',
        description: 'EU data protection compliance check',
        category: 'security',
        fields: [
            { id: 'product', type: 'text', label: 'Website/App', placeholder: 'URL hoặc tên app', required: true, section: 'required', hint: 'URL hoặc tên ứng dụng cần kiểm tra GDPR', example: 'https://shopx.vn hoặc ShopX Mobile App' },
            { id: 'dataCollected', type: 'textarea', label: 'Data Collected', placeholder: 'Types of personal data', required: true, rows: 3, section: 'required', hint: 'Liệt kê các loại dữ liệu cá nhân thu thập', example: 'Email, tên, số điện thoại, địa chỉ giao hàng, lịch sử mua hàng, cookie định danh' },
            { id: 'purpose', type: 'textarea', label: 'Processing Purpose', placeholder: 'Why data is collected', required: true, rows: 2, section: 'required', hint: 'Mục đích thu thập từng loại dữ liệu', example: 'Email: gửi hóa đơn và newsletter. Địa chỉ: giao hàng. Cookie: analytics và retargeting' },
            { id: 'thirdParties', type: 'text', label: 'Third Parties', placeholder: 'Analytics, payment, ads...', required: false, section: 'advanced', hint: 'Các dịch vụ bên thứ 3 được chia sẻ dữ liệu', example: 'Google Analytics, Stripe, Facebook Pixel, Mailchimp' },
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
        name: 'Kiểm tra Chính sách Bảo mật',
        icon: '📜',
        description: 'Privacy policy review và cải thiện',
        category: 'security',
        fields: [
            { id: 'policy', type: 'textarea', label: 'Policy URL/Text', placeholder: 'Link hoặc paste policy', required: true, rows: 6, section: 'required', hint: 'Dán URL hoặc nội dung privacy policy cần audit', example: 'https://shopx.vn/privacy-policy' },
            { id: 'businessType', type: 'select', label: 'Business Type', options: ['E-commerce', 'SaaS', 'Mobile App', 'Website', 'Marketplace'], default: 'SaaS', required: true, section: 'required', hint: 'Loại hình kinh doanh sẽ quyết định yêu cầu compliance khác nhau' },
            { id: 'markets', type: 'text', label: 'Target Markets', placeholder: 'US, EU, APAC, Global...', required: true, section: 'required', hint: 'Thị trường hoạt động quyết định luật áp dụng (GDPR, CCPA...)', example: 'EU + US + Việt Nam' },
            { id: 'dataTypes', type: 'text', label: 'Data Types', placeholder: 'Types of personal data collected', required: false, section: 'advanced', hint: 'Các loại dữ liệu cá nhân đang thu thập', example: 'PII (email, tên), payment data, location, browsing history' },
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
        name: 'Kế hoạch Ứng phó Sự cố',
        icon: '🚨',
        description: 'Security incident response planning',
        category: 'security',
        fields: [
            { id: 'companySize', type: 'select', label: 'Company Size', options: ['Startup', 'SMB', 'Enterprise'], default: 'SMB', required: true, section: 'required', hint: 'Quy mô công ty quyết định mức độ chi tiết của plan' },
            { id: 'industry', type: 'text', label: 'Industry', placeholder: 'Tech, Finance, Healthcare...', required: true, section: 'required', hint: 'Ngành kinh doanh — một số ngành có compliance riêng', example: 'Fintech — xử lý thanh toán online' },
            { id: 'criticalSystems', type: 'textarea', label: 'Critical Systems', placeholder: 'Most important systems/data', required: true, rows: 3, section: 'required', hint: 'Hệ thống và dữ liệu quan trọng nhất cần bảo vệ', example: 'Payment gateway, customer database (500K users), internal admin panel' },
            { id: 'currentPlan', type: 'textarea', label: 'Current Plan (nếu có)', placeholder: 'Existing IRP', required: false, rows: 3, section: 'advanced', hint: 'Dán IRP hiện tại nếu đã có, AI sẽ review và cải thiện' },
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
        name: 'Review Xử lý Dữ liệu',
        icon: '🗃️',
        description: 'Data lifecycle management review',
        category: 'security',
        fields: [
            { id: 'dataTypes', type: 'textarea', label: 'Data Types', placeholder: 'PII, PCI, PHI, Business data...', required: true, rows: 3, section: 'required', hint: 'Liệt kê các loại dữ liệu đang xử lý', example: 'PII (tên, email, SĐT), PCI (thẻ tín dụng), business data (báo cáo doanh thu)' },
            { id: 'sources', type: 'text', label: 'Data Sources', placeholder: 'Where data comes from', required: true, section: 'required', hint: 'Nguồn dữ liệu đầu vào', example: 'Web forms, mobile app, API partners, manual import' },
            { id: 'storage', type: 'text', label: 'Storage Systems', placeholder: 'Databases, cloud, files...', required: true, section: 'required', hint: 'Hệ thống lưu trữ dữ liệu', example: 'PostgreSQL on AWS RDS, S3 buckets, Redis cache' },
            { id: 'regulations', type: 'text', label: 'Regulations', placeholder: 'GDPR, HIPAA, PCI-DSS...', required: false, section: 'advanced', hint: 'Các quy định compliance áp dụng', example: 'GDPR (EU users), PCI-DSS (thanh toán thẻ)' },
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
        name: 'Review Điều khoản Dịch vụ',
        icon: '📃',
        description: 'Terms of Service coverage và fairness',
        category: 'security',
        fields: [
            { id: 'tos', type: 'textarea', label: 'ToS URL/Text', placeholder: 'Link hoặc paste ToS', required: true, rows: 6, section: 'required', hint: 'Dán URL hoặc nội dung Terms of Service cần review', example: 'https://shopx.vn/terms' },
            { id: 'serviceType', type: 'select', label: 'Service Type', options: ['SaaS', 'Marketplace', 'Mobile App', 'Website', 'API'], default: 'SaaS', required: true, section: 'required', hint: 'Loại dịch vụ quyết định các điều khoản cần thiết' },
            { id: 'model', type: 'select', label: 'Business Model', options: ['Subscription', 'Free', 'Freemium', 'One-time', 'Usage-based'], default: 'Subscription', required: true, section: 'required', hint: 'Mô hình kinh doanh ảnh hưởng đến chính sách hoàn tiền, hủy dịch vụ' },
            { id: 'markets', type: 'text', label: 'Target Markets', placeholder: 'US, EU, Global...', required: true, section: 'required', hint: 'Thị trường hoạt động', example: 'Global, chú ý EU và US' },
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
