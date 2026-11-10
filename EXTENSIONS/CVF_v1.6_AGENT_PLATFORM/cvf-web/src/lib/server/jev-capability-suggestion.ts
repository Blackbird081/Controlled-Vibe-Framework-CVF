// Text Encoding Exception: the catalog parser and returned user copy contain necessary Vietnamese text.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CredentialBoundary, CredentialReference, ProviderExecutionAdapter, ProviderExecutionAdapterInput } from 'cvf-model-gateway';
import { jevDigest, jevStageKey, JEV_RECIPE_REVISION } from './jev-suggestion-custody';

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/systemone';
const OPENROUTER_MODEL = 'typesafe/jev-1.14';
const OPENROUTER_REPORTED = 'typesafe/jev-1.14-20261014';

/** Round toward greater reserved cost, never infer zero from missing data. */
export function jevReportedUsdMicrounits(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 0.1) return null;
  // JSON number parsing can underflow a positive decimal to zero.
  if (value === 0) return null;
  const result = Math.ceil(value * 1_000_000) + 1;
  return Number.isSafeInteger(result) ? result : null;
}
const MAX_RESPONSE_BYTES = 128_000;
const MAX_ROSTER = 100;
/** Must stay identical to the stored-result catalogSkillId check in jev-suggestion-custody.ts. */
const SAFE_ROUTE_ID = /^[a-z0-9_]+$/;

export type SkillCandidate = {
  key: string;
  title: string;
  domain: string;
  domainId: string;
  skillId: string;
  description: string;
  detail: string;
};

export type SkillSuggestion =
  | { status: 'suggested'; title: string; domain: string; href: string; reason: string; model: string; inputTokens: number | null; outputTokens: number | null }
  | { status: 'no_match'; reason: string; model: string; inputTokens: number | null; outputTokens: number | null };

