import type { ExecutionRequest } from '@/lib/ai';
import {
  getWorkflowPresentationCatalog,
  type WorkflowPresentationCatalog,
  type WorkflowPresentationOption,
} from '@/lib/presentation-loader';
import type { EnglishSpecFreezeReadout } from '@/lib/spec-english-freeze';
import type { SpecFirstLanguage, SpecFirstMediationReadout } from '@/lib/spec-first-mediation';

export const LANGUAGE_STATE_VERSION = 'cvf.languageState.vi5.t1.v1' as const;
export const GUIDED_STEP_STATE_VERSION = 'cvf.guidedStepState.vi5.t1.v1' as const;
export const SPEC_BOUNDARY_VERSION = 'cvf.specBoundary.vi5.t1.v1' as const;

export type ObservedSpecBodyLanguage = 'en' | 'vi' | 'mixed' | 'unknown';

export interface LanguageState {
  contractVersion: typeof LANGUAGE_STATE_VERSION;
  userInputLanguage: SpecFirstLanguage;
  userFacingResponseLanguage: SpecFirstLanguage;
  engineRoomLanguage: 'en';
  specContractLanguage: 'en';
  uiLayerLanguage: SpecFirstLanguage;
}

export interface GuidedStepState {
  contractVersion: typeof GUIDED_STEP_STATE_VERSION;
  workflowId: string | null;
  templateId: string | null;
  guidedModeAvailable: boolean;
  currentStep: number | null;
  totalSteps: number;
  stepIntent: string | null;
  presentedQuestion: string | null;
  presentedOptions: WorkflowPresentationOption[];
  allowFreeformAlternative: boolean;
  userMustChoose: boolean;
  capturedSpecFields: string[];
  transitionState: 'initial_step_presented' | 'chat_mode_only';
}

export interface SpecBoundary {
  contractVersion: typeof SPEC_BOUNDARY_VERSION;
  frozen: boolean;
  specBlockLanguage: 'en';
  observedSpecBodyLanguage: ObservedSpecBodyLanguage;
  englishFreezeEnforced: boolean;
  frozenAt: string | null;
  editAfterFreezeWarning: true;
  sourcePromptPreserved: boolean;
  normalizedSpecAvailable: boolean;
}

export interface Vi5LanguageReadout {
  languageState: LanguageState;
  guidedStepState: GuidedStepState;
  specBoundary: SpecBoundary;
}

const VI_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]|\b(ứng dụng|ung dung|chiến lược|chien luoc|người dùng|nguoi dung|mục tiêu|muc tieu|yêu cầu|yeu cau|rủi ro|rui ro|khách hàng|khach hang|thị trường|thi truong|doanh thu)\b/i;
const EN_PATTERN = /\b(context|user input|task|intent|expected output|validation|constraints|agent handoff|final user review|governed response|strategy|analysis|market|recommendation)\b/i;

export function buildVi5LanguageReadout(input: {
  request: Partial<ExecutionRequest>;
  specFirstMediation: SpecFirstMediationReadout;
  englishSpecFreeze?: EnglishSpecFreezeReadout;
  workflowId?: string | null;
}): Vi5LanguageReadout {
  const templateId = input.request.templateId ?? input.specFirstMediation.selectedTemplate.id;
  const catalog = getWorkflowPresentationCatalog({
    templateId,
    locale: input.specFirstMediation.outputLanguage,
  });

  return {
    languageState: {
      contractVersion: LANGUAGE_STATE_VERSION,
      userInputLanguage: input.specFirstMediation.sourceLanguage,
      userFacingResponseLanguage: input.specFirstMediation.outputLanguage,
      engineRoomLanguage: 'en',
      specContractLanguage: 'en',
      uiLayerLanguage: input.specFirstMediation.outputLanguage,
    },
    guidedStepState: buildGuidedStepState({
      catalog,
      templateId,
      workflowId: input.workflowId,
    }),
    specBoundary: {
      contractVersion: SPEC_BOUNDARY_VERSION,
      frozen: input.englishSpecFreeze?.status === 'frozen',
      specBlockLanguage: 'en',
      observedSpecBodyLanguage: classifyObservedSpecBodyLanguage(input.specFirstMediation.normalizedExecutionSpec),
      englishFreezeEnforced: input.englishSpecFreeze?.status === 'frozen',
      frozenAt: input.englishSpecFreeze?.frozenAt ?? null,
      editAfterFreezeWarning: true,
      sourcePromptPreserved: input.specFirstMediation.originalPromptPreserved,
      normalizedSpecAvailable: input.specFirstMediation.normalizedExecutionSpec.trim().length > 0,
    },
  };
}

export function classifyObservedSpecBodyLanguage(text: string): ObservedSpecBodyLanguage {
  const normalized = text.trim();
  if (!normalized) {
    return 'unknown';
  }
  const hasVi = VI_PATTERN.test(normalized);
  const hasEn = EN_PATTERN.test(normalized);
  if (hasVi && hasEn) {
    return 'mixed';
  }
  if (hasVi) {
    return 'vi';
  }
  if (hasEn || /[a-z]/i.test(normalized)) {
    return 'en';
  }
  return 'unknown';
}

function buildGuidedStepState(input: {
  catalog: WorkflowPresentationCatalog | null;
  templateId?: string | null;
  workflowId?: string | null;
}): GuidedStepState {
  if (!input.catalog) {
    return {
      contractVersion: GUIDED_STEP_STATE_VERSION,
      workflowId: input.workflowId ?? null,
      templateId: input.templateId ?? null,
      guidedModeAvailable: false,
      currentStep: null,
      totalSteps: 0,
      stepIntent: null,
      presentedQuestion: null,
      presentedOptions: [],
      allowFreeformAlternative: false,
      userMustChoose: false,
      capturedSpecFields: [],
      transitionState: 'chat_mode_only',
    };
  }

  const current = input.catalog.steps[0];
  return {
    contractVersion: GUIDED_STEP_STATE_VERSION,
    workflowId: input.workflowId ?? input.catalog.workflowId,
    templateId: input.catalog.templateId,
    guidedModeAvailable: input.catalog.guidedModeAvailable,
    currentStep: current.stepNumber,
    totalSteps: input.catalog.steps.length,
    stepIntent: current.stepIntent,
    presentedQuestion: current.question,
    presentedOptions: current.options,
    allowFreeformAlternative: current.allowFreeformAlternative,
    userMustChoose: current.userMustChoose,
    capturedSpecFields: input.catalog.steps.map((step) => step.captureKey),
    transitionState: 'initial_step_presented',
  };
}
