import { describe, expect, it } from 'vitest';

import { generateCompleteSpec, generateIntent, getTemplateById } from './templates';

type RewriteContract = {
  requiredFields: string[];
  forbiddenFields?: string[];
  requiredIntentPhrases?: string[];
  requiredOutputPhrases?: string[];
  forbiddenText?: string[];
};

const rewriteContracts: Record<string, RewriteContract> = {
  code_review: {
    requiredFields: ['workSample', 'goal', 'worry', 'mustPreserve', 'focus'],
    requiredIntentPhrases: ['người không chuyên', 'builder sửa'],
    requiredOutputPhrases: ['# Plain-Language Build Review', '## 4. Builder Handoff Brief', '## 5. Acceptance Checklist'],
  },
  documentation: {
    requiredFields: ['subject', 'currentNotes', 'readerGoal', 'audience', 'mustPreserve'],
    requiredIntentPhrases: ['dễ handoff', 'Không yêu cầu người đọc hiểu API hoặc developer internals'],
    requiredOutputPhrases: ['# Operational Documentation Packet', '## 6. Handoff Checklist'],
  },
  data_analysis: {
    requiredFields: ['dataset', 'questions', 'importantSlices', 'knownLimitations'],
    forbiddenFields: ['methods'],
    requiredIntentPhrases: ['ra quyết định', 'Không bắt người dùng đọc hiểu thuật ngữ thống kê'],
    requiredOutputPhrases: ['# Decision-Focused Data Analysis', '## 4. Recommended Actions'],
  },
  ab_test_review: {
    requiredFields: ['changeGoal', 'successSignal', 'variants', 'results', 'decisionNeed'],
    forbiddenFields: ['sampleSize'],
    requiredIntentPhrases: ['ra quyết định', 'Không ép người dùng hiểu jargon thống kê'],
    requiredOutputPhrases: ['# Product Experiment Review', '## 4. Decision Recommendation'],
  },
  api_security: {
    requiredFields: ['criticalFlows', 'sensitiveData', 'currentProtections', 'worry'],
    forbiddenFields: ['endpoints', 'auth', 'apiType'],
    requiredIntentPhrases: ['luồng hệ thống quan trọng', 'Không đòi người dùng phải biết endpoint taxonomy'],
    requiredOutputPhrases: ['# Sensitive Flow Security Review', '## 4. Priority Hardening Actions'],
  },
  data_handling: {
    requiredFields: ['dataTypes', 'sources', 'storageFlow', 'regulations'],
    forbiddenFields: ['storageSystems'],
    requiredIntentPhrases: ['vòng đời dữ liệu', 'Không yêu cầu người dùng biết hạ tầng chi tiết'],
    requiredOutputPhrases: ['# Data Handling Review', '## 4. Recommended Governance Rules'],
  },
  app_builder_complete: {
    requiredFields: ['appName', 'appType', 'problem', 'targetUsers', 'coreFeatures', 'successCriteria', 'mustPreserve', 'platforms', 'dataNeeds', 'lookAndFeel', 'outOfScope', 'constraints'],
    forbiddenFields: ['techPreference', 'dataStorage', 'offlineRequired', 'uiStyle', 'specialFeatures'],
    requiredIntentPhrases: ['non-coder', 'Do not ask the end user to choose frameworks, databases, or hidden technical patterns'],
    requiredOutputPhrases: ['# Complete App Brief', '## 4. Protected Boundaries', '## 6. Acceptance Criteria'],
  },
  api_design: {
    requiredFields: ['appName', 'whoUsesIt', 'jobsToSupport', 'informationExchanged', 'rulesApprovals', 'mustPreserve'],
    forbiddenFields: ['apiStyle', 'resources', 'operations', 'auth', 'pagination', 'responseFormat'],
    requiredIntentPhrases: ['integration handoff packet', 'without asking the user to choose API style'],
    requiredOutputPhrases: ['# Integration Handoff Packet', '## 4. Permissions And Safeguards', '## 6. Acceptance Checklist'],
  },
  vibe_logic_mapping: {
    requiredFields: ['approvedVibe', 'productSurface', 'userOutcome', 'mustPreserve'],
    forbiddenFields: ['techStack', 'appType'],
    requiredIntentPhrases: ['instead of asking for stack details', 'No contradictions between different vibes'],
    requiredOutputPhrases: ['# Vibe Implementation Brief', '## 5. Builder Handoff'],
  },
  web_ux_redesign_system: {
    requiredFields: ['projectSurface', 'users', 'coreFlows', 'pagesModals', 'mustPreserve', 'visualDirection', 'contentDensity', 'motionBudget', 'themeStrategy', 'references'],
    requiredIntentPhrases: ['review gate', 'non-coder approval happens before builder-side runtime changes'],
    requiredOutputPhrases: ['## 7. Review Gate & Acceptance Checklist', 'What requires explicit builder approval'],
    forbiddenText: ['framework phía sau'],
  },
};

