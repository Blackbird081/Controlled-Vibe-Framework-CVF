'use client';
// Text Encoding Exception: Vietnamese and English text for the safety readout.

import { useEffect, useState } from 'react';
import { GOVERNANCE_CHECK_WORKFLOWS, type GovernanceCheckRun } from '@/lib/governance-check-runs';

const labels = {
    vi: {
        title: 'Kết quả kiểm quản trị gần nhất',
        scope: 'Ba quy trình kiểm trên nhánh chính của kho công khai. Mở GitHub để xem từng bước.',
        loading: 'Đang lấy kết quả kiểm…',
        unavailable: 'Chưa lấy được kết quả kiểm',
        noRun: 'Chưa có lượt chạy trên nhánh chính',
        passed: 'Đạt',
        failed: 'Lỗi',
        running: 'Đang chạy',
        notPassed: 'Không ghi nhận đạt',
        github: 'Xem trên GitHub',
        documentation: 'Tài liệu và kiểm thử',
        static: 'Kiểm tra mã nguồn',
        publicSync: 'Kiểm trước đồng bộ công khai',
    },
    en: {
        title: 'Latest governance checks',
        scope: 'Three workflows on the public repository’s main branch. Open GitHub to see individual jobs.',
        loading: 'Loading check results…',
        unavailable: 'Could not load check results',
        noRun: 'No run on the main branch yet',
        passed: 'Passed',
        failed: 'Failed',
        running: 'Running',
        notPassed: 'No passing result',
        github: 'View on GitHub',
        documentation: 'Documentation & Testing',
        static: 'CVF Static CI Gate',
        publicSync: 'Public Sync Preflight',
    },
};

const statusColor: Record<string, string> = {
    passed: 'text-green-700 dark:text-green-300',
    failed: 'text-red-700 dark:text-red-300',
    running: 'text-amber-700 dark:text-amber-300',
};

export default function GovernanceCheckRuns({ language }: { language: 'vi' | 'en' }) {
    const text = labels[language];
    const [runs, setRuns] = useState<GovernanceCheckRun[] | 'unavailable' | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            try {
                const result = await fetch('/api/governance/check-runs', { signal: controller.signal });
                if (!result.ok) throw new Error('Unavailable');
                const rows: GovernanceCheckRun[] = await result.json();
                if (!Array.isArray(rows) || rows.length !== Object.keys(GOVERNANCE_CHECK_WORKFLOWS).length) {
                    throw new Error('Invalid check results');
                }
                if (!controller.signal.aborted) setRuns(rows);
            } catch {
                if (!controller.signal.aborted) setRuns('unavailable');
            }
        })();
        return () => controller.abort();
    }, []);

    return (
        <section aria-labelledby="latest-governance-checks" className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.07] dark:bg-[#1a1d2e] sm:p-5">
            <h2 id="latest-governance-checks" className="text-xl font-bold">{text.title}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{text.scope}</p>
            {Array.isArray(runs) ? (
                <ul className="mt-3 divide-y divide-gray-200 dark:divide-white/[0.1]">
                    {runs.map(run => (
                        <li key={run.workflow} className="flex flex-col items-start justify-between gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                            <div>
                                <h3 className="font-semibold">{text[run.workflow]}</h3>
                                <p className={`mt-1 text-sm font-medium ${statusColor[run.state] ?? 'text-gray-600 dark:text-gray-300'}`}>
                                    {text[run.state]}
                                </p>
                                {'startedAt' in run && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        <time dateTime={run.startedAt}>
                                            {new Date(run.startedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en', {
                                                dateStyle: 'medium', timeStyle: 'short',
                                            })}
                                        </time>
                                        {' · '}
                                        <code>{run.sha.slice(0, 8)}</code>
                                    </p>
                                )}
                            </div>
                            {'href' in run && (
                                <a href={run.href} target="_blank" rel="noopener noreferrer"
                                    aria-label={`${text.github} · ${text[run.workflow]}`}
                                    className="inline-flex min-h-11 items-center rounded px-1 text-sm font-semibold text-blue-700 underline underline-offset-2 focus-visible:outline-2 dark:text-blue-300">
                                    {text.github}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p role="status" className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {runs === null ? text.loading : text.unavailable}
                </p>
            )}
        </section>
    );
}
