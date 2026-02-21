'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import type { LedgerBlock } from '@/types/governance-engine';
import { validateChain, type ChainValidationResult } from '@/lib/ledger-validator';

interface LedgerExplorerProps {
    language?: 'vi' | 'en'; // deprecated: uses useLanguage() now
}

const LABELS = {
    vi: {
        title: 'Audit Ledger',
        totalBlocks: 'Tổng blocks',
        chainValid: 'Chain hợp lệ',
        chainBroken: 'Chain bị phá vỡ',
        tamperAt: 'Phát hiện sửa đổi tại block',
        noEntries: 'Chưa có bản ghi nào',
        loading: 'Đang tải...',
        error: 'Lỗi kết nối',
        refresh: 'Làm mới',
        exportJson: 'Xuất JSON',
        exportCsv: 'Xuất CSV',
        hash: 'Hash',
        prevHash: 'Hash trước',
        event: 'Sự kiện',
        time: 'Thời gian',
        block: 'Block',
        copied: 'Đã sao chép!',
        filterPhase: 'Lọc phase',
        filterRisk: 'Lọc risk',
        filterStatus: 'Lọc trạng thái',
        all: 'Tất cả',
        page: 'Trang',
        of: 'trên',
        disconnected: 'Governance Engine không kết nối',
        tampered: 'ĐÃ BỊ SỬA ĐỔI',
        prev: '← Trước',
        next: 'Sau →',
    },
    en: {
        title: 'Audit Ledger',
        totalBlocks: 'Total blocks',
        chainValid: 'Chain valid',
        chainBroken: 'Chain broken',
        tamperAt: 'Tamper detected at block',
        noEntries: 'No entries yet',
        loading: 'Loading...',
        error: 'Connection error',
        refresh: 'Refresh',
        exportJson: 'Export JSON',
        exportCsv: 'Export CSV',
        hash: 'Hash',
        prevHash: 'Previous Hash',
        event: 'Event',
        time: 'Time',
        block: 'Block',
        copied: 'Copied!',
        filterPhase: 'Filter phase',
        filterRisk: 'Filter risk',
        filterStatus: 'Filter status',
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

export function LedgerExplorer({ language: _langProp }: LedgerExplorerProps) {
    const { language } = useLanguage();
    const l = LABELS[language];

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

    const fetchLedger = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/governance/ledger?limit=500');
            const json = await res.json();

            if (!json.success) {
                setError(json.error || l.disconnected);
                setEntries([]);
                return;
            }

            const data = json.data;
            setTotalBlocks(data.total_blocks);
            setEntries(data.entries || []);

            // Validate chain integrity
            const result = await validateChain(data.entries || []);
            setValidation(result);
        } catch {
            setError(l.error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }, [l.disconnected, l.error]);

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
                        📋 {l.title}
                    </h3>
                    {validation && (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                validation.valid
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                        >
                            {validation.valid ? `✅ ${l.chainValid}` : `❌ ${l.chainBroken}`}
                        </span>
                    )}
                    <span className="text-sm text-gray-500">
                        {l.totalBlocks}: {totalBlocks}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLedger}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        🔄 {l.refresh}
                    </button>
                    <button
                        onClick={exportJson}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                    >
                        📦 <span className="hidden sm:inline">{l.exportJson}</span><span className="sm:hidden">JSON</span>
                    </button>
                    <button
                        onClick={exportCsv}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                    >
                        📊 <span className="hidden sm:inline">{l.exportCsv}</span><span className="sm:hidden">CSV</span>
                    </button>
                </div>
            </div>

            {/* Tamper warning */}
            {validation && !validation.valid && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        ⚠️ {l.tamperAt} #{validation.brokenAt}
                    </p>
                    {validation.error && (
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">{validation.error}</p>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select
                    value={filterPhase}
                    onChange={e => { setFilterPhase(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{l.filterPhase}: {l.all}</option>
                    {uniquePhases.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                    value={filterRisk}
                    onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{l.filterRisk}: {l.all}</option>
                    {uniqueRisks.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                    <option value="">{l.filterStatus}: {l.all}</option>
                    {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Content */}
            {loading && (
                <div className="text-center py-8 text-gray-500">{l.loading}</div>
            )}

            {error && (
                <div className="text-center py-8 text-red-500">{error}</div>
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
                                            {l.block} #{block.block_index}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">{l.hash}:</span>
                                        <button
                                            onClick={() => copyHash(block.hash)}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                            title={block.hash}
                                        >
                                            {copiedHash === block.hash ? l.copied : truncateHash(block.hash)}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">{l.prevHash}:</span>
                                        <button
                                            onClick={() => copyHash(block.previous_hash)}
                                            className="text-gray-600 dark:text-gray-400 hover:underline"
                                            title={block.previous_hash}
                                        >
                                            {copiedHash === block.previous_hash ? l.copied : truncateHash(block.previous_hash)}
                                        </button>
                                    </div>
                                </div>

                                {block.event && Object.keys(block.event).length > 0 && (
                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                        <span className="text-gray-500 block mb-1">{l.event}:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(block.event).map(([key, value]) => (
                                                <span
                                                    key={key}
                                                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                >
                                                    <span className="font-medium mr-1">{key}:</span>
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                        {l.prev}
                    </button>
                    <span className="text-sm text-gray-500">
                        {l.page} {page} {l.of} {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                    >
                        {l.next}
                    </button>
                </div>
            )}
        </div>
    );
}
