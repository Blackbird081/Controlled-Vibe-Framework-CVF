/**
 * Tests for CVF Cross-Channel Guard Contract
 * @module governance/contracts/cross-channel-guard-contract.test
 */

import {
  normalizePhase,
  normalizeRisk,
  mapMcpDecision,
  mapWebUiDecision,
  canonicalToWebUiStatus,
  canonicalToMcpDecision,
  mapMcpRole,
  mapWebUiRole,
  mapMcpPhase,
  canonicalToMcpPhase,
  canonicalToMcpRisk,
  isValidPhase,
  isValidRisk,
  compareRisk,
  comparePhase,
  riskExceeds,
  CANONICAL_PHASE_ORDER,
  CANONICAL_RISK_ORDER,
  CANONICAL_PHASE_ALIASES,
  CANONICAL_RISK_NUMERIC,
  CANONICAL_RISK_LABELS,
  type CVFCanonicalPhase,
  type CVFCanonicalRisk,
  type CVFCanonicalDecision,
  type CVFGuardRequest,
  type CVFGuardResult,
  type CVFGuardPipelineResult,
  type CVFGuardContract,
  type CVFHealthStatus,
  type CVFChannel,
} from './cross-channel-guard-contract';

// ─── Phase Normalization ─────────────────────────────────────────────

describe('normalizePhase', () => {
  it('maps MCP DISCOVERY → INTAKE', () => {
    expect(normalizePhase('DISCOVERY')).toBe('INTAKE');
  });

  it('maps Web UI letter aliases A-E', () => {
    expect(normalizePhase('A')).toBe('INTAKE');
    expect(normalizePhase('B')).toBe('DESIGN');
    expect(normalizePhase('C')).toBe('BUILD');
    expect(normalizePhase('D')).toBe('REVIEW');
    expect(normalizePhase('E')).toBe('FREEZE');
  });

  it('maps "PHASE A" style aliases', () => {
    expect(normalizePhase('PHASE A')).toBe('INTAKE');
    expect(normalizePhase('PHASE B')).toBe('DESIGN');
    expect(normalizePhase('PHASE C')).toBe('BUILD');
    expect(normalizePhase('PHASE D')).toBe('REVIEW');
    expect(normalizePhase('PHASE E')).toBe('FREEZE');
  });

  it('maps direct canonical names', () => {
    expect(normalizePhase('INTAKE')).toBe('INTAKE');
    expect(normalizePhase('DESIGN')).toBe('DESIGN');
    expect(normalizePhase('BUILD')).toBe('BUILD');
    expect(normalizePhase('REVIEW')).toBe('REVIEW');
    expect(normalizePhase('FREEZE')).toBe('FREEZE');
  });

  it('is case-insensitive', () => {
    expect(normalizePhase('discovery')).toBe('INTAKE');
    expect(normalizePhase('  design  ')).toBe('DESIGN');
  });

  it('returns INTAKE for undefined/null/empty', () => {
    expect(normalizePhase(undefined)).toBe('INTAKE');
    expect(normalizePhase('')).toBe('INTAKE');
  });

  it('returns INTAKE for unrecognized input', () => {
    expect(normalizePhase('UNKNOWN')).toBe('INTAKE');
    expect(normalizePhase('XYZ')).toBe('INTAKE');
  });
});

// ─── Risk Normalization ──────────────────────────────────────────────

describe('normalizeRisk', () => {
  it('maps R0-R4', () => {
    expect(normalizeRisk('R0')).toBe('R0');
    expect(normalizeRisk('R1')).toBe('R1');
    expect(normalizeRisk('R2')).toBe('R2');
    expect(normalizeRisk('R3')).toBe('R3');
    expect(normalizeRisk('R4')).toBe('R4');
  });

  it('is case-insensitive', () => {
    expect(normalizeRisk('r2')).toBe('R2');
    expect(normalizeRisk('  r3  ')).toBe('R3');
  });

  it('returns R1 for undefined/empty/unknown', () => {
    expect(normalizeRisk(undefined)).toBe('R1');
    expect(normalizeRisk('')).toBe('R1');
    expect(normalizeRisk('R5')).toBe('R1');
    expect(normalizeRisk('INVALID')).toBe('R1');
  });
});

