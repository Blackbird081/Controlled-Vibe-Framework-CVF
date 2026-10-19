// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
    createSpecConfirmationCandidate, MAX_CONFIRMATION_BYTES, renderDocumentaryWorksheet, reviewBindingKey, reviewFileName,
    verifySpecConfirmationReadback, worksheetFileName, type SpecConfirmationCandidate,
} from '@/lib/intent-spec-confirmation';
import {
    readSavedReview, saveReviewCandidate, type ReopenOutcome, type SaveOutcome, type SavedReview,
} from '@/lib/intent-spec-review-client';
import { getPendingReviewDecisions, isCurrentReviewAcknowledged, type IntentSpecReviewState, type ReviewLanguage } from '@/lib/intent-spec-review';

export function IntentSpecConfirmation({ review, language }: { review: IntentSpecReviewState; language: ReviewLanguage }) {
    const vi = language === 'vi';
    const [reviewer, setReviewer] = useState('');
    const [candidate, setCandidate] = useState<SpecConfirmationCandidate | null>(null);
    const [result, setResult] = useState<{ key: string; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [opened, setOpened] = useState(false);
    const [saved, setSaved] = useState<{ key: string; outcome: SaveOutcome | 'saving' } | null>(null);
    const [savedId, setSavedId] = useState('');
    const [reopened, setReopened] = useState<{ key: string; outcome: ReopenOutcome | 'opening' } | null>(null);
    const bindingKey = reviewBindingKey(review, language, reviewer);
    // Authenticated session lifecycle (existing Auth.js provider, read-only): every identity, loading, logout or expiry
    // transition is a new epoch, so an A->B->A sequence can never revive a receipt that began in the first A.
    const { data: session, status } = useSession();
    const sessionUser = session?.user as { userId?: string; orgId?: string; teamId?: string } | undefined;
    const expiresAt = session?.expires ? Date.parse(session.expires) : NaN;
    const [expiredAt, setExpiredAt] = useState<number | null>(null);
    useEffect(() => {
        if (!Number.isFinite(expiresAt)) return;
        const wait = expiresAt - Date.now();
        if (wait <= 0) { setExpiredAt(expiresAt); return; }
        const timer = setTimeout(() => setExpiredAt(expiresAt), Math.min(wait, 2 ** 31 - 1));
        return () => clearTimeout(timer);
    }, [expiresAt]);
    const expired = expiredAt !== null && expiredAt === expiresAt;
    const sessionActive = status === 'authenticated' && !!sessionUser?.userId && !expired;
    const sessionKey = sessionActive
        ? `ACTIVE:${sessionUser!.userId}|${sessionUser!.orgId ?? ''}|${sessionUser!.teamId ?? ''}`
        : `INACTIVE:${expired ? 'expired' : status}`;
    const stateKey = `${bindingKey}::${sessionKey}`;
    const [previousKey, setPreviousKey] = useState(stateKey);
    const [previousSession, setPreviousSession] = useState(sessionKey);
    const liveKey = useRef(stateKey);
    liveKey.current = stateKey;
    const generation = useRef(0);
    if (previousSession !== sessionKey) { setPreviousSession(sessionKey); setSavedId(''); }
    if (previousKey !== stateKey) {
        generation.current++;
        setPreviousKey(stateKey); setCandidate(null); setResult(null); setBusy(false); setSaved(null); setReopened(null);
    }
    const active = candidate?.bindingKey === bindingKey ? candidate : null;
    const ready = reviewer.trim().length > 0 && reviewer.trim().length <= 120
        && isCurrentReviewAcknowledged(review) && getPendingReviewDecisions(review).length === 0;
    const control = 'min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-600';

    const create = async () => {
        const key = stateKey;
        const operation = ++generation.current;
        setCandidate(null); setResult(null); setBusy(true);
        try {
            const next = await createSpecConfirmationCandidate(review, language, reviewer);
            if (liveKey.current === key && generation.current === operation) setCandidate(next);
        } catch {
            if (liveKey.current === key && generation.current === operation) {
                setResult({ key, text: vi ? 'Chưa tạo được gói. Hãy kiểm lại bản review và thử lại.' : 'Could not create the file. Check the review and try again.' });
            }
        } finally { if (generation.current === operation) setBusy(false); }
    };

    // Saving is acknowledged only from the server's exact-readback receipt for this still-current candidate.
    const save = async () => {
        if (!active || !sessionActive) return;
        const key = stateKey;
        const operation = ++generation.current;
        setSaved({ key, outcome: 'saving' }); setBusy(true);
        const outcome = await saveReviewCandidate(active);
        if (liveKey.current === key && generation.current === operation) {
            setSaved({ key, outcome });
            if (outcome.kind === 'saved') setSavedId(outcome.id);
        }
        if (generation.current === operation) setBusy(false);
    };

    const reopen = async () => {
        if (!sessionActive) return;
        const key = stateKey;
        const operation = ++generation.current;
        setReopened({ key, outcome: 'opening' }); setBusy(true);
        const outcome = await readSavedReview(savedId.trim());
        if (liveKey.current === key && generation.current === operation) setReopened({ key, outcome });
        if (generation.current === operation) setBusy(false);
    };

    const download = () => {
        if (!active) return;
        let url: string | null = null;
        try {
            url = URL.createObjectURL(new Blob([active.fileContent], { type: 'application/json;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url; link.download = reviewFileName(active.revision); link.click();
            setResult({ key: stateKey, text: vi ? 'Đã yêu cầu tải. Chọn lại file để kiểm tra nội dung đã lưu.' : 'Download requested. Select the saved file to check its content.' });
        } catch {
            setResult({ key: stateKey, text: vi ? 'Không tải được file. Chưa có xác nhận lưu.' : 'Download failed. No saved-file confirmation.' });
        } finally { if (url) URL.revokeObjectURL(url); }
    };

    // Render-only worksheet from the current owned candidate; a stale or regenerating candidate is never exportable.
    const downloadWorksheet = () => {
        if (!active) return;
        let url: string | null = null;
        try {
            const worksheet = renderDocumentaryWorksheet(active);
            url = URL.createObjectURL(new Blob([worksheet], { type: 'text/markdown;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url; link.download = worksheetFileName(active.revision); link.click();
            setResult({ key: stateKey, text: vi
                ? 'Đã yêu cầu tải phiếu. Hãy giữ cùng file review JSON và kiểm SHA-256 trước khi review thủ công. Phiếu chưa hoàn thành, không phải phê duyệt build.'
                : 'Worksheet download requested. Keep it with the review JSON file and check the SHA-256 before the manual review. The worksheet is unfinished and not a build approval.' });
        } catch {
            setResult({ key: stateKey, text: vi ? 'Không tải được phiếu. Chưa có xác nhận lưu.' : 'Worksheet download failed. No saved-file confirmation.' });
        } finally { if (url) URL.revokeObjectURL(url); }
    };

    const readback = async (file: File) => {
        if (!active) return;
        const key = stateKey;
        const operation = ++generation.current;
        setResult(null); setBusy(true);
        try {
            if (file.size > MAX_CONFIRMATION_BYTES) throw new Error('FILE_TOO_LARGE');
            const ok = await verifySpecConfirmationReadback(active, new Uint8Array(await file.arrayBuffer()));
            if (liveKey.current === key && generation.current === operation) {
                setResult({ key, text: ok
                    ? (vi ? 'File đã chọn khớp đúng gói của bản review này.' : 'Selected file matches this exact review candidate.')
                    : (vi ? 'File không khớp. Chưa xác nhận bản này.' : 'File does not match. This revision is unconfirmed.') });
            }
        } catch {
            if (liveKey.current === key && generation.current === operation) {
                setResult({ key, text: vi ? 'Không kiểm tra được file. Chưa xác nhận bản này.' : 'Could not verify the file. This revision is unconfirmed.' });
            }
        } finally { if (generation.current === operation) setBusy(false); }
    };

    if (!opened) return <button type="button" className={`${control} mt-4`} onClick={() => setOpened(true)}>
        {vi ? 'Lưu bản review để đối chiếu' : 'Keep a review copy for comparison'}
    </button>;

    return <div className="mt-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700" role="group"
        aria-label={vi ? 'Lưu bản review để đối chiếu' : 'Keep a review copy for comparison'}>
        <label className="block text-sm">
            {vi ? 'Tên người review (tự khai báo)' : 'Reviewer name (self-declared)'}
            <input value={reviewer} maxLength={120} className={`${control} mt-1 w-full bg-white dark:bg-gray-900`}
                onChange={event => setReviewer(event.target.value)} />
        </label>
        <p className="my-2 text-xs text-gray-600 dark:text-gray-400">
            {vi ? 'File chứa brief và câu trả lời của bạn. Tải rồi chọn lại file để kiểm đúng nội dung, hoặc lưu lên server nếu cài đặt này cho phép. Tên này chưa được xác thực; server ghi nhận tài khoản đăng nhập riêng. Gói không cấp quyền build.' : 'The file contains your brief and answers. Download and select it again to check the exact content, or save it to the server when this installation allows it. This name is unverified; the server records the signed-in account separately. The file grants no build permission.'}
        </p>
        <button type="button" className={control} disabled={!ready || busy} onClick={create}>
            {vi ? 'Tạo gói cho bản đã review' : 'Create file for reviewed revision'}
        </button>
        {active && <div className="mt-2 space-y-2">
            <button type="button" className={control} disabled={busy} onClick={download}>{vi ? 'Tải gói review' : 'Download review file'}</button>
            <button type="button" className={control} disabled={busy} onClick={downloadWorksheet}>
                {vi ? 'Tải phiếu review kỹ thuật (chưa hoàn thành)' : 'Download technical review worksheet (unfinished)'}
            </button>
            <button type="button" className={control} disabled={busy || !sessionActive} onClick={() => void save()}>
                {vi ? 'Lưu nội dung đã xác nhận lên server' : 'Save confirmed content to server'}
            </button>
            {saved?.key === stateKey && <p role="status" aria-label={vi ? 'Trạng thái lưu server' : 'Server save status'} className="text-sm">
                {saveText(saved.outcome, vi)}</p>}
            <label className="block text-sm">{vi ? 'Chọn file đã lưu để đối chiếu' : 'Select saved file for comparison'}
                <input type="file" accept=".json,application/json" disabled={busy}
                    onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) void readback(file);
                    }} className="mt-1 block w-full text-sm" />
            </label>
        </div>}
        {result?.key === stateKey && <p role="status" className="mt-2 text-sm">{result.text}</p>}
        <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <label className="block text-sm">{vi ? 'Mã bản review đã lưu' : 'Saved review ID'}
                <input value={savedId} maxLength={64} spellCheck={false} disabled={busy}
                    className={`${control} mt-1 w-full bg-white font-mono dark:bg-gray-900`}
                    onChange={event => setSavedId(event.target.value)} />
            </label>
            {!sessionActive && <p role="status" aria-label={vi ? 'Trạng thái phiên đăng nhập' : 'Sign-in session status'} className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {sessionText(status, expired, vi)}</p>}
            <button type="button" className={`${control} mt-2`} disabled={busy || !sessionActive || !savedId.trim()} onClick={() => void reopen()}>
                {vi ? 'Mở bản đã lưu (chỉ đọc)' : 'Open saved copy (read-only)'}
            </button>
            {reopened?.key === stateKey && <ReopenedView outcome={reopened.outcome} vi={vi} />}
        </div>
    </div>;
}

function sessionText(status: string, expired: boolean, vi: boolean): string {
    if (status === 'loading' && !expired) return vi ? 'Đang kiểm tra phiên đăng nhập. Lưu và mở bản đã lưu tạm tắt.' : 'Checking the sign-in session. Saving and opening are paused.';
    return vi ? 'Phiên đăng nhập không còn hiệu lực. Hãy đăng nhập lại để lưu hoặc mở bản đã lưu; kết quả cũ đã được xóa.' : 'No active sign-in session. Sign in again to save or open a saved review; earlier results were cleared.';
}

function saveText(outcome: SaveOutcome | 'saving', vi: boolean): string {
    if (outcome === 'saving') return vi ? 'Đang lưu. Chưa xác nhận cho đến khi server đọc lại đúng nội dung.' : 'Saving. Not confirmed until the server reads the exact content back.';
    switch (outcome.kind) {
        case 'saved': return vi ? `Đã lưu trên server và đọc lại đúng nội dung. Mã: ${outcome.id}. Đây chỉ là nội dung review đã lưu, không phải phê duyệt build.` : `Saved on the server and read back exactly. ID: ${outcome.id}. This is saved review content only, not a build approval.`;
        case 'unavailable': return vi ? 'Server chưa bật tính năng lưu ở đây. File tải về vẫn dùng được. Chưa có gì được lưu.' : 'Server saving is not available here. The downloaded file still works. Nothing was saved.';
        case 'auth': return vi ? 'Hãy đăng nhập lại để lưu. Chưa có gì được xác nhận.' : 'Sign in again to save. Nothing was confirmed.';
        case 'refused': return vi ? 'Server từ chối gói này. Chưa có gì được lưu.' : 'The server refused this file. Nothing was saved.';
        default: return vi ? 'Chưa xác nhận lưu: server có thể có hoặc không có nội dung này. Đừng coi là đã lưu; hãy lưu lại hoặc mở theo mã nếu bạn có.' : 'Save is unconfirmed: the server may or may not hold this content. Do not treat it as saved; save again or open it by ID if you have one.';
    }
}

function ReopenedView({ outcome, vi }: { outcome: ReopenOutcome | 'opening'; vi: boolean }) {
    if (outcome === 'opening') return <p role="status" className="mt-2 text-sm">{vi ? 'Đang mở bản đã lưu.' : 'Opening the saved copy.'}</p>;
    if (outcome.kind !== 'ok') {
        const text = {
            notfound: vi ? 'Không có bản đã lưu với mã này cho tài khoản của bạn.' : 'No saved review with this ID for your account.',
            auth: vi ? 'Hãy đăng nhập lại để mở bản đã lưu.' : 'Sign in again to open a saved review.',
            unavailable: vi ? 'Server chưa bật tính năng lưu ở đây.' : 'Server saving is not available here.',
            failed: vi ? 'Không mở được bản đã lưu. Bản này chưa được xác nhận.' : 'Could not open the saved review. It is unconfirmed.',
        }[outcome.kind];
        return <p role="status" className="mt-2 text-sm">{text}</p>;
    }
    const record: SavedReview = outcome.record;
    return <section className="mt-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
        aria-label={vi ? 'Bản đã lưu (chỉ đọc)' : 'Saved review (read-only)'}>
        <p className="text-xs text-gray-600 dark:text-gray-400">
            {vi ? 'Bản chỉ đọc của nội dung server đã lưu. Không thay đổi bản review hiện tại, không đánh dấu đã xem và không cấp quyền build; sáu mục cần quyết vẫn do bạn xác nhận ở bản hiện tại.' : 'Read-only copy of what the server saved. It does not change the current review, does not mark it viewed and grants no build permission; the six decisions still need confirming in the current revision.'}
        </p>
        <dl className="my-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt>{vi ? 'Phiên bản' : 'Revision'}</dt><dd>{record.revision}</dd>
            <dt>{vi ? 'Ngôn ngữ' : 'Language'}</dt><dd>{record.language}</dd>
            <dt>{vi ? 'Người review (tự khai báo)' : 'Reviewer (self-declared)'}</dt><dd>{record.reviewerName}</dd>
            <dt>{vi ? 'Tạo lúc' : 'Created'}</dt><dd>{record.createdAt}</dd>
            <dt>{vi ? 'Mức xác thực' : 'Assurance'}</dt><dd>{record.assurance}</dd>
        </dl>
        <pre tabIndex={0} aria-label={vi ? 'Nội dung đã lưu' : 'Saved content'}
            className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs dark:bg-gray-900">{record.draft}</pre>
    </section>;
}
