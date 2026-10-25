// Text Encoding Exception: fixture and assertion retain Vietnamese catalog content.
import { describe, expect, it, vi } from 'vitest';
import { JevAdapterError, parseVisibleSkills, suggestJevSkill, type SkillCandidate } from './jev-capability-suggestion';

const roster: SkillCandidate[] = [
  { key: 's0', title: 'App Requirements Spec', domain: 'App Development', domainId: 'app_development', skillId: '01_app_requirements_spec', description: 'Write app requirements', detail: 'Write app requirements, scope and acceptance criteria' },
  { key: 's1', title: 'Report Writing', domain: 'Content Creation', domainId: 'content_creation', skillId: '02_report_writing', description: 'Write a report', detail: 'Write and edit a report' },
  { key: 's2', title: 'SEO Audit', domain: 'Marketing', domainId: 'marketing', skillId: '01_seo_audit', description: 'Audit site SEO', detail: 'Audit search optimization' },
];

function response(answers: Record<string, unknown>) {
  return new Response(JSON.stringify({ model: 'jev-1.13.0', answers, usage: { input_tokens: 10, output_tokens: 2 } }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
function choose(choice: string, probabilities: Record<string, number>) {
  return { type: 'choice', choice, probabilities, confidence: 0.8 };
}
const yes = (noul: number) => ({ type: 'noul', noul });

describe('TypeSafe Jev suggestion adapter', () => {
  it('only takes front-door-visible CVF skills with safe route IDs', () => {
    const result = parseVisibleSkills({ categories: [{ id: 'app_development', skills: [
      { id: '01_app_requirements_spec', title: 'App Requirements Spec', domain: 'App Development', content: '**Khi nào dùng:**\n- Lập yêu cầu ứng dụng\n\n', frontDoorVisible: true },
      { id: 'private', title: 'Private', domain: 'App Development', content: 'secret', frontDoorVisible: false },
      { id: '../other', title: 'Unsafe', domain: 'App Development', content: 'bad', frontDoorVisible: true },
    ] }] });
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('Lập yêu cầu ứng dụng');
  });

  it('uses two serial Jev calls and only returns a CVF catalog link', async () => {
    const transport = vi.fn().mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.8, s1: 0.15, s2: 0.05 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    })).mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.7, s1: 0.2, s2: 0.1 }), fits_s0: yes(0.9), fits_s1: yes(0.2), fits_s2: yes(0.1),
    }));
    const result = await suggestJevSkill('Help me plan a small app', 'test-secret', roster, transport);
    expect(result).toMatchObject({ status: 'suggested', title: 'App Requirements Spec', href: '/skills/app_development/01_app_requirements_spec', inputTokens: 20 });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][0]).toBe('https://api.typesafe.ai/v1/systemone');
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });

  it('returns no match without a second call when a skill is unnecessary', async () => {
    const transport = vi.fn().mockResolvedValue(response({
      which: choose('s1', { s0: 0.2, s1: 0.7, s2: 0.1 }), needs_workflow: yes(0.1), prose_suffices: yes(0.95),
    }));
    expect(await suggestJevSkill('Explain this concept simply', 'test-secret', roster, transport)).toMatchObject({ status: 'no_match' });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('returns no match when selected skill has low task fit', async () => {
    const transport = vi.fn().mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.6, s1: 0.3, s2: 0.1 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    })).mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.5, s1: 0.3, s2: 0.2 }), fits_s0: yes(0.1), fits_s1: yes(0.7), fits_s2: yes(0.1),
    }));
    expect(await suggestJevSkill('Post an announcement to an account', 'test-secret', roster, transport)).toMatchObject({ status: 'no_match' });
  });

  it('rejects a fabricated skill choice and never returns it', async () => {
    const transport = vi.fn().mockResolvedValue(response({
      which: choose('other', { s0: 0.6, s1: 0.3, s2: 0.1 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    }));
    await expect(suggestJevSkill('Plan an application', 'test-secret', roster, transport)).rejects.toMatchObject({ code: 'PROVIDER_RESPONSE_INVALID' });
  });

  it('sanitizes provider failures', async () => {
    const transport = vi.fn().mockResolvedValue(new Response('sensitive provider body', { status: 401 }));
    await expect(suggestJevSkill('Plan an application', 'test-secret', roster, transport)).rejects.toEqual(new JevAdapterError('PROVIDER_UNAVAILABLE'));
  });
});
