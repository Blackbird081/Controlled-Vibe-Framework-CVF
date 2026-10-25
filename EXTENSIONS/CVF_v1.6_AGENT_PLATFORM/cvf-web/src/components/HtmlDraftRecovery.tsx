'use client';
// Text Encoding Exception: localized Vietnamese recovery copy follows the existing bilingual UI convention.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n';
import { buildPreviewDocument, containPreviewNavigation, type DisplayedResult } from './ArtifactExportPanel';
import type { DraftInput, DraftSnapshot } from '@/lib/html-draft-recovery-contract';
import { pilotCopy, type PilotLanguage } from './html-pilot-copy';

export function PilotSavedVersionBadge({ snapshot, language = 'en' }: { snapshot: DraftSnapshot; language?: PilotLanguage }) {
  const source = snapshot.pilotSource?.receipt.htmlPilotEvidence;
  return <p data-testid="html-pilot-saved-version" data-version-id={snapshot.versionId} data-html-sha256={snapshot.htmlSha256}
    data-run-id={source?.runId ?? ''}>{pilotCopy(language).badge(snapshot.versionId, source?.runId ?? pilotCopy(language).summary.unavailable, snapshot.htmlSha256)}</p>;
}
import { clearPendingJobJournal, readPendingJobJournal, writePendingJobJournal, type PendingJobJournal } from './useHtmlBuildAttempts';

type Metadata = Pick<DraftSnapshot, 'versionId' | 'filename' | 'createdAt' | 'state' | 'acceptance'>;
type Props = { sourceRecordId: string; displayed: DisplayedResult | null; versionState: 'current' | 'stale' | 'unknown' | null;
  endpoint?: string; jobMode?: boolean; onConfirmedSnapshot?: (snapshot: DraftSnapshot, jobId?: string) => void };
const COPY = {
  en: { title: 'HTML drafts', unverifiedPre: 'Any draft saved here is client-submitted · unverified · unaccepted',
    guidanceBuild: 'No packet is built yet. Build one first; no draft is saved until you choose Save. Show saved versions only lists drafts that were saved earlier.',
    guidanceReady: 'A built packet is shown. No draft is saved until you choose Save. Show saved versions only lists drafts that were saved earlier.',
    save: 'Save displayed draft', saving: 'Saving draft', load: 'Show saved versions', restore: 'Restore',
    download: 'Download saved HTML', saved: 'Saved. You can recover this exact version.', unavailable: 'Draft unavailable or save unconfirmed. Keep this version ID for read-only lookup.',
    empty: 'No saved drafts are available for this record.', unverified: 'Saved client-submitted draft · unverified · unaccepted',
    unknown: 'Only a result built in this form session can be saved.', loadError: 'Saved drafts are unavailable. No new export was started.' },
  vi: { title: 'Bản nháp HTML', unverifiedPre: 'Bản nháp nào được lưu ở đây cũng do trình duyệt gửi · chưa xác minh · chưa chấp nhận',
    guidanceBuild: 'Chưa có gói nào được tạo. Hãy tạo một gói trước; chưa có bản nháp nào được lưu cho đến khi bạn chọn Lưu. Xem các bản đã lưu chỉ liệt kê các bản đã lưu trước đó.',
    guidanceReady: 'Đang hiển thị một gói đã tạo. Chưa có bản nháp nào được lưu cho đến khi bạn chọn Lưu. Xem các bản đã lưu chỉ liệt kê các bản đã lưu trước đó.',
    save: 'Lưu bản nháp đang xem', saving: 'Đang lưu bản nháp', load: 'Xem các bản đã lưu', restore: 'Khôi phục',
    download: 'Tải HTML đã lưu', saved: 'Đã lưu. Có thể khôi phục đúng phiên bản này.', unavailable: 'Không mở được bản nháp hoặc chưa xác nhận lưu. Giữ mã phiên bản để chỉ tra cứu.',
    empty: 'Không có bản nháp đã lưu cho bản ghi này.', unverified: 'Bản nháp do trình duyệt gửi · chưa xác minh · chưa chấp nhận',
    unknown: 'Chỉ lưu được kết quả đã tạo trong phiên biểu mẫu này.', loadError: 'Không xem được các bản đã lưu. Không tạo HTML mới.' },
};

