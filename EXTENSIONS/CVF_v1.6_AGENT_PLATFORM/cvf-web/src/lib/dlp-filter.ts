import { applyDLPPatterns, type DLPResult } from '@/lib/dlp-filter-core';
import { getActiveDLPPolicy } from '@/lib/policy-reader';

export type { DLPMatch, DLPResult } from '@/lib/dlp-filter-core';

export async function applyDLPFilter(text: string): Promise<DLPResult> {
  const policy = await getActiveDLPPolicy();
  return applyDLPPatterns(text, policy?.patterns ?? []);
}
