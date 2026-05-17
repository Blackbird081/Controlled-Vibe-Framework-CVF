/**
 * form-routing.test.ts
 * W151-T1 — Router and intent-router integration coverage.
 *
 * Corpus activation coverage lives in trusted-form-corpus.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { routeToTrustedForm, TRUSTED_FORM_MAP, isTrustedFormRoutingEnabled } from './form-routing';
import { routeIntent } from './intent-router';

function withFlag(value: 'true' | 'false', fn: () => void) {
  const original = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR;
  process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = value;
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR;
    } else {
      process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = original;
    }
  }
}

describe('form-routing — TRUSTED_FORM_MAP integrity', () => {
  it('has exactly 44 entries', () => {
    expect(Object.keys(TRUSTED_FORM_MAP)).toHaveLength(44);
  });

  it('all entries have id, label, and at least one activationPattern', () => {
    for (const [key, entry] of Object.entries(TRUSTED_FORM_MAP)) {
      expect(entry.id, `${key}.id`).toBeTruthy();
      expect(entry.label, `${key}.label`).toBeTruthy();
      expect(entry.activationPatterns.length, `${key} activationPatterns`).toBeGreaterThan(0);
      expect(entry.wizardWinsWhen, `${key}.wizardWinsWhen`).toBeTruthy();
    }
  });
});

describe('form-routing — routeToTrustedForm unit', () => {
  it('returns null for no-match input', () => {
    expect(routeToTrustedForm('hello world this is vague')).toBeNull();
    expect(routeToTrustedForm('')).toBeNull();
  });
});

describe('form-routing — routeToTrustedForm does not fire when wizard should win', () => {
  it('wizard-domain input returns null from routeToTrustedForm', () => {
    expect(routeToTrustedForm('I want to build a mobile app')).toBeNull();
    expect(routeToTrustedForm('create a marketing campaign for my brand')).toBeNull();
    expect(routeToTrustedForm('help me build a full business strategy')).toBeNull();
    expect(routeToTrustedForm('conduct a security assessment')).toBeNull();
  });
});

describe('form-routing — routeIntent integration (W126 precedence)', () => {
  it('routeIntent returns routeType form for trusted form input', () => {
    withFlag('true', () => {
      const result = routeIntent('draft an email to my client about the new proposal');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.recommendedTemplateId).toBe('email_template');
      expect(result!.confidence).toBe('strong');
    });
  });

  it('routeIntent returns routeType wizard for wizard-family input', () => {
    withFlag('true', () => {
      const result = routeIntent('I want to build a mobile app for task management');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('wizard');
      expect(result!.starterKey).toBe('app-builder');
    });
  });

  it('routeIntent returns routeType null for weak-confidence input', () => {
    withFlag('true', () => {
      const result = routeIntent('something vague and unspecific here');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBeNull();
      expect(result!.confidence).toBe('weak');
    });
  });

  it('form route has strong confidence', () => {
    withFlag('true', () => {
      const result = routeIntent('identify the risks for this project launch');
      expect(result!.confidence).toBe('strong');
    });
  });

  it('form route has starterKey null', () => {
    withFlag('true', () => {
      const result = routeIntent('analyze my competitors in the SaaS space');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.starterKey).toBeNull();
    });
  });

  it('form route has non-null recommendedTemplateId and recommendedTemplateLabel', () => {
    withFlag('true', () => {
      const result = routeIntent('help me define a pricing model for my consulting service');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.recommendedTemplateId).toBeTruthy();
      expect(result!.recommendedTemplateLabel).toBeTruthy();
    });
  });

  it('W140 Alibaba matrix prompts route to trusted forms, not wizards', () => {
    withFlag('true', () => {
      const prompts = [
        ['Viết tài liệu hướng dẫn sử dụng cho nhân viên mới', 'documentation'],
        ['Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng', 'email_template'],
        ['Đánh giá rủi ro cho dự án triển khai phần mềm quản lý kho tại doanh nghiệp', 'risk_assessment'],
        ['Phân tích đối thủ cạnh tranh trong lĩnh vực dịch vụ logistics', 'competitor_review'],
        ['Xây dựng hồ sơ khách hàng mục tiêu cho ứng dụng quản lý tài chính cá nhân', 'user_persona'],
        ['Phân tích chiến lược mở rộng sang thị trường miền Trung Việt Nam', 'strategy_analysis'],
        ['Lập danh sách ưu tiên tính năng cho phiên bản tiếp theo của sản phẩm SaaS', 'feature_prioritization'],
        ['Xây dựng chiến lược định giá cho sản phẩm SaaS B2B trong thị trường SME', 'pricing_strategy'],
        ['Tạo tài liệu kỹ thuật cho API tích hợp hệ thống thanh toán', 'documentation'],
        ['Tạo FAQ cho luồng thanh toán khóa học online', 'faq_outline'],
        ['Viết acceptance criteria cho dashboard doanh thu tuần', 'acceptance_criteria'],
        ['Viết email xác nhận lịch hẹn với đối tác kinh doanh', 'email_template'],
        ['Phân tích rủi ro khi mở rộng kinh doanh sang thị trường Đông Nam Á', 'risk_assessment'],
        ['Đánh giá cơ hội và thách thức khi ra mắt sản phẩm mới cho phân khúc doanh nghiệp lớn', 'strategy_analysis'],
        ['Create a 30-day operations plan for a tutoring marketplace launch', 'operator_plan'],
        ['Compare content marketing partnerships and paid ads for a newsletter', 'decision_memo'],
      ] as const;

      for (const [input, expectedTemplateId] of prompts) {
        const result = routeIntent(input);
        expect(result?.routeType, input).toBe('form');
        expect(result?.recommendedTemplateId, input).toBe(expectedTemplateId);
      }
    });
  });
});

describe('form-routing — isTrustedFormRoutingEnabled', () => {
  it('returns true when flag is true', () => {
    withFlag('true', () => {
      expect(isTrustedFormRoutingEnabled()).toBe(true);
    });
  });

  it('returns false when flag is not set', () => {
    const original = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR;
    delete process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR;
    expect(isTrustedFormRoutingEnabled()).toBe(false);
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = original;
    }
  });
});
