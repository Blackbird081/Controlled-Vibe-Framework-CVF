'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n';
import type { DraftSnapshot } from '@/lib/html-draft-recovery-contract';
import type { HtmlJob, HtmlJobDecision, HtmlJobVersion, JobCriterion } from '@/lib/html-job-contract';
import { ArtifactExportPanel, type ArtifactExportRequest, type DisplayedResult } from './ArtifactExportPanel'; import { ReceiptEffectDisclosure, jobCapabilityOf, type EffectBoundary } from './ReceiptEffectDisclosure';
import { HtmlDraftRecovery } from './HtmlDraftRecovery';
import { clearPendingJobJournal, readPendingJobJournal, writePendingJobJournal, type PendingJobJournal } from './useHtmlBuildAttempts';

type Props = { sourceRecordId: string; initialRequest: Partial<ArtifactExportRequest> };
type VersionState = 'current' | 'stale' | 'unknown' | null;
const endpoint = '/api/artifacts/jobs';
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:rgb(var(--cvf-accent-rgb))]';
const FIELD_CLASS = `mt-1 block min-h-11 w-full min-w-0 rounded border border-gray-300 p-2 text-sm focus-visible:border-[color:rgb(var(--cvf-accent-rgb))] ${FOCUS_RING} dark:border-gray-600`;
const effects = ['LOCAL_HTML_BUILD', 'LOCAL_DRAFT_SAVE', 'LOCAL_SYNTHETIC_REVIEW'] as const;
// Text Encoding Exception: localized Vietnamese user-facing copy follows the existing UI language owner.
const COPY = {
  en: {
    scopeChecking: 'Checking local test job scope...', sessionRequired: 'Normal session required for the local test job.',
    capabilityChecking: 'Checking local HTML job availability...', jobTitle: 'Local test HTML job', goal: 'Goal', criterion: 'Criterion',
    addCriterion: 'Add criterion', job: 'Job', reviewTitle: 'Review saved HTML version', draft: 'Saved draft',
    reviewNote: 'Review note',
    goalHelp: 'Goal: the work you intend this job to do. It is recorded with the job and does not write or change the page.',
    criteriaHelp: 'Criteria: what a reviewer will check later. They are not applied to the HTML automatically. The HTML packet is built from the review source fields below.',
    lifetimeHelp: 'Nothing typed here is saved until you click Build HTML. Closing and reopening this panel clears edits you have not submitted. After a build starts, its job ID is recorded and an unclear result is checked with Reconcile.',
    operation: { CREATE_JOB: 'job creation', SAVE_DRAFT: 'draft saving', LINK_VERSION: 'version linking', ACCEPT_VERSION: 'review recording' },
    draftState: 'sent from this device, not verified, not accepted.', reopened: 'Reopened original job and saved version.', current: 'Current displayed job and saved version.',
    reviewStale: 'Review target is stale or unconfirmed; this does not accept current work.',
    reviewExact: 'I reviewed this exact saved version', recordReview: 'Record local test review',
    reviewRecorded: 'A local test review by the same user was recorded for this original version:',
    provenanceUnverified: 'Draft provenance remains unverified.', linkSaved: 'Link this confirmed saved version to its original job',
    reconcile: 'Reconcile', jobOutcomeUnknown: 'Job outcome unknown. Reconcile this exact ID before another Build.',
    originalJobRecovered: 'Original job recovered. No Build was started.', savedVersionRecovered: 'Exact saved version and original job recovered by read-only lookup.',
    savedVersionConfirmed: 'Saved version confirmed; no link exists. Link this same pair explicitly.',
    reconcileUnknown: 'Exact read-only reconciliation did not confirm this operation. Its ID remains pending.',
    pendingLink: 'Resolve the pending operation before linking.', linked: 'Exact saved version linked.',
    linkUnknown: 'Link outcome unknown. Reconcile this exact version ID.', criterionNotesRequired: 'Add an inspectable note for every criterion.',
    pendingReview: 'Resolve the pending operation first.', reviewUnknown: 'Review outcome unknown. Reconcile the exact decision ID.',
  },
  vi: {
    scopeChecking: 'Đang kiểm tra phạm vi tác vụ thử nghiệm cục bộ...', sessionRequired: 'Cần phiên đăng nhập thông thường để dùng tác vụ HTML thử nghiệm cục bộ.',
    capabilityChecking: 'Đang kiểm tra khả năng dùng tác vụ HTML thử nghiệm cục bộ...', jobTitle: 'Tác vụ HTML thử nghiệm cục bộ', goal: 'Mục tiêu', criterion: 'Tiêu chí',
    addCriterion: 'Thêm tiêu chí', job: 'Tác vụ', reviewTitle: 'Rà soát phiên bản HTML đã lưu', draft: 'Bản nháp đã lưu',
    reviewNote: 'Ghi chú rà soát',
    goalHelp: 'Mục tiêu: công việc bạn muốn tác vụ này thực hiện. Nội dung này được ghi cùng tác vụ, không tự viết hay sửa trang.',
    criteriaHelp: 'Tiêu chí: điều người rà soát sẽ kiểm tra sau. Tiêu chí không tự áp vào HTML. Gói HTML được tạo từ các trường nguồn rà soát bên dưới.',
    lifetimeHelp: 'Chưa có gì được lưu cho đến khi bạn bấm Tạo HTML. Đóng rồi mở lại bảng sẽ xóa các chỉnh sửa chưa gửi. Sau khi lượt tạo bắt đầu, mã tác vụ được ghi lại và kết quả chưa rõ được kiểm tra bằng Đối soát.',
    operation: { CREATE_JOB: 'tạo tác vụ', SAVE_DRAFT: 'lưu bản nháp', LINK_VERSION: 'liên kết phiên bản', ACCEPT_VERSION: 'ghi nhận lượt rà soát' },
    draftState: 'đã gửi từ thiết bị này, chưa xác minh, chưa được chấp nhận.', reopened: 'Đã mở lại tác vụ gốc và phiên bản đã lưu.', current: 'Tác vụ và phiên bản đã lưu đang hiển thị.',
    reviewStale: 'Đối tượng rà soát đã cũ hoặc chưa được xác nhận; thao tác này không chấp nhận nội dung hiện tại.',
    reviewExact: 'Tôi đã rà soát đúng phiên bản đã lưu này', recordReview: 'Ghi nhận lượt rà soát thử nghiệm cục bộ',
    reviewRecorded: 'Đã ghi nhận lượt rà soát thử nghiệm cục bộ của cùng người dùng cho phiên bản gốc này:',
    provenanceUnverified: 'Nguồn gốc bản nháp vẫn chưa được xác minh.', linkSaved: 'Liên kết phiên bản đã lưu được xác nhận này với tác vụ gốc',
    reconcile: 'Đối soát', jobOutcomeUnknown: 'Chưa rõ kết quả tác vụ. Hãy đối soát đúng mã này trước khi tạo lại.',
    originalJobRecovered: 'Đã khôi phục tác vụ gốc. Không bắt đầu lượt tạo mới.', savedVersionRecovered: 'Đã khôi phục phiên bản đã lưu và tác vụ gốc bằng tra cứu chỉ đọc.',
    savedVersionConfirmed: 'Đã xác nhận phiên bản đã lưu; chưa có liên kết. Hãy liên kết rõ ràng đúng cặp này.',
    reconcileUnknown: 'Đối soát chỉ đọc chưa xác nhận thao tác này. Mã vẫn đang chờ xử lý.',
    pendingLink: 'Hãy xử lý thao tác đang chờ trước khi liên kết.', linked: 'Đã liên kết đúng phiên bản đã lưu.',
    linkUnknown: 'Chưa rõ kết quả liên kết. Hãy đối soát đúng mã phiên bản này.', criterionNotesRequired: 'Hãy thêm ghi chú có thể kiểm tra cho từng tiêu chí.',
    pendingReview: 'Hãy xử lý thao tác đang chờ trước.', reviewUnknown: 'Chưa rõ kết quả rà soát. Hãy đối soát đúng mã quyết định.',
  },
} as const;
type NoticeKey = keyof Omit<typeof COPY.en, 'operation'>;
const url = (values: Record<string, string>) => `${endpoint}?${new URLSearchParams(values)}`;
async function data<T>(response: Response): Promise<T> {
  const payload = await response.json() as { success?: boolean; data?: T; error?: string };
  if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload.data;
}
function VersionStateObserver({ value, update }: { value: VersionState; update: (value: VersionState) => void }) {
  useEffect(() => update(value), [value, update]);
  return null;
}
const sameOwner = (a: HtmlJob['owner'], b: HtmlJob['owner']) => a.userId === b.userId && a.orgId === b.orgId && a.teamId === b.teamId;
const joined = (job: HtmlJob, saved: DraftSnapshot, link: HtmlJobVersion) =>
  job.jobId === link.jobId && job.sourceRecordId === saved.sourceRecordId && saved.sourceRecordId === link.sourceRecordId
  && saved.versionId === link.versionId && job.requestSha256 === saved.requestSha256
  && link.requestSha256 === saved.requestSha256 && link.htmlSha256 === saved.htmlSha256;

