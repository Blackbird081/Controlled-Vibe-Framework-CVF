import type { NextRequest } from 'next/server';
import { draftRouteHandlers } from '@/lib/server/html-draft-recovery-api';
import { resolveHtmlDraftSyntheticProfile } from '@/lib/server/html-draft-synthetic-profile';

export async function POST(request: NextRequest) { return draftRouteHandlers(resolveHtmlDraftSyntheticProfile() ?? {}).POST(request); }
export async function GET(request: NextRequest) { return draftRouteHandlers(resolveHtmlDraftSyntheticProfile() ?? {}).GET(request); }
