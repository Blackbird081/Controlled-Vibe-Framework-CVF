import { jobRouteHandlers } from '@/lib/server/html-job-api';
import { resolveHtmlJobSyntheticProfile } from '@/lib/server/html-job-synthetic-profile';

const handlers = () => jobRouteHandlers({ profile: resolveHtmlJobSyntheticProfile() });
export const GET = (request: Parameters<ReturnType<typeof handlers>['GET']>[0]) => handlers().GET(request);
export const POST = (request: Parameters<ReturnType<typeof handlers>['POST']>[0]) => handlers().POST(request);
