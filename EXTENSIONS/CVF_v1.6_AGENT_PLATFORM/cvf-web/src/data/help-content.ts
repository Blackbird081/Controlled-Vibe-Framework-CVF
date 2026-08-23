/**
 * Help page bilingual content.
 * Extracted from help/page.tsx to keep the component focused on rendering.
 * Text Encoding Exception: localized Vietnamese user-facing copy is this
 * file's entire purpose and existing convention.
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
    event?: string;
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
            title: '🎯 Hướng dẫn sử dụng Tri thức',
            subtitle: 'Quy trình 5 bước từ thu thập đến bàn giao',
            cta: 'Bắt đầu sử dụng →',
        },
        roleLabels: {
            user: 'End User',
            system: 'CVF System',
        },
        steps: [
            {
                number: 1,
                title: '📖 Tìm hiểu',
                role: 'user',
                content: 'Đọc hướng dẫn và làm quen với quy trình quản lý tri thức của hệ thống.',
                example: {
                    correct: 'Đọc kỹ tài liệu hướng dẫn (Learn)',
                    wrong: 'Bỏ qua bước tìm hiểu và làm bừa',
                },
            },
            {
                number: 2,
                title: '📥 Thu thập',
                role: 'user',
                content: 'Đưa dữ liệu thô vào hệ thống qua form thu thập.',
                categories: ['Văn bản', 'Hình ảnh', 'Mã nguồn', 'Tài liệu'],
            },
            {
                number: 3,
                title: '🛡️ Kiểm duyệt',
                role: 'system',
                content: 'Quá trình đánh giá và phê duyệt dữ liệu (Governance).',
                fields: ['Chờ duyệt (Pending)', 'Chấp nhận (Approved)', 'Từ chối (Rejected)'],
            },
            {
                number: 4,
                title: '📦 Đóng gói',
                role: 'system',
                content: 'Xuất dữ liệu đã kiểm duyệt thành các gói tin chuẩn (Artifacts).',
                steps: [
                    'Kiểm tra định dạng chuẩn',
                    'Đóng gói thành Artifact',
                    'Chuẩn bị dữ liệu để bàn giao',
                ],
            },
            {
                number: 5,
                title: '🚀 Bàn giao',
                role: 'user',
                content: 'Gửi gói dữ liệu sang hệ thống khác hoặc bàn giao cho agent (Handoff).',
                responses: [
                    { icon: '✅', label: 'Thành công', desc: 'Bàn giao hoàn tất' },
                    { icon: '❌', label: 'Thất bại', desc: 'Lỗi trong quá trình bàn giao' },
                ],
            },
        ],
        features: [
            {
                icon: '🤖',
                title: 'Trò chuyện với AI',
                desc: 'Trao đổi trực tiếp với AI ngay trên web; các quy tắc quản trị được áp dụng ở phía sau.',
                event: 'cvf:openAgent',
            },
            {
                icon: '🔐',
                title: 'Governance Toolkit',
                desc: 'GovernanceBar điều khiển Phase/Role/Risk (Auto hoặc Manual). AI biết rules trước khi trả lời.',
            },
            {
                icon: '🧪',
                title: 'Tự kiểm tra an toàn',
                desc: 'Kiểm tra nhanh sáu điểm: nhận biết, giai đoạn, vai trò, rủi ro, kỹ năng và quyền từ chối.',
                event: 'cvf:openAgent',
            },
            {
                icon: '📚',
                title: 'Skill Library',
                desc: 'Thư viện skill front-door đã sync theo GC-044: chỉ surfacing trusted/review subset. Legacy/reject bị quarantine khỏi explorer mặc định.',
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
                title: 'Quy trình nhiều trợ lý',
                desc: 'Bốn vai trò phối hợp: điều phối, lập kế hoạch, thực hiện và rà soát.',
                event: 'cvf:openMultiAgent',
            },
            {
                icon: '📖',
                title: 'Hướng dẫn công cụ quản trị',
                desc: 'Giải thích từng bước về quyền hạn, rủi ro, tự kiểm tra và xuất gói.',
                link: '/help/toolkit',
                linkText: 'Xem hướng dẫn chi tiết',
            },
            {
                icon: '📋',
                title: 'Bằng chứng SOT3',
                desc: 'Xem trạng thái chỉ-đọc của bằng chứng kích hoạt tri thức SOT3 đã lưu trữ. Không có nút thao tác.',
                link: '/governance/sot3-evidence',
                linkText: 'Xem Bằng chứng SOT3',
            },
            {
                icon: '🔄',
                title: 'Lượt chạy MAO bền vững',
                desc: 'Xem chỉ-đọc các lượt chạy MAO bền vững: khám phá, trạng thái tác vụ, số lần timeout, và thời điểm sự kiện gần nhất. Không khởi chạy, hủy, hay thử lại.',
                link: '/governance/mao-runs',
                linkText: 'Xem Lượt chạy MAO',
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
            'Đánh giá kết quả, không can thiệp cách xử lý',
            'Chấp nhận chuyển cấp khi cần',
            'Chọn đúng giai đoạn, vai trò và mức rủi ro',
            'Tự kiểm tra trước khi dùng trong môi trường thật',
        ],
        dontList: [
            'Dẫn dắt kết quả mong muốn',
            'Chỉ định cách AI làm việc',
            'Ép tiếp tục khi bị từ chối',
            'Bỏ qua cảnh báo rủi ro',
            'Bỏ qua quản trị khi công việc quan trọng',
            'Dùng chế độ đơn giản cho công việc rủi ro cao',
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
                title: '📖 Learn',
                role: 'user',
                content: 'Read guides and familiarize yourself with the knowledge management workflow.',
                example: {
                    correct: 'Read the documentation carefully',
                    wrong: 'Skip the guide and guess',
                },
            },
            {
                number: 2,
                title: '📥 Intake',
                role: 'user',
                content: 'Input raw data into the system via the intake form.',
                categories: ['Text', 'Images', 'Code', 'Documents'],
            },
            {
                number: 3,
                title: '🛡️ Govern',
                role: 'system',
                content: 'Evaluate and approve knowledge data (Governance).',
                fields: ['Pending', 'Approved', 'Rejected'],
            },
            {
                number: 4,
                title: '📦 Export',
                role: 'system',
                content: 'Export governed data into standard packets (Artifacts).',
                steps: [
                    'Check standard format',
                    'Pack into Artifact',
                    'Prepare for handoff',
                ],
            },
            {
                number: 5,
                title: '🚀 Handoff',
                role: 'user',
                content: 'Transfer the data packet to another system or agent (Handoff).',
                responses: [
                    { icon: '✅', label: 'Success', desc: 'Handoff completed' },
                    { icon: '❌', label: 'Failure', desc: 'Error during handoff' },
                ],
            },
        ],
        features: [
            {
                icon: '🤖',
                title: 'Agent Chat',
                desc: 'Chat directly with AI (Gemini/OpenAI/Claude) on web, with governance auto-injected.',
                event: 'cvf:openAgent',
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
                event: 'cvf:openAgent',
            },
            {
                icon: '📚',
                title: 'Skill Library',
                desc: 'The front-door skill library is now synced to GC-044: only trusted/review subset surfaces are shown. Legacy/rejected items stay quarantined from the default explorer.',
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
                event: 'cvf:openMultiAgent',
            },
            {
                icon: '📖',
                title: 'Detailed Toolkit Guide',
                desc: 'Authority Matrix, GovernanceBar, Self-UAT, SpecExport — explained step by step.',
                link: '/help/toolkit',
                linkText: 'View detailed guide',
            },
            {
                icon: '📋',
                title: 'SOT3 Evidence',
                desc: 'Read-only status view over durable SOT3 knowledge-activation evidence. No action controls.',
                link: '/governance/sot3-evidence',
                linkText: 'View SOT3 Evidence',
            },
            {
                icon: '🔄',
                title: 'MAO Durable Runs',
                desc: 'Read-only durable MAO run status: discovery, task state, timeout counts, and latest event time. No launch, cancel, or retry.',
                link: '/governance/mao-runs',
                linkText: 'View MAO Runs',
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
