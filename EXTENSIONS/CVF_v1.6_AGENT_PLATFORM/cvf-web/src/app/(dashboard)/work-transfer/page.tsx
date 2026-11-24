'use client';

// Text Encoding Exception: localized Vietnamese user-facing copy follows this file's existing convention.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileCheck2, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';
import { TechnicalDetails } from '@/components/TechnicalDetails';
import { validateHandoff, type HandoffDecision } from '@/lib/agent-handoff-validator';
import { ArtifactExportPanel, type ArtifactExportRequest } from '@/components/ArtifactExportPanel';
import { HtmlDraftRecovery } from '@/components/HtmlDraftRecovery';
import { HtmlJobControls, PilotHtmlJobControls } from '@/components/HtmlJobControls';
import { useSearchParams } from 'next/navigation';
import { useExecutionStore } from '@/lib/store';
import { restoreReceiptArchive } from '@/lib/execution-receipt-archive';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { KnowledgeJourneyNav } from '@/components/KnowledgeJourneyNav';
import type { AgentRole } from '@/lib/multi-agent';

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

const DECISION_LABEL: Record<HandoffDecision, string> = {
  ALLOW: 'ready',
  WARN: 'review',
  BLOCK: 'waiting',
};

const ACTIVITY_LABEL: Record<string, string> = {
  SUCCESS: 'loggedSuccess',
  FAILED: 'loggedError',
  FAILURE: 'loggedError',
  DENIED: 'loggedDenied',
  BLOCKED: 'loggedDenied',
};

function recordToExportRequest(record: AuditRecord): Partial<ArtifactExportRequest> {
  return {
    title: `Audit Record - ${record.action}`,
    sourcePath: record.targetResource,
    sourceContent: [
      `# Audit Record Draft`,
      '',
      `Action: ${record.action}`,
      `Actor: ${record.actorId} (${record.actorRole})`,
      `Outcome: ${record.outcome}`,
      `Timestamp: ${record.timestamp}`,
      '',
      '## Claim Boundary',
      'This is an editable draft derived from an audit event. It is not proof of a completed transfer and not an authoritative reproduction of the event. It is not final governance proof by itself.',
    ].join('\n'),
    memoryClass: 'FULL_RECORD',
    status: record.outcome,
    claimBoundary: 'Editable draft derived from an audit event. Not proof of a completed transfer, not an authoritative event reproduction, and not final governance proof by itself.',
    receiptAnchor: `transfer-${record.id}`,
  };
}

