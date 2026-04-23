export const DEEPSEEK_API_KEY_ENV_NAMES = [
  'DEEPSEEK_API_KEY',
  'CVF_BENCHMARK_DEEPSEEK_KEY',
  'CVF_DEEPSEEK_API_KEY',
] as const;

export function resolveDeepSeekApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  for (const envName of DEEPSEEK_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }

  return undefined;
}

export function resolveDeepSeekApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const envName of DEEPSEEK_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return envName;
    }
  }

  return null;
}

export function isDeepSeekApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return typeof resolveDeepSeekApiKey(env) === 'string';
}
