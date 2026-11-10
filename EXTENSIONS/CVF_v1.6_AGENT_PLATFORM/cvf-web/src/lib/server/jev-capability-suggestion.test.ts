// Text Encoding Exception: fixture and assertion retain Vietnamese catalog content.
import { describe, expect, it, vi } from 'vitest';
import { JevAdapterError, parseVisibleSkills, suggestJevSkill, createJevNativeAdapter, validateJevNativeStage, jevReportedUsdMicrounits, type JevStageExecutor, type JevNativeStageV1, type SkillCandidate } from './jev-capability-suggestion';

import { CredentialBoundary } from 'cvf-model-gateway';
import { jevDigest, jevStageKey, JEV_RECIPE_REVISION } from './jev-suggestion-custody';

function executor(transport:typeof fetch):JevStageExecutor {
  let expected:JevNativeStageV1;
  const adapter=createJevNativeAdapter({credential:new CredentialBoundary({TYPESAFE_API_KEY:'test-secret'}),reference:{providerId:'typesafe',keyId:'synthetic',envNames:['TYPESAFE_API_KEY']},reportedModels:['jev-1.13.0'],transport,expectedStage:()=>expected});
  return async(stageId,body)=>{expected={schema:'cvf.jevNativeStage.v1',method:'system_one',stageId,runId:'11111111-1111-4111-8111-111111111111',canonicalExecutionId:'env-native-fixture',stageExecutionKey:jevStageKey('11111111-1111-4111-8111-111111111111','env-native-fixture',stageId),inputDigest:jevDigest(body.state.request),rosterDigest:jevDigest('roster'),recipeRevision:JEV_RECIPE_REVISION,...body};return JSON.parse((await adapter.execute({traceId:expected.canonicalExecutionId,providerId:'typesafe',modelId:'jev-latest',prompt:JSON.stringify(expected)})).text);};
}

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
      { id: '01_app_requirements_spec', title: 'App Requirements Spec', domain: 'App Development', content: '## 🎯 Mục đích\n\n**Khi nào dùng:**\n- Lập yêu cầu ứng dụng\n\n', frontDoorVisible: true, allowedRoles: 'User, Reviewer' },
      { id: 'private', title: 'Private', domain: 'App Development', content: 'secret', frontDoorVisible: false, allowedRoles: 'User' },
      { id: '../other', title: 'Unsafe', domain: 'App Development', content: 'bad', frontDoorVisible: true, allowedRoles: 'User' },
    ] }] });
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('Lập yêu cầu ứng dụng');
  });

  it('reads the catalog purpose section across label spellings and CRLF', () => {
    const skill = (id: string, content: string) => ({ id, title: id, domain: 'Domain', content, frontDoorVisible: true, allowedRoles: 'User, Reviewer' });
    const result = parseVisibleSkills({ categories: [{ id: 'catalog', skills: [
      skill('variant_label', '# T\r\n\r\n## 🎯 Mục đích\r\n\r\n**Khi nào dùng skill này:**\r\n- Review pull requests\r\n- Tìm bugs\r\n\r\n**Không phù hợp khi:**\r\n- Review kiến trúc hệ thống → Architecture Review\r\n\r\n---\r\n\r\n## Khác\r\nkhông lấy'),
      skill('lead_and_when', '## 🎯 Mục đích\n\nĐánh giá website về SEO.\n\n**Khi nào nên dùng:**\n- Trước khi launch\n\n---\n'),
      skill('english_label', '## 🎯 Mục đích\n\n**When to use this skill:**\n- Starting any new project\n\n**Not suitable when:**\n- Project is mid-way\n'),
      skill('quoted_lead', '## Mục đích / Purpose\n\n> Write and update a business plan.\n\n## Next\n'),
      skill('no_section', '**Khi nào dùng:** nằm ngoài mục đích'),
    ] }] });
    const by = Object.fromEntries(result.map(s => [s.skillId, s]));
    expect(by.variant_label.description).toBe('variant_label (Domain). Khi nào dùng: Review pull requests; Tìm bugs');
    expect(by.variant_label.detail).toContain('Không phù hợp khi: Review kiến trúc hệ thống → Architecture Review');
    expect(by.variant_label.description).not.toContain('không lấy');
    expect(by.lead_and_when.description).toBe('lead_and_when (Domain). Đánh giá website về SEO. Khi nào dùng: Trước khi launch');
    expect(by.english_label.description).toContain('Khi nào dùng: Starting any new project');
    expect(by.english_label.detail).toContain('Không phù hợp khi: Project is mid-way');
    expect(by.quoted_lead.description).toBe('quoted_lead (Domain). Write and update a business plan.');
    expect(by.no_section.description).toBe('no_section (Domain). ');
  });

  it('suggests only skills declared for the end-user role', () => {
    const result = parseVisibleSkills({ categories: [
      { id: 'agent_system_skills', skills: [{ id: 'dispatch_reviewer', title: 'Dispatch', domain: 'Agent', content: 'x', frontDoorVisible: true, allowedRoles: 'dispatcher, worker, reviewer' }] },
      { id: 'catalog', skills: [
        { id: 'user_skill', title: 'User', domain: 'D', content: 'x', frontDoorVisible: true, allowedRoles: ['User', 'Reviewer'] },
        { id: 'no_roles', title: 'Unknown', domain: 'D', content: 'x', frontDoorVisible: true },
      ] },
    ] });
    expect(result.map(s => `${s.domainId}/${s.skillId}`)).toEqual(['catalog/user_skill']);
  });

  it('uses two serial Jev calls and only returns a CVF catalog link', async () => {
    const transport = vi.fn().mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.8, s1: 0.15, s2: 0.05 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    })).mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.7, s1: 0.2, s2: 0.1 }), fits_s0: yes(0.9), fits_s1: yes(0.2), fits_s2: yes(0.1),
    }));
    const result = await suggestJevSkill('Help me plan a small app', roster, executor(transport));
    expect(result).toMatchObject({ status: 'suggested', title: 'App Requirements Spec', href: '/skills/app_development/01_app_requirements_spec', inputTokens: 20 });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][0]).toBe('https://api.typesafe.ai/v1/systemone');
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });

  it('returns no match without a second call when a skill is unnecessary', async () => {
    const transport = vi.fn().mockResolvedValue(response({
      which: choose('s1', { s0: 0.2, s1: 0.7, s2: 0.1 }), needs_workflow: yes(0.1), prose_suffices: yes(0.95),
    }));
    expect(await suggestJevSkill('Explain this concept simply', roster, executor(transport))).toMatchObject({ status: 'no_match' });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('returns no match when selected skill has low task fit', async () => {
    const transport = vi.fn().mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.6, s1: 0.3, s2: 0.1 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    })).mockResolvedValueOnce(response({
      which: choose('s0', { s0: 0.5, s1: 0.3, s2: 0.2 }), fits_s0: yes(0.1), fits_s1: yes(0.7), fits_s2: yes(0.1),
    }));
    expect(await suggestJevSkill('Post an announcement to an account', roster, executor(transport))).toMatchObject({ status: 'no_match' });
  });

  it('rejects a fabricated skill choice and never returns it', async () => {
    const transport = vi.fn().mockResolvedValue(response({
      which: choose('other', { s0: 0.6, s1: 0.3, s2: 0.1 }), needs_workflow: yes(0.9), prose_suffices: yes(0.1),
    }));
    await expect(suggestJevSkill('Plan an application', roster, executor(transport))).rejects.toMatchObject({ code: 'PROVIDER_RESPONSE_INVALID' });
  });

  it('sanitizes provider failures', async () => {
    const transport = vi.fn().mockResolvedValue(new Response('sensitive provider body', { status: 401 }));
    await expect(suggestJevSkill('Plan an application', roster, executor(transport))).rejects.toEqual(new JevAdapterError('PROVIDER_UNAVAILABLE'));
  });
});


