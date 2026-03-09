#!/usr/bin/env node
/**
 * CVF CLI Wrapper — M2.2
 *
 * Provides command-line access to CVF guard evaluation for:
 * - Non-IDE environments (terminals, CI/CD)
 * - Python/shell script integration
 * - Quick manual checks
 *
 * Usage:
 *   cvf check-phase --phase BUILD --role AI_AGENT --action "write code"
 *   cvf check-risk --risk R2 --role AI_AGENT --action "modify database"
 *   cvf check-authority --role AI_AGENT --action "deploy"
 *   cvf evaluate --phase BUILD --risk R1 --role AI_AGENT --action "refactor"
 *   cvf prompt --phase BUILD --risk R1 --role AI_AGENT
 *   cvf audit --limit 10
 *   cvf advance --evidence "All tests passing"
 *   cvf status
 *
 * @module cli/cli
 */

import { createGuardEngine } from '../guards/index.js';
import { generateSystemPrompt } from '../prompt/system-prompt.js';
import type { CVFPhase, CVFRiskLevel, CVFRole } from '../guards/types.js';

const engine = createGuardEngine();

export interface CliResult {
  success: boolean;
  command: string;
  output: Record<string, unknown>;
  exitCode: number;
}

export function parseArgs(argv: string[]): { command: string; flags: Record<string, string> } {
  const command = argv[0] || 'help';
  const flags: Record<string, string> = {};

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      flags[key] = value;
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const value = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : 'true';
      flags[key] = value;
    }
  }

  return { command, flags };
}

function normalizePhase(raw?: string): CVFPhase {
  if (!raw) return engine.getSessionPhase() as CVFPhase || 'DISCOVERY';
  const upper = raw.trim().toUpperCase();
  if (['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'].includes(upper)) return upper as CVFPhase;
  return 'BUILD';
}

function normalizeRisk(raw?: string): CVFRiskLevel {
  if (!raw) return 'R0';
  const upper = raw.trim().toUpperCase();
  if (['R0', 'R1', 'R2', 'R3'].includes(upper)) return upper as CVFRiskLevel;
  return 'R0';
}

function normalizeRole(raw?: string): CVFRole {
  if (!raw) return 'AI_AGENT';
  const upper = raw.trim().toUpperCase();
  if (upper === 'HUMAN' || upper === 'USER') return 'HUMAN';
  if (upper === 'REVIEWER') return 'REVIEWER';
  if (upper === 'OPERATOR') return 'OPERATOR';
  return 'AI_AGENT';
}

