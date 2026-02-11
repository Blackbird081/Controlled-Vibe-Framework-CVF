'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Template, TemplateField } from '@/types';
import { generateIntent } from '@/lib/templates';
import { SpecExport } from './SpecExport';

interface DynamicFormProps {
    template: Template;
    onSubmit: (values: Record<string, string>, intent: string) => void;
    onBack: () => void;
    onSendToAgent?: (spec: string) => void;
}

function FormField({ field, register, errors }: {
    field: TemplateField;
    register: any;
    errors: any;
}) {
    const baseClasses = `
    w-full px-4 py-3 rounded-lg
    border border-gray-300 dark:border-gray-600
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all duration-200
  `;

    const errorClasses = errors[field.id] ? 'border-red-500 focus:ring-red-500' : '';

    switch (field.type) {
        case 'textarea':
            return (
                <textarea
                    {...register(field.id, { required: field.required })}
                    placeholder={field.placeholder}
                    rows={field.rows || 4}
                    className={`${baseClasses} ${errorClasses} resize-none`}
                />
            );

        case 'select':
            return (
                <select
                    {...register(field.id)}
                    defaultValue={field.default}
                    className={`${baseClasses} ${errorClasses}`}
                >
                    {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        default:
            return (
                <input
                    type="text"
                    {...register(field.id, { required: field.required })}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`${baseClasses} ${errorClasses}`}
                />
            );
    }
}

export function DynamicForm({ template, onSubmit, onBack, onSendToAgent }: DynamicFormProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSpecExport, setShowSpecExport] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    const formValues = watch();
    const previewIntent = generateIntent(template, formValues);

    const requiredFields = template.fields.filter(f => f.section !== 'advanced');
    const advancedFields = template.fields.filter(f => f.section === 'advanced');

    const onFormSubmit = (data: Record<string, string>) => {
        const intent = generateIntent(template, data);
        onSubmit(data, intent);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span>{template.icon}</span>
                        <span>{template.name}</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                {/* Required Fields */}
                {requiredFields.map((field) => (
                    <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <FormField field={field} register={register} errors={errors} />
                        {errors[field.id] && (
                            <p className="mt-1 text-sm text-red-500">This field is required</p>
                        )}
                        {field.hint && (
                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                <span>💡</span>
                                <span>{field.hint}</span>
                            </p>
                        )}
                        {field.example && (
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                                VD: {field.example}
                            </p>
                        )}
                    </div>
                ))}

                {/* Advanced Fields Toggle */}
                {advancedFields.length > 0 && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            {showAdvanced ? 'Ẩn' : 'Hiện'} Tùy chọn nâng cao ({advancedFields.length})
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                {advancedFields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {field.label}
                                        </label>
                                        <FormField field={field} register={register} errors={errors} />
                                        {field.hint && (
                                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                                <span>💡</span>
                                                <span>{field.hint}</span>
                                            </p>
                                        )}
                                        {field.example && (
                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                                                VD: {field.example}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {showPreview ? '🔽 Ẩn xem trước' : '👁️ Xem trước Prompt'}
                    </button>

                    {showPreview && (
                        <div className="mt-4 p-4 bg-gray-900 dark:bg-black rounded-lg">
                            <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                                {previewIntent}
                            </pre>
                        </div>
                    )}
                </div>

                {/* AI Quick Links */}
                <div className="flex flex-wrap items-center gap-2 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Paste vào AI:</span>
                    <a
                        href="https://chat.openai.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    >
                        <span>🤖</span> ChatGPT
                    </a>
                    <a
                        href="https://claude.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                    >
                        <span>🧠</span> Claude
                    </a>
                    <a
                        href="https://gemini.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                        <span>✨</span> Gemini
                    </a>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {/* Export/Copy Spec Button */}
                    <button
                        type="button"
                        onClick={() => setShowSpecExport(!showSpecExport)}
                        className="flex-1 py-4 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                         text-gray-700 dark:text-gray-300 font-semibold rounded-lg
                         transition-all duration-200
                         flex items-center justify-center gap-2"
                    >
                        <span>📋</span>
                        <span>Xuất Prompt</span>
                    </button>

                    {/* Submit Button - Opens SpecExport to choose mode first */}
                    <button
                        type="button"
                        onClick={() => setShowSpecExport(true)}
                        className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 
                         text-white font-semibold rounded-lg
                         shadow-lg hover:shadow-xl
                         transition-all duration-200
                         flex items-center justify-center gap-2"
                    >
                        <span>Gửi đi</span>
                        <span>🚀</span>
                    </button>
                </div>
            </form>

            {/* Spec Export Panel */}
            {showSpecExport && (
                <div className="mt-6">
                    <SpecExport
                        template={template}
                        values={formValues}
                        onClose={() => setShowSpecExport(false)}
                        onSendToAgent={onSendToAgent}
                    />
                </div>
            )}
        </div>
    );
}

