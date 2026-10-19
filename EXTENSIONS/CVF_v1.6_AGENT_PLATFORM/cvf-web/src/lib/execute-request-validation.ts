const TEXT_FIELDS = [
    'templateId', 'templateName', 'intent', 'provider', 'model', 'mode',
    'imageUrl', 'imageBase64', 'mimeType', 'cvfPhase', 'cvfRiskLevel',
    'governanceFamily', 'qbsFamily', 'skillPreflightDeclaration',
    'skillPreflightRecordRef', 'knowledgeContext', 'knowledgeCollectionId', 'approvalId',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}


type FieldTypes = Record<string, 'string' | 'boolean' | 'number'>;

function checkFields(value: Record<string, unknown>, fields: FieldTypes, prefix: string): string | undefined {
    for (const [field, type] of Object.entries(fields)) {
        if (value[field] != null && (typeof value[field] !== type || (type === 'number' && !Number.isFinite(value[field])))) {
            return `${prefix}.${field} must be a ${type}.`;
        }
    }
    return undefined;
}

function validateNestedRequests(value: Record<string, unknown>): string | undefined {
    const shapes: Record<string, FieldTypes> = {
        aiCommit: { commitId: 'string', agentId: 'string', timestamp: 'number', description: 'string' },
        aifMemoryReinjection: { enabled: 'boolean', purpose: 'string', scope: 'string' },
        durableMemory: { enabled: 'boolean', tier: 'string', scope: 'string', query: 'string', maxResults: 'number' },
        durableMemoryWrite: { enabled: 'boolean', tier: 'string', scope: 'string', maxSummaryLength: 'number' },
        verticalIntegrationChain: { threadId: 'string', rootReceiptId: 'string', parentReceiptId: 'string', turnIndex: 'number', operatorGoal: 'string' },
    };
    for (const [name, fields] of Object.entries(shapes)) {
        const nested = value[name];
        if (nested == null) continue;
        if (!isRecord(nested)) return `${name} must be a JSON object.`;
        const error = checkFields(nested, fields, name);
        if (error) return error;
        if (['aifMemoryReinjection', 'durableMemory', 'durableMemoryWrite'].includes(name) && nested.policy != null) {
            if (!isRecord(nested.policy)) return `${name}.policy must be a JSON object.`;
            const policyError = checkFields(nested.policy, name === 'aifMemoryReinjection'
                ? { actorAuthorized: 'boolean', canReinject: 'boolean', maxItems: 'number', provenanceScoreThreshold: 'number' }
                : { actorAuthorized: 'boolean' }, `${name}.policy`);
            if (policyError) return policyError;
        }
        if (name === 'aifMemoryReinjection' && nested.memory != null) {
            if (!Array.isArray(nested.memory)) return `${name}.memory must be an array.`;
            for (const item of nested.memory) {
                if (!isRecord(item)) return `${name}.memory items must be JSON objects.`;
                const itemError = checkFields(item, { id: 'string', summary: 'string', scope: 'string', lifecycleState: 'string', containsSecret: 'boolean', provenanceScore: 'number' }, `${name}.memory`);
                if (itemError) return itemError;
            }
        }
    }
    return undefined;
}

/** Shape checks before existing normalization; downstream owners retain semantic/authority checks. */
export function validateExecuteRequestShape(value: unknown): string | undefined {
    if (!isRecord(value)) return 'Execution payload must be a JSON object.';
    for (const field of TEXT_FIELDS) {
        if (value[field] != null && typeof value[field] !== 'string') return `${field} must be a string.`;
    }
    if (typeof value.templateName !== 'string' || !value.templateName.trim() ||
        typeof value.intent !== 'string' || !value.intent.trim() || value.inputs === undefined) {
        return 'Missing required fields: templateName, inputs, intent';
    }
    if (!isRecord(value.inputs)) return 'inputs must be a JSON object.';
    // Preserve legacy scalar-to-string normalization while rejecting nested structures.
    if (Object.values(value.inputs).some(input => input !== null && !['string', 'number', 'boolean'].includes(typeof input))) {
        return 'Input values must be scalar text, numbers, booleans or null.';
    }
    if (value.skillPreflightPassed != null && typeof value.skillPreflightPassed !== 'boolean') return 'skillPreflightPassed must be a boolean.';
    for (const field of ['skillIds', 'fileScope']) {
        if (value[field] != null && (!Array.isArray(value[field]) || !value[field].every(item => typeof item === 'string'))) {
            return `${field} must be a string array.`;
        }
    }
    return validateNestedRequests(value);
}
