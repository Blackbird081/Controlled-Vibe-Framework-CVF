'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import type { DraftSnapshot } from '@/lib/html-draft-recovery-contract';
import type { HtmlJob, HtmlJobVersion, HtmlPilotProductDecision } from '@/lib/html-job-contract';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { renderLockedHtmlPilotSource } from '@/lib/html-cta-rendering';
import { useExecutionStore } from '@/lib/store';
import { PilotArtifactSourceSummary, type ArtifactExportRequest, type DisplayedResult } from './ArtifactExportPanel';
import { PilotSavedVersionBadge } from './HtmlDraftRecovery';
import { pilotAttemptMatchesSource } from './useHtmlBuildAttempts';
import { pilotCopy, pilotLanguageOf, renderPilotStatus, type PilotDecisionToken, type PilotStatus } from './html-pilot-copy';

const PILOT_JOB_EFFECTS = ['REAL_PROVIDER_FICTIONAL_CONTENT', 'LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE'] as const;
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:rgb(var(--cvf-accent-rgb))]';
const BUTTON = `inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 ${FOCUS_RING}`;

type PilotProps = { sourceExecutionId: string; output: string; receipt: GovernanceEvidenceReceipt; existingJobId?: string };

/** Exact-run pilot controls. Every write is user initiated and every unclear write keeps its original ID. */
export function PilotHtmlJobControls({ sourceExecutionId, output, receipt, existingJobId }: PilotProps) {
  const { language } = useLanguage();
  const lang = pilotLanguageOf(language);
  const copy = pilotCopy(lang);
  const text = copy.controls;
  const headingId = useId();
  const evidence = receipt.htmlPilotEvidence;
  const renderEpoch = useRef(0);
  const updateExecution = useExecutionStore(state => state.updateExecution);
  const [jobId, setJobId] = useState(existingJobId ?? '');
  const [candidateJobId] = useState(() => existingJobId ?? crypto.randomUUID());
  const [job, setJob] = useState<HtmlJob | null>(null);
  const [rendered, setRendered] = useState<DisplayedResult['result'] | null>(null);
  const [versionId, setVersionId] = useState('');
  const [saved, setSaved] = useState<DraftSnapshot | null>(null);
  const [linked, setLinked] = useState<HtmlJobVersion | null>(null);
  const [versions, setVersions] = useState<Array<{ versionId: string; createdAt: string }>>([]);
  const [decision, setDecision] = useState<HtmlPilotProductDecision | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [pending, setPending] = useState('');
  const [busyPilot, setBusyPilot] = useState(false);
  const [status, setStatus] = useState<PilotStatus | null>(null);
  const root = evidence?.rootRunId ?? '';
  const title = renderLockedHtmlPilotSource(output, evidence?.parentRunId ?? null)?.title ?? '';
  const request: ArtifactExportRequest = { title, sourcePath: `pilot:${evidence?.runId ?? ''}`, sourceContent: output,
    memoryClass: 'FULL_RECORD', status: 'DRAFT_UNACCEPTED',
    claimBoundary: 'Signed fictional-content pilot draft. Exact version awaits operator acceptance.',
    receiptAnchor: evidence?.receiptId ?? '' };
  const pilotSource = { receipt };
  const qs = (kind: string, id = jobId, version = versionId) => `/api/artifacts/jobs?${new URLSearchParams({ kind, jobId: id, sourceRecordId: root,
    ...(version ? { versionId: version } : {}) })}`;
  useEffect(() => {
    if (!existingJobId || !root) return;
    let active = true;
    void fetch(`/api/artifacts/jobs?${new URLSearchParams({ kind: 'job', jobId: existingJobId, sourceRecordId: root })}`,
      { cache: 'no-store' }).then(response => response.json()).then(value => {
      if (active && value.success && value.data?.jobId === existingJobId && value.data?.pilotRootRunId === root) setJob(value.data as HtmlJob);
    }).catch(() => { if (active) setStatus({ code: 'EXISTING_JOB_UNAVAILABLE' }); });
    return () => { active = false; };
  }, [existingJobId, root]);
  const parse = async <T,>(response: Response): Promise<T> => {
    const value = await response.json() as { success?: boolean; data?: T; error?: string };
    if (!response.ok || !value.success || !value.data) throw new Error(value.error ?? `HTTP ${response.status}`);
    return value.data;
  };
  const post = async <T,>(url: string, body: Record<string, unknown>) => parse<T>(await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  const create = async () => {
    if (!evidence || evidence.parentRunId || jobId || busyPilot || pending) return;
    setBusyPilot(true); setPending('CREATE_JOB'); setStatus({ code: 'CREATING' });
    try {
      const created = await post<HtmlJob>('/api/artifacts/jobs', { action: 'CREATE_JOB', jobId: candidateJobId,
        sourceRecordId: root, goal: 'Fictional Vietnamese community landing page',
        criteria: [{ criterionId: 'source', text: 'Signed exact source' }, { criterionId: 'cta', text: 'Same-page CTA' }],
        expectedOutput: 'HTML', allowedEffects: PILOT_JOB_EFFECTS, request, pilotSource });
      if (created.jobId !== candidateJobId || created.pilotRootRunId !== root
        || !pilotAttemptMatchesSource(receipt, evidence.runId, root, evidence.outputSha256)) throw new Error('JOB_JOIN_MISMATCH');
      setJob(created); setJobId(created.jobId); setPending('');
      updateExecution(sourceExecutionId, { htmlPilot: { operationKey: evidence.operationKey, runId: evidence.runId,
        rootRunId: root, parentRunId: evidence.parentRunId, outputSha256: evidence.outputSha256,
        jobId: created.jobId, profileDigest: evidence.profileDigest } });
      setStatus({ code: 'JOB_CREATED' });
    } catch (error) { setStatus({ code: 'JOB_UNKNOWN', error: String(error) }); }
    finally { setBusyPilot(false); }
  };
  const reconcileJob = async () => {
    try {
      const found = await parse<HtmlJob>(await fetch(qs('job', candidateJobId, ''), { cache: 'no-store' }));
      if (found.jobId !== candidateJobId || found.pilotRootRunId !== root) throw new Error('JOB_JOIN_MISMATCH');
      setJob(found); setJobId(found.jobId); setPending(''); setStatus({ code: 'JOB_RECOVERED' });
      if (evidence) updateExecution(sourceExecutionId, { htmlPilot: { operationKey: evidence.operationKey, runId: evidence.runId,
        rootRunId: root, parentRunId: evidence.parentRunId, outputSha256: evidence.outputSha256,
        jobId: found.jobId, profileDigest: evidence.profileDigest } });
    } catch { setStatus({ code: 'JOB_NOT_CONFIRMED' }); }
  };
  const render = async () => {
    if (!jobId || !job || !evidence || busyPilot || pending) return;
    const epoch = ++renderEpoch.current;
    setBusyPilot(true); setPending('RENDER_LOCAL'); setStatus({ code: 'RENDERING' });
    try {
      const result = await parse<DisplayedResult['result']>(await fetch('/api/artifacts/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cvf-html-pilot': '1',
          'x-cvf-job-id': jobId, 'x-cvf-source-record-id': root }, body: JSON.stringify({ ...request, pilotSource }),
      }));
      if (epoch !== renderEpoch.current) return;
      setRendered(result); setStatus({ code: 'RENDERED' });
    } catch (error) { if (epoch === renderEpoch.current) setStatus({ code: 'RENDER_REFUSED', error: String(error) }); }
    finally { if (epoch === renderEpoch.current) { setBusyPilot(false); setPending(''); } }
  };
  const stopRender = () => {
    if (pending !== 'RENDER_LOCAL') return;
    renderEpoch.current += 1;
    setBusyPilot(false); setPending('');
    setStatus({ code: 'RENDER_STOPPED' });
  };
  const save = async () => {
    if (!rendered || !jobId || !evidence || pending || busyPilot) return;
    const id = crypto.randomUUID(); setVersionId(id); setPending('SAVE_DRAFT'); setBusyPilot(true);
    try {
      const response = await fetch('/api/artifacts/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: id, sourceRecordId: root, request, html: rendered.html,
          filename: rendered.filename, generatedAt: rendered.generatedAt, buildNumber: 1, pilotSource }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const found = await parse<DraftSnapshot>(await fetch(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: root, id })}`,
        { cache: 'no-store' }));
      if (found.versionId !== id || found.pilotSource?.receipt.htmlPilotEvidence?.runId !== evidence.runId) throw new Error('VERSION_JOIN_MISMATCH');
      setSaved(found); setPending(''); setStatus({ code: 'SAVED' });
    } catch { setStatus({ code: 'SAVE_UNKNOWN', versionId: id }); }
    finally { setBusyPilot(false); }
  };
  const recoverVersion = async (id: string) => {
    try {
      const found = await parse<DraftSnapshot>(await fetch(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: root, id })}`,
        { cache: 'no-store' }));
      if (found.versionId !== id || found.pilotSource?.receipt.htmlPilotEvidence?.rootRunId !== root) throw new Error('VERSION_JOIN_MISMATCH');
      setSaved(found); setVersionId(id); setRendered({ html: found.html, filename: found.filename,
        generatedAt: found.generatedAt, receiptAnchor: found.request.receiptAnchor, verification: [] });
      const linkResponse = await fetch(qs('version', jobId, id), { cache: 'no-store' });
      setLinked(linkResponse.ok ? await parse<HtmlJobVersion>(linkResponse) : null);
      const decisionResponse = await fetch(qs('product-decision', jobId, id), { cache: 'no-store' });
      setDecision(decisionResponse.ok ? await parse<HtmlPilotProductDecision>(decisionResponse) : null);
      setReviewed(false); setPending(''); setStatus({ code: 'VERSION_RESTORED' });
    } catch { setStatus({ code: 'VERSION_UNAVAILABLE' }); }
  };
  const link = async () => {
    if (!saved || !jobId || pending || busyPilot) return;
    setPending('LINK_VERSION'); setBusyPilot(true);
    try {
      const value = await post<HtmlJobVersion>('/api/artifacts/jobs', { action: 'LINK_VERSION', jobId, sourceRecordId: root, versionId: saved.versionId });
      if (value.htmlSha256 !== saved.htmlSha256 || value.pilotSourceRunId !== saved.pilotSource?.receipt.htmlPilotEvidence?.runId) throw new Error('LINK_MISMATCH');
      setLinked(value); setPending(''); setStatus({ code: 'LINKED' });
    } catch { setStatus({ code: 'LINK_UNKNOWN' }); }
    finally { setBusyPilot(false); }
  };
  const listVersions = async () => {
    try {
      const rows = await parse<Array<{ versionId: string; createdAt: string }>>(await fetch(
        `/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: root, list: '1' })}`, { cache: 'no-store' }));
      setVersions(rows);
    } catch { setStatus({ code: 'VERSIONS_UNAVAILABLE' }); }
  };
  const decide = async (value: 'ACCEPTED' | 'REJECTED') => {
    if (!reviewed || !linked || !saved || decision || pending || busyPilot) return;
    setBusyPilot(true); setPending('DECIDE_PRODUCT_VERSION');
    try {
      const selected = await post<HtmlPilotProductDecision>('/api/artifacts/jobs', { action: 'DECIDE_PRODUCT_VERSION',
        jobId, sourceRecordId: root, versionId: saved.versionId, decisionId: crypto.randomUUID(),
        htmlSha256: saved.htmlSha256, sourceEvidenceSha256: linked.pilotEvidenceSha256,
        decision: value, reviewedVersionConfirmed: true });
      setDecision(selected); setPending('');
      setStatus({ code: 'DECIDED', versionId: saved.versionId, token: selected.decision });
    } catch { setStatus({ code: 'DECISION_UNKNOWN' }); }
    finally { setBusyPilot(false); }
  };
  if (!evidence || evidence.rootRunId !== root || !title) return <p role="alert">{text.sourceUnavailable}</p>;
  const decisionToken: PilotDecisionToken = decision?.decision ?? 'PENDING_OPERATOR_ACCEPTANCE';
  const blocked = busyPilot || !!pending;
  return <section data-testid="html-pilot-job-controls" aria-labelledby={headingId} className="min-w-0 max-w-full space-y-3 rounded-lg border p-4 [overflow-wrap:anywhere]">
    <h2 id={headingId} className="text-lg font-semibold">{text.heading}</h2>
    <PilotArtifactSourceSummary receipt={receipt} language={lang} />
    <p data-testid="pilot-decision-state" data-decision={decisionToken}>{text.sourceLine(evidence.runId, root, evidence.receiptId)} {text.decisionLine(decisionToken)}</p>
    <p role="status" aria-live="polite" data-testid="pilot-status" data-status-code={status?.code ?? ''}>{status ? renderPilotStatus(copy, status) : ''}</p>
    <div role="group" aria-label={text.actions} className="flex flex-wrap items-center gap-2">
      {!jobId && <button type="button" className={BUTTON} data-testid="pilot-create-draft" disabled={blocked} onClick={() => void create()}>{text.createDraft}</button>}
      {pending === 'CREATE_JOB' && <button type="button" className={BUTTON} onClick={() => void reconcileJob()}>{text.checkPreviousCreate}</button>}
      {jobId && <>
        <button type="button" className={BUTTON} data-testid="pilot-build-preview" disabled={blocked} onClick={() => void render()}>{text.buildPreview}</button>
        {pending === 'RENDER_LOCAL' && <button type="button" className={BUTTON} data-testid="pilot-stop-render" onClick={stopRender}>{text.stopWait}</button>}
        {rendered && <button type="button" className={BUTTON} data-testid="pilot-save-version" disabled={blocked || !!saved} onClick={() => void save()}>{text.saveVersion}</button>}
        {versionId && <button type="button" className={BUTTON} onClick={() => void recoverVersion(versionId)}>{text.checkSaved(versionId)}</button>}
        {saved && !linked && !pending && <button type="button" className={BUTTON} data-testid="pilot-use-version" onClick={() => void link()}>{text.useSaved}</button>}
        <button type="button" className={BUTTON} data-testid="pilot-show-versions" onClick={() => void listVersions()}>{text.showVersions}</button>
      </>}
    </div>
    {jobId && <>
      <p data-testid="pilot-job-id" data-job-id={jobId}>{text.job(jobId)}</p>
      <ul aria-label={text.versionList} className="space-y-2">{versions.map(row => <li key={row.versionId} className="flex flex-wrap items-center gap-2">
        <button type="button" className={BUTTON} data-testid="pilot-restore-version" data-version-id={row.versionId} onClick={() => void recoverVersion(row.versionId)}>{text.restore(row.versionId)}</button> {row.createdAt}</li>)}</ul>
      {saved && <>
        <PilotSavedVersionBadge snapshot={saved} language={lang} />
        <a href={`data:text/html;charset=utf-8,${encodeURIComponent(saved.html)}`} download={saved.filename} data-testid="pilot-download-html"
          className={`inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold underline ${FOCUS_RING}`}>{text.download}</a>
        <iframe title={text.previewTitle} sandbox="" srcDoc={saved.html} className="h-72 w-full border" />
      </>}
      {linked && saved && <div className="space-y-2"><p>{text.linkedLine(linked.pilotSourceRunId ?? '')}</p>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" data-testid="pilot-reviewed-version" checked={reviewed} onChange={event => setReviewed(event.target.checked)} /> {text.reviewedCheckbox}</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} data-testid="pilot-accept-version" disabled={!reviewed || !!decision || blocked} onClick={() => void decide('ACCEPTED')}>{text.accept}</button>
          <button type="button" className={BUTTON} data-testid="pilot-reject-version" disabled={!reviewed || !!decision || blocked} onClick={() => void decide('REJECTED')}>{text.reject}</button></div></div>}
    </>}
  </section>;
}
