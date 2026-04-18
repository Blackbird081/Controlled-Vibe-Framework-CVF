/**
 * W101-T1 — Knowledge-Native Execute Path Integration
 *
 * Provides the knowledge context injection helper used by /api/execute.
 * Takes a base system prompt and a pre-governed knowledge context string and
 * returns an enriched system prompt with a governed knowledge context block appended.
 *
 * Authorization: docs/baselines/CVF_GC018_W101_T1_KNOWLEDGE_NATIVE_EXECUTE_PATH_INTEGRATION_AUTHORIZATION_2026-04-17.md
 */

const CONTEXT_BLOCK_HEADER = [
    '',
    '---',
    '',
    '## GOVERNED KNOWLEDGE CONTEXT',
    '',
    'The following context comes from governed, approved knowledge artifacts.',
    'Prioritize this context when addressing the user request.',
    'If this context contradicts general training knowledge on the covered domain,',
    'the context below takes precedence.',
    '',
].join('\n');

const CONTEXT_BLOCK_FOOTER = [
    '',
    '---',
    '',
].join('\n');

/**
 * Returns an enriched system prompt with the given knowledge context appended.
 * If context is empty or whitespace-only, returns the base prompt unchanged.
 */
export function buildKnowledgeSystemPrompt(
    basePrompt: string,
    context: string,
    _scope?: { orgId?: string; teamId?: string },
): string {
    void _scope;
    const trimmed = context.trim();
    if (!trimmed) return basePrompt;
    return basePrompt + CONTEXT_BLOCK_HEADER + trimmed + CONTEXT_BLOCK_FOOTER;
}

/**
 * Returns true when a knowledge context string is present and non-empty.
 */
export function hasKnowledgeContext(context: string | undefined): context is string {
    return typeof context === 'string' && context.trim().length > 0;
}
