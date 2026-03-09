/**
 * Document Naming Guard — Track IV Phase A.2
 *
 * Runtime enforcement of CVF document naming conventions.
 * Ensures all governance/review/assessment documents use the CVF_ prefix.
 *
 * Rules:
 *   - Documents in docs/ and governance/ must use CVF_ prefix
 *   - Format: CVF_<PURPOSE>[_<SCOPE>][_YYYY-MM-DD].md
 *   - Uppercase snake case after prefix
 *   - Exceptions: README.md, INDEX.md, CHANGELOG.md
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

const GOVERNED_PATHS = ['docs/', 'governance/'];

const EXEMPT_FILENAMES = [
  'README.md',
  'INDEX.md',
  'CHANGELOG.md',
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
];

const CVF_PREFIX_PATTERN = /^CVF_[A-Z][A-Z0-9_]*(\d{4}-\d{2}-\d{2})?\.md$/;

export class DocumentNamingGuard implements Guard {
  id = 'document_naming';
  name = 'Document Naming Guard';
  description = 'Enforces CVF_ prefix naming convention for governance documents.';
  priority = 80;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];

    if (targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files to check naming convention.',
        timestamp,
      };
    }

    const violations: string[] = [];

    for (const file of targetFiles) {
      const normalized = file.replace(/\\/g, '/');
      const isGoverned = GOVERNED_PATHS.some((p) => normalized.includes(p));
      if (!isGoverned) continue;

      const filename = normalized.split('/').pop() ?? '';
      if (!filename.endsWith('.md')) continue;
      if (EXEMPT_FILENAMES.includes(filename)) continue;

      if (!CVF_PREFIX_PATTERN.test(filename)) {
        violations.push(filename);
      }
    }

    if (violations.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Document naming violation: ${violations.join(', ')} must use CVF_ prefix (format: CVF_<PURPOSE>[_YYYY-MM-DD].md).`,
        timestamp,
        metadata: { violations },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'All document names comply with CVF naming convention.',
      timestamp,
    };
  }
}

export { GOVERNED_PATHS, EXEMPT_FILENAMES, CVF_PREFIX_PATTERN };