// ─── Decision Mapping (MCP → Canonical) ──────────────────────────────

describe('mapMcpDecision', () => {
  it('maps ALLOW/BLOCK/ESCALATE', () => {
    expect(mapMcpDecision('ALLOW')).toBe('ALLOW');
    expect(mapMcpDecision('BLOCK')).toBe('BLOCK');
    expect(mapMcpDecision('ESCALATE')).toBe('ESCALATE');
  });

  it('defaults to BLOCK for unknown', () => {
    expect(mapMcpDecision('UNKNOWN')).toBe('BLOCK');
  });
});

// ─── Decision Mapping (Web UI → Canonical) ───────────────────────────

describe('mapWebUiDecision', () => {
  it('maps ALLOW/BLOCK/CLARIFY/NEEDS_APPROVAL', () => {
    expect(mapWebUiDecision('ALLOW')).toBe('ALLOW');
    expect(mapWebUiDecision('BLOCK')).toBe('BLOCK');
    expect(mapWebUiDecision('CLARIFY')).toBe('CLARIFY');
    expect(mapWebUiDecision('NEEDS_APPROVAL')).toBe('ESCALATE');
  });

  it('maps ESCALATE and LOG_ONLY', () => {
    expect(mapWebUiDecision('ESCALATE')).toBe('ESCALATE');
    expect(mapWebUiDecision('LOG_ONLY')).toBe('LOG_ONLY');
  });

  it('defaults to BLOCK for unknown', () => {
    expect(mapWebUiDecision('INVALID')).toBe('BLOCK');
  });
});

// ─── Canonical → Web UI ──────────────────────────────────────────────

describe('canonicalToWebUiStatus', () => {
  it('maps all canonical decisions back to Web UI', () => {
    expect(canonicalToWebUiStatus('ALLOW')).toBe('ALLOW');
    expect(canonicalToWebUiStatus('BLOCK')).toBe('BLOCK');
    expect(canonicalToWebUiStatus('CLARIFY')).toBe('CLARIFY');
    expect(canonicalToWebUiStatus('ESCALATE')).toBe('NEEDS_APPROVAL');
    expect(canonicalToWebUiStatus('LOG_ONLY')).toBe('ALLOW');
  });
});

// ─── Canonical → MCP ─────────────────────────────────────────────────

describe('canonicalToMcpDecision', () => {
  it('maps all canonical decisions back to MCP', () => {
    expect(canonicalToMcpDecision('ALLOW')).toBe('ALLOW');
    expect(canonicalToMcpDecision('BLOCK')).toBe('BLOCK');
    expect(canonicalToMcpDecision('ESCALATE')).toBe('ESCALATE');
    expect(canonicalToMcpDecision('CLARIFY')).toBe('ESCALATE');
    expect(canonicalToMcpDecision('LOG_ONLY')).toBe('ALLOW');
  });
});

// ─── Role Mapping ────────────────────────────────────────────────────

describe('mapMcpRole', () => {
  it('maps MCP roles', () => {
    expect(mapMcpRole('HUMAN')).toBe('HUMAN');
    expect(mapMcpRole('AI_AGENT')).toBe('AI_AGENT');
    expect(mapMcpRole('REVIEWER')).toBe('REVIEWER');
    expect(mapMcpRole('OPERATOR')).toBe('OPERATOR');
  });

  it('defaults to AI_AGENT for unknown', () => {
    expect(mapMcpRole('UNKNOWN')).toBe('AI_AGENT');
  });
});

describe('mapWebUiRole', () => {
  it('maps Web UI roles', () => {
    expect(mapWebUiRole('OBSERVER')).toBe('OBSERVER');
    expect(mapWebUiRole('ANALYST')).toBe('ANALYST');
    expect(mapWebUiRole('BUILDER')).toBe('BUILDER');
    expect(mapWebUiRole('REVIEWER')).toBe('REVIEWER');
    expect(mapWebUiRole('GOVERNOR')).toBe('GOVERNOR');
  });

  it('defaults to ANALYST for unknown', () => {
    expect(mapWebUiRole('UNKNOWN')).toBe('ANALYST');
  });
});

