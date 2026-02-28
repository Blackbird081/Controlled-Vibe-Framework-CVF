'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from '@/components/Settings';
import { useTools } from '@/lib/agent-tools';
import {
    getAllRiskLevels,
    sanitizePrompt,
    analyzeOutputSafety,
    type SafetyStatus,
    type SanitizationResult,
    type OutputSafetyResult,
} from '@/lib/safety-status';
import {
    OPENCLAW_MODE_INFO,
    SAMPLE_PROPOSALS,
    submitToOpenClaw,
    fetchProposals,
    type OpenClawMode,
    type OpenClawProposal,
} from '@/lib/openclaw-config';
import { explain, mapCvfRiskLevel, type IntentType } from '@/lib/explainability';
import { parseNaturalPolicy, getDecisionColor } from '@/lib/natural-policy-parser';
import { RUNTIME_ADAPTERS, CAPABILITY_LABELS, STATUS_STYLES } from '@/lib/runtime-adapters';
import { RISK_MATRIX, DESTRUCTIVE_RULES, ESCALATION_THRESHOLDS, getCategoryColor, getCategoryBg, getScoreBar } from '@/lib/risk-models';

// ==================== LOCAL TYPES ====================

interface OpenClawResultData {
    response?: string;
    decision?: { status?: string };
    proposal?: { action?: string; confidence?: number; riskLevel?: string };
    mode?: string;
    guard?: { reason?: string };
    data?: {
        summary?: string;
        checklist?: Array<{ rule: string; hint: string; required: boolean }>;
    };
    success?: boolean;
}

// ==================== EXISTING COMPONENTS ====================

const DECISION_STYLES = {
    ALLOW: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    ESCALATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    BLOCK: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
} as const;

function RiskCard({ status, lang }: { status: SafetyStatus; lang: 'vi' | 'en' }) {
    return (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{status.emoji}</span>
                <div>
                    <div className="font-bold text-lg">{status.label[lang]}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{status.riskLevel} — Score: {status.riskScore.toFixed(2)}</div>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{status.description[lang]}</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${DECISION_STYLES[status.decision]}`}>
                {status.decision}
            </span>
        </div>
    );
}

function PromptTestSection({ lang }: { lang: 'vi' | 'en' }) {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<SanitizationResult | null>(null);

    const handleTest = () => {
        if (input.trim()) setResult(sanitizePrompt(input));
    };

    return (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-3">
                🛡️ {lang === 'vi' ? 'Kiểm tra Prompt' : 'Prompt Safety Check'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {lang === 'vi'
                    ? 'Nhập prompt để kiểm tra xem có chứa patterns nguy hiểm không.'
                    : 'Enter a prompt to check for dangerous injection patterns.'}
            </p>
            <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập prompt tại đây...' : 'Enter prompt here...'}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
            />
            <button
                onClick={handleTest}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                {lang === 'vi' ? 'Kiểm tra' : 'Check'}
            </button>

            {result && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{result.blocked ? '🔴' : result.threats.length > 0 ? '🟡' : '🟢'}</span>
                        <span className="font-bold">
                            {result.blocked
                                ? (lang === 'vi' ? 'ĐÃ CHẶN — Phát hiện mối đe dọa nghiêm trọng' : 'BLOCKED — Critical threat detected')
                                : result.threats.length > 0
                                    ? (lang === 'vi' ? `Phát hiện ${result.threats.length} mối đe dọa` : `${result.threats.length} threat(s) detected`)
                                    : (lang === 'vi' ? 'An toàn — Không phát hiện mối đe dọa' : 'Safe — No threats detected')}
                        </span>
                    </div>
                    {result.threats.length > 0 && (
                        <div className="space-y-1 mt-2">
                            {result.threats.map((t, i) => (
                                <div key={i} className="text-xs flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded ${t.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : t.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                        {t.severity}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">{t.pattern}</span>
                                    <span className="text-gray-400">→ {t.action}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function OutputTestSection({ lang }: { lang: 'vi' | 'en' }) {
    const [output, setOutput] = useState('');
    const [result, setResult] = useState<OutputSafetyResult | null>(null);

    const handleTest = () => {
        if (output.trim()) setResult(analyzeOutputSafety(output));
    };

    return (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-bold mb-3">
                📊 {lang === 'vi' ? 'Kiểm tra Output AI' : 'AI Output Safety Check'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {lang === 'vi'
                    ? 'Dán output của AI để kiểm tra patterns nguy hiểm và entropy.'
                    : 'Paste AI output to check for dangerous patterns and entropy.'}
            </p>
            <textarea
                value={output}
                onChange={e => setOutput(e.target.value)}
                placeholder={lang === 'vi' ? 'Dán AI output tại đây...' : 'Paste AI output here...'}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
            />
            <button
                onClick={handleTest}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
                {lang === 'vi' ? 'Phân tích' : 'Analyze'}
            </button>

            {result && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{result.emoji}</span>
                        <span className="font-bold">{result.label[lang]}</span>
                        <span className="text-xs text-gray-500">({result.riskLevel})</span>
                    </div>
                    {result.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {result.issues.map((issue, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                    {issue}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==================== NEW: OPENCLAW COMPONENTS ====================

function RiskBadge({ level }: { level: string }) {
    const styles: Record<string, string> = {
        low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[level] || styles.medium}`}>
            {level.toUpperCase()}
        </span>
    );
}

