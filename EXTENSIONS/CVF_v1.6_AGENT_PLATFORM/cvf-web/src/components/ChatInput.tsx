'use client';

import { useRef } from 'react';

interface ChatInputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    attachedFile: { name: string; content: string } | null;
    onRemoveAttachment: () => void;
    onFileSelected: (file: File) => void;
    language: 'vi' | 'en';
    placeholder: string;
    sendLabel: string;
}

export function ChatInput({
    input,
    onInputChange,
    onSend,
    isLoading,
    attachedFile,
    onRemoveAttachment,
    onFileSelected,
    language,
    placeholder,
    sendLabel,
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onFileSelected(file);
        e.target.value = '';
    };

    const hasContent = input.trim().length > 0 || !!attachedFile;

    return (
        <>
            {attachedFile && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                    <span>📎</span>
                    <span className="flex-1 truncate text-blue-700 dark:text-blue-300">{attachedFile.name}</span>
                    <button
                        onClick={onRemoveAttachment}
                        className="text-red-500 hover:text-red-700"
                        title={language === 'vi' ? 'Xóa file' : 'Remove file'}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.js,.ts,.tsx,.css,.html,.py,.yaml,.yml"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label={language === 'vi' ? 'Đính kèm file' : 'Attach file'}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
                              hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors sm:w-auto w-full"
                    title={language === 'vi' ? 'Đính kèm file' : 'Attach file'}
                >
                    📎
                </button>

                <textarea
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={attachedFile
                        ? (language === 'vi' ? `Nhập tin nhắn về ${attachedFile.name}...` : `Type about ${attachedFile.name}...`)
                        : placeholder}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                              bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px]
                              disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={language === 'vi' ? 'Nhập tin nhắn' : 'Message input'}
                />
                <button
                    onClick={onSend}
                    disabled={!hasContent || isLoading}
                    title={language === 'vi' ? 'Gửi tin nhắn (Enter)' : 'Send message (Enter)'}
                    aria-label={language === 'vi' ? 'Gửi tin nhắn' : 'Send message'}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                              disabled:cursor-not-allowed text-white rounded-xl font-medium
                              transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {sendLabel}
                </button>
            </div>
        </>
    );
}