// ─── Phase Mapping (MCP ↔ Canonical) ─────────────────────────────────

describe('mapMcpPhase', () => {
  it('maps MCP phases to canonical', () => {
    expect(mapMcpPhase('DISCOVERY')).toBe('INTAKE');
    expect(mapMcpPhase('DESIGN')).toBe('DESIGN');
    expect(mapMcpPhase('BUILD')).toBe('BUILD');
    expect(mapMcpPhase('REVIEW')).toBe('REVIEW');
  });
});

describe('canonicalToMcpPhase', () => {
  it('maps canonical back to MCP phases', () => {
    expect(canonicalToMcpPhase('INTAKE')).toBe('DISCOVERY');
    expect(canonicalToMcpPhase('DESIGN')).toBe('DESIGN');
    expect(canonicalToMcpPhase('BUILD')).toBe('BUILD');
    expect(canonicalToMcpPhase('REVIEW')).toBe('REVIEW');
    expect(canonicalToMcpPhase('FREEZE')).toBe('REVIEW'); // Lossy: no FREEZE in MCP
  });
});

describe('canonicalToMcpRisk', () => {
  it('maps R0-R3 directly', () => {
    expect(canonicalToMcpRisk('R0')).toBe('R0');
    expect(canonicalToMcpRisk('R1')).toBe('R1');
    expect(canonicalToMcpRisk('R2')).toBe('R2');
    expect(canonicalToMcpRisk('R3')).toBe('R3');
  });

  it('clamps R4 to R3 for MCP', () => {
    expect(canonicalToMcpRisk('R4')).toBe('R3');
  });
});

// ─── Validation Helpers ──────────────────────────────────────────────

describe('isValidPhase', () => {
  it('accepts all canonical names and aliases', () => {
    expect(isValidPhase('INTAKE')).toBe(true);
    expect(isValidPhase('DISCOVERY')).toBe(true);
    expect(isValidPhase('A')).toBe(true);
    expect(isValidPhase('PHASE E')).toBe(true);
    expect(isValidPhase('BUILD')).toBe(true);
  });

  it('rejects invalid phases', () => {
    expect(isValidPhase('UNKNOWN')).toBe(false);
    expect(isValidPhase('F')).toBe(false);
  });
});

describe('isValidRisk', () => {
  it('accepts R0-R4', () => {
    expect(isValidRisk('R0')).toBe(true);
    expect(isValidRisk('R4')).toBe(true);
  });

  it('rejects invalid risk levels', () => {
    expect(isValidRisk('R5')).toBe(false);
    expect(isValidRisk('LOW')).toBe(false);
  });
});

// ─── Comparison Helpers ──────────────────────────────────────────────

describe('compareRisk', () => {
  it('returns negative when a < b', () => {
    expect(compareRisk('R0', 'R3')).toBeLessThan(0);
  });

  it('returns 0 when equal', () => {
    expect(compareRisk('R2', 'R2')).toBe(0);
  });

  it('returns positive when a > b', () => {
    expect(compareRisk('R4', 'R1')).toBeGreaterThan(0);
  });
});

describe('comparePhase', () => {
  it('returns negative when a is earlier', () => {
    expect(comparePhase('INTAKE', 'BUILD')).toBeLessThan(0);
  });

  it('returns 0 when equal', () => {
    expect(comparePhase('DESIGN', 'DESIGN')).toBe(0);
  });

  it('returns positive when a is later', () => {
    expect(comparePhase('FREEZE', 'INTAKE')).toBeGreaterThan(0);
  });
});

describe('riskExceeds', () => {
  it('returns true when level > threshold', () => {
    expect(riskExceeds('R3', 'R2')).toBe(true);
    expect(riskExceeds('R4', 'R0')).toBe(true);
  });

  it('returns false when level <= threshold', () => {
    expect(riskExceeds('R2', 'R2')).toBe(false);
    expect(riskExceeds('R0', 'R3')).toBe(false);
  });
});

