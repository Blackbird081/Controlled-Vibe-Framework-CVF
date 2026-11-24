import { randomUUID } from 'node:crypto';
import { CredentialBoundary, type CredentialReference } from 'cvf-model-gateway';
import { getHomeDescriptionFields, getJevOutcomeChoices } from '@/lib/home-spec-jev-catalog';
import {
    createJevNativeAdapter, loadWebSkillRoster, suggestJevSkill,
    type JevNativeStageV2, type JevStageExecutor,
} from '@/lib/server/jev-capability-suggestion';
import { awaitJevAgentTransport } from '@/lib/server/jev-agent-advisory-stage';
import { buildJevStructuralAdmission } from '@/lib/server/jev-authorized-runtime';
import { jevDigest, jevStageKey, JEV_RECIPE_REVISION } from '@/lib/server/jev-suggestion-custody';
import { WebJevRefusal, type WebJevFallback, type WebJevStore } from '@/lib/server/jev-web-store';

const endpoint = 'https://openrouter.ai/api/v1/systemone';
const model = 'typesafe/jev-1.14';
const reportedModel = 'typesafe/jev-1.14-20261014';
const reference: CredentialReference = {
    providerId: 'openrouter', keyId: 'jev-home-spec-openrouter', envNames: ['OPENROUTER_API_KEY'],
};
// Same transport price pin as the accepted 3A runner. No upstream or model fallback.
const provider = { only: ['typesafe'], allow_fallbacks: false, max_price: { prompt: 0.042, completion: 0, request: 0 } };
const noMatch = 'no_match';

type Reply = {
    model: string;
    answers: Record<string, { type: 'noul'; noul: number } | { type: 'choice'; choice: string; probabilities: Record<string, number> }>;
    usage: { input_tokens: number | null; output_tokens: number | null; costMicrounits: number | null };
};
type TransportFixture = { credential: CredentialBoundary; transport: typeof fetch };
export type WebJevChoice = { templateId: string; probability: number; decision: 'preselect' | 'clarify'; candidates?: string[]; topNoMatch?: boolean };

export function isWebJevAvailable(): boolean {
    return process.env.NEXT_PUBLIC_CVF_MOCK_AI !== '1'
        && new CredentialBoundary().resolveMetadata(reference).available;
}

export function decideWebJevChoice(
    selected: string,
    ranked: Array<{ id: string; probability: number }>,
): WebJevChoice {
    const picked = ranked.find(item => item.id === selected);
    if (!picked) throw new WebJevRefusal('unavailable');
    const runnerUp = ranked.find(item => item.id !== selected);
    // Integer-like decimals can straddle an IEEE-754 boundary (0.70 - 0.40).
    const margin = picked.probability - (runnerUp?.probability ?? 0);
    const decision = selected !== noMatch && ranked[0]?.id === selected && picked.probability >= 0.70
        && margin >= 0.30 - Number.EPSILON ? 'preselect' : 'clarify';
    return { templateId: selected, probability: picked.probability, decision,
        ...(decision === 'clarify' ? { topNoMatch: ranked[0]?.id === noMatch, candidates: ranked[0]?.id === noMatch ? [] : ranked.slice(0, 3).filter(item => item.id !== noMatch && item.probability > 0).map(item => item.id) } : {}) };
}

export class WebJevTransport {
    constructor(private readonly store: WebJevStore, private readonly actor: string,
        private readonly stillAuthorized: () => Promise<boolean>, private readonly signal: AbortSignal,
        private readonly fixture?: TransportFixture) {
        if (fixture && process.env.NODE_ENV !== 'test') throw new WebJevRefusal('unavailable');
    }