function makeRequestId(): string {
  return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function executeCommand(command: string, flags: Record<string, string>): CliResult {
  switch (command) {
    case 'check-phase':
    case 'phase': {
      const context = {
        requestId: makeRequestId(),
        phase: normalizePhase(flags.phase),
        riskLevel: normalizeRisk(flags.risk),
        role: normalizeRole(flags.role),
        action: flags.action || 'unknown',
      };
      const guard = engine.getGuard('phase_gate');
      const result = guard!.evaluate(context);
      return {
        success: result.decision === 'ALLOW',
        command,
        output: { ...result, context: { phase: context.phase, role: context.role } },
        exitCode: result.decision === 'ALLOW' ? 0 : 1,
      };
    }

    case 'check-risk':
    case 'risk': {
      const context = {
        requestId: makeRequestId(),
        phase: normalizePhase(flags.phase),
        riskLevel: normalizeRisk(flags.risk),
        role: normalizeRole(flags.role),
        action: flags.action || 'unknown',
      };
      const guard = engine.getGuard('risk_gate');
      const result = guard!.evaluate(context);
      return {
        success: result.decision === 'ALLOW',
        command,
        output: { ...result, context: { riskLevel: context.riskLevel, role: context.role } },
        exitCode: result.decision === 'BLOCK' ? 1 : 0,
      };
    }

    case 'check-authority':
    case 'authority': {
      const context = {
        requestId: makeRequestId(),
        phase: normalizePhase(flags.phase),
        riskLevel: normalizeRisk(flags.risk),
        role: normalizeRole(flags.role),
        action: flags.action || 'unknown',
      };
      const guard = engine.getGuard('authority_gate');
      const result = guard!.evaluate(context);
      return {
        success: result.decision === 'ALLOW',
        command,
        output: { ...result, context: { role: context.role, action: context.action } },
        exitCode: result.decision === 'ALLOW' ? 0 : 1,
      };
    }

    case 'evaluate':
    case 'eval': {
      const context = {
        requestId: makeRequestId(),
        phase: normalizePhase(flags.phase),
        riskLevel: normalizeRisk(flags.risk),
        role: normalizeRole(flags.role),
        action: flags.action || 'unknown',
        agentId: flags.agent || flags.agentId,
        targetFiles: flags.files ? flags.files.split(',') : undefined,
        mutationCount: flags.mutations ? parseInt(flags.mutations, 10) : undefined,
        traceHash: flags.trace || flags.traceHash,
      };
      const result = engine.evaluate(context);
      return {
        success: result.finalDecision === 'ALLOW',
        command,
        output: {
          finalDecision: result.finalDecision,
          blockedBy: result.blockedBy || null,
          escalatedBy: result.escalatedBy || null,
          agentGuidance: result.agentGuidance || null,
          durationMs: result.durationMs,
          guardCount: result.results.length,
          results: result.results.map((r) => ({
            guard: r.guardId,
            decision: r.decision,
            reason: r.reason,
          })),
        },
        exitCode: result.finalDecision === 'ALLOW' ? 0 : result.finalDecision === 'BLOCK' ? 1 : 2,
      };
    }

    case 'prompt': {
      const prompt = generateSystemPrompt({
        phase: normalizePhase(flags.phase),
        riskLevel: normalizeRisk(flags.risk),
        role: normalizeRole(flags.role),
        agentId: flags.agent,
        projectName: flags.project,
        mcpToolsAvailable: flags.mcp !== 'false',
        maxRiskLevel: normalizeRisk(flags.maxRisk || 'R2'),
        userConstraints: flags.constraints ? flags.constraints.split(',') : undefined,
      });
      return {
        success: true,
        command,
        output: {
          systemPrompt: prompt.systemPrompt,
          sections: prompt.sections,
          activeRules: prompt.activeRules,
          estimatedTokens: prompt.estimatedTokens,
        },
        exitCode: 0,
      };
    }

    case 'advance': {
      const currentPhase = engine.getSessionPhase();
      const phases: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
      const idx = phases.indexOf(currentPhase as CVFPhase);
      if (idx >= phases.length - 1) {
        return {
          success: true,
          command,
          output: { message: 'Already at final phase (REVIEW)', currentPhase },
          exitCode: 0,
        };
      }
      const nextPhase = phases[idx + 1];
      engine.setSessionPhase(nextPhase);
      return {
        success: true,
        command,
        output: {
          previousPhase: currentPhase,
          newPhase: nextPhase,
          evidence: flags.evidence || 'No evidence provided',
        },
        exitCode: 0,
      };
    }

    case 'audit': {
      const log = engine.getAuditLog();
      const limit = flags.limit ? parseInt(flags.limit, 10) : 20;
      const entries = [...log].slice(-limit);
      return {
        success: true,
        command,
        output: {
          totalEntries: log.length,
          returned: entries.length,
          entries: entries.map((e) => ({
            requestId: e.requestId,
            timestamp: e.timestamp,
            decision: e.pipelineResult.finalDecision,
            action: e.context.action,
          })),
        },
        exitCode: 0,
      };
    }

    case 'status': {
      const log = engine.getAuditLog();
      const guards = engine.getRegisteredGuards();
      return {
        success: true,
        command,
        output: {
          version: '1.7.0',
          sessionPhase: engine.getSessionPhase(),
          guards: guards.map((g) => ({ id: g.id, enabled: g.enabled, priority: g.priority })),
          guardCount: guards.length,
          auditEntries: log.length,
          config: engine.getConfig(),
        },
        exitCode: 0,
      };
    }

    case 'help':
    default:
      return {
        success: true,
        command: 'help',
        output: {
          name: 'CVF CLI',
          version: '1.7.0',
          commands: {
            'check-phase': 'Check phase gate (--phase, --role, --action)',
            'check-risk': 'Check risk gate (--risk, --role, --action)',
            'check-authority': 'Check authority (--role, --action)',
            'evaluate': 'Full pipeline evaluation (--phase, --risk, --role, --action, --agent, --files, --mutations)',
            'prompt': 'Generate system prompt (--phase, --risk, --role, --project, --constraints)',
            'advance': 'Advance to next phase (--evidence)',
            'audit': 'View audit log (--limit)',
            'status': 'Show CVF status',
            'help': 'Show this help',
          },
        },
        exitCode: 0,
      };
  }
}

export function runCli(argv: string[]): CliResult {
  const { command, flags } = parseArgs(argv);
  return executeCommand(command, flags);
}

export function formatOutput(result: CliResult, format: 'json' | 'text' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(result.output, null, 2);
  }

  const lines: string[] = [];
  lines.push(`[CVF] ${result.command} — ${result.success ? 'OK' : 'FAILED'}`);

  const out = result.output as Record<string, unknown>;
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`  ${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`  ${key}: [${value.length} items]`);
    }
  }

  return lines.join('\n');
}