it('rejects an oversized streamed response and has no hidden retry',async()=>{
  const transport=vi.fn(async()=>new Response('x'.repeat(128001)));
  await expect(suggestJevSkill('Plan an application',roster,executor(transport))).rejects.toThrow('PROVIDER_RESPONSE_INVALID');expect(transport).toHaveBeenCalledTimes(1);
});
it('rejects malformed encoding, nonfinite probabilities and reported model substitution before narrow',async()=>{
  for(const payload of [new Response(new Uint8Array([255,254])),new Response(JSON.stringify({model:'other-model',answers:{}})),response({which:choose('s0',{s0:2,s1:0,s2:0}),needs_workflow:yes(1),prose_suffices:yes(0)})]){
    const transport=vi.fn(async()=>payload);await expect(suggestJevSkill('Plan an application',roster,executor(transport))).rejects.toThrow('PROVIDER_RESPONSE_INVALID');expect(transport).toHaveBeenCalledTimes(1);
  }
});
it('rejects arbitrary stage carrier fields before any credential runtime resolution',async()=>{
  expect(()=>validateJevNativeStage({schema:'cvf.jevNativeStage.v1',endpoint:'https://untrusted'})).toThrow();
  const credential=new CredentialBoundary({TYPESAFE_API_KEY:'synthetic'});const resolve=vi.spyOn(credential,'resolveSecretForRuntime');const transport=vi.fn();
  const adapter=createJevNativeAdapter({credential,reference:{providerId:'typesafe',keyId:'synthetic',envNames:['TYPESAFE_API_KEY']},expectedStage:()=>undefined,reportedModels:['jev-fixture'],transport});
  await expect(adapter.execute({providerId:'typesafe',modelId:'jev-latest',traceId:'env-x',prompt:'{}'})).rejects.toThrow();expect(resolve).not.toHaveBeenCalled();expect(transport).not.toHaveBeenCalled();
});


