'use client';

import { useState } from 'react';

interface OverrideRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    blockedAction: string;
    riskLevel: string;
    onSubmit: (override: OverrideRequest) => Promise<void>;
    language?: 'vi' | 'en';
}

export interface OverrideRequest {
    requestId: string;
    justification: string;
    scope: 'request' | 'project';
    expiryDays: number;
    riskAcknowledged: boolean;
}

const LABELS = {
    vi: {
        title: '🔓 Yêu cầu ghi đè',
        blocked: 'Hành động bị chặn',
        justification: 'Lý do ghi đè',
        justificationPlaceholder: 'Giải thích tại sao cần ghi đè chính sách này (tối thiểu 50 ký tự)...',
        scope: 'Phạm vi',
        scopeRequest: 'Chỉ yêu cầu này',
        scopeProject: 'Toàn dự án',
        expiry: 'Thời hạn (ngày)',
        riskAck: 'Tôi hiểu rủi ro và chịu trách nhiệm',
        submit: 'Gửi yêu cầu ghi đè',
        cancel: 'Hủy',
        submitting: 'Đang gửi...',
        minChars: 'Tối thiểu 50 ký tự',
    },
    en: {
        title: '🔓 Override Request',
        blocked: 'Blocked action',
        justification: 'Justification',
        justificationPlaceholder: 'Explain why this policy override is needed (minimum 50 characters)...',
        scope: 'Scope',
        scopeRequest: 'This request only',
        scopeProject: 'Project-wide',
        expiry: 'Expiry (days)',
        riskAck: 'I understand the risks and accept responsibility',
        submit: 'Submit Override Request',
        cancel: 'Cancel',
        submitting: 'Submitting...',
        minChars: 'Minimum 50 characters',
    },
};

export function OverrideRequestModal({
    isOpen,
    onClose,
    requestId,
    blockedAction,
    riskLevel,
    onSubmit,
    language = 'vi',
}: OverrideRequestModalProps) {
    const l = LABELS[language];
    const [justification, setJustification] = useState('');
    const [scope, setScope] = useState<'request' | 'project'>('request');
    const [expiryDays, setExpiryDays] = useState(7);
    const [riskAcknowledged, setRiskAcknowledged] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isValid = justification.trim().length >= 50 && riskAcknowledged;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                requestId,
                justification: justification.trim(),
                scope,
                expiryDays: Math.min(30, Math.max(1, expiryDays)),
                riskAcknowledged,
            });
            setJustification('');
            setRiskAcknowledged(false);
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
                    {l.title}
                </h3>

                {/* Blocked action info */}
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                    <span className="text-xs text-gray-500">{l.blocked}:</span>
                    <span className="text-sm font-mono text-red-600 dark:text-red-400">{blockedAction}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded">
                        {riskLevel}
                    </span>
                </div>

                {/* Justification */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {l.justification}
                    </label>
                    <textarea
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder={l.justificationPlaceholder}
                        rows={3}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    <p className={`text-xs mt-0.5 ${justification.trim().length >= 50 ? 'text-green-500' : 'text-gray-400'}`}>
                        {justification.trim().length}/50 {l.minChars}
                    </p>
                </div>

                {/* Scope + Expiry */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {l.scope}
                        </label>
                        <select
                            value={scope}
                            onChange={e => setScope(e.target.value as 'request' | 'project')}
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        >
                            <option value="request">{l.scopeRequest}</option>
                            <option value="project">{l.scopeProject}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {l.expiry}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            value={expiryDays}
                            onChange={e => setExpiryDays(parseInt(e.target.value) || 7)}
                            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>

                {/* Risk acknowledgment */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={riskAcknowledged}
                        onChange={e => setRiskAcknowledged(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{l.riskAck}</span>
                </label>

                {error && <p className="text-xs text-red-500">{error}</p>}

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
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {submitting ? l.submitting : l.submit}
                    </button>
                </div>
            </div>
        </div>
    );
}
