/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
    ErrorBoundary,
    withRetry,
    addToast,
    removeToast,
    subscribeToasts,
    handleAPIError,
    LoadingSpinner,
    EmptyState,
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
        expect(handleAPIError(new Error('API server down'))).toMatch(/API error/i);
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
});
