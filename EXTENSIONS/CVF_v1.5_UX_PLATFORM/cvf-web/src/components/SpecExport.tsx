'use client';

import { useState } from 'react';
import { Template } from '@/types';
import { generateCompleteSpec } from '@/lib/templates';

interface SpecExportProps {
    template: Template;
    values: Record<string, string>;
    onClose?: () => void;
}

type ExportLanguage = 'en' | 'vi';

const specLabels = {
    en: {
        title: 'Complete Spec Export',
        description: 'Copy the complete spec and paste into ChatGPT, Claude, Gemini or your preferred AI.',
        copyBtn: 'Copy to Clipboard',
        exportBtn: 'Export to File (.md)',
        previewBtn: 'Show Preview',
        hidePreviewBtn: 'Hide Preview',
        copied: 'Copied!',
        langLabel: 'Export Language',
        quickPaste: 'Quick paste to:',
        instruction: 'Click "Copy to Clipboard" → Open ChatGPT/Claude/Gemini → Paste → Enter',
        helpTitle: '📋 Export Spec (Prompt)',
        helpDesc: 'Export prompt to paste into your preferred AI assistant. Different from Export Result - this is for BEFORE processing.',
    },
    vi: {
        title: 'Xuất Spec Hoàn Chỉnh',
        description: 'Sao chép spec hoàn chỉnh để paste vào ChatGPT, Claude, Gemini hoặc AI yêu thích của bạn.',
        copyBtn: 'Sao chép',
        exportBtn: 'Xuất file (.md)',
        previewBtn: 'Xem trước',
        hidePreviewBtn: 'Ẩn xem trước',
        copied: 'Đã sao chép!',
        langLabel: 'Ngôn ngữ xuất',
        quickPaste: 'Mở nhanh:',
        instruction: 'Nhấn "Sao chép" → Mở ChatGPT/Claude/Gemini → Paste → Enter',
        helpTitle: '📋 Xuất Spec (Prompt)',
        helpDesc: 'Xuất prompt để paste vào AI. Khác với Xuất Kết Quả - đây là bước TRƯỚC KHI xử lý.',
    },
};

// Generate spec with language
function generateLocalizedSpec(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage
): string {
    const date = new Date().toISOString().split('T')[0];

    // Build user input section
    const userInputLines = Object.entries(values)
        .filter(([, value]) => value && value.trim())
        .map(([key, value]) => {
            const field = template.fields.find(f => f.id === key);
            const label = field?.label || key;
            return `- **${label}:** ${value}`;
        })
        .join('\n');

    // Build expected output section
    const expectedOutput = template.outputExpected
        ?.map(item => `- ${item}`)
        .join('\n') || '- Comprehensive analysis\n- Actionable recommendations';

    const labels = lang === 'vi' ? {
        specTitle: 'Đặc Tả Nhiệm Vụ CVF',
        generated: 'Ngày tạo',
        templateLabel: 'Template',
        category: 'Danh mục',
        context: 'Bối cảnh',
        userInput: 'Thông tin đầu vào',
        task: 'Nhiệm vụ',
        expectedOutput: 'Định dạng kết quả mong muốn',
        instructions: 'Hướng dẫn cho AI',
        instructionList: [
            'Giải quyết tất cả các tiêu chí thành công',
            'Tuân theo cấu trúc định dạng kết quả',
            'Đưa ra insights và khuyến nghị cụ thể',
            'Sử dụng ngôn ngữ chuyên nghiệp, rõ ràng',
            'Bao gồm ví dụ cụ thể khi có thể',
        ],
        footer: 'Sao chép spec này và paste vào AI yêu thích của bạn (ChatGPT, Claude, Gemini, v.v.)',
        noInput: '(Chưa có thông tin)'
    } : {
        specTitle: 'CVF Task Specification',
        generated: 'Generated',
        templateLabel: 'Template',
        category: 'Category',
        context: 'Context',
        userInput: 'User Input',
        task: 'Task',
        expectedOutput: 'Expected Output Format',
        instructions: 'Instructions for AI',
        instructionList: [
            'Addresses all the success criteria listed in the Task section',
            'Follows the Expected Output Format structure',
            'Provides actionable insights and recommendations',
            'Uses clear, professional language',
            'Includes specific examples where applicable',
        ],
        footer: 'Copy this entire specification and paste into your preferred AI assistant (ChatGPT, Claude, Gemini, etc.)',
        noInput: '(No input provided)'
    };

    // Generate intent
    let intent = template.intentPattern;
    Object.entries(values).forEach(([key, value]) => {
        intent = intent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || 'N/A');
    });

    return `---
# ${labels.specTitle}
**${labels.generated}:** ${date}
**${labels.templateLabel}:** ${template.name}
**${labels.category}:** ${template.category}
---

## 📋 ${labels.context}

**${labels.templateLabel}:** ${template.icon} ${template.name}

${template.description}

---

## 📝 ${labels.userInput}

${userInputLines || labels.noInput}

---

## 🎯 ${labels.task}

${intent}

---

## 📤 ${labels.expectedOutput}

${expectedOutput}

---

## 💡 ${labels.instructions}

${labels.instructionList.map((item, i) => `${i + 1}. ${item}`).join('\n')}

---

> **CVF v1.5 UX Platform**
> ${labels.footer}
`;
}

export function SpecExport({ template, values, onClose }: SpecExportProps) {
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportLang, setExportLang] = useState<ExportLanguage>('vi');

    const labels = specLabels[exportLang];
    const spec = generateLocalizedSpec(template, values, exportLang);

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(spec);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleExportToFile = () => {
        const blob = new Blob([spec], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-spec-${template.id}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {labels.helpTitle}
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Help description */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    <strong>💡 {exportLang === 'vi' ? 'Lưu ý' : 'Note'}:</strong> {labels.helpDesc}
                </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {labels.description}
            </p>

            {/* Language Selector */}
            <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">{labels.langLabel}:</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setExportLang('vi')}
                        className={`px-3 py-1 text-sm rounded ${exportLang === 'vi'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                    <button
                        onClick={() => setExportLang('en')}
                        className={`px-3 py-1 text-sm rounded ${exportLang === 'en'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🇺🇸 English
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={handleCopyToClipboard}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${copied
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {copied ? (
                        <>
                            <span>✓</span>
                            {labels.copied}
                        </>
                    ) : (
                        <>
                            <span>📋</span>
                            {labels.copyBtn}
                        </>
                    )}
                </button>

                <button
                    onClick={handleExportToFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                    <span>💾</span>
                    {labels.exportBtn}
                </button>

                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                    <span>{showPreview ? '🙈' : '👁️'}</span>
                    {showPreview ? labels.hidePreviewBtn : labels.previewBtn}
                </button>
            </div>

            {/* Quick Copy for Specific AIs */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">{labels.quickPaste}</span>
                <a
                    href="https://chat.openai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                >
                    ChatGPT ↗
                </a>
                <a
                    href="https://claude.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800"
                >
                    Claude ↗
                </a>
                <a
                    href="https://gemini.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                    Gemini ↗
                </a>
            </div>

            {/* Preview */}
            {showPreview && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {spec}
                    </pre>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>{exportLang === 'vi' ? 'Hướng dẫn' : 'Instructions'}:</strong> {labels.instruction}
                </p>
            </div>
        </div>
    );
}
