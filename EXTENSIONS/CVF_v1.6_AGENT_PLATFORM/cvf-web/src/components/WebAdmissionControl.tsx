'use client';
// Text Encoding Exception: Vietnamese operational UI follows the existing language context.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { controlFailureLabel } from '@/lib/presentation-labels';
import HeldExecutionNotice from './HeldExecutionNotice';
import { TechnicalDetails } from './TechnicalDetails';

interface ExecutionObservation {
    canonicalId: string;
    contractRevision: string;
    sourceRevision: string;
    state: 'OPEN' | 'FINALIZED';
    active: boolean;
    recordingStatus: 'CONFIRMED' | 'UNCONFIRMED';
    providerContact: 'POSSIBLE_OR_OBSERVED' | 'NOT_OBSERVED';
    continuationHold: boolean;
    pendingOrdinals: number;
    terminalDisposition: string | null;
    gaps: string[];
    updatedAt: string;
}
interface ControlObservation {
    scope: 'verified_owner_canonical_web';
    state: 'OPEN' | 'STOPPED';
    revision: number;
    updatedAt: string | null;
    observedAt: string;
    ownerCapacity: { used: number; limit: 32 };
    execution: ExecutionObservation | null;
}
type Action = 'status' | 'stop' | 'resume';
const STALE_MS = 10000;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;
const utc = (value: unknown): value is string => text(value) && /Z$/.test(value) && Number.isFinite(Date.parse(value));
function observation(value: unknown): ControlObservation | null {
    if (!object(value) || value.scope !== 'verified_owner_canonical_web' || !['OPEN', 'STOPPED'].includes(String(value.state))
        || !integer(value.revision) || !(value.updatedAt === null || utc(value.updatedAt)) || !utc(value.observedAt)
        || !object(value.ownerCapacity) || value.ownerCapacity.limit !== 32 || !integer(value.ownerCapacity.used) || value.ownerCapacity.used > 32) return null;
    const e = value.execution;
    if (e !== null && (!object(e) || !text(e.canonicalId) || !text(e.contractRevision) || !text(e.sourceRevision)
        || !['OPEN', 'FINALIZED'].includes(String(e.state)) || typeof e.active !== 'boolean'
        || !['CONFIRMED', 'UNCONFIRMED'].includes(String(e.recordingStatus))
        || !['POSSIBLE_OR_OBSERVED', 'NOT_OBSERVED'].includes(String(e.providerContact))
        || typeof e.continuationHold !== 'boolean' || !integer(e.pendingOrdinals) || e.pendingOrdinals > 3
        || !(e.terminalDisposition === null || ['COMPLETED', 'VALIDATION_FAILED', 'DENIED', 'CANCELLED', 'EXHAUSTED', 'FAILED'].includes(String(e.terminalDisposition)))
        || !Array.isArray(e.gaps) || e.gaps.length > 16 || !e.gaps.every(text) || !utc(e.updatedAt))) return null;
    return value as unknown as ControlObservation;
}

