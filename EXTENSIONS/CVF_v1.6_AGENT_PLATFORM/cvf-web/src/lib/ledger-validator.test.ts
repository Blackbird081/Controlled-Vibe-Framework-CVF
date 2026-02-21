import { describe, it, expect } from 'vitest';
import { validateChain, computeBlockHash } from './ledger-validator';
import type { LedgerBlock } from '@/types/governance-engine';

function makeBlock(index: number, hash: string, prevHash: string, event?: Record<string, unknown>): LedgerBlock {
    return {
        block_index: index,
        hash,
        previous_hash: prevHash,
        event: event || { type: 'test' },
        timestamp: new Date().toISOString(),
    };
}

describe('ledger-validator', () => {
    describe('validateChain', () => {
        it('returns valid for empty chain', async () => {
            const result = await validateChain([]);
            expect(result.valid).toBe(true);
            expect(result.totalBlocks).toBe(0);
        });

        it('returns valid for single block', async () => {
            const blocks = [makeBlock(0, 'abc', '000000')];
            const result = await validateChain(blocks);
            expect(result.valid).toBe(true);
            expect(result.totalBlocks).toBe(1);
        });

        it('returns valid for correctly linked chain', async () => {
            const blocks: LedgerBlock[] = [
                makeBlock(0, 'hash0', '000000'),
                makeBlock(1, 'hash1', 'hash0'),
                makeBlock(2, 'hash2', 'hash1'),
                makeBlock(3, 'hash3', 'hash2'),
            ];
            const result = await validateChain(blocks);
            expect(result.valid).toBe(true);
            expect(result.totalBlocks).toBe(4);
            expect(result.validatedBlocks).toBe(4);
        });

        it('detects broken chain link', async () => {
            const blocks: LedgerBlock[] = [
                makeBlock(0, 'hash0', '000000'),
                makeBlock(1, 'hash1', 'hash0'),
                makeBlock(2, 'hash2', 'TAMPERED'), // broken!
                makeBlock(3, 'hash3', 'hash2'),
            ];
            const result = await validateChain(blocks);
            expect(result.valid).toBe(false);
            expect(result.brokenAt).toBe(2);
            expect(result.error).toContain('Chain broken');
        });

        it('detects block index gap', async () => {
            const blocks: LedgerBlock[] = [
                makeBlock(0, 'hash0', '000000'),
                makeBlock(1, 'hash1', 'hash0'),
                makeBlock(5, 'hash5', 'hash1'), // Gap: 1→5
            ];
            const result = await validateChain(blocks);
            expect(result.valid).toBe(false);
            expect(result.brokenAt).toBe(5);
            expect(result.error).toContain('index gap');
        });

        it('sorts blocks by index before validation', async () => {
            const blocks: LedgerBlock[] = [
                makeBlock(2, 'hash2', 'hash1'),
                makeBlock(0, 'hash0', '000000'),
                makeBlock(1, 'hash1', 'hash0'),
            ];
            const result = await validateChain(blocks);
            expect(result.valid).toBe(true);
            expect(result.totalBlocks).toBe(3);
        });
    });

    describe('computeBlockHash', () => {
        it('computes a hash for block content', async () => {
            const hash = await computeBlockHash({
                previous_hash: '000000',
                event: { type: 'test' },
                timestamp: '2026-01-01T00:00:00Z',
                block_index: 0,
            });
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });

        it('produces different hashes for different content', async () => {
            const hash1 = await computeBlockHash({
                previous_hash: '000000',
                event: { type: 'a' },
                timestamp: '2026-01-01T00:00:00Z',
                block_index: 0,
            });
            const hash2 = await computeBlockHash({
                previous_hash: '000000',
                event: { type: 'b' },
                timestamp: '2026-01-01T00:00:00Z',
                block_index: 0,
            });
            expect(hash1).not.toBe(hash2);
        });

        it('produces stable hashes for same content', async () => {
            const input = {
                previous_hash: 'abc',
                event: { key: 'value' },
                timestamp: '2026-02-21T12:00:00Z',
                block_index: 5,
            };
            const hash1 = await computeBlockHash(input);
            const hash2 = await computeBlockHash(input);
            expect(hash1).toBe(hash2);
        });
    });
});
