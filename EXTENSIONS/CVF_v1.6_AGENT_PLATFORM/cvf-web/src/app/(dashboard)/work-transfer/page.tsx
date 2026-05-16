'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardCheck, FileCheck2, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { validateHandoff, type HandoffDecision } from '@/lib/agent-handoff-validator';
import { ArtifactExportPanel, type ArtifactExportRequest } from '@/components/ArtifactExportPanel';
import type { AgentRole } from '@/lib/multi-agent';

const COPY = {
  en: {
    label: 'Work Transfer',
    title: 'Pass reviewed work forward with less guesswork',
    intro: 'Check whether a reviewed packet carries enough context for the next person or assistant to continue safely.',
    from: 'From step',
    to: 'Next step',
    status: 'Previous step status',
    output: 'Reviewed summary',
    outputPlaceholder: 'Paste the short review summary that should move forward.',
    check: 'Transfer check',
    carried: 'The reviewed context is present and can move forward.',
    missing: 'The reviewed context is missing and should not move forward yet.',
    summary: 'Carried summary',
    issues: 'Review notes',
    noIssues: 'No transfer issues were found. Keep the source, receipt, and review boundary visible.',
    historyTitle: 'Recent transfers',
    historyEmpty: 'No transfer records found in the audit log.',
    historyLoading: 'Loading transfer history…',
    historyError: 'Could not load transfer history.',
    exportRecord: 'Export as HTML',
    exportingRecord: 'Exporting',
    exportPanel: 'HTML Export',
    benefitsTitle: 'Why this helps people review work',
    boundary: 'This page checks whether the next step has enough context. It is not final proof by itself.',
    benefits: [
      'The next person can see what was reviewed and what still needs attention.',
      'The visible receipt makes the packet easier to trust, share, and revisit.',
      'New knowledge becomes a clear transfer note instead of hidden background context.',
    ],
  },
  vi: {
    label: 'Chuyển giao công việc',
    title: 'Chuyển phần đã rà soát sang bước tiếp theo với ít phỏng đoán hơn',
    intro: 'Kiểm tra gói đã rà soát có đủ ngữ cảnh để người hoặc trợ lý tiếp theo tiếp tục an toàn hay không.',
    from: 'Bước trước',
    to: 'Bước tiếp theo',
    status: 'Trạng thái bước trước',
    output: 'Tóm tắt đã rà soát',
    outputPlaceholder: 'Dán tóm tắt ngắn cần chuyển tiếp.',
    check: 'Kiểm tra chuyển giao',
    carried: 'Ngữ cảnh đã rà soát có đủ để chuyển tiếp.',
    missing: 'Ngữ cảnh đã rà soát đang thiếu và chưa nên chuyển tiếp.',
    summary: 'Tóm tắt được chuyển tiếp',
    issues: 'Ghi chú rà soát',
    noIssues: 'Không phát hiện vấn đề trong chuyển giao. Vẫn cần giữ nguồn, receipt và ranh giới rà soát.',
    historyTitle: 'Lịch sử chuyển giao gần đây',
    historyEmpty: 'Không tìm thấy bản ghi chuyển giao trong audit log.',
    historyLoading: 'Đang tải lịch sử…',
    historyError: 'Không thể tải lịch sử chuyển giao.',
    exportRecord: 'Xuất HTML',
    exportingRecord: 'Đang xuất',
    exportPanel: 'Xuất HTML',
    benefitsTitle: 'Vì sao hữu ích cho người rà soát',
    boundary: 'Trang này kiểm tra bước tiếp theo có đủ ngữ cảnh hay chưa. Nó không phải bằng chứng cuối cùng.',
    benefits: [
      'Người tiếp theo thấy rõ phần nào đã rà soát và phần nào còn cần chú ý.',
      'Receipt nhìn thấy được giúp gói nội dung dễ tin, dễ chia sẻ và dễ xem lại.',
      'Kiến thức mới trở thành ghi chú chuyển giao rõ ràng thay vì ngữ cảnh ẩn.',
    ],
  },
};

interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorRole: string;
  targetResource: string;
  outcome: string;
}

const DECISION_STYLE: Record<HandoffDecision, string> = {
  ALLOW: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100',
  WARN: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
  BLOCK: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100',
};

const ROLE_LABELS = {
  en: { orchestrator: 'Coordinator', architect: 'Planner', builder: 'Maker', reviewer: 'Reviewer' },
  vi: { orchestrator: 'Điều phối', architect: 'Lập kế hoạch', builder: 'Thực hiện', reviewer: 'Rà soát' },
} satisfies Record<'en' | 'vi', Record<AgentRole, string>>;

function recordToExportRequest(record: AuditRecord): Partial<ArtifactExportRequest> {
  return {
    title: `Work Transfer — ${record.action}`,
    sourcePath: record.targetResource,
    sourceContent: [
      `# Work Transfer Record`,
      '',
      `Action: ${record.action}`,
      `Actor: ${record.actorId} (${record.actorRole})`,
      `Outcome: ${record.outcome}`,
      `Timestamp: ${record.timestamp}`,
      '',
      '## Claim Boundary',
      'This is an HTML export of an audit record. It is not final governance proof by itself.',
    ].join('\n'),
    memoryClass: 'FULL_RECORD',
    status: record.outcome,
    claimBoundary: 'HTML export of an audit record. Not final governance proof by itself.',
    receiptAnchor: `transfer-${record.id}`,
  };
}

