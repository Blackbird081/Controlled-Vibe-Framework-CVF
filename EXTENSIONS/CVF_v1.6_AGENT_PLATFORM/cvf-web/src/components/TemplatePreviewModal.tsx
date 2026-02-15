'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    sampleOutput?: string;
}

export function TemplatePreviewModal({ isOpen, onClose, templateName, sampleOutput }: TemplatePreviewModalProps) {
    // Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/50 backdrop-blur-sm"
             role="dialog"
             aria-modal="true"
             aria-label={`Preview: ${templateName}`}
             onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-w-2xl md:max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Preview: {templateName}
                        </h3>
                        <p className="text-sm text-gray-500">Sample output example</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Close preview"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50">
                    {sampleOutput ? (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{sampleOutput}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center text-sm text-gray-400 mb-4">
                                <p className="italic">Sample preview — actual output will vary based on your inputs</p>
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                <ReactMarkdown>{`# ${templateName} — Sample Output\n\n## Executive Summary\n\nThis is a **placeholder preview** showing the typical structure you can expect from this template.\n\n## Key Points\n\n- **Point 1:** Analysis based on your provided context\n- **Point 2:** Actionable recommendations tailored to your situation\n- **Point 3:** Risk assessment with mitigation strategies\n\n## Recommendations\n\n| Priority | Action | Timeline |\n|----------|--------|----------|\n| High | Review strategic options | 1-2 weeks |\n| Medium | Stakeholder alignment | 2-4 weeks |\n| Low | Documentation update | Ongoing |\n\n## Next Steps\n\n1. Fill in the template form with your specific details\n2. Submit to generate a customized analysis\n3. Review, iterate, and export\n\n---\n*This is a sample preview. Your actual output will be personalized.*`}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end safe-area-pb">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
}
