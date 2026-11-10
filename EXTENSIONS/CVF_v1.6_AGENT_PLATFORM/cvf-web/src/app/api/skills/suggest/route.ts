import { skillSuggestionHandlers } from './handlers';
import { loadJevAuthorizedRuntime } from '@/lib/server/jev-authorized-runtime';

export const runtime = 'nodejs';

const handlers = skillSuggestionHandlers({ loadRuntimeSnapshot: loadJevAuthorizedRuntime });
export const GET = handlers.GET;
export const POST = handlers.POST;
