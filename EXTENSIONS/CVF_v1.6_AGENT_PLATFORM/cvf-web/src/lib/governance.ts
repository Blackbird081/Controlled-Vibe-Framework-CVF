'use client';

/**
 * CVF Governance Module
 * Handles quality scoring, phase gates, and compliance checks
 */

// ==================== TYPES ====================

export interface QualityScore {
    overall: number;         // 0-100
    completeness: number;    // Did AI answer all parts?
    clarity: number;         // Is response clear and structured?
    actionability: number;   // Can user act on this immediately?
    compliance: number;      // Does it follow CVF rules?
}

/**
 * Enhanced quality score combining client-side format analysis
 * with server-side v1.6.1 4-dimension evaluation (when available).
 */
export interface EnhancedQualityScore extends QualityScore {
    // New from v1.6.1 Governance Engine:
    correctness?: number;   // 0-100
    safety?: number;        // 0-100 (2x weight)
    alignment?: number;     // 0-100
    qualityDim?: number;    // 0-100
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
    source: 'client' | 'server';
}

export interface QualityCriteria {
    hasCodeBlocks: boolean;
    hasStructuredFormat: boolean;
    hasActionableItems: boolean;
    responseLength: number;
    phaseDetected: string | null;
}

export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'retry';

// ==================== QUALITY SCORING ====================

/**
 * Calculate quality score from AI response
 */
export function calculateQualityScore(
    response: string,
    mode: 'simple' | 'governance' | 'full'
): QualityScore {
    const criteria = analyzeResponse(response);

    // Base scores
    let completeness = calculateCompleteness(criteria, response);
    let clarity = calculateClarity(criteria);
    let actionability = calculateActionability(criteria);
    let compliance = calculateCompliance(criteria, mode);

    // Weight based on mode
    let overall: number;
    if (mode === 'simple') {
        // Simple mode: basic quality check
        overall = Math.round(
            completeness * 0.4 +
            clarity * 0.3 +
            actionability * 0.3
        );
    } else if (mode === 'governance') {
        // Governance mode: more emphasis on structure and compliance
        overall = Math.round(
            completeness * 0.3 +
            clarity * 0.25 +
            actionability * 0.25 +
            compliance * 0.2
        );
    } else {
        // Full mode: highest standards, compliance is critical
        overall = Math.round(
            completeness * 0.25 +
            clarity * 0.2 +
            actionability * 0.25 +
            compliance * 0.3
        );
    }

    return {
        overall: Math.min(100, Math.max(0, overall)),
        completeness,
        clarity,
        actionability,
        compliance,
    };
}

/**
 * Analyze response for quality criteria
 */
function analyzeResponse(response: string): QualityCriteria {
    // Check for code blocks
    const hasCodeBlocks = /```[\s\S]*?```/.test(response);

    // Check for structured format (headers, lists, tables)
    const hasHeaders = /^#{1,3}\s/m.test(response);
    const hasLists = /^[-*]\s/m.test(response) || /^\d+\.\s/m.test(response);
    const hasTables = /\|.*\|/.test(response);
    const hasStructuredFormat = hasHeaders || hasLists || hasTables;

    // Check for actionable items
    const hasActionableItems =
        /\bstep\s*\d/i.test(response) ||
        /\[\s*[x\s]\s*\]/i.test(response) ||
        /todo|action|next/i.test(response) ||
        hasCodeBlocks;

    // Detect phase from response
    let phaseDetected: string | null = null;
    if (/PHASE A|Discovery|Khám phá/i.test(response)) phaseDetected = 'Discovery';
    else if (/PHASE B|Design|Thiết kế/i.test(response)) phaseDetected = 'Design';
    else if (/PHASE C|Build|Thực thi/i.test(response)) phaseDetected = 'Build';
    else if (/PHASE D|Review|Đánh giá/i.test(response)) phaseDetected = 'Review';

    return {
        hasCodeBlocks,
        hasStructuredFormat,
        hasActionableItems,
        responseLength: response.length,
        phaseDetected,
    };
}

function calculateCompleteness(criteria: QualityCriteria, response: string): number {
    let score = 50; // Base score

    // Length contributes to completeness
    if (criteria.responseLength > 500) score += 15;
    if (criteria.responseLength > 1000) score += 10;
    if (criteria.responseLength > 2000) score += 10;

    // Having deliverables
    if (criteria.hasCodeBlocks) score += 10;
    if (criteria.hasStructuredFormat) score += 5;

    return Math.min(100, score);
}

function calculateClarity(criteria: QualityCriteria): number {
    let score = 60; // Base score

    if (criteria.hasStructuredFormat) score += 20;
    if (criteria.hasCodeBlocks) score += 10;

    // Penalize very short or very long responses
    if (criteria.responseLength < 100) score -= 20;
    if (criteria.responseLength > 5000) score -= 10;

    return Math.min(100, Math.max(0, score));
}

function calculateActionability(criteria: QualityCriteria): number {
    let score = 50; // Base score

    if (criteria.hasCodeBlocks) score += 25;
    if (criteria.hasActionableItems) score += 15;
    if (criteria.hasStructuredFormat) score += 10;

    return Math.min(100, score);
}

function calculateCompliance(criteria: QualityCriteria, mode: 'simple' | 'governance' | 'full'): number {
    if (mode === 'simple') {
        return 100; // No compliance required for simple mode
    }

    let score = 70; // Base compliance

    // Full mode requires phase structure
    if (mode === 'full') {
        if (criteria.phaseDetected) {
            score += 20;
        } else {
            score -= 20; // Penalty for not following phases
        }
    }

    // Both modes benefit from structured output
    if (criteria.hasStructuredFormat) score += 10;

    return Math.min(100, Math.max(0, score));
}

// ==================== QUALITY BADGE HELPERS ====================

export function getQualityBadgeColor(score: number): string {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
    return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
}

export function getQualityLabel(score: number, language: 'vi' | 'en' = 'vi'): string {
    if (language === 'vi') {
        if (score >= 80) return 'Xuất sắc';
        if (score >= 60) return 'Tốt';
        if (score >= 40) return 'Cần cải thiện';
        return 'Chưa đạt';
    } else {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs improvement';
        return 'Below standard';
    }
}

/**
 * ⚠️ QUALITY SCORE DISCLAIMER
 * Quality scoring evaluates FORMAT and STRUCTURE only (headings, lists, code blocks, length).
 * It does NOT evaluate factual accuracy or detect hallucinations.
 * A well-formatted but factually incorrect response can still score high.
 * Users should always verify critical information independently.
 */
export function getQualityDisclaimer(language: 'vi' | 'en' = 'vi'): string {
    if (language === 'vi') {
        return '⚠️ Điểm chất lượng đánh giá cấu trúc và format, KHÔNG đánh giá tính chính xác nội dung. Hãy luôn kiểm chứng thông tin quan trọng.';
    }
    return '⚠️ Quality score evaluates structure and format only, NOT factual accuracy. Always verify critical information independently.';
}

// ==================== ACCEPTANCE HELPERS ====================

export function shouldRequireAcceptance(mode: 'simple' | 'governance' | 'full'): boolean {
    // Only governance and full modes require explicit acceptance
    return mode !== 'simple';
}

export function canProceedToNextPhase(
    currentPhase: string | null,
    acceptanceStatus: AcceptanceStatus
): boolean {
    // Must be accepted to proceed
    return acceptanceStatus === 'accepted';
}
