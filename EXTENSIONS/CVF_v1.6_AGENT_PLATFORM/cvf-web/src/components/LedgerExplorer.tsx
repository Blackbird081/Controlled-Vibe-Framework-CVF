'use client';

// Text Encoding Exception: Preserve the existing ledger status symbols.

import { useState, useEffect, useCallback } from 'react';
import { TechnicalDetails } from '@/components/TechnicalDetails';
import { getFriendlyPhaseLabel } from '@/lib/non-coder-language';
import { getRiskOption } from '@/lib/governance-model';
import { useLanguage } from '@/lib/i18n';
import { statusLabel } from '@/lib/presentation-labels';
import type { LedgerBlock } from '@/types/governance-engine';
import { validateChain, type ChainValidationResult } from '@/lib/ledger-validator';

interface LedgerExplorerProps {
    language?: 'vi' | 'en'; // deprecated: uses useLanguage() now
}

const LABELS = {
    vi: {
        noEntries: 'Chưa có bản ghi nào',
        loading: 'Đang tải...',
        error: 'Lỗi kết nối',
        refresh: 'Làm mới',
        time: 'Thời gian',
        copied: 'Đã sao chép!',
        all: 'Tất cả',
        page: 'Trang',
        of: 'trên',
        disconnected: 'Governance Engine không kết nối',
        tampered: 'ĐÃ BỊ SỬA ĐỔI',
        prev: '← Trước',
        next: 'Sau →',
    },
    en: {
        noEntries: 'No entries yet',
        loading: 'Loading...',
        error: 'Connection error',
        refresh: 'Refresh',
        time: 'Time',
        copied: 'Copied!',
        all: 'All',
        page: 'Page',
        of: 'of',
        disconnected: 'Governance Engine disconnected',
        tampered: 'TAMPERED',
        prev: '← Prev',
        next: 'Next →',
    },
};

const PAGE_SIZE = 10;

