/**
 * Shared documentation metadata used by both /docs and /docs/[slug] pages.
 * Single source of truth — avoids duplication across components.
 */

export type Lang = 'vi' | 'en';

/* ------------------------------------------------------------------ */
/*  Doc item & category types                                          */
/* ------------------------------------------------------------------ */

export interface DocItem {
    icon: string;
    slug: string;
    title: Record<Lang, string>;
    desc: Record<Lang, string>;
    tag?: Record<Lang, string>;
}

export interface DocCategory {
    id: string;
    icon: string;
    label: Record<Lang, string>;
    items: DocItem[];
}

export interface DocMeta {
    title: Record<Lang, string>;
    category: Record<Lang, string>;
    categoryIcon: string;
}

/* ------------------------------------------------------------------ */
/*  Categories & items (used by /docs index)                           */
/* ------------------------------------------------------------------ */

export const DOCS: DocCategory[] = [
    {
        id: 'start',
        icon: '🚀',
        label: { vi: 'Bắt Đầu', en: 'Getting Started' },
        items: [
            {
                icon: '⭐',
                slug: 'getting-started',
                title: { vi: 'Hướng dẫn Bắt đầu', en: 'Getting Started Guide' },
                desc: {
                    vi: 'Hướng dẫn toàn diện cho 3 persona: Solo Dev, Team Lead, Enterprise. Bắt đầu từ đây!',
                    en: 'Comprehensive guide for 3 personas: Solo Dev, Team Lead, Enterprise. Start here!',
                },
                tag: { vi: 'BẮT ĐẦU', en: 'START HERE' },
            },
            {
                icon: '⚡',
                slug: 'cvf-lite',
                title: { vi: 'CVF Lite — Bắt đầu nhanh', en: 'CVF Lite — Quick Start' },
                desc: {
                    vi: 'Phiên bản rút gọn — nắm ý tưởng chính của CVF trong 2 phút.',
                    en: 'Condensed version — grasp the key ideas of CVF in 2 minutes.',
                },
            },
        ],
    },
    {
        id: 'guides',
        icon: '📖',
        label: { vi: 'Hướng Dẫn Theo Vai Trò', en: 'Role-Based Guides' },
        items: [
            {
                icon: '👤',
                slug: 'solo-developer',
                title: { vi: 'Solo Developer', en: 'Solo Developer' },
                desc: {
                    vi: 'Làm việc một mình? Áp dụng CVF nhanh nhất — từ 0 đến productive trong 30 phút.',
                    en: 'Working alone? Apply CVF fastest — from 0 to productive in 30 minutes.',
                },
            },
            {
                icon: '👥',
                slug: 'team-setup',
                title: { vi: 'Team Setup', en: 'Team Setup' },
                desc: {
                    vi: 'Triển khai CVF cho nhóm 3-10 người, phân vai trò, thiết lập governance.',
                    en: 'Deploy CVF for teams of 3-10, assign roles, set up governance.',
                },
            },
            {
                icon: '🏢',
                slug: 'enterprise',
                title: { vi: 'Enterprise', en: 'Enterprise' },
                desc: {
                    vi: 'Tích hợp CVF vào tổ chức lớn: CI/CD, compliance, multi-team coordination.',
                    en: 'Integrate CVF into large organizations: CI/CD, compliance, multi-team coordination.',
                },
            },
        ],
    },
    {
        id: 'tutorials',
        icon: '📝',
        label: { vi: 'Tutorials (Step-by-Step)', en: 'Tutorials (Step-by-Step)' },
        items: [
            {
                icon: '1️⃣',
                slug: 'first-project',
                title: { vi: 'Dự án đầu tiên', en: 'First Project' },
                desc: {
                    vi: 'Tạo dự án CVF đầu tiên từ A-Z: intake → design → build → review → freeze.',
                    en: 'Create your first CVF project A-Z: intake → design → build → review → freeze.',
                },
            },
            {
                icon: '🌐',
                slug: 'web-ui-setup',
                title: { vi: 'Cài đặt Web UI', en: 'Web UI Setup' },
                desc: {
                    vi: 'Cài đặt v1.6 Web UI trên máy local: Node.js, npm install, npm run dev.',
                    en: 'Set up v1.6 Web UI locally: Node.js, npm install, npm run dev.',
                },
            },
            {
                icon: '🤖',
                slug: 'agent-platform',
                title: { vi: 'Agent Platform', en: 'Agent Platform' },
                desc: {
                    vi: 'Sử dụng AI Agent Chat, Multi-Agent, GovernanceBar, và Self-UAT.',
                    en: 'Use AI Agent Chat, Multi-Agent, GovernanceBar, and Self-UAT.',
                },
            },
            {
                icon: '🧩',
                slug: 'custom-skills',
                title: { vi: 'Custom Skills', en: 'Custom Skills' },
                desc: {
                    vi: 'Tạo skill riêng theo chuẩn CVF: metadata, contract, validation, publish.',
                    en: 'Create custom skills following CVF standards: metadata, contract, validation, publish.',
                },
            },

        ],
    },
    {
        id: 'concepts',
        icon: '💡',
        label: { vi: 'Khái Niệm Chuyên Sâu', en: 'Core Concepts' },
        items: [
            {
                icon: '🎯',
                slug: 'core-philosophy',
                title: { vi: 'Triết lý CVF', en: 'Core Philosophy' },
                desc: {
                    vi: '"Không nhanh hơn, mà đúng hơn" — hiểu tại sao CVF tồn tại và khác biệt gì.',
                    en: '"Not faster, but smarter" — why CVF exists and what makes it different.',
                },
            },
            {
                icon: '🔄',
                slug: '5-phase-process',
                title: { vi: 'Quy trình 5 Phase', en: '5-Phase Process' },
                desc: {
                    vi: 'Intake → Design → Build → Review → Freeze — mỗi phase có role, gate, và rules riêng.',
                    en: 'Intake → Design → Build → Review → Freeze — each phase has its own roles, gates, and rules.',
                },
            },
            {
                icon: '🏛️',
                slug: 'governance-model',
                title: { vi: 'Mô hình Governance', en: 'Governance Model' },
                desc: {
                    vi: '3 modes (Minimal/Standard/Full), Authority Matrix, Phase Gates, Escalation.',
                    en: '3 modes (Minimal/Standard/Full), Authority Matrix, Phase Gates, Escalation.',
                },
            },
            {
                icon: '📚',
                slug: 'skill-system',
                title: { vi: 'Hệ thống Skill', en: 'Skill System' },
                desc: {
                    vi: '124 skills, 12 domains — cách tìm, dùng, và tạo skill mới.',
                    en: '124 skills, 12 domains — how to find, use, and create new skills.',
                },
            },
            {
                icon: '⚠️',
                slug: 'risk-model',
                title: { vi: 'Mô hình Rủi ro', en: 'Risk Model' },
                desc: {
                    vi: 'R0-R3 risk levels, escalation rules, và cách CVF tự bảo vệ bạn.',
                    en: 'R0-R3 risk levels, escalation rules, and how CVF protects you.',
                },
            },
            {
                icon: '📈',
                slug: 'version-evolution',
                title: { vi: 'Lịch sử phiên bản', en: 'Version Evolution' },
                desc: {
                    vi: 'Từ v1.0 (core) → v1.6 (agent platform): mỗi version thêm gì.',
                    en: 'From v1.0 (core) → v1.6 (agent platform): what each version added.',
                },
            },
        ],
    },
    {
        id: 'cheatsheets',
        icon: '🔧',
        label: { vi: 'Tham Khảo Nhanh', en: 'Quick Reference' },
        items: [
            {
                icon: '🗺️',
                slug: 'version-picker',
                title: { vi: 'Chọn Version', en: 'Version Picker' },
                desc: {
                    vi: 'Decision tree: bạn nên dùng version nào? So sánh tính năng.',
                    en: 'Decision tree: which version should you use? Feature comparison.',
                },
            },
            {
                icon: '🔧',
                slug: 'troubleshooting',
                title: { vi: 'Troubleshooting', en: 'Troubleshooting' },
                desc: {
                    vi: 'Lỗi thường gặp + cách khắc phục. FAQ cho người mới.',
                    en: 'Common errors + fixes. FAQ for beginners.',
                },
            },
        ],
    },
    {
        id: 'case-studies',
        icon: '📊',
        label: { vi: 'Case Studies', en: 'Case Studies' },
        items: [
            {
                icon: '🏦',
                slug: 'case-fintech',
                title: { vi: 'Fintech: Hệ thống tín dụng', en: 'Fintech: Credit Approval' },
                desc: {
                    vi: 'CVF áp dụng cho hệ thống phê duyệt tín dụng — risk management thực tế.',
                    en: 'CVF applied to credit approval system — real-world risk management.',
                },
            },
            {
                icon: '🏥',
                slug: 'case-healthcare',
                title: { vi: 'Healthcare: Quản lý bệnh nhân', en: 'Healthcare: Patient Management' },
                desc: {
                    vi: 'CVF trong lĩnh vực y tế — compliance, data protection, governance.',
                    en: 'CVF in healthcare — compliance, data protection, governance.',
                },
            },
            {
                icon: '🛒',
                slug: 'case-ecommerce',
                title: { vi: 'E-commerce: MVP 2 tuần', en: 'E-commerce: 2-Week MVP' },
                desc: {
                    vi: 'Xây dựng MVP e-commerce với CVF trong 2 tuần — timeline thực tế.',
                    en: 'Build an e-commerce MVP with CVF in 2 weeks — realistic timeline.',
                },
            },
        ],
    },
    {
        id: 'agent-skills',
        icon: '🤖',
        label: { vi: 'Kỹ năng Agent', en: 'Agent Skills' },
        items: [
            {
                icon: '🗂️',
                slug: 'agent-skills-catalog',
                title: { vi: 'Danh mục 34 Kỹ năng', en: '34 Skills Catalog' },
                desc: {
                    vi: 'Tổng hợp 34 kỹ năng theo 7 lĩnh vực — Foundation, Agentic, Workflow, Intelligence, Development, DevOps, Business Ops. Bản đồ quan hệ kỹ năng.',
                    en: 'All 34 skills organized by 7 domains — Foundation, Agentic, Workflow, Intelligence, Development, DevOps, Business Ops. Skill relationship map.',
                },
                tag: { vi: 'TỔNG HỢP', en: 'CATALOG' },
            },
            {
                icon: '💼',
                slug: 'operator-workflows',
                title: { vi: 'Workflow cho Operator', en: 'Operator Workflows' },
                desc: {
                    vi: '10 workflow kinh doanh có governance — Sales Pipeline, Prospecting, Ad Spend, Content, VoC, Product, Ops, Calendar, Finance, Competitive Intel.',
                    en: '10 governed business workflows — Sales Pipeline, Prospecting, Ad Spend, Content, VoC, Product, Ops, Calendar, Finance, Competitive Intel.',
                },
                tag: { vi: 'MỚI', en: 'NEW' },
            },
            {
                icon: '🤖',
                slug: 'agentic-patterns',
                title: { vi: 'Mẫu từ Claude Quickstarts', en: 'Patterns from Claude Quickstarts' },
                desc: {
                    vi: '6 mẫu agentic gốc từ Anthropic — RAG, Data Viz, Doc Parser, Agentic Loop, Browser Automation, MCP — ánh xạ vào CVF governance.',
                    en: '6 agentic patterns from Anthropic — mapped to CVF governance.',
                },
            },
        ],
    },
    {
        id: 'references',
        icon: '📘',
        label: { vi: 'Triển Khai Tham Khảo', en: 'Reference Implementations' },
        items: [
            {
                icon: '🔧',
                slug: 'toolkit-reference',
                title: { vi: 'CVF Toolkit Reference', en: 'CVF Toolkit Reference' },
                desc: {
                    vi: 'Governance engine mẫu bằng TypeScript — risk classifier, phase controller, audit logger. 111 tests, 98% coverage.',
                    en: 'Sample governance engine in TypeScript — risk classifier, phase controller, audit logger. 111 tests, 98% coverage.',
                },
                tag: { vi: 'THAM KHẢO', en: 'REFERENCE' },
            },
            {
                icon: '🚀',
                slug: 'starter-template-reference',
                title: { vi: 'Starter Template Reference', en: 'Starter Template Reference' },
                desc: {
                    vi: 'Template server Express.js + TypeScript với AI chat, streaming, đa nhà cung cấp. Mẫu cấu trúc ứng dụng.',
                    en: 'Express.js + TypeScript server template with AI chat, streaming, multi-provider. Application structure example.',
                },
                tag: { vi: 'THAM KHẢO', en: 'REFERENCE' },
            },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  Per-slug metadata (used by /docs/[slug] detail page)               */
/*  Auto-derived from DOCS to stay in sync                             */
/* ------------------------------------------------------------------ */

export const DOC_META: Record<string, DocMeta> = Object.fromEntries(
    DOCS.flatMap(cat =>
        cat.items.map(item => [
            item.slug,
            {
                title: item.title,
                category: cat.label,
                categoryIcon: cat.icon,
            },
        ])
    )
);
