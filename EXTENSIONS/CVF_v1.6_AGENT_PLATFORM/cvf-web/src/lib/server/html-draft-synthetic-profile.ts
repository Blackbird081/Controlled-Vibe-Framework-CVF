import fs from 'node:fs';
import path from 'node:path';
import type { SyntheticDraftProfile } from './html-draft-snapshot-store';

export const SYNTHETIC_RECORD_PREFIX = 'ncr-synthetic-';
export const SYNTHETIC_MARKER = '.cvf-html-draft-synthetic.json';
export type ResolvedDraftProfile = { profile: SyntheticDraftProfile; recordPrefix: string };

/** Server-only opt-in. No request field can select this profile. */
export function resolveHtmlDraftSyntheticProfile(env: Record<string, string | undefined> = process.env): ResolvedDraftProfile | null {
  if (env.NODE_ENV === 'production' || env.CVF_NCR_DRAFT_PROFILE !== 'LOCAL_SYNTHETIC') return null;
  const root = env.CVF_NCR_DRAFT_ROOT;
  const runId = env.CVF_NCR_DRAFT_RUN_ID;
  if (!root || !runId || !/^[A-Za-z0-9_-]{16,100}$/.test(runId) || !path.isAbsolute(root)
    || path.resolve(root) !== root || root === path.parse(root).root || root.startsWith('\\\\')) return null;
  try {
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(root) !== root) return null;
    const markerPath = path.join(root, SYNTHETIC_MARKER);
    const markerStat = fs.lstatSync(markerPath);
    if (!markerStat.isFile() || markerStat.isSymbolicLink() || markerStat.size > 512 || markerStat.size === 0) return null;
    const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8')) as unknown;
    if (!marker || typeof marker !== 'object' || Array.isArray(marker)) return null;
    const value = marker as Record<string, unknown>;
    if (Object.keys(value).sort().join(',') !== 'kind,runId,schemaVersion,syntheticOnly'
      || value.schemaVersion !== 1 || value.kind !== 'CVF_HTML_DRAFT_SYNTHETIC'
      || value.syntheticOnly !== true || value.runId !== runId) return null;
    return { profile: { kind: 'local-synthetic', root, production: false }, recordPrefix: SYNTHETIC_RECORD_PREFIX };
  } catch { return null; }
}
