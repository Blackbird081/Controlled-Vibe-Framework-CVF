'use client';

// Text Encoding Exception: Vietnamese governance guidance and established UI symbols.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { getRiskOption, getRolePhaseAuthority } from '@/lib/governance-model';
import { inferRiskLevelFromText } from '@/lib/risk-check';
import {
    GovernanceState,
    PHASE_OPTIONS,
    ROLE_OPTIONS,
    RISK_OPTIONS,
    CVFPhaseToolkit,
    CVFRole,
    CVFRiskLevel,
    saveGovernanceState,
    loadGovernanceState,
    isRiskAllowed,
    autoDetectGovernance,
    type AutoDetectResult,
} from '@/lib/governance-context';
import { getApprovalNotificationManager, type ApprovalNotification } from '@/lib/approval-notifications';

interface GovernanceBarProps {
    plainLabels?: boolean;
    onStateChange: (state: GovernanceState) => void;
    compact?: boolean;
    /** Optional: pass current chat message for auto-detection */
    lastMessage?: string;
    /** Optional: callback when approval panel should open */
    onOpenApprovalPanel?: () => void;
}

type DetectionMode = 'auto' | 'manual';

export function GovernanceBar({ onStateChange, compact = false, plainLabels = false, lastMessage, onOpenApprovalPanel }: GovernanceBarProps) {
    const { language } = useLanguage();
    const [state, setState] = useState<GovernanceState>(() => loadGovernanceState());
    const [detectionMode, setDetectionMode] = useState<DetectionMode>('auto');
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [lastApprovalNotification, setLastApprovalNotification] = useState<ApprovalNotification | null>(null);
    const [advancedMode, setAdvancedMode] = useState(() => {
        if (typeof window !== 'undefined') {
            try { return localStorage.getItem('cvf_governance_advanced') === 'true'; } catch { return false; }
        }
        return false;
    });

    const autoResult = useMemo<AutoDetectResult | null>(() => {
        if (detectionMode !== 'auto' || !lastMessage || !state.toolkitEnabled) return null;
        const detected = autoDetectGovernance({ messageText: lastMessage });
        return {
            ...detected,
            riskLevel: inferRiskLevelFromText(lastMessage, { floor: state.riskLevel }) ?? state.riskLevel,
        };
    }, [detectionMode, lastMessage, state.toolkitEnabled, state.riskLevel]);

    const effectiveState = useMemo<GovernanceState>(() => {
        if (detectionMode === 'auto' && autoResult) {
            return {
                ...state,
                phase: autoResult.phase,
                role: autoResult.role,
                riskLevel: autoResult.riskLevel,
            };
        }
        return state;
    }, [state, detectionMode, autoResult]);

    // Approval notification subscription
    useEffect(() => {
        const manager = getApprovalNotificationManager();
        const unsubscribe = manager.subscribe((notification) => {
            setLastApprovalNotification(notification);
            if (notification.type === 'created') {
                setPendingApprovals(prev => prev + 1);
            } else if (notification.type === 'final_approved' || notification.type === 'final_rejected') {
                setPendingApprovals(prev => Math.max(0, prev - 1));
            }
        });
        return unsubscribe;
    }, []);

    // Persist advancedMode to localStorage
    useEffect(() => {
        try { localStorage.setItem('cvf_governance_advanced', String(advancedMode)); } catch { /* ignore */ }
    }, [advancedMode]);

    useEffect(() => {
        saveGovernanceState(effectiveState);
        onStateChange(effectiveState);
    }, [effectiveState, onStateChange]);

    const handleToggle = () => {
        setState(prev => ({ ...prev, toolkitEnabled: !prev.toolkitEnabled }));
    };

    const handlePhaseChange = (phase: CVFPhaseToolkit) => {
        setDetectionMode('manual');
        setState(prev => ({ ...prev, phase }));
    };

    const handleRoleChange = (role: CVFRole) => {
        setDetectionMode('manual');
        setState(prev => ({ ...prev, role }));
    };

    const handleRiskChange = (riskLevel: CVFRiskLevel) => {
        setDetectionMode('manual');
        setState(prev => ({ ...prev, riskLevel }));
    };

    const switchToAuto = useCallback(() => {
        setDetectionMode('auto');
    }, []);

    const rolePhase = getRolePhaseAuthority(effectiveState.phase, effectiveState.role);
    const riskValid = isRiskAllowed(effectiveState.riskLevel, effectiveState.phase, effectiveState.role);
    const isVi = language === 'vi';
    const workRulesLabel = isVi ? 'Quy tắc làm việc' : 'Work rules';
    const blockedRisk = effectiveState.riskLevel === 'R4' ? getRiskOption(effectiveState.riskLevel) : undefined;

    return (
        <div className={`
            border rounded-lg transition-all duration-300
            ${state.toolkitEnabled
                ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
            }
            ${compact ? 'p-2' : 'p-3'}
        `}>
            {/* Header with toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                        <span aria-hidden="true">🛡️</span> {plainLabels ? workRulesLabel : 'CVF Toolkit'}
                    </span>
                    {state.toolkitEnabled && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">
                            {isVi ? 'Đang hoạt động' : 'Active'}
                        </span>
                    )}
                    {/* Auto/Manual toggle */}
                    {state.toolkitEnabled && (
                        <button
                            onClick={() => {
                                if (detectionMode === 'auto') {
                                    if (autoResult) {
                                        setState(prev => ({
                                            ...prev,
                                            phase: autoResult.phase,
                                            role: autoResult.role,
                                            riskLevel: autoResult.riskLevel,
                                        }));
                                    }
                                    setDetectionMode('manual');
                                    return;
                                }
                                switchToAuto();
                            }}
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium transition-colors
                                ${detectionMode === 'auto'
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                            title={detectionMode === 'auto'
                                ? (isVi ? 'Đang tự động nhận diện. Click để chuyển sang manual' : 'Auto-detecting. Click for manual')
                                : (isVi ? 'Đang chọn thủ công. Click để bật auto' : 'Manual mode. Click for auto')
                            }
                        >
                            {detectionMode === 'auto' ? '🤖 Auto' : '✋ Manual'}
                        </button>
                    )}

                    {/* Approval status indicator */}
                    {state.toolkitEnabled && (pendingApprovals > 0 || lastApprovalNotification) && (
                        <button
                            onClick={onOpenApprovalPanel}
                            className="relative text-xs px-1.5 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                            title={isVi ? `${pendingApprovals} yêu cầu chờ duyệt` : `${pendingApprovals} pending approval(s)`}
                        >
                            📋 {isVi ? 'Duyệt' : 'Approvals'}
                            {pendingApprovals > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                                    {pendingApprovals}
                                </span>
                            )}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    className={`
                        relative w-11 h-6 rounded-full transition-colors duration-200
                        ${state.toolkitEnabled
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }
                    `}
                    aria-label={plainLabels ? workRulesLabel : 'Toggle CVF Toolkit'}
                    aria-pressed={state.toolkitEnabled}
                >
                    <span className={`
                        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                        transition-transform duration-200 shadow-sm
                        ${state.toolkitEnabled ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                </button>
            </div>

            {/* Controls - only show when enabled */}
            {state.toolkitEnabled && (
                <>
                    {/* Simple/Advanced toggle */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {advancedMode
                                ? (isVi ? 'Chế độ nâng cao' : 'Advanced mode')
                                : (isVi ? 'Chế độ đơn giản — AI tự điều chỉnh' : 'Simple mode — AI auto-adjusts')}
                        </span>
                        <button
                            onClick={() => setAdvancedMode(prev => !prev)}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {advancedMode ? (isVi ? 'Đơn giản' : 'Simple') : (isVi ? 'Nâng cao' : 'Advanced')}
                        </button>
                    </div>

                    {advancedMode && (
                        <div className={`
                    grid gap-2 transition-all duration-300
                    ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}
                `}>
                            {/* Phase selector */}
                            <div>
                                <label
                                    className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                                    title={isVi ? 'Bạn đang ở giai đoạn nào của dự án?' : 'What stage of the project are you in?'}
                                >
                                    📋 Phase {detectionMode === 'auto' && autoResult && (
                                        <span className="text-purple-500 text-[10px]">
                                            ({autoResult.confidence})
                                        </span>
                                    )}
                                </label>
                                <select
                                    value={effectiveState.phase}
                                    onChange={(e) => handlePhaseChange(e.target.value as CVFPhaseToolkit)}
                                    className={`w-full text-sm rounded-md border px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                                ${detectionMode === 'auto'
                                            ? 'border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                        }`}
                                >
                                    {PHASE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.icon} {isVi ? opt.label : opt.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role selector */}
                            <div>
                                <label
                                    className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                                    title={isVi ? 'Vai trò của bạn trong team' : 'Your role in the team'}
                                >
                                    👤 Role
                                </label>
                                <select
                                    value={effectiveState.role}
                                    onChange={(e) => handleRoleChange(e.target.value as CVFRole)}
                                    className={`w-full text-sm rounded-md border px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                                ${detectionMode === 'auto'
                                            ? 'border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                        }`}
                                >
                                    {ROLE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.icon} {isVi ? opt.label : opt.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Risk selector */}
                            <div>
                                <label
                                    className="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                                    title={isVi ? 'Mức độ rủi ro của task này?' : 'How risky is this task?'}
                                >
                                    ⚠️ Risk
                                </label>
                                <select
                                    value={effectiveState.riskLevel}
                                    onChange={(e) => handleRiskChange(e.target.value as CVFRiskLevel)}
                                    className={`
                                w-full text-sm rounded-md border px-2 py-1.5 focus:ring-1
                                ${!riskValid
                                            ? 'border-red-500 bg-red-50 dark:bg-red-950 focus:ring-red-500 focus:border-red-500'
                                            : detectionMode === 'auto'
                                                ? 'border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 focus:ring-blue-500 focus:border-blue-500'
                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500'
                                        }
                            `}
                                >
                                    {blockedRisk && (
                                        <option value={blockedRisk.value} disabled>
                                            {isVi ? blockedRisk.label : blockedRisk.labelEn} ({blockedRisk.value})
                                        </option>
                                    )}
                                    {RISK_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {isVi ? opt.label : opt.labelEn} ({opt.value})
                                        </option>
                                    ))}
                                </select>
                                {!riskValid && (
                                    <p className="text-xs text-red-500 mt-0.5">
                                        {blockedRisk
                                            ? (isVi ? 'R4 bị chặn' : 'R4 is blocked')
                                            : (isVi ? 'Rủi ro vượt giới hạn của vai trò và giai đoạn' : 'Risk exceeds the role and phase limit')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {advancedMode && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {rolePhase
                                ? (isVi ? `Giới hạn theo vai trò và giai đoạn (${rolePhase.maxRisk})` : `Role and phase limit (${rolePhase.maxRisk})`)
                                : (isVi ? 'Vai trò này không được phép trong giai đoạn đã chọn' : 'This role cannot act in the selected phase')}
                        </p>
                    )}
                </>
            )}

            {/* Auto-detect info line */}
            {state.toolkitEnabled && detectionMode === 'auto' && autoResult && (
                <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-1.5 truncate">
                    🤖 {isVi ? 'Tự nhận diện' : 'Auto-detected'}: {autoResult.reason}
                </p>
            )}
        </div>
    );
}