function StateBadge({ state }: { state: string }) {
    const styles: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        blocked: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[state] || styles.pending}`}>
            {state.toUpperCase()}
        </span>
    );
}

function OpenClawPanel({ enabled, mode, language, onToggle, onModeChange }: {
    enabled: boolean;
    mode: OpenClawMode;
    language: 'vi' | 'en';
    onToggle: () => void;
    onModeChange: (mode: OpenClawMode) => void;
}) {
    const modeInfo = OPENCLAW_MODE_INFO[mode];

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all ${enabled
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}>
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl ${enabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                        🐾
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                            {language === 'vi' ? 'Bộ điều hợp OpenClaw' : 'OpenClaw Adapter'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'vi'
                                ? 'AI có thể đề xuất. Chỉ CVF mới được thực thi.'
                                : 'AI can propose. Only CVF can execute.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onToggle}
                    className={`w-14 h-7 rounded-full transition-colors ${enabled
                        ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0.5'
                        }`} />
                </button>
            </div>

            {/* Mode + Flow */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {language === 'vi' ? 'Chế độ:' : 'Mode:'}
                    </span>
                    <select
                        value={mode}
                        onChange={(e) => onModeChange(e.target.value as OpenClawMode)}
                        disabled={!enabled}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="disabled">⛔ {OPENCLAW_MODE_INFO.disabled[language].label}</option>
                        <option value="proposal-only">📝 {OPENCLAW_MODE_INFO['proposal-only'][language].label}</option>
                        <option value="full">🚀 {OPENCLAW_MODE_INFO.full[language].label}</option>
                    </select>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${enabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                        {enabled ? (language === 'vi' ? 'ĐANG BẬT' : 'ACTIVE') : (language === 'vi' ? 'TẮT' : 'OFF')}
                    </span>
                </div>

                {/* Flow Diagram */}
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                        {language === 'vi' ? 'Luồng xử lý:' : 'Processing Flow:'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        {(language === 'vi'
                            ? ['Người dùng', '→', '🐾 OpenClaw', '→', 'Ý định', '→', 'Đề xuất', '→', '🛡️ CVF', '→', 'Quyết định', '→', 'Phản hồi']
                            : ['User', '→', '🐾 OpenClaw', '→', 'Intent', '→', 'Proposal', '→', '🛡️ CVF', '→', 'Decision', '→', 'Response']
                        ).map((item, i) => (
                            <span key={i} className={item === '→' ? 'text-gray-400' :
                                item.includes('CVF') ? 'px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold' :
                                    item.includes('OpenClaw') ? 'px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' :
                                        'text-gray-700 dark:text-gray-300 font-medium'
                            }>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="text-lg">{modeInfo.emoji}</span>
                    <span>{modeInfo[language].desc}</span>
                </div>
            </div>
        </div>
    );
}

function ProposalsTable({ proposals, language }: {
    proposals: OpenClawProposal[];
    language: 'vi' | 'en';
}) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    {language === 'vi' ? '📋 Đề xuất gần đây' : '📋 Recent Proposals'}
                </h3>
                <span className="text-xs text-gray-500">{proposals.length} {language === 'vi' ? 'mục' : 'items'}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {language === 'vi' ? 'Hành động' : 'Action'}
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {language === 'vi' ? 'Nguồn' : 'Source'}
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {language === 'vi' ? 'Rủi ro' : 'Risk'}
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {language === 'vi' ? 'Trạng thái' : 'State'}
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                {language === 'vi' ? 'Thời gian' : 'Time'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {proposals.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.id}</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{p.action}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.source === 'openclaw'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                        {p.source}
                                    </span>
                                </td>
                                <td className="px-4 py-3"><RiskBadge level={p.riskLevel} /></td>
                                <td className="px-4 py-3"><StateBadge state={p.state} /></td>
                                <td className="px-4 py-3 text-xs text-gray-500">{p.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OpenClawTestSection({ language, onSubmit, lastResult }: {
    language: 'vi' | 'en';
    onSubmit: (message: string) => void;
    lastResult: OpenClawResultData | null;
}) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!input.trim() || loading) return;
        setLoading(true);
        try {
            await onSubmit(input.trim());
            setInput('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    {language === 'vi' ? '🧪 Gửi yêu cầu qua OpenClaw' : '🧪 Send Request via OpenClaw'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {language === 'vi'
                        ? 'Nhập một yêu cầu để OpenClaw phân tích, tạo proposal, và CVF quyết định.'
                        : 'Enter a request for OpenClaw to analyze, create a proposal, and let CVF decide.'}
                </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={language === 'vi' ? 'Ví dụ: Deploy auth system...' : 'e.g. Deploy auth system...'}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                                   bg-gray-50 dark:bg-gray-900 text-sm
                                   focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || loading}
                        aria-label="Submit OpenClaw"
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors text-sm font-medium whitespace-nowrap"
                    >
                        {loading ? '⏳' : '🐾'} {language === 'vi' ? 'Gửi' : 'Send'}
                    </button>
                </div>

                {lastResult && (
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {lastResult.decision?.status === 'approved' ? '✅' :
                                    lastResult.decision?.status === 'pending' ? '⏳' : '🚫'}
                            </span>
                            <span className="font-semibold text-sm">{lastResult.response}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded bg-white dark:bg-gray-800">
                                <div className="text-gray-500">{language === 'vi' ? 'Hành động' : 'Action'}</div>
                                <div className="font-mono font-medium mt-0.5">{lastResult.proposal?.action}</div>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-gray-800">
                                <div className="text-gray-500">{language === 'vi' ? 'Độ tin cậy' : 'Confidence'}</div>
                                <div className="font-mono font-medium mt-0.5">{((lastResult.proposal?.confidence ?? 0) * 100).toFixed(0)}%</div>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-gray-800">
                                <div className="text-gray-500">{language === 'vi' ? 'Rủi ro' : 'Risk'}</div>
                                <div className="font-mono font-medium mt-0.5">{lastResult.proposal?.riskLevel?.toUpperCase()}</div>
                            </div>
                            <div className="p-2 rounded bg-white dark:bg-gray-800">
                                <div className="text-gray-500">Mode</div>
                                <div className="font-mono font-medium mt-0.5">{lastResult.mode === 'real' ? '🤖 AI' : '📋 Mock'}</div>
                            </div>
                        </div>
                        {lastResult.guard?.reason && (
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ Guard: {lastResult.guard.reason}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== MAIN PAGE ====================
// ==================== KERNEL TELEMETRY COMPONENTS ====================

interface KernelTrace {
    requestId: string;
    domain: string;
    riskLevel: string;
    decisionCode: string;
    traceHash: string;
    policyVersion: string;
    timestamp: number;
    action?: string;
    latencyMs?: number;
}

interface KernelTelemetry {
    traces: KernelTrace[];
    riskHistory: { level: string; timestamp: number; score: number }[];
    stats: {
        totalRequests: number;
        refusalCount: number;
        avgLatencyMs: number;
        p95LatencyMs: number;
        domainLockActive: boolean;
        currentRiskLevel: string;
        policyVersion: string;
    };
}

function useKernelTelemetry() {
    const [data, setData] = useState<KernelTelemetry | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/kernel-telemetry');
            if (res.ok) setData(await res.json());
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        queueMicrotask(() => void refresh());
        const interval = setInterval(() => void refresh(), 15000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { data, loading, refresh };
}

const RISK_COLORS: Record<string, string> = {
    R0: 'bg-emerald-500',
    R1: 'bg-blue-500',
    R2: 'bg-amber-500',
    R3: 'bg-orange-500',
    R4: 'bg-red-500',
};

const RISK_TEXT_COLORS: Record<string, string> = {
    R0: 'text-emerald-600 dark:text-emerald-400',
    R1: 'text-blue-600 dark:text-blue-400',
    R2: 'text-amber-600 dark:text-amber-400',
    R3: 'text-orange-600 dark:text-orange-400',
    R4: 'text-red-600 dark:text-red-400',
};

const DECISION_LABELS: Record<string, { icon: string; label: string; labelVi: string }> = {
    ALLOW_RELEASED: { icon: '✅', label: 'Allowed', labelVi: 'Cho phép' },
    REFUSAL_BLOCK: { icon: '🚫', label: 'Blocked', labelVi: 'Chặn' },
    REFUSAL_APPROVAL: { icon: '⏳', label: 'Needs Approval', labelVi: 'Cần duyệt' },
    REFUSAL_CLARIFY: { icon: '❓', label: 'Clarification', labelVi: 'Cần làm rõ' },
    INPUT_ACCEPTED: { icon: '📥', label: 'Input OK', labelVi: 'Input OK' },
    RISK_EVALUATED: { icon: '⚖️', label: 'Risk Checked', labelVi: 'Đã đánh giá' },
    ROLLBACK_REQUIRED: { icon: '↩️', label: 'Rollback', labelVi: 'Rollback' },
};

function KernelHealthDashboard({ telemetry, lang }: { telemetry: KernelTelemetry; lang: 'vi' | 'en' }) {
    const { stats } = telemetry;
    const allowRate = stats.totalRequests > 0
        ? ((stats.totalRequests - stats.refusalCount) / stats.totalRequests * 100).toFixed(1)
        : '100.0';

    const cards = [
        {
            icon: '🔒',
            title: lang === 'vi' ? 'Domain Lock' : 'Domain Lock',
            value: stats.domainLockActive
                ? (lang === 'vi' ? 'Đang hoạt động' : 'Active')
                : (lang === 'vi' ? 'Tắt' : 'Inactive'),
            color: stats.domainLockActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            badge: stats.domainLockActive
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-red-100 dark:bg-red-900/40',
        },
        {
            icon: '⚡',
            title: lang === 'vi' ? 'Mức rủi ro' : 'Risk Level',
            value: stats.currentRiskLevel,
            color: RISK_TEXT_COLORS[stats.currentRiskLevel] || 'text-gray-600',
            badge: `${RISK_COLORS[stats.currentRiskLevel] || 'bg-gray-500'}/20`,
        },
        {
            icon: '📊',
            title: lang === 'vi' ? 'Tổng yêu cầu' : 'Total Requests',
            value: `${stats.totalRequests}`,
            color: 'text-blue-600 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900/40',
            sub: `${allowRate}% ${lang === 'vi' ? 'cho phép' : 'allowed'}`,
        },
        {
            icon: '🚫',
            title: lang === 'vi' ? 'Từ chối' : 'Refusals',
            value: `${stats.refusalCount}`,
            color: stats.refusalCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
            badge: stats.refusalCount > 0
                ? 'bg-amber-100 dark:bg-amber-900/40'
                : 'bg-emerald-100 dark:bg-emerald-900/40',
        },
        {
            icon: '⏱️',
            title: lang === 'vi' ? 'Độ trễ TB' : 'Avg Latency',
            value: `${stats.avgLatencyMs}ms`,
            color: 'text-purple-600 dark:text-purple-400',
            badge: 'bg-purple-100 dark:bg-purple-900/40',
            sub: `P95: ${stats.p95LatencyMs}ms`,
        },
        {
            icon: '📜',
            title: lang === 'vi' ? 'Policy' : 'Policy Version',
            value: stats.policyVersion,
            color: 'text-gray-600 dark:text-gray-400',
            badge: 'bg-gray-100 dark:bg-gray-700',
        },
    ];

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🧠 {lang === 'vi' ? 'Tình trạng Kernel' : 'Kernel Runtime Health'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map(card => (
                    <div key={card.title} className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${card.badge}`}>
                        <div className="text-2xl mb-2">{card.icon}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.title}</div>
                        <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                        {card.sub && <div className="text-xs text-gray-400 mt-1">{card.sub}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function RequestTraceViewer({ telemetry, lang }: { telemetry: KernelTelemetry; lang: 'vi' | 'en' }) {
    const [selectedTrace, setSelectedTrace] = useState<KernelTrace | null>(null);

    const recentTraces = telemetry.traces.slice(-10).reverse();

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🔍 {lang === 'vi' ? 'Forensic Trace Viewer' : 'Request Trace Viewer'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trace list */}
                <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                            {lang === 'vi' ? 'Yêu cầu gần đây' : 'Recent Requests'}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                        {recentTraces.map(trace => {
                            const d = DECISION_LABELS[trace.decisionCode] || { icon: '❔', label: trace.decisionCode, labelVi: trace.decisionCode };
                            const isSelected = selectedTrace?.requestId === trace.requestId;
                            return (
                                <button
                                    key={trace.requestId}
                                    onClick={() => setSelectedTrace(isSelected ? null : trace)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{d.icon}</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {trace.action || trace.domain}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${RISK_COLORS[trace.riskLevel]}/20 ${RISK_TEXT_COLORS[trace.riskLevel]}`}>
                                                {trace.riskLevel}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(trace.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono truncate">
                                        {trace.requestId}
                                    </div>
                                </button>
                            );
                        })}
                        {recentTraces.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                {lang === 'vi' ? 'Chưa có yêu cầu nào' : 'No requests yet'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Trace detail */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        {lang === 'vi' ? 'Chi tiết Trace' : 'Trace Detail'}
                    </div>
                    {selectedTrace ? (
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'Request ID', value: selectedTrace.requestId, mono: true },
                                { label: 'Domain', value: selectedTrace.domain },
                                { label: lang === 'vi' ? 'Rủi ro' : 'Risk', value: selectedTrace.riskLevel, highlight: true },
                                { label: lang === 'vi' ? 'Quyết định' : 'Decision', value: `${DECISION_LABELS[selectedTrace.decisionCode]?.icon || ''} ${lang === 'vi' ? (DECISION_LABELS[selectedTrace.decisionCode]?.labelVi || selectedTrace.decisionCode) : (DECISION_LABELS[selectedTrace.decisionCode]?.label || selectedTrace.decisionCode)}` },
                                { label: 'Policy', value: selectedTrace.policyVersion },
                                { label: lang === 'vi' ? 'Độ trễ' : 'Latency', value: selectedTrace.latencyMs ? `${selectedTrace.latencyMs}ms` : 'N/A' },
                                { label: 'Trace Hash', value: selectedTrace.traceHash, mono: true },
                                { label: lang === 'vi' ? 'Thời gian' : 'Timestamp', value: new Date(selectedTrace.timestamp).toLocaleString() },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                                    <div className={`${item.mono ? 'font-mono text-xs break-all' : ''} ${item.highlight ? `font-bold ${RISK_TEXT_COLORS[selectedTrace.riskLevel]}` : 'text-gray-900 dark:text-white'}`}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            {lang === 'vi' ? '← Nhấn vào yêu cầu để xem chi tiết' : '← Click a request to view details'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RiskEvolutionChart({ telemetry, lang }: { telemetry: KernelTelemetry; lang: 'vi' | 'en' }) {
    const history = telemetry.riskHistory.slice(-20);

    const riskToHeight: Record<string, number> = { R0: 15, R1: 35, R2: 55, R3: 75, R4: 95 };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                📈 {lang === 'vi' ? 'Diễn biến Rủi ro' : 'Risk Evolution'}
            </h2>
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {history.length > 0 ? (
                    <>
                        {/* Y-axis labels + bars */}
                        <div className="flex items-end gap-1 h-40 mb-3">
                            {/* Y-axis */}
                            <div className="flex flex-col justify-between h-full text-xs text-gray-400 pr-2 py-1">
                                <span>R4</span>
                                <span>R3</span>
                                <span>R2</span>
                                <span>R1</span>
                                <span>R0</span>
                            </div>
                            {/* Bars */}
                            <div className="flex-1 flex items-end gap-1 h-full relative">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div key={i} className="border-b border-gray-100 dark:border-gray-700/50" />
                                    ))}
                                </div>
                                {/* Bar rendering */}
                                {history.map((entry, i) => {
                                    const height = riskToHeight[entry.level] || 15;
                                    const barColor = RISK_COLORS[entry.level] || 'bg-gray-400';
                                    return (
                                        <div
                                            key={`${entry.timestamp}-${i}`}
                                            className="flex-1 flex flex-col justify-end items-center relative group"
                                        >
                                            <div
                                                className={`w-full max-w-8 rounded-t ${barColor} transition-all duration-300 group-hover:opacity-80`}
                                                style={{ height: `${height}%`, minHeight: '8px' }}
                                            />
                                            {/* Tooltip on hover */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                                <div className="bg-gray-900 text-white rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                                                    {entry.level} — {(entry.score * 100).toFixed(0)}%
                                                    <br />
                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 justify-center text-xs mt-2">
                            {['R0', 'R1', 'R2', 'R3', 'R4'].map(level => (
                                <div key={level} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded ${RISK_COLORS[level]}`} />
                                    <span className="text-gray-500 dark:text-gray-400">{level}</span>
                                </div>
                            ))}
                        </div>
                        {/* Stats summary */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>{lang === 'vi' ? 'Tổng mẫu' : 'Samples'}: {history.length}</span>
                            <span>{lang === 'vi' ? 'Cao nhất' : 'Highest'}: {history.reduce((max, h) => {
                                const order = ['R0', 'R1', 'R2', 'R3', 'R4'];
                                return order.indexOf(h.level) > order.indexOf(max) ? h.level : max;
                            }, 'R0')}</span>
                            <span>{lang === 'vi' ? 'Gần nhất' : 'Latest'}: {history[history.length - 1]?.level || 'N/A'}</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-400 py-8 text-sm">
                        {lang === 'vi' ? 'Chưa có dữ liệu rủi ro' : 'No risk data yet'}
                    </div>
                )}
            </div>
        </div>
    );
}

