'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

interface UserContextData {
    name: string;
    role: string;
    company: string;
    industry: string;
    preferences: string;
    customContext: string;
}

const defaultContext: UserContextData = {
    name: '',
    role: '',
    company: '',
    industry: '',
    preferences: '',
    customContext: '',
};

const STORAGE_KEY = 'cvf_user_context';

export function useUserContext() {
    const [context, setContext] = useState<UserContextData>(defaultContext);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setContext(JSON.parse(saved));
            } catch {
                setContext(defaultContext);
            }
        }
        setIsLoaded(true);
    }, []);

    const saveContext = useCallback((newContext: UserContextData) => {
        setContext(newContext);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));
    }, []);

    const clearContext = useCallback(() => {
        setContext(defaultContext);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const getContextPrompt = useCallback(() => {
        const parts: string[] = [];
        if (context.name) parts.push(`Tên: ${context.name}`);
        if (context.role) parts.push(`Vai trò: ${context.role}`);
        if (context.company) parts.push(`Công ty: ${context.company}`);
        if (context.industry) parts.push(`Ngành: ${context.industry}`);
        if (context.preferences) parts.push(`Preferences: ${context.preferences}`);
        if (context.customContext) parts.push(`Context: ${context.customContext}`);

        if (parts.length === 0) return '';
        return `\n\n[USER CONTEXT]\n${parts.join('\n')}`;
    }, [context]);

    return { context, saveContext, clearContext, getContextPrompt, isLoaded };
}

interface UserContextFormProps {
    onClose?: () => void;
    compact?: boolean;
}

export function UserContextForm({ onClose, compact = false }: UserContextFormProps) {
    const { t } = useLanguage();
    const { context, saveContext, clearContext, isLoaded } = useUserContext();
    const [formData, setFormData] = useState<UserContextData>(defaultContext);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (isLoaded) {
            setFormData(context);
        }
    }, [context, isLoaded]);

    const handleChange = (field: keyof UserContextData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        saveContext(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleClear = () => {
        clearContext();
        setFormData(defaultContext);
    };

    if (!isLoaded) return null;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('userContext.title') || 'User Context'}
                    </h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('userContext.description') || 'Thông tin của bạn sẽ được tự động thêm vào prompts để AI hiểu context tốt hơn.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('userContext.name') || 'Tên'}
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('userContext.role') || 'Vai trò'}
                    </label>
                    <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        placeholder="Product Manager, Developer..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('userContext.company') || 'Công ty'}
                    </label>
                    <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        placeholder="TechStart Inc."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('userContext.industry') || 'Ngành'}
                    </label>
                    <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => handleChange('industry', e.target.value)}
                        placeholder="SaaS, E-commerce, Fintech..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('userContext.preferences') || 'Preferences'}
                </label>
                <input
                    type="text"
                    value={formData.preferences}
                    onChange={(e) => handleChange('preferences', e.target.value)}
                    placeholder="Ngôn ngữ output, format, độ chi tiết..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('userContext.customContext') || 'Custom Context'}
                </label>
                <textarea
                    value={formData.customContext}
                    onChange={(e) => handleChange('customContext', e.target.value)}
                    placeholder="Thông tin bổ sung khác mà AI nên biết..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </div>

            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={handleClear}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 
                               dark:hover:text-red-400 transition-colors"
                >
                    {t('userContext.clear') || 'Xóa tất cả'}
                </button>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('userContext.saved') || 'Đã lưu!'}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                                   font-medium transition-colors"
                    >
                        {t('userContext.save') || 'Lưu Context'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Compact badge to show in header
export function UserContextBadge({ onClick }: { onClick: () => void }) {
    const { context, isLoaded } = useUserContext();

    if (!isLoaded) return null;

    const hasContext = context.name || context.role || context.company;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${hasContext
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                } hover:opacity-80`}
            title={hasContext ? `${context.name || 'User'} - ${context.role || 'No role'}` : 'Set user context'}
        >
            <span>👤</span>
            <span className="text-sm font-medium">
                {hasContext ? (context.name || 'User') : 'Context'}
            </span>
        </button>
    );
}