// ─── Constants ───────────────────────────────────────────────────────

describe('CANONICAL_PHASE_ORDER', () => {
  it('has 5 phases in correct order', () => {
    expect(CANONICAL_PHASE_ORDER).toEqual(['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE']);
  });
});

describe('CANONICAL_RISK_ORDER', () => {
  it('has 5 risk levels in correct order', () => {
    expect(CANONICAL_RISK_ORDER).toEqual(['R0', 'R1', 'R2', 'R3', 'R4']);
  });
});

describe('CANONICAL_RISK_LABELS', () => {
  it('has both en and vi labels for all risk levels', () => {
    for (const risk of CANONICAL_RISK_ORDER) {
      expect(CANONICAL_RISK_LABELS[risk]).toHaveProperty('en');
      expect(CANONICAL_RISK_LABELS[risk]).toHaveProperty('vi');
    }
  });
});

// ─── Type Guard Smoke Tests ──────────────────────────────────────────

describe('Type contracts (compile-time verification)', () => {
  it('CVFGuardRequest has all required fields', () => {
    const req: CVFGuardRequest = {
      requestId: 'test-001',
      channel: 'web-ui',
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'BUILDER',
      action: 'generate_code',
    };
    expect(req.requestId).toBe('test-001');
    expect(req.channel).toBe('web-ui');
  });

  it('CVFGuardResult has all required fields', () => {
    const result: CVFGuardResult = {
      guardId: 'phase-gate',
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'Action allowed in BUILD phase',
      timestamp: new Date().toISOString(),
    };
    expect(result.decision).toBe('ALLOW');
  });

  it('CVFGuardPipelineResult aggregates results', () => {
    const pipeline: CVFGuardPipelineResult = {
      requestId: 'test-001',
      channel: 'mcp-server',
      finalDecision: 'ALLOW',
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 5,
    };
    expect(pipeline.finalDecision).toBe('ALLOW');
  });

  it('CVFHealthStatus has required shape', () => {
    const health: CVFHealthStatus = {
      channel: 'vscode',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      guardsLoaded: 6,
    };
    expect(health.guardsLoaded).toBe(6);
  });
});

// ─── Roundtrip Tests ─────────────────────────────────────────────────

describe('Roundtrip: MCP → Canonical → MCP', () => {
  it('preserves phase through roundtrip (except INTAKE→DISCOVERY)', () => {
    const mcpPhases = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
    for (const phase of mcpPhases) {
      const canonical = mapMcpPhase(phase);
      const back = canonicalToMcpPhase(canonical);
      expect(back).toBe(phase);
    }
  });

  it('preserves risk through roundtrip (R0-R3)', () => {
    const mcpRisks: CVFCanonicalRisk[] = ['R0', 'R1', 'R2', 'R3'];
    for (const risk of mcpRisks) {
      const back = canonicalToMcpRisk(risk);
      expect(back).toBe(risk);
    }
  });

  it('preserves decisions through roundtrip', () => {
    const mcpDecisions = ['ALLOW', 'BLOCK', 'ESCALATE'];
    for (const decision of mcpDecisions) {
      const canonical = mapMcpDecision(decision);
      const back = canonicalToMcpDecision(canonical);
      expect(back).toBe(decision);
    }
  });
});

describe('Roundtrip: Web UI → Canonical → Web UI', () => {
  it('preserves ALLOW/BLOCK/CLARIFY through roundtrip', () => {
    const webUiStatuses = ['ALLOW', 'BLOCK', 'CLARIFY'];
    for (const status of webUiStatuses) {
      const canonical = mapWebUiDecision(status);
      const back = canonicalToWebUiStatus(canonical);
      expect(back).toBe(status);
    }
  });

  it('maps NEEDS_APPROVAL → ESCALATE → NEEDS_APPROVAL', () => {
    const canonical = mapWebUiDecision('NEEDS_APPROVAL');
    expect(canonical).toBe('ESCALATE');
    const back = canonicalToWebUiStatus(canonical);
    expect(back).toBe('NEEDS_APPROVAL');
  });
});
