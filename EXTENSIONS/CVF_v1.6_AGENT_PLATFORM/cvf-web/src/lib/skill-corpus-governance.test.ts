import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// CommonJS script consumed by both build-time and app-time surfaces.
// Keep the test close to runtime code, but load the exact generator module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadSkillCorpusGovernance } = require('../../scripts/skill-corpus-governance');

function loadSkillIndex() {
  const raw = readFileSync(path.resolve(process.cwd(), 'public/data/skills-index.json'), 'utf8');
  return JSON.parse(raw) as {
    categories: Array<{
      skills: Array<{
        linkedTemplates?: Array<{
          templateId: string;
          corpusClass: string;
        }>;
      }>;
    }>;
  };
}

describe('skill corpus governance', () => {
  it('keeps the frozen benchmark subset aligned to the 9 trusted wizards only', () => {
    const governance = loadSkillCorpusGovernance();

    expect(governance.trustedBenchmarkSet.has('api_design')).toBe(false);
    expect(governance.trustedBenchmarkSet.has('app_builder_wizard')).toBe(true);
    expect(governance.summary.trustedBenchmarkSkills).toBe(9);
  });

  it('keeps api_design out of the benchmark subset while promoting it to a trusted supporting front-door surface', () => {
    const governance = loadSkillCorpusGovernance();
    const apiDesignSkill = governance.skillMap.get('app_development::05_api_design_spec');

    expect(apiDesignSkill).toBeDefined();
    expect(apiDesignSkill.trustedBenchmarkSurface).toBe(false);
    expect(apiDesignSkill.frontDoorTier).toBe('TRUSTED_SUPPORTING');
    expect(apiDesignSkill.linkedTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          templateId: 'api_design',
          corpusClass: 'TRUSTED_FOR_VALUE_PROOF',
          trustedBenchmarkSurface: false,
        }),
      ]),
    );
  });

  it('keeps the strict front door fully trusted after wave 2 closeout', () => {
    const governance = loadSkillCorpusGovernance();
    const skillIndex = loadSkillIndex();
    const linkedTemplates = skillIndex.categories
      .flatMap((category) => category.skills)
      .flatMap((skill) => skill.linkedTemplates ?? []);

    expect(governance.templateClassMap.web_build_handoff).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(governance.templateClassMap.api_design).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(governance.templateClassMap.app_builder_complete).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(governance.templateClassMap.web_ux_redesign_system).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(linkedTemplates.some((item) => item.templateId === 'architecture_review')).toBe(false);
    expect(linkedTemplates.length).toBeGreaterThan(0);
    expect(linkedTemplates.every((item) => item.corpusClass === 'TRUSTED_FOR_VALUE_PROOF')).toBe(true);
    expect(linkedTemplates.some((item) => item.corpusClass === 'REVIEW_REQUIRED')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'LEGACY_LOW_CONFIDENCE')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'REJECT_FOR_NON_CODER_FRONTDOOR')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'UNSCREENED_LEGACY')).toBe(false);
  });
});
