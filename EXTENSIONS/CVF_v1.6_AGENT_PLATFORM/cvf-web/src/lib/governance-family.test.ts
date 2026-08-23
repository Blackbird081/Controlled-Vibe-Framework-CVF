import { describe, expect, it } from 'vitest';
import { GOVERNANCE_FAMILIES, resolveGovernanceFamily } from './governance-family';

describe('resolveGovernanceFamily', () => {
  it('accepts every declared family as supplied metadata', () => {
    expect(GOVERNANCE_FAMILIES).toHaveLength(8);
    for (const family of GOVERNANCE_FAMILIES) {
      expect(resolveGovernanceFamily({ qbsFamily: family })).toBe(family);
    }
  });

  it('maps trusted templates and bounded intents', () => {
    expect(resolveGovernanceFamily({ templateId: 'app_builder_complete' })).toBe('normal_productivity_app_planning');
    expect(resolveGovernanceFamily({ templateId: 'api_design' })).toBe('builder_handoff_technical_planning');
    expect(resolveGovernanceFamily({ templateId: 'pricing_strategy' })).toBe('cost_quota_provider_selection');
    expect(resolveGovernanceFamily({ intent: 'Compare provider options, cost, quota, model lane, and latency.' })).toBe('cost_quota_provider_selection');
  });

  it('returns null without a confident scoped mapping', () => {
    expect(resolveGovernanceFamily({ templateId: 'email_campaign', intent: 'Write a harmless newsletter draft.' })).toBeNull();
  });
});
