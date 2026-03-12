/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
    getRiskScoreForIntent,
    toCvfRiskBand,
    getCategoryColor,
    getCategoryBg,
    getScoreBar,
} from './risk-models';

describe('risk-models', () => {
    it('returns risk score for known intent and 0 for unknown', () => {
        expect(getRiskScoreForIntent('FILE_READ')).toBe(20);
        expect(getRiskScoreForIntent('UNKNOWN_INTENT')).toBe(0);
    });

    it('maps score to CVF risk band using thresholds', () => {
        expect(toCvfRiskBand(10)).toBe('R1');
        expect(toCvfRiskBand(50)).toBe('R2');
        expect(toCvfRiskBand(75)).toBe('R3');
        expect(toCvfRiskBand(95)).toBe('R4');
    });

    it('falls back to derived band when threshold is missing', () => {
        expect(toCvfRiskBand(120)).toBe('R4');
        expect(toCvfRiskBand(85)).toBe('R3');
        expect(toCvfRiskBand(45)).toBe('R2');
        expect(toCvfRiskBand(5)).toBe('R1');
    });

    it('returns category colors and backgrounds with default fallback', () => {
        expect(getCategoryColor('safe')).toContain('emerald');
        expect(getCategoryColor('caution')).toContain('amber');
        expect(getCategoryColor('dangerous')).toContain('orange');
        expect(getCategoryColor('critical')).toContain('red');
        expect(getCategoryColor('other')).toContain('gray');

        expect(getCategoryBg('safe')).toContain('emerald');
        expect(getCategoryBg('caution')).toContain('amber');
        expect(getCategoryBg('dangerous')).toContain('orange');
        expect(getCategoryBg('critical')).toContain('red');
        expect(getCategoryBg('other')).toContain('gray');
    });

    it('returns score bar colors for thresholds', () => {
        expect(getScoreBar(95)).toBe('bg-red-500');
        expect(getScoreBar(75)).toBe('bg-orange-500');
        expect(getScoreBar(45)).toBe('bg-amber-500');
        expect(getScoreBar(10)).toBe('bg-emerald-500');
    });
});
