/**
 * Help page bilingual content.
 * Extracted from help/page.tsx to keep the component focused on rendering.
 */

export type Lang = 'vi' | 'en';

export interface HelpStep {
    number: number;
    title: string;
    role: 'user' | 'system';
    content: string;
    example?: { correct: string; wrong: string };
    categories?: string[];
    fields?: string[];
    steps?: string[];
    responses?: Array<{ icon: string; label: string; desc: string }>;
}

export interface HelpFeature {
    icon: string;
    title: string;
    desc: string;
    link?: string;
    linkText?: string;
}

export interface HelpContent {
    header: { title: string; subtitle: string; cta: string };
    roleLabels: { user: string; system: string };
    steps: HelpStep[];
    features: HelpFeature[];
    tips: string[];
    doList: string[];
    dontList: string[];
    quote: { text: string; author: string };
}

export const HELP_CONTENT: Record<Lang, HelpContent> = {
    vi: {
        header: {
            title: '🎯 Hướng dẫn sử dụng CVF',
            subtitle: 'Quy trình 5 bước + các tính năng nâng cao để sử dụng CVF hiệu quả',
            cta: 'Bắt đầu sử dụng CVF →',
        },
        roleLabels: {
            user: 'End User',
            system: 'CVF System',
        },
        steps: [
            {
                number: 1,
                title: '📝 Xác định Mục tiêu',
                role: 'user',
                content: 'Bạn mô tả bạn cần gì, không phải AI làm gì.',
                example: {
                    correct: 'Tôi cần phân tích 3 phương án kinh doanh để chọn 1',
                    wrong: 'Hãy suy nghĩ như chuyên gia và dùng SWOT',
                },
            },
            {
                number: 2,
                title: '📋 Chọn Template',
                role: 'user',
                content: 'Chọn template phù hợp từ thư viện 50 templates trong 8 danh mục:',
                categories: ['📊 Business', '💻 Technical', '📝 Content', '🔬 Research', '📣 Marketing', '🎨 Product', '🔐 Security', '💻 Development'],
            },
            {
                number: 3,
                title: '📝 Điền Form',
                role: 'user',
                content: 'Điền thông tin vào form theo template. Không cần viết prompt!',
                fields: ['Mục tiêu', 'Bối cảnh', 'Ràng buộc', 'Kết quả mong đợi'],
            },
            {
                number: 4,
                title: '⚙️ CVF Xử lý & Xuất Spec',
                role: 'system',
                content: 'CVF tự động xử lý và cho phép bạn chọn 1 trong 3 chế độ xuất:',
                steps: [
                    '📝 Simple — Prompt nhanh, không có governance',
                    '⚠️ With Rules — Thêm stop conditions & guardrails',
                    '🚦 CVF Full Mode — Quy trình 4-Phase đầy đủ + governance metadata',
                    '→ Copy & paste vào AI bất kỳ HOẶC nhấn "🤖 Send to Agent" để gửi trực tiếp',
                ],
            },
            {
                number: 5,
                title: '✅ Đánh giá Kết quả',
                role: 'user',
                content: 'Bạn đánh giá output theo tiêu chí đã đặt:',
                responses: [
                    { icon: '✅', label: 'ACCEPT', desc: 'Kết quả dùng được' },
                    { icon: '🔄', label: 'REVISE', desc: 'Cần chỉnh sửa nhỏ' },
                    { icon: '❌', label: 'REJECT', desc: 'Không đạt, làm lại' },
                ],
            },
        ],
        features: [
            {
                icon: '🤖',
                title: 'Agent Chat',
                desc: 'Chat trực tiếp với AI (Gemini/OpenAI/Claude) ngay trên web, có governance tự động inject.',
                link: '/?open=agent',
                linkText: 'Mở Agent Chat',
            },
            {
                icon: '🔐',
                title: 'Governance Toolkit',
                desc: 'GovernanceBar điều khiển Phase/Role/Risk (Auto hoặc Manual). AI biết rules trước khi trả lời.',
            },
            {
                icon: '🧪',
                title: 'Self-UAT (1-click)',
                desc: 'Kiểm tra AI compliance bằng 1 nút bấm. 6 tiêu chí: Awareness, Phase, Role, Risk, Skill, Refusal.',
            },
            {
                icon: '📚',
                title: 'Skill Library (124 skills)',
                desc: '12 domains × 124 skills. Xem skill → nhấn 📝 Dùng Template để chuyển sang template tương ứng.',
                link: '/skills',
                linkText: 'Xem Skill Library',
            },
            {
                icon: '🔗',
                title: 'Skills ↔ Templates',
                desc: 'Liên kết hai chiều: Template → 📚 Xem Skill | Skill → 📝 Dùng Template.',
            },
            {
                icon: '🎯',
                title: 'Multi-Agent Workflow',
                desc: '4 agents: Orchestrator → Architect → Builder → Reviewer. Phối hợp tự động.',
            },
            {
                icon: '📖',
                title: 'Hướng dẫn chi tiết Toolkit',
                desc: 'Authority Matrix, GovernanceBar, Self-UAT, SpecExport — giải thích từng bước.',
                link: '/help/toolkit',
                linkText: 'Xem hướng dẫn chi tiết',
            },
        ],
        tips: [
            'Mục tiêu càng rõ → Kết quả càng tốt',
            'Không can thiệp vào cách AI làm việc',
            'Chỉ đánh giá output cuối cùng',
            'Nếu CVF từ chối → Đọc lý do và điều chỉnh',
            'Bật Governance Toolkit để AI tuân thủ rules tự động',
            'Dùng CVF Full Mode cho các dự án quan trọng',
        ],
        doList: [
            'Mô tả rõ mục tiêu cần đạt',
            'Nêu ràng buộc và giới hạn',
            'Đánh giá output, không process',
            'Chấp nhận escalation khi cần',
            'Dùng GovernanceBar để chọn Phase/Role/Risk',
            'Chạy Self-UAT trước khi dùng cho production',
        ],
        dontList: [
            'Dẫn dắt kết quả mong muốn',
            'Chỉ định cách AI làm việc',
            'Ép tiếp tục khi bị từ chối',
            'Bỏ qua cảnh báo rủi ro',
            'Bỏ qua governance khi task quan trọng',
            'Dùng Simple mode cho task có risk cao',
        ],
        quote: {
            text: '"CVF không giúp bạn tránh quyết định khó.\nCVF giúp bạn tránh những quyết định tệ."',
            author: '— CVF Philosophy',
        },
    },
    en: {
        header: {
            title: '🎯 CVF User Guide',
            subtitle: 'A 5-step workflow + advanced features to use CVF effectively',
            cta: 'Start using CVF →',
        },
        roleLabels: {
            user: 'End User',
            system: 'CVF System',
        },
        steps: [
            {
                number: 1,
                title: '📝 Define the Goal',
                role: 'user',
                content: 'Describe what you need, not what the AI should do.',
                example: {
                    correct: 'I need to compare 3 business options and choose one',
                    wrong: 'Think like an expert and use SWOT',
                },
            },
            {
                number: 2,
                title: '📋 Choose a Template',
                role: 'user',
                content: 'Pick a suitable template from 50 templates in 8 categories:',
                categories: ['📊 Business', '💻 Technical', '📝 Content', '🔬 Research', '📣 Marketing', '🎨 Product', '🔐 Security', '💻 Development'],
            },
            {
                number: 3,
                title: '📝 Fill the Form',
                role: 'user',
                content: 'Fill in the template form. No prompt writing needed!',
                fields: ['Goal', 'Context', 'Constraints', 'Expected outcome'],
            },
            {
                number: 4,
                title: '⚙️ CVF Processing & Spec Export',
                role: 'system',
                content: 'CVF processes the input and lets you choose 1 of 3 export modes:',
                steps: [
                    '📝 Simple — Quick prompt, no governance',
                    '⚠️ With Rules — Add stop conditions & guardrails',
                    '🚦 CVF Full Mode — Full 4-Phase protocol + governance metadata',
                    '→ Copy & paste into any AI OR click "🤖 Send to Agent" to send directly',
                ],
            },
            {
                number: 5,
                title: '✅ Evaluate Results',
                role: 'user',
                content: 'Evaluate the output against your criteria:',
                responses: [
                    { icon: '✅', label: 'ACCEPT', desc: 'Usable result' },
                    { icon: '🔄', label: 'REVISE', desc: 'Minor changes needed' },
                    { icon: '❌', label: 'REJECT', desc: 'Not acceptable, redo' },
                ],
            },
        ],
        features: [
            {
                icon: '🤖',
                title: 'Agent Chat',
                desc: 'Chat directly with AI (Gemini/OpenAI/Claude) on web, with governance auto-injected.',
                link: '/?open=agent',
                linkText: 'Open Agent Chat',
            },
            {
                icon: '🔐',
                title: 'Governance Toolkit',
                desc: 'GovernanceBar controls Phase/Role/Risk (Auto or Manual). AI knows the rules before responding.',
            },
            {
                icon: '🧪',
                title: 'Self-UAT (1-click)',
                desc: 'Check AI compliance with one button. 6 criteria: Awareness, Phase, Role, Risk, Skill, Refusal.',
            },
            {
                icon: '📚',
                title: 'Skill Library (124 skills)',
                desc: '12 domains × 124 skills. View a skill → click 📝 Use Template to jump to the matching template.',
                link: '/skills',
                linkText: 'View Skill Library',
            },
            {
                icon: '🔗',
                title: 'Skills ↔ Templates',
                desc: 'Bi-directional linking: Template → 📚 View Skill | Skill → 📝 Use Template.',
            },
            {
                icon: '🎯',
                title: 'Multi-Agent Workflow',
                desc: '4 agents: Orchestrator → Architect → Builder → Reviewer. Automatic coordination.',
            },
            {
                icon: '📖',
                title: 'Detailed Toolkit Guide',
                desc: 'Authority Matrix, GovernanceBar, Self-UAT, SpecExport — explained step by step.',
                link: '/help/toolkit',
                linkText: 'View detailed guide',
            },
        ],
        tips: [
            'The clearer the goal → the better the result',
            'Do not interfere with how the AI works',
            'Evaluate the final output only',
            'If CVF refuses → Read the reason and adjust',
            'Enable Governance Toolkit for auto rule compliance',
            'Use CVF Full Mode for important projects',
        ],
        doList: [
            'Describe the desired outcome clearly',
            'State constraints and limits',
            'Evaluate output, not process',
            'Accept escalation when needed',
            'Use GovernanceBar to select Phase/Role/Risk',
            'Run Self-UAT before production use',
        ],
        dontList: [
            'Lead the output to a preferred answer',
            'Tell the AI how to do the work',
            'Force continuation after refusal',
            'Ignore risk warnings',
            'Skip governance for important tasks',
            'Use Simple mode for high-risk tasks',
        ],
        quote: {
            text: '"CVF doesn\'t help you avoid hard decisions.\nCVF helps you avoid bad decisions."',
            author: '— CVF Philosophy',
        },
    },
};
