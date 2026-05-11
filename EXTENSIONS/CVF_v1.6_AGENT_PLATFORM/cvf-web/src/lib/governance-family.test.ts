import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveGovernanceFamily } from './governance-family';

type QbsTask = {
  task_id: string;
  family: string;
  risk_class: string;
  user_prompt: string;
};

type QbsCorpus = {
  tasks: QbsTask[];
};

function readQbsCorpus(): QbsCorpus {
  const corpusPath = path.resolve(
    process.cwd(),
    '../../../docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json',
  );
  return JSON.parse(fs.readFileSync(corpusPath, 'utf-8')) as QbsCorpus;
}

describe('resolveGovernanceFamily', () => {
  it('accepts every QBS corpus family as benchmark-supplied metadata', () => {
    const corpus = readQbsCorpus();

    expect(corpus.tasks).toHaveLength(48);
    for (const task of corpus.tasks) {
      expect(
        resolveGovernanceFamily({
          qbsFamily: task.family,
          intent: task.user_prompt,
          riskLevel: task.risk_class,
        }),
        task.task_id,
      ).toBe(task.family);
    }
  });

  it('maps trusted app planning templates into the normal productivity family', () => {
    expect(resolveGovernanceFamily({ templateId: 'app_builder_complete' })).toBe('normal_productivity_app_planning');
    expect(resolveGovernanceFamily({ templateId: 'feature_prioritization' })).toBe('normal_productivity_app_planning');
    expect(resolveGovernanceFamily({ templateId: 'user_persona' })).toBe('normal_productivity_app_planning');
  });

  it('maps technical handoff templates into the builder handoff family', () => {
    expect(resolveGovernanceFamily({ templateId: 'api_design' })).toBe('builder_handoff_technical_planning');
    expect(resolveGovernanceFamily({ templateId: 'architecture_design' })).toBe('builder_handoff_technical_planning');
    expect(resolveGovernanceFamily({ templateId: 'code_review' })).toBe('builder_handoff_technical_planning');
  });

  it('maps provider and cost intents into the cost quota family', () => {
    expect(resolveGovernanceFamily({ templateId: 'pricing_strategy' })).toBe('cost_quota_provider_selection');
    expect(resolveGovernanceFamily({
      intent: 'Compare provider options, cost, quota, model lane, and latency for a small live AI experiment.',
    })).toBe('cost_quota_provider_selection');
  });

  it('returns null when no confident scoped family mapping exists', () => {
    expect(resolveGovernanceFamily({ templateId: 'email_campaign', intent: 'Write a harmless newsletter draft.' })).toBeNull();
  });
});