export function HtmlDraftRecovery(props: Props) {
  const { sourceRecordId, jobMode = false } = props;
  const [clock, setClock] = useState(() => Date.now());
  const { data: session, status } = useSession();
  const user = session?.user as { userId?: string; orgId?: string; teamId?: string; realUserId?: string; realRole?: string; impersonation?: unknown } | undefined;
  const expires = session?.expires ? Date.parse(session.expires) : NaN;
  const active = status === 'authenticated' && [user?.userId, user?.orgId, user?.teamId].every(value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value))
    && !user?.realUserId && !user?.realRole && !user?.impersonation && Number.isFinite(expires) && expires > clock;
  const scope = JSON.stringify([sourceRecordId, status, user?.userId, user?.orgId, user?.teamId, session?.expires, active, jobMode]);
  const owner = { userId: user?.userId ?? '', orgId: user?.orgId ?? '', teamId: user?.teamId ?? '' };
  useEffect(() => {
    if (!Number.isFinite(expires) || expires <= clock) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, Math.min(expires - Date.now(), 2 ** 31 - 1)));
    return () => clearTimeout(timer);
  }, [expires, clock]);
  return <HtmlDraftRecoveryScope key={scope} {...props} owner={owner} active={active} expires={expires} />;
}

function HtmlDraftRecoveryScope({ sourceRecordId, displayed, versionState, endpoint = '/api/artifacts/drafts', jobMode = false,
  onConfirmedSnapshot, owner, active, expires }: Props & {
    owner: { userId: string; orgId: string; teamId: string }; active: boolean; expires: number;
}) {
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];
  const [initialPending] = useState(() => {
    const pending = jobMode && active ? readPendingJobJournal({ owner, sourceRecordId }) : null;
    return pending?.operation === 'SAVE_DRAFT' && pending.versionId ? pending.versionId : null;
  });
  const [versions, setVersions] = useState<Metadata[]>([]);
  const [restored, setRestored] = useState<DraftSnapshot | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(initialPending);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(Boolean(initialPending));
  const epoch = useRef(0);
  const sequence = useRef(0);
  const busy = useRef(false);
  const knownSave = useRef<{ id: string; record: string } | null>(null);
  useLayoutEffect(() => () => { epoch.current += 1; sequence.current += 1; }, []);

  const list = async () => {
    if (!active || Date.now() >= expires) return;
    const scopeEpoch = epoch.current;
    const serial = ++sequence.current;
    try {
      const response = await fetch(`${endpoint}?sourceRecordId=${encodeURIComponent(sourceRecordId)}&list=1`, { cache: 'no-store' });
      const payload = await response.json();
      if (scopeEpoch !== epoch.current || serial !== sequence.current) return;
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) throw new Error('UNAVAILABLE');
      setVersions(payload.data); setNotice(payload.data.length ? '' : copy.empty);
    } catch { if (scopeEpoch === epoch.current && serial === sequence.current) setNotice(copy.loadError); }
  };
  const restore = async (versionId: string) => {
    if (!active || Date.now() >= expires) return;
    const scopeEpoch = epoch.current;
    const serial = ++sequence.current;
    setRestored(null);
    try {
      const response = await fetch(`${endpoint}?sourceRecordId=${encodeURIComponent(sourceRecordId)}&id=${encodeURIComponent(versionId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (scopeEpoch !== epoch.current || serial !== sequence.current) return;
      if (!response.ok || !payload.success || payload.data?.versionId !== versionId || payload.data?.sourceRecordId !== sourceRecordId
        || payload.data?.state !== 'CLIENT_SUBMITTED_UNVERIFIED' || payload.data?.acceptance !== 'DRAFT_UNACCEPTED') throw new Error('UNAVAILABLE');
      if (payload.data?.pilotSource && payload.data.pilotSource.receipt?.htmlPilotEvidence?.rootRunId !== sourceRecordId) throw new Error('PILOT_JOIN_REFUSED');
      setRestored(payload.data as DraftSnapshot); setNotice('');
      if (knownSave.current?.id === versionId) setUncertain(false);
      let targetJobId = knownSave.current?.id === versionId ? displayed?.job?.jobId : undefined;
      if (jobMode) {
        const pending = readPendingJobJournal({ owner, sourceRecordId });
        if (pending?.operation === 'SAVE_DRAFT' && pending.versionId === versionId) {
          targetJobId = pending.jobId; clearPendingJobJournal(pending);
        }
      }
      onConfirmedSnapshot?.(payload.data as DraftSnapshot, targetJobId);
    } catch { if (scopeEpoch === epoch.current && serial === sequence.current) setNotice(copy.unavailable); }
  };
  const save = async () => {
    if (!active || uncertain || busy.current || !displayed?.submitted || !displayed.attempt) return;
    const scopeEpoch = epoch.current;
    const serial = ++sequence.current;
    const id = crypto.randomUUID();
    const record = sourceRecordId;
    const input: DraftInput = {
      versionId: id, sourceRecordId: record, request: { ...displayed.submitted }, html: displayed.result.html,
      filename: displayed.result.filename, generatedAt: displayed.result.generatedAt, buildNumber: displayed.attempt,
    };
    let journal: PendingJobJournal | null = null;
    if (jobMode) {
      if (!displayed.job) return;
      journal = { schema: 'cvf.htmlJobPending.v1', owner, sourceRecordId, jobId: displayed.job.jobId,
        versionId: id, operation: 'SAVE_DRAFT' };
      if (!writePendingJobJournal(journal)) { setNotice(copy.unavailable); return; }
    }
    busy.current = true; knownSave.current = { id, record }; setPendingId(id); setSaving(true); setUncertain(true); setNotice('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const payload = await response.json();
      if (scopeEpoch !== epoch.current || serial !== sequence.current) return;
      if (!response.ok || !payload.success || payload.versionId !== id || payload.state !== 'SAVED') throw new Error('UNCONFIRMED');
      setUncertain(false); setNotice(copy.saved); await restore(id); await list();
    } catch { if (scopeEpoch === epoch.current && serial === sequence.current) setNotice(copy.unavailable); }
    finally { if (scopeEpoch === epoch.current) { busy.current = false; setSaving(false); } }
  };
  const reconcile = () => {
    if (knownSave.current?.record === sourceRecordId) void restore(knownSave.current.id);
    else if (jobMode) { const pending = readPendingJobJournal({ owner, sourceRecordId });
      if (pending?.operation === 'SAVE_DRAFT' && pending.versionId) void restore(pending.versionId); }
  };
  const download = () => {
    if (!active || Date.now() >= expires || !restored) return;
    const url = URL.createObjectURL(new Blob([restored.html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = restored.filename.endsWith('.html') ? restored.filename : `${restored.filename}.html`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };
  const visible = active;
  const preview = visible && restored ? containPreviewNavigation(restored.html) : null;
  const hasDraft = !!restored || versions.length > 0 || !!pendingId;
  return <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs dark:border-gray-700 dark:bg-gray-950" data-testid="html-draft-recovery">
    <h4 className="font-semibold text-gray-900 dark:text-white">{copy.title}</h4>
    <p className="mt-1 text-amber-700 dark:text-amber-300">{hasDraft ? copy.unverified : copy.unverifiedPre}</p>
    {visible && !hasDraft && !saving && !notice && <p className="mt-1 text-gray-600 dark:text-gray-300" data-testid="draft-recovery-guidance">{displayed?.submitted && displayed.attempt ? copy.guidanceReady : copy.guidanceBuild}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => void save()} disabled={!visible || !displayed?.submitted || !displayed.attempt || saving || uncertain} className="rounded-lg border border-indigo-300 px-3 py-2 disabled:opacity-50" data-testid="save-displayed-draft">{saving ? copy.saving : copy.save}</button>
      <button type="button" onClick={() => void list()} disabled={!visible} className="rounded-lg border px-3 py-2 disabled:opacity-50" data-testid="list-saved-drafts">{copy.load}</button>
      {visible && pendingId && <button type="button" onClick={reconcile} className="rounded-lg border px-3 py-2" data-testid="reconcile-draft">{copy.restore} {pendingId}</button>}
    </div>
    {versionState === 'unknown' && <p className="mt-2">{copy.unknown}</p>}
    {visible && notice && <p role="status" className="mt-2" data-testid="draft-recovery-notice">{notice}</p>}
    {visible && versions.map(item => <button key={item.versionId} type="button" onClick={() => void restore(item.versionId)} className="mt-2 block text-left underline" data-testid={`restore-${item.versionId}`}>{copy.restore} {item.filename} · {item.versionId}</button>)}
    {visible && restored && <div className="mt-4" data-testid="restored-draft" data-version-id={restored.versionId}>
      <p className="font-semibold text-amber-700">{copy.unverified}</p>
      <button type="button" onClick={download} className="my-2 rounded-lg border px-3 py-2">{copy.download}</button>
      {preview ? <iframe title={copy.title} srcDoc={buildPreviewDocument(preview)} sandbox="" className="h-64 w-full bg-white" /> : <p>{copy.unavailable}</p>}
    </div>}
  </section>;
}
