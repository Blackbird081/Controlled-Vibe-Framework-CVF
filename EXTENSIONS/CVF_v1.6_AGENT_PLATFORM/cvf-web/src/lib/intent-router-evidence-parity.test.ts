/**
 * intent-router-evidence-parity.test.ts
 * W122-T1 CP4 — Evidence Continuity Guard
 *
 * Asserts that for any seeded userInput:
 *   An intent-routed run targeting recommendedTemplateId MUST produce
 *   a parity object whose field-set diff vs. a direct handoff run is the EMPTY SET.
 *
 * Minimum parity fields (§4.3 CP4):
 *   { recommendedTemplateId, phase, riskLevel }
 *
 * The test operates entirely at the contract layer (no live API calls).
 * It proves that routing through intent-router.ts does NOT weaken the
 * governance fields that would flow into an execution request.
 *
 * W122-T1 — CP4
 */

import { describe, it, expect } from 'vitest';
import { detectIntent } from './intent-detector';
import {
  resolveGovernedStarterTemplate,
  buildGovernedStarterHandoff,
  type QuickStartResult,
} from './governed-starter-path';
import { routeIntent } from './intent-router';

interface ParityObject {
  recommendedTemplateId: string;
  phase: string;
  riskLevel: string;
}

function buildDirectHandoff(userInput: string): ParityObject {
  const detected = detectIntent(userInput);
  const result: QuickStartResult = {
    provider: 'alibaba',
    apiKey: '',
    userInput,
    detectedIntent: detected,
  };
  const handoff = buildGovernedStarterHandoff(result);
  return {
    recommendedTemplateId: handoff.recommendedTemplateId,
    phase: handoff.phase,
    riskLevel: handoff.riskLevel,
  };
}

function buildRoutedHandoff(userInput: string): ParityObject {
  process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = 'true';
  const routed = routeIntent(userInput)!;
  // Parity is only defined for strong-detection inputs (W122 §8.A4);
  // fixtures must be chosen so routed has a non-null target.
  if (routed.recommendedTemplateId === null) {
    throw new Error(`Parity fixture is weak (no routed target) — input must trigger strong detection: "${userInput}"`);
  }
  return {
    recommendedTemplateId: routed.recommendedTemplateId,
    phase: routed.phase,
    riskLevel: routed.riskLevel,
  };
}

function assertParityFieldsetDiffIsEmpty(a: ParityObject, b: ParityObject) {
  const keysA = Object.keys(a) as (keyof ParityObject)[];
  const keysB = Object.keys(b) as (keyof ParityObject)[];
  expect(keysA.sort()).toEqual(keysB.sort());
  for (const key of keysA) {
    expect(a[key]).toBe(b[key]);
  }
}

// Parity fixtures MUST trigger strong detection (suggestedTemplates non-empty).
// Weak inputs are excluded — the W122 §8.A4 contract requires routed = null on
// weak confidence, so weak inputs would intentionally diverge from the legacy
// direct-handoff default. Only strong inputs exercise meaningful parity.
const PARITY_FIXTURES: Array<{ label: string; input: string }> = [
  { label: 'VN app/build intent', input: 'Tôi muốn xây dựng app quản lý kho hàng' },
  { label: 'EN content intent', input: 'write blog content for the onboarding process' },
  { label: 'VN security/review intent', input: 'kiểm tra bảo mật cho web app của tôi' },
  { label: 'EN data analysis intent', input: 'analyze sales data and build a dashboard with metrics' },
  { label: 'VN marketing intent', input: 'lên chiến dịch marketing cho ra mắt sản phẩm mới' },
];

describe('intent-router-evidence-parity (CP4)', () => {
  for (const fixture of PARITY_FIXTURES) {
    it(`field-set diff is empty for: "${fixture.label}"`, () => {
      const direct = buildDirectHandoff(fixture.input);
      const routed = buildRoutedHandoff(fixture.input);
      assertParityFieldsetDiffIsEmpty(direct, routed);
    });
  }

  it('recommendedTemplateId parity: routed and direct resolve same wizard target for app intent', () => {
    // Strong-detection input — uses 'app' (ASCII) so TEMPLATE_PATTERNS matches reliably.
    const input = 'Tôi muốn tạo app mobile';
    const direct = buildDirectHandoff(input);
    const routed = buildRoutedHandoff(input);
    expect(routed.recommendedTemplateId).toBe(direct.recommendedTemplateId);
    expect(routed.recommendedTemplateId).toMatch(/_wizard$/);
  });

  it('riskLevel parity: routed and direct return same risk classification', () => {
    const inputs = [
      'Tôi muốn xây dựng app mobile',
      'kiểm tra bảo mật hệ thống',
      'analyze marketing strategy',
    ];
    for (const input of inputs) {
      const direct = buildDirectHandoff(input);
      const routed = buildRoutedHandoff(input);
      expect(routed.riskLevel).toBe(direct.riskLevel);
    }
  });

  it('phase parity: routed and direct return same phase classification', () => {
    const inputs = [
      'build a system architecture for microservices',
      'thiết kế sản phẩm UX cho mobile app',
      'nghiên cứu thị trường cho startup SaaS',
    ];
    for (const input of inputs) {
      const direct = buildDirectHandoff(input);
      const routed = buildRoutedHandoff(input);
      expect(routed.phase).toBe(direct.phase);
    }
  });

  it('governance evidence field-set is a superset of direct handoff field-set', () => {
    // Strong-detection input — uses 'app' (ASCII) so TEMPLATE_PATTERNS matches reliably.
    const input = 'Tôi muốn xây dựng app quản lý công việc';
    process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = 'true';
    const routed = routeIntent(input)!;
    const direct = buildDirectHandoff(input);

    const parityFields: (keyof typeof direct)[] = ['recommendedTemplateId', 'phase', 'riskLevel'];
    for (const field of parityFields) {
      expect(routed).toHaveProperty(field);
    }

    expect(routed.recommendedTemplateId).toBe(direct.recommendedTemplateId);
    expect(routed.phase).toBe(direct.phase);
    expect(routed.riskLevel).toBe(direct.riskLevel);
  });

  it('resolveGovernedStarterTemplate produces same id as routeIntent for each wizard starter key', () => {
    const starterKeys = [
      { key: 'app-builder', inputs: ['build an app', 'ứng dụng mobile'] },
      { key: 'security-assessment', inputs: ['security audit', 'kiểm tra bảo mật'] },
      { key: 'data-analysis', inputs: ['data analytics dashboard', 'phân tích dữ liệu'] },
    ];

    process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = 'true';

    for (const { key, inputs } of starterKeys) {
      for (const input of inputs) {
        const detected = detectIntent(input);
        if (detected.suggestedTemplates[0] === key) {
          const resolved = resolveGovernedStarterTemplate([key]);
          const routed = routeIntent(input)!;
          expect(routed.recommendedTemplateId).toBe(resolved.id);
        }
      }
    }
  });
});
