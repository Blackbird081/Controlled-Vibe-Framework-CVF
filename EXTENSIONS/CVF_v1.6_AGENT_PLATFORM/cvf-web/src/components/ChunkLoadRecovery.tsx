'use client';

import { useEffect } from 'react';

const RECOVERY_KEY = 'cvf_chunk_recovery_v1';
const RETRY_WINDOW_MS = 5 * 60 * 1000;

function isNextChunkUrl(url: string): boolean {
    return /\/_next\/static\/chunks\//.test(url);
}

function canReload(token: string): boolean {
    const now = Date.now();
    const raw = sessionStorage.getItem(RECOVERY_KEY);

    if (!raw) return true;

    try {
        const data = JSON.parse(raw) as { token?: string; ts?: number };
        if (typeof data.ts !== 'number' || now - data.ts > RETRY_WINDOW_MS) return true;
        return data.token !== token;
    } catch {
        return true;
    }
}

function markReload(token: string): void {
    sessionStorage.setItem(
        RECOVERY_KEY,
        JSON.stringify({
            token,
            ts: Date.now(),
        })
    );
}

function getReasonText(reason: unknown): string {
    if (typeof reason === 'string') return reason;
    if (reason && typeof reason === 'object' && 'message' in reason) {
        const msg = (reason as { message?: unknown }).message;
        return typeof msg === 'string' ? msg : '';
    }
    return '';
}

function isChunkLoadMessage(message: string): boolean {
    return (
        /ChunkLoadError/i.test(message) ||
        /Loading chunk [\w-]+ failed/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message)
    );
}

export default function ChunkLoadRecovery() {
    useEffect(() => {
        const onResourceError = (event: Event) => {
            const target = event.target;
            if (!(target instanceof HTMLScriptElement)) return;

            const src = target.src || '';
            if (!isNextChunkUrl(src)) return;

            const token = `script:${src}`;
            if (!canReload(token)) return;

            markReload(token);
            window.location.reload();
        };

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const message = getReasonText(event.reason);
            if (!isChunkLoadMessage(message)) return;

            const token = `rejection:${message}`;
            if (!canReload(token)) return;

            markReload(token);
            window.location.reload();
        };

        window.addEventListener('error', onResourceError, true);
        window.addEventListener('unhandledrejection', onUnhandledRejection);

        return () => {
            window.removeEventListener('error', onResourceError, true);
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
        };
    }, []);

    return null;
}
