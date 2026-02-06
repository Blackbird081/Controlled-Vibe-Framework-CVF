'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';

// Skill data from library
const skillDomains = [
    {
        id: 'web_development',
        name: 'Web Development',
        icon: '🌐',
        description: 'Tạo website và ứng dụng web',
        skills: [
            {
                id: 'landing_page',
                name: 'Landing Page',
                icon: '📄',
                difficulty: 'Easy',
                description: 'Trang giới thiệu/bán hàng, thu leads',
                whenToUse: ['Giới thiệu sản phẩm', 'Thu leads', 'Bán hàng online', 'Ra mắt sản phẩm'],
                formFields: [
                    { name: 'Sản phẩm', required: true, example: 'Khóa học Excel' },
                    { name: 'Mục tiêu', required: true, example: 'Đăng ký học thử' },
                    { name: 'Đối tượng', required: true, example: 'Nhân viên văn phòng 25-35' },
                    { name: 'Brand', required: false, example: 'Chưa có, tone friendly' },
                ],
                checklistItems: [
                    'Headline rõ ràng, dưới 12 từ',
                    'CTA xuất hiện ít nhất 2 lần',
                    'Phù hợp đối tượng mục tiêu',
                    'Responsive mobile',
                    'Có social proof'
                ],
                commonFailures: [
                    'Headline quá dài/mơ hồ',
                    'Thiếu social proof',
                    'CTA không nổi bật',
                    'Quên mobile view'
                ]
            },
            {
                id: 'saas_app',
                name: 'SaaS App',
                icon: '🚀',
                difficulty: 'Medium',
                description: 'Ứng dụng web có đăng nhập, quản lý user',
                whenToUse: ['App có user accounts', 'Subscription/payment', 'Nhiều tính năng'],
                formFields: [
                    { name: 'Tên app', required: true, example: 'TaskFlow - quản lý công việc' },
                    { name: 'Core features', required: true, example: 'Task board, Time tracking' },
                    { name: 'User roles', required: true, example: 'Admin, Member' },
                    { name: 'Đối tượng', required: true, example: 'Startup team 5-20 người' },
                ],
                checklistItems: [
                    'Auth flow hoàn chỉnh',
                    'Dashboard overview rõ ràng',
                    '3 core features đầy đủ',
                    'User roles phân quyền đúng',
                    'Settings/Profile có đủ'
                ],
                commonFailures: [
                    'Feature creep (quá nhiều)',
                    'Auth quá phức tạp',
                    'Không phân quyền',
                    'Quên empty states'
                ]
            },
            {
                id: 'dashboard',
                name: 'Dashboard',
                icon: '📊',
                difficulty: 'Medium',
                description: 'Bảng điều khiển, admin panel, analytics',
                whenToUse: ['Quản lý dữ liệu', 'Admin panel', 'Analytics/reporting'],
                formFields: [
                    { name: 'Mục đích', required: true, example: 'Theo dõi sales' },
                    { name: 'Data chính', required: true, example: 'Revenue, orders, customers' },
                    { name: 'KPIs', required: true, example: 'Total revenue, Conversion rate' },
                    { name: 'Người dùng', required: true, example: 'CEO, Sales manager' },
                ],
                checklistItems: [
                    'KPI cards hiển thị metrics quan trọng',
                    'Charts phù hợp loại data',
                    'Tables có filter/sort',
                    'Date range picker hoạt động',
                    'Loading states có'
                ],
                commonFailures: [
                    'Quá nhiều data, không focus',
                    'Chart sai loại',
                    'Không có loading states',
                    'Mobile bị vỡ'
                ]
            },
            {
                id: 'blog_docs',
                name: 'Blog / Docs',
                icon: '📝',
                difficulty: 'Easy',
                description: 'Blog, tài liệu, wiki, knowledge base',
                whenToUse: ['Blog cá nhân/công ty', 'Documentation', 'Knowledge base'],
                formFields: [
                    { name: 'Loại', required: true, example: 'Blog về AI' },
                    { name: 'Nội dung', required: true, example: 'Tutorials, news' },
                    { name: 'Tần suất', required: false, example: '2 bài/tuần' },
                    { name: 'Categories', required: false, example: 'Tutorials, News' },
                ],
                checklistItems: [
                    'Typography dễ đọc (18px+)',
                    'TOC hoạt động',
                    'Search tìm được content',
                    'Mobile responsive',
                    'SEO meta tags đầy đủ'
                ],
                commonFailures: [
                    'Typography không tối ưu',
                    'Không có TOC cho bài dài',
                    'Search không hoạt động',
                    'Code blocks xấu'
                ]
            },
            {
                id: 'portfolio',
                name: 'Portfolio',
                icon: '🎨',
                difficulty: 'Easy',
                description: 'Portfolio cá nhân, agency, freelancer',
                whenToUse: ['Portfolio cá nhân', 'Agency showcase', 'Personal brand'],
                formFields: [
                    { name: 'Nghề nghiệp', required: true, example: 'UX Designer 5 năm' },
                    { name: 'Style', required: true, example: 'Minimal - clean' },
                    { name: 'Projects', required: true, example: '5 case studies' },
                    { name: 'Services', required: false, example: 'UI Design, UX Research' },
                ],
                checklistItems: [
                    'Hero gây ấn tượng (3 giây đầu)',
                    'Projects có case study chi tiết',
                    'Style phù hợp nghề',
                    'Contact rõ ràng',
                    'Animations smooth'
                ],
                commonFailures: [
                    'Hero nhạt nhẽo',
                    'Projects không có story',
                    'Style không phù hợp',
                    'Animation quá nhiều'
                ]
            }
        ]
    },
    {
        id: 'business_analysis',
        name: 'Business Analysis',
        icon: '💼',
        description: 'Phân tích và ra quyết định kinh doanh',
        skills: [
            {
                id: 'strategy_analysis',
                name: 'Strategy Analysis',
                icon: '♟️',
                difficulty: 'Medium',
                description: 'Phân tích chiến lược, so sánh phương án',
                whenToUse: ['So sánh các phương án', 'Đánh giá chiến lược mới', 'Phân tích SWOT'],
                formFields: [
                    { name: 'Tình huống', required: true, example: 'Mở rộng sang thị trường mới hay focus hiện tại' },
                    { name: 'Các phương án', required: true, example: 'A: Mở rộng B2C, B: Focus B2B' },
                    { name: 'Mục tiêu', required: true, example: 'Tăng revenue 30% trong 2 năm' },
                    { name: 'Ràng buộc', required: true, example: 'Budget $500K, team 10 người' },
                ],
                checklistItems: [
                    'Hiểu đúng tình huống và context',
                    'Phân tích đầy đủ các phương án',
                    'Recommendation có logic rõ ràng',
                    'Cân nhắc được ràng buộc thực tế',
                    'Có next steps actionable'
                ],
                commonFailures: [
                    'Output quá generic',
                    'Bias sang 1 option từ đầu',
                    'Thiếu actionable steps',
                    'Bỏ qua risks'
                ]
            },
            {
                id: 'risk_assessment',
                name: 'Risk Assessment',
                icon: '⚠️',
                difficulty: 'Advanced',
                description: 'Đánh giá rủi ro dự án/quyết định',
                whenToUse: ['Đánh giá rủi ro trước quyết định', 'Lập kế hoạch mitigation', 'Due diligence'],
                formFields: [
                    { name: 'Quyết định/Dự án', required: true, example: 'Launch sản phẩm mới trong Q2' },
                    { name: 'Stakeholders', required: true, example: 'Team product, sales, khách hàng' },
                    { name: 'Timeline', required: true, example: '6 tháng development' },
                    { name: 'Investment', required: true, example: '$200K budget, 5 FTEs' },
                ],
                checklistItems: [
                    'Đầy đủ các category risks',
                    'Impact và Probability hợp lý',
                    'Mitigation actionable',
                    'Có contingency plans',
                    'Recommendation rõ ràng'
                ],
                commonFailures: [
                    'Thiếu external risks',
                    'Mitigation không specific',
                    'Quá pessimistic',
                    'Missing tail risks'
                ]
            },
            {
                id: 'market_research',
                name: 'Market Research',
                icon: '📈',
                difficulty: 'Medium',
                description: 'Nghiên cứu thị trường, đối thủ',
                whenToUse: ['Nghiên cứu thị trường mới', 'Phân tích đối thủ', 'Validate product idea'],
                formFields: [
                    { name: 'Market focus', required: true, example: 'HR Tech SaaS tại Vietnam' },
                    { name: 'Research goal', required: true, example: 'Market size, key players, trends' },
                    { name: 'Scope', required: true, example: 'Vietnam, SMB segment' },
                    { name: 'Known players', required: false, example: 'Base.vn, HRViet' },
                ],
                checklistItems: [
                    'Market definition rõ ràng',
                    'Sizing có methodology',
                    'Competitive analysis balanced',
                    'Customer segments actionable',
                    'Trends relevant và current'
                ],
                commonFailures: [
                    'Data outdated',
                    'Missing local players',
                    'Sizing inflated',
                    'Generic trends'
                ]
            }
        ]
    },
    {
        id: 'content_creation',
        name: 'Content Creation',
        icon: '✍️',
        description: 'Tạo nội dung chất lượng',
        skills: [
            {
                id: 'documentation',
                name: 'Documentation',
                icon: '📖',
                difficulty: 'Easy',
                description: 'Tài liệu kỹ thuật, hướng dẫn sử dụng',
                whenToUse: ['User guides', 'API documentation', 'Knowledge base articles'],
                formFields: [
                    { name: 'Loại docs', required: true, example: 'User guide cho mobile app' },
                    { name: 'Đối tượng', required: true, example: 'End users, non-technical' },
                    { name: 'Phạm vi', required: true, example: 'Onboarding + core features' },
                    { name: 'Tone', required: false, example: 'Friendly, easy to follow' },
                ],
                checklistItems: [
                    'Có clear structure với headings',
                    'Prerequisites stated upfront',
                    'Steps numbered và sequential',
                    'No assumptions about reader',
                    'Includes troubleshooting'
                ],
                commonFailures: [
                    'Quá technical cho audience',
                    'Missing context',
                    'No examples',
                    'Outdated information'
                ]
            },
            {
                id: 'report_writing',
                name: 'Report Writing',
                icon: '📊',
                difficulty: 'Medium',
                description: 'Báo cáo kinh doanh, phân tích',
                whenToUse: ['Báo cáo định kỳ', 'Analysis reports', 'Executive summaries'],
                formFields: [
                    { name: 'Report type', required: true, example: 'Q4 Sales Performance' },
                    { name: 'Audience', required: true, example: 'CEO và Board' },
                    { name: 'Key data', required: true, example: 'Revenue: $2M, Growth: 15%' },
                    { name: 'Time period', required: true, example: 'Q4 2024' },
                ],
                checklistItems: [
                    'Executive summary captures key points',
                    'Findings backed by data',
                    'Analysis answers key questions',
                    'Recommendations actionable',
                    'Professional tone'
                ],
                commonFailures: [
                    'Data dump instead of insights',
                    'No "so what" analysis',
                    'Wrong length for audience',
                    'Generic recommendations'
                ]
            },
            {
                id: 'presentation',
                name: 'Presentation',
                icon: '🎤',
                difficulty: 'Easy',
                description: 'Slides, pitch deck',
                whenToUse: ['Pitch deck cho investors', 'Internal presentations', 'Sales presentations'],
                formFields: [
                    { name: 'Presentation type', required: true, example: 'Startup pitch deck' },
                    { name: 'Audience', required: true, example: 'VCs và Angel investors' },
                    { name: 'Goal', required: true, example: 'Raise $500K seed round' },
                    { name: 'Time limit', required: true, example: '10 minutes pitch' },
                ],
                checklistItems: [
                    'Logical flow từ problem → solution → ask',
                    '1 main idea per slide',
                    'Text minimal (bullets only)',
                    'Fits time limit',
                    'Has clear CTA'
                ],
                commonFailures: [
                    'Too many slides',
                    'Text heavy slides',
                    'No story arc',
                    'Weak closing/CTA'
                ]
            }
        ]
    },
    {
        id: 'technical_review',
        name: 'Technical Review',
        icon: '🔍',
        description: 'Review và đánh giá kỹ thuật',
        skills: [
            {
                id: 'code_review',
                name: 'Code Review',
                icon: '💻',
                difficulty: 'Medium',
                description: 'Review code changes, tìm bugs',
                whenToUse: ['Review pull requests', 'Đánh giá code changes', 'Tìm bugs và issues'],
                formFields: [
                    { name: 'Code/PR', required: true, example: '[paste code or link]' },
                    { name: 'Context', required: true, example: 'Add user authentication' },
                    { name: 'Language', required: true, example: 'TypeScript' },
                    { name: 'Focus areas', required: false, example: 'Security, error handling' },
                ],
                checklistItems: [
                    'All critical issues identified',
                    'Suggestions are actionable',
                    'Considers context provided',
                    'Not too nitpicky',
                    'Acknowledges good practices'
                ],
                commonFailures: [
                    'Review quá surface-level',
                    'Missing security issues',
                    'Too many style nits',
                    'Ignores error handling'
                ]
            },
            {
                id: 'architecture_review',
                name: 'Architecture Review',
                icon: '🏗️',
                difficulty: 'Advanced',
                description: 'Đánh giá thiết kế hệ thống',
                whenToUse: ['Review system design', 'Evaluate architecture', 'Identify scalability concerns'],
                formFields: [
                    { name: 'Architecture', required: true, example: 'Microservices + PostgreSQL' },
                    { name: 'Requirements', required: true, example: '1M users, real-time updates' },
                    { name: 'Constraints', required: true, example: 'AWS only, budget $5K/month' },
                    { name: 'Scale', required: true, example: '10K concurrent users' },
                ],
                checklistItems: [
                    'Addresses all constraint areas',
                    'Identifies bottlenecks',
                    'Provides alternatives',
                    'Recommendations actionable',
                    'Considers cost'
                ],
                commonFailures: [
                    'Too theoretical',
                    'Missing scale analysis',
                    'Ignores costs',
                    'No alternatives provided'
                ]
            },
            {
                id: 'security_audit',
                name: 'Security Audit',
                icon: '🔒',
                difficulty: 'Advanced',
                description: 'Kiểm tra bảo mật ứng dụng',
                whenToUse: ['Security review', 'Identify vulnerabilities', 'Pre-launch security check'],
                formFields: [
                    { name: 'System description', required: true, example: 'Web app with user auth, payments' },
                    { name: 'Tech stack', required: true, example: 'Next.js, Node.js, PostgreSQL' },
                    { name: 'Data handled', required: true, example: 'PII, payment info' },
                    { name: 'Compliance needs', required: false, example: 'GDPR, PCI-DSS' },
                ],
                checklistItems: [
                    'Covers OWASP Top 10',
                    'Risk levels appropriate',
                    'Remediation actionable',
                    'Considers compliance',
                    'Prioritized findings'
                ],
                commonFailures: [
                    'Surface-level review only',
                    'Missing auth issues',
                    'Generic OWASP list',
                    'Ignores compliance requirements'
                ]
            }
        ]
    }
];

