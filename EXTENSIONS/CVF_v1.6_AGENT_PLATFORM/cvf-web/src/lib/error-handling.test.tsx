/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import {
    ErrorBoundary,
    withRetry,
    addToast,
    removeToast,
    subscribeToasts,
    handleAPIError,
    LoadingSpinner,
    EmptyState,
    ToastContainer,
} from './error-handling';

describe('ErrorBoundary', () => {
    it('renders fallback UI and recovers on retry', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        let shouldThrow = true;
        function Flaky() {
            if (shouldThrow) {
                throw new Error('Boom');
            }
            return <div>Recovered</div>;
        }

        render(
            <ErrorBoundary>
                <Flaky />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Something went wrong/i)).toBeTruthy();

        shouldThrow = false;
        fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
        expect(screen.getByText('Recovered')).toBeTruthy();

        consoleSpy.mockRestore();
    }, 10000);

    it('renders custom fallback when provided', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        function Boom() {
            throw new Error('boom');
        }

        render(
            <ErrorBoundary fallback={<div>Custom fallback</div>}>
                <Boom />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom fallback')).toBeTruthy();
        consoleSpy.mockRestore();
    });

    it('shows stack trace in development mode', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        function Boom() {
            throw new Error('dev boom');
        }

        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Stack Trace/i)).toBeTruthy();

        process.env.NODE_ENV = originalEnv;
        consoleSpy.mockRestore();
    });

    it('retries async operations and eventually succeeds', async () => {
        vi.useFakeTimers();
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockResolvedValue('ok');
        const onRetry = vi.fn();

        const promise = withRetry(fn, { maxRetries: 2, delayMs: 100, backoffMultiplier: 2, onRetry });
        await vi.advanceTimersByTimeAsync(100);

        await expect(promise).resolves.toBe('ok');
        expect(onRetry).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('returns immediately when no retries are needed', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        await expect(withRetry(fn)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting retries', async () => {
        vi.useFakeTimers();
        const fn = vi.fn().mockRejectedValue(new Error('always fails'));

        const promise = withRetry(fn, { maxRetries: 2, delayMs: 50 });
        const expectation = expect(promise).rejects.toThrow('always fails');
        await vi.advanceTimersByTimeAsync(50 + 100);
        await expectation;
        vi.useRealTimers();
    });

    it('handles API errors with user-friendly messages', () => {
        expect(handleAPIError(new Error('fetch failed'))).toMatch(/Network error/i);
        expect(handleAPIError(new Error('Timeout'))).toMatch(/timed out/i);
        expect(handleAPIError(new Error('429 rate limit'))).toMatch(/Too many requests/i);
        expect(handleAPIError(new Error('401 unauthorized'))).toMatch(/Authentication failed/i);
        expect(handleAPIError(new Error('API key invalid'))).toMatch(/Authentication failed/i);
        expect(handleAPIError(new Error('API server down'))).toMatch(/API error/i);
        expect(handleAPIError(new Error('random error'))).toBe('random error');
        expect(handleAPIError('unknown')).toMatch(/unexpected/i);
    });

    it('manages toast lifecycle', async () => {
        vi.useFakeTimers();
        const listener = vi.fn();
        const unsubscribe = subscribeToasts(listener);

        const id = addToast({ type: 'success', message: 'Saved', duration: 10 });
        expect(listener).toHaveBeenCalled();
        expect(listener.mock.calls.at(-1)?.[0]?.length).toBe(1);

        vi.advanceTimersByTime(10);
        expect(listener.mock.calls.at(-1)?.[0]?.length).toBe(0);

        removeToast(id);
        unsubscribe();
        vi.useRealTimers();
    });

    it('renders loading spinner and empty state', () => {
        render(<LoadingSpinner size="sm" message="Loading..." />);
        expect(screen.getByText('Loading...')).toBeTruthy();

        render(<EmptyState title="No data" description="Nothing here" />);
        expect(screen.getByText('No data')).toBeTruthy();
        expect(screen.getByText('Nothing here')).toBeTruthy();
    });

    it('renders toast variants', async () => {
        render(<ToastContainer />);

        await act(async () => {});
        const nowSpy = vi.spyOn(Date, 'now');
        nowSpy
            .mockReturnValueOnce(1)
            .mockReturnValueOnce(2)
            .mockReturnValueOnce(3)
            .mockReturnValueOnce(4);

        act(() => {
            addToast({ type: 'success', message: 'Saved', duration: 100000 });
            addToast({ type: 'error', message: 'Failed', duration: 100000 });
            addToast({ type: 'warning', message: 'Warn', duration: 100000 });
            addToast({ type: 'info', message: 'Info', duration: 100000 });
        });

        await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy());
        expect(screen.getByText('Failed')).toBeTruthy();
        expect(screen.getByText('Warn')).toBeTruthy();
        expect(screen.getByText('Info')).toBeTruthy();

        nowSpy.mockRestore();
    });
});