function sampleValuesForTemplate(templateId: string) {
  const template = getTemplateById(templateId);
  if (!template) return {};

  return Object.fromEntries(
    template.fields.map((field) => {
      const optionValue = Array.isArray(field.options) && field.options.length > 0
        ? (field.type === 'multiselect' ? field.options.slice(0, 2).join(', ') : field.options[0])
        : undefined;

      return [
        field.id,
        field.example || optionValue || field.placeholder || `Sample value for ${field.label}`,
      ];
    }),
  );
}

describe('front-door rewrite regression contracts', () => {
  const unresolvedPlaceholderPattern = /\[[A-Za-z0-9_]+\]/;

  Object.entries(rewriteContracts).forEach(([templateId, contract]) => {
    it(`${templateId} stays non-coder-safe and builder-ready`, () => {
      const template = getTemplateById(templateId);

      expect(template, `${templateId} should exist in the template registry`).toBeDefined();

      const fieldIds = template!.fields.map((field) => field.id);
      const combinedText = [
        template!.description,
        template!.intentPattern,
        template!.outputTemplate,
        template!.sampleOutput,
        template!.outputExpected?.join('\n'),
      ]
        .filter(Boolean)
        .join('\n');

      contract.requiredFields.forEach((fieldId) => {
        expect(fieldIds, `${templateId} should keep ${fieldId} in the visible schema`).toContain(fieldId);
      });

      (contract.forbiddenFields ?? []).forEach((fieldId) => {
        expect(fieldIds, `${templateId} should not reintroduce legacy field ${fieldId}`).not.toContain(fieldId);
      });

      (contract.requiredIntentPhrases ?? []).forEach((phrase) => {
        expect(combinedText, `${templateId} should keep phrase "${phrase}" in its contract`).toContain(phrase);
      });

      (contract.requiredOutputPhrases ?? []).forEach((phrase) => {
        expect(combinedText, `${templateId} should keep output phrase "${phrase}"`).toContain(phrase);
      });

      (contract.forbiddenText ?? []).forEach((phrase) => {
        expect(combinedText, `${templateId} should not regress to phrase "${phrase}"`).not.toContain(phrase);
      });

      const sampleValues = sampleValuesForTemplate(templateId);
      const intent = generateIntent(template!, sampleValues);
      const spec = generateCompleteSpec(template!, sampleValues);

      expect(intent, `${templateId} generated intent should not leave template placeholders behind`).not.toMatch(unresolvedPlaceholderPattern);
      expect(spec, `${templateId} generated spec should not leave template placeholders behind`).not.toMatch(unresolvedPlaceholderPattern);
      expect(spec, `${templateId} generated spec should stay builder-ready`).toContain('## 📐 Output Template');
      expect(spec, `${templateId} generated spec should stay governance-safe`).toContain('Governed Response Rules');
    });
  });
});