function KernelPolicySelector({ telemetry, lang }: { telemetry: KernelTelemetry; lang: 'vi' | 'en' }) {
    const [selectedPolicy, setSelectedPolicy] = useState(telemetry.stats.policyVersion);
    const [saving, setSaving] = useState(false);

    const policies = [
        { id: 'v1', name: 'v1 — Standard Safety', nameVi: 'v1 — An toàn tiêu chuẩn', desc: 'Default refusal + risk gates', descVi: 'Từ chối + cổng rủi ro mặc định' },
        { id: 'v2-strict', name: 'v2 — Strict Mode', nameVi: 'v2 — Chế độ nghiêm ngặt', desc: 'Block R2+ and all creative', descVi: 'Chặn R2+ và tất cả sáng tạo' },
        { id: 'v2-permissive', name: 'v2 — Permissive', nameVi: 'v2 — Cho phép mở rộng', desc: 'Allow R2, escalate R3+', descVi: 'Cho phép R2, escalate R3+' },
    ];

    const handleChange = async (policyId: string) => {
        setSelectedPolicy(policyId);
        setSaving(true);
        // Simulate saving to kernel config
        await new Promise(r => setTimeout(r, 500));
        setSaving(false);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                📜 {lang === 'vi' ? 'Chọn Policy Version' : 'Kernel Policy Selector'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {policies.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleChange(p.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPolicy === p.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${selectedPolicy === p.id ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <span className="font-semibold text-sm">{lang === 'vi' ? p.nameVi : p.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                            {lang === 'vi' ? p.descVi : p.desc}
                        </p>
                        {selectedPolicy === p.id && saving && (
                            <span className="text-xs text-blue-500 ml-5 mt-1 inline-block animate-pulse">
                                {lang === 'vi' ? 'Đang lưu...' : 'Saving...'}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function CreativeModeIndicator({ telemetry, lang }: { telemetry: KernelTelemetry; lang: 'vi' | 'en' }) {
    const [creativeEnabled, setCreativeEnabled] = useState(false);

    const riskOrder = ['R0', 'R1', 'R2', 'R3', 'R4'];
    const currentRiskIdx = riskOrder.indexOf(telemetry.stats.currentRiskLevel);
    const driftWarning = creativeEnabled && currentRiskIdx >= 2;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🎨 {lang === 'vi' ? 'Creative Mode' : 'Creative Mode Indicator'}
            </h2>
            <div className={`p-5 rounded-xl border-2 transition-all ${driftWarning
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                : creativeEnabled
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{creativeEnabled ? '🎨' : '🔒'}</span>
                        <div>
                            <div className="font-bold">
                                {creativeEnabled
                                    ? (lang === 'vi' ? 'Creative Mode: BẬT' : 'Creative Mode: ON')
                                    : (lang === 'vi' ? 'Creative Mode: TẮT' : 'Creative Mode: OFF')}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {creativeEnabled
                                    ? (lang === 'vi' ? 'Domain scope mở rộng • Monitoring tăng cường' : 'Extended domain scope • Enhanced monitoring')
                                    : (lang === 'vi' ? 'An toàn tuyệt đối • Domain scope khóa' : 'Safety absolute • Domain scope locked')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreativeEnabled(!creativeEnabled)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${creativeEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    >
                        <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${creativeEnabled ? 'translate-x-7' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>

                {driftWarning && (
                    <div className="mt-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <div className="text-sm">
                            <div className="font-bold text-red-700 dark:text-red-300">
                                {lang === 'vi' ? 'Cảnh báo Domain Drift!' : 'Domain Drift Warning!'}
                            </div>
                            <div className="text-red-600 dark:text-red-400">
                                {lang === 'vi'
                                    ? `Risk level ${telemetry.stats.currentRiskLevel} — Creative mode có thể gây contamination. Kernel sẽ tự động revoke nếu drift tiếp tục.`
                                    : `Risk level ${telemetry.stats.currentRiskLevel} — Creative mode may cause contamination. Kernel will auto-revoke if drift continues.`}
                            </div>
                        </div>
                    </div>
                )}

                {creativeEnabled && !driftWarning && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 flex items-center gap-2">
                        <span className="text-lg">ℹ️</span>
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                            {lang === 'vi'
                                ? 'Creative provenance tag bật. Output giới hạn. Drift detector nghiêm ngặt.'
                                : 'Creative provenance tagging active. Output restricted. Drift detector strict mode.'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function DomainMapVisualization({ lang }: { lang: 'vi' | 'en' }) {
    const domains = [
        { id: 'content', label: 'Content', icon: '📝', x: 50, y: 30 },
        { id: 'code', label: 'Code', icon: '💻', x: 250, y: 30 },
        { id: 'analysis', label: 'Analysis', icon: '📊', x: 450, y: 30 },
        { id: 'general', label: 'General', icon: '💬', x: 650, y: 30 },
        { id: 'kernel', label: 'Kernel', icon: '🧠', x: 350, y: 140 },
        { id: 'refusal', label: 'Refusal', icon: '🚫', x: 150, y: 140 },
        { id: 'creative', label: 'Creative', icon: '🎨', x: 550, y: 140 },
    ];

    const connections = [
        { from: 'content', to: 'kernel', label: 'validate' },
        { from: 'code', to: 'kernel', label: 'validate' },
        { from: 'analysis', to: 'kernel', label: 'validate' },
        { from: 'general', to: 'kernel', label: 'validate' },
        { from: 'kernel', to: 'refusal', label: 'risk gate' },
        { from: 'kernel', to: 'creative', label: 'permission' },
    ];

    const getPos = (id: string) => domains.find(d => d.id === id);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🗺️ {lang === 'vi' ? 'Bản đồ Domain' : 'Domain Map Visualization'}
            </h2>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
                <svg viewBox="0 0 750 200" className="w-full max-w-3xl mx-auto" style={{ minWidth: '320px' }}>
                    {/* Connection lines */}
                    {connections.map((conn, i) => {
                        const from = getPos(conn.from);
                        const to = getPos(conn.to);
                        if (!from || !to) return null;
                        const x1 = from.x + 40, y1 = from.y + 25;
                        const x2 = to.x + 40, y2 = to.y + 5;
                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                        return (
                            <g key={i}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke="currentColor" strokeWidth="1.5" opacity="0.2"
                                    strokeDasharray="4 3" />
                                <text x={mx} y={my - 3} textAnchor="middle"
                                    fontSize="8" fill="currentColor" opacity="0.4">
                                    {conn.label}
                                </text>
                            </g>
                        );
                    })}
                    {/* Domain nodes */}
                    {domains.map(d => (
                        <g key={d.id}>
                            <rect x={d.x} y={d.y} width="80" height="35" rx="8"
                                fill={d.id === 'kernel' ? '#3b82f6' : d.id === 'refusal' ? '#ef4444' : d.id === 'creative' ? '#f59e0b' : '#10b981'}
                                opacity="0.15" stroke={d.id === 'kernel' ? '#3b82f6' : d.id === 'refusal' ? '#ef4444' : d.id === 'creative' ? '#f59e0b' : '#10b981'}
                                strokeWidth="1.5" />
                            <text x={d.x + 40} y={d.y + 15} textAnchor="middle" fontSize="14">{d.icon}</text>
                            <text x={d.x + 40} y={d.y + 28} textAnchor="middle"
                                fontSize="9" fontWeight="600" fill="currentColor" opacity="0.8">
                                {d.label}
                            </text>
                        </g>
                    ))}
                </svg>
                <div className="text-center text-xs text-gray-400 mt-2">
                    {lang === 'vi'
                        ? 'Mọi domain đều phải đi qua Kernel trước khi output'
                        : 'All domains must pass through Kernel before output'}
                </div>
            </div>
        </div>
    );
}

// ==================== v1.7.3 INTEGRATION COMPONENTS ====================

function RuntimeAdaptersPanel({ lang }: { lang: 'vi' | 'en' }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🔌 {lang === 'vi' ? 'Runtime Adapters (v1.7.3)' : 'Runtime Adapters (v1.7.3)'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {RUNTIME_ADAPTERS.map(adapter => {
                    const status = STATUS_STYLES[adapter.status];
                    return (
                        <div key={adapter.name} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{adapter.icon}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>
                                    {lang === 'vi' ? status.label.vi : status.label.en}
                                </span>
                            </div>
                            <div className="font-bold text-sm mb-1">{adapter.displayName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                {lang === 'vi' ? adapter.description.vi : adapter.description.en}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {adapter.capabilities.map(cap => {
                                    const capInfo = CAPABILITY_LABELS[cap];
                                    return (
                                        <span key={cap} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                            {capInfo.icon} {lang === 'vi' ? capInfo.vi : capInfo.en}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <span>🛡️</span>
                                {lang === 'vi' ? adapter.safetyNotes.vi : adapter.safetyNotes.en}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ExplainabilityPanel({ lang }: { lang: 'vi' | 'en' }) {
    const [selectedIntent, setSelectedIntent] = useState<IntentType>('FILE_READ');
    const [selectedAction, setSelectedAction] = useState<'EXECUTE' | 'BLOCK' | 'ESCALATE'>('EXECUTE');

    const intents: IntentType[] = ['FILE_READ', 'FILE_WRITE', 'FILE_DELETE', 'EMAIL_SEND', 'API_CALL', 'CODE_EXECUTION', 'DATA_EXPORT'];
    const actions: Array<'EXECUTE' | 'BLOCK' | 'ESCALATE'> = ['EXECUTE', 'BLOCK', 'ESCALATE'];

    const riskScore = selectedIntent === 'FILE_DELETE' || selectedIntent === 'CODE_EXECUTION' ? 80
        : selectedIntent === 'EMAIL_SEND' || selectedIntent === 'DATA_EXPORT' ? 55
            : selectedIntent === 'FILE_WRITE' || selectedIntent === 'API_CALL' ? 40 : 15;

    const result = explain({
        intentType: selectedIntent,
        riskLevel: mapCvfRiskLevel(riskScore >= 80 ? 'R4' : riskScore >= 60 ? 'R3' : riskScore >= 30 ? 'R2' : 'R1'),
        riskScore,
        action: selectedAction,
    }, lang);

    const actionColors: Record<string, string> = {
        EXECUTE: 'bg-emerald-600', BLOCK: 'bg-red-600', ESCALATE: 'bg-amber-600',
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🗣️ {lang === 'vi' ? 'Giải thích Hành động (v1.7.3)' : 'Action Explainability (v1.7.3)'}
            </h2>
            <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex flex-wrap gap-2 mb-3">
                    {intents.map(i => (
                        <button key={i} onClick={() => setSelectedIntent(i)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedIntent === i ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                            {i.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 mb-4">
                    {actions.map(a => (
                        <button key={a} onClick={() => setSelectedAction(a)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${selectedAction === a ? actionColors[a] : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500'}`}>
                            {a === 'EXECUTE' ? '✅' : a === 'BLOCK' ? '🚫' : '⏳'} {a}
                        </button>
                    ))}
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="font-bold text-lg">{result.summary}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{result.details}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{result.riskMessage}</div>
                    {result.recommendation && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <span>💡</span> {result.recommendation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NaturalPolicyEditor({ lang }: { lang: 'vi' | 'en' }) {
    const [input, setInput] = useState('');
    const rules = useMemo(() => parseNaturalPolicy(input), [input]);

    const placeholder = lang === 'vi'
        ? 'Nhập policy bằng ngôn ngữ tự nhiên...\nVí dụ:\ncấm xóa tệp\ncho phép đọc dữ liệu\nxem xét gửi email'
        : 'Type policies in natural language...\nExample:\ndeny file deletion\nallow reading files\nreview email sending';

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                📝 {lang === 'vi' ? 'Viết Policy Tự Nhiên (v1.7.3)' : 'Natural Language Policy (v1.7.3)'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        rows={6}
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                        {lang === 'vi' ? `${rules.length} quy tắc được nhận diện` : `${rules.length} rules detected`}
                    </div>
                </div>
                <div className="space-y-2">
                    {rules.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                            {lang === 'vi' ? 'Nhập policy để xem kết quả phân tích' : 'Type policies to see parsed results'}
                        </div>
                    ) : (
                        rules.map((rule, i) => (
                            <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getDecisionColor(rule.decision)}`}>
                                        {rule.decision}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {rule.resource}/{rule.action}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400">
                                        {Math.round(rule.confidence * 100)}%
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                                    &quot;{rule.originalLine}&quot;
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function RiskMatrixPanel({ lang }: { lang: 'vi' | 'en' }) {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">
                🎯 {lang === 'vi' ? 'Ma trận Rủi ro (v1.7.3)' : 'Risk Matrix (v1.7.3)'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Risk Matrix Table */}
                <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                            {lang === 'vi' ? 'Điểm rủi ro theo hành động' : 'Risk Score by Action'}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {RISK_MATRIX.map(entry => (
                            <div key={entry.intent} className="flex items-center px-4 py-2.5 gap-3">
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {lang === 'vi' ? entry.label.vi : entry.label.en}
                                    </span>
                                </div>
                                <div className="w-32">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div className={`h-full rounded-full ${getScoreBar(entry.baseScore)}`}
                                                style={{ width: `${entry.baseScore}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold min-w-[2rem] text-right ${getCategoryColor(entry.category)}`}>
                                            {entry.baseScore}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getCategoryBg(entry.category)} ${getCategoryColor(entry.category)}`}>
                                    {entry.category}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Escalation Thresholds + Destructive Rules */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            {lang === 'vi' ? 'Ngưỡng Escalation' : 'Escalation Thresholds'}
                        </div>
                        <div className="space-y-2">
                            {ESCALATION_THRESHOLDS.map(t => (
                                <div key={t.level} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded ${t.color}`} />
                                    <span className="text-sm font-medium flex-1">{lang === 'vi' ? t.label.vi : t.label.en}</span>
                                    <span className="text-xs text-gray-400">{t.minScore}–{t.maxScore}</span>
                                    <span className="text-xs font-mono text-gray-500">{t.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            {lang === 'vi' ? 'Mẫu Nguy hiểm' : 'Destructive Patterns'}
                        </div>
                        <div className="space-y-2">
                            {DESTRUCTIVE_RULES.map(r => (
                                <div key={r.pattern} className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                                        {r.pattern}
                                    </span>
                                    <span className="text-xs text-gray-500 flex-1">{lang === 'vi' ? r.label.vi : r.label.en}</span>
                                    <span className="text-xs font-bold text-red-600">+{r.riskBoost}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== GOVERNANCE CHECKER SECTION ====================

function GovernanceCheckerSection({ lang }: { lang: 'vi' | 'en' }) {
    const { executeTool, isExecuting } = useTools();
    const [action, setAction] = useState('bug_fix');
    const [context, setContext] = useState('');
    const [result, setResult] = useState<OpenClawResultData | null>(null);

    const handleCheck = useCallback(async () => {
        const res = await executeTool('governance_check', { action, context });
        setResult(res as OpenClawResultData);
    }, [action, context, executeTool]);

    const actions = [
        { id: 'bug_fix', icon: '🐛', label: lang === 'vi' ? 'Sửa Bug' : 'Bug Fix' },
        { id: 'test_run', icon: '🧪', label: lang === 'vi' ? 'Chạy Test' : 'Test Run' },
        { id: 'code_change', icon: '📝', label: lang === 'vi' ? 'Thay đổi Code' : 'Code Change' },
    ];

    return (
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="font-bold mb-1 flex items-center gap-2">
                <span>🛡️</span>
                {lang === 'vi' ? 'Governance Checker' : 'Governance Checker'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {lang === 'vi'
                    ? 'Kiểm tra tuân thủ governance cho bug, test, code changes'
                    : 'Check governance compliance for bugs, tests, code changes'}
            </p>

            {/* Action selector */}
            <div className="flex gap-2 mb-3">
                {actions.map(a => (
                    <button
                        key={a.id}
                        onClick={() => { setAction(a.id); setResult(null); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${action === a.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {a.icon} {a.label}
                    </button>
                ))}
            </div>

            {/* Context input */}
            <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={lang === 'vi' ? 'Mô tả ngữ cảnh (tùy chọn)...' : 'Describe context (optional)...'}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm mb-3"
            />

            <button
                onClick={handleCheck}
                disabled={isExecuting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
                {isExecuting ? '⏳...' : `🛡️ ${lang === 'vi' ? 'Kiểm tra Governance' : 'Run Governance Check'}`}
            </button>

            {/* Result */}
            {result && result.success && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {lang === 'vi' ? 'Checklist' : 'Compliance Checklist'}
                        <span className="ml-2 text-gray-400">
                            {result.data?.summary}
                        </span>
                    </div>
                    {(result.data?.checklist || []).map((item, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="flex-shrink-0 mt-0.5">
                                {item.required ? '❌' : '📋'}
                            </span>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.rule}</div>
                                <div className="text-xs text-gray-500">{item.hint}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SafetyPage() {
    const { language } = useLanguage();
    const { settings, updatePreferences } = useSettings();
    const lang = language === 'vi' ? 'vi' : 'en';
    const levels = getAllRiskLevels();
    const { data: kernelTelemetry } = useKernelTelemetry();

    const openClawEnabled = settings.preferences.openClawEnabled ?? false;
    const openClawMode = (settings.preferences.openClawMode ?? 'disabled') as OpenClawMode;

    // Live proposals
    const [proposals, setProposals] = useState<OpenClawProposal[]>(SAMPLE_PROPOSALS);
    const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

    const proposalStats = useMemo(() => {
        const total = proposals.length;
        const blocked = proposals.filter(p => p.state === 'blocked' || p.state === 'rejected').length;
        const pending = proposals.filter(p => p.state === 'pending').length;
        const openClawCount = proposals.filter(p => p.source === 'openclaw').length;
        return { total, blocked, pending, openClawCount };
    }, [proposals]);

    const loadProposals = useCallback(async () => {
        const live = await fetchProposals();
        if (live.length > 0) {
            setProposals(live as OpenClawProposal[]);
        }
    }, []);

    useEffect(() => {
        if (openClawEnabled) queueMicrotask(() => void loadProposals());
    }, [openClawEnabled, loadProposals]);

    const handleTestSubmit = useCallback(async (message: string) => {
        // Find first enabled provider with API key
        const providerEntries = Object.entries(settings.providers) as [string, { enabled: boolean; apiKey: string; selectedModel: string }][];
        const activeProvider = providerEntries.find(([, v]) => v.enabled && v.apiKey);

        const providerSettings = activeProvider
            ? { provider: activeProvider[0], apiKey: activeProvider[1].apiKey, model: activeProvider[1].selectedModel }
            : undefined;

        const result = await submitToOpenClaw(message, providerSettings);
        setLastResult(result);
        await loadProposals();
    }, [settings.providers, loadProposals]);

    const handleToggle = () => {
        const newEnabled = !openClawEnabled;
        updatePreferences({
            openClawEnabled: newEnabled,
            openClawMode: (newEnabled ? 'proposal-only' : 'disabled') as OpenClawMode,
        });
    };

    const handleModeChange = (mode: OpenClawMode) => {
        updatePreferences({
            openClawEnabled: mode !== 'disabled',
            openClawMode: mode,
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">🛡️</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-emerald-500">
                        {lang === 'vi' ? 'Bảng Điều Khiển An Toàn AI' : 'AI Safety Dashboard'}
                    </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {lang === 'vi'
                        ? 'Giám sát an toàn AI, kiểm soát OpenClaw Adapter, và quản lý đề xuất.'
                        : 'Monitor AI safety, control OpenClaw Adapter, and manage proposals.'}
                </p>
            </div>

            {/* Status Badge */}
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🟢</span>
                        <div>
                            <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                {lang === 'vi' ? 'AI đang được kiểm soát bởi CVF' : 'AI is controlled by CVF'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Controlled Vibe Framework — v1.7.1 Safety Runtime
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${openClawEnabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                            🐾 OpenClaw: {openClawEnabled ? (lang === 'vi' ? 'BẬT' : 'ON') : (lang === 'vi' ? 'TẮT' : 'OFF')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {proposalStats.total} {lang === 'vi' ? 'đề xuất' : 'proposals'}
                        </span>
                    </div>
                </div>
            </div>

            {/* OpenClaw Integration Panel */}
            <OpenClawPanel
                enabled={openClawEnabled}
                mode={openClawMode}
                language={lang}
                onToggle={handleToggle}
                onModeChange={handleModeChange}
            />

            {/* OpenClaw Test Section */}
            {openClawEnabled && (
                <OpenClawTestSection
                    language={lang}
                    onSubmit={handleTestSubmit}
                    lastResult={lastResult}
                />
            )}

            {/* Proposals Table */}
            <ProposalsTable proposals={proposals} language={lang} />

            {/* Kernel Telemetry Section */}
            {kernelTelemetry && (
                <>
                    <KernelHealthDashboard telemetry={kernelTelemetry} lang={lang} />
                    <RequestTraceViewer telemetry={kernelTelemetry} lang={lang} />
                    <RiskEvolutionChart telemetry={kernelTelemetry} lang={lang} />
                    <KernelPolicySelector telemetry={kernelTelemetry} lang={lang} />
                    <CreativeModeIndicator telemetry={kernelTelemetry} lang={lang} />
                    <DomainMapVisualization lang={lang} />
                </>
            )}

            {/* v1.7.3 Integration: Runtime Adapters */}
            <RuntimeAdaptersPanel lang={lang} />

            {/* v1.7.3 Integration: Explainability */}
            <ExplainabilityPanel lang={lang} />

            {/* v1.7.3 Integration: Natural Language Policy */}
            <NaturalPolicyEditor lang={lang} />

            {/* v1.7.3 Integration: Risk Matrix */}
            <RiskMatrixPanel lang={lang} />

            {/* Risk Levels */}
            <div>
                <h2 className="text-xl font-bold mb-4">
                    📊 {lang === 'vi' ? '4 Mức Độ Rủi Ro' : '4 Risk Levels'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {levels.map(s => (
                        <RiskCard key={s.riskLevel} status={s} lang={lang} />
                    ))}
                </div>
            </div>

            {/* Interactive Test Tools */}
            <div>
                <h2 className="text-xl font-bold mb-4">
                    🔧 {lang === 'vi' ? 'Công Cụ Kiểm Tra' : 'Safety Tools'}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PromptTestSection lang={lang} />
                    <OutputTestSection lang={lang} />
                </div>
                <div className="mt-6">
                    <GovernanceCheckerSection lang={lang} />
                </div>
            </div>

            {/* How It Works */}
            <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold mb-3">
                    ℹ️ {lang === 'vi' ? 'Cách Hoạt Động' : 'How It Works'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">🐾</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'OpenClaw đề xuất' : 'OpenClaw Proposes'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'AI phân tích intent và tạo proposal' : 'AI analyzes intent and creates proposal'}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">🛡️</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'CVF kiểm tra' : 'CVF Validates'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Prompt được quét tự động để phát hiện injection' : 'Prompt automatically scanned for injection'}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'Policy đánh giá' : 'Policy Evaluates'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Policy engine đánh giá rủi ro real-time' : 'Policy engine evaluates risk in real-time'}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'Giám sát output' : 'Monitor Output'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Output được phân tích entropy và anomaly' : 'Output analyzed for entropy and anomalies'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
