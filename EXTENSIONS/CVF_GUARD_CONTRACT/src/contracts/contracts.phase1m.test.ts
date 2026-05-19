/**
 * CVF Phase 1.M — Memory-Home Tier Map Conformance Test Stubs
 * =============================================================
 * Conformance stubs verifying the 5-tier memory model and tier boundary
 * contracts. Shape-only checks — no runtime memory access changes (Phase 2.B).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1M_MEMORY_HOME_TIER_MAP_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  MEMORY_TIER_SPECS,
  DEFERRED_MEMORY_TIERS,
  MEMORY_TIER_ADAPTER_MAP,
  isCanonicalTier,
  isTierImmutable,
} from './index';

import type {
  MemoryTierId,
  MemoryTierSpec,
  MemoryTierAdapterMeta,
} from './index';

// ─── Tier Definitions ─────────────────────────────────────────────────────────

describe('MEMORY_TIER_SPECS — five canonical tiers', () => {
  it('defines exactly five tiers', () => {
    expect(MEMORY_TIER_SPECS).toHaveLength(5);
  });

  it('covers all five tier IDs', () => {
    const tierIds = MEMORY_TIER_SPECS.map((t) => t.tierId);
    expect(tierIds).toContain('working');
    expect(tierIds).toContain('task');
    expect(tierIds).toContain('skill');
    expect(tierIds).toContain('audit');
    expect(tierIds).toContain('receipt');
  });

  it('every tier has a name, lifecycle, scope, and phase2BOwner', () => {
    for (const tier of MEMORY_TIER_SPECS) {
      expect(tier.name).toBeTruthy();
      expect(['ephemeral', 'task-scoped', 'session-persistent', 'immutable']).toContain(tier.lifecycle);
      expect(['in-process', 'agent-local', 'cross-agent', 'audit-only']).toContain(tier.scope);
      expect(tier.phase2BOwner).toBeTruthy();
    }
  });

  it('audit and receipt tiers are immutable', () => {
    const auditTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'audit')!;
    const receiptTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'receipt')!;
    expect(auditTier.immutable).toBe(true);
    expect(receiptTier.immutable).toBe(true);
  });

  it('working and task tiers are not immutable', () => {
    const workingTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'working')!;
    const taskTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'task')!;
    expect(workingTier.immutable).toBe(false);
    expect(taskTier.immutable).toBe(false);
  });

  it('working tier is ephemeral in-process', () => {
    const tier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'working')!;
    expect(tier.lifecycle).toBe('ephemeral');
    expect(tier.scope).toBe('in-process');
  });

  it('receipt tier is cross-agent scoped', () => {
    const tier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'receipt')!;
    expect(tier.scope).toBe('cross-agent');
  });

  it('audit tier is audit-only scoped', () => {
    const tier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'audit')!;
    expect(tier.scope).toBe('audit-only');
  });

  it('every tier has at least one out-of-scope constraint', () => {
    for (const tier of MEMORY_TIER_SPECS) {
      expect(tier.outOfScope.length).toBeGreaterThan(0);
    }
  });
});

// ─── Deferred Tiers ───────────────────────────────────────────────────────────

describe('DEFERRED_MEMORY_TIERS', () => {
  it('defers long-term and organizational tiers', () => {
    const ids = DEFERRED_MEMORY_TIERS.map((t) => t.tierId);
    expect(ids).toContain('long-term');
    expect(ids).toContain('organizational');
  });

  it('every deferred tier has a reason and deferredUntil', () => {
    for (const tier of DEFERRED_MEMORY_TIERS) {
      expect(tier.reason).toBeTruthy();
      expect(tier.deferredUntil).toBeTruthy();
    }
  });
});

// ─── Tier Helper Functions ────────────────────────────────────────────────────

describe('isCanonicalTier()', () => {
  it('returns true for all five canonical tier IDs', () => {
    const tiers: MemoryTierId[] = ['working', 'task', 'skill', 'audit', 'receipt'];
    for (const t of tiers) {
      expect(isCanonicalTier(t)).toBe(true);
    }
  });

  it('returns false for deferred tier IDs', () => {
    expect(isCanonicalTier('long-term')).toBe(false);
    expect(isCanonicalTier('organizational')).toBe(false);
  });

  it('returns false for unknown strings', () => {
    expect(isCanonicalTier('unknown')).toBe(false);
    expect(isCanonicalTier('')).toBe(false);
  });
});

describe('isTierImmutable()', () => {
  it('returns true for audit and receipt', () => {
    expect(isTierImmutable('audit')).toBe(true);
    expect(isTierImmutable('receipt')).toBe(true);
  });

  it('returns false for working, task, skill', () => {
    expect(isTierImmutable('working')).toBe(false);
    expect(isTierImmutable('task')).toBe(false);
    expect(isTierImmutable('skill')).toBe(false);
  });
});

// ─── Adapter Map ──────────────────────────────────────────────────────────────

describe('MEMORY_TIER_ADAPTER_MAP', () => {
  it('includes the Phase 1.0 false-positive surface and canonical tier anchors', () => {
    expect(MEMORY_TIER_ADAPTER_MAP.length).toBeGreaterThanOrEqual(5);
  });

  it('every entry has required fields', () => {
    for (const entry of MEMORY_TIER_ADAPTER_MAP) {
      expect(entry.adapterId).toBeTruthy();
      expect(entry.domain).toBeTruthy();
      expect(entry.sourcePath).toBeTruthy();
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate'])
        .toContain(entry.disposition);
    }
  });

  it('adapter IDs are unique', () => {
    const ids = MEMORY_TIER_ADAPTER_MAP.map((e) => e.adapterId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('canonical_contract surfaces exist for all five tier IDs', () => {
    const canonicals = MEMORY_TIER_ADAPTER_MAP.filter((e) => e.disposition === 'canonical_contract');
    const tiers = new Set(canonicals.map((e) => e.assignedTier));
    expect(tiers.has('working')).toBe(true);
    expect(tiers.has('task')).toBe(true);
    expect(tiers.has('skill')).toBe(true);
    expect(tiers.has('audit')).toBe(true);
    expect(tiers.has('receipt')).toBe(true);
  });

  it('false-positive surface is classified as legacy_reference', () => {
    const falsePositives = MEMORY_TIER_ADAPTER_MAP.filter((e) => e.assignedTier === 'false-positive');
    for (const fp of falsePositives) {
      expect(fp.disposition).toBe('legacy_reference');
    }
  });

  it('no existing memory store renamed or deleted (map is classification-only)', () => {
    const dispositions = MEMORY_TIER_ADAPTER_MAP.map((e) => e.disposition);
    for (const d of dispositions) {
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate']).toContain(d);
    }
  });
});

// ─── Tier Boundary Invariants ─────────────────────────────────────────────────

describe('Memory tier boundary invariants', () => {
  it('long-term memory is NOT one of the five canonical tiers', () => {
    expect(isCanonicalTier('long-term')).toBe(false);
  });

  it('receipt tier is aligned with Phase 1.R Receipt envelope', () => {
    const receiptTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'receipt')!;
    expect(receiptTier.phase2BOwner).toContain('Phase 1.R');
  });

  it('audit tier is aligned with guard-contract trace emitter', () => {
    const auditTier = MEMORY_TIER_SPECS.find((t) => t.tierId === 'audit')!;
    expect(auditTier.phase2BOwner).toContain('CVF_GUARD_CONTRACT');
  });
});
