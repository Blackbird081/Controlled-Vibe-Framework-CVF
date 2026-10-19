import { resolveHtmlDraftSyntheticProfile, type ResolvedDraftProfile } from './html-draft-synthetic-profile';

export type ResolvedHtmlJobProfile = ResolvedDraftProfile & { jobDecisions: true };

/** The job writer is a second server-only opt-in over the validated draft fixture root. */
export function resolveHtmlJobSyntheticProfile(env: Record<string, string | undefined> = process.env): ResolvedHtmlJobProfile | null {
  if (env.NODE_ENV === 'production' || env.CVF_NCR_HTML_JOB_PROFILE !== 'LOCAL_SYNTHETIC') return null;
  const draft = resolveHtmlDraftSyntheticProfile(env);
  return draft ? { ...draft, profile: { ...draft.profile, jobDecisions: true }, jobDecisions: true } : null;
}
