'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import type { GovernanceApproveResult } from '@/types/governance-engine';

interface ApprovalStep {
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    approver?: string;
    timestamp?: string;
    comment?: string;
    slaHours?: number;
}

interface ApprovalPanelProps {
    requestId?: string;
    riskLevel?: string;
    currentUserRole?: string;
    steps?: ApprovalStep[];
    slaDeadline?: string;
    escalationStatus?: string;
    onApprove?: (result: GovernanceApproveResult) => void;
    onReject?: (result: GovernanceApproveResult) => void;
    language?: 'vi' | 'en'; // deprecated: uses useLanguage() now
}

const LABELS = {
    vi: {
        title: 'Quy trình duyệt',
        approve: 'Duyệt',
        reject: 'Từ chối',
        comment: 'Ghi chú',
        commentPlaceholder: 'Lý do duyệt/từ chối...',
        slaRemaining: 'SLA còn lại',
        escalated: 'Đã leo thang',
        pending: 'Đang chờ',
        approved: 'Đã duyệt',
        rejected: 'Đã từ chối',
        risk: 'Mức rủi ro',
        step: 'Bước',
        of: 'trên',
        submitting: 'Đang gửi...',
        error: 'Lỗi gửi quyết định',
        expired: 'Quá hạn SLA',
    },
    en: {
        title: 'Approval Workflow',
        approve: 'Approve',
        reject: 'Reject',
        comment: 'Comment',
        commentPlaceholder: 'Reason for approval/rejection...',
        slaRemaining: 'SLA remaining',
        escalated: 'Escalated',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        risk: 'Risk Level',
        step: 'Step',
        of: 'of',
        submitting: 'Submitting...',
        error: 'Failed to submit decision',
        expired: 'SLA expired',
    },
};

const ROLE_ICONS: Record<string, string> = {
    DEVELOPER: '👨‍💻',
    TEAM_LEAD: '👔',
    SECURITY_OFFICER: '🔐',
    EXECUTIVE_APPROVER: '🏛️',
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800',
    approved: 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20',
    rejected: 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20',
    escalated: 'border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20',
};

function formatTimeRemaining(deadline: string): { text: string; urgent: boolean; expired: boolean } {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return { text: '', urgent: true, expired: true };

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return { text: `${hours}h ${minutes}m`, urgent: hours < 1, expired: false };
    }
    return { text: `${minutes}m`, urgent: true, expired: false };
}

export function ApprovalPanel({
    requestId = '',
    riskLevel = 'R0',
    currentUserRole,
    steps = [],
    slaDeadline,
    escalationStatus,
    onApprove,
    onReject,
    language: langProp,
}: ApprovalPanelProps) {
    const { language: contextLanguage } = useLanguage();
    const language = langProp || contextLanguage;
    const l = LABELS[language];
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slaDisplay, setSlaDisplay] = useState<{ text: string; urgent: boolean; expired: boolean }>({ text: '', urgent: false, expired: false });

    // SLA countdown
    useEffect(() => {
        if (!slaDeadline) return;

        const update = () => setSlaDisplay(formatTimeRemaining(slaDeadline));
        update();
        const interval = setInterval(update, 60_000); // Update every minute
        return () => clearInterval(interval);
    }, [slaDeadline]);

    const currentStep = steps.findIndex(s => s.status === 'pending');
    const canAct = currentUserRole && currentStep >= 0 &&
        steps[currentStep]?.role === currentUserRole;

    const handleSubmit = useCallback(async (decision: 'APPROVED' | 'REJECTED') => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/governance/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    approver_id: currentUserRole || 'unknown',
                    decision,
                    comment: comment || undefined,
                }),
            });

            const json = await res.json();
            if (!json.success) {
                setError(json.error || l.error);
                return;
            }

            if (decision === 'APPROVED') {
                onApprove?.(json.data);
            } else {
                onReject?.(json.data);
            }
            setComment('');
        } catch {
            setError(l.error);
        } finally {
            setSubmitting(false);
        }
    }, [requestId, currentUserRole, comment, l.error, onApprove, onReject]);

    return (
        <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    📋 {l.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {l.risk}: {riskLevel}
                    </span>
                    {escalationStatus && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            ⚡ {l.escalated}
                        </span>
                    )}
                </div>
            </div>

            {/* SLA Timer */}
            {slaDeadline && (
                <div className={`flex items-center gap-2 text-sm ${
                    slaDisplay.expired
                        ? 'text-red-600 dark:text-red-400'
                        : slaDisplay.urgent
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400'
                }`}>
                    <span>⏱️</span>
                    <span>
                        {slaDisplay.expired ? l.expired : `${l.slaRemaining}: ${slaDisplay.text}`}
                    </span>
                </div>
            )}

            {/* Pipeline visualization */}
            <div className="space-y-2">
                {steps.map((step, idx) => {
                    const isCurrent = idx === currentStep;
                    const icon = ROLE_ICONS[step.role] || '👤';
                    return (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                STATUS_COLORS[step.status]
                            } ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{icon}</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {step.role.replace(/_/g, ' ')}
                                        </p>
                                        {step.approver && (
                                            <p className="text-xs text-gray-500">{step.approver}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                        step.status === 'approved' ? 'bg-green-200 text-green-800 dark:bg-green-800/40 dark:text-green-300' :
                                        step.status === 'rejected' ? 'bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-300' :
                                        step.status === 'escalated' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/40 dark:text-yellow-300' :
                                        'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                        {l[step.status as keyof typeof l] || step.status}
                                    </span>
                                    {step.timestamp && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(step.timestamp).toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {step.comment && (
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">
                                    &quot;{step.comment}&quot;
                                </p>
                            )}

                            {/* Connector line */}
                            {idx < steps.length - 1 && (
                                <div className="flex justify-center mt-1">
                                    <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-600" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action area */}
            {canAct && (
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={l.commentPlaceholder}
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSubmit('APPROVED')}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {submitting ? l.submitting : `✅ ${l.approve}`}
                        </button>
                        <button
                            onClick={() => handleSubmit('REJECTED')}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {submitting ? l.submitting : `❌ ${l.reject}`}
                        </button>
                    </div>
                </div>
            )}

            {/* Progress */}
            <div className="text-xs text-gray-500 text-center">
                {l.step} {Math.max(currentStep + 1, steps.filter(s => s.status !== 'pending').length)} {l.of} {steps.length}
            </div>

            {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
            )}
        </div>
    );
}
