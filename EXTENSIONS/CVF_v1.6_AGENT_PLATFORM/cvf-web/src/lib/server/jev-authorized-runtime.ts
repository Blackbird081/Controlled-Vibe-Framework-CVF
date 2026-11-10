import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  PROVIDER_CAPABILITY_REGISTRY,
  CredentialBoundary,
  admitProviderAdapter,
  evaluateProviderAdapterConformance,
  type AdapterAdmissionRecord,
  type ProviderExecutionAdapter,
} from 'cvf-model-gateway';
import { validateTrialSpec, type JevTrialSpec } from './jev-trial-custody';
import { jevDigest } from './jev-suggestion-custody';
import { createJevNativeAdapter, loadVisibleSkills, visibleRosterDigest, type SkillCandidate } from './jev-capability-suggestion';
import {
  JevCustodyError, validateJevPolicy, type JevAuthorizedPolicy,
  type JevSingleActionConstraint,
} from './jev-suggestion-custody';

const MAX_POLICY_BYTES = 64_000;
const SHA = /^[a-f0-9]{64}$/;
// Digest of the exact operator-approved, trimmed synthetic goal in the audited packet.
export const JEV_APPROVED_GOAL_DIGEST = 'ee44ae09fac70118b4cada87814065d7b863282dd31155611b681ba1ccfbb2c2';

export type JevLegacyRuntime = {
  policy: JevAuthorizedPolicy;
  roster: SkillCandidate[];
  admission: AdapterAdmissionRecord;
  approvedGoalDigest: string;
  singleAction: JevSingleActionConstraint;
};

export type JevTrialRuntime = { schema:'cvf.jevTrialRuntime.v2'; directory:string; trialSpec:JevTrialSpec; roster:SkillCandidate[]; admission:AdapterAdmissionRecord };
export type JevAuthorizedRuntime = JevLegacyRuntime | JevTrialRuntime;

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) =>
  Object.keys(value).sort().join(',') === [...expected].sort().join(',');

/** Structural admission never invokes the adapter or resolves a credential. */
export function buildJevStructuralAdmission(adapter: ProviderExecutionAdapter,connection:'typesafe'|'openrouter-systemone'='typesafe'): AdapterAdmissionRecord {
  const provider=connection==='typesafe'?'typesafe':'openrouter';const model=connection==='typesafe'?'jev-latest':'typesafe/jev-1.14';
  const report = evaluateProviderAdapterConformance({
    providerId: provider, modelId: model, method: 'system_one', adapter,
    capabilityRegistry: PROVIDER_CAPABILITY_REGISTRY,
  });
  const admission = admitProviderAdapter(report, PROVIDER_CAPABILITY_REGISTRY);
  if (admission.status !== 'admitted' || admission.liveExecutionAuthorized !== false) {
    throw new JevCustodyError('ACTION_REFUSED');
  }
  return admission;
}

/** The entire trusted action snapshot is loaded once for each route request. */
export async function loadJevAuthorizedRuntime(options: {
  policyPath?: string;
  now?: number;
  loadRoster?: () => Promise<SkillCandidate[]>;
} = {}): Promise<JevAuthorizedRuntime> {
  const filename = options.policyPath ?? process.env.CVF_JEV_AUTHORIZED_POLICY_PATH;
  if (!filename || !path.isAbsolute(filename)) throw new JevCustodyError('ACTION_REFUSED');
  let parsed: unknown;
  try {
    const info = await stat(filename);
    if (!info.isFile() || info.size < 2 || info.size > MAX_POLICY_BYTES) throw new Error('size');
    const bytes = await readFile(filename);
    if (bytes.byteLength > MAX_POLICY_BYTES) throw new Error('size');
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch { throw new JevCustodyError('ACTION_REFUSED'); }
  if(record(parsed)&&parsed.schema==='cvf.jevTrialRuntime.v2'){
    if(!keys(parsed,['schema','directory','trialSpec'])||typeof parsed.directory!=='string'||!path.isAbsolute(parsed.directory)||parsed.directory!==process.env.CVF_JEV_CUSTODY_DIRECTORY)throw new JevCustodyError('ACTION_REFUSED');
    const trialSpec=validateTrialSpec(parsed.trialSpec,jevDigest);if(trialSpec.sourceDigest!==process.env.CVF_JEV_SOURCE_DIGEST||trialSpec.pricing.evidenceType!=='VERIFIED'||Date.parse(trialSpec.pricing.validUntil)<=(options.now??Date.now())||Date.parse(trialSpec.expiresAt)<=(options.now??Date.now()))throw new JevCustodyError('ACTION_REFUSED');
    const roster=await(options.loadRoster??loadVisibleSkills)();if(visibleRosterDigest(roster)!==trialSpec.rosterDigest)throw new JevCustodyError('ACTION_REFUSED');
    const adapter=createJevNativeAdapter({connection:'openrouter-systemone',credential:new CredentialBoundary(),reference:{providerId:'openrouter',keyId:'jev-server-openrouter',envNames:['OPENROUTER_API_KEY']},expectedStage:()=>undefined,reportedModels:['typesafe/jev-1.14-20261014']});
    return {schema:'cvf.jevTrialRuntime.v2',directory:parsed.directory,trialSpec,roster,admission:buildJevStructuralAdmission(adapter,'openrouter-systemone')};
  }
  if (!record(parsed) || !keys(parsed, ['schema', 'policy', 'approvedGoalDigest', 'approvedRosterDigest'])
    || parsed.schema !== 'cvf.jevSingleActionRuntime.v1'
    || !record(parsed.policy) || typeof parsed.approvedGoalDigest !== 'string' || !SHA.test(parsed.approvedGoalDigest)
    || typeof parsed.approvedRosterDigest !== 'string' || !SHA.test(parsed.approvedRosterDigest)) {
    throw new JevCustodyError('ACTION_REFUSED');
  }
  const policy = parsed.policy as JevAuthorizedPolicy;
  validateJevPolicy(policy, options.now);
  if (parsed.approvedGoalDigest !== JEV_APPROVED_GOAL_DIGEST
    || policy.currency !== 'USD' || policy.totalMaxMicrounits > 10_000
    || policy.wideMaxMicrounits > 5_000 || policy.narrowMaxMicrounits > 5_000
    || !policy.reportedModels.every(model => model === 'jev-1.14.0' || model === 'jev-latest')) {
    throw new JevCustodyError('ACTION_REFUSED');
  }
  const roster = await (options.loadRoster ?? loadVisibleSkills)();
  const rosterDigest = visibleRosterDigest(roster);
  if (rosterDigest !== parsed.approvedRosterDigest) throw new JevCustodyError('ACTION_REFUSED');
  // The existing native adapter is inspected structurally; it is never invoked here.
  const adapter = createJevNativeAdapter({
    credential: new CredentialBoundary(),
    reference: { providerId: 'typesafe', keyId: 'jev-server-typesafe', envNames: ['TYPESAFE_API_KEY'] },
    expectedStage: () => undefined, reportedModels: policy.reportedModels,
  });
  const admission = buildJevStructuralAdmission(adapter);
  return {
    policy, roster, admission, approvedGoalDigest: parsed.approvedGoalDigest,
    singleAction: {
      authorizationEvidenceDigest: policy.authorizationEvidenceDigest,
      effectAuthorizationRef: policy.effectAuthorizationRef,
      inputDigest: parsed.approvedGoalDigest,
      rosterDigest,
    },
  };
}
