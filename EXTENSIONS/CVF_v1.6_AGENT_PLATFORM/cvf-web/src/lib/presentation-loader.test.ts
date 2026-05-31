import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertWorkflowPresentationKeyParity,
  getWorkflowPresentationCatalog,
  loadStrategyPresentationCatalogs,
} from '@/lib/presentation-loader';

describe('workflow presentation loader', () => {
  it('loads Strategy English and Vietnamese catalogs with key parity', () => {
    const catalogs = loadStrategyPresentationCatalogs();

    expect(catalogs.en.templateId).toBe('strategy_analysis');
    expect(catalogs.vi.templateId).toBe('strategy_analysis');
    expect(catalogs.en.steps).toHaveLength(3);
    expect(catalogs.vi.steps).toHaveLength(3);
    expect(() => assertWorkflowPresentationKeyParity(catalogs.en, catalogs.vi)).not.toThrow();
  });

  it('resolves localized Strategy catalog and preserves option ids', () => {
    const catalog = getWorkflowPresentationCatalog({ templateId: 'strategy_analysis', locale: 'vi' });

    expect(catalog?.locale).toBe('vi');
    expect(catalog?.steps[0]).toMatchObject({
      stepId: 'intent_confirmation',
      stepIntent: 'strategy.type',
      captureKey: 'strategy.type',
      allowFreeformAlternative: true,
      userMustChoose: true,
    });
    expect(catalog?.steps[0].options.map((option) => option.id)).toEqual([
      'strategic_decision',
      'market_entry',
      'competitive_response',
      'other',
    ]);
  });

  it('returns null for workflows without a VI5-T1 catalog', () => {
    expect(getWorkflowPresentationCatalog({ templateId: 'product_brief', locale: 'vi' })).toBeNull();
  });

  it('marks guided-mode availability explicitly for all certified packs', () => {
    const registryPath = path.resolve(process.cwd(), '..', '..', '..', 'governance', 'registries', 'cvf-certified-skill-pack-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as {
      entries: Array<{ id: string; guided_mode_available?: unknown }>;
    };

    expect(registry.entries).toHaveLength(10);
    for (const entry of registry.entries) {
      expect(typeof entry.guided_mode_available, `${entry.id} marker`).toBe('boolean');
    }
    expect(registry.entries.find((entry) => entry.id === 'strategy_analysis')?.guided_mode_available).toBe(true);
    expect(registry.entries.filter((entry) => entry.id !== 'strategy_analysis').every((entry) => entry.guided_mode_available === false)).toBe(true);
  });
});
