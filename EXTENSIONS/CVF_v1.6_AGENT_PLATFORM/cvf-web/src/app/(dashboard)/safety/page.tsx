'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
    getAllRiskLevels,
    sanitizePrompt,
    analyzeOutputSafety,
    type SafetyStatus,
    type SanitizationResult,
    type OutputSafetyResult,
} from '@/lib/safety-status';

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

export default function SafetyPage() {
    const { language } = useLanguage();
    const lang = language === 'vi' ? 'vi' : 'en';
    const levels = getAllRiskLevels();

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <span className="text-4xl">🛡️</span>
                    {lang === 'vi' ? 'An Toàn AI' : 'AI Safety'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {lang === 'vi'
                        ? 'Kiểm soát và giám sát mức độ an toàn của AI — được bảo vệ bởi CVF'
                        : 'Monitor and control AI safety levels — protected by CVF'}
                </p>
            </div>

            {/* Status Badge */}
            <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🟢</span>
                    <div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300">
                            {lang === 'vi' ? 'AI đang được kiểm soát bởi CVF' : 'AI is controlled by CVF'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Controlled Vibe Framework — v1.7
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Levels */}
            <h2 className="text-xl font-bold mb-4">
                📊 {lang === 'vi' ? '4 Mức Độ Rủi Ro' : '4 Risk Levels'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {levels.map(s => (
                    <RiskCard key={s.riskLevel} status={s} lang={lang} />
                ))}
            </div>

            {/* Interactive Test Tools */}
            <h2 className="text-xl font-bold mb-4">
                🔧 {lang === 'vi' ? 'Công Cụ Kiểm Tra' : 'Safety Tools'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <PromptTestSection lang={lang} />
                <OutputTestSection lang={lang} />
            </div>

            {/* How It Works */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold mb-3">
                    ℹ️ {lang === 'vi' ? 'Cách Hoạt Động' : 'How It Works'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">🛡️</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'Trước khi gửi' : 'Before Sending'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Prompt được quét tự động để phát hiện injection' : 'Prompt automatically scanned for injection'}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'Trong lúc xử lý' : 'During Processing'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Policy engine đánh giá rủi ro real-time' : 'Policy engine evaluates risk in real-time'}</div>
                    </div>
                    <div className="text-center p-3">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="font-semibold mb-1">{lang === 'vi' ? 'Sau khi nhận' : 'After Receiving'}</div>
                        <div className="text-gray-500 dark:text-gray-400">{lang === 'vi' ? 'Output được phân tích entropy và anomaly' : 'Output analyzed for entropy and anomalies'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
