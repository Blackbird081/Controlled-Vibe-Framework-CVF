/**
 * Wizard Progress & Context Tips — v1.6 Enhancement Track 3.3
 *
 * Provides progress tracking, contextual tips, and step validation
 * for the multi-step wizard flows. Designed for non-coder UX:
 * - Friendly progress indicators
 * - Smart tips based on current step and filled fields
 * - Completion estimation
 *
 * @module lib/wizard-progress
 */

type Lang = 'vi' | 'en';

// ─── Types ────────────────────────────────────────────────────────────

export interface WizardStepStatus {
  stepIndex: number;
  stepName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completionPercent: number;
  filledFields: number;
  totalFields: number;
  requiredFilled: number;
  requiredTotal: number;
}

export interface WizardProgressSummary {
  steps: WizardStepStatus[];
  overallPercent: number;
  currentStep: number;
  totalSteps: number;
  canSubmit: boolean;
  estimatedTimeRemaining: string;
  friendlyMessage: string;
}

export interface FieldInfo {
  id: string;
  required: boolean;
  filled: boolean;
}

export interface StepInfo {
  name: string;
  fields: FieldInfo[];
  skipped?: boolean;
}

// ─── Progress Calculation ─────────────────────────────────────────────

export function calculateStepStatus(
  stepIndex: number,
  step: StepInfo,
  currentStep: number,
): WizardStepStatus {
  if (step.skipped) {
    return {
      stepIndex,
      stepName: step.name,
      status: 'skipped',
      completionPercent: 100,
      filledFields: 0,
      totalFields: step.fields.length,
      requiredFilled: 0,
      requiredTotal: step.fields.filter(f => f.required).length,
    };
  }

  const totalFields = step.fields.length;
  const filledFields = step.fields.filter(f => f.filled).length;
  const requiredTotal = step.fields.filter(f => f.required).length;
  const requiredFilled = step.fields.filter(f => f.required && f.filled).length;

  const completionPercent = totalFields === 0
    ? 100
    : Math.round((filledFields / totalFields) * 100);

  let status: WizardStepStatus['status'];
  if (stepIndex > currentStep) {
    status = 'not_started';
  } else if (completionPercent === 100) {
    status = 'completed';
  } else if (filledFields > 0 || stepIndex === currentStep) {
    status = 'in_progress';
  } else {
    status = 'not_started';
  }

  return {
    stepIndex,
    stepName: step.name,
    status,
    completionPercent,
    filledFields,
    totalFields,
    requiredFilled,
    requiredTotal,
  };
}

export function calculateProgress(
  steps: StepInfo[],
  currentStep: number,
  lang: Lang,
): WizardProgressSummary {
  const stepStatuses = steps.map((step, i) =>
    calculateStepStatus(i, step, currentStep),
  );

  const totalSteps = steps.length;

  // Overall percent: weighted by total fields per step
  const totalFields = stepStatuses.reduce((s, st) => s + st.totalFields, 0);
  const filledFields = stepStatuses.reduce((s, st) => s + st.filledFields, 0);
  const overallPercent = totalFields === 0
    ? 0
    : Math.round((filledFields / totalFields) * 100);

  // Can submit: all required fields in all steps are filled
  const canSubmit = stepStatuses.every(
    st => st.status === 'skipped' || st.requiredFilled >= st.requiredTotal,
  );

  // Estimated time: ~15 seconds per unfilled field
  const remainingFields = totalFields - filledFields;
  const estimatedTimeRemaining = getEstimatedTime(remainingFields, lang);

  const friendlyMessage = getFriendlyProgressMessage(overallPercent, canSubmit, lang);

  return {
    steps: stepStatuses,
    overallPercent,
    currentStep,
    totalSteps,
    canSubmit,
    estimatedTimeRemaining,
    friendlyMessage,
  };
}

// ─── Time Estimation ──────────────────────────────────────────────────

const SECONDS_PER_FIELD = 15;

