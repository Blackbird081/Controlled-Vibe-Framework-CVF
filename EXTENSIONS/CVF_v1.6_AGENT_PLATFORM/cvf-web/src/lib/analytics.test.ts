/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    trackEvent,
    getAnalyticsEvents,
    clearAnalyticsEvents,
    isAnalyticsEnabled,
    exportAnalyticsEvents,
    useAnalyticsEvents,
} from './analytics';

const STORAGE_KEY = 'cvf_analytics_events';
const SETTINGS_KEY = 'cvf_settings';

describe('analytics', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-07T10:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('tracks events when enabled and prunes old entries', () => {
        const now = Date.now();
        const old = now - 31 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            { id: 'old', type: 'execution_created', timestamp: old },
        ]));

        const pruned = getAnalyticsEvents();
        expect(pruned.length).toBe(0);

        trackEvent('execution_created', { templateId: 't1' });
        const events = getAnalyticsEvents();
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('execution_created');
    });

    it('respects analytics opt-out', () => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            preferences: { analyticsEnabled: false },
        }));

        expect(isAnalyticsEnabled()).toBe(false);
        trackEvent('execution_created');
        expect(getAnalyticsEvents().length).toBe(0);
    });

    it('handles malformed storage gracefully', () => {
        localStorage.setItem(STORAGE_KEY, 'not-json');
        expect(getAnalyticsEvents().length).toBe(0);

        localStorage.setItem(SETTINGS_KEY, 'not-json');
        expect(isAnalyticsEnabled()).toBe(true);
    });

    it('exports analytics in json and csv', async () => {
        const revokeObjectURLMock = vi.fn();
        (URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock;
        const blobs: Blob[] = [];
        const OriginalBlob = globalThis.Blob;

        class MockBlob {
            private parts: string[];
            constructor(parts: Array<string | ArrayBuffer | Blob>) {
                this.parts = parts.map((part) => (typeof part === 'string' ? part : ''));
            }
            text() {
                return Promise.resolve(this.parts.join(''));
            }
        }
        globalThis.Blob = MockBlob as unknown as typeof Blob;

        const clickMock = vi.fn();
        const originalCreate = document.createElement.bind(document);
        const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return {
                    click: clickMock,
                    set href(_value: string) { },
                    set download(_value: string) { },
                } as unknown as HTMLAnchorElement;
            }
            return originalCreate(tagName);
        });
        (URL as unknown as { createObjectURL: (blob: Blob) => string }).createObjectURL = (blob: Blob) => {
            blobs.push(blob);
            return 'blob:mock';
        };

        trackEvent('execution_created', { templateId: 't1', note: 'a\"b' });
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        existing.unshift({ id: 'evt-plain', type: 'tools_opened', timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        exportAnalyticsEvents('json');
        exportAnalyticsEvents('csv');

        expect(clickMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();
        expect(blobs.length).toBeGreaterThanOrEqual(2);
        const csvBlob = blobs[1];
        const csvText = typeof csvBlob.text === 'function'
            ? await csvBlob.text()
            : '';
        expect(csvText).toContain('execution_created');
        expect(csvText).toContain('templateId');

        createSpy.mockRestore();
        globalThis.Blob = OriginalBlob;
        clearAnalyticsEvents();
    });

    it('noops when window is undefined', () => {
        const originalWindow = globalThis.window;
        // @ts-expect-error - intentional for test
        globalThis.window = undefined;

        expect(isAnalyticsEnabled()).toBe(false);
        expect(getAnalyticsEvents()).toEqual([]);
        trackEvent('tools_opened');
        clearAnalyticsEvents();
        exportAnalyticsEvents('json');

        globalThis.window = originalWindow;
    });

    it('treats missing preferences as enabled', () => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ preferences: {} }));
        expect(isAnalyticsEnabled()).toBe(true);
    });

    it('updates hook state on analytics and storage events', async () => {
        const { result } = renderHook(() => useAnalyticsEvents());
        await act(async () => {});
        expect(result.current.events.length).toBe(0);

        act(() => {
            trackEvent('tools_opened', { source: 'test' });
        });
        expect(result.current.events.length).toBe(1);

        act(() => {
            clearAnalyticsEvents();
        });
        expect(result.current.events.length).toBe(0);

        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            preferences: { analyticsEnabled: false },
        }));
        act(() => {
            window.dispatchEvent(new Event('storage'));
        });
        expect(result.current.enabled).toBe(false);
    });
});