export default function WorkTransferPage() {
  const searchParams = useSearchParams();
  const pilotExecutionId = searchParams.get('source');
  const executions = useExecutionStore(state => state.executions);
  const pilotExecution = pilotExecutionId ? executions.find(item => item.id === pilotExecutionId) : undefined;
  const [pilotReceiptBinding, setPilotReceiptBinding] = useState<{ id: string; archive: unknown; output: string;
    receipt: GovernanceEvidenceReceipt } | null>(null);
  const pilotReceipt = pilotReceiptBinding?.id === pilotExecutionId
    && pilotReceiptBinding.archive === pilotExecution?.savedReceiptArchive
    && pilotReceiptBinding.output === pilotExecution?.output ? pilotReceiptBinding.receipt : null;
  useEffect(() => {
    let active = true;
    if (pilotExecution?.templateId === 'web_build_handoff' && pilotExecution.status === 'completed'
      && pilotExecution.output && pilotExecution.savedReceiptArchive) {
      void restoreReceiptArchive(pilotExecution.savedReceiptArchive, pilotExecution.id, pilotExecution.output,
        pilotExecution.evidenceReceiptSnapshot).then(receipt => {
          if (active && receipt && receipt.htmlPilotEvidence?.runId === pilotExecution.htmlPilot?.runId)
            setPilotReceiptBinding({ id: pilotExecution.id, archive: pilotExecution.savedReceiptArchive,
              output: pilotExecution.output!, receipt });
        });
    }
    return () => { active = false; };
  }, [pilotExecutionId, pilotExecution?.id, pilotExecution?.templateId, pilotExecution?.status,
    pilotExecution?.savedReceiptArchive, pilotExecution?.output, pilotExecution?.evidenceReceiptSnapshot,
    pilotExecution?.htmlPilot?.runId]);
  const { language, t } = useLanguage();
  const roleLabels: Record<AgentRole, string> = {
    orchestrator: t('workTransferPage.roleOrchestrator'),
    architect: t('workTransferPage.roleArchitect'),
    builder: t('workTransferPage.roleBuilder'),
    reviewer: t('workTransferPage.roleReviewer'),
  };
  const statusOptions = {
    completed: t('workTransferPage.completed'),
    running: t('workTransferPage.running'),
    failed: t('workTransferPage.failed'),
  };

  const [fromAgent, setFromAgent] = useState<AgentRole>('architect');
  const [toAgent, setToAgent] = useState<AgentRole>('builder');
  const [status, setStatus] = useState<'completed' | 'running' | 'failed'>('completed');
  const [editedOutput, setOutput] = useState<string>();
  const output = editedOutput ?? t('workTransferPage.example');

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
          // The shared store returns ascending timestamps. Order a copy newest first (stable, so equal
          // timestamps keep their upstream order) and only then cap, so "recent" shows the latest eight.
          setRecords([...payload.data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8));
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
        <h1 className="text-3xl font-bold tracking-normal text-gray-950 dark:text-white">{t('workTransferPage.title')}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{t('workTransferPage.intro')}</p>
      </header>

      <KnowledgeJourneyNav currentStep={5} wrap />

      {pilotExecutionId && <section data-testid="home-html-pilot-transfer" className="rounded-lg border border-indigo-300 bg-white p-5 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">{t('workTransferPage.pilotTitle')}</h2>
        {pilotReceipt && pilotExecution?.output
          ? <PilotHtmlJobControls key={`${pilotExecution.id}:${pilotReceipt.htmlPilotEvidence?.runId}:${pilotReceipt.htmlPilotEvidence?.outputSha256}`}
              sourceExecutionId={pilotExecution.id} output={pilotExecution.output}
              receipt={pilotReceipt} existingJobId={pilotExecution.htmlPilot?.jobId} />
          : <p role="status">{t('workTransferPage.pilotUnavailable')}</p>}
      </section>}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{t('workTransferPage.check')}</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SelectField label={t('workTransferPage.from')} value={fromAgent} onChange={v => setFromAgent(v as AgentRole)} options={roleLabels} />
            <SelectField label={t('workTransferPage.to')} value={toAgent} onChange={v => setToAgent(v as AgentRole)} options={roleLabels} />
            <SelectField label={t('workTransferPage.status')} value={status} onChange={v => setStatus(v as 'completed' | 'running' | 'failed')} options={statusOptions} />
            <div className="hidden items-end justify-center sm:flex">
              <ArrowRight className="mb-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <label className="sm:col-span-2 text-sm font-semibold">
              {t('workTransferPage.output')}
              <textarea value={output} onChange={e => setOutput(e.target.value)} placeholder={t('workTransferPage.outputPlaceholder')} rows={6} className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 dark:border-gray-700 dark:bg-gray-950" />
            </label>
          </div>
          <div className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${DECISION_STYLE[result.decision]}`}>
            <div className="font-semibold">{t('workTransferPage.decision')}{' · '}{t(`workTransferPage.${DECISION_LABEL[result.decision]}`)}</div>
            <div className="mt-1">{t(result.contextCarried ? 'workTransferPage.carried' : 'workTransferPage.missing')}</div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{t('workTransferPage.summary')}</h2>
            <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">{result.outputSummary}</p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">{t('workTransferPage.boundary')}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{t('workTransferPage.issues')}</h2>
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
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{t('workTransferPage.noIssues')}</p>
            )}
          </div>
        </div>
      </section>

      <section data-testid="history-panel" className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{t('workTransferPage.historyTitle')}</h2>
        </div>
        <p data-testid="history-note" className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{t('workTransferPage.historyNote')}</p>
        <p id="record-panel-note" data-testid="record-panel-note" className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{t('workTransferPage.recordPanelNote')}</p>
        <div className="mt-4">
          {historyState === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('workTransferPage.historyLoading')}
            </div>
          )}
          {historyState === 'error' && (
            <p data-testid="history-error" className="text-sm text-red-600 dark:text-red-400">{t('workTransferPage.historyError')}</p>
          )}
          {historyState === 'ready' && records.length === 0 && (
            <p data-testid="history-empty" className="text-sm text-gray-500 dark:text-gray-400">{t('workTransferPage.historyEmpty')}</p>
          )}
          {historyState === 'ready' && records.length > 0 && (
            <div className="space-y-2" data-testid="history-list">
              {records.map(record => (
                <div key={record.id} className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-gray-900 dark:text-white">{t(`workTransferPage.${Object.hasOwn(ACTIVITY_LABEL, record.outcome) ? ACTIVITY_LABEL[record.outcome] : 'loggedAction'}`)}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.timestamp).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid={`export-record-${record.id}`}
                      aria-expanded={selectedRecord?.id === record.id}
                      aria-controls={selectedRecord?.id === record.id ? `record-panel-${record.id}` : undefined}
                      aria-describedby="record-panel-note"
                      onClick={() => handleSelectRecord(record)}
                      className="shrink-0 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:rgb(var(--cvf-accent-rgb))] dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(selectedRecord?.id === record.id ? 'workTransferPage.closeRecord' : 'workTransferPage.openRecord')}
                    </button>
                  </div>
                  <TechnicalDetails className="mx-4 mb-3" label={t('common.technicalDetails')}>
                    <dl>
                      <dt>{t('workTransferPage.originalAction')}</dt>
                      <dd>{record.action}</dd>
                      <dt className="mt-2">{t('workTransferPage.originalOutcome')}</dt>
                      <dd>{record.outcome}</dd>
                      <dt className="mt-2">{t('workTransferPage.actorReference')}</dt>
                      <dd className="[overflow-wrap:anywhere]">{record.actorId}</dd>
                    </dl>
                  </TechnicalDetails>
                  {selectedRecord?.id === record.id && exportRequest && (
                    <div id={`record-panel-${record.id}`} className="border-t border-gray-200 px-4 pb-4 pt-4 dark:border-gray-800" data-testid="inline-export-panel">
                      {record.id.startsWith('ncr-synthetic-')
                        ? <HtmlJobControls key={record.id} sourceRecordId={record.id} initialRequest={exportRequest} />
                        : <ArtifactExportPanel initialRequest={exportRequest} renderRecovery={(displayed, versionState) => (
                          <HtmlDraftRecovery key={record.id} sourceRecordId={record.id} displayed={displayed} versionState={versionState} />
                        )} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <TechnicalDetails label={t('common.technicalDetails')}>
        <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <li>Work Transfer</li>
          <li>Transfer check</li>
          <li>Carried summary</li>
          <li>Recent audit events</li>
          <li>Home result to exact HTML job</li>
          <li>HTML Export</li>
        </ul>
        <p>{t('workTransferPage.decision')}{' · '}{result.decision}</p>
      </TechnicalDetails>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950">
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