export function LedgerExplorer({ language: langProp }: LedgerExplorerProps) {
    const { language: contextLanguage, t } = useLanguage();
    const language = langProp || contextLanguage;
    const l = LABELS[language];
    const riskLabel = (risk: string) => {
        const level = getRiskOption(risk);
        return (language === 'vi' ? level?.label : level?.labelEn) ?? t('governancePage.logUnknownValue');
    };
    const outcomeLabel = (outcome: string) => {
        const label = statusLabel(outcome, language);
        return label === outcome ? t('governancePage.logUnknownValue') : label;
    };

    const [entries, setEntries] = useState<LedgerBlock[]>([]);
    const [totalBlocks, setTotalBlocks] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [validation, setValidation] = useState<ChainValidationResult | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    // Filters
    const [filterPhase, setFilterPhase] = useState<string>('');
    const [filterRisk, setFilterRisk] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(1);

    const loadLabel = `${l.disconnected}:${l.error}`;
    const [previousLoadLabel, setPreviousLoadLabel] = useState(loadLabel);
    if (previousLoadLabel !== loadLabel) {
        setPreviousLoadLabel(loadLabel); setLoading(true); setError(null);
    }
    const fetchLedger = useCallback(() => fetch('/api/governance/ledger?limit=500')
        .then(res => res.json())
        .then(async json => {
            setError(null);
            if (!json.success) {
                setError(l.disconnected); setEntries([]);
                return;
            }
            const data = json.data;
            setTotalBlocks(data.total_blocks); setEntries(data.entries || []);
            const result = await validateChain(data.entries || []);
            setValidation(result);
        }).catch(() => { setError(l.error); setEntries([]); })
        .finally(() => setLoading(false)), [l.disconnected, l.error]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const copyHash = (hash: string) => {
        navigator.clipboard?.writeText(hash);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const truncateHash = (hash: string) => {
        if (!hash || hash.length <= 12) return hash;
        return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
    };

    // ── Filtering ────────────────────────────────────────────────

    const filtered = entries.filter(entry => {
        const event = entry.event || {};
        if (filterPhase && (event as Record<string, unknown>).phase !== filterPhase) return false;
        if (filterRisk && (event as Record<string, unknown>).risk_level !== filterRisk) return false;
        if (filterStatus && (event as Record<string, unknown>).status !== filterStatus) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ── Export ────────────────────────────────────────────────────

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-ledger-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportCsv = () => {
        const headers = ['block_index', 'hash', 'previous_hash', 'timestamp', 'event'];
        const rows = entries.map(e => [
            e.block_index,
            e.hash,
            e.previous_hash,
            e.timestamp,
            JSON.stringify(e.event),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Unique values for filter dropdowns ───────────────────────

    const uniquePhases = [...new Set(entries.map(e => (e.event as Record<string, unknown>)?.phase as string).filter(Boolean))];
    const uniqueRisks = [...new Set(entries.map(e => (e.event as Record<string, unknown>)?.risk_level as string).filter(Boolean))];
    const uniqueStatuses = [...new Set(entries.map(e => (e.event as Record<string, unknown>)?.status as string).filter(Boolean))];

    // ── Render ───────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        📋 {t('governancePage.ledger')}
                    </h3>
                    {validation && (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                validation.valid
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                        >
                            {validation.valid ? `✅ ${t('governancePage.logValid')}` : `❌ ${t('governancePage.logBroken')}`}
                        </span>
                    )}
                    <span className="text-sm text-gray-500">
                        {t('governancePage.logCount')}: {totalBlocks}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setLoading(true); setError(null); void fetchLedger(); }}
                        className="min-h-11 min-w-11 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        🔄 {l.refresh}
                    </button>
                    <button
                        onClick={exportJson}
                        className="min-h-11 min-w-11 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                    >
                        📦 {t('governancePage.logDownloadData')}
                    </button>
                    <button
                        onClick={exportCsv}
                        className="min-h-11 min-w-11 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                    >
                        📊 {t('governancePage.logDownloadTable')}
                    </button>
                </div>
            </div>

            {/* Tamper warning */}
            {validation && !validation.valid && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        ⚠️ {t('governancePage.logTamperAt')} #{validation.brokenAt}
                    </p>
                    {validation.error && (
                        <TechnicalDetails className="mt-2" label={t('common.technicalDetails')}>
                            <p>{validation.error}</p>
                        </TechnicalDetails>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select
                    value={filterPhase}
                    onChange={e => { setFilterPhase(e.target.value); setPage(1); }}
                    className="min-h-11 min-w-11 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{t('governancePage.logPhase')}: {l.all}</option>
                    {uniquePhases.map(p => <option key={p} value={p}>{getFriendlyPhaseLabel(p, language).label}</option>)}
                </select>
                <select
                    value={filterRisk}
                    onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
                    className="min-h-11 min-w-11 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{t('governancePage.logRisk')}: {l.all}</option>
                    {uniqueRisks.map(r => <option key={r} value={r}>{riskLabel(r)}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="min-h-11 min-w-11 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{t('governancePage.logStatus')}: {l.all}</option>
                    {uniqueStatuses.map(s => <option key={s} value={s}>{outcomeLabel(s)}</option>)}
                </select>
            </div>

            {/* Content */}
            {loading && (
                <div className="text-center py-8 text-gray-500">{l.loading}</div>
            )}

            {error && (
                <div className="text-center py-8 text-red-500">{t('governancePage.logError')}</div>
            )}

            {!loading && !error && entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">{l.noEntries}</div>
            )}

            {!loading && !error && paginated.length > 0 && (
                <div className="space-y-3">
                    {paginated.map(block => {
                        const isBroken = validation && !validation.valid && validation.brokenAt === block.block_index;
                        return (
                            <div
                                key={block.hash || block.block_index}
                                className={`p-4 rounded-lg border ${
                                    isBroken
                                        ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-mono font-bold">
                                            {block.block_index}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {t('governancePage.record')} #{block.block_index}
                                        </span>
                                        {isBroken && (
                                            <span className="text-xs text-red-600 font-medium">
                                                ⚠️ {l.tampered}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(block.timestamp).toLocaleString()}
                                    </span>
                                </div>

                                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{t('governancePage.logEntry')}</p>
                                <TechnicalDetails label={t('common.technicalDetails')}>
                                    <dl className="grid gap-2 text-xs sm:grid-cols-2">
                                        <div>
                                            <dt>{t('governancePage.logHash')}</dt>
                                            <dd>
                                                <button type="button" onClick={() => copyHash(block.hash)} title={block.hash} className="min-h-11 min-w-11 text-blue-600 hover:underline">
                                                    {copiedHash === block.hash ? l.copied : truncateHash(block.hash)}
                                                </button>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>{t('governancePage.logPrevHash')}</dt>
                                            <dd>
                                                <button type="button" onClick={() => copyHash(block.previous_hash)} title={block.previous_hash} className="min-h-11 min-w-11 text-blue-600 hover:underline">
                                                    {copiedHash === block.previous_hash ? l.copied : truncateHash(block.previous_hash)}
                                                </button>
                                            </dd>
                                        </div>
                                        {Object.entries(block.event ?? {}).map(([key, data]) => (
                                            data !== null && typeof data !== 'object' && (
                                                <div key={key}>
                                                    <dt>{key}</dt>
                                                    <dd>{String(data)}</dd>
                                                </div>
                                            )
                                        ))}
                                    </dl>
                                </TechnicalDetails>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="min-h-11 min-w-11 px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                        {l.prev}
                    </button>
                    <span className="text-sm text-gray-500">
                        {l.page} {page} {l.of} {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="min-h-11 min-w-11 px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                        {l.next}
                    </button>
                </div>
            )}
        </div>
    );
}
