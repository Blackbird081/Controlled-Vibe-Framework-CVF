/**
 * Agent Conformance Runner — Track IV Phase B.1
 *
 * Executes conformance scenarios against the GuardRuntimeEngine
 * and produces a structured conformance report.
 *
 * Usage:
 *   const runner = new ConformanceRunner(engine);
 *   runner.loadScenarios(CVF_CORE_SCENARIOS);
 *   const report = runner.runAll();
 */

import { GuardRuntimeEngine } from '../guard.runtime.engine.js';
import type { GuardRequestContext } from '../guard.runtime.types.js';
import type {
  ConformanceScenario,
  ConformanceResult,
  ConformanceReport,
  ConformanceVerdict,
  ConformanceCategory,
  ConformanceSeverity,
} from './conformance.types.js';

export class ConformanceRunner {
  private engine: GuardRuntimeEngine;
  private scenarios: ConformanceScenario[] = [];

  constructor(engine: GuardRuntimeEngine) {
    this.engine = engine;
  }

  // --- Scenario Management ---

  loadScenarios(scenarios: ConformanceScenario[]): void {
    for (const s of scenarios) {
      if (this.scenarios.some((e) => e.id === s.id)) {
        throw new Error(`Duplicate scenario id: "${s.id}".`);
      }
    }
    this.scenarios.push(...scenarios);
  }

  getScenarios(): readonly ConformanceScenario[] {
    return this.scenarios;
  }

  getScenarioCount(): number {
    return this.scenarios.length;
  }

  getScenariosByCategory(category: ConformanceCategory): ConformanceScenario[] {
    return this.scenarios.filter((s) => s.category === category);
  }

  getScenariosBySeverity(severity: ConformanceSeverity): ConformanceScenario[] {
    return this.scenarios.filter((s) => s.severity === severity);
  }

  clearScenarios(): void {
    this.scenarios = [];
  }

  // --- Execution ---

  runScenario(scenario: ConformanceScenario): ConformanceResult {
    const start = Date.now();

    try {
      const context: GuardRequestContext = {
        requestId: `conformance-${scenario.id}`,
        phase: scenario.input.phase,
        riskLevel: scenario.input.riskLevel,
        role: scenario.input.role,
        agentId: scenario.input.agentId,
        action: scenario.input.action,
        targetFiles: scenario.input.targetFiles,
        fileScope: scenario.input.fileScope,
        mutationCount: scenario.input.mutationCount,
        mutationBudget: scenario.input.mutationBudget,
        traceHash: scenario.input.traceHash,
        metadata: scenario.input.metadata,
      };

      const pipelineResult = this.engine.evaluate(context);
      const durationMs = Date.now() - start;

      const decisionMatch = pipelineResult.finalDecision === scenario.expectedDecision;
      const blockedByMatch = scenario.expectedBlockedBy
        ? pipelineResult.blockedBy === scenario.expectedBlockedBy
        : true;

      const verdict: ConformanceVerdict = decisionMatch && blockedByMatch ? 'PASS' : 'FAIL';

      let details: string | undefined;
      if (!decisionMatch) {
        details = `Expected decision "${scenario.expectedDecision}" but got "${pipelineResult.finalDecision}"`;
      } else if (!blockedByMatch) {
        details = `Expected blockedBy "${scenario.expectedBlockedBy}" but got "${pipelineResult.blockedBy}"`;
      }

      return {
        scenarioId: scenario.id,
        verdict,
        actualDecision: pipelineResult.finalDecision,
        actualBlockedBy: pipelineResult.blockedBy,
        durationMs,
        details,
      };
    } catch (err) {
      return {
        scenarioId: scenario.id,
        verdict: 'ERROR',
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  runAll(filter?: { category?: ConformanceCategory; severity?: ConformanceSeverity; tags?: string[] }): ConformanceReport {
    const startTime = Date.now();
    let filtered = this.scenarios;

    if (filter?.category) {
      filtered = filtered.filter((s) => s.category === filter.category);
    }
    if (filter?.severity) {
      filtered = filtered.filter((s) => s.severity === filter.severity);
    }
    if (filter?.tags && filter.tags.length > 0) {
      filtered = filtered.filter((s) =>
        filter.tags!.some((t) => s.tags?.includes(t))
      );
    }

    const results: ConformanceResult[] = filtered.map((s) => this.runScenario(s));
    const durationMs = Date.now() - startTime;

    const passed = results.filter((r) => r.verdict === 'PASS').length;
    const failed = results.filter((r) => r.verdict === 'FAIL').length;
    const skipped = results.filter((r) => r.verdict === 'SKIP').length;
    const errors = results.filter((r) => r.verdict === 'ERROR').length;

    const criticalScenarioIds = new Set(
      filtered.filter((s) => s.severity === 'CRITICAL').map((s) => s.id)
    );
    const criticalFailures = results.filter(
      (r) => criticalScenarioIds.has(r.scenarioId) && r.verdict !== 'PASS'
    );

    return {
      runId: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalScenarios: results.length,
      passed,
      failed,
      skipped,
      errors,
      passRate: results.length > 0 ? passed / results.length : 0,
      results,
      criticalFailures,
      durationMs,
    };
  }

  runById(scenarioId: string): ConformanceResult {
    const scenario = this.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      return {
        scenarioId,
        verdict: 'ERROR',
        durationMs: 0,
        error: `Scenario "${scenarioId}" not found.`,
      };
    }
    return this.runScenario(scenario);
  }
}
