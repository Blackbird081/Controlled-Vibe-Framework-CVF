import { describe, expect, it } from 'vitest';
import { getTemplateById } from '@/lib/templates';
import { buildSpecFirstMediationReadout } from '@/lib/spec-first-mediation';
import { buildEnglishSpecFreezeReadout } from '@/lib/spec-english-freeze';
import {
  buildVi5LanguageReadout,
  classifyObservedSpecBodyLanguage,
} from '@/lib/vi5-language-readout';

describe('VI5 language readout', () => {
  it('reports engine/spec language separately from observed mixed Spec body', () => {
    const specFirstMediation = buildSpecFirstMediationReadout({
      request: {
        templateId: 'strategy_analysis',
        templateName: 'Phan tich chien luoc',
        intent: 'Phân tích chiến lược mở rộng thị trường cho khách hàng SME',
        inputs: {
          topic: 'Mở rộng thị trường miền Trung',
          context: 'Doanh thu đang tăng chậm, ngân sách hạn chế.',
        },
        specFirst: {
          entryMode: 'template_first',
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.',
        },
      },
      template: getTemplateById('strategy_analysis'),
    });

    const readout = buildVi5LanguageReadout({
      request: { templateId: 'strategy_analysis' },
      specFirstMediation,
      workflowId: 'workflow.strategy.strategy_analysis.v1',
    });

    expect(readout.languageState).toMatchObject({
      contractVersion: 'cvf.languageState.vi5.t1.v1',
      userInputLanguage: 'vi',
      userFacingResponseLanguage: 'vi',
      engineRoomLanguage: 'en',
      specContractLanguage: 'en',
      uiLayerLanguage: 'vi',
    });
    expect(readout.specBoundary).toMatchObject({
      contractVersion: 'cvf.specBoundary.vi5.t1.v1',
      frozen: false,
      specBlockLanguage: 'en',
      observedSpecBodyLanguage: 'mixed',
      englishFreezeEnforced: false,
      frozenAt: null,
      editAfterFreezeWarning: true,
      sourcePromptPreserved: true,
      normalizedSpecAvailable: true,
    });
  });

  it('surfaces the Strategy guided step catalog in Vietnamese', () => {
    const specFirstMediation = buildSpecFirstMediationReadout({
      request: {
        templateId: 'strategy_analysis',
        inputs: { topic: 'Mở rộng thị trường', context: 'SME B2B SaaS' },
        specFirst: {
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Cần phân tích chiến lược mở rộng thị trường.',
        },
      },
      template: getTemplateById('strategy_analysis'),
    });

    const readout = buildVi5LanguageReadout({
      request: { templateId: 'strategy_analysis' },
      specFirstMediation,
    });

    expect(readout.guidedStepState).toMatchObject({
      contractVersion: 'cvf.guidedStepState.vi5.t1.v1',
      workflowId: 'workflow.strategy.strategy_analysis.v1',
      templateId: 'strategy_analysis',
      guidedModeAvailable: true,
      currentStep: 1,
      totalSteps: 3,
      stepIntent: 'strategy.type',
      allowFreeformAlternative: true,
      userMustChoose: true,
      transitionState: 'initial_step_presented',
    });
    expect(readout.guidedStepState.presentedQuestion).toContain('chiến lược');
    expect(readout.guidedStepState.presentedOptions.map((option) => option.id)).toEqual([
      'strategic_decision',
      'market_entry',
      'competitive_response',
      'other',
    ]);
    expect(readout.guidedStepState.capturedSpecFields).toEqual([
      'strategy.type',
      'strategy.constraints',
      'strategy.outputFormat',
    ]);
  });

  it('uses chat mode for non-catalog workflows', () => {
    const specFirstMediation = buildSpecFirstMediationReadout({
      request: {
        templateId: 'documentation',
        inputs: { topic: 'API docs' },
        specFirst: { sourceLanguage: 'en', outputLanguage: 'en' },
      },
      template: getTemplateById('documentation'),
    });

    const readout = buildVi5LanguageReadout({
      request: { templateId: 'documentation' },
      specFirstMediation,
    });

    expect(readout.guidedStepState.guidedModeAvailable).toBe(false);
    expect(readout.guidedStepState.transitionState).toBe('chat_mode_only');
    expect(readout.guidedStepState.presentedOptions).toEqual([]);
  });

  it('marks Spec English Freeze enforced only when the T2 artifact validates', () => {
    const specFirstMediation = buildSpecFirstMediationReadout({
      request: {
        templateId: 'strategy_analysis',
        inputs: { topic: 'Mở rộng thị trường', context: 'SME B2B SaaS' },
        specFirst: {
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Cần phân tích chiến lược mở rộng thị trường.',
        },
      },
      template: getTemplateById('strategy_analysis'),
    });
    const englishSpecFreeze = buildEnglishSpecFreezeReadout({
      request: { templateId: 'strategy_analysis', inputs: { topic: 'Mở rộng thị trường' } },
      specFirstMediation,
    });

    const readout = buildVi5LanguageReadout({
      request: { templateId: 'strategy_analysis' },
      specFirstMediation,
      englishSpecFreeze,
    });

    expect(englishSpecFreeze.status).toBe('frozen');
    expect(readout.specBoundary.frozen).toBe(true);
    expect(readout.specBoundary.englishFreezeEnforced).toBe(true);
    expect(readout.specBoundary.observedSpecBodyLanguage).toBe('mixed');
    expect(readout.specBoundary.frozenAt).toEqual(expect.any(String));
  });

  it('classifies observed Spec body language deterministically', () => {
    expect(classifyObservedSpecBodyLanguage('# CVF Execution Spec\n## Context\nTôi cần phân tích chiến lược.')).toBe('mixed');
    expect(classifyObservedSpecBodyLanguage('Tôi cần phân tích chiến lược.')).toBe('vi');
    expect(classifyObservedSpecBodyLanguage('# Context\nBuild a strategy brief.')).toBe('en');
    expect(classifyObservedSpecBodyLanguage('')).toBe('unknown');
  });
});
