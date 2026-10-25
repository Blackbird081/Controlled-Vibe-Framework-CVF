// Text Encoding Exception: the catalog parser and returned user copy contain necessary Vietnamese text.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';
const MAX_RESPONSE_BYTES = 128_000;
const MAX_ROSTER = 100;

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

function purpose(content: string): string {
  const match = content.match(/\*\*Khi nào dùng:\*\*\s*([\s\S]{0,600}?)(?:\n\s*\n|\*\*Không phù hợp)/i);
  return (match?.[1] ?? '').replace(/^\s*[-*]\s*/gm, '').replace(/\s+/g, ' ').trim().slice(0, 220);
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
      if (!/^[a-z0-9_]+$/.test(category.id) || !/^[a-z0-9_]+$/.test(skill.id)) continue;
      const id = `${category.id}/${skill.id}`;
      if (ids.has(id)) throw new JevAdapterError('ROSTER_UNAVAILABLE');
      ids.add(id);
      const use = purpose(skill.content);
      const title = skill.title.slice(0, 100);
      const domain = skill.domain.slice(0, 100);
      skills.push({
        key: `s${skills.length}`,
        title, domain, domainId: category.id, skillId: skill.id,
        description: `${title} (${domain}). ${use}`.slice(0, 320),
        detail: `${title} (${domain}). ${use}. ${skill.content.slice(0, 650)}`.slice(0, 950),
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

async function postJev(body: Record<string, unknown>, key: string, transport: typeof fetch): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await transport(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model: MODEL, ...body }),
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
  } catch {
    throw new JevAdapterError('PROVIDER_UNAVAILABLE');
  }
  if (!response.ok) throw new JevAdapterError('PROVIDER_UNAVAILABLE');
  const size = Number(response.headers.get('content-length'));
  if (Number.isFinite(size) && size > MAX_RESPONSE_BYTES) throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  try {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('empty');
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error('large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!record(parsed) || !record(parsed.answers) || typeof parsed.model !== 'string' || !parsed.model.startsWith('jev-')) throw new Error('schema');
    return parsed;
  } catch {
    throw new JevAdapterError('PROVIDER_RESPONSE_INVALID');
  }
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

export async function suggestJevSkill(goal: string, key: string, roster: SkillCandidate[], transport: typeof fetch = fetch): Promise<SkillSuggestion> {
  const text = goal.trim();
  if (text.length < 8 || text.length > 1000 || !key || roster.length < 1 || roster.length > MAX_ROSTER) {
    throw new JevAdapterError('ROSTER_UNAVAILABLE');
  }
  const byKey = new Map(roster.map(skill => [skill.key, skill]));
  if (byKey.size !== roster.length) throw new JevAdapterError('ROSTER_UNAVAILABLE');
  const criteria = Object.fromEntries(roster.map(skill => [skill.key, skill.description]));
  const state = { request: text };
  const wide = await postJev({ state, questions: {
    which: { type: 'choice', instructions: 'Which listed CVF skill, if any, would help perform the user request?', criteria },
    needs_workflow: { type: 'noul', instructions: 'Does the user request an actual task or deliverable for which a documented skill procedure would help?' },
    prose_suffices: { type: 'noul', instructions: 'Can this request be fully satisfied by a short general explanation without using a specific skill procedure?' },
  } }, key, transport);
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
  const narrow = await postJev({ state, questions }, key, transport);
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
