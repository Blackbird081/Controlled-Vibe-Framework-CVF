'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from '@/components/Settings';
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
    type OpenClawMode,
    type OpenClawProposal,
} from '@/lib/openclaw-config';

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

// ==================== MAIN PAGE ====================

export default function SafetyPage() {
    const { language } = useLanguage();
    const { settings, updatePreferences } = useSettings();
    const lang = language === 'vi' ? 'vi' : 'en';
    const levels = getAllRiskLevels();

    const openClawEnabled = settings.preferences.openClawEnabled ?? false;
    const openClawMode = (settings.preferences.openClawMode ?? 'disabled') as OpenClawMode;

    const proposalStats = useMemo(() => {
        const total = SAMPLE_PROPOSALS.length;
        const blocked = SAMPLE_PROPOSALS.filter(p => p.state === 'blocked' || p.state === 'rejected').length;
        const pending = SAMPLE_PROPOSALS.filter(p => p.state === 'pending').length;
        const openClawCount = SAMPLE_PROPOSALS.filter(p => p.source === 'openclaw').length;
        return { total, blocked, pending, openClawCount };
    }, []);

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

            {/* Proposals Table */}
            <ProposalsTable proposals={SAMPLE_PROPOSALS} language={lang} />

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
