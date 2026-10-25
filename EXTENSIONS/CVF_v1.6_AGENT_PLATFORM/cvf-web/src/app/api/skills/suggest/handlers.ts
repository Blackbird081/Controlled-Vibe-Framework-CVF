import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { loadVisibleSkills, suggestJevSkill, JevAdapterError, type SkillSuggestion } from '@/lib/server/jev-capability-suggestion';

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Origin' },
});

function sameOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    return !!origin && origin === new URL(request.url).origin && (!site || site === 'same-origin');
  } catch { return false; }
}

type Dependencies = {
  auth?: typeof requireAdminApiSession;
  key?: () => string | undefined;
  run?: (goal: string, key: string) => Promise<SkillSuggestion>;
};

export function skillSuggestionHandlers(deps: Dependencies = {}) {
  const auth = deps.auth ?? requireAdminApiSession;
  const key = deps.key ?? (() => process.env.CVF_JEV_SUGGESTION_ENABLED === '1' ? process.env.TYPESAFE_API_KEY : undefined);
  const run = deps.run ?? (async (goal: string, secret: string) => suggestJevSkill(goal, secret, await loadVisibleSkills()));
  async function principal(request: NextRequest): Promise<NextResponse | null> {
    const session = await auth(request, '/api/skills/suggest', { allowBreakGlass: false });
    if (session instanceof NextResponse) return session;
    if (session.authMode !== 'session' || session.realUserId || session.impersonation
      || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return reply(403, { error: 'SESSION_REFUSED' });
    return null;
  }
  return {
    async GET(request: NextRequest): Promise<NextResponse> {
      const denied = await principal(request);
      if (denied) return denied;
      return reply(200, { connected: !!key()?.trim(), provider: 'TypeSafe Jev' });
    },
    async POST(request: NextRequest): Promise<NextResponse> {
      if (!sameOrigin(request)) return reply(403, { error: 'ORIGIN_REFUSED' });
      const denied = await principal(request);
      if (denied) return denied;
      const secret = key()?.trim();
      if (!secret) return reply(503, { error: 'JEV_NOT_CONNECTED' });
      if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return reply(415, { error: 'JSON_REQUIRED' });
      const declared = request.headers.get('content-length');
      if (declared && (!/^\d+$/.test(declared) || Number(declared) > 2500)) return reply(413, { error: 'BODY_TOO_LARGE' });
      let body: unknown;
      try {
        const reader = request.body?.getReader();
        if (!reader) return reply(422, { error: 'INVALID_REQUEST' });
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > 2500) { await reader.cancel(); return reply(413, { error: 'BODY_TOO_LARGE' }); }
          chunks.push(value);
        }
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch { return reply(422, { error: 'INVALID_REQUEST' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || typeof (body as Record<string, unknown>).goal !== 'string'
        || Object.keys(body).join(',') !== 'goal') return reply(422, { error: 'INVALID_REQUEST' });
      const goal = (body as { goal: string }).goal.trim();
      if (goal.length < 8 || goal.length > 1000) return reply(422, { error: 'GOAL_LENGTH' });
      try {
        return reply(200, { provider: 'TypeSafe Jev', result: await run(goal, secret) });
      } catch (error) {
        if (error instanceof JevAdapterError) {
          const status = error.code === 'ROSTER_UNAVAILABLE' ? 503 : 502;
          return reply(status, { error: error.code });
        }
        return reply(502, { error: 'PROVIDER_UNAVAILABLE' });
      }
    },
  };
}
