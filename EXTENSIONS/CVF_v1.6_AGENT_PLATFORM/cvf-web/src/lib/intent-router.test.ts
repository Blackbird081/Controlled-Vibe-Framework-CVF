/**
 * intent-router.test.ts
 * W122-T1 CP1 — Router contract unit tests
 *
 * Tests:
 *   1. Feature flag off → routeIntent returns null
 *   2. Feature flag on + VN app intent → strong confidence, wizard target
 *   3. Feature flag on + EN docs intent → strong confidence, wizard target
 *   4. Feature flag on + VN review intent → strong confidence, review wizard
 *   5. Empty input → weak confidence + empty_input fallback
 *   6. Non-VN/EN input → weak confidence + unsupported_language fallback
 *   7. Low-confidence vague input → weak_confidence fallback path
 *   8. starterKey must exist in STARTER_TEMPLATE_MAP
 *   9. recommendedTemplateId must be a wizard id (ends with _wizard)
 *  10. isIntentFirstEnabled() reflects flag value
 *  11. routeIntent output has intentRoutedAt ISO timestamp
 *  12. Bilingual: same concept in VN and EN routes to same starterKey family
 */

import { describe, it, expect } from 'vitest';
import { routeIntent, isIntentFirstEnabled } from './intent-router';

const STARTER_TEMPLATE_MAP_KEYS = [
  'app-builder',
  'business-strategy',
  'marketing-campaign',
  'content-strategy',
  'data-analysis',
  'system-design',
  'security-assessment',
  'product-design',
  'research-project',
];

const WIZARD_ID_SUFFIX = '_wizard';

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

describe('intent-router', () => {
  it('1. flag off → routeIntent returns null', () => {
    withFlag('false', () => {
      expect(routeIntent('Tôi muốn tạo ứng dụng quản lý công việc')).toBeNull();
    });
  });

  it('2. flag on + VN app intent → strong confidence + wizard target', () => {
    withFlag('true', () => {
      const result = routeIntent('Tôi muốn tạo mobile app quản lý công việc');
      expect(result).not.toBeNull();
      expect(result!.confidence).toBe('strong');
      expect(result!.starterKey).toBe('app-builder');
      expect(result!.recommendedTemplateId).toBe('app_builder_wizard');
      expect(result!.fallback).toBeNull();
    });
  });

  it('3. flag on + EN content/blog intent → strong confidence + wizard target', () => {
    withFlag('true', () => {
      const result = routeIntent('write a content strategy for my blog');
      expect(result).not.toBeNull();
      expect(result!.confidence).toBe('strong');
      expect(result!.recommendedTemplateId).toContain(WIZARD_ID_SUFFIX);
      expect(STARTER_TEMPLATE_MAP_KEYS).toContain(result!.starterKey);
    });
  });

  it('4. flag on + VN review/analysis intent → routes to a wizard', () => {
    withFlag('true', () => {
      const result = routeIntent('kiểm tra bảo mật cho ứng dụng web của tôi');
      expect(result).not.toBeNull();
      expect(result!.recommendedTemplateId).toContain(WIZARD_ID_SUFFIX);
      expect(STARTER_TEMPLATE_MAP_KEYS).toContain(result!.starterKey);
    });
  });

  it('5. empty input → weak confidence + empty_input fallback + NO routed target', () => {
    withFlag('true', () => {
      const result = routeIntent('');
      expect(result).not.toBeNull();
      expect(result!.confidence).toBe('weak');
      expect(result!.fallback).not.toBeNull();
      expect(result!.fallback!.reason).toBe('empty_input');
      // §8.A4 hard contract: weak confidence MUST NOT guess a wizard target
      expect(result!.recommendedTemplateId).toBeNull();
      expect(result!.recommendedTemplateLabel).toBeNull();
      expect(result!.starterKey).toBeNull();
    });
  });

  it('6. non-VN/non-EN input (Chinese) → weak confidence + unsupported_language fallback + NO routed target', () => {
    withFlag('true', () => {
      const result = routeIntent('我想要创建一个任务管理应用');
      expect(result).not.toBeNull();
      expect(result!.confidence).toBe('weak');
      expect(result!.fallback!.reason).toBe('unsupported_language');
      // §8.A4 hard contract
      expect(result!.recommendedTemplateId).toBeNull();
      expect(result!.recommendedTemplateLabel).toBeNull();
      expect(result!.starterKey).toBeNull();
    });
  });

  it('7. vague low-confidence input → weak_confidence fallback + NO routed target', () => {
    withFlag('true', () => {
      const result = routeIntent('hello help me');
      expect(result).not.toBeNull();
      expect(result!.confidence).toBe('weak');
      expect(result!.fallback).not.toBeNull();
      expect(result!.fallback!.reason).toBe('weak_confidence');
      // §8.A4 hard contract
      expect(result!.recommendedTemplateId).toBeNull();
      expect(result!.recommendedTemplateLabel).toBeNull();
      expect(result!.starterKey).toBeNull();
    });
  });

  it('8. starterKey is always in STARTER_TEMPLATE_MAP', () => {
    withFlag('true', () => {
      const inputs = [
        'Tôi muốn xây dựng chiến lược kinh doanh',
        'build a marketing campaign',
        'phân tích dữ liệu bán hàng',
        'system architecture for microservices',
      ];
      for (const input of inputs) {
        const result = routeIntent(input);
        expect(STARTER_TEMPLATE_MAP_KEYS).toContain(result!.starterKey);
      }
    });
  });

  it('9. recommendedTemplateId always ends with _wizard', () => {
    withFlag('true', () => {
      const inputs = [
        'Tôi muốn tạo app',
        'write a research paper',
        'design a new product',
        'security audit for our platform',
      ];
      for (const input of inputs) {
        const result = routeIntent(input);
        expect(result!.recommendedTemplateId).toMatch(/_wizard$/);
      }
    });
  });

  it('10. isIntentFirstEnabled() reflects flag', () => {
    withFlag('true', () => expect(isIntentFirstEnabled()).toBe(true));
    withFlag('false', () => expect(isIntentFirstEnabled()).toBe(false));
  });

  it('11. result has valid ISO intentRoutedAt timestamp', () => {
    withFlag('true', () => {
      const result = routeIntent('Tôi muốn tạo ứng dụng');
      expect(result!.intentRoutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(result!.intentRoutedAt)).not.toThrow();
    });
  });

  it('12. bilingual: VN and EN app intents route to same starterKey family', () => {
    withFlag('true', () => {
      const vn = routeIntent('Tôi muốn tạo ứng dụng mobile');
      const en = routeIntent('I want to build a mobile application');
      expect(vn!.starterKey).toBe(en!.starterKey);
    });
  });
});
