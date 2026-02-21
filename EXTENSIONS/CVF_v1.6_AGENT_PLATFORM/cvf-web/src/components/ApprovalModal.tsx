'use client';

import { useState } from 'react';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    riskLevel: string;
    reasons: string[];
    requiredApprovers: string[];
    onSubmit: (comment: string) => Promise<void>;
    language?: 'vi' | 'en';
}

const LABELS = {
    vi: {
        title: 'Yêu cầu duyệt',
        riskLevel: 'Mức rủi ro',
        reasons: 'Lý do cần duyệt',
        requiredApprovers: 'Người duyệt cần thiết',
        justification: 'Giải thích lý do',
        justificationPlaceholder: 'Giải thích tại sao yêu cầu này cần được duyệt (tối thiểu 50 ký tự)...',
        submit: 'Gửi yêu cầu duyệt',
        cancel: 'Hủy',
        submitting: 'Đang gửi...',
        minChars: 'Tối thiểu 50 ký tự',
    },
    en: {
        title: 'Approval Required',
        riskLevel: 'Risk Level',
        reasons: 'Reasons for approval',
        requiredApprovers: 'Required approvers',
        justification: 'Justification',
        justificationPlaceholder: 'Explain why this request should be approved (minimum 50 characters)...',
        submit: 'Submit for Approval',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        minChars: 'Minimum 50 characters',
    },
};

export function ApprovalModal({
    isOpen,
    onClose,
    riskLevel,
    reasons,
    requiredApprovers,
    onSubmit,
    language = 'vi',
}: ApprovalModalProps) {
    const l = LABELS[language];
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isValid = comment.trim().length >= 50;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(comment);
            setComment('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ⚠️ {l.title}
                </h3>

                {/* Risk Level */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{l.riskLevel}:</span>
                    <span className="px-2 py-0.5 text-sm font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {riskLevel}
                    </span>
                </div>

                {/* Reasons */}
                {reasons.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {l.reasons}:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Required Approvers */}
                {requiredApprovers.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {l.requiredApprovers}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {requiredApprovers.map((approver, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                    {approver.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Justification */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {l.justification}
                    </label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={l.justificationPlaceholder}
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    <p className={`text-xs mt-1 ${
                        isValid ? 'text-green-500' : 'text-gray-400'
                    }`}>
                        {comment.trim().length}/50 {l.minChars}
                    </p>
                </div>

                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {l.cancel}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {submitting ? l.submitting : l.submit}
                    </button>
                </div>
            </div>
        </div>
    );
}
