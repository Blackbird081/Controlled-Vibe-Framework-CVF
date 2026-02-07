/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePhaseDetection } from './usePhaseDetection';

describe('usePhaseDetection', () => {
    it('detects phases and returns compliance', () => {
        const { result } = renderHook(() => usePhaseDetection());
        const phase = result.current.detectPhase('PHASE B: Design');
        expect(phase).toBe('Design');

        const compliance = result.current.getCompliance(phase, 'PHASE B: Design\nGoal: ...\nConstraints: ...');
        expect(compliance).not.toBeNull();
        expect(compliance?.score).toBeTypeOf('number');
    });

    it('returns null compliance when phase is null', () => {
        const { result } = renderHook(() => usePhaseDetection());
        expect(result.current.getCompliance(null, 'text')).toBeNull();
    });
});
