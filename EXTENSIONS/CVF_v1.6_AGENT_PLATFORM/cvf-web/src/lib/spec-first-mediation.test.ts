import { describe, expect, it } from 'vitest';
import { getTemplateById } from '@/lib/templates';
import {
  buildSpecFirstMediationReadout,
  detectSpecLanguage,
  SPEC_FIRST_MEDIATION_VERSION,
} from './spec-first-mediation';

describe('spec-first mediation', () => {
  it('builds a Template-First Vietnamese execution spec with language metadata', () => {
    const template = getTemplateById('strategy_analysis');
    const readout = buildSpecFirstMediationReadout({
      request: {
        templateId: 'strategy_analysis',
        templateName: 'Phan tich Chien luoc',
        intent: 'Phan tich chien luoc mo rong thi truong mien Trung',
        inputs: {
          topic: 'Mo rong thi truong mien Trung',
          context: 'Cong ty SaaS B2B dang co 200 nhan vien va can tang truong doanh thu.',
        },
        specFirst: {
          entryMode: 'template_first',
          sourceLanguage: 'vi',
          outputLanguage: 'vi',
          originalPrompt: 'Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.',
        },
      },
      template,
    });

    expect(readout.contractVersion).toBe(SPEC_FIRST_MEDIATION_VERSION);
    expect(readout.entryMode).toBe('template_first');
    expect(readout.sourceLanguage).toBe('vi');
    expect(readout.workingLanguage).toBe('en');
    expect(readout.outputLanguage).toBe('vi');
    expect(readout.originalPromptPreserved).toBe(true);
    expect(readout.specGateStatus).toBe('PASS');
    expect(readout.clarificationRequired).toBe(false);
    expect(readout.normalizedExecutionSpec).toContain('## Context');
    expect(readout.normalizedExecutionSpec).toContain('## Agent Handoff Instructions');
    expect(readout.localizedEvidenceSummary).toContain('CVF đã chuẩn hóa');
  });

  it('turns Describe Your Goal into template and skill recommendations', () => {
    const readout = buildSpecFirstMediationReadout({
      request: {
        intent: 'I need to build a web app requirements spec for a task manager',
        inputs: {},
        specFirst: {
          entryMode: 'describe_goal',
          sourceLanguage: 'en',
          outputLanguage: 'en',
          originalPrompt: 'I need to build a web app requirements spec for a task manager',
        },
      },
    });

    expect(readout.entryMode).toBe('describe_goal');
    expect(readout.recommendedTemplates.length).toBeGreaterThan(0);
    expect(readout.standardSections).toContain('Final User Review Checkpoint');
    expect(readout.normalizedExecutionSpec).toContain('## Template / Skill Recommendation');
    expect(readout.clarificationRequired).toBe(true);
  });

  it('records AI-assisted prompt preparation as source material only', () => {
    const template = getTemplateById('vibe_to_spec');
    const readout = buildSpecFirstMediationReadout({
      request: {
        templateId: 'vibe_to_spec',
        templateName: 'Vibe-to-Spec Translator',
        intent: 'Convert the desired vibe into a buildable mapping table',
        inputs: {
          vibeDescription: 'Luxurious but simple, like a premium banking app',
          appType: 'Reporting Dashboard',
          targetUsers: 'Operations managers',
        },
        specFirst: {
          entryMode: 'ai_assisted_prompt_preparation',
          originalPrompt: 'Make the dashboard feel luxurious but still easy.',
          advisory: {
            provider: 'external_llm',
            model: 'unknown',
            userPaid: false,
            draftSummary: 'User refined a vague visual idea before CVF normalization.',
          },
        },
      },
      template,
    });

    expect(readout.entryMode).toBe('ai_assisted_prompt_preparation');
    expect(readout.advisoryOutputIsSourceOnly).toBe(true);
    expect(readout.userPaidAdvisoryUsed).toBe(false);
    expect(readout.boundaries).toContain('advisory_llm_output_is_not_implementation_authority');
    expect(readout.normalizedExecutionSpec).toContain('Advisory output is source material only');
  });

  it('records user-paid provider advisory without treating it as authorization', () => {
    const template = getTemplateById('app_requirements_spec');
    const readout = buildSpecFirstMediationReadout({
      request: {
        templateId: 'app_requirements_spec',
        templateName: 'Spec Yeu cau Ung dung',
        intent: 'Create an app requirements spec for a booking reminder app',
        inputs: {
          appName: 'Booking Reminder',
          appType: 'Web App',
          problem: 'Small clinics forget follow-up reminders.',
          targetUsers: 'Clinic staff',
          coreFeatures: 'Bookings, reminders, simple dashboard',
          outOfScope: 'No payment processing',
          successCriteria: 'Staff can create a reminder in under one minute.',
        },
        specFirst: {
          entryMode: 'user_paid_provider_advisory',
          sourceLanguage: 'en',
          outputLanguage: 'en',
          advisory: {
            provider: 'deepseek',
            model: 'deepseek-chat',
            userPaid: true,
            draftSummary: 'Advised on template choice and initial requirements.',
          },
        },
      },
      template,
      routeOutcome: {
        success: true,
        provider: 'alibaba',
        model: 'qwen-turbo',
        decision: 'ALLOW',
        receipt: { receiptId: 'rcpt-test', envelopeId: 'env-test' },
      },
    });

    expect(readout.entryMode).toBe('user_paid_provider_advisory');
    expect(readout.advisoryProvider).toBe('deepseek');
    expect(readout.advisoryModel).toBe('deepseek-chat');
    expect(readout.userPaidAdvisoryUsed).toBe(true);
    expect(readout.implementationAuthorization).toBe('route_governance_required');
    expect(readout.rawTechnicalEvidenceAvailable).toBe(true);
    expect(readout.localizedEvidenceSummary).toContain('Receipt: rcpt-test');
  });

  it('detects Vietnamese by diacritics and common Vietnamese markers', () => {
    expect(detectSpecLanguage('Tôi muốn tạo ứng dụng quản lý công việc')).toBe('vi');
    expect(detectSpecLanguage('ung dung quan ly cong viec cho khach hang')).toBe('vi');
    expect(detectSpecLanguage('Build a task manager')).toBe('en');
    expect(detectSpecLanguage('')).toBe('unknown');
  });
});
