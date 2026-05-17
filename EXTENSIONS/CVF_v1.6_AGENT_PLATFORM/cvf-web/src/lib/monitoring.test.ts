/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureError } from './monitoring';

describe('captureError', () => {
    beforeEach(() => {
        delete (window as unknown as { Sentry?: unknown }).Sentry;
    });

    it('sends error to Sentry when available', () => {
        const captureException = vi.fn();
        (window as unknown as { Sentry?: { captureException?: (err: Error) => void } }).Sentry = {
            captureException,
        };

        const error = new Error('boom');
        captureError(error, { module: 'test' });
        expect(captureException).toHaveBeenCalledWith(error, { extra: { module: 'test' } });
    });

    it('falls back to console.error without Sentry', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const error = new Error('boom');
        captureError(error);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('handles missing window safely', () => {
        const originalWindow = globalThis.window;
        // @ts-expect-error - intentional for test
        globalThis.window = undefined;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        captureError(new Error('no window'));
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
        globalThis.window = originalWindow;
    });
});
