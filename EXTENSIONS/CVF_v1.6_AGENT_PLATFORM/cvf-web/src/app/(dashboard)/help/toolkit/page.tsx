'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SurfaceTopBar } from '@/components';
import { useLanguage } from '@/lib/i18n';

type Lang = 'vi' | 'en';
const TAB_KEYS = ['overview', 'governance-bar', 'authority-matrix', 'self-uat', 'spec-export', 'workflow'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, Record<Lang, string>> = {
    'overview': { vi: 'Tổng quan', en: 'Overview' },
    'governance-bar': { vi: 'GovernanceBar', en: 'GovernanceBar' },
    'authority-matrix': { vi: 'Authority Matrix', en: 'Authority Matrix' },
    'self-uat': { vi: 'Self-UAT', en: 'Self-UAT' },
    'spec-export': { vi: 'Xuất Spec', en: 'Spec Export' },
    'workflow': { vi: 'Workflow', en: 'Workflow' },
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none sm:p-6">
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h3>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
    return (
        <div className="my-4">
            {label && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">{label}</div>}
            <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0d0f1a] p-4 text-xs leading-7 text-emerald-300 sm:text-sm">
                {children}
            </pre>
        </div>
    );
}

function InfoTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="min-w-[360px] w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {headers.map(header => (
                            <th key={header} className="border-b border-slate-200 px-3 py-3 text-left font-semibold text-slate-950 dark:border-white/[0.08] dark:text-white">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border-b border-slate-100 px-3 py-3 align-top text-slate-600 dark:border-white/[0.06] dark:text-white/65">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OverviewTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <>
            <SectionCard title={isVi ? 'Kiến trúc Web Toolkit' : 'Web Toolkit Architecture'}>
                <p className="text-sm leading-7 text-slate-600 dark:text-white/60">
                    {isVi
                        ? 'CVF Governance Toolkit kết nối templates, agent chat, skill explorer và policy controls trong cùng một lớp điều phối.'
                        : 'The CVF Governance Toolkit connects templates, agent chat, skill exploration, and policy controls through one orchestration layer.'}
                </p>
                <CodeBlock label="Architecture">
{`Templates / Skills / Agent Chat
          ↓
   Governance Layer
   - GovernanceBar
   - GovernancePanel
   - Authority Matrix
   - Risk Check
          ↓
  SpecExport / Self-UAT / Multi-Agent`}
                </CodeBlock>
            </SectionCard>

            <SectionCard title={isVi ? 'Các thành phần chính' : 'Key Components'}>
                <InfoTable
                    headers={[isVi ? 'Thành phần' : 'Component', isVi ? 'Vai trò' : 'Role', isVi ? 'Nơi dùng' : 'Used in']}
                    rows={[
                        ['GovernanceBar', isVi ? 'Điều khiển Phase / Role / Risk' : 'Controls Phase / Role / Risk', isVi ? 'Agent surfaces' : 'Agent surfaces'],
                        ['Authority Matrix', isVi ? 'Khóa quyền theo phase' : 'Locks permissions per phase', isVi ? 'governance-context.ts' : 'governance-context.ts'],
                        ['Self-UAT', isVi ? 'Tự đánh giá compliance' : 'Self-checks compliance', isVi ? 'Governance panel' : 'Governance panel'],
                        ['SpecExport', isVi ? 'Xuất governed packet' : 'Exports governed packet', isVi ? 'Template workflow' : 'Template workflow'],
                    ]}
                />
            </SectionCard>
        </>
    );
}

function GovernanceBarTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <SectionCard title={isVi ? 'Hai chế độ: Auto vs Manual' : 'Two Modes: Auto vs Manual'}>
            <InfoTable
                headers={[isVi ? 'Chế độ' : 'Mode', isVi ? 'Ý nghĩa' : 'Meaning', isVi ? 'Khi dùng' : 'Use when']}
                rows={[
                    [isVi ? 'Auto' : 'Auto', isVi ? 'AI tự suy governance state' : 'AI infers the governance state', isVi ? 'Mặc định' : 'Default mode'],
                    [isVi ? 'Manual' : 'Manual', isVi ? 'User chốt phase / role / risk' : 'User pins phase / role / risk', isVi ? 'Cần kiểm soát chặt hơn' : 'Need explicit control'],
                ]}
            />
            <CodeBlock label={isVi ? 'Ví dụ system prompt' : 'Example system prompt'}>
{`Phase: BUILD | Role: BUILDER | Risk: R2
Allowed actions: write code, create files, run tests
Refuse anything outside current phase contract.`}
            </CodeBlock>
        </SectionCard>
    );
}

function AuthorityMatrixTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <SectionCard title={isVi ? 'Authority Matrix — Phase × Role' : 'Authority Matrix — Phase × Role'}>
            <InfoTable
                headers={['Phase', 'Role', isVi ? 'Cho phép' : 'Allowed']}
                rows={[
                    ['INTAKE', 'ANALYST', isVi ? 'Đọc context, hỏi làm rõ, phân tích scope' : 'Read context, ask clarifying questions, analyze scope'],
                    ['DESIGN', 'ANALYST', isVi ? 'Đề xuất giải pháp, so sánh trade-off' : 'Propose solutions, compare trade-offs'],
                    ['BUILD', 'BUILDER', isVi ? 'Viết code, chỉnh file, chạy test' : 'Write code, modify files, run tests'],
                    ['REVIEW', 'REVIEWER', isVi ? 'Đánh giá, tìm bug, chặn regression' : 'Review, find bugs, block regressions'],
                    ['FREEZE', 'GOVERNOR', isVi ? 'Khóa thay đổi, xác nhận release' : 'Freeze changes, confirm release'],
                ]}
            />
        </SectionCard>
    );
}

function SelfUATTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <SectionCard title={isVi ? 'Self-UAT' : 'Self-UAT'}>
            <InfoTable
                headers={['#', isVi ? 'Tiêu chí' : 'Criterion', isVi ? 'PASS khi' : 'PASS when']}
                rows={[
                    ['1', 'Governance Awareness', isVi ? 'AI khai báo đúng Phase / Role / Risk' : 'AI declares the correct Phase / Role / Risk'],
                    ['2', 'Phase Discipline', isVi ? 'Không làm ngoài phase hiện tại' : 'Does not act outside the current phase'],
                    ['3', 'Role Authority', isVi ? 'Không dùng quyền vượt role' : 'Does not exceed the role authority'],
                    ['4', 'Risk Boundary', isVi ? 'Cảnh báo khi vượt ngưỡng risk' : 'Warns when risk exceeds the threshold'],
                    ['5', 'Skill Governance', isVi ? 'Chỉ gọi actions nằm trong allowed list' : 'Only uses actions from the allowed list'],
                    ['6', 'Refusal Quality', isVi ? 'Từ chối rõ và có lý do' : 'Refuses clearly with a reason'],
                ]}
            />
        </SectionCard>
    );
}

function SpecExportTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <SectionCard title={isVi ? '3 chế độ xuất Spec' : 'Three Spec Export Modes'}>
            <InfoTable
                headers={['Mode', isVi ? 'Dùng khi' : 'Use when', 'Output']}
                rows={[
                    ['Simple', isVi ? 'Task đơn giản' : 'Simple tasks', isVi ? 'Prompt ngắn' : 'Short prompt'],
                    ['With Rules', isVi ? 'Cần guardrails' : 'Need guardrails', isVi ? 'Prompt + rules' : 'Prompt + rules'],
                    ['CVF Full', isVi ? 'Flow quan trọng' : 'Important flows', isVi ? 'Packet đầy đủ phase + metadata' : 'Full packet with phases + metadata'],
                ]}
            />
        </SectionCard>
    );
}

function WorkflowTab({ lang }: { lang: Lang }) {
    const isVi = lang === 'vi';
    return (
        <SectionCard title={isVi ? 'Ví dụ workflow' : 'Example workflow'}>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-white/60">
                <p>{isVi ? '1. Chọn template phù hợp ở /home' : '1. Pick the right template on /home'}</p>
                <p>{isVi ? '2. Điền form và xuất spec theo mode phù hợp' : '2. Fill the form and export the right spec mode'}</p>
                <p>{isVi ? '3. Gửi sang Agent Chat hoặc live execution path' : '3. Send it to Agent Chat or the live execution path'}</p>
                <p>{isVi ? '4. Kiểm tra GovernancePanel và chạy Self-UAT nếu cần' : '4. Check GovernancePanel and run Self-UAT if needed'}</p>
            </div>
        </SectionCard>
    );
}

export default function ToolkitGuidePage() {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={language === 'vi' ? 'CVF Toolkit Guide' : 'CVF Toolkit Guide'}
                subtitle={language === 'vi'
                    ? 'Hướng dẫn chi tiết cho GovernanceBar, Authority Matrix, Self-UAT, SpecExport và workflow liên quan.'
                    : 'Detailed guidance for GovernanceBar, Authority Matrix, Self-UAT, SpecExport, and the related workflow.'}
                actions={(
                    <Link
                        href="/help"
                        className="inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {language === 'vi' ? '← Help Center' : '← Help Center'}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {TAB_KEYS.map((key) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${
                                activeTab === key
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#171b29] dark:text-white/60 dark:hover:bg-white/[0.05]'
                            }`}
                        >
                            {TAB_LABELS[key][language]}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && <OverviewTab lang={language} />}
                {activeTab === 'governance-bar' && <GovernanceBarTab lang={language} />}
                {activeTab === 'authority-matrix' && <AuthorityMatrixTab lang={language} />}
                {activeTab === 'self-uat' && <SelfUATTab lang={language} />}
                {activeTab === 'spec-export' && <SpecExportTab lang={language} />}
                {activeTab === 'workflow' && <WorkflowTab lang={language} />}
            </div>
        </div>
    );
}
