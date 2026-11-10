import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  isProviderApiKeyConfiguredFromEnv,
  resolveProviderApiKeyFromEnv,
  resolveProviderApiKeySourceNameFromEnv,
} from './provider-api-key-env';

export const ALIBABA_API_KEY_ENV_NAMES = [
  'ALIBABA_API_KEY',
  'DASHSCOPE_API_KEY',
  'CVF_BENCHMARK_ALIBABA_KEY',
  'CVF_ALIBABA_API_KEY',
] as const;

/** Server-local rotation wins over inherited stale process aliases. Explicit test envs stay isolated. */
export function resolveAlibabaRuntimeEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  if (env !== process.env) return env;
  if (env.NODE_ENV === 'test' && env.CVF_LIVE_TEST_SELECTION !== '1') return env;
  const candidates = [path.resolve(process.cwd(), '.cvf/config/alibaba.env.local'),
    path.resolve(process.cwd(), '../../../.cvf/config/alibaba.env.local')];
  const file = candidates.find(candidate => existsSync(candidate));
  if (!file) return env;
  const allowed = new Set<string>([...ALIBABA_API_KEY_ENV_NAMES, 'ALIBABA_BASE_URL',
    'DASHSCOPE_COMPAT_ENDPOINT', 'CVF_ALIBABA_FREE_QUOTA_ONLY', 'CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED']);
  const result = { ...env };
  const content = readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && allowed.has(match[1])) result[match[1]] = match[2].trim();
  }
  // An unconfirmed local scope cannot inherit confirmation from an unrelated process.
  if (!/^CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED=1\s*$/m.test(content)) {
    result.CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED = '0';
  }
  return result;
}

export function resolveAlibabaApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return resolveProviderApiKeyFromEnv(ALIBABA_API_KEY_ENV_NAMES, resolveAlibabaRuntimeEnv(env));
}

export function resolveAlibabaApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return resolveProviderApiKeySourceNameFromEnv(ALIBABA_API_KEY_ENV_NAMES, resolveAlibabaRuntimeEnv(env));
}

export function isAlibabaApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isProviderApiKeyConfiguredFromEnv(ALIBABA_API_KEY_ENV_NAMES, resolveAlibabaRuntimeEnv(env));
}
