'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtifactExportRequest, ArtifactExportResult, DisplayedResult } from './ArtifactExportPanel';

export interface HtmlJobReference { jobId: string; sourceRecordId: string }
export interface SupersededOutcome { attempt: number; status: 'pending' | 'success' | 'failure'; id?: string }
export interface AttemptError { attempt: number; message: string }
export type PendingJobOperation = 'CREATE_JOB' | 'SAVE_DRAFT' | 'LINK_VERSION' | 'ACCEPT_VERSION';
export interface PendingJobJournal { schema: 'cvf.htmlJobPending.v1'; owner: { userId: string; orgId: string; teamId: string };
  sourceRecordId: string; jobId: string; versionId?: string; decisionId?: string; operation: PendingJobOperation }
const JOURNAL_KEY = 'cvf-html-job-pending-v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SOURCE = /^[A-Za-z0-9_-]{1,150}$/;
const OWNER = /^[A-Za-z0-9_-]{1,150}$/;
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
export function validatePendingJobJournal(value: unknown): value is PendingJobJournal {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (row.schema !== 'cvf.htmlJobPending.v1' || typeof row.operation !== 'string'
    || !['CREATE_JOB', 'SAVE_DRAFT', 'LINK_VERSION', 'ACCEPT_VERSION'].includes(row.operation)
    || typeof row.sourceRecordId !== 'string' || !SOURCE.test(row.sourceRecordId)
    || typeof row.jobId !== 'string' || !UUID.test(row.jobId)
    || !row.owner || typeof row.owner !== 'object' || Array.isArray(row.owner)) return false;
  const owner = row.owner as Record<string, unknown>;
  if (!exact(owner, ['userId', 'orgId', 'teamId']) || ![owner.userId, owner.orgId, owner.teamId].every(x => typeof x === 'string' && OWNER.test(x))) return false;
  const keys = row.operation === 'CREATE_JOB' ? ['schema', 'owner', 'sourceRecordId', 'jobId', 'operation']
    : row.operation === 'ACCEPT_VERSION' ? ['schema', 'owner', 'sourceRecordId', 'jobId', 'versionId', 'decisionId', 'operation']
      : ['schema', 'owner', 'sourceRecordId', 'jobId', 'versionId', 'operation'];
  if (!exact(row, keys) || (row.operation !== 'CREATE_JOB' && (typeof row.versionId !== 'string' || !UUID.test(row.versionId)))
    || (row.operation === 'ACCEPT_VERSION' && (typeof row.decisionId !== 'string' || !UUID.test(row.decisionId)))) return false;
  return new TextEncoder().encode(JSON.stringify(row)).byteLength <= 512;
}
export function readPendingJobJournal(scope: Pick<PendingJobJournal, 'owner' | 'sourceRecordId'>): PendingJobJournal | null {
  try {
    const raw = sessionStorage.getItem(JOURNAL_KEY);
    if (!raw) return null;
    if (new TextEncoder().encode(raw).byteLength > 512) { sessionStorage.removeItem(JOURNAL_KEY); return null; }
    const value: unknown = JSON.parse(raw);
    if (!validatePendingJobJournal(value) || value.sourceRecordId !== scope.sourceRecordId
      || JSON.stringify(value.owner) !== JSON.stringify(scope.owner)) { sessionStorage.removeItem(JOURNAL_KEY); return null; }
    return value;
  } catch { try { sessionStorage.removeItem(JOURNAL_KEY); } catch { /* storage unavailable */ } return null; }
}
export function writePendingJobJournal(value: PendingJobJournal): boolean {
  if (!validatePendingJobJournal(value)) return false;
  try { if (sessionStorage.getItem(JOURNAL_KEY)) return false;
    sessionStorage.setItem(JOURNAL_KEY, JSON.stringify(value)); return sessionStorage.getItem(JOURNAL_KEY) === JSON.stringify(value); }
  catch { return false; }
}
export function clearPendingJobJournal(value: PendingJobJournal): void {
  try { if (sessionStorage.getItem(JOURNAL_KEY) === JSON.stringify(value)) sessionStorage.removeItem(JOURNAL_KEY); } catch { /* no new write */ }
}
type ApiResponse = { success: boolean; data?: ArtifactExportResult; error?: string };
type Options = {
  initialResult: ArtifactExportResult | null; exportEndpoint: string;
  prepareJob?: (request: ArtifactExportRequest) => Promise<HtmlJobReference>;
  onGenerated?: (result: ArtifactExportResult) => void;
  sameRequest: (a: ArtifactExportRequest, b: ArtifactExportRequest) => boolean;
};
export function useHtmlBuildAttempts({ initialResult, exportEndpoint, prepareJob, onGenerated, sameRequest }: Options) {
  const [displayed, setDisplayed] = useState<DisplayedResult | null>(() => initialResult
    ? { result: initialResult, submitted: null, attempt: null } : null);
  const [pendingAttempt, setPendingAttempt] = useState<number | null>(null);
  const [attemptError, setAttemptError] = useState<AttemptError | null>(null);
  const [superseded, setSuperseded] = useState<SupersededOutcome[]>([]);
  const [stoppedUnknown, setStoppedUnknown] = useState(false);
  const latestAttempt = useRef(0);
  const pendingRequest = useRef<{ attempt: number; snapshot: ArtifactExportRequest } | null>(null);
  const inFlightRequests = useRef<Map<number, ArtifactExportRequest>>(new Map());
  const stoppedRequests = useRef<ArtifactExportRequest[]>([]);
  const controllers = useRef<Map<number, AbortController>>(new Map());
  const disposed = useRef(false);
  useEffect(() => {
    disposed.current = false;
    return () => { disposed.current = true; latestAttempt.current += 1;
      for (const controller of controllers.current.values()) controller.abort(); };
  }, []);
  const stop = useCallback(() => {
    const pending = pendingRequest.current;
    if (!pending) return;
    // Fence before abort; a queued completion cannot publish or call onGenerated.
    latestAttempt.current += 1;
    stoppedRequests.current.push(pending.snapshot);
    setStoppedUnknown(true);
    setPendingAttempt(null);
    setAttemptError(null);
    pendingRequest.current = null;
    controllers.current.get(pending.attempt)?.abort();
  }, []);
  const generate = useCallback(async (request: ArtifactExportRequest) => {
    const submitted = { ...request };
    if (stoppedRequests.current.some(x => sameRequest(x, submitted))
      || [...inFlightRequests.current.values()].some(x => sameRequest(x, submitted))) return;
    const previous = pendingRequest.current;
    const attempt = ++latestAttempt.current;
    const controller = new AbortController();
    pendingRequest.current = { attempt, snapshot: submitted };
    inFlightRequests.current.set(attempt, submitted);
    controllers.current.set(attempt, controller);
    if (previous) setSuperseded(xs => [...xs, { attempt: previous.attempt, status: 'pending' }]);
    setPendingAttempt(attempt); setAttemptError(null);
    const isLatest = () => !disposed.current && latestAttempt.current === attempt;
    const markOld = (status: 'success' | 'failure', id?: string) => setSuperseded(xs => xs.map(x => x.attempt === attempt ? { ...x, status, id } : x));
    try {
      const job = prepareJob ? await prepareJob(submitted) : undefined;
      if (!isLatest()) return;
      // Two bounded, untrusted selectors only when prepareJob returned a valid reference; the seven-field body is unchanged and carries no permit.
      const selectors: Record<string, string> = job && typeof job.jobId === 'string' && typeof job.sourceRecordId === 'string' && UUID.test(job.jobId) && SOURCE.test(job.sourceRecordId)
        ? { 'X-CVF-Job-Id': job.jobId, 'X-CVF-Source-Record-Id': job.sourceRecordId } : {};
      const response = await fetch(exportEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...selectors },
        body: JSON.stringify(submitted), signal: controller.signal });
      const payload = await response.json() as ApiResponse;
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error || `HTTP ${response.status}`);
      if (!isLatest()) { markOld('success', payload.data.governanceReceiptAttemptId || payload.data.governanceReceipt?.receiptId); return; }
      setDisplayed({ result: payload.data, submitted, attempt, job });
      setStoppedUnknown(false);
      onGenerated?.(payload.data);
    } catch (error) {
      if (!isLatest()) { if (!disposed.current) markOld('failure'); return; }
      setAttemptError({ attempt, message: error instanceof Error ? error.message : 'Unknown export error' });
    } finally {
      inFlightRequests.current.delete(attempt);
      controllers.current.delete(attempt);
      if (isLatest()) { pendingRequest.current = null; setPendingAttempt(null); }
    }
  }, [exportEndpoint, onGenerated, prepareJob, sameRequest]);
  return { displayed, pendingAttempt, attemptError, superseded, stoppedUnknown, generate, stop };
}
