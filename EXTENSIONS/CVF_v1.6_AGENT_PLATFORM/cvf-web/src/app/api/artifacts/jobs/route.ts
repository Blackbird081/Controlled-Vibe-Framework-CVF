import { jobRouteHandlers } from '@/lib/server/html-job-api';
import { resolveHtmlJobSyntheticProfile } from '@/lib/server/html-job-synthetic-profile';
import { loadHtmlPilotRuntimeProfile } from '@/lib/server/ncr-html-pilot-runtime-profile';

const handlers = async () => process.env.CVF_NCR_HTML_PILOT_MANIFEST_PATH
  ? jobRouteHandlers({ pilot: await loadHtmlPilotRuntimeProfile() })
  : jobRouteHandlers({ profile: resolveHtmlJobSyntheticProfile() });
export const GET = async (request: Parameters<ReturnType<typeof jobRouteHandlers>['GET']>[0]) => (await handlers()).GET(request);
export const POST = async (request: Parameters<ReturnType<typeof jobRouteHandlers>['POST']>[0]) => (await handlers()).POST(request);
