'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from './Settings';
import { useLanguage } from '@/lib/i18n';
import { logEnforcementDecision } from '@/lib/enforcement-log';
import { getSafetyStatus } from '@/lib/safety-status';
import type { SafetyRiskLevel } from '@/lib/safety-status';
import type { ExecutionRequest } from '@/lib/ai';

export interface ProcessingExecutionOverrides {
    mode?: ExecutionRequest['mode'];
    cvfPhase?: ExecutionRequest['cvfPhase'];
    cvfRiskLevel?: ExecutionRequest['cvfRiskLevel'];
    skillPreflightDeclaration?: ExecutionRequest['skillPreflightDeclaration'];
    skillPreflightRecordRef?: ExecutionRequest['skillPreflightRecordRef'];
    skillIds?: ExecutionRequest['skillIds'];
    fileScope?: ExecutionRequest['fileScope'];
}

interface ProcessingScreenProps {
    templateName: string;
    templateId?: string;
    inputs?: Record<string, string>;
    intent?: string;
    executionOverrides?: ProcessingExecutionOverrides;
    onComplete: (output: string) => void;
    onCancel: () => void;
}

export function ProcessingScreen({
    templateName,
    templateId,
    inputs,
    intent,
    executionOverrides,
    onComplete,
    onCancel
}: ProcessingScreenProps) {
    const { settings } = useSettings();
    const { language } = useLanguage();
    const isVi = language === 'vi';
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(isVi ? 'Đang khởi tạo...' : 'Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [guidedResponse, setGuidedResponse] = useState<string | null>(null);
    const [isRealExecution, setIsRealExecution] = useState(() => Boolean(inputs && intent && Object.keys(inputs).length > 0));
    // W92-T1: Approval request state
    const [approvalRequestId, setApprovalRequestId] = useState<string | null>(null);
    const [approvalSubmitting, setApprovalSubmitting] = useState(false);
    const [enforcementStatus, setEnforcementStatus] = useState<string | null>(null);
    // W94-T1: Risk badge state
    const [executionRiskLevel, setExecutionRiskLevel] = useState<SafetyRiskLevel | null>(null);

    // Real API execution
    const executeReal = useCallback(async () => {
        if (!inputs || !intent) return false;

        try {
            setStatus(isVi ? 'Đang kết nối AI...' : 'Connecting to AI provider...');
            setProgress(10);
            const mode = settings.preferences.defaultExportMode || 'governance';

            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: templateId || templateName,
                    templateName,
                    inputs,
                    intent,
                    mode,
                    ...executionOverrides,
                }),
            });

            setProgress(50);
            setStatus(isVi ? 'Đang xử lý phản hồi...' : 'Processing response...');

            const data = await response.json();
            const enforcement = data.enforcement;
            // W94-T1: Extract risk level for badge (R4 → R3 cap for safety-status.ts compat)
            const rawRisk = enforcement?.riskGate?.riskLevel as string | undefined;
            const badgeLevel: SafetyRiskLevel | null =
                rawRisk === 'R0' || rawRisk === 'R1' || rawRisk === 'R2' ? rawRisk :
                rawRisk === 'R3' || rawRisk === 'R4' ? 'R3' : null;
            if (badgeLevel) setExecutionRiskLevel(badgeLevel);
            if (enforcement) {
                logEnforcementDecision({
                    source: 'api_execute',
                    mode,
                    enforcement,
                    context: {
                        templateId: templateId || templateName,
                        templateName,
                        provider: data.provider,
                        model: data.model,
                    },
                });
            }

            setProgress(90);
            setStatus(isVi ? 'Đang hoàn tất...' : 'Finalizing...');

            if (data.success && data.output) {
                setProgress(100);
                setTimeout(() => {
                    onComplete(data.output);
                }, 300);
                return true;
            }

            if (enforcement?.status === 'CLARIFY') {
                const missing = enforcement.specGate?.missing
                    ?.map((field: { label?: string }) => field.label || 'field')
                    .join(', ');
                setError(missing
                    ? (isVi ? `Thiếu thông tin bắt buộc: ${missing}` : `Missing required input: ${missing}`)
                    : (isVi ? 'Cần thêm thông tin trước khi thực thi.' : 'Spec needs additional info before execution.'));
                return true;
            }

            if (enforcement?.status === 'BLOCK') {
                setError(data.error || (isVi ? 'Bị chặn bởi CVF.' : 'Blocked by CVF enforcement.'));
                if (data.guidedResponse) setGuidedResponse(data.guidedResponse);
                return true;
            }

            if (enforcement?.status === 'NEEDS_APPROVAL') {
                setError(data.error || (isVi ? 'Cần phê duyệt trước khi thực thi.' : 'Approval required before execution.'));
                if (data.guidedResponse) setGuidedResponse(data.guidedResponse);
                setEnforcementStatus('NEEDS_APPROVAL');
                return true;
            }

            // If real execution fails, show error but fall back to mock
            setError(data.error || (isVi ? 'Thực thi API thất bại' : 'API execution failed'));
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            return false;
        }
    }, [templateId, templateName, inputs, intent, onComplete, settings.preferences.defaultExportMode, isVi, executionOverrides]);

    // W92-T1: Submit approval request
    const submitApprovalRequest = useCallback(async () => {
        if (!templateId || !intent) return;
        setApprovalSubmitting(true);
        try {
            const response = await fetch('/api/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: templateId || templateName,
                    templateName,
                    intent,
                    reason: error || '',
                }),
            });
            const data = await response.json();
            if (data.success && data.id) {
                setApprovalRequestId(data.id);
            }
        } finally {
            setApprovalSubmitting(false);
        }
    }, [templateId, templateName, intent, error]);

    const runMockExecution = useCallback(() => {
        const statuses = isVi
            ? [
                'Đang khởi tạo...',
                'Đang phân tích ý định...',
                'Đang tạo phản hồi...',
                'Đang kiểm tra chất lượng...',
                'Đang hoàn tất...',
            ]
            : [
                'Initializing...',
                'Parsing intent...',
                'Generating response...',
                'Applying quality checks...',
                'Finalizing output...',
            ];

        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + Math.random() * 15;

                const statusIndex = Math.min(Math.floor(next / 25), statuses.length - 1);
                setStatus(statuses[statusIndex]);

                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        onComplete(generateMockOutput(templateName));
                    }, 500);
                    return 100;
                }
                return next;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [isVi, onComplete, templateName]);

    useEffect(() => {
        // Try real execution first if we have the required data
        if (inputs && intent && Object.keys(inputs).length > 0) {
            const runId = setTimeout(() => {
                executeReal().then(success => {
                    if (!success) {
                        // Fall back to mock on failure
                        setIsRealExecution(false);
                        runMockExecution();
                    }
                });
            }, 0);
            return () => clearTimeout(runId);
        } else {
            // No inputs provided, use mock
            runMockExecution();
        }
    }, [inputs, intent, executeReal, runMockExecution]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center">
                {/* Spinning icon */}
                <div className="w-20 h-20 mx-auto mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div
                        className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        {isRealExecution ? '🤖' : '⏳'}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isRealExecution
                        ? (isVi ? 'AI Đang xử lý...' : 'AI Processing...')
                        : (isVi ? 'Đang xử lý...' : 'Processing...')}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-2" aria-live="polite">
                    {status}
                </p>

                {isRealExecution && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                        🔗 {isVi ? 'Đã kết nối AI' : 'Connected to AI Provider'}
                    </p>
                )}

                {error && !guidedResponse && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4" role="alert" aria-live="assertive">
                        ⚠️ {error} — {isVi ? 'Đang dùng chế độ demo' : 'Using demo mode'}
                    </p>
                )}

                {guidedResponse && (
                    <div
                        className="mt-4 mb-4 mx-auto max-w-md rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-4 text-left"
                        role="alert"
                        aria-live="polite"
                        data-testid="guided-response-panel"
                    >
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            {isVi ? '💡 Bước an toàn tiếp theo' : '💡 Safe next step'}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                            {isVi
                                ? `⚠️ Yêu cầu này cần xem lại: ${error}`
                                : `⚠️ This request needs review: ${error}`}
                        </p>
                        <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                            {guidedResponse}
                        </p>
                    </div>
                )}

                {/* W92-T1: Approval submission flow */}
                {enforcementStatus === 'NEEDS_APPROVAL' && !approvalRequestId && (
                    <div className="mt-3 mb-4 mx-auto max-w-md">
                        <button
                            type="button"
                            onClick={submitApprovalRequest}
                            disabled={approvalSubmitting}
                            data-testid="submit-approval-btn"
                            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50
                                text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {approvalSubmitting
                                ? (isVi ? 'Đang gửi...' : 'Submitting...')
                                : (isVi ? '📋 Gửi yêu cầu phê duyệt' : '📋 Submit for Review')}
                        </button>
                    </div>
                )}

                {approvalRequestId && (
                    <div
                        className="mt-3 mb-4 mx-auto max-w-md rounded-lg border border-amber-200 dark:border-amber-700
                            bg-amber-50 dark:bg-amber-950 p-4 text-left"
                        data-testid="approval-status-panel"
                    >
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                            {isVi ? '✅ Đã gửi yêu cầu phê duyệt' : '✅ Review request submitted'}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
                            {isVi ? 'Mã yêu cầu:' : 'Request ID:'} <span className="font-mono">{approvalRequestId}</span>
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                            {isVi ? 'Trạng thái:' : 'Status:'}{' '}
                            <span className="font-semibold">{isVi ? 'Đang chờ xem xét' : 'Pending review'}</span>
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            {isVi
                                ? 'Quản trị viên sẽ xem xét yêu cầu của bạn. Khi được phê duyệt, bạn có thể thử lại. Khi bị từ chối, bạn sẽ nhận được lý do cụ thể.'
                                : 'An admin will review your request. Once approved, you can retry your task. If rejected, you will receive a specific reason.'}
                        </p>
                    </div>
                )}

                {/* W94-T1: Risk badge */}
                {executionRiskLevel && (() => {
                    const safetyStatus = getSafetyStatus(executionRiskLevel);
                    return (
                        <div
                            data-testid="risk-badge"
                            className="mt-3 mb-4 mx-auto max-w-md rounded-lg border border-gray-200
                                dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3 text-left"
                        >
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {safetyStatus.emoji}{' '}
                                {isVi ? safetyStatus.label.vi : safetyStatus.label.en}
                                <span className="ml-2 font-mono text-gray-400">{executionRiskLevel}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {isVi ? safetyStatus.description.vi : safetyStatus.description.en}
                            </p>
                        </div>
                    );
                })()}

                {/* Progress bar */}
                <div className="w-80 mx-auto">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${isRealExecution
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        {Math.round(progress)}%
                    </p>
                </div>

                {!isRealExecution && (
                    <p className="mt-4 text-sm text-gray-500">
                        {isVi ? 'Ước tính:' : 'Estimated:'} {Math.max(1, Math.round((100 - progress) / 10))} {isVi ? 'giây' : 'seconds'}
                    </p>
                )}

                <button
                    type="button"
                    onClick={onCancel}
                    className="mt-8 px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                     border border-gray-300 dark:border-gray-600 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {isVi ? 'Hủy' : 'Cancel'}
                </button>
            </div>
        </div>
    );
}

