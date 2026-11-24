'use client';
// Text Encoding Exception: exact Vietnamese owner-release disclosure from the roadmap.
import { useEffect, useState } from 'react';
import { controlFailureLabel } from '@/lib/presentation-labels';

type Held = { canonicalId: string; revision: number; releasableAt?: string };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const safeTime = (value: unknown): string | undefined => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : undefined;
const safeCode = (value: unknown): string => typeof value === 'string' && /^[A-Z_]{1,64}$/.test(value) ? value : 'STATUS_UNAVAILABLE';

export default function HeldExecutionNotice({ active, language = 'vi' }: { active: boolean; language?: 'vi' | 'en' }) {
    const [held, setHeld] = useState<Held | null>(null);
    const [checked, setChecked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState<string | null>(null);
    const [releasableAt, setReleasableAt] = useState<string | undefined>();

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        queueMicrotask(() => {
            if (cancelled) return;
            setHeld(null); setChecked(false); setFailure(null); setReleasableAt(undefined);
        });
        if (active) void (async () => {
            try {
                const response = await fetch('/api/execute/control', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
                    body: JSON.stringify({ action: 'status' }), signal: controller.signal,
                });
                const body: unknown = await response.json();
                if (!response.ok || !object(body) || body.success !== true || !object(body.control)) return;
                const control = body.control;
                if (!Number.isSafeInteger(control.revision) || (control.revision as number) < 0 || !object(control.execution)
                    || control.execution.active !== true || typeof control.execution.canonicalId !== 'string' || !control.execution.canonicalId) return;
                const canonicalId = control.execution.canonicalId;
                if (control.heldRelease !== undefined && control.heldRelease !== null) {
                    if (!object(control.heldRelease) || typeof control.heldRelease.idDigest !== 'string'
                        || !/^[0-9a-f]{16}$/.test(control.heldRelease.idDigest)) return;
                    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalId));
                    const digest16 = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
                    if (digest16 === control.heldRelease.idDigest) return;
                }
                if (!cancelled) {
                    const time = safeTime(control.releasableAt);
                    setHeld({ canonicalId, revision: control.revision as number, releasableAt: time });
                    setReleasableAt(time);
                }
            } catch { /* A failed status observation never offers a release. */ }
        })();
        return () => { cancelled = true; controller.abort(); };
    }, [active]);

    async function release() {
        if (!held || !checked || busy) return;
        setBusy(true); setFailure(null);
        try {
            const response = await fetch('/api/execute/control', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
                body: JSON.stringify({ action: 'release_held', expectedRevision: held.revision, canonicalId: held.canonicalId }),
            });
            const body: unknown = await response.json();
            if (response.ok && object(body) && body.success === true) { setHeld(null); return; }
            const code = object(body) ? safeCode(body.code) : 'STATUS_UNAVAILABLE';
            setFailure(code);
            if (code === 'RELEASE_TOO_EARLY' && object(body)) setReleasableAt(safeTime(body.releasableAt));
        } catch { setFailure('STATUS_UNAVAILABLE'); }
        finally { setBusy(false); }
    }

    if (!active || !held) return null;
    const time = releasableAt && new Date(releasableAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return <section aria-labelledby="held-execution-title" className="my-4 max-w-xl rounded-lg border border-amber-500 bg-amber-50 p-4 text-left text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <h2 id="held-execution-title" className="font-semibold">Yêu cầu trước chưa rõ kết quả / Previous request outcome unknown</h2>
        <p className="mt-2">Yêu cầu cũ có thể vẫn được xử lý và phát sinh phí. Thao tác này không hủy yêu cầu cũ. CVF sẽ không tự gửi lại hoặc cấp thêm lượt gọi cho yêu cầu đó sau khi xác nhận. Bạn có thể bắt đầu yêu cầu mới; bằng chứng của yêu cầu cũ vẫn được lưu để kiểm tra.</p>
        <label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />Tôi hiểu yêu cầu cũ có thể vẫn phát sinh phí</label>
        {time && <p className="mt-2">Có thể xác nhận sau {time}</p>}
        {failure && <p role="alert" data-control-code={failure} className="mt-2">{controlFailureLabel(failure, language)}</p>}
        <button type="button" disabled={!checked || busy} onClick={() => void release()} className="mt-3 min-h-11 rounded-lg border border-amber-700 px-3 font-medium disabled:opacity-50">Cho phép bắt đầu yêu cầu mới</button>
    </section>;
}