export class JevAdapterError extends Error {
  constructor(readonly code: 'ROSTER_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_RESPONSE_INVALID') {
    super(code);
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function unit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function tokens(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
}

const PURPOSE_HEADING = /^#{1,4}[^\n]*Mục đích[^\n]*$/im;
const WHEN_LABEL = /^(?:Khi nào(?: nên)? dùng(?: skill này)?|When to use(?: this skill)?)$/i;
const AVOID_LABEL = /^(?:Không phù hợp(?: khi)?|Not suitable(?: when)?)$/i;
const LABEL_LINE = /^\*\*([^*\n]{1,60}?)\s*:\*\*\s*$/;
const clean = (value: string, max: number) => value.replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Reads the skill's own "Mục đích" section: lead text, when-to-use and not-suitable lists.
 * Catalog files use several label spellings and CRLF; an unrecognized layout yields empty text.
 */
function skillSummary(content: string): { use: string; avoid: string } {
  const text = content.replace(/\r\n?/g, '\n');
  const heading = PURPOSE_HEADING.exec(text);
  if (!heading) return { use: '', avoid: '' };
  const section = text.slice(heading.index + heading[0].length).split(/\n(?:---|#{1,4} )/)[0];
  const lead: string[] = []; const when: string[] = []; const avoid: string[] = [];
  let target: string[] | null = lead;
  for (const raw of section.split('\n')) {
    const line = raw.trim();
    const label = LABEL_LINE.exec(line);
    if (label) { target = WHEN_LABEL.test(label[1].trim()) ? when : AVOID_LABEL.test(label[1].trim()) ? avoid : null; continue; }
    if (!line) { if (target !== lead) target = null; continue; }
    if (target) target.push(line.replace(/^>\s*/, '').replace(/^[-*]\s+/, ''));
  }
  const leadText = clean(lead.join(' '), 160);
  const use = clean([leadText, when.length ? `Khi nào dùng: ${when.join('; ')}` : ''].filter(Boolean).join(' '), 280);
  return { use, avoid: avoid.length ? clean(`Không phù hợp khi: ${avoid.join('; ')}`, 220) : '' };
}

/** Jev suggests only skills declared for the end-user role; agent/dispatcher packages stay out by design. */
function userFacing(roles: unknown): boolean {
  const list = typeof roles === 'string' ? roles.split(',') : Array.isArray(roles) ? roles : [];
  return list.some(role => typeof role === 'string' && role.trim().toLowerCase() === 'user');
}

export function parseVisibleSkills(value: unknown): SkillCandidate[] {
  if (!record(value) || !Array.isArray(value.categories)) throw new JevAdapterError('ROSTER_UNAVAILABLE');
  const skills: SkillCandidate[] = [];
  const ids = new Set<string>();
  for (const category of value.categories) {
    if (!record(category) || typeof category.id !== 'string' || !Array.isArray(category.skills)) continue;
    for (const skill of category.skills) {
      if (!record(skill) || skill.frontDoorVisible !== true || typeof skill.id !== 'string'
        || typeof skill.title !== 'string' || typeof skill.domain !== 'string' || typeof skill.content !== 'string') continue;
      if (!SAFE_ROUTE_ID.test(category.id) || !SAFE_ROUTE_ID.test(skill.id) || !userFacing(skill.allowedRoles)) continue;
      const id = `${category.id}/${skill.id}`;
      if (ids.has(id)) throw new JevAdapterError('ROSTER_UNAVAILABLE');
      ids.add(id);
      const { use, avoid } = skillSummary(skill.content);
      const title = skill.title.slice(0, 100);
      const domain = skill.domain.slice(0, 100);
      skills.push({
        key: `s${skills.length}`,
        title, domain, domainId: category.id, skillId: skill.id,
        description: `${title} (${domain}). ${use}`.slice(0, 320),
        detail: `${title} (${domain}). ${use}. ${avoid ? `${avoid}. ` : ''}${skill.content.slice(0, 650)}`.slice(0, 950),
      });
      if (skills.length > MAX_ROSTER) throw new JevAdapterError('ROSTER_UNAVAILABLE');
    }
  }
  if (!skills.length) throw new JevAdapterError('ROSTER_UNAVAILABLE');
  return skills;
}

export async function loadVisibleSkills(): Promise<SkillCandidate[]> {
  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', 'data', 'skills-index.json'), 'utf8');
    return parseVisibleSkills(JSON.parse(bytes));
  } catch {
    throw new JevAdapterError('ROSTER_UNAVAILABLE');
  }
}

export type JevNativeStageV1 = {
  schema: 'cvf.jevNativeStage.v1'; method: 'system_one'; stageId: 'wide' | 'narrow';
  runId: string; canonicalExecutionId: string; stageExecutionKey: string; inputDigest: string; rosterDigest: string;
  recipeRevision: string; state: { request: string }; questions: Record<string, unknown>;
};
export type JevNativeStageV2 = Omit<JevNativeStageV1, 'schema'> & { schema:'cvf.jevNativeStage.v2'; transport:'openrouter-systemone'; trialId:string; caseId:string };
export type JevStageExecutor = (stageId:'wide'|'narrow', body:{state:{request:string};questions:Record<string,unknown>})=>Promise<Record<string,unknown>>;
export function visibleRosterDigest(roster:SkillCandidate[]):string {
  return jevDigest(JSON.stringify([...roster].sort((a,b)=>`${a.domainId}/${a.skillId}` < `${b.domainId}/${b.skillId}` ? -1 : `${a.domainId}/${a.skillId}` > `${b.domainId}/${b.skillId}` ? 1 : 0).map(({key,title,domain,domainId,skillId,description,detail})=>({key,title,domain,domainId,skillId,description,detail}))));
}
function exactKeys(value:Record<string,unknown>,keys:string[]):boolean{return Object.keys(value).sort().join(',')===[...keys].sort().join(',');}
export function validateJevNativeStage(value:unknown):JevNativeStageV1 {
  if(!record(value)||!exactKeys(value,['schema','method','stageId','runId','canonicalExecutionId','stageExecutionKey','inputDigest','rosterDigest','recipeRevision','state','questions'])
    ||value.schema!=='cvf.jevNativeStage.v1'||value.method!=='system_one'||!['wide','narrow'].includes(String(value.stageId))
    ||!record(value.state)||!exactKeys(value.state,['request'])||typeof value.state.request!=='string'||value.state.request.trim()!==value.state.request
    ||value.state.request.length<8||value.state.request.length>1000||jevDigest(value.state.request)!==value.inputDigest
    ||value.recipeRevision!==JEV_RECIPE_REVISION||!record(value.questions)
    ||typeof value.runId!=='string'||!/^[a-f0-9-]{36}$/.test(value.runId)||typeof value.canonicalExecutionId!=='string'||!/^env-[a-zA-Z0-9-]{1,100}$/.test(value.canonicalExecutionId)
    ||value.stageExecutionKey!==jevStageKey(value.runId,value.canonicalExecutionId,String(value.stageId))||typeof value.rosterDigest!=='string'||!/^[a-f0-9]{64}$/.test(value.rosterDigest)
    ||!['runId','canonicalExecutionId','stageExecutionKey','inputDigest','rosterDigest'].every(k=>typeof value[k]==='string'&&(value[k] as string).length>0))throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  const questions=value.questions;
  if(!record(questions.which)||!record(questions.which.criteria))throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  const ids=Object.keys(questions.which.criteria);
  if(ids.length<1||ids.length>(value.stageId==='wide'?100:3)||ids.some(id=>!/^s\d{1,2}$/.test(id))
    ||Object.values(questions.which.criteria).some(v=>typeof v!=='string'||v.length>950))throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  const expected=value.stageId==='wide'?['which','needs_workflow','prose_suffices']:['which',...ids.map(id=>`fits_${id}`)];
  if(!exactKeys(questions,expected))throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  for(const [name,q]of Object.entries(questions))if(!record(q)||!exactKeys(q,name==='which'?['type','instructions','criteria']:['type','instructions'])
    ||q.type!==(name==='which'?'choice':'noul')||typeof q.instructions!=='string'||q.instructions.length>1500)throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  return value as JevNativeStageV1;
}
/** Runtime secret resolution stays inside this one fixed native transport. */
export function createJevNativeAdapter(options:{credential:CredentialBoundary;reference:CredentialReference;
  expectedStage:()=>JevNativeStageV1|JevNativeStageV2|undefined;reportedModels:readonly string[];transport?:typeof fetch;
  connection?: 'typesafe'|'openrouter-systemone';
  observe?:(state:'HTTP_NOT_STARTED'|'HTTP_POSSIBLE'|'RESPONSE_OBSERVED',status:number|null)=>void}):ProviderExecutionAdapter {
  const openrouter=options.connection==='openrouter-systemone';
  const providerId=openrouter?'openrouter':'typesafe';
  const model=openrouter?OPENROUTER_MODEL:MODEL;
  const endpoint=openrouter?OPENROUTER_ENDPOINT:ENDPOINT;
  const env=openrouter?'OPENROUTER_API_KEY':'TYPESAFE_API_KEY';
  if(openrouter && (options.reportedModels.length!==1 || options.reportedModels[0]!==OPENROUTER_REPORTED)) throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  return {providerId,async execute(input:ProviderExecutionAdapterInput){
    let stage:JevNativeStageV1;
    try{const raw=JSON.parse(input.prompt) as Record<string,unknown>;
      if(openrouter){if(!exactKeys(raw,['schema','transport','trialId','caseId','method','stageId','runId','canonicalExecutionId','stageExecutionKey','inputDigest','rosterDigest','recipeRevision','state','questions'])||raw.schema!=='cvf.jevNativeStage.v2'||raw.transport!=='openrouter-systemone'||typeof raw.trialId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(raw.trialId)||typeof raw.caseId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(raw.caseId))throw Error('stage');
        const {transport,trialId,caseId,...rest}=raw;void transport;void trialId;void caseId; stage=validateJevNativeStage({...rest,schema:'cvf.jevNativeStage.v1'});
      } else stage=validateJevNativeStage(raw);
    }catch{throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');}
    const expected=options.expectedStage();
    if(!expected||JSON.stringify(expected)!==input.prompt||input.providerId!==providerId||input.modelId!==model||input.traceId!==stage.canonicalExecutionId
      ||options.reference.providerId!==providerId||options.reference.envNames.join(',')!==env)throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
    options.observe?.('HTTP_NOT_STARTED',null);
    const key=options.credential.resolveSecretForRuntime(options.reference);
    if(!key||input.signal?.aborted)throw new JevAdapterError('PROVIDER_UNAVAILABLE');
    const controller=new AbortController();
    const abort=()=>controller.abort(); input.signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,12000);
    try{
      options.observe?.('HTTP_POSSIBLE',null);
      const response=await (options.transport??fetch)(endpoint,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({model,state:stage.state,questions:stage.questions}),signal:controller.signal,cache:'no-store',...(openrouter?{redirect:'error' as const}:{})});
      options.observe?.('RESPONSE_OBSERVED',response.status);
      if(!response.ok)throw new JevAdapterError('PROVIDER_UNAVAILABLE');
      const size=Number(response.headers.get('content-length'));
      if(Number.isFinite(size)&&size>MAX_RESPONSE_BYTES)throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
      const reader=response.body?.getReader();if(!reader)throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
      const chunks:Uint8Array[]=[];let total=0;
      for(;;){if(controller.signal.aborted){await reader.cancel();throw new JevAdapterError('PROVIDER_UNAVAILABLE');}const {done,value}=await reader.read();if(controller.signal.aborted){await reader.cancel();throw new JevAdapterError('PROVIDER_UNAVAILABLE');}if(done)break;total+=value.byteLength;if(total>MAX_RESPONSE_BYTES){await reader.cancel();throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');}chunks.push(value);}
      const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const parsed:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      if(!record(parsed)||!record(parsed.answers)||typeof parsed.model!=='string'||!options.reportedModels.includes(parsed.model))throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
      const ids=new Set(Object.keys((stage.questions.which as {criteria:Record<string,string>}).criteria));
      const picked=choice(parsed,ids);
      const answers:Record<string,unknown>={which:{type:'choice',choice:picked.selected,probabilities:(parsed.answers.which as Record<string,unknown>).probabilities}};
      for(const name of Object.keys(stage.questions).filter(n=>n!=='which'))answers[name]={type:'noul',noul:noul(parsed,name)};
      const use=usage(parsed);const cost = openrouter && record(parsed.usage) ? jevReportedUsdMicrounits(parsed.usage.cost) : null;
      const projection={model:parsed.model,answers,usage:{input_tokens:use.inputTokens,output_tokens:use.outputTokens,...(openrouter?{costMicrounits:cost}:{})}};
      return {text:JSON.stringify(projection),...(use.inputTokens!==null&&use.outputTokens!==null?{usage:{inputTokens:use.inputTokens,outputTokens:use.outputTokens}}:{})};
    }catch(error){if(error instanceof JevAdapterError)throw error;throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');}
    finally{clearTimeout(timer);input.signal?.removeEventListener('abort',abort);}
  }};
}

function answer(response: Record<string, unknown>, name: string): Record<string, unknown> {
  const answers = response.answers as Record<string, unknown>;
  if (!record(answers[name])) throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  return answers[name];
}

function noul(response: Record<string, unknown>, name: string): number {
  const value = answer(response, name);
  if (value.type !== 'noul' || !unit(value.noul)) throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  return value.noul;
}

function choice(response: Record<string, unknown>, allowed: Set<string>): { selected: string; ranked: string[] } {
  const value = answer(response, 'which');
  if (value.type !== 'choice' || typeof value.choice !== 'string' || !allowed.has(value.choice)
    || !record(value.probabilities)) throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  const probs = value.probabilities;
  if (Object.keys(probs).length !== allowed.size || [...allowed].some(key => !unit(probs[key]))) {
    throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  }
  const ranked = [...allowed].sort((a, b) => (probs[b] as number) - (probs[a] as number));
  return { selected: value.choice, ranked };
}

function usage(response: Record<string, unknown>): { inputTokens: number | null; outputTokens: number | null } {
  const value = record(response.usage) ? response.usage : {};
  return { inputTokens: tokens(value.input_tokens), outputTokens: tokens(value.output_tokens) };
}

export async function suggestJevSkill(goal: string, roster: SkillCandidate[], executeStage: JevStageExecutor): Promise<SkillSuggestion> {
  const text = goal.trim();
  if (text.length < 8 || text.length > 1000 || roster.length < 1 || roster.length > MAX_ROSTER) {
    throw new JevAdapterError('ROSTER_UNAVAILABLE');
  }
  const byKey = new Map(roster.map(skill => [skill.key, skill]));
  if (byKey.size !== roster.length) throw new JevAdapterError('ROSTER_UNAVAILABLE');
  const criteria = Object.fromEntries(roster.map(skill => [skill.key, skill.description]));
  const state = { request: text };
  const wide = await executeStage('wide', { state, questions: {
    which: { type: 'choice', instructions: 'Which listed CVF skill, if any, would help perform the user request?', criteria },
    needs_workflow: { type: 'noul', instructions: 'Does the user request an actual task or deliverable for which a documented skill procedure would help?' },
    prose_suffices: { type: 'noul', instructions: 'Can this request be fully satisfied by a short general explanation without using a specific skill procedure?' },
  } });
  const ranked = choice(wide, new Set(byKey.keys())).ranked;
  const gate = (noul(wide, 'needs_workflow') + 1 - noul(wide, 'prose_suffices')) / 2;
  if (gate < 0.3) return { status: 'no_match', reason: 'Yêu cầu này chưa cần một kỹ năng trong thư viện CVF.', model: wide.model as string, ...usage(wide) };
  const shortlist = ranked.slice(0, 3);
  const detailCriteria = Object.fromEntries(shortlist.map(id => [id, byKey.get(id)!.detail]));
  const questions: Record<string, unknown> = {
    which: { type: 'choice', instructions: 'Which one of these CVF skills best fits the specific user request? Select the actual task fit, not a similar name.', criteria: detailCriteria },
  };
  for (const id of shortlist) {
    questions[`fits_${id}`] = { type: 'noul', instructions: `Does the CVF skill described here actually perform the specific task requested by the user? ${byKey.get(id)!.detail}` };
  }
  const narrow = await executeStage('narrow', { state, questions });
  const winner = choice(narrow, new Set(shortlist)).selected;
  const fit = noul(narrow, `fits_${winner}`);
  const firstUsage = usage(wide);
  const secondUsage = usage(narrow);
  const combined = {
    model: narrow.model as string,
    inputTokens: firstUsage.inputTokens === null || secondUsage.inputTokens === null ? null : firstUsage.inputTokens + secondUsage.inputTokens,
    outputTokens: firstUsage.outputTokens === null || secondUsage.outputTokens === null ? null : firstUsage.outputTokens + secondUsage.outputTokens,
  };
  if (fit < 0.3) return { status: 'no_match', reason: 'Chưa tìm thấy kỹ năng đủ phù hợp trong danh sách đang mở cho người dùng.', ...combined };
  const skill = byKey.get(winner)!;
  return {
    status: 'suggested', title: skill.title, domain: skill.domain,
    href: `/skills/${skill.domainId}/${skill.skillId}`,
    reason: `Kỹ năng này được mô tả cho: ${skill.description}. Hãy xem nội dung trước khi dùng.`,
    ...combined,
  };
}
