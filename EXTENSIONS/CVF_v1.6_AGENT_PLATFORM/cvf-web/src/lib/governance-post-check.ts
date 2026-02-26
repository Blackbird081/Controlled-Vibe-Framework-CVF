'use client';

/**
 * CVF Governance Post-Processing Check
 *
 * Scans AI Agent responses after generation to detect governance violations.
 * If the response involves bug fixes or test execution but doesn't mention
 * the required documentation files, a warning is injected.
 *
 * Policy references:
 * - governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md
 * - governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md
 */

// ==================== TYPES ====================

export interface GovernanceViolation {
    type: 'bug_doc_missing' | 'test_doc_missing' | 'compat_gate_missing';
    severity: 'warning' | 'error';
    message: string;
}

export interface GovernancePostResult {
    violations: GovernanceViolation[];
    suggestions: string[];
    hasBugFixContext: boolean;
    hasTestContext: boolean;
    hasCodeChangeContext: boolean;
}

// ==================== PATTERN DETECTION ====================

const BUG_FIX_PATTERNS = [
    /\bfix(?:ed|es|ing)?\b/i,
    /\bbug\b/i,
    /\berror\b/i,
    /\bresolv(?:e|ed|ing)\b/i,
    /\bpatch(?:ed|ing)?\b/i,
    /\bhotfix\b/i,
    /\bdebug(?:ged|ging)?\b/i,
    /\bworkaround\b/i,
    /\broot\s*cause\b/i,
    /\bhydration\s*error\b/i,
    /\bcrash(?:ed|es|ing)?\b/i,
];

const TEST_PATTERNS = [
    /\b(?:npm|npx)\s+(?:run\s+)?test\b/i,
    /\bvitest\b/i,
    /\bjest\b/i,
    /\bcoverage\b/i,
    /\bregression\b/i,
    /\btest(?:ed|ing|s)?\s+(?:pass|fail|run)/i,
    /\bunit\s+test/i,
    /\bintegration\s+test/i,
    /\be2e\s+test/i,
    /\btest\s+suite\b/i,
    /\.test\.tsx?\b/,
    /\.spec\.tsx?\b/,
];

const CODE_CHANGE_PATTERNS = [
    /\bmodified\b/i,
    /\bcreated\s+(?:file|component|module)/i,
    /\bupdated\s+(?:file|component|module)/i,
    /\brefactor/i,
    /```(?:typescript|javascript|tsx|jsx|python)/,
];

const BUG_HISTORY_MENTION = /BUG_HISTORY\.md/i;
const TEST_LOG_MENTION = /(?:INCREMENTAL_TEST_LOG|TEST_LOG)\.md/i;
const COMPAT_GATE_MENTION = /check_(?:core|bug_doc|test_doc)_compat/i;

// ==================== DETECTION FUNCTIONS ====================

function detectBugFixContext(response: string, userMessage: string): boolean {
    const combined = `${response} ${userMessage}`;
    const matchCount = BUG_FIX_PATTERNS.filter(p => p.test(combined)).length;
    // Require at least 2 bug-related patterns to avoid false positives
    return matchCount >= 2;
}

function detectTestContext(response: string, userMessage: string): boolean {
    const combined = `${response} ${userMessage}`;
    return TEST_PATTERNS.some(p => p.test(combined));
}

function detectCodeChangeContext(response: string): boolean {
    return CODE_CHANGE_PATTERNS.some(p => p.test(response));
}

function mentionsBugHistory(response: string): boolean {
    return BUG_HISTORY_MENTION.test(response);
}

function mentionsTestLog(response: string): boolean {
    return TEST_LOG_MENTION.test(response);
}

function mentionsCompatGate(response: string): boolean {
    return COMPAT_GATE_MENTION.test(response);
}

// ==================== MAIN CHECK ====================

export function checkResponseGovernance(
    responseText: string,
    userMessage: string,
    language: 'vi' | 'en'
): GovernancePostResult {
    const violations: GovernanceViolation[] = [];
    const suggestions: string[] = [];

    const hasBugFixContext = detectBugFixContext(responseText, userMessage);
    const hasTestContext = detectTestContext(responseText, userMessage);
    const hasCodeChangeContext = detectCodeChangeContext(responseText);

    // Check 1: Bug fix without BUG_HISTORY mention
    if (hasBugFixContext && !mentionsBugHistory(responseText)) {
        violations.push({
            type: 'bug_doc_missing',
            severity: 'warning',
            message: language === 'vi'
                ? '📝 **Governance Check:** Phát hiện nội dung sửa bug nhưng chưa đề cập `docs/BUG_HISTORY.md`. Hãy thêm entry ghi nhận bug này.'
                : '📝 **Governance Check:** Bug fix detected but `docs/BUG_HISTORY.md` not mentioned. Please add an entry to document this bug.',
        });
        suggestions.push(language === 'vi'
            ? 'Chạy: `python governance/compat/check_bug_doc_compat.py --enforce`'
            : 'Run: `python governance/compat/check_bug_doc_compat.py --enforce`'
        );
    }

    // Check 2: Test execution without TEST_LOG mention
    if (hasTestContext && !mentionsTestLog(responseText)) {
        violations.push({
            type: 'test_doc_missing',
            severity: 'warning',
            message: language === 'vi'
                ? '🧪 **Governance Check:** Phát hiện nội dung test nhưng chưa đề cập `docs/CVF_INCREMENTAL_TEST_LOG.md`. Hãy thêm batch entry ghi nhận kết quả test.'
                : '🧪 **Governance Check:** Test execution detected but `docs/CVF_INCREMENTAL_TEST_LOG.md` not mentioned. Please add a batch entry to log results.',
        });
        suggestions.push(language === 'vi'
            ? 'Chạy: `python governance/compat/check_test_doc_compat.py --enforce`'
            : 'Run: `python governance/compat/check_test_doc_compat.py --enforce`'
        );
    }

    // Check 3: Code changes without compat gate mention (advisory only)
    if (hasCodeChangeContext && !hasBugFixContext && !hasTestContext && !mentionsCompatGate(responseText)) {
        suggestions.push(language === 'vi'
            ? '💡 Tip: Chạy `python governance/compat/check_core_compat.py` để kiểm tra scope ảnh hưởng.'
            : '💡 Tip: Run `python governance/compat/check_core_compat.py` to check impact scope.'
        );
    }

    return {
        violations,
        suggestions,
        hasBugFixContext,
        hasTestContext,
        hasCodeChangeContext,
    };
}