type Skill = typeof skillDomains[0]['skills'][0];

export default function SkillsPage() {
    const [selectedDomain, setSelectedDomain] = useState<string | null>('web_development');
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'checklist' | 'failures'>('overview');
    const { t, language } = useLanguage();

    const currentDomain = skillDomains.find(d => d.id === selectedDomain);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500/20 text-green-400';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
            case 'Advanced': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            CVF v1.5
                        </Link>
                        <span className="text-gray-400 dark:text-gray-500">|</span>
                        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('skills.title')}</h1>
                    </div>
                    <nav className="flex items-center gap-3">
                        <Link href="/" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {t('nav.templates')}
                        </Link>
                        <Link href="/help" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {t('nav.help')}
                        </Link>
                        <ThemeToggle />
                        <LanguageToggle />
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Domain Selection */}
                <div className="mb-8">
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('skills.selectDomain')}</h2>
                    <div className="flex flex-wrap gap-3">
                        {skillDomains.map(domain => (
                            <button
                                key={domain.id}
                                onClick={() => {
                                    setSelectedDomain(domain.id);
                                    setSelectedSkill(null);
                                }}
                                className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${selectedDomain === domain.id
                                    ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <span className="text-2xl">{domain.icon}</span>
                                <div className="text-left">
                                    <div className="font-medium">{t(`domain.${domain.id}`) || domain.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">{domain.skills.length} {t('skills.skills')}</div>
                                </div>
                            </button>
                        ))}
                        {/* Coming Soon Domains - Now Active */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Skills List */}
                    <div className="lg:col-span-1">
                        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                            {t(`domain.${currentDomain?.id}`) || currentDomain?.name} {t('skills.skills')}
                        </h2>
                        <div className="space-y-2">
                            {currentDomain?.skills.map(skill => (
                                <button
                                    key={skill.id}
                                    onClick={() => {
                                        setSelectedSkill(skill);
                                        setActiveTab('overview');
                                    }}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${selectedSkill?.id === skill.id
                                        ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-500'
                                        : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{skill.icon}</span>
                                            <div>
                                                <div className="font-medium">{skill.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{skill.description}</div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(skill.difficulty)}`}>
                                            {t(`difficulty.${skill.difficulty.toLowerCase()}`)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Skill Detail */}
                    <div className="lg:col-span-2">
                        {selectedSkill ? (
                            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                                {/* Skill Header */}
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl">{selectedSkill.icon}</span>
                                        <div>
                                            <h2 className="text-2xl font-bold">{selectedSkill.name}</h2>
                                            <p className="text-gray-500 dark:text-gray-400">{selectedSkill.description}</p>
                                        </div>
                                        <span className={`ml-auto px-3 py-1 rounded-lg ${getDifficultyColor(selectedSkill.difficulty)}`}>
                                            {t(`difficulty.${selectedSkill.difficulty.toLowerCase()}`)}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 dark:border-gray-700/50">
                                    {(['overview', 'form', 'checklist', 'failures'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab
                                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {t(`tab.${tab}`)}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-6">
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-medium mb-3">{t('content.whenToUse')}</h3>
                                                <ul className="space-y-2">
                                                    {selectedSkill.whenToUse.map((item, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                            <span className="text-green-400">✓</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
                                                <p className="text-blue-700 dark:text-blue-300">
                                                    💡 <strong>{t('content.tip')}:</strong> {t('content.skillFitBest')} {selectedSkill.whenToUse[0].toLowerCase()}.
                                                    {t('content.fillFormToStart')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'form' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium mb-3">{t('content.fieldsToFill')}</h3>
                                            <div className="space-y-3">
                                                {selectedSkill.formFields.map((field, i) => (
                                                    <div key={i} className="p-4 bg-gray-100 dark:bg-gray-700/30 rounded-xl">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium">{field.name}</span>
                                                            <span className={`text-xs px-2 py-1 rounded ${field.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/50 text-gray-400'
                                                                }`}>
                                                                {field.required ? t('content.required') : t('content.optional')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {t('content.example')}: <span className="text-gray-700 dark:text-gray-300">"{field.example}"</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'checklist' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium mb-3">{t('content.checklistEval')}</h3>
                                            <div className="space-y-2">
                                                {selectedSkill.checklistItems.map((item, i) => (
                                                    <label key={i} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                                                        <input type="checkbox" className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-blue-500" />
                                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/30">
                                                <p className="text-green-700 dark:text-green-300">
                                                    ✅ {t('content.ifAllChecked')} <strong>{t('content.accept')}</strong> {t('content.output')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'failures' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium mb-3">{t('content.commonFailures')}</h3>
                                            <div className="space-y-3">
                                                {selectedSkill.commonFailures.map((failure, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30">
                                                        <span className="text-red-500 dark:text-red-400 text-xl">⚠️</span>
                                                        <span className="text-red-600 dark:text-red-300">{failure}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/30">
                                                <p className="text-yellow-700 dark:text-yellow-300">
                                                    💡 {t('content.ifSeeError')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-12 text-center">
                                <div className="text-6xl mb-4">📚</div>
                                <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">{t('skills.selectSkill')}</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('skills.selectSkillDesc')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700/50 mt-12 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
                    <p>{t('footer.tagline')}</p>
                </div>
            </footer>
        </div>
    );
}
