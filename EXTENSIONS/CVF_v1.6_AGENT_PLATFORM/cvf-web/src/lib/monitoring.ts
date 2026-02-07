'use client';

export function captureError(error: Error, context?: Record<string, unknown>) {
    if (typeof window !== 'undefined') {
        const sentry = (window as unknown as { Sentry?: { captureException?: (err: Error, ctx?: unknown) => void } }).Sentry;
        if (sentry?.captureException) {
            sentry.captureException(error, { extra: context });
            return;
        }
    }

    console.error('Captured error', error, context);
}
