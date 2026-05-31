import { describe, expect, it } from 'vitest';
import { getTemplateById } from '@/lib/templates';
import { buildSpecFirstMediationReadout } from '@/lib/spec-first-mediation';
import {
  buildEnglishSpecFreezeReadout,
  validateFrozenEnglishSpec,
} from '@/lib/spec-english-freeze';

describe('VI5-T2 English Spec freeze', () => {
  it('builds a frozen English-only handoff while preserving Vietnamese source evidence by reference', () => {
    const specFirstMediation = buildSpecFirstMediationReadout({
      request: {
        templateId: 'strategy_analysis',
        intent: 'Phân tích chiến lược mở rộng thị trường miền Trung',
        inputs: {
          topic: 'Mở rộng thị trường miền Trung',
          context: 'Ngân sách hạn chế',
        },
        specFirst: {
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.',
        },
      },
      template: getTemplateById('strategy_analysis'),
    });

    const freeze = buildEnglishSpecFreezeReadout({
      request: {
        templateId: 'strategy_analysis',
        inputs: {
          topic: 'Mở rộng thị trường miền Trung',
          context: 'Ngân sách hạn chế',
        },
      },
      specFirstMediation,
      providerOutput: 'English strategy readout is available.',
    });

    expect(freeze).toMatchObject({
      contractVersion: 'cvf.englishSpecFreeze.vi5.t2.v1',
      status: 'frozen',
      frozenSpecLanguage: 'en',
      sourcePromptLanguage: 'vi',
      sourcePromptPreserved: true,
      agentHandoffReady: true,
      userReviewRequired: true,
    });
    expect(freeze.validation).toMatchObject({
      englishOnlyBody: true,
      requiredSectionsPresent: true,
      sourceEvidenceSeparated: true,
      blockedReasons: [],
    });
    expect(freeze.frozenSpec).toContain('## Source Evidence References');
    expect(freeze.frozenSpec).toContain('specFirstMediation.originalPrompt');
    expect(freeze.frozenSpec).not.toContain('Mở rộng');
    expect(freeze.sourceEvidenceRef).toMatchObject({
      originalPrompt: 'specFirstMediation.originalPrompt',
      structuredInputs: 'request.inputs',
      providerOutput: 'route.output',
    });
  });

  it('blocks a freeze claim when non-English body text leaks into the frozen Spec', () => {
    const validation = validateFrozenEnglishSpec([
      '# CVF Frozen English Execution Spec',
      '',
      '## Purpose',
      'Tôi cần phân tích chiến lược.',
      '## Task Classification',
      '## Selected Workflow',
      '## Execution Inputs',
      '## Execution Constraints',
      '## Expected Output',
      '## Validation Requirements',
      '## Source Evidence References',
      '- Original source prompt: specFirstMediation.originalPrompt.',
      '- Structured source inputs: request.inputs.',
      '## Agent Handoff Instructions',
      '## User Review Checkpoint',
    ].join('\n'), { originalPromptPreserved: true });

    expect(validation.englishOnlyBody).toBe(false);
    expect(validation.blockedReasons).toContain('frozen_spec_contains_non_english_body');
  });

  it('blocks a freeze claim when required sections are missing or source evidence is not separated', () => {
    const validation = validateFrozenEnglishSpec('# CVF Frozen English Execution Spec\n\n## Purpose\nEnglish body only.', {
      originalPromptPreserved: false,
    });

    expect(validation.requiredSectionsPresent).toBe(false);
    expect(validation.sourceEvidenceSeparated).toBe(false);
    expect(validation.blockedReasons).toEqual(expect.arrayContaining([
      'required_sections_missing',
      'source_evidence_not_separated',
      'source_prompt_not_preserved',
    ]));
  });
});
