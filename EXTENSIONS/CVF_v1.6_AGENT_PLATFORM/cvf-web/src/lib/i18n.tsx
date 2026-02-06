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
    'footer.tagline': 'CVF v1.6 Agent Platform — Chuyên môn AI cho mọi người',

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

    // Language
    'lang.switch': '🌐 EN',
    'lang.current': 'Tiếng Việt',

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
};

// English translations
const en: Record<string, string> = {
    // Navigation
    'nav.skills': '📚 Skills',
    'nav.help': '📖 Help',
    'nav.templates': 'Templates',
    'nav.history': '📜 History',

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
    'footer.tagline': 'CVF v1.6 Agent Platform — AI expertise for everyone',

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

    // Language
    'lang.switch': '🌐 VI',
    'lang.current': 'English',

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