export function HtmlJobControls({ sourceRecordId, initialRequest }: Props) {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];
  const helpId = useId();
  const user = session?.user as { userId?: string; orgId?: string; teamId?: string; realUserId?: string; realRole?: string; impersonation?: unknown } | undefined;
  const owner = { userId: user?.userId ?? '', orgId: user?.orgId ?? '', teamId: user?.teamId ?? '' };
  const expires = session?.expires ? Date.parse(session.expires) : NaN;
  const [now, setNow] = useState(() => Date.now());
  const active = status === 'authenticated' && [owner.userId, owner.orgId, owner.teamId].every(x => /^[A-Za-z0-9_-]{1,150}$/.test(x))
    && !user?.realUserId && !user?.realRole && !user?.impersonation && Number.isFinite(expires) && expires > now;
  const scope = JSON.stringify([sourceRecordId, owner, session?.expires, active]);
  const scopeRef = useRef(scope); scopeRef.current = scope;
  const [stateScope, setStateScope] = useState(scope);
  const epoch = useRef(0);
  const busy = useRef(false);
  const [capability, setCapability] = useState<'loading' | 'enabled' | 'disabled'>('loading');
  const [effectBoundary, setEffectBoundary] = useState<EffectBoundary | null>(null);
  const enabled = capability === 'enabled';
  const [goal, setGoal] = useState('');
  const [criteria, setCriteria] = useState<JobCriterion[]>([{ criterionId: 'c1', text: '' }]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [job, setJob] = useState<HtmlJob | null>(null);
  const [jobSignature, setJobSignature] = useState('');
  const [snapshot, setSnapshot] = useState<DraftSnapshot | null>(null);
  const [link, setLink] = useState<HtmlJobVersion | null>(null);
  const [decision, setDecision] = useState<HtmlJobDecision | null>(null);
  const [versionState, setVersionState] = useState<VersionState>(null);
  const [reopened, setReopened] = useState(false);
  const [linkAbsent, setLinkAbsent] = useState(false);
  const [pending, setPending] = useState<PendingJobJournal | null>(null);
  const [notice, setNotice] = useState<NoticeKey | null>(null);
  const signature = JSON.stringify([goal, criteria]);
  const still = (token: number, key: string) => epoch.current === token && scopeRef.current === key && active && Date.now() < expires;

  useEffect(() => {
    epoch.current += 1; busy.current = false;
    setStateScope(scope); setGoal(''); setCriteria([{ criterionId: 'c1', text: '' }]);
    setNotes({}); setConfirmed(false); setJobSignature('');
    setCapability('loading'); setEffectBoundary(null); setJob(null); setSnapshot(null); setLink(null); setDecision(null);
    setPending(null); setNotice(null); setVersionState(null); setReopened(false); setLinkAbsent(false);
    const token = epoch.current; const key = scope;
    if (!active || !sourceRecordId.startsWith('ncr-synthetic-')) { setCapability('disabled'); return; }
    setPending(readPendingJobJournal({ owner, sourceRecordId }));
    void fetch(url({ kind: 'capabilities' }), { cache: 'no-store' }).then(data<{ jobDecisions?: unknown; effectBoundary?: unknown }>)
      .then(value => { if (still(token, key)) {
        const next = jobCapabilityOf(value);
        setCapability(next.enabled ? 'enabled' : 'disabled');
        setEffectBoundary(next.boundary);
      } })
      .catch(() => { if (still(token, key)) setCapability('disabled'); });
    return () => { epoch.current += 1; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- capability fetch is keyed by the scope key; owner/active/sourceRecordId are inputs of that key
  }, [scope]);
  useEffect(() => {
    if (!Number.isFinite(expires) || expires <= Date.now()) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(expires - Date.now(), 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [expires, now]);

  const prepareJob = useCallback(async (request: ArtifactExportRequest) => {
    if (!active || Date.now() >= expires || busy.current || !enabled || goal.length < 1 || goal.length > 2000
      || criteria.some(c => !c.text.trim())) throw new Error('Complete the goal and criteria first.');
    const token = epoch.current; const key = scope;
    const jobId = crypto.randomUUID();
    const journal: PendingJobJournal = { schema: 'cvf.htmlJobPending.v1', owner, sourceRecordId, jobId, operation: 'CREATE_JOB' };
    if (!writePendingJobJournal(journal)) throw new Error('Resolve the pending operation before another write.');
    busy.current = true; setPending(journal);
    try {
      const created = await data<HtmlJob>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_JOB', jobId, sourceRecordId, goal, criteria, expectedOutput: 'HTML', allowedEffects: effects, request }) }));
      if (!still(token, key)) throw new Error('Owner or session changed.');
      if (created.jobId !== jobId || created.sourceRecordId !== sourceRecordId || !sameOwner(created.owner, owner)) throw new Error('Job readback mismatch.');
      clearPendingJobJournal(journal); setPending(null); setJob(created); setJobSignature(JSON.stringify([created.goal, created.criteria]));
      setSnapshot(null); setLink(null); setDecision(null); setNotes({}); setConfirmed(false); setReopened(false); setLinkAbsent(false);
      return { jobId, sourceRecordId };
    } catch (error) { if (still(token, key)) setNotice('jobOutcomeUnknown'); throw error; }
    finally { if (still(token, key)) busy.current = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- owner is read through its three id fields, which are listed; `still` is a stable epoch/scope check
  }, [active, expires, enabled, goal, criteria, owner.userId, owner.orgId, owner.teamId, sourceRecordId, scope]);

  const loadJob = async (jobId: string) => data<HtmlJob>(await fetch(url({ kind: 'job', jobId, sourceRecordId }), { cache: 'no-store' }));
  const loadSnapshot = async (versionId: string) => data<DraftSnapshot>(await fetch(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId, id: versionId })}`, { cache: 'no-store' }));
  const loadLink = async (jobId: string, versionId: string) => fetch(url({ kind: 'version', jobId, sourceRecordId, versionId }), { cache: 'no-store' });

  const reconcile = async () => {
    if (!active || Date.now() >= expires || !pending) return;
    const token = epoch.current; const key = scope; const target = pending;
    try {
      const foundJob = await loadJob(target.jobId);
      if (!still(token, key) || foundJob.jobId !== target.jobId || foundJob.sourceRecordId !== sourceRecordId || !sameOwner(foundJob.owner, owner)) return;
      if (target.operation === 'CREATE_JOB') {
        setGoal(foundJob.goal); setCriteria(foundJob.criteria); setJob(foundJob);
        setNotes({}); setConfirmed(false);
        setJobSignature(JSON.stringify([foundJob.goal, foundJob.criteria])); setReopened(true);
        clearPendingJobJournal(target); setPending(null); setNotice('originalJobRecovered'); return;
      }
      const versionId = target.versionId!;
      const foundSnapshot = await loadSnapshot(versionId);
      if (!still(token, key) || foundSnapshot.versionId !== versionId || foundSnapshot.sourceRecordId !== sourceRecordId
        || foundSnapshot.requestSha256 !== foundJob.requestSha256 || foundSnapshot.state !== 'CLIENT_SUBMITTED_UNVERIFIED'
        || foundSnapshot.acceptance !== 'DRAFT_UNACCEPTED') return;
      const linkResponse = await loadLink(target.jobId, versionId);
      if (!still(token, key)) return;
      let foundLink: HtmlJobVersion | null = null;
      if (linkResponse.ok) foundLink = await data<HtmlJobVersion>(linkResponse);
      else if (linkResponse.status !== 404) throw new Error('LINK_UNCONFIRMED');
      if (!still(token, key) || (foundLink && !joined(foundJob, foundSnapshot, foundLink))) return;
      if (target.operation === 'ACCEPT_VERSION') {
        if (!foundLink || !target.decisionId) throw new Error('JOIN_UNCONFIRMED');
        const foundDecision = await data<HtmlJobDecision>(await fetch(url({ kind: 'decision', jobId: target.jobId,
          sourceRecordId, versionId, decisionId: target.decisionId }), { cache: 'no-store' }));
        if (!still(token, key) || foundDecision.decisionId !== target.decisionId || foundDecision.jobId !== foundJob.jobId
          || foundDecision.versionId !== versionId || foundDecision.requestSha256 !== foundLink.requestSha256
          || foundDecision.htmlSha256 !== foundLink.htmlSha256) return;
        setDecision(foundDecision);
      }
      setGoal(foundJob.goal); setCriteria(foundJob.criteria); setJob(foundJob); setJobSignature(JSON.stringify([foundJob.goal, foundJob.criteria]));
      setNotes({}); setConfirmed(false);
      setSnapshot(foundSnapshot); setLink(foundLink); setReopened(true); setLinkAbsent(!foundLink);
      clearPendingJobJournal(target); setPending(null);
      setNotice(foundLink ? 'savedVersionRecovered' : 'savedVersionConfirmed');
    } catch { if (still(token, key)) setNotice('reconcileUnknown'); }
  };

  const linkSnapshot = async (saved: DraftSnapshot, targetJobId?: string) => {
    if (!active || Date.now() >= expires || !job || targetJobId !== job.jobId || saved.sourceRecordId !== sourceRecordId
      || saved.requestSha256 !== job.requestSha256 || saved.state !== 'CLIENT_SUBMITTED_UNVERIFIED'
      || saved.acceptance !== 'DRAFT_UNACCEPTED' || pending) return;
    const token = epoch.current; const key = scope;
    const journal: PendingJobJournal = { schema: 'cvf.htmlJobPending.v1', owner, sourceRecordId,
      jobId: job.jobId, versionId: saved.versionId, operation: 'LINK_VERSION' };
    if (!writePendingJobJournal(journal)) { setNotice('pendingLink'); return; }
    setPending(journal); setSnapshot(saved); setLink(null); setDecision(null); setNotes({}); setConfirmed(false); setLinkAbsent(false);
    try {
      const created = await data<HtmlJobVersion>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LINK_VERSION', jobId: job.jobId, sourceRecordId, versionId: saved.versionId }) }));
      if (!still(token, key)) return;
      if (!joined(job, saved, created)) throw new Error('Link readback mismatch.');
      clearPendingJobJournal(journal); setPending(null); setLink(created); setNotice('linked');
    } catch { if (still(token, key)) setNotice('linkUnknown'); }
  };

  const accept = async () => {
    if (!active || Date.now() >= expires || !job || !link || !snapshot || !confirmed || pending || decision
      || jobSignature !== signature || (!reopened && versionState !== 'current') || !joined(job, snapshot, link)) return;
    const reviews = job.criteria.map(c => ({ criterionId: c.criterionId, passed: true as const, reviewNote: notes[c.criterionId] ?? '' }));
    if (reviews.some(r => !r.reviewNote.trim() || r.reviewNote.length > 1000)) { setNotice('criterionNotesRequired'); return; }
    const token = epoch.current; const key = scope; const decisionId = crypto.randomUUID();
    const journal: PendingJobJournal = { schema: 'cvf.htmlJobPending.v1', owner, sourceRecordId, jobId: job.jobId,
      versionId: link.versionId, decisionId, operation: 'ACCEPT_VERSION' };
    if (!writePendingJobJournal(journal)) { setNotice('pendingReview'); return; }
    setPending(journal);
    try {
      const created = await data<HtmlJobDecision>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT_VERSION', decisionId, jobId: job.jobId, sourceRecordId, versionId: link.versionId,
          requestSha256: link.requestSha256, htmlSha256: link.htmlSha256, criteriaReview: reviews, reviewedVersionConfirmed: true }) }));
      if (!still(token, key)) return;
      if (created.decisionId !== decisionId || created.jobId !== job.jobId || created.versionId !== link.versionId
        || created.requestSha256 !== link.requestSha256 || created.htmlSha256 !== link.htmlSha256) throw new Error('Decision readback mismatch.');
      clearPendingJobJournal(journal); setPending(null); setDecision(created);
    } catch { if (still(token, key)) setNotice('reviewUnknown'); }
  };

  const canReview = !!job && !!link && !!snapshot && joined(job, snapshot, link) && jobSignature === signature
    && (reopened || versionState === 'current');
  const profileDisclosure = enabled && effectBoundary?.kind === 'LOCAL_SYNTHETIC' ? 'LOCAL_SYNTHETIC' as const : undefined;
  const boundDisclosure = enabled && effectBoundary?.kind === 'BOUND_ENGINE_RECEIPT' ? effectBoundary.disclosure : null;
  const recovery = (displayed: DisplayedResult | null, current: VersionState) => <>
    <VersionStateObserver value={current} update={setVersionState} />
    <HtmlDraftRecovery key={scope} sourceRecordId={sourceRecordId} displayed={displayed} versionState={current}
      jobMode={enabled} onConfirmedSnapshot={(saved, targetJobId) => { void linkSnapshot(saved, targetJobId); }} />
  </>;
  if (stateScope !== scope) return <p role="status">{copy.scopeChecking}</p>;
  if (!active) return <p role="status">{copy.sessionRequired}</p>;
  if (capability === 'loading') return <p role="status">{copy.capabilityChecking}</p>;
  if (!enabled) return <ArtifactExportPanel key={scope} initialRequest={initialRequest} renderRecovery={recovery} />;
  return <div data-testid="html-job-controls" className="space-y-4">
    <section className="rounded-lg border p-3" aria-label={copy.jobTitle}>
      <p className="text-sm font-semibold">{copy.jobTitle}</p>
      <p id={`${helpId}-goal`} data-testid="job-goal-help" className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{copy.goalHelp}</p>
      <p id={`${helpId}-criteria`} data-testid="job-criteria-help" className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{copy.criteriaHelp}</p>
      <p id={`${helpId}-lifetime`} data-testid="job-lifetime-help" className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{copy.lifetimeHelp}</p>
      <label className="mt-2 block text-xs">{copy.goal}<textarea aria-label={copy.goal} aria-describedby={`${helpId}-goal ${helpId}-lifetime`} value={goal} maxLength={2000}
        onChange={e => setGoal(e.target.value)} className={`${FIELD_CLASS} max-w-3xl`}
        onFocus={event => {
          const field = event.currentTarget;
          requestAnimationFrame(() => {
            if (field.isConnected && field.getBoundingClientRect().height + 8 <= window.innerHeight) {
              field.scrollIntoView({ block: 'center', inline: 'nearest' });
            }
          });
        }} /></label>
      {criteria.map((criterion, index) => <label key={criterion.criterionId} className="mt-2 block text-xs">{copy.criterion} {index + 1}
        <input aria-label={`${copy.criterion} ${index + 1}`} aria-describedby={`${helpId}-criteria ${helpId}-lifetime`} value={criterion.text} maxLength={500} className={`${FIELD_CLASS} max-w-xl`}
          onChange={e => setCriteria(xs => xs.map((x, i) => i === index ? { ...x, text: e.target.value } : x))} /></label>)}
      <button type="button" disabled={criteria.length >= 8} onClick={() => setCriteria(xs => [...xs, { criterionId: `c${xs.length + 1}`, text: '' }])}
        className={`mt-2 inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 ${FOCUS_RING}`}>{copy.addCriterion}</button>
      {job && <p data-testid="current-job-id" className="text-xs">{copy.job} {job.jobId}</p>}
    </section>
    {boundDisclosure && <ReceiptEffectDisclosure disclosure={boundDisclosure} language={language === 'vi' ? 'vi' : 'en'} />}
    <ArtifactExportPanel key={scope} initialRequest={initialRequest} prepareJob={prepareJob} renderRecovery={recovery} profileDisclosure={profileDisclosure} />
    {pending && <button type="button" onClick={() => void reconcile()} data-testid="reconcile-job-operation">
      {copy.reconcile} {copy.operation[pending.operation]} {pending.jobId} {pending.versionId ?? ''} {pending.decisionId ?? ''}</button>}
    {linkAbsent && job && snapshot && !pending && <button type="button" data-testid="link-confirmed-version"
      onClick={() => void linkSnapshot(snapshot, job.jobId)}>{copy.linkSaved}</button>}
    {notice && <p role="status">{copy[notice]}</p>}
    {job && snapshot && <section className="rounded-lg border p-3" aria-label={copy.reviewTitle}>
      <p>{copy.draft} {snapshot.versionId}: {copy.draftState}</p>
      <p>{reopened ? copy.reopened : copy.current}</p>
      {!canReview && <p data-testid="review-target-stale">{copy.reviewStale}</p>}
      {link && canReview && <>
        {job.criteria.map(c => <label key={c.criterionId} className="mt-2 block text-xs">{c.text}
          <textarea aria-label={`${copy.reviewNote} ${c.criterionId}`} maxLength={1000} value={notes[c.criterionId] ?? ''}
            onChange={e => setNotes(xs => ({ ...xs, [c.criterionId]: e.target.value }))} className="mt-1 w-full rounded border p-2" /></label>)}
        <label className="block text-xs"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> {copy.reviewExact}</label>
        <button type="button" disabled={!active || !!pending || !!decision} onClick={() => void accept()} data-testid="accept-synthetic-version">{copy.recordReview}</button>
      </>}
      {decision && canReview && decision.jobId === job.jobId && decision.versionId === snapshot.versionId
        && decision.requestSha256 === snapshot.requestSha256 && decision.htmlSha256 === snapshot.htmlSha256
        && <p data-testid="synthetic-review-decision">{copy.reviewRecorded} {decision.decisionId}. {copy.provenanceUnverified}</p>}
    </section>}
  </div>;
}

export { PilotHtmlJobControls } from './PilotHtmlJobControls';
