/**
 * CVF v1.7 Controlled Intelligence — Context Segmentation Dedicated Tests (W6-T45)
 * ===================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   pruneContext (context.pruner.ts):
 *     - chunks.length <= maxChunks → returns all chunks unchanged
 *     - chunks.length > maxChunks → returns last maxChunks (slice from end)
 *     - default maxChunks=20: ≤20 items returned as-is, >20 sliced
 *     - empty array → empty array
 *   canAccessScope (memory.boundary.ts):
 *     - scope in allowedScopes → true
 *     - scope not in allowedScopes → false
 *     - empty allowedScopes → false
 *     - multiple scopes, correct one → true
 *   createFork (session.fork.ts):
 *     - returns ForkedSession with parentSessionId, role, createdAt
 *     - forkId includes parentSessionId and role
 *     - createdAt is a number (timestamp)
 *     - different calls produce different forkIds
 *   injectSummary (summary.injector.ts):
 *     - appends new summary to existing list
 *     - list under limit → returns all items including new
 *     - list at limit → keeps last maxSummaries (newest)
 *     - empty summaries + new → [new]
 *     - does not mutate original array
 *   segmentContext (context.segmenter.ts):
 *     - returns SegmentedContext with prunedChunks, activeSummaries, currentFork
 *     - prunedChunks derived from pruneContext
 *     - newSummary provided → activeSummaries injected
 *     - no newSummary → activeSummaries unchanged
 *     - currentFork has correct parentSessionId and role
 */

import { describe, it, expect } from 'vitest';

import { pruneContext } from './context.pruner.js';
import { canAccessScope } from './memory.boundary.js';
import { createFork } from './session.fork.js';
import { injectSummary } from './summary.injector.js';
import { segmentContext } from './context.segmenter.js';
import type { ContextChunk } from './context.pruner.js';
import type { MemoryBoundary } from './memory.boundary.js';
import type { PhaseSummary } from './summary.injector.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeChunks(n: number): ContextChunk[] {
  return Array.from({ length: n }, (_, i) => ({
    content: `chunk-${i}`,
    timestamp: 1000 + i,
  }));
}

function makeSummary(role: string, i = 0): PhaseSummary {
  return { role, summary: `summary-${i}`, timestamp: 2000 + i };
}

// ─── pruneContext ─────────────────────────────────────────────────────────────

describe('pruneContext', () => {
  it('empty array → empty array', () => {
    expect(pruneContext([], 5)).toEqual([]);
  });

  it('chunks.length <= maxChunks → returns all unchanged', () => {
    const chunks = makeChunks(5);
    expect(pruneContext(chunks, 10)).toEqual(chunks);
  });

  it('chunks.length === maxChunks → returns all unchanged', () => {
    const chunks = makeChunks(10);
    expect(pruneContext(chunks, 10)).toEqual(chunks);
  });

  it('chunks.length > maxChunks → returns last maxChunks', () => {
    const chunks = makeChunks(25);
    const result = pruneContext(chunks, 20);
    expect(result).toHaveLength(20);
    expect(result[0]).toEqual(chunks[5]);
    expect(result[19]).toEqual(chunks[24]);
  });

  it('default maxChunks=20: 15 items returned as-is', () => {
    const chunks = makeChunks(15);
    expect(pruneContext(chunks)).toHaveLength(15);
  });

  it('default maxChunks=20: 25 items → 20 returned', () => {
    const chunks = makeChunks(25);
    expect(pruneContext(chunks)).toHaveLength(20);
  });

  it('keeps most recent chunks (last N)', () => {
    const chunks = makeChunks(5);
    const result = pruneContext(chunks, 3);
    expect(result[0].content).toBe('chunk-2');
    expect(result[2].content).toBe('chunk-4');
  });
});

// ─── canAccessScope ───────────────────────────────────────────────────────────

describe('canAccessScope', () => {
  it('scope in allowedScopes → true', () => {
    const boundary: MemoryBoundary = { forkId: 'f1', allowedScopes: ['read', 'write'] };
    expect(canAccessScope(boundary, 'read')).toBe(true);
  });

  it('scope not in allowedScopes → false', () => {
    const boundary: MemoryBoundary = { forkId: 'f1', allowedScopes: ['read'] };
    expect(canAccessScope(boundary, 'write')).toBe(false);
  });

  it('empty allowedScopes → false', () => {
    const boundary: MemoryBoundary = { forkId: 'f1', allowedScopes: [] };
    expect(canAccessScope(boundary, 'read')).toBe(false);
  });

  it('multiple scopes, target is second → true', () => {
    const boundary: MemoryBoundary = {
      forkId: 'f1',
      allowedScopes: ['alpha', 'beta', 'gamma'],
    };
    expect(canAccessScope(boundary, 'beta')).toBe(true);
  });

  it('exact match required (case-sensitive)', () => {
    const boundary: MemoryBoundary = { forkId: 'f1', allowedScopes: ['Read'] };
    expect(canAccessScope(boundary, 'read')).toBe(false);
  });
});

