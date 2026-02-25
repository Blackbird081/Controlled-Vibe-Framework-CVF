'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from './Settings';
import { useLanguage } from '@/lib/i18n';
import { logEnforcementDecision } from '@/lib/enforcement-log';

interface ProcessingScreenProps {
    templateName: string;
    templateId?: string;
    inputs?: Record<string, string>;
    intent?: string;
    onComplete: (output: string) => void;
    onCancel: () => void;
}

export function ProcessingScreen({
    templateName,
    templateId,
    inputs,
    intent,
    onComplete,
    onCancel
}: ProcessingScreenProps) {
    const { settings } = useSettings();
    const { language } = useLanguage();
    const isVi = language === 'vi';
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(isVi ? 'Đang khởi tạo...' : 'Initializing...');
    const [error, setError] = useState<string | null>(null);
    const [isRealExecution, setIsRealExecution] = useState(() => Boolean(inputs && intent && Object.keys(inputs).length > 0));

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
                }),
            });

            setProgress(50);
            setStatus(isVi ? 'Đang xử lý phản hồi...' : 'Processing response...');

            const data = await response.json();
            const enforcement = data.enforcement;
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
                return true;
            }

            if (enforcement?.status === 'NEEDS_APPROVAL') {
                setError(data.error || (isVi ? 'Cần phê duyệt trước khi thực thi.' : 'Approval required before execution.'));
                return true;
            }

            // If real execution fails, show error but fall back to mock
            setError(data.error || (isVi ? 'Thực thi API thất bại' : 'API execution failed'));
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            return false;
        }
    }, [templateId, templateName, inputs, intent, onComplete, settings.preferences.defaultExportMode, isVi]);

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

                {error && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4" role="alert" aria-live="assertive">
                        ⚠️ {error} — {isVi ? 'Đang dùng chế độ demo' : 'Using demo mode'}
                    </p>
                )}

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
