'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';

type Lang = 'vi' | 'en';

type Localized<T> = {
    vi: T;
    en: T;
};

type SkillField = {
    name: Localized<string>;
    required: boolean;
    example: Localized<string>;
};

type Skill = {
    id: string;
    name: Localized<string>;
    description: Localized<string>;
    icon: string;
    difficulty: 'Easy' | 'Medium' | 'Advanced';
    whenToUse: Localized<string[]>;
    formFields: SkillField[];
    checklistItems: Localized<string[]>;
    commonFailures: Localized<string[]>;
};

type SkillDomain = {
    id: string;
    name: Localized<string>;
    icon: string;
    description: Localized<string>;
    skills: Skill[];
};

// Skill data from library
const skillDomains: SkillDomain[] = [
    {
        id: 'web_development',
        name: { vi: 'Phát triển Web', en: 'Web Development' },
        icon: '🌐',
        description: { vi: 'Tạo website và ứng dụng web', en: 'Build websites and web applications' },
        skills: [
            {
                id: 'landing_page',
                name: { vi: 'Landing Page', en: 'Landing Page' },
                icon: '📄',
                difficulty: 'Easy',
                description: { vi: 'Trang giới thiệu/bán hàng, thu leads', en: 'Marketing page to introduce/sell and capture leads' },
                whenToUse: {
                    vi: ['Giới thiệu sản phẩm', 'Thu leads', 'Bán hàng online', 'Ra mắt sản phẩm'],
                    en: ['Introduce a product', 'Capture leads', 'Sell online', 'Launch a product'],
                },
                formFields: [
                    { name: { vi: 'Sản phẩm', en: 'Product' }, required: true, example: { vi: 'Khóa học Excel', en: 'Excel course' } },
                    { name: { vi: 'Mục tiêu', en: 'Goal' }, required: true, example: { vi: 'Đăng ký học thử', en: 'Trial sign-ups' } },
                    { name: { vi: 'Đối tượng', en: 'Audience' }, required: true, example: { vi: 'Nhân viên văn phòng 25-35', en: 'Office workers 25-35' } },
                    { name: { vi: 'Brand', en: 'Brand' }, required: false, example: { vi: 'Chưa có, tone friendly', en: 'None yet, friendly tone' } },
                ],
                checklistItems: {
                    vi: [
                        'Headline rõ ràng, dưới 12 từ',
                        'CTA xuất hiện ít nhất 2 lần',
                        'Phù hợp đối tượng mục tiêu',
                        'Responsive mobile',
                        'Có social proof',
                    ],
                    en: [
                        'Clear headline under 12 words',
                        'CTA appears at least twice',
                        'Matches target audience',
                        'Mobile responsive',
                        'Includes social proof',
                    ],
                },
                commonFailures: {
                    vi: ['Headline quá dài/mơ hồ', 'Thiếu social proof', 'CTA không nổi bật', 'Quên mobile view'],
                    en: ['Headline too long or vague', 'Missing social proof', 'CTA not prominent', 'Forgot mobile view'],
                },
            },
            {
                id: 'saas_app',
                name: { vi: 'SaaS App', en: 'SaaS App' },
                icon: '🚀',
                difficulty: 'Medium',
                description: { vi: 'Ứng dụng web có đăng nhập, quản lý user', en: 'Web app with login and user management' },
                whenToUse: {
                    vi: ['App có user accounts', 'Subscription/payment', 'Nhiều tính năng'],
                    en: ['Apps with user accounts', 'Subscription/payment', 'Multiple features'],
                },
                formFields: [
                    { name: { vi: 'Tên app', en: 'App name' }, required: true, example: { vi: 'TaskFlow - quản lý công việc', en: 'TaskFlow - task management' } },
                    { name: { vi: 'Tính năng chính', en: 'Core features' }, required: true, example: { vi: 'Task board, Time tracking', en: 'Task board, Time tracking' } },
                    { name: { vi: 'Vai trò người dùng', en: 'User roles' }, required: true, example: { vi: 'Admin, Member', en: 'Admin, Member' } },
                    { name: { vi: 'Đối tượng', en: 'Target users' }, required: true, example: { vi: 'Startup team 5-20 người', en: 'Startup team of 5-20 people' } },
                ],
                checklistItems: {
                    vi: [
                        'Auth flow hoàn chỉnh',
                        'Dashboard overview rõ ràng',
                        '3 core features đầy đủ',
                        'User roles phân quyền đúng',
                        'Settings/Profile có đủ',
                    ],
                    en: [
                        'Complete auth flow',
                        'Clear dashboard overview',
                        'Three core features covered',
                        'Proper role-based access',
                        'Settings/Profile included',
                    ],
                },
                commonFailures: {
                    vi: ['Feature creep (quá nhiều)', 'Auth quá phức tạp', 'Không phân quyền', 'Quên empty states'],
                    en: ['Feature creep (too many)', 'Overly complex auth', 'No role-based access', 'Missing empty states'],
                },
            },
            {
                id: 'dashboard',
                name: { vi: 'Dashboard', en: 'Dashboard' },
                icon: '📊',
                difficulty: 'Medium',
                description: { vi: 'Bảng điều khiển, admin panel, analytics', en: 'Dashboards, admin panels, analytics' },
                whenToUse: {
                    vi: ['Quản lý dữ liệu', 'Admin panel', 'Analytics/reporting'],
                    en: ['Manage data', 'Admin panel', 'Analytics/reporting'],
                },
                formFields: [
                    { name: { vi: 'Mục đích', en: 'Purpose' }, required: true, example: { vi: 'Theo dõi sales', en: 'Track sales' } },
                    { name: { vi: 'Data chính', en: 'Key data' }, required: true, example: { vi: 'Revenue, orders, customers', en: 'Revenue, orders, customers' } },
                    { name: { vi: 'KPIs', en: 'KPIs' }, required: true, example: { vi: 'Total revenue, Conversion rate', en: 'Total revenue, Conversion rate' } },
                    { name: { vi: 'Người dùng', en: 'Users' }, required: true, example: { vi: 'CEO, Sales manager', en: 'CEO, Sales manager' } },
                ],
                checklistItems: {
                    vi: [
                        'KPI cards hiển thị metrics quan trọng',
                        'Charts phù hợp loại data',
                        'Tables có filter/sort',
                        'Date range picker hoạt động',
                        'Loading states có',
                    ],
                    en: [
                        'KPI cards show key metrics',
                        'Charts match data type',
                        'Tables have filter/sort',
                        'Date range picker works',
                        'Has loading states',
                    ],
                },
                commonFailures: {
                    vi: ['Quá nhiều data, không focus', 'Chart sai loại', 'Không có loading states', 'Mobile bị vỡ'],
                    en: ['Too much data, no focus', 'Wrong chart type', 'No loading states', 'Broken on mobile'],
                },
            },
            {
                id: 'blog_docs',
                name: { vi: 'Blog / Docs', en: 'Blog / Docs' },
                icon: '📝',
                difficulty: 'Easy',
                description: { vi: 'Blog, tài liệu, wiki, knowledge base', en: 'Blog, docs, wiki, knowledge base' },
                whenToUse: {
                    vi: ['Blog cá nhân/công ty', 'Documentation', 'Knowledge base'],
                    en: ['Personal or company blog', 'Documentation', 'Knowledge base'],
                },
                formFields: [
                    { name: { vi: 'Loại', en: 'Type' }, required: true, example: { vi: 'Blog về AI', en: 'AI blog' } },
                    { name: { vi: 'Nội dung', en: 'Content' }, required: true, example: { vi: 'Tutorials, news', en: 'Tutorials, news' } },
                    { name: { vi: 'Tần suất', en: 'Frequency' }, required: false, example: { vi: '2 bài/tuần', en: '2 posts/week' } },
                    { name: { vi: 'Categories', en: 'Categories' }, required: false, example: { vi: 'Tutorials, News', en: 'Tutorials, News' } },
                ],
                checklistItems: {
                    vi: ['Typography dễ đọc (18px+)', 'TOC hoạt động', 'Search tìm được content', 'Mobile responsive', 'SEO meta tags đầy đủ'],
                    en: ['Readable typography (18px+)', 'TOC works', 'Search finds content', 'Mobile responsive', 'SEO meta tags included'],
                },
                commonFailures: {
                    vi: ['Typography không tối ưu', 'Không có TOC cho bài dài', 'Search không hoạt động', 'Code blocks xấu'],
                    en: ['Typography not optimized', 'No TOC for long posts', 'Search not working', 'Ugly code blocks'],
                },
            },
            {
                id: 'portfolio',
                name: { vi: 'Portfolio', en: 'Portfolio' },
                icon: '🎨',
                difficulty: 'Easy',
                description: { vi: 'Portfolio cá nhân, agency, freelancer', en: 'Personal/agency/freelancer portfolio' },
                whenToUse: {
                    vi: ['Portfolio cá nhân', 'Agency showcase', 'Personal brand'],
                    en: ['Personal portfolio', 'Agency showcase', 'Personal brand'],
                },
                formFields: [
                    { name: { vi: 'Nghề nghiệp', en: 'Profession' }, required: true, example: { vi: 'UX Designer 5 năm', en: 'UX Designer with 5 years' } },
                    { name: { vi: 'Style', en: 'Style' }, required: true, example: { vi: 'Minimal - clean', en: 'Minimal - clean' } },
                    { name: { vi: 'Projects', en: 'Projects' }, required: true, example: { vi: '5 case studies', en: '5 case studies' } },
                    { name: { vi: 'Services', en: 'Services' }, required: false, example: { vi: 'UI Design, UX Research', en: 'UI Design, UX Research' } },
                ],
                checklistItems: {
                    vi: ['Hero gây ấn tượng (3 giây đầu)', 'Projects có case study chi tiết', 'Style phù hợp nghề', 'Contact rõ ràng', 'Animations smooth'],
                    en: ['Hero impresses in first 3 seconds', 'Projects include detailed case studies', 'Style matches profession', 'Clear contact', 'Smooth animations'],
                },
                commonFailures: {
                    vi: ['Hero nhạt nhẽo', 'Projects không có story', 'Style không phù hợp', 'Animation quá nhiều'],
                    en: ['Bland hero section', 'Projects lack story', 'Style mismatched', 'Too many animations'],
                },
            },
        ],
    },
    {
        id: 'business_analysis',
        name: { vi: 'Phân tích Kinh doanh', en: 'Business Analysis' },
        icon: '💼',
        description: { vi: 'Phân tích và ra quyết định kinh doanh', en: 'Business analysis and decision-making' },
        skills: [
            {
                id: 'strategy_analysis',
                name: { vi: 'Phân tích chiến lược', en: 'Strategy Analysis' },
                icon: '♟️',
                difficulty: 'Medium',
                description: { vi: 'Phân tích chiến lược, so sánh phương án', en: 'Analyze strategy and compare options' },
                whenToUse: {
                    vi: ['So sánh các phương án', 'Đánh giá chiến lược mới', 'Phân tích SWOT'],
                    en: ['Compare options', 'Evaluate a new strategy', 'SWOT analysis'],
                },
                formFields: [
                    { name: { vi: 'Tình huống', en: 'Situation' }, required: true, example: { vi: 'Mở rộng sang thị trường mới hay focus hiện tại', en: 'Expand to a new market vs focus current' } },
                    { name: { vi: 'Các phương án', en: 'Options' }, required: true, example: { vi: 'A: Mở rộng B2C, B: Focus B2B', en: 'A: Expand B2C, B: Focus B2B' } },
                    { name: { vi: 'Mục tiêu', en: 'Goal' }, required: true, example: { vi: 'Tăng revenue 30% trong 2 năm', en: 'Increase revenue 30% in 2 years' } },
                    { name: { vi: 'Ràng buộc', en: 'Constraints' }, required: true, example: { vi: 'Budget $500K, team 10 người', en: 'Budget $500K, team of 10' } },
                ],
                checklistItems: {
                    vi: [
                        'Hiểu đúng tình huống và context',
                        'Phân tích đầy đủ các phương án',
                        'Recommendation có logic rõ ràng',
                        'Cân nhắc được ràng buộc thực tế',
                        'Có next steps actionable',
                    ],
                    en: [
                        'Correctly understands situation and context',
                        'Fully analyzes options',
                        'Recommendation has clear logic',
                        'Considers real constraints',
                        'Has actionable next steps',
                    ],
                },
                commonFailures: {
                    vi: ['Output quá generic', 'Bias sang 1 option từ đầu', 'Thiếu actionable steps', 'Bỏ qua risks'],
                    en: ['Output too generic', 'Biased toward one option from the start', 'Missing actionable steps', 'Ignores risks'],
                },
            },
            {
                id: 'risk_assessment',
                name: { vi: 'Đánh giá rủi ro', en: 'Risk Assessment' },
                icon: '⚠️',
                difficulty: 'Advanced',
                description: { vi: 'Đánh giá rủi ro dự án/quyết định', en: 'Assess risks for projects/decisions' },
                whenToUse: {
                    vi: ['Đánh giá rủi ro trước quyết định', 'Lập kế hoạch mitigation', 'Due diligence'],
                    en: ['Assess risk before a decision', 'Plan mitigations', 'Due diligence'],
                },
                formFields: [
                    { name: { vi: 'Quyết định/Dự án', en: 'Decision/Project' }, required: true, example: { vi: 'Launch sản phẩm mới trong Q2', en: 'Launch a new product in Q2' } },
                    { name: { vi: 'Stakeholders', en: 'Stakeholders' }, required: true, example: { vi: 'Team product, sales, khách hàng', en: 'Product team, sales, customers' } },
                    { name: { vi: 'Timeline', en: 'Timeline' }, required: true, example: { vi: '6 tháng development', en: '6 months development' } },
                    { name: { vi: 'Investment', en: 'Investment' }, required: true, example: { vi: '$200K budget, 5 FTEs', en: '$200K budget, 5 FTEs' } },
                ],
                checklistItems: {
                    vi: [
                        'Đầy đủ các category risks',
                        'Impact và Probability hợp lý',
                        'Mitigation actionable',
                        'Có contingency plans',
                        'Recommendation rõ ràng',
                    ],
                    en: [
                        'Covers all risk categories',
                        'Reasonable impact/probability',
                        'Actionable mitigations',
                        'Has contingency plans',
                        'Clear recommendation',
                    ],
                },
                commonFailures: {
                    vi: ['Thiếu external risks', 'Mitigation không specific', 'Quá pessimistic', 'Missing tail risks'],
                    en: ['Missing external risks', 'Mitigations not specific', 'Too pessimistic', 'Missing tail risks'],
                },
            },
            {
                id: 'market_research',
                name: { vi: 'Nghiên cứu thị trường', en: 'Market Research' },
                icon: '📈',
                difficulty: 'Medium',
                description: { vi: 'Nghiên cứu thị trường, đối thủ', en: 'Market and competitor research' },
                whenToUse: {
                    vi: ['Nghiên cứu thị trường mới', 'Phân tích đối thủ', 'Validate product idea'],
                    en: ['Research a new market', 'Analyze competitors', 'Validate a product idea'],
                },
                formFields: [
                    { name: { vi: 'Thị trường', en: 'Market focus' }, required: true, example: { vi: 'HR Tech SaaS tại Vietnam', en: 'HR Tech SaaS in Vietnam' } },
                    { name: { vi: 'Mục tiêu nghiên cứu', en: 'Research goal' }, required: true, example: { vi: 'Market size, key players, trends', en: 'Market size, key players, trends' } },
                    { name: { vi: 'Phạm vi', en: 'Scope' }, required: true, example: { vi: 'Vietnam, SMB segment', en: 'Vietnam, SMB segment' } },
                    { name: { vi: 'Đối thủ đã biết', en: 'Known players' }, required: false, example: { vi: 'Base.vn, HRViet', en: 'Base.vn, HRViet' } },
                ],
                checklistItems: {
                    vi: ['Market definition rõ ràng', 'Sizing có methodology', 'Competitive analysis balanced', 'Customer segments actionable', 'Trends relevant và current'],
                    en: ['Clear market definition', 'Sizing has methodology', 'Balanced competitive analysis', 'Actionable customer segments', 'Trends are relevant and current'],
                },
                commonFailures: {
                    vi: ['Data outdated', 'Missing local players', 'Sizing inflated', 'Generic trends'],
                    en: ['Outdated data', 'Missing local players', 'Inflated sizing', 'Generic trends'],
                },
            },
        ],
    },
    {
        id: 'content_creation',
        name: { vi: 'Tạo Nội dung', en: 'Content Creation' },
        icon: '✍️',
        description: { vi: 'Tạo nội dung chất lượng', en: 'Create quality content' },
        skills: [
            {
                id: 'documentation',
                name: { vi: 'Tài liệu', en: 'Documentation' },
                icon: '📖',
                difficulty: 'Easy',
                description: { vi: 'Tài liệu kỹ thuật, hướng dẫn sử dụng', en: 'Technical docs and user guides' },
                whenToUse: {
                    vi: ['Hướng dẫn người dùng', 'API documentation', 'Bài viết knowledge base'],
                    en: ['User guides', 'API documentation', 'Knowledge base articles'],
                },
                formFields: [
                    { name: { vi: 'Loại tài liệu', en: 'Doc type' }, required: true, example: { vi: 'User guide cho mobile app', en: 'User guide for mobile app' } },
                    { name: { vi: 'Đối tượng', en: 'Audience' }, required: true, example: { vi: 'End users, non-technical', en: 'End users, non-technical' } },
                    { name: { vi: 'Phạm vi', en: 'Scope' }, required: true, example: { vi: 'Onboarding + core features', en: 'Onboarding + core features' } },
                    { name: { vi: 'Tone', en: 'Tone' }, required: false, example: { vi: 'Friendly, easy to follow', en: 'Friendly, easy to follow' } },
                ],
                checklistItems: {
                    vi: ['Có clear structure với headings', 'Prerequisites stated upfront', 'Steps numbered và sequential', 'No assumptions about reader', 'Includes troubleshooting'],
                    en: ['Clear structure with headings', 'Prerequisites stated upfront', 'Steps numbered and sequential', 'No assumptions about reader', 'Includes troubleshooting'],
                },
                commonFailures: {
                    vi: ['Quá technical cho audience', 'Missing context', 'No examples', 'Outdated information'],
                    en: ['Too technical for audience', 'Missing context', 'No examples', 'Outdated information'],
                },
            },
            {
                id: 'report_writing',
                name: { vi: 'Viết báo cáo', en: 'Report Writing' },
                icon: '📊',
                difficulty: 'Medium',
                description: { vi: 'Báo cáo kinh doanh, phân tích', en: 'Business and analysis reports' },
                whenToUse: {
                    vi: ['Báo cáo định kỳ', 'Báo cáo phân tích', 'Tóm tắt điều hành'],
                    en: ['Periodic reports', 'Analysis reports', 'Executive summaries'],
                },
                formFields: [
                    { name: { vi: 'Loại báo cáo', en: 'Report type' }, required: true, example: { vi: 'Q4 Sales Performance', en: 'Q4 Sales Performance' } },
                    { name: { vi: 'Đối tượng', en: 'Audience' }, required: true, example: { vi: 'CEO và Board', en: 'CEO and Board' } },
                    { name: { vi: 'Dữ liệu chính', en: 'Key data' }, required: true, example: { vi: 'Revenue: $2M, Growth: 15%', en: 'Revenue: $2M, Growth: 15%' } },
                    { name: { vi: 'Khoảng thời gian', en: 'Time period' }, required: true, example: { vi: 'Q4 2024', en: 'Q4 2024' } },
                ],
                checklistItems: {
                    vi: ['Executive summary captures key points', 'Findings backed by data', 'Analysis answers key questions', 'Recommendations actionable', 'Professional tone'],
                    en: ['Executive summary captures key points', 'Findings backed by data', 'Analysis answers key questions', 'Recommendations actionable', 'Professional tone'],
                },
                commonFailures: {
                    vi: ['Data dump instead of insights', 'No "so what" analysis', 'Wrong length for audience', 'Generic recommendations'],
                    en: ['Data dump instead of insights', 'No "so what" analysis', 'Wrong length for audience', 'Generic recommendations'],
                },
            },
            {
                id: 'presentation',
                name: { vi: 'Thuyết trình', en: 'Presentation' },
                icon: '🎤',
                difficulty: 'Easy',
                description: { vi: 'Slides, pitch deck', en: 'Slides and pitch decks' },
                whenToUse: {
                    vi: ['Pitch deck cho nhà đầu tư', 'Thuyết trình nội bộ', 'Thuyết trình bán hàng'],
                    en: ['Pitch deck for investors', 'Internal presentations', 'Sales presentations'],
                },
                formFields: [
                    { name: { vi: 'Loại thuyết trình', en: 'Presentation type' }, required: true, example: { vi: 'Startup pitch deck', en: 'Startup pitch deck' } },
                    { name: { vi: 'Đối tượng', en: 'Audience' }, required: true, example: { vi: 'VCs và Angel investors', en: 'VCs and angel investors' } },
                    { name: { vi: 'Mục tiêu', en: 'Goal' }, required: true, example: { vi: 'Raise $500K seed round', en: 'Raise $500K seed round' } },
                    { name: { vi: 'Thời lượng', en: 'Time limit' }, required: true, example: { vi: '10 minutes pitch', en: '10 minutes pitch' } },
                ],
                checklistItems: {
                    vi: ['Logical flow từ problem → solution → ask', '1 main idea per slide', 'Text minimal (bullets only)', 'Fits time limit', 'Has clear CTA'],
                    en: ['Logical flow from problem → solution → ask', 'One main idea per slide', 'Minimal text (bullets only)', 'Fits time limit', 'Has clear CTA'],
                },
                commonFailures: {
                    vi: ['Too many slides', 'Text heavy slides', 'No story arc', 'Weak closing/CTA'],
                    en: ['Too many slides', 'Text-heavy slides', 'No story arc', 'Weak closing/CTA'],
                },
            },
        ],
    },
    {
        id: 'technical_review',
        name: { vi: 'Review Kỹ thuật', en: 'Technical Review' },
        icon: '🔍',
        description: { vi: 'Review và đánh giá kỹ thuật', en: 'Technical review and evaluation' },
        skills: [
            {
                id: 'code_review',
                name: { vi: 'Review code', en: 'Code Review' },
                icon: '💻',
                difficulty: 'Medium',
                description: { vi: 'Review code changes, tìm bugs', en: 'Review code changes and find bugs' },
                whenToUse: {
                    vi: ['Review pull requests', 'Đánh giá thay đổi code', 'Tìm lỗi và issues'],
                    en: ['Review pull requests', 'Assess code changes', 'Find bugs and issues'],
                },
                formFields: [
                    { name: { vi: 'Code/PR', en: 'Code/PR' }, required: true, example: { vi: '[paste code or link]', en: '[paste code or link]' } },
                    { name: { vi: 'Bối cảnh', en: 'Context' }, required: true, example: { vi: 'Add user authentication', en: 'Add user authentication' } },
                    { name: { vi: 'Ngôn ngữ', en: 'Language' }, required: true, example: { vi: 'TypeScript', en: 'TypeScript' } },
                    { name: { vi: 'Focus areas', en: 'Focus areas' }, required: false, example: { vi: 'Security, error handling', en: 'Security, error handling' } },
                ],
                checklistItems: {
                    vi: ['All critical issues identified', 'Suggestions are actionable', 'Considers context provided', 'Not too nitpicky', 'Acknowledges good practices'],
                    en: ['All critical issues identified', 'Suggestions are actionable', 'Considers context provided', 'Not too nitpicky', 'Acknowledges good practices'],
                },
                commonFailures: {
                    vi: ['Review quá surface-level', 'Missing security issues', 'Too many style nits', 'Ignores error handling'],
                    en: ['Too surface-level review', 'Missing security issues', 'Too many style nits', 'Ignores error handling'],
                },
            },
            {
                id: 'architecture_review',
                name: { vi: 'Review kiến trúc', en: 'Architecture Review' },
                icon: '🏗️',
                difficulty: 'Advanced',
                description: { vi: 'Đánh giá thiết kế hệ thống', en: 'Evaluate system design' },
                whenToUse: {
                    vi: ['Review system design', 'Evaluate architecture', 'Identify scalability concerns'],
                    en: ['Review system design', 'Evaluate architecture', 'Identify scalability concerns'],
                },
                formFields: [
                    { name: { vi: 'Kiến trúc', en: 'Architecture' }, required: true, example: { vi: 'Microservices + PostgreSQL', en: 'Microservices + PostgreSQL' } },
                    { name: { vi: 'Yêu cầu', en: 'Requirements' }, required: true, example: { vi: '1M users, real-time updates', en: '1M users, real-time updates' } },
                    { name: { vi: 'Ràng buộc', en: 'Constraints' }, required: true, example: { vi: 'AWS only, budget $5K/month', en: 'AWS only, budget $5K/month' } },
                    { name: { vi: 'Quy mô', en: 'Scale' }, required: true, example: { vi: '10K concurrent users', en: '10K concurrent users' } },
                ],
                checklistItems: {
                    vi: ['Addresses all constraint areas', 'Identifies bottlenecks', 'Provides alternatives', 'Recommendations actionable', 'Considers cost'],
                    en: ['Addresses all constraint areas', 'Identifies bottlenecks', 'Provides alternatives', 'Recommendations actionable', 'Considers cost'],
                },
                commonFailures: {
                    vi: ['Too theoretical', 'Missing scale analysis', 'Ignores costs', 'No alternatives provided'],
                    en: ['Too theoretical', 'Missing scale analysis', 'Ignores costs', 'No alternatives provided'],
                },
            },
            {
                id: 'security_audit',
                name: { vi: 'Kiểm tra bảo mật', en: 'Security Audit' },
                icon: '🔒',
                difficulty: 'Advanced',
                description: { vi: 'Kiểm tra bảo mật ứng dụng', en: 'Application security audit' },
                whenToUse: {
                    vi: ['Security review', 'Identify vulnerabilities', 'Pre-launch security check'],
                    en: ['Security review', 'Identify vulnerabilities', 'Pre-launch security check'],
                },
                formFields: [
                    { name: { vi: 'Mô tả hệ thống', en: 'System description' }, required: true, example: { vi: 'Web app with user auth, payments', en: 'Web app with user auth, payments' } },
                    { name: { vi: 'Công nghệ', en: 'Tech stack' }, required: true, example: { vi: 'Next.js, Node.js, PostgreSQL', en: 'Next.js, Node.js, PostgreSQL' } },
                    { name: { vi: 'Dữ liệu xử lý', en: 'Data handled' }, required: true, example: { vi: 'PII, payment info', en: 'PII, payment info' } },
                    { name: { vi: 'Yêu cầu tuân thủ', en: 'Compliance needs' }, required: false, example: { vi: 'GDPR, PCI-DSS', en: 'GDPR, PCI-DSS' } },
                ],
                checklistItems: {
                    vi: ['Covers OWASP Top 10', 'Risk levels appropriate', 'Remediation actionable', 'Considers compliance', 'Prioritized findings'],
                    en: ['Covers OWASP Top 10', 'Risk levels appropriate', 'Remediation actionable', 'Considers compliance', 'Prioritized findings'],
                },
                commonFailures: {
                    vi: ['Surface-level review only', 'Missing auth issues', 'Generic OWASP list', 'Ignores compliance requirements'],
                    en: ['Surface-level review only', 'Missing auth issues', 'Generic OWASP list', 'Ignores compliance requirements'],
                },
            },
        ],
    },
];

