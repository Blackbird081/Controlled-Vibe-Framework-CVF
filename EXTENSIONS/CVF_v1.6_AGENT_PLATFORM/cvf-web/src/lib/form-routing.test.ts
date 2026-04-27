/**
 * form-routing.test.ts
 * W126-T1 CP4 — Trusted form routing coverage evidence
 *
 * Tests:
 *   1.  routeToTrustedForm returns null for no-match input
 *   2.  email_template activated by EN input
 *   3.  email_template activated by VN input
 *   4.  documentation activated by EN input
 *   5.  documentation activated by VN input
 *   6.  competitor_review activated by EN input
 *   7.  competitor_review activated by VN input
 *   8.  risk_assessment activated by EN input
 *   9.  risk_assessment activated by VN input
 *   10. user_persona activated by EN input
 *   11. user_persona activated by VN input
 *   12. feature_prioritization activated by EN input
 *   13. feature_prioritization activated by VN input
 *   14. pricing_strategy activated by EN input
 *   15. pricing_strategy activated by VN input
 *   16. strategy_analysis activated by EN input
 *   17. strategy_analysis activated by VN input
 *   18. wizard-overlap input does NOT activate form routing (precedence contract)
 *   19. routeIntent returns routeType 'form' for trusted form match
 *   20. routeIntent returns routeType 'wizard' for wizard-family match
 *   21. routeIntent returns routeType null for weak-confidence input
 *   22. form route has strong confidence
 *   23. form route has starterKey null
 *   24. form route has non-null recommendedTemplateId and recommendedTemplateLabel
 *   25. TRUSTED_FORM_MAP has exactly 8 entries
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
  it('25. TRUSTED_FORM_MAP has exactly 8 entries', () => {
    expect(Object.keys(TRUSTED_FORM_MAP)).toHaveLength(8);
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
  it('1. returns null for no-match input', () => {
    expect(routeToTrustedForm('hello world this is vague')).toBeNull();
    expect(routeToTrustedForm('')).toBeNull();
  });

  it('2. email_template — EN activation', () => {
    const match = routeToTrustedForm('draft an email to my client');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('email_template');
  });

  it('3. email_template — VN activation', () => {
    const match = routeToTrustedForm('viết email cho khách hàng');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('email_template');
  });

  it('4. documentation — EN activation', () => {
    const match = routeToTrustedForm('document this process for the team');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('documentation');
  });

  it('5. documentation — VN activation', () => {
    const match = routeToTrustedForm('viết tài liệu quy trình onboarding');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('documentation');
  });

  it('6. competitor_review — EN activation', () => {
    const match = routeToTrustedForm('analyze my competitors in the market');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('competitor_review');
  });

  it('7. competitor_review — VN activation', () => {
    const match = routeToTrustedForm('phân tích đối thủ cạnh tranh của tôi');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('competitor_review');
  });

  it('8. risk_assessment — EN activation', () => {
    const match = routeToTrustedForm('identify the risks for this project launch');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('risk_assessment');
  });

  it('9. risk_assessment — VN activation', () => {
    const match = routeToTrustedForm('đánh giá rủi ro cho kế hoạch mở rộng');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('risk_assessment');
  });

  it('10. user_persona — EN activation', () => {
    const match = routeToTrustedForm('create a user persona for my target audience');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('user_persona');
  });

  it('11. user_persona — VN activation', () => {
    const match = routeToTrustedForm('xác định người dùng mục tiêu và buyer persona');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('user_persona');
  });

  it('12. feature_prioritization — EN activation', () => {
    const match = routeToTrustedForm('help me prioritize features for the next sprint');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('feature_prioritization');
  });

  it('13. feature_prioritization — VN activation', () => {
    const match = routeToTrustedForm('ưu tiên tính năng nào cần làm trước');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('feature_prioritization');
  });

  it('14. pricing_strategy — EN activation', () => {
    const match = routeToTrustedForm('help me define a pricing model for my consulting service');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('pricing_strategy');
  });

  it('15. pricing_strategy — VN activation', () => {
    const match = routeToTrustedForm('chiến lược giá cho sản phẩm mới');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('pricing_strategy');
  });

  it('16. strategy_analysis — EN activation', () => {
    const match = routeToTrustedForm('analyze this strategy for entering a new market');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('strategy_analysis');
  });

  it('17. strategy_analysis — VN activation', () => {
    const match = routeToTrustedForm('phân tích chiến lược mở rộng thị trường');
    expect(match).not.toBeNull();
    expect(match!.id).toBe('strategy_analysis');
  });
});

describe('form-routing — routeToTrustedForm does not fire when wizard should win', () => {
  it('18. wizard-domain input returns null from routeToTrustedForm (wizard handles it)', () => {
    // "build an app" → app-builder wizard should win; form routing sees null
    // (In full routing, wizard fires first via detectIntent — this test proves
    //  form routing doesn't duplicate wizard activation)
    expect(routeToTrustedForm('I want to build a mobile app')).toBeNull();
    expect(routeToTrustedForm('create a marketing campaign for my brand')).toBeNull();
    expect(routeToTrustedForm('design a system architecture')).toBeNull();
    expect(routeToTrustedForm('conduct a security assessment')).toBeNull();
  });
});

describe('form-routing — routeIntent integration (W126 precedence)', () => {
  it('19. routeIntent returns routeType form for trusted form input', () => {
    withFlag('true', () => {
      const result = routeIntent('draft an email to my client about the new proposal');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.recommendedTemplateId).toBe('email_template');
      expect(result!.confidence).toBe('strong');
    });
  });

  it('20. routeIntent returns routeType wizard for wizard-family input', () => {
    withFlag('true', () => {
      const result = routeIntent('I want to build a mobile app for task management');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('wizard');
      expect(result!.starterKey).toBe('app-builder');
    });
  });

  it('21. routeIntent returns routeType null for weak-confidence input', () => {
    withFlag('true', () => {
      const result = routeIntent('something vague and unspecific here');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBeNull();
      expect(result!.confidence).toBe('weak');
    });
  });

  it('22. form route has strong confidence', () => {
    withFlag('true', () => {
      const result = routeIntent('identify the risks for this project launch');
      expect(result!.confidence).toBe('strong');
    });
  });

  it('23. form route has starterKey null', () => {
    withFlag('true', () => {
      const result = routeIntent('analyze my competitors in the SaaS space');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.starterKey).toBeNull();
    });
  });

  it('24. form route has non-null recommendedTemplateId and recommendedTemplateLabel', () => {
    withFlag('true', () => {
      const result = routeIntent('help me define a pricing model for my consulting service');
      expect(result).not.toBeNull();
      expect(result!.routeType).toBe('form');
      expect(result!.recommendedTemplateId).toBeTruthy();
      expect(result!.recommendedTemplateLabel).toBeTruthy();
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
