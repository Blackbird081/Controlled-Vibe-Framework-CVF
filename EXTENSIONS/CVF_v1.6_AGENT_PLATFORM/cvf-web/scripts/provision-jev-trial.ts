import path from 'node:path';
import { loadJevAuthorizedRuntime } from '../src/lib/server/jev-authorized-runtime';
import { JevSuggestionCustody } from '../src/lib/server/jev-suggestion-custody';

const CASES = [
  { id: 'EVAL01', goal: '25dc2f717cd30923ce8d6e14cc8241287e6a86d28049036928d0d7f07e2e24bc', manifest: '32e14c85f61d737507e43d0213a7a5f7db250e6048c55fc3d0a1417dc423231d' },
  { id: 'EVAL02', goal: 'eb14093f8cbacc6e5653ece41d9146a657f8c632198d0546fc359cfab127328b', manifest: '2dcf6b46ed18b75e9dec57822d7285131ac0a5b2b361163b617de9ce15c05fdc' },
] as const;
const ROSTER = '2f8fcce9e5c4865c8530535422332f3345e3713206f8deaea542a2c0b631e03c';

/** Explicit operator invocation; the loader is the authority for policy and roster. */
export async function provisionJevTrial(policyPath: string): Promise<{trialId: string; policyDigest: string}> {
  if (!path.isAbsolute(policyPath)) throw new Error('REFUSED');
  const now = Date.now();
  const runtime = await loadJevAuthorizedRuntime({ policyPath, now });
  if (!('schema' in runtime) || runtime.schema !== 'cvf.jevTrialRuntime.v2') throw new Error('REFUSED');
  const s = runtime.trialSpec;
  if (Object.keys(s.manifest).length !== 1 || !CASES.some(c =>
      Object.keys(s.manifest)[0] === c.id && s.manifest[c.id] === c.goal && s.manifestDigest === c.manifest)
      || s.rosterDigest !== ROSTER || s.maxCases !== 1 || s.maxHttp !== 2 || s.maxMicrounits !== 30000
      || s.wideMaxMicrounits !== 15000 || s.narrowMaxMicrounits !== 15000
      || s.resultRetentionMs !== 86400000 || Date.parse(s.expiresAt) > now + 86400000) throw new Error('REFUSED');
  JevSuggestionCustody.provisionTrial(runtime.directory, s, now);
  return { trialId: s.trialId, policyDigest: s.policyDigest };
}

async function main(args: string[]): Promise<void> {
  try {
    if (args.length !== 2 || args[0] !== '--policy' || !args[1]) throw new Error('REFUSED');
    const result = await provisionJevTrial(args[1]);
    process.stdout.write(JSON.stringify({ status: 'PROVISIONED', ...result }) + '\n');
  } catch {
    process.stderr.write('JEV_TRIAL_PROVISIONING_REFUSED\n');
    process.exitCode = 1;
  }
}

if (require.main === module) void main(process.argv.slice(2));
