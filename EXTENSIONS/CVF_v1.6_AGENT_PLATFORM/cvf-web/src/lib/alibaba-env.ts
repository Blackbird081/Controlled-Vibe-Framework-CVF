export const ALIBABA_API_KEY_ENV_NAMES = [
  'ALIBABA_API_KEY',
  'DASHSCOPE_API_KEY',
  'CVF_BENCHMARK_ALIBABA_KEY',
  'CVF_ALIBABA_API_KEY',
] as const;

export function resolveAlibabaApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  for (const envName of ALIBABA_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }

  return undefined;
}

export function resolveAlibabaApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const envName of ALIBABA_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return envName;
    }
  }

  return null;
}

export function isAlibabaApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return typeof resolveAlibabaApiKey(env) === 'string';
}
