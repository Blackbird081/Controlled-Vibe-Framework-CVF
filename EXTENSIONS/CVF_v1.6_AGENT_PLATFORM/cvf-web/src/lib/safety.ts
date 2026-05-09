const INJECTION_PATTERNS = [
    /ignore\s+previous\s+instructions/i,
    /system:\s*you are/i,
    /<\s*script/i,
    /```(?:javascript|python|bash)/i,
];

const PII_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
    /\b\d{16}\b/, // card number naive
    /\b(?:passport|cmnd|căn\s*cước)/i,
    /\bsecret\b|\bapi[_-]?key\b/i,
];

export function applySafetyFilters(text: string): { blocked: boolean; reason?: string; details?: string[] } {
    const hits: string[] = [];

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
            hits.push(`Prompt injection pattern matched: ${pattern}`);
        }
    }

    for (const pattern of PII_PATTERNS) {
        if (pattern.test(text)) {
            hits.push(`Potential sensitive/PII detected: ${pattern}`);
        }
    }

    if (hits.length > 0) {
        return { blocked: true, reason: 'Safety filter triggered', details: hits };
    }

    return { blocked: false };
}
