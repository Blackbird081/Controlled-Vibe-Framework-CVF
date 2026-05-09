export const CVF_IMPERSONATION_COOKIE = 'cvf_impersonation';

export function parseCookieHeader(rawCookieHeader: string | null | undefined): Record<string, string> {
  if (!rawCookieHeader) return {};

  return rawCookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) return accumulator;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!key) return accumulator;

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

export function buildImpersonationCookieValue(sessionId: string): string {
  return encodeURIComponent(sessionId);
}
