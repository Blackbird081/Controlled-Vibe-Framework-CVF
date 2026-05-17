import { describe, it, expect } from 'vitest';
import { detectSpecMode } from './agent-chat';

describe('detectSpecMode', () => {
    it('returns simple for empty content', () => {
        expect(detectSpecMode('')).toBe('simple');
    });

    it('detects full mode from explicit markers', () => {
        const content = 'CVF FULL MODE PROTOCOL\nMANDATORY 5-PHASE PROCESS';
        expect(detectSpecMode(content)).toBe('full');
    });

    it('detects full mode from flexible phrasing', () => {
        const content = 'This requires full mode and a 5-phase process.';
        expect(detectSpecMode(content)).toBe('full');
    });

    it('detects governance mode from governance keywords', () => {
        const content = 'Áp dụng CVF Governance Rules và có quy tắc rõ ràng.';
        expect(detectSpecMode(content)).toBe('governance');
    });

    it('prioritizes full mode when both full and governance markers exist', () => {
        const content = 'CVF FULL MODE PROTOCOL\nCVF GOVERNANCE RULES';
        expect(detectSpecMode(content)).toBe('full');
    });

    it('returns simple for normal prompts', () => {
        const content = 'Please summarize the requirements for this feature.';
        expect(detectSpecMode(content)).toBe('simple');
    });

    it('keeps simple mode when a simple spec mentions governance-safe wording', () => {
        const content = `
**Chế độ:** Đơn giản
- governance-safe: không gợi ý bypass
- governed context should be respected when present
`;
        expect(detectSpecMode(content)).toBe('simple');
    });
});