    private async execute(stageId: 'wide' | 'narrow', body: Parameters<JevStageExecutor>[1],
        rosterDigest: string): Promise<Reply> {
        if (process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1' || this.signal.aborted || !await this.stillAuthorized()) {
            throw new WebJevRefusal('unavailable');
        }
        const deadline = AbortSignal.any([this.signal, AbortSignal.timeout(12_000)]);
        const runId = randomUUID();
        const canonicalExecutionId = `env-${randomUUID()}`;
        const stage: JevNativeStageV2 = {
            schema: 'cvf.jevNativeStage.v2', transport: 'openrouter-systemone', trialId: 'ui01-home-spec-web',
            caseId: runId, method: 'system_one', stageId, runId, canonicalExecutionId,
            stageExecutionKey: jevStageKey(runId, canonicalExecutionId, stageId),
            inputDigest: jevDigest(body.state.request), rosterDigest, recipeRevision: JEV_RECIPE_REVISION, ...body,
        };
        const nativeWire = JSON.stringify({ model, state: body.state, questions: body.questions });
        const wire = JSON.stringify({ model, state: body.state, questions: body.questions, provider });
        const tokenLimit = Buffer.byteLength(wire, 'utf8') + 2048;
        if (tokenLimit > 64_000) throw new WebJevRefusal('unavailable');
        const quoted = Math.ceil(tokenLimit * provider.max_price.prompt) + 2;
        const credential = this.fixture?.credential ?? new CredentialBoundary();
        const request = this.fixture?.transport ?? fetch;
        let attempt: string | undefined;
        let refusal: WebJevFallback | undefined;
        const adapter = createJevNativeAdapter({
            credential, reference, expectedStage: () => stage, reportedModels: [reportedModel],
            connection: 'openrouter-systemone',
            transport: async (url, init) => {
                if (url !== endpoint || init?.method !== 'POST' || init.redirect !== 'error'
                    || init.body !== nativeWire || deadline.aborted || attempt) {
                    throw new WebJevRefusal('unavailable');
                }
                try {
                    attempt = this.store.reserve(this.actor, quoted);
                } catch (error) {
                    if (error instanceof WebJevRefusal) refusal = error.code;
                    throw error;
                }
                return awaitJevAgentTransport(() => request(endpoint, { ...init, body: wire, signal: deadline }), deadline);
            },
        });
        buildJevStructuralAdmission(adapter, 'openrouter-systemone');
        let response: Reply;
        try {
            const result = await awaitJevAgentTransport(() => adapter.execute({
                traceId: canonicalExecutionId, providerId: 'openrouter', modelId: model,
                prompt: JSON.stringify(stage), signal: deadline,
            }), deadline);
            response = JSON.parse(result.text) as Reply;
        } catch {
            if (attempt) this.store.settle(attempt, null);
            throw new WebJevRefusal(refusal ?? 'unavailable');
        }
        if (!attempt) throw new WebJevRefusal('unavailable');
        const tokens = response.usage.input_tokens;
        const output = response.usage.output_tokens;
        const cost = response.usage.costMicrounits;
        const validUsage = Number.isSafeInteger(tokens) && tokens !== null && tokens >= 0 && tokens <= tokenLimit
            && Number.isSafeInteger(output) && output !== null && output >= 0
            && Number.isSafeInteger(cost) && cost !== null && cost >= 0 && cost <= quoted;
        this.store.settle(attempt, validUsage ? cost : null);
        return response;
    }

    async choose(goal: string): Promise<WebJevChoice> {
        const choices = getJevOutcomeChoices();
        if (choices[0]?.id !== noMatch || choices.length < 4 || choices.length > 100
            || new Set(choices.map(item => item.id)).size !== choices.length) throw new WebJevRefusal('unavailable');
        const criteria = Object.fromEntries(choices.map((item, index) => [`s${index}`, item.description]));
        const answers = await this.execute('wide', { state: { request: goal }, questions: {
            which: { type: 'choice', criteria, instructions: 'What single existing template best matches the requested deliverable? Choose no suitable template if no option fits or if the intended output cannot be determined. Select the closest concrete result, not a similar topic.' },
            needs_workflow: { type: 'noul', instructions: 'Is an identifiable deliverable requested?' },
            prose_suffices: { type: 'noul', instructions: 'Is the deliverable a written artifact?' },
        } }, jevDigest(JSON.stringify({ format: 'ui01-home-outcome-v1', choices })));
        const picked = answers.answers.which;
        if (picked?.type !== 'choice') throw new WebJevRefusal('unavailable');
        const ranked = choices.map((item, index) => ({ id: item.id, probability: picked.probabilities[`s${index}`] }))
            .sort((a, b) => b.probability - a.probability);
        return decideWebJevChoice(choices[Number(picked.choice.slice(1))]?.id ?? '', ranked);
    }

    async fields(goal: string, templateId: string): Promise<Array<{ id: string; label: string }>> {
        const fields = getHomeDescriptionFields(templateId);
        if (fields.length > 12 || new Set(fields.map(field => field.id)).size !== fields.length) {
            throw new WebJevRefusal('unavailable');
        }
        const missing: Array<{ id: string; label: string }> = [];
        for (let offset = 0; offset < fields.length; offset += 3) {
            const slice = fields.slice(offset, offset + 3);
            const criteria = Object.fromEntries(slice.map((field, index) => [`s${index + 1}`, field.label]));
            if (slice.length === 1) criteria.s0 = 'The field is not explicitly provided';
            const questions: Record<string, unknown> = {
                which: { type: 'choice', criteria, instructions: 'Which listed detail is most explicitly provided? This answer does not decide the presence of any field.' },
            };
            for (const [id, label] of Object.entries(criteria)) {
                const field = slice[Number(id.slice(1)) - 1];
                const instruction = field?.id === 'homeInputReferences'
                    ? 'Count an explicit name or link even if the user says they will send it later. A vague promise without a name or link does not count.'
                    : 'Do not infer details, apply defaults, or give credit for promised future information.';
                questions[`fits_${id}`] = { type: 'noul', instructions: `Does the request explicitly supply ${label}? ${instruction}` };
            }
            const response = await this.execute('narrow', { state: { request: goal }, questions },
                jevDigest(JSON.stringify({ format: 'ui01-home-fields-v1', templateId, fields })));
            slice.forEach((field, index) => {
                const answer = response.answers[`fits_s${index + 1}`];
                if (answer?.type !== 'noul') throw new WebJevRefusal('unavailable');
                if (answer.noul < 0.40) missing.push(field);
            });
        }
        return missing;
    }

    async skills(goal: string): Promise<{ title: string; href: string } | null> {
        const { roster, digest } = loadWebSkillRoster();
        const result = await suggestJevSkill(goal, roster, (stage, body) =>
            this.execute(stage, body, digest) as unknown as Promise<Record<string, unknown>>, 'agent');
        if (result.status !== 'suggested') return null;
        return { title: result.title, href: result.href };
    }
}