function generateMockOutput(templateName: string): string {
    return `# ${templateName} Analysis

## Executive Summary

Based on the provided context and requirements, this analysis presents a comprehensive evaluation with actionable recommendations.

## Key Findings

### Strengths
- Clear strategic direction aligned with market opportunities
- Strong foundation for growth initiatives
- Competitive advantages in key areas

### Areas for Improvement
- Consider diversifying market approach
- Strengthen risk mitigation strategies
- Enhance stakeholder communication

## Detailed Analysis

### Option A: Organic Growth
| Aspect | Assessment |
|--------|------------|
| Risk Level | Low |
| Investment | Moderate |
| Timeline | 12-18 months |
| ROI Potential | 25-40% |

### Option B: Strategic Partnership
| Aspect | Assessment |
|--------|------------|
| Risk Level | Medium |
| Investment | Low |
| Timeline | 6-12 months |
| ROI Potential | 30-50% |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Market volatility | Medium | High | Diversification strategy |
| Execution delays | Low | Medium | Milestone tracking |
| Resource constraints | Medium | Medium | Phased approach |

## Recommendations

1. **Short-term (0-6 months)**
   - Conduct detailed market analysis
   - Establish key partnerships
   - Set up monitoring framework

2. **Medium-term (6-12 months)**
   - Execute pilot programs
   - Measure and iterate
   - Scale successful initiatives

3. **Long-term (12+ months)**
   - Full market expansion
   - Continuous optimization
   - Strategic review and adjustment

## Next Steps

- [ ] Schedule stakeholder alignment meeting
- [ ] Develop detailed implementation roadmap
- [ ] Identify resource requirements
- [ ] Establish success metrics

---
*Generated by CVF v1.5 UX Platform*
`;
}
