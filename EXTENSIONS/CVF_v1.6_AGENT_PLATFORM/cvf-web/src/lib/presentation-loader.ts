import fs from 'node:fs';
import path from 'node:path';

export const WORKFLOW_PRESENTATION_CONTRACT_VERSION = 'cvf.workflowPresentation.strategy_analysis.vi5.t1.v1' as const;

export type WorkflowPresentationLocale = 'en' | 'vi';

export interface WorkflowPresentationOption {
  id: string;
  label: string;
}

export interface WorkflowPresentationStep {
  stepId: string;
  stepNumber: number;
  stepIntent: string;
  question: string;
  captureKey: string;
  selectionMode: 'single';
  allowFreeformAlternative: boolean;
  userMustChoose: boolean;
  options: WorkflowPresentationOption[];
}

export interface WorkflowPresentationCatalog {
  contractVersion: typeof WORKFLOW_PRESENTATION_CONTRACT_VERSION;
  workflowId: string;
  templateId: string;
  locale: WorkflowPresentationLocale;
  guidedModeAvailable: boolean;
  steps: WorkflowPresentationStep[];
}

export function getWorkflowPresentationCatalog(input: {
  templateId?: string | null;
  locale?: string | null;
}): WorkflowPresentationCatalog | null {
  if (input.templateId !== 'strategy_analysis') {
    return null;
  }
  const locale = normalizeLocale(input.locale);
  return readCatalog('strategy_analysis', locale) ?? (locale === 'vi' ? readCatalog('strategy_analysis', 'en') : null);
}

export function assertWorkflowPresentationKeyParity(
  left: WorkflowPresentationCatalog,
  right: WorkflowPresentationCatalog,
): void {
  const leftKeys = flattenKeyShape(left);
  const rightKeys = flattenKeyShape(right);
  const missingFromRight = leftKeys.filter((key) => !rightKeys.includes(key));
  const missingFromLeft = rightKeys.filter((key) => !leftKeys.includes(key));

  if (missingFromRight.length || missingFromLeft.length) {
    throw new Error([
      'workflow_presentation_key_parity_failed',
      `missingFromRight=${missingFromRight.join(',') || 'none'}`,
      `missingFromLeft=${missingFromLeft.join(',') || 'none'}`,
    ].join(';'));
  }
}

export function loadStrategyPresentationCatalogs(): {
  en: WorkflowPresentationCatalog;
  vi: WorkflowPresentationCatalog;
} {
  const en = readCatalog('strategy_analysis', 'en');
  const vi = readCatalog('strategy_analysis', 'vi');
  if (!en || !vi) {
    throw new Error('strategy_presentation_catalog_missing');
  }
  assertWorkflowPresentationKeyParity(en, vi);
  return { en, vi };
}

function readCatalog(
  templateId: 'strategy_analysis',
  locale: WorkflowPresentationLocale,
): WorkflowPresentationCatalog | null {
  const catalogPath = path.join(resolveRepositoryRoot(), 'governance', 'workflows', templateId, 'presentation', `${locale}.json`);
  if (!fs.existsSync(catalogPath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf-8')) as WorkflowPresentationCatalog;
  validateCatalog(parsed, templateId, locale);
  return parsed;
}

function validateCatalog(
  catalog: WorkflowPresentationCatalog,
  templateId: string,
  locale: WorkflowPresentationLocale,
): void {
  if (catalog.contractVersion !== WORKFLOW_PRESENTATION_CONTRACT_VERSION) {
    throw new Error(`invalid_workflow_presentation_contract:${catalog.contractVersion}`);
  }
  if (catalog.templateId !== templateId || catalog.locale !== locale) {
    throw new Error(`invalid_workflow_presentation_identity:${catalog.templateId}:${catalog.locale}`);
  }
  if (!catalog.guidedModeAvailable || catalog.steps.length === 0) {
    throw new Error(`invalid_workflow_presentation_steps:${templateId}:${locale}`);
  }
}

function normalizeLocale(locale?: string | null): WorkflowPresentationLocale {
  return locale === 'vi' ? 'vi' : 'en';
}

function resolveRepositoryRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'governance', 'workflows'))) {
    return cwd;
  }
  const fromCvfWeb = path.resolve(cwd, '..', '..', '..');
  if (fs.existsSync(path.join(fromCvfWeb, 'governance', 'workflows'))) {
    return fromCvfWeb;
  }
  return cwd;
}

function flattenKeyShape(value: unknown, prefix = 'root'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenKeyShape(item, `${prefix}[]${index === 0 ? '' : ''}`));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .flatMap((key) => flattenKeyShape((value as Record<string, unknown>)[key], `${prefix}.${key}`));
  }
  return [prefix];
}