describe('OpenRouter System One offline boundary', () => {
  it('requires a fixed v2 tuple and rejects redirects at the transport', async () => {
    const goal='Plan a small application'; const runId='11111111-1111-4111-8111-111111111111';
    const stage={schema:'cvf.jevNativeStage.v2' as const,transport:'openrouter-systemone' as const,trialId:'trial-1',caseId:'case-1',method:'system_one' as const,stageId:'wide' as const,runId,canonicalExecutionId:'env-native-fixture',stageExecutionKey:jevStageKey(runId,'env-native-fixture','wide'),inputDigest:jevDigest(goal),rosterDigest:jevDigest('roster'),recipeRevision:JEV_RECIPE_REVISION,state:{request:goal},questions:{which:{type:'choice',instructions:'Choose',criteria:{s0:'Plan'}},needs_workflow:{type:'noul',instructions:'Need workflow?'},prose_suffices:{type:'noul',instructions:'Prose?'}}};
    const transport=vi.fn().mockResolvedValue(new Response(JSON.stringify({model:'typesafe/jev-1.14-20261014',answers:{which:choose('s0',{s0:1}),needs_workflow:yes(1),prose_suffices:yes(0)},usage:{input_tokens:1,output_tokens:1,cost:0.000001}}),{status:200}));
    const adapter=createJevNativeAdapter({connection:'openrouter-systemone',credential:new CredentialBoundary({OPENROUTER_API_KEY:'synthetic'}),reference:{providerId:'openrouter',keyId:'test',envNames:['OPENROUTER_API_KEY']},reportedModels:['typesafe/jev-1.14-20261014'],expectedStage:()=>stage,transport});
    const input={traceId:stage.canonicalExecutionId,providerId:'openrouter',modelId:'typesafe/jev-1.14',prompt:JSON.stringify(stage)};
    expect(JSON.parse((await adapter.execute(input)).text).usage.costMicrounits).toBe(2);
    expect(transport.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/systemone');
    expect(transport.mock.calls[0][1].redirect).toBe('error');
    await expect(adapter.execute({...input,prompt:JSON.stringify({...stage,schema:'cvf.jevNativeStage.v1'})})).rejects.toMatchObject({code:'PROVIDER_RESPONSE_INVALID'});
  });
  it('keeps unknown cost distinct and rounds known cost conservatively',()=>{
    expect(jevReportedUsdMicrounits(null)).toBeNull();expect(jevReportedUsdMicrounits(-1)).toBeNull();
    expect(jevReportedUsdMicrounits(0)).toBeNull();expect(jevReportedUsdMicrounits(0.0000001)).toBeGreaterThanOrEqual(1);
  });
});