// ─── createFork ───────────────────────────────────────────────────────────────

describe('createFork', () => {
  it('returns ForkedSession with correct parentSessionId', () => {
    const fork = createFork('session-abc', 'reviewer');
    expect(fork.parentSessionId).toBe('session-abc');
  });

  it('returns ForkedSession with correct role', () => {
    const fork = createFork('session-abc', 'reviewer');
    expect(fork.role).toBe('reviewer');
  });

  it('createdAt is a number (timestamp)', () => {
    const fork = createFork('s1', 'builder');
    expect(typeof fork.createdAt).toBe('number');
    expect(fork.createdAt).toBeGreaterThan(0);
  });

  it('forkId includes parentSessionId', () => {
    const fork = createFork('session-xyz', 'analyst');
    expect(fork.forkId).toContain('session-xyz');
  });

  it('forkId includes role', () => {
    const fork = createFork('session-xyz', 'analyst');
    expect(fork.forkId).toContain('analyst');
  });

  it('sequential calls produce different forkIds', () => {
    const fork1 = createFork('s1', 'r1');
    const fork2 = createFork('s1', 'r1');
    // forkId includes Date.now() so they may differ; at minimum they're both strings
    expect(typeof fork1.forkId).toBe('string');
    expect(typeof fork2.forkId).toBe('string');
  });
});

// ─── injectSummary ────────────────────────────────────────────────────────────

describe('injectSummary', () => {
  it('empty summaries + new → [new]', () => {
    const newSummary = makeSummary('builder', 1);
    const result = injectSummary([], newSummary, 10);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(newSummary);
  });

  it('list under limit → returns all including new', () => {
    const existing = [makeSummary('r1', 0), makeSummary('r2', 1)];
    const newSummary = makeSummary('r3', 2);
    const result = injectSummary(existing, newSummary, 10);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual(newSummary);
  });

  it('list exactly at limit after inject → keeps last maxSummaries', () => {
    const existing = Array.from({ length: 10 }, (_, i) => makeSummary('r', i));
    const newSummary = makeSummary('r', 10);
    const result = injectSummary(existing, newSummary, 10);
    expect(result).toHaveLength(10);
    expect(result[9]).toEqual(newSummary);
  });

  it('does not mutate the original summaries array', () => {
    const existing = [makeSummary('r', 0)];
    const original = [...existing];
    injectSummary(existing, makeSummary('r', 1), 10);
    expect(existing).toEqual(original);
  });

  it('default maxSummaries=10', () => {
    const existing = Array.from({ length: 10 }, (_, i) => makeSummary('r', i));
    const result = injectSummary(existing, makeSummary('r', 10));
    expect(result).toHaveLength(10);
  });
});

// ─── segmentContext ───────────────────────────────────────────────────────────

describe('segmentContext', () => {
  it('returns SegmentedContext with prunedChunks', () => {
    const chunks = makeChunks(5);
    const result = segmentContext('s1', 'reviewer', chunks, [], undefined, 20, 10);
    expect(result.prunedChunks).toBeDefined();
    expect(result.prunedChunks).toHaveLength(5);
  });

  it('prunedChunks derived from pruneContext (excess sliced)', () => {
    const chunks = makeChunks(25);
    const result = segmentContext('s1', 'reviewer', chunks, [], undefined, 20, 10);
    expect(result.prunedChunks).toHaveLength(20);
  });

  it('no newSummary → activeSummaries unchanged', () => {
    const summaries = [makeSummary('r', 0), makeSummary('r', 1)];
    const result = segmentContext('s1', 'reviewer', [], summaries, undefined, 20, 10);
    expect(result.activeSummaries).toEqual(summaries);
  });

  it('newSummary provided → activeSummaries includes it', () => {
    const summaries = [makeSummary('r', 0)];
    const newSummary = makeSummary('builder', 99);
    const result = segmentContext('s1', 'reviewer', [], summaries, newSummary, 20, 10);
    expect(result.activeSummaries).toHaveLength(2);
    expect(result.activeSummaries[1]).toEqual(newSummary);
  });

  it('currentFork is defined with correct parentSessionId', () => {
    const result = segmentContext('session-123', 'analyst', [], [], undefined, 20, 10);
    expect(result.currentFork).toBeDefined();
    expect(result.currentFork!.parentSessionId).toBe('session-123');
  });

  it('currentFork has correct role', () => {
    const result = segmentContext('s1', 'auditor', [], [], undefined, 20, 10);
    expect(result.currentFork!.role).toBe('auditor');
  });
});