export default function WebAdmissionControl() {
    const { language } = useLanguage();
    const vi = language === 'vi';
    const [snapshot, setSnapshot] = useState<ControlObservation | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const latest = useRef<ControlObservation | null>(null);
    const mounted = useRef(false);
    const generation = useRef(0);
    const inFlight = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const controller = useRef<AbortController | null>(null);
    const request = useRef<(action: Action) => Promise<void>>(async () => {});

    const run = useCallback(async (action: Action) => {
        if (!mounted.current || inFlight.current) return;
        if (timer.current) clearTimeout(timer.current);
        const current = latest.current;
        if (action === 'resume' && !current) return;
        inFlight.current = true;
        setBusy(true);
        const sequence = ++generation.current;
        const abort = new AbortController();
        controller.current = abort;
        // Only this control request is bounded; /api/execute and its provider signal are never touched.
        const deadline = setTimeout(() => abort.abort(), 5000);
        if (action !== 'status') setFailure('AWAITING_SERVER_OBSERVATION');
        let received: ControlObservation | null = null;
        try {
            const response = await fetch('/api/execute/control', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
                body: JSON.stringify(action === 'resume' ? { action, expectedRevision: current!.revision } : { action }),
                signal: abort.signal,
            });
            if (!mounted.current || sequence !== generation.current) return;
            if (response.status === 401 || response.status === 403) {
                latest.current = null;
                setSnapshot(null);
                setFailure('UNAUTHORIZED');
                return;
            }
            const body: unknown = await response.json();
            if (!mounted.current || sequence !== generation.current) return;
            if (!response.ok || !object(body) || body.success !== true) {
                const code = object(body) && typeof body.code === 'string' && /^[A-Z_]{1,64}$/.test(body.code) ? body.code : 'STATUS_UNAVAILABLE';
                throw new Error(code);
            }
            received = observation(body.control);
            if (!received || (latest.current && received.revision < latest.current.revision)) throw new Error('INVALID_OR_STALE_OBSERVATION');
            latest.current = received;
            setSnapshot(received);
            setNow(Date.now());
            setFailure(null);
        } catch (error) {
            if (mounted.current && sequence === generation.current) {
                setFailure(error instanceof Error && /^[A-Z_]{1,64}$/.test(error.message) ? error.message : 'STATUS_UNAVAILABLE');
            }
        } finally {
            clearTimeout(deadline);
            if (mounted.current && sequence === generation.current) {
                inFlight.current = false;
                setBusy(false);
                const e = (received ?? latest.current)?.execution;
                timer.current = setTimeout(() => void request.current('status'), e?.active || e?.pendingOrdinals ? 1000 : 2000);
            }
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        generation.current++;
        request.current = run;
        queueMicrotask(() => void run('status'));
        const clock = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            mounted.current = false;
            inFlight.current = false;
            if (timer.current) clearTimeout(timer.current);
            clearInterval(clock);
            controller.current?.abort();
        };
    }, [run]);

    const stale = !snapshot || now - Date.parse(snapshot.observedAt) > STALE_MS || Date.parse(snapshot.observedAt) - now > 60000;
    const unknown = stale || !!failure;
    const execution = snapshot?.execution;
    const label = failure === 'UNAUTHORIZED' ? (vi ? 'Chưa có quyền truy cập điều khiển' : 'Control access unavailable')
        : unknown ? (vi ? 'Chưa xác định trạng thái hiện tại' : 'Current status unknown')
        : snapshot?.state === 'STOPPED' ? (vi ? 'Đã dừng nhận lượt mới' : 'New admissions stopped')
            : (vi ? 'Cho phép xét nhận lượt mới' : 'New admissions may be considered');
    const panel = (
        <section aria-labelledby="web-admission-title" className="border-b border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/[0.08] dark:bg-[#1c1d27] dark:text-[#f4f7fb]">
            <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 id="web-admission-title" className="text-sm font-semibold">{vi ? 'Kiểm soát lượt chạy Web' : 'Web admission control'}</h2>
                    <p className="text-xs text-slate-600 dark:text-[#a3adc2]">{vi ? 'Phạm vi tài khoản / tổ chức / nhóm đã xác minh, áp dụng trên các phiên.' : 'Verified account / organization / team scope, across sessions.'}</p>
                    <p role="status" aria-live="polite" className={`mt-1 text-sm font-medium ${unknown ? 'text-amber-700 dark:text-amber-400' : ''}`}>{label}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-[#a3adc2]">{vi ? 'Dừng chặn lượt nhận mới; lượt đã nhận vẫn có thể liên hệ nhà cung cấp. Không xác nhận đã hủy tiến trình.' : 'Stop blocks new admissions; admitted work may still contact the provider. It does not confirm process cancellation.'}</p>
                    {failure && <p role="alert" data-control-code={failure} className="mt-1 text-xs text-amber-600 dark:text-amber-400">{failure === 'UNAUTHORIZED' ? '' : (vi ? 'Chưa xác nhận thay đổi / trạng thái: ' : 'Change / status unconfirmed: ')}<span>{controlFailureLabel(failure, language)}</span></p>}
                    {snapshot && <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-[#a3adc2]">
                        <p>{vi ? 'Sức chứa chủ sở hữu' : 'Owner capacity'}: {snapshot.ownerCapacity.used}/{snapshot.ownerCapacity.limit}. {vi ? 'Trạng thái mở không bảo đảm được nhận lượt.' : 'Open status does not guarantee admission.'}</p>
                        {!execution && <p>{vi ? 'Chưa quan sát thấy lượt đã nhận cho chủ sở hữu này.' : 'No admitted execution observed for this owner.'}</p>}
                        <TechnicalDetails label={vi ? 'Chi tiết kỹ thuật' : 'Technical details'}>
                            <p>{vi ? 'Ảnh chụp máy chủ UTC' : 'Server snapshot UTC'}: <time dateTime={snapshot.observedAt}>{snapshot.observedAt}</time> · {vi ? 'Bản điều khiển' : 'Control revision'}: {snapshot.revision}{stale ? (vi ? ' · Đã cũ' : ' · Stale') : ''}</p>
                            {execution && <>
                                <p className="break-all">Canonical ID: <code>{execution.canonicalId}</code></p>
                                <p>{vi ? 'Quan sát máy chủ' : 'Server observation'}: {execution.state} · {vi ? 'Đang giữ lượt' : 'Active admission'}: {String(execution.active)} · {vi ? 'Lượt chờ ghi nhận' : 'Pending attempts'}: {execution.pendingOrdinals}</p>
                                <p>{vi ? 'Ghi nhận' : 'Recording'}: {execution.recordingStatus} · {vi ? 'Liên hệ nhà cung cấp' : 'Provider contact'}: {execution.providerContact}</p>
                                <p>{vi ? 'Giữ tiếp tục' : 'Continuation hold'}: {String(execution.continuationHold)} · {vi ? 'Kết quả cuối' : 'Terminal disposition'}: {execution.terminalDisposition ?? (vi ? 'Chưa ghi nhận' : 'Not recorded')}</p>
                                <p>{vi ? 'Khoảng trống bằng chứng' : 'Evidence gaps'}: {execution.gaps.length ? execution.gaps.join(', ') : (vi ? 'Không được báo cáo' : 'None reported')}</p>
                                <p className="break-all">{vi ? 'Nguồn / hợp đồng' : 'Source / contract'}: {execution.sourceRevision} / {execution.contractRevision} · UTC: {execution.updatedAt}</p>
                            </>}
                        </TechnicalDetails>
                    </div>}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy || failure === 'UNAUTHORIZED'} onClick={() => void run('stop')} className="min-h-11 rounded-lg border border-rose-500 px-3 text-xs font-medium text-rose-600 disabled:opacity-50 dark:text-rose-400">{vi ? 'Dừng nhận lượt mới' : 'Stop new admissions'}</button>
                    <button type="button" disabled={busy || unknown || snapshot?.state !== 'STOPPED'} onClick={() => void run('resume')} className="min-h-11 rounded-lg border border-slate-400 px-3 text-xs font-medium disabled:opacity-50 dark:border-white/20">{vi ? 'Cho phép nhận lại' : 'Resume admissions'}</button>
                    <button type="button" disabled={busy} onClick={() => void run('status')} className="min-h-11 rounded-lg border border-slate-400 px-3 text-xs disabled:opacity-50 dark:border-white/20">{vi ? 'Làm mới trạng thái' : 'Refresh status'}</button>
                </div>
            </div>
        </section>
    );
    return (
        <div className="md:ml-[220px]">
            <HeldExecutionNotice active={true} language={language} />
            {snapshot ? panel : (
                <TechnicalDetails label={vi ? 'Chi tiết điều khiển lượt chạy' : 'Run control details'}>
                    {panel}
                </TechnicalDetails>
            )}
        </div>
    );
}
