/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logEnforcementDecision, logPreUatFailure } from './enforcement-log';
import type { EnforcementResult } from './enforcement';

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

import { trackEvent } from '@/lib/analytics';
const trackEventMock = vi.mocked(trackEvent);

describe('enforcement-log', () => {
    beforeEach(() => {
        trackEventMock.mockClear();
    });

    describe('logEnforcementDecision', () => {
        it('tracks enforcement_decision event with all fields', () => {
            const enforcement: EnforcementResult = {
                status: 'BLOCK',
                reasons: ['Budget exceeded'],
                riskGate: { status: 'BLOCK', riskLevel: 'R4', reason: 'R4 blocked' },
                specGate: { status: 'FAIL', completeness: 0, missing: [{ key: 'goal', label: 'Goal', required: true }] },
            };

            logEnforcementDecision({
                source: 'agent_chat',
                mode: 'governance',
                enforcement,
                context: { templateId: 'tmpl-1' },
            });

            expect(trackEventMock).toHaveBeenCalledWith('enforcement_decision', {
                source: 'agent_chat',
                mode: 'governance',
                status: 'BLOCK',
                risk: 'R4',
                specGate: 'FAIL',
                missing: 1,
                reasons: ['Budget exceeded'],
                templateId: 'tmpl-1',
            });
        });

        it('handles missing optional fields gracefully', () => {
            const enforcement: EnforcementResult = {
                status: 'ALLOW',
                reasons: [],
            };

            logEnforcementDecision({
                source: 'spec_export',
                mode: 'simple',
                enforcement,
            });

            expect(trackEventMock).toHaveBeenCalledWith('enforcement_decision', expect.objectContaining({
                source: 'spec_export',
                mode: 'simple',
                status: 'ALLOW',
                risk: undefined,
                specGate: undefined,
                missing: 0,
                reasons: [],
            }));
        });

        it('uses different source types', () => {
            const enforcement: EnforcementResult = { status: 'CLARIFY', reasons: ['Needs more info'] };
            
            logEnforcementDecision({ source: 'multi_agent', mode: 'full', enforcement });
            expect(trackEventMock).toHaveBeenCalledWith('enforcement_decision', expect.objectContaining({ source: 'multi_agent' }));

            logEnforcementDecision({ source: 'api_execute', mode: 'simple', enforcement });
            expect(trackEventMock).toHaveBeenCalledWith('enforcement_decision', expect.objectContaining({ source: 'api_execute' }));
        });
    });

    describe('logPreUatFailure', () => {
        it('tracks pre_uat_failed event', () => {
            logPreUatFailure();
            expect(trackEventMock).toHaveBeenCalledWith('pre_uat_failed', {});
        });

        it('includes context when provided', () => {
            logPreUatFailure({ reason: 'spec incomplete', category: 'phase_discipline' });
            expect(trackEventMock).toHaveBeenCalledWith('pre_uat_failed', {
                reason: 'spec incomplete',
                category: 'phase_discipline',
            });
        });
    });

    describe('SSR guard (typeof window === undefined)', () => {
        it('logEnforcementDecision skips tracking when window is undefined', () => {
            const origWindow = globalThis.window;
            // @ts-expect-error simulating server-side
            delete (globalThis as any).window;
            try {
                logEnforcementDecision({
                    source: 'agent_chat',
                    mode: 'simple',
                    enforcement: { status: 'ALLOW', reasons: [] },
                });
                expect(trackEventMock).not.toHaveBeenCalled();
            } finally {
                (globalThis as any).window = origWindow;
            }
        });

        it('logPreUatFailure skips tracking when window is undefined', () => {
            const origWindow = globalThis.window;
            // @ts-expect-error simulating server-side
            delete (globalThis as any).window;
            try {
                logPreUatFailure({ reason: 'test' });
                expect(trackEventMock).not.toHaveBeenCalled();
            } finally {
                (globalThis as any).window = origWindow;
            }
        });
    });
});
