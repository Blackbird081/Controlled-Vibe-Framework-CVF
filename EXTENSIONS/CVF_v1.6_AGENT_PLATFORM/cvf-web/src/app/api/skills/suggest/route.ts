import { skillSuggestionHandlers } from './handlers';

export const runtime = 'nodejs';

const handlers = skillSuggestionHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
