import type { TeamRole } from 'cvf-guard-contract/enterprise';

export type OAuthProviderId = 'github' | 'google';

export interface OAuthIdentityBinding {
  provider: OAuthProviderId;
  providerAccountId: string;
  userId: string;
  role: TeamRole;
  orgId: string;
  teamId: string;
}

const ROLES = new Set<TeamRole>(['owner', 'admin', 'developer', 'reviewer', 'viewer']);
const FIELDS = ['provider', 'providerAccountId', 'userId', 'role', 'orgId', 'teamId'];

export function isOAuthProviderId(value: unknown): value is OAuthProviderId {
  return value === 'github' || value === 'google';
}

export function parseOAuthIdentityBindings(raw: string | undefined): OAuthIdentityBinding[] {
  if (!raw?.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('CVF OAuth identity bindings must be valid JSON.');
  }
  if (!Array.isArray(parsed)) throw new Error('CVF OAuth identity bindings must be an array.');

  const seen = new Set<string>();
  return parsed.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error(`CVF OAuth identity binding ${index} must be an object.`);
    }
    const row = candidate as Record<string, unknown>;
    if (Object.keys(row).sort().join(',') !== [...FIELDS].sort().join(',') ||
      !isOAuthProviderId(row.provider) ||
      !FIELDS.slice(1).every((field) => typeof row[field] === 'string' && (row[field] as string).trim() === row[field] && Boolean(row[field])) ||
      !ROLES.has(row.role as TeamRole)) {
      throw new Error(`CVF OAuth identity binding ${index} is malformed.`);
    }
    const binding = row as unknown as OAuthIdentityBinding;
    const key = `${binding.provider}:${binding.providerAccountId}`;
    if (seen.has(key)) throw new Error(`CVF OAuth identity binding ${index} duplicates a provider subject.`);
    seen.add(key);
    return binding;
  });
}

export function findOAuthIdentityBinding(
  raw: string | undefined,
  provider: unknown,
  providerAccountId: unknown,
): OAuthIdentityBinding | null {
  if (!isOAuthProviderId(provider) || typeof providerAccountId !== 'string' || !providerAccountId) return null;
  return parseOAuthIdentityBindings(raw).find(
    (binding) => binding.provider === provider && binding.providerAccountId === providerAccountId,
  ) ?? null;
}
