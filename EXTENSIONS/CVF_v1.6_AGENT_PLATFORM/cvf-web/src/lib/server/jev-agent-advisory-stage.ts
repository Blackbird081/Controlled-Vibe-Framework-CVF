import { createHash } from 'node:crypto';

export const JEV_AGENT_STAGE_SCHEMA = 'cvf.jevAgentAdvisoryStage.v1';
export const JEV_AGENT_ADVISORY_REASONS = {
  abstained: 'Jev explicitly chose abstention.',
  selected: 'Jev selected a bound candidate in the typed choice.',
} as const;

export type JevAgentAdvisoryStage = {
  schema: typeof JEV_AGENT_STAGE_SCHEMA;
  method: 'system_one';
  stageId: 'agent-advisory';
  canonicalExecutionId: string;
  snapshotId: string;
  bodySha256: string;
  choiceToRef: Record<string, string>;
  body: {
    model: string;
    state: { request: string };
    questions: { which: { type: 'choice'; instructions: string; criteria: Record<string, string> } };
  };
};

const sha256 = /^[a-f0-9]{64}$/;
const capabilityRef = /^cap-[a-f0-9]{64}$/;
const custodyUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const choiceId = /^s(?:[1-9]|10)$/;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function shape(value: unknown, fields: string[], optional: string[] = []): value is Record<string, unknown> {
  return record(value) && fields.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => fields.includes(key) || optional.includes(key));
}

function matches(value: unknown, pattern: RegExp): value is string {
  return typeof value === 'string' && value.match(pattern)?.[0] === value;
}

function text(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.length >= min && value.length <= max && value.trim() === value;
}

/** The returned immutable string is the only body the adapter may send for this stage. */
export function prepareJevAgentAdvisoryStage(value: unknown, model: string): { stage: JevAgentAdvisoryStage; wireBody: string } {
  if (!shape(value, ['schema', 'method', 'stageId', 'canonicalExecutionId', 'snapshotId', 'bodySha256', 'choiceToRef', 'body'])
    || value.schema !== JEV_AGENT_STAGE_SCHEMA || value.method !== 'system_one' || value.stageId !== 'agent-advisory'
    || !matches(value.canonicalExecutionId, custodyUuid) || !matches(value.snapshotId, sha256)
    || !matches(value.bodySha256, sha256) || !record(value.choiceToRef)) throw new Error('INVALID_AGENT_STAGE');

  const body = value.body;
  if (!shape(body, ['model', 'state', 'questions']) || body.model !== model
    || !shape(body.state, ['request']) || !text(body.state.request, 8, 1000)
    || !shape(body.questions, ['which'])) throw new Error('INVALID_AGENT_BODY');
  const { which } = body.questions;
  if (!shape(which, ['type', 'instructions', 'criteria']) || which.type !== 'choice'
    || !text(which.instructions, 1, 1500) || !record(which.criteria)) throw new Error('INVALID_AGENT_QUESTION');

  const refs = Object.entries(value.choiceToRef);
  const ids = refs.map(([id]) => id);
  if (refs.length < 1 || refs.length > 10 || refs.some(([id, ref]) => !matches(id, choiceId) || !matches(ref, capabilityRef))
    || new Set(refs.map(([, ref]) => ref)).size !== refs.length || !shape(which.criteria, ['s0', ...ids])
    || Object.values(which.criteria).some(description => !text(description, 1, 950))) throw new Error('INVALID_AGENT_CHOICE_MAP');

  // This fixed schema emits sorted keys at every level, including opaque choice IDs.
  const descriptions = which.criteria;
  const criteria = Object.fromEntries(Object.keys(descriptions).sort().map(id => [id, descriptions[id]]));
  const wireBody = JSON.stringify({
    model,
    questions: { which: { criteria, instructions: which.instructions, type: 'choice' } },
    state: { request: body.state.request },
  }).replace(/[^\x20-\x7e]/g, unit => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`);
  if (createHash('sha256').update(wireBody, 'utf8').digest('hex') !== value.bodySha256) throw new Error('AGENT_BODY_DIGEST_MISMATCH');
  return { stage: value as JevAgentAdvisoryStage, wireBody };
}

function unit(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function reportedTokens(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function decodeJevAgentAdvisory(value: unknown, stage: JevAgentAdvisoryStage) {
  if (!shape(value, ['model', 'answers'], ['id', 'provider', 'usage']) || !shape(value.answers, ['which'])
    || ['id', 'provider'].some(key => Object.hasOwn(value, key) && !matches(value[key], /^[\x20-\x7e]{1,200}$/))) {
    throw new Error('INVALID_AGENT_RESPONSE');
  }
  const { which } = value.answers;
  const ids = ['s0', ...Object.keys(stage.choiceToRef)];
  if (!shape(which, ['type', 'choice', 'probabilities'], ['confidence']) || which.type !== 'choice'
    || typeof which.choice !== 'string' || !ids.includes(which.choice) || !shape(which.probabilities, ids)
    || Object.values(which.probabilities).some(probability => !unit(probability))
    || (Object.hasOwn(which, 'confidence') && !unit(which.confidence))) throw new Error('INVALID_AGENT_ANSWER');
  if (Object.hasOwn(value, 'usage')) {
    const usage = value.usage;
    // OpenRouter attaches billing metadata. The adapter uses only the token counts and total cost.
    if (!shape(usage, [], ['input_tokens', 'output_tokens', 'cost', 'cost_details', 'is_byok'])
      || (Object.hasOwn(usage, 'input_tokens') && !reportedTokens(usage.input_tokens))
      || (Object.hasOwn(usage, 'output_tokens') && !reportedTokens(usage.output_tokens))
      || (Object.hasOwn(usage, 'cost') && (typeof usage.cost !== 'number' || !Number.isFinite(usage.cost) || usage.cost < 0))
      || (Object.hasOwn(usage, 'cost_details') && usage.cost_details !== null && !record(usage.cost_details))
      || (Object.hasOwn(usage, 'is_byok') && typeof usage.is_byok !== 'boolean')) {
      throw new Error('INVALID_AGENT_USAGE');
    }
  }
  const abstained = which.choice === 's0';
  return {
    snapshotId: stage.snapshotId,
    selectedRef: abstained ? null : stage.choiceToRef[which.choice],
    reason: abstained ? JEV_AGENT_ADVISORY_REASONS.abstained : JEV_AGENT_ADVISORY_REASONS.selected,
  };
}

export class JevAgentTransportUnavailable extends Error {}

/** Bound even an injected transport that fails to observe its AbortSignal. */
export async function awaitJevAgentTransport<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new JevAgentTransportUnavailable();
  let onAbort!: () => void;
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new JevAgentTransportUnavailable());
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(() => {
      if (signal.aborted) throw new JevAgentTransportUnavailable();
      return operation();
    }), aborted]);
  } catch {
    throw new JevAgentTransportUnavailable();
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}
