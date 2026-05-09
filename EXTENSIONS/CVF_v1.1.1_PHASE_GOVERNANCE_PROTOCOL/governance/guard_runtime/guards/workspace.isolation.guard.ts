/**
 * Workspace Isolation Guard — Track IV Phase A.2
 *
 * Runtime enforcement of CVF workspace isolation policy.
 * Prevents downstream projects from being developed inside CVF root.
 *
 * Rules:
 *   - Downstream project files (e.g., .env, node_modules of apps) must not be in CVF root
 *   - Only CVF governance/framework maintenance allowed in CVF root
 *   - Downstream projects must be sibling workspaces
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

const DOWNSTREAM_INDICATORS = [
  '.env',
  '.env.local',
  '.env.production',
  'docker-compose.yml',
  'Dockerfile',
  'next.config.js',
  'next.config.mjs',
  'angular.json',
  'vue.config.js',
  'app.config.ts',
  'server.ts',
  'server.js',
  'prisma/schema.prisma',
];

const CVF_ALLOWED_ROOT_FILES = [
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
  '.gitignore',
  'LICENSE',
];

export class WorkspaceIsolationGuard implements Guard {
  id = 'workspace_isolation';
  name = 'Workspace Isolation Guard';
  description = 'Prevents downstream project files from being created in CVF root.';
  priority = 85;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];

    if (targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files to check workspace isolation.',
        timestamp,
      };
    }

    const violations: string[] = [];

    for (const file of targetFiles) {
      const normalized = file.replace(/\\/g, '/');
      const filename = normalized.split('/').pop() ?? '';

      const isDownstreamFile = DOWNSTREAM_INDICATORS.some((d) =>
        normalized.endsWith(d) || filename === d
      );

      if (isDownstreamFile) {
        const isInExtension = normalized.includes('EXTENSIONS/');
        const isInEcosystem = normalized.includes('ECOSYSTEM/');
        if (!isInExtension && !isInEcosystem) {
          violations.push(file);
        }
      }
    }

    if (violations.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Workspace isolation violation: downstream project files detected in CVF root: ${violations.join(', ')}. Use a sibling workspace instead.`,
        timestamp,
        metadata: { violations },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'No workspace isolation violations detected.',
      timestamp,
    };
  }
}

export { DOWNSTREAM_INDICATORS, CVF_ALLOWED_ROOT_FILES };
