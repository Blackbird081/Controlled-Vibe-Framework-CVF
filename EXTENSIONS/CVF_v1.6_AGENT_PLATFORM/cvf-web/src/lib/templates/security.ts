import { Template } from '@/types';

export const securityTemplates: Template[] = [
    {
        id: 'security_assessment_wizard',
        name: '🔐 Đánh giá Bảo mật',
        icon: '🔐',
        description: 'Multi-step wizard tạo Security Assessment Report với governed packet và live path để đối soát',
        category: 'security',
        difficulty: 'advanced',
        fields: [],
        intentPattern: '',
        outputExpected: ['Security Assessment', 'Threat Model', 'Risk Matrix', 'Remediation Plan'],
    },
    {
        id: 'api_security',
        name: 'Checklist Bảo mật API',
        icon: '🔒',
        description: 'Review rủi ro bảo vệ cho các luồng dữ liệu và thao tác quan trọng mà không bắt non-coder phải liệt kê endpoint hay chi tiết kỹ thuật',
        category: 'security',
        difficulty: 'advanced',
        fields: [
            { id: 'criticalFlows', type: 'textarea', label: 'Người dùng hoặc hệ thống đang làm những việc nhạy cảm nào?', placeholder: 'Mô tả các luồng quan trọng: đăng nhập, xem dữ liệu, sửa dữ liệu, thanh toán, đồng bộ...', required: true, rows: 4, section: 'required', hint: 'Liệt kê theo ngôn ngữ nghiệp vụ hoặc luồng sử dụng, không cần endpoint.', example: 'Khách đăng nhập, xem hồ sơ cá nhân, cập nhật địa chỉ, thanh toán đơn hàng, admin export danh sách khách hàng.' },
            { id: 'sensitiveData', type: 'textarea', label: 'Thông tin nhạy cảm nào đi qua các luồng này?', placeholder: 'PII, thanh toán, tài liệu nội bộ, dữ liệu khách hàng...', required: true, rows: 3, section: 'required', hint: 'Mô tả loại thông tin cần bảo vệ.', example: 'Email, số điện thoại, địa chỉ giao hàng, lịch sử đơn, dữ liệu thanh toán, token truy cập.' },
            { id: 'currentProtections', type: 'textarea', label: 'Hiện tại đang bảo vệ bằng cách nào?', placeholder: 'Đăng nhập, phân quyền, xác nhận OTP, audit log, giới hạn thao tác...', required: true, rows: 3, section: 'required', hint: 'Chỉ cần mô tả theo mức bạn biết. Không cần tên framework bảo mật.', example: 'Người dùng đăng nhập bằng email + mật khẩu, admin có phân quyền, có OTP khi đổi mật khẩu, có log export.' },
            { id: 'worry', type: 'textarea', label: 'Bạn đang lo nhất điều gì?', placeholder: 'Truy cập sai quyền, lộ dữ liệu, spam thao tác, giả mạo request...', required: false, rows: 2, section: 'advanced', hint: 'Nêu mối lo chính để AI ưu tiên review.', example: 'Sợ user có thể xem nhầm dữ liệu của người khác và sợ admin export quá dễ.' },
        ],
        intentPattern: `INTENT:
Tôi muốn review độ an toàn của các luồng hệ thống quan trọng này.

LUỒNG QUAN TRỌNG:
[criticalFlows]

DỮ LIỆU NHẠY CẢM:
[sensitiveData]

CÁCH BẢO VỆ HIỆN TẠI:
[currentProtections]

MỐI LO ƯU TIÊN:
[worry]

OUTPUT FORMAT:
- Main Exposure Risks → Current Safeguards → Priority Hardening Actions → Verification Checklist

SUCCESS CRITERIA:
- Xác định rủi ro theo luồng nghiệp vụ
- Nói rõ ai có thể làm sai điều gì và ảnh hưởng ra sao
- Đưa ra hành động bảo vệ theo thứ tự ưu tiên
- Không đòi người dùng phải biết endpoint taxonomy`,
        outputExpected: ['Luồng rủi ro chính', 'Khoảng hở bảo vệ', 'Ưu tiên khắc phục', 'Checklist xác nhận sau cải thiện'],
        outputTemplate: `# Sensitive Flow Security Review

## 1. What Must Be Protected
- Critical flow
- Sensitive data involved

## 2. Current Safeguards
- Existing controls
- What already helps

## 3. Main Exposure Risks
- Risk
- Why it matters
- Likely impact

## 4. Priority Hardening Actions
- Immediate action
- Next action
- Longer-term control

## 5. Verification Checklist
- Checks to confirm the flow is safer`,
    },
    {
        id: 'gdpr_compliance',
        name: 'Kiểm tra Tuân thủ GDPR',
        icon: '🇪🇺',
        description: 'EU data protection compliance check',
        category: 'security',
        difficulty: 'advanced',
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

OUTPUT FORMAT:
- Compliance Score → Gap Analysis → Privacy Policy Review → Remediation Plan

SUCCESS CRITERIA:
- Consent mechanism check
- User rights implementation
- Privacy policy review
- Cookie compliance`,
        outputExpected: ['Compliance Score', 'Gap Analysis', 'Privacy Policy Review', 'Remediation Plan'],
        outputTemplate: `## GDPR Compliance Output

**Compliance Score:**

## Gap Analysis

## Privacy Policy Review

## Remediation Plan`,
    },
    {
        id: 'privacy_policy_audit',
        name: 'Kiểm tra Chính sách Bảo mật',
        icon: '📜',
        description: 'Privacy policy review và cải thiện',
        category: 'security',
        difficulty: 'medium',
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

OUTPUT FORMAT:
- Compliance Score → Missing Elements → Readability Score → Improvement Suggestions

SUCCESS CRITERIA:
- Required elements check
- Readability assessment
- Regional compliance
- Third-party coverage`,
        outputExpected: ['Compliance Score', 'Missing Elements', 'Readability Score', 'Improvement Suggestions'],
        outputTemplate: `## Privacy Policy Audit Output

**Compliance Score:**
**Readability Score:**

## Missing Elements

## Improvement Suggestions`,
    },
    {
        id: 'incident_response',
        name: 'Kế hoạch Ứng phó Sự cố',
        icon: '🚨',
        description: 'Security incident response planning',
        category: 'security',
        difficulty: 'advanced',
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

OUTPUT FORMAT:
- IRP Assessment → Team Roles → Response Playbooks → Communication Templates

SUCCESS CRITERIA:
- Team roles definition
- Severity levels
- Response procedures
- Communication templates`,
        outputExpected: ['IRP Assessment', 'Team Roles', 'Response Playbooks', 'Communication Templates'],
        outputTemplate: `## Incident Response Plan

## 1. IRP Assessment

## 2. Team Roles
| Role | Responsibility | Contact |
| --- | --- | --- |

## 3. Response Playbooks

## 4. Communication Templates`,
    },
    {
        id: 'data_handling',
        name: 'Review Xử lý Dữ liệu',
        icon: '🗃️',
        description: 'Review vòng đời dữ liệu theo cách dễ hiểu để non-coder vẫn mô tả được dữ liệu đi đâu, ai dùng, giữ bao lâu và chỗ nào đang rủi ro',
        category: 'security',
        difficulty: 'advanced',
        fields: [
            { id: 'dataTypes', type: 'textarea', label: 'Bạn đang xử lý những loại thông tin nào?', placeholder: 'Thông tin khách hàng, thanh toán, tài liệu nội bộ, dữ liệu vận hành...', required: true, rows: 3, section: 'required', hint: 'Chỉ cần gọi tên loại thông tin theo ngữ cảnh kinh doanh.', example: 'Tên, email, số điện thoại, địa chỉ giao hàng, doanh thu theo cửa hàng, ghi chú hỗ trợ khách hàng.' },
            { id: 'sources', type: 'textarea', label: 'Thông tin này đi vào hệ thống từ đâu?', placeholder: 'Form, nhân viên nhập tay, file import, đối tác gửi sang...', required: true, rows: 2, section: 'required', hint: 'Mô tả các điểm vào chính của dữ liệu.', example: 'Form website, ứng dụng di động, nhân viên CS nhập tay, file CSV từ đối tác.' },
            { id: 'storageFlow', type: 'textarea', label: 'Sau khi vào rồi thì dữ liệu đi đâu và ai dùng?', placeholder: 'Lưu ở đâu, chia cho ai, xuất ra đâu, giữ bao lâu nếu bạn biết', required: true, rows: 3, section: 'required', hint: 'Bạn không cần nêu tên database hay hạ tầng. Chỉ cần mô tả luồng lưu, chia sẻ, xuất, xóa.', example: 'Dữ liệu lead vào CRM, sales xem được, báo cáo tuần được export cho quản lý, dữ liệu cũ giữ 12 tháng rồi archive.' },
            { id: 'regulations', type: 'text', label: 'Có rule pháp lý hoặc cam kết nào phải tuân theo không?', placeholder: 'GDPR, quy định nội bộ, cam kết với khách hàng...', required: false, section: 'advanced', hint: 'Nếu có yêu cầu lưu/xóa/chia sẻ dữ liệu đặc biệt, ghi ở đây.', example: 'GDPR cho khách EU, xóa dữ liệu khi khách yêu cầu, không chia sẻ lead ra ngoài team sales.' },
        ],
        intentPattern: `INTENT:
Tôi muốn review cách hệ thống thu thập, lưu, chia sẻ và xóa dữ liệu.

DATA TYPES: [dataTypes]
DATA SOURCES: [sources]
STORAGE / SHARING FLOW: [storageFlow]
RULES / REGULATIONS: [regulations]

OUTPUT FORMAT:
- Data Lifecycle Map → Main Gaps → Recommended Governance Rules → Verification Checklist

SUCCESS CRITERIA:
- Vẽ rõ vòng đời dữ liệu theo ngôn ngữ công việc
- Chỉ ra chỗ nào đang mơ hồ hoặc dễ lộ
- Nêu rule lưu / xóa / chia sẻ cần được siết
- Không yêu cầu người dùng biết hạ tầng chi tiết`,
        outputExpected: ['Bản đồ vòng đời dữ liệu', 'Điểm mơ hồ hoặc rủi ro', 'Rule lưu / chia sẻ / xóa cần có', 'Checklist quản trị dữ liệu'],
        outputTemplate: `# Data Handling Review

## 1. Data Types In Scope
- What information exists
- Why it matters

## 2. How Data Moves
- Where it enters
- Who uses it
- Where it goes next

## 3. Main Gaps
- Missing rule or unclear ownership
- Why it is risky

## 4. Recommended Governance Rules
- Collection rule
- Access/share rule
- Retention/delete rule

## 5. Verification Checklist
- Checks to confirm the lifecycle is controlled`,
    },
    {
        id: 'tos_review',
        name: 'Review Điều khoản Dịch vụ',
        icon: '📃',
        description: 'Terms of Service coverage và fairness',
        category: 'security',
        difficulty: 'medium',
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

OUTPUT FORMAT:
- ToS Score → Coverage Analysis → Fairness Review → Improvement Suggestions

SUCCESS CRITERIA:
- Essential sections coverage
- User-friendliness
- Fairness assessment
- Regional compliance`,
        outputExpected: ['ToS Score', 'Coverage Analysis', 'Fairness Review', 'Improvement Suggestions'],
        outputTemplate: `## Terms of Service Review Output

**ToS Score:**

## Coverage Analysis

## Fairness Review

## Improvement Suggestions`,
    },
];