export function getEstimatedTime(remainingFields: number, lang: Lang): string {
  if (remainingFields <= 0) {
    return lang === 'vi' ? 'Sẵn sàng!' : 'Ready!';
  }

  const totalSeconds = remainingFields * SECONDS_PER_FIELD;

  if (totalSeconds < 60) {
    return lang === 'vi' ? 'Dưới 1 phút' : 'Less than 1 minute';
  }

  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes === 1) {
    return lang === 'vi' ? 'Khoảng 1 phút' : 'About 1 minute';
  }

  return lang === 'vi'
    ? `Khoảng ${minutes} phút`
    : `About ${minutes} minutes`;
}

// ─── Friendly Messages ────────────────────────────────────────────────

export function getFriendlyProgressMessage(
  percent: number,
  canSubmit: boolean,
  lang: Lang,
): string {
  if (canSubmit && percent >= 80) {
    return lang === 'vi'
      ? '✅ Tuyệt vời! Bạn đã sẵn sàng tiếp tục.'
      : '✅ Great! You\'re ready to proceed.';
  }
  if (percent >= 80) {
    return lang === 'vi'
      ? '🏁 Gần xong rồi! Chỉ còn vài chi tiết nữa.'
      : '🏁 Almost there! Just a few more details.';
  }
  if (percent >= 50) {
    return lang === 'vi'
      ? '👍 Tốt lắm! Đã qua nửa chặng đường.'
      : '👍 Good progress! Past the halfway mark.';
  }
  if (percent >= 20) {
    return lang === 'vi'
      ? '📝 Đang tiến triển tốt. Tiếp tục nhé!'
      : '📝 Making good progress. Keep going!';
  }
  return lang === 'vi'
    ? '🚀 Hãy bắt đầu! Điền thông tin để tôi giúp bạn.'
    : '🚀 Let\'s get started! Fill in the details so I can help you.';
}

// ─── Context Tips ─────────────────────────────────────────────────────

export interface ContextTip {
  fieldId: string;
  tip: string;
  type: 'info' | 'suggestion' | 'warning';
}

/**
 * Generate contextual tips based on what fields are filled and what's missing.
 */
export function getContextTips(
  step: StepInfo,
  values: Record<string, string>,
  lang: Lang,
): ContextTip[] {
  const tips: ContextTip[] = [];

  for (const field of step.fields) {
    const value = values[field.id]?.trim() || '';

    // Missing required field
    if (field.required && !value) {
      tips.push({
        fieldId: field.id,
        type: 'warning',
        tip: lang === 'vi'
          ? 'Trường này bắt buộc — hãy điền để kết quả tốt hơn'
          : 'This field is required — fill it in for better results',
      });
      continue;
    }

    // Very short value
    if (value && value.length < 10 && field.required) {
      tips.push({
        fieldId: field.id,
        type: 'suggestion',
        tip: lang === 'vi'
          ? 'Thêm chi tiết sẽ giúp AI hiểu rõ hơn yêu cầu của bạn'
          : 'Adding more detail helps the AI understand your needs better',
      });
    }
  }

  // All required fields filled — encouragement
  const allRequiredFilled = step.fields
    .filter(f => f.required)
    .every(f => (values[f.id]?.trim() || '').length > 0);

  if (allRequiredFilled && step.fields.some(f => f.required)) {
    tips.push({
      fieldId: '_step',
      type: 'info',
      tip: lang === 'vi'
        ? '✅ Tất cả thông tin bắt buộc đã được điền!'
        : '✅ All required information is filled in!',
    });
  }

  return tips;
}

// ─── Step Navigation Helpers ──────────────────────────────────────────

/**
 * Check if user can safely move to next step (all required fields filled).
 */
export function canAdvanceStep(step: StepInfo, values: Record<string, string>): boolean {
  return step.fields
    .filter(f => f.required)
    .every(f => (values[f.id]?.trim() || '').length > 0);
}

/**
 * Get the first incomplete step index (for "jump to next incomplete" UI).
 */
export function getFirstIncompleteStep(
  steps: StepInfo[],
  values: Record<string, string>,
): number {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].skipped) continue;
    if (!canAdvanceStep(steps[i], values)) return i;
  }
  return steps.length - 1; // all complete → go to last
}
