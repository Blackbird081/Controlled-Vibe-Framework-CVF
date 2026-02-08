'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

// Vietnamese translations
const vi: Record<string, string> = {
    // Navigation
    'nav.skills': '📚 Kỹ năng',
    'nav.help': '📖 Hướng dẫn',
    'nav.templates': 'Templates',
    'nav.history': '📜 Lịch sử',
    'nav.analytics': '📊 Analytics',
    'nav.marketplace': '🏪 Marketplace',
    'nav.aiAgent': '🤖 AI Agent',
    'nav.multiAgent': '🎯 Multi-Agent',
    'nav.tools': '🛠️ Tools',

    // Skills page
    'skills.title': '📚 Thư viện Kỹ năng',
    'skills.selectDomain': 'Chọn Domain',
    'skills.selectSkill': 'Chọn một Skill',
    'skills.selectSkillDesc': 'Chọn skill từ danh sách bên trái để xem chi tiết',
    'skills.skills': 'Skills',
    'skills.comingSoon': 'Sắp ra mắt',

    // Tabs
    'tab.overview': '🎯 Tổng quan',
    'tab.form': '📋 Form Input',
    'tab.checklist': '✅ Checklist',
    'tab.failures': '⚠️ Lỗi thường gặp',

    // Content
    'content.whenToUse': '🎯 Khi nào sử dụng',
    'content.tip': 'Tip',
    'content.skillFitBest': 'Skill này phù hợp nhất khi bạn muốn',
    'content.fillFormToStart': 'Điền form input để bắt đầu!',
    'content.fieldsToFill': '📋 Fields cần điền',
    'content.required': 'Bắt buộc',
    'content.optional': 'Tùy chọn',
    'content.example': 'Ví dụ',
    'content.checklistEval': '✅ Checklist đánh giá output',
    'content.ifAllChecked': 'Nếu tất cả checked →',
    'content.accept': 'ACCEPT',
    'content.output': 'output!',
    'content.commonFailures': '⚠️ Lỗi thường gặp cần tránh',
    'content.ifSeeError': 'Nếu thấy bất kỳ lỗi nào → Yêu cầu AI sửa lại!',

    // Difficulty
    'difficulty.easy': 'Dễ',
    'difficulty.medium': 'Trung bình',
    'difficulty.advanced': 'Nâng cao',

    // Domains
    'domain.web_development': 'Phát triển Web',
    'domain.business_analysis': 'Phân tích Kinh doanh',
    'domain.content_creation': 'Tạo Nội dung',
    'domain.technical_review': 'Review Kỹ thuật',

    // Footer
    'footer.tagline': 'CVF v1.6 UX Platform — User không cần biết CVF để dùng CVF',
    'footer.author': 'Tien-Tan Thuan Port @2026',

    // Help page
    'help.title': 'Hướng dẫn sử dụng',
    'help.backHome': '← Về trang chủ',

    // Main page
    'main.selectTemplate': 'Chọn Template',
    'main.allCategories': 'Tất cả',
    'main.processing': 'Đang xử lý...',
    'main.result': 'Kết quả',
    'main.retry': 'Thử lại',
    'main.back': 'Quay lại',
    'main.copy': 'Sao chép',
    'main.copied': 'Đã sao chép!',
    'main.close': 'Đóng',
    'main.heroLine1': 'User không cần biết CVF',
    'main.heroLine2': 'để dùng CVF',
    'main.heroDesc': 'CVF v1.6 giúp bạn sử dụng AI mà không cần viết prompt. Chỉ cần chọn template, điền form, và nhận kết quả.',
    'main.backToAll': '← Quay lại',
    'main.apiKeyTitle': 'API key chưa được cấu hình',
    'main.apiKeyDesc': 'Thiết lập API key để dùng AI Agent và các workflow có AI.',
    'main.apiKeyCta': 'Mở API Key Wizard',
    'main.historyTitle': '📜 Lịch sử',
    'main.analyticsTitle': '📊 Analytics',

    // Language
    'lang.switch': '🌐 EN',
    'lang.current': 'Tiếng Việt',

    // Auth
    'auth.logout': '⏻ Đăng xuất',

    // User Context
    'userContext.title': 'User Context',
    'userContext.description': 'Thông tin của bạn sẽ được tự động thêm vào prompts để AI hiểu context tốt hơn.',
    'userContext.name': 'Tên',
    'userContext.role': 'Vai trò',
    'userContext.company': 'Công ty',
    'userContext.industry': 'Ngành',
    'userContext.preferences': 'Preferences',
    'userContext.customContext': 'Custom Context',
    'userContext.save': 'Lưu Context',
    'userContext.saved': 'Đã lưu!',
    'userContext.clear': 'Xóa tất cả',

    // Settings
    'settings.title': '⚙️ Cài đặt',
    'settings.apiKeys': 'API Keys',
    'settings.providers': 'AI Providers',
    'settings.defaultProvider': 'Provider mặc định',
    'settings.save': 'Lưu cài đặt',
    'settings.saved': 'Đã lưu!',
    'settings.enterApiKey': 'Nhập API Key...',
    'settings.preferences': 'Tùy chọn',

    // Agent Chat
    'agent.title': '🤖 AI Agent Chat',
    'agent.placeholder': 'Nhập tin nhắn của bạn...',
    'agent.send': 'Gửi',
    'agent.thinking': 'Đang suy nghĩ...',
    'agent.newChat': '➕ Cuộc trò chuyện mới',
    'agent.history': 'Lịch sử chat',
    'agent.clearHistory': '🗑️ Xóa tất cả',
    'agent.noHistory': 'Chưa có lịch sử chat',
    'agent.today': 'Hôm nay',
    'agent.yesterday': 'Hôm qua',
    'agent.daysAgo': 'ngày trước',
    'agent.messages': 'tin nhắn',
    'agent.delete': 'Xóa',
    'agent.confirmClear': 'Xác nhận xóa?',
    'agent.cancel': 'Hủy',
    'agent.confirm': 'Xác nhận',
    'agent.restoreHint': 'Click để mở lại',

    // Multi-Agent
    'multiAgent.title': '🎯 Multi-Agent Workflow',
    'multiAgent.description': 'Phối hợp nhiều AI agents để hoàn thành task',
    'multiAgent.selectWorkflow': 'Chọn Workflow',
    'multiAgent.enterRequest': '📝 Nhập yêu cầu của bạn',
    'multiAgent.placeholder': 'Ví dụ: Xây dựng API REST cho quản lý sản phẩm với CRUD operations...',
    'multiAgent.availableAgents': 'Agents có sẵn',
    'multiAgent.outputs': '📤 Kết quả từ Agents',
    'multiAgent.processing': 'Đang xử lý với agent hiện tại...',
    'multiAgent.startNew': '🔄 Bắt đầu mới',
    'multiAgent.done': '✓ Hoàn thành',
    'multiAgent.orchestrator': 'Điều phối viên',
    'multiAgent.architect': 'Kiến trúc sư',
    'multiAgent.builder': 'Lập trình viên',
    'multiAgent.reviewer': 'Đánh giá viên',
    'multiAgent.fullCycle': 'Full Development Cycle',
    'multiAgent.designOnly': 'Chỉ thiết kế kiến trúc',
    'multiAgent.buildReview': 'Build & Review',
    'multiAgent.quickBuild': 'Quick Build',

    // Tools
    'tools.title': '🛠️ Agent Tools',
    'tools.description': 'Các công cụ hỗ trợ cho AI Agent',
    'tools.clearHistory': '🗑️ Xóa lịch sử',
    'tools.latestResult': '📤 Kết quả mới nhất',
    'tools.success': '✓ Thành công',
    'tools.failed': '✗ Thất bại',
    'tools.executionTime': '⏱️ Thời gian thực thi',
    'tools.documentation': '📚 Hướng dẫn Tools',
    'tools.parameters': 'Tham số',
    'tools.execute': '▶️ Thực thi',
    'tools.executing': '⏳ Đang thực thi...',
    'tools.recentCalls': 'Lệnh gần đây',
    'tools.webSearch': 'Tìm kiếm Web',
    'tools.codeExecute': 'Chạy Code',
    'tools.calculator': 'Máy tính',
    'tools.datetime': 'Ngày giờ',
    'tools.jsonParse': 'Parse JSON',
    'tools.urlFetch': 'Fetch URL',
    'tools.fileRead': 'Đọc File',
    'tools.fileWrite': 'Ghi File',

    // Errors
    'error.noApiKey': 'Chưa cấu hình API key. Vui lòng vào Settings.',
    'error.apiError': 'Lỗi API, vui lòng thử lại.',
    'error.networkError': 'Lỗi mạng, kiểm tra kết nối internet.',
    'error.timeout': 'Quá thời gian chờ, vui lòng thử lại.',
    'error.invalidInput': 'Dữ liệu nhập không hợp lệ.',

    // Common
    'common.loading': 'Đang tải...',
    'common.search': 'Tìm kiếm...',
    'common.noData': 'Không có dữ liệu',
    'common.viewMore': 'Xem thêm',
    'common.collapse': 'Thu gọn',
};