export default function WorkTransferPage() {
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];
  const roleLabels = ROLE_LABELS[language === 'vi' ? 'vi' : 'en'];

  const [fromAgent, setFromAgent] = useState<AgentRole>('architect');
  const [toAgent, setToAgent] = useState<AgentRole>('builder');
  const [status, setStatus] = useState<'completed' | 'running' | 'failed'>('completed');
  const [output, setOutput] = useState('The new knowledge is ready for review. Keep the source note, receipt, and claim boundary together.');

  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [historyState, setHistoryState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const result = useMemo(() => validateHandoff({
    workflow: { id: 'web-review-demo', name: 'New Knowledge Review', status: status === 'failed' ? 'failed' : 'completed' },
    fromTask: { id: 'source-review', agentId: fromAgent, status, output },
    toAgentId: toAgent,
    toAgentRole: toAgent,
  }), [fromAgent, output, status, toAgent]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/audit')
      .then(r => r.json() as Promise<{ success: boolean; data?: AuditRecord[] }>)
      .then(payload => {
        if (cancelled) return;
        if (payload.success && Array.isArray(payload.data)) {
          setRecords(payload.data.slice(0, 8));
          setHistoryState('ready');
        } else {
          setHistoryState('error');
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryState('error');
      });
    return () => { cancelled = true; };
  }, []);

  const handleSelectRecord = useCallback((record: AuditRecord) => {
    setSelectedRecord(prev => (prev?.id === record.id ? null : record));
  }, []);

  const exportRequest = useMemo(
    () => selectedRecord ? recordToExportRequest(selectedRecord) : undefined,
    [selectedRecord],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 pb-5 dark:border-white/[0.08]">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          {copy.label}
        </div>
        <h1 className="text-3xl font-bold tracking-normal text-gray-950 dark:text-white">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.intro}</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.check}</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectField label={copy.from} value={fromAgent} onChange={v => setFromAgent(v as AgentRole)} options={roleLabels} />
            <SelectField label={copy.to} value={toAgent} onChange={v => setToAgent(v as AgentRole)} options={roleLabels} />
            <SelectField label={copy.status} value={status} onChange={v => setStatus(v as 'completed' | 'running' | 'failed')} options={['completed', 'running', 'failed']} />
            <div className="hidden items-end justify-center sm:flex">
              <ArrowRight className="mb-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <label className="sm:col-span-2 text-sm font-semibold">
              {copy.output}
              <textarea value={output} onChange={e => setOutput(e.target.value)} placeholder={copy.outputPlaceholder} rows={6} className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 dark:border-gray-700 dark:bg-gray-950" />
            </label>
          </div>
          <div className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${DECISION_STYLE[result.decision]}`}>
            <div className="font-semibold">Decision: {result.decision}</div>
            <div className="mt-1">{result.contextCarried ? copy.carried : copy.missing}</div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.summary}</h2>
            <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">{result.outputSummary}</p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">{copy.boundary}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.issues}</h2>
            {result.issues.length > 0 ? (
              <div className="mt-4 space-y-3">
                {result.issues.map(issue => (
                  <div key={issue.code} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                    <TriangleAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{language === 'vi' ? issue.friendlyMessageVi : issue.friendlyMessage}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.noIssues}</p>
            )}
          </div>
        </div>
      </section>

      <section data-testid="history-panel" className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.historyTitle}</h2>
        </div>
        <div className="mt-4">
          {historyState === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {copy.historyLoading}
            </div>
          )}
          {historyState === 'error' && (
            <p data-testid="history-error" className="text-sm text-red-600 dark:text-red-400">{copy.historyError}</p>
          )}
          {historyState === 'ready' && records.length === 0 && (
            <p data-testid="history-empty" className="text-sm text-gray-500 dark:text-gray-400">{copy.historyEmpty}</p>
          )}
          {historyState === 'ready' && records.length > 0 && (
            <div className="space-y-2" data-testid="history-list">
              {records.map(record => (
                <div key={record.id} className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{record.action}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {record.actorId} · {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid={`export-record-${record.id}`}
                      onClick={() => handleSelectRecord(record)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.exportRecord}
                    </button>
                  </div>
                  {selectedRecord?.id === record.id && exportRequest && (
                    <div className="border-t border-gray-200 px-4 pb-4 pt-4 dark:border-gray-800" data-testid="inline-export-panel">
                      <ArtifactExportPanel initialRequest={exportRequest} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.benefitsTitle}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {copy.benefits.map(item => (
            <div key={item} className="flex gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[] | Record<string, string>; onChange: (value: string) => void }) {
  const entries = Array.isArray(options) ? options.map(o => [o, o]) : Object.entries(options);
  return (
    <label className="text-sm font-semibold">
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950">
        {entries.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
