import type { NextRequest } from 'next/server';
import { draftRouteHandlers } from '@/lib/server/html-draft-recovery-api';
import { resolveHtmlDraftSyntheticProfile } from '@/lib/server/html-draft-synthetic-profile';
import { loadHtmlPilotRuntimeProfile } from '@/lib/server/ncr-html-pilot-runtime-profile';

const handlers = async () => process.env.CVF_NCR_HTML_PILOT_MANIFEST_PATH
  ? draftRouteHandlers({ pilot: await loadHtmlPilotRuntimeProfile() })
  : draftRouteHandlers(resolveHtmlDraftSyntheticProfile() ?? {});
export async function POST(request: NextRequest) { return (await handlers()).POST(request); }
export async function GET(request: NextRequest) { return (await handlers()).GET(request); }