// English translations
const en: Record<string, string> = {
    // Navigation
    'nav.skills': '📚 Skills',
    'nav.help': '📖 Help',
    'nav.templates': 'Templates',
    'nav.history': '📜 History',
    'nav.analytics': '📊 Analytics',
    'nav.marketplace': '🏪 Marketplace',
    'nav.aiAgent': '🤖 AI Agent',
    'nav.multiAgent': '🎯 Multi-Agent',
    'nav.tools': '🛠️ Tools',

    // Skills page
    'skills.title': '📚 Skill Library',
    'skills.selectDomain': 'Select Domain',
    'skills.selectSkill': 'Select a Skill',
    'skills.selectSkillDesc': 'Select a skill from the left to see details',
    'skills.skills': 'Skills',
    'skills.comingSoon': 'Coming soon',

    // Tabs
    'tab.overview': '🎯 Overview',
    'tab.form': '📋 Form Input',
    'tab.checklist': '✅ Checklist',
    'tab.failures': '⚠️ Common Failures',

    // Content
    'content.whenToUse': '🎯 When to use',
    'content.tip': 'Tip',
    'content.skillFitBest': 'This skill works best when you want to',
    'content.fillFormToStart': 'Fill in the form to get started!',
    'content.fieldsToFill': '📋 Fields to fill',
    'content.required': 'Required',
    'content.optional': 'Optional',
    'content.example': 'Example',
    'content.checklistEval': '✅ Output evaluation checklist',
    'content.ifAllChecked': 'If all checked →',
    'content.accept': 'ACCEPT',
    'content.output': 'output!',
    'content.commonFailures': '⚠️ Common failures to avoid',
    'content.ifSeeError': 'If you see any error → Ask AI to fix!',

    // Difficulty
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.advanced': 'Advanced',

    // Domains
    'domain.web_development': 'Web Development',
    'domain.business_analysis': 'Business Analysis',
    'domain.content_creation': 'Content Creation',
    'domain.technical_review': 'Technical Review',

    // Footer
    'footer.tagline': 'CVF v1.6 UX Platform — Users don’t need CVF to use CVF',
    'footer.author': 'Tien-Tan Thuan Port @2026',

    // Help page
    'help.title': 'User Guide',
    'help.backHome': '← Back to Home',

    // Main page
    'main.selectTemplate': 'Select Template',
    'main.allCategories': 'All',
    'main.processing': 'Processing...',
    'main.result': 'Result',
    'main.retry': 'Retry',
    'main.back': 'Back',
    'main.copy': 'Copy',
    'main.copied': 'Copied!',
    'main.close': 'Close',
    'main.heroLine1': 'Users don’t need to know CVF',
    'main.heroLine2': 'to use CVF',
    'main.heroDesc': 'CVF v1.6 helps you use AI without writing prompts. Just pick a template, fill the form, and get results.',
    'main.backToAll': '← Back',
    'main.apiKeyTitle': 'API key not configured',
    'main.apiKeyDesc': 'Set up API keys to use AI Agent and AI workflows.',
    'main.apiKeyCta': 'Open API Key Wizard',
    'main.historyTitle': '📜 History',
    'main.analyticsTitle': '📊 Analytics',

    // Language
    'lang.switch': '🌐 VI',
    'lang.current': 'English',

    // Auth
    'auth.logout': '⏻ Logout',

    // User Context
    'userContext.title': 'User Context',
    'userContext.description': 'Your info will be auto-added to prompts for better AI understanding.',
    'userContext.name': 'Name',
    'userContext.role': 'Role',
    'userContext.company': 'Company',
    'userContext.industry': 'Industry',
    'userContext.preferences': 'Preferences',
    'userContext.customContext': 'Custom Context',
    'userContext.save': 'Save Context',
    'userContext.saved': 'Saved!',
    'userContext.clear': 'Clear All',

    // Settings
    'settings.title': '⚙️ Settings',
    'settings.apiKeys': 'API Keys',
    'settings.providers': 'AI Providers',
    'settings.defaultProvider': 'Default Provider',
    'settings.save': 'Save Settings',
    'settings.saved': 'Saved!',
    'settings.enterApiKey': 'Enter API Key...',
    'settings.preferences': 'Preferences',

    // Agent Chat
    'agent.title': '🤖 AI Agent Chat',
    'agent.placeholder': 'Type your message...',
    'agent.send': 'Send',
    'agent.thinking': 'Thinking...',
    'agent.newChat': '➕ New Chat',
    'agent.history': 'Chat History',
    'agent.clearHistory': '🗑️ Clear All',
    'agent.noHistory': 'No chat history yet',
    'agent.today': 'Today',
    'agent.yesterday': 'Yesterday',
    'agent.daysAgo': 'days ago',
    'agent.messages': 'messages',
    'agent.delete': 'Delete',
    'agent.confirmClear': 'Confirm clear?',
    'agent.cancel': 'Cancel',
    'agent.confirm': 'Confirm',
    'agent.restoreHint': 'Click to restore',

    // Multi-Agent
    'multiAgent.title': '🎯 Multi-Agent Workflow',
    'multiAgent.description': 'Coordinate multiple AI agents to complete tasks',
    'multiAgent.selectWorkflow': 'Select Workflow',
    'multiAgent.enterRequest': '📝 Enter your request',
    'multiAgent.placeholder': 'Example: Build a REST API for product management with CRUD operations...',
    'multiAgent.availableAgents': 'Available Agents',
    'multiAgent.outputs': '📤 Agent Outputs',
    'multiAgent.processing': 'Processing with current agent...',
    'multiAgent.startNew': '🔄 Start New',
    'multiAgent.done': '✓ Done',
    'multiAgent.orchestrator': 'Orchestrator',
    'multiAgent.architect': 'Architect',
    'multiAgent.builder': 'Builder',
    'multiAgent.reviewer': 'Reviewer',
    'multiAgent.fullCycle': 'Full Development Cycle',
    'multiAgent.designOnly': 'Architecture Design Only',
    'multiAgent.buildReview': 'Build & Review',
    'multiAgent.quickBuild': 'Quick Build',

    // Tools
    'tools.title': '🛠️ Agent Tools',
    'tools.description': 'Tools to support AI Agent',
    'tools.clearHistory': '🗑️ Clear History',
    'tools.latestResult': '📤 Latest Result',
    'tools.success': '✓ Success',
    'tools.failed': '✗ Failed',
    'tools.executionTime': '⏱️ Execution time',
    'tools.documentation': '📚 Tools Documentation',
    'tools.parameters': 'Parameters',
    'tools.execute': '▶️ Execute',
    'tools.executing': '⏳ Executing...',
    'tools.recentCalls': 'Recent Calls',
    'tools.webSearch': 'Web Search',
    'tools.codeExecute': 'Code Execute',
    'tools.calculator': 'Calculator',
    'tools.datetime': 'Date & Time',
    'tools.jsonParse': 'JSON Parse',
    'tools.urlFetch': 'URL Fetch',
    'tools.fileRead': 'File Read',
    'tools.fileWrite': 'File Write',

    // Errors
    'error.noApiKey': 'API key not configured. Please go to Settings.',
    'error.apiError': 'API error, please try again.',
    'error.networkError': 'Network error, check your internet connection.',
    'error.timeout': 'Request timed out, please try again.',
    'error.invalidInput': 'Invalid input data.',

    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search...',
    'common.noData': 'No data',
    'common.viewMore': 'View more',
    'common.collapse': 'Collapse',
};

const translations: Record<Language, Record<string, string>> = { vi, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('vi');

    useEffect(() => {
        // Load saved language preference
        const saved = localStorage.getItem('cvf_language') as Language;
        if (saved && (saved === 'vi' || saved === 'en')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('cvf_language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Language toggle component
export function LanguageToggle() {
    const { language, setLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-bold rounded-lg transition-all
                      bg-gray-100 dark:bg-gray-700 
                      text-gray-700 dark:text-gray-200
                      hover:bg-blue-100 dark:hover:bg-blue-900 
                      hover:text-blue-600 dark:hover:text-blue-400
                      border border-gray-200 dark:border-gray-600"
            title={t('lang.current')}
        >
            {language === 'vi' ? '🌐 EN' : '🌐 VI'}
        </button>
    );
}
