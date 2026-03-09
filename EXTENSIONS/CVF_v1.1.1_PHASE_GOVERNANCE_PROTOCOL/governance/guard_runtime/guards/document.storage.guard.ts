/**
 * Document Storage Guard — Track IV Phase A.2
 *
 * Runtime enforcement of CVF document storage taxonomy.
 * Ensures documents are placed in the correct taxonomy folder per docs/INDEX.md.
 *
 * Rules:
 *   - New documents in docs/ must be in approved taxonomy folders
 *   - No new docs directly in docs/ root (exceptions: canonical root-level files)
 *   - Approved folders: reference/, assessments/, baselines/, roadmaps/, reviews/,
 *     logs/, concepts/, guides/, tutorials/, cheatsheets/, case-studies/
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

const APPROVED_TAXONOMY_FOLDERS = [
  'docs/reference/',
  'docs/assessments/',
  'docs/baselines/',
  'docs/roadmaps/',
  'docs/reviews/',
  'docs/logs/',
  'docs/concepts/',
  'docs/guides/',
  'docs/tutorials/',
  'docs/cheatsheets/',
  'docs/case-studies/',
];

const ROOT_LEVEL_EXCEPTIONS = [
  'docs/INDEX.md',
  'docs/CVF_CORE_KNOWLEDGE_BASE.md',
  'docs/CVF_ARCHITECTURE_DECISIONS.md',
  'docs/CVF_INCREMENTAL_TEST_LOG.md',
];

export class DocumentStorageGuard implements Guard {
  id = 'document_storage';
  name = 'Document Storage Guard';
  description = 'Enforces correct taxonomy placement for documents in docs/.';
  priority = 82;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];

    if (targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files to check storage taxonomy.',
        timestamp,
      };
    }

    const violations: string[] = [];

    for (const file of targetFiles) {
      const normalized = file.replace(/\\/g, '/');

      if (!normalized.includes('docs/')) continue;
      if (!normalized.endsWith('.md')) continue;

      const isRootException = ROOT_LEVEL_EXCEPTIONS.some((e) => normalized.endsWith(e));
      if (isRootException) continue;

      const isInTaxonomy = APPROVED_TAXONOMY_FOLDERS.some((f) => normalized.includes(f));
      if (!isInTaxonomy) {
        const docsIdx = normalized.indexOf('docs/');
        const afterDocs = normalized.substring(docsIdx + 5);
        const slashCount = (afterDocs.match(/\//g) || []).length;
        if (slashCount === 0) {
          violations.push(normalized);
        }
      }
    }

    if (violations.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Document storage violation: ${violations.join(', ')} must be placed in an approved taxonomy folder (${APPROVED_TAXONOMY_FOLDERS.map(f => f.replace('docs/', '')).join(', ')}).`,
        timestamp,
        metadata: { violations, approvedFolders: APPROVED_TAXONOMY_FOLDERS },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'All documents placed in approved taxonomy folders.',
      timestamp,
    };
  }
}

export { APPROVED_TAXONOMY_FOLDERS, ROOT_LEVEL_EXCEPTIONS };
