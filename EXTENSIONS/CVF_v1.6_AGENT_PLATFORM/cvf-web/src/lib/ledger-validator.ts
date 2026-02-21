/**
 * Ledger Chain Validator — Client-side hash chain integrity verification
 *
 * Uses the Web Crypto API (SubtleCrypto) for SHA-256 hashing.
 *
 * @module lib/ledger-validator
 */

import type { LedgerBlock } from '@/types/governance-engine';

export interface ChainValidationResult {
    valid: boolean;
    totalBlocks: number;
    validatedBlocks: number;
    brokenAt?: number;
    error?: string;
}

/**
 * Compute SHA-256 hash of a string using Web Crypto API.
 * Falls back to a simple hash if SubtleCrypto is unavailable.
 */
async function sha256(message: string): Promise<string> {
    if (typeof globalThis.crypto?.subtle?.digest === 'function') {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: simple djb2 hash (for environments without SubtleCrypto)
    let hash = 5381;
    for (let i = 0; i < message.length; i++) {
        hash = ((hash << 5) + hash + message.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

/**
 * Validate the hash chain integrity of ledger blocks.
 *
 * Checks:
 * 1. Each block's `previous_hash` matches the preceding block's `hash`
 * 2. Blocks are in sequential order by `block_index`
 *
 * @param blocks - Array of LedgerBlock entries (should be sorted by block_index)
 * @returns Validation result with broken block index if tampered
 */
export async function validateChain(
    blocks: LedgerBlock[],
): Promise<ChainValidationResult> {
    if (!blocks || blocks.length === 0) {
        return {
            valid: true,
            totalBlocks: 0,
            validatedBlocks: 0,
        };
    }

    // Sort by block_index to ensure correct order
    const sorted = [...blocks].sort((a, b) => a.block_index - b.block_index);

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];

        // Check chain link: current.previous_hash must match prev.hash
        if (current.previous_hash !== prev.hash) {
            return {
                valid: false,
                totalBlocks: sorted.length,
                validatedBlocks: i,
                brokenAt: current.block_index,
                error: `Chain broken at block ${current.block_index}: expected previous_hash "${prev.hash}" but got "${current.previous_hash}"`,
            };
        }

        // Check sequential index
        if (current.block_index !== prev.block_index + 1) {
            return {
                valid: false,
                totalBlocks: sorted.length,
                validatedBlocks: i,
                brokenAt: current.block_index,
                error: `Block index gap: expected ${prev.block_index + 1} but got ${current.block_index}`,
            };
        }
    }

    return {
        valid: true,
        totalBlocks: sorted.length,
        validatedBlocks: sorted.length,
    };
}

/**
 * Compute the expected hash for a block's content.
 * Useful for verifying individual block integrity.
 */
export async function computeBlockHash(block: Omit<LedgerBlock, 'hash'>): Promise<string> {
    const content = JSON.stringify({
        previous_hash: block.previous_hash,
        event: block.event,
        timestamp: block.timestamp,
        block_index: block.block_index,
    });
    return sha256(content);
}
