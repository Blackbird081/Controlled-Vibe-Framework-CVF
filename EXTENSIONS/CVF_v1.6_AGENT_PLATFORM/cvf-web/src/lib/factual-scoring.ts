export type FactualRiskLevel = 'low' | 'medium' | 'high';

export interface FactualScoreResult {
    score: number;
    coverage: number;
    alignment: number;
    jaccard: number;
    contextTokens: number;
    responseTokens: number;
    overlap: number;
    risk: FactualRiskLevel;
    notes: string[];
}

const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'was', 'were', 'will', 'would',
    'can', 'could', 'should', 'about', 'into', 'over', 'under', 'your', 'you', 'our', 'their', 'they',
    'we', 'are', 'is', 'of', 'to', 'in', 'on', 'at', 'by', 'as', 'an', 'a', 'it',
    'va', 'la', 'cua', 'cho', 'voi', 'tu', 'den', 'trong', 'tren', 'duoi', 'nhung', 'mot', 'nhieu',
    'ban', 'toi', 'chung', 'tai', 'cac', 'nhu', 'theo', 'khi', 'neu', 'khong', 'co', 'se',
]);

function tokenize(text: string): string[] {
    if (!text) return [];
    const normalized = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
    if (!normalized) return [];
    return normalized
        .split(/\s+/)
        .filter(token => token.length >= 3)
        .filter(token => !STOPWORDS.has(token));
}

function toSet(tokens: string[]): Set<string> {
    return new Set(tokens);
}

export function calculateFactualScore(response: string, context: string): FactualScoreResult {
    const responseTokens = toSet(tokenize(response));
    const contextTokens = toSet(tokenize(context));

    const contextCount = contextTokens.size;
    const responseCount = responseTokens.size;

    if (contextCount === 0 || responseCount === 0) {
        return {
            score: 0,
            coverage: 0,
            alignment: 0,
            jaccard: 0,
            contextTokens: contextCount,
            responseTokens: responseCount,
            overlap: 0,
            risk: 'high',
            notes: ['No reliable context or response tokens to validate.'],
        };
    }

    let overlap = 0;
    responseTokens.forEach(token => {
        if (contextTokens.has(token)) overlap += 1;
    });

    const coverage = overlap / contextCount;
    const alignment = overlap / responseCount;
    const union = contextCount + responseCount - overlap;
    const jaccard = union > 0 ? overlap / union : 0;

    const score = Math.max(
        0,
        Math.min(100, Math.round((coverage * 0.5 + alignment * 0.3 + jaccard * 0.2) * 100))
    );

    const risk: FactualRiskLevel = score >= 65 ? 'low' : score >= 45 ? 'medium' : 'high';
    const notes: string[] = [];
    if (coverage < 0.3) {
        notes.push('Low coverage of provided context.');
    }
    if (alignment < 0.3) {
        notes.push('Response contains many tokens not grounded in context.');
    }

    return {
        score,
        coverage,
        alignment,
        jaccard,
        contextTokens: contextCount,
        responseTokens: responseCount,
        overlap,
        risk,
        notes,
    };
}