export default function SkillsPage() {
    const [selectedDomain, setSelectedDomain] = useState<string | null>('web_development');
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'form' | 'checklist' | 'failures'>('overview');
    const { t, language } = useLanguage();

    const localize = <T,>(value: Localized<T>) => value[language as Lang];
    const currentDomain = skillDomains.find(d => d.id === selectedDomain);

    const getDomainName = (domain: SkillDomain) => {
        const key = `domain.${domain.id}`;
        const translated = t(key);
        return translated === key ? localize(domain.name) : translated;
    };

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
                                    <div className="font-medium">{getDomainName(domain)}</div>
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
                            {currentDomain ? getDomainName(currentDomain) : ''} {t('skills.skills')}
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
                                                <div className="font-medium">{localize(skill.name)}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{localize(skill.description)}</div>
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
                                            <h2 className="text-2xl font-bold">{localize(selectedSkill.name)}</h2>
                                            <p className="text-gray-500 dark:text-gray-400">{localize(selectedSkill.description)}</p>
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
                                                    {localize(selectedSkill.whenToUse).map((item, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                            <span className="text-green-400">✓</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
                                                <p className="text-blue-700 dark:text-blue-300">
                                                    💡 <strong>{t('content.tip')}:</strong> {t('content.skillFitBest')} {localize(selectedSkill.whenToUse)[0]}. {t('content.fillFormToStart')}
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
                                                            <span className="font-medium">{localize(field.name)}</span>
                                                            <span className={`text-xs px-2 py-1 rounded ${field.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/50 text-gray-400'
                                                                }`}
                                                            >
                                                                {field.required ? t('content.required') : t('content.optional')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {t('content.example')}: <span className="text-gray-700 dark:text-gray-300">"{localize(field.example)}"</span>
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
                                                {localize(selectedSkill.checklistItems).map((item, i) => (
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
                                                {localize(selectedSkill.commonFailures).map((failure, i) => (
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
