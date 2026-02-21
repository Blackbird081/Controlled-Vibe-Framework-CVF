/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    DEFAULT_GOVERNANCE_STATE,
    PHASE_OPTIONS,
    ROLE_OPTIONS,
    RISK_OPTIONS,
    isRiskAllowed,
    getAllowedActions,
    buildGovernanceSystemPrompt,
    buildSelfUATPrompt,
    parseSelfUATResponse,
    autoDetectGovernance,
    buildGovernanceSpecBlock,
    saveGovernanceState,
    loadGovernanceState,
    type GovernanceState,
    type CVFPhaseToolkit,
    type CVFRole,
    type CVFRiskLevel,
} from './governance-context';

describe('governance-context', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('constants', () => {
        it('DEFAULT_GOVERNANCE_STATE has correct defaults', () => {
            expect(DEFAULT_GOVERNANCE_STATE.phase).toBe('INTAKE');
            expect(DEFAULT_GOVERNANCE_STATE.role).toBe('ANALYST');
            expect(DEFAULT_GOVERNANCE_STATE.riskLevel).toBe('R1');
            expect(DEFAULT_GOVERNANCE_STATE.toolkitEnabled).toBe(false);
        });

        it('PHASE_OPTIONS has all 5 phases', () => {
            expect(PHASE_OPTIONS).toHaveLength(5);
            const values = PHASE_OPTIONS.map(p => p.value);
            expect(values).toEqual(['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE']);
        });

        it('ROLE_OPTIONS has all 5 roles', () => {
            expect(ROLE_OPTIONS).toHaveLength(5);
            const values = ROLE_OPTIONS.map(r => r.value);
            expect(values).toEqual(['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR']);
        });

        it('RISK_OPTIONS has R0-R4', () => {
            expect(RISK_OPTIONS).toHaveLength(5);
            const values = RISK_OPTIONS.map(r => r.value);
            expect(values).toEqual(['R0', 'R1', 'R2', 'R3', 'R4']);
        });

        it('all options have bilingual labels', () => {
            PHASE_OPTIONS.forEach(p => {
                expect(p.label).toBeTruthy();
                expect(p.labelEn).toBeTruthy();
                expect(p.icon).toBeTruthy();
            });
            ROLE_OPTIONS.forEach(r => {
                expect(r.label).toBeTruthy();
                expect(r.labelEn).toBeTruthy();
            });
            RISK_OPTIONS.forEach(r => {
                expect(r.label).toBeTruthy();
                expect(r.labelEn).toBeTruthy();
            });
        });
    });

    describe('isRiskAllowed', () => {
        it('allows R0 and R1 in INTAKE (max R1)', () => {
            expect(isRiskAllowed('R0', 'INTAKE')).toBe(true);
            expect(isRiskAllowed('R1', 'INTAKE')).toBe(true);
        });

        it('blocks R2+ in INTAKE', () => {
            expect(isRiskAllowed('R2', 'INTAKE')).toBe(false);
            expect(isRiskAllowed('R3', 'INTAKE')).toBe(false);
        });

        it('allows up to R2 in DESIGN', () => {
            expect(isRiskAllowed('R0', 'DESIGN')).toBe(true);
            expect(isRiskAllowed('R2', 'DESIGN')).toBe(true);
            expect(isRiskAllowed('R3', 'DESIGN')).toBe(false);
        });

        it('allows up to R3 in BUILD', () => {
            expect(isRiskAllowed('R3', 'BUILD')).toBe(true);
        });

        it('allows up to R2 in REVIEW', () => {
            expect(isRiskAllowed('R2', 'REVIEW')).toBe(true);
            expect(isRiskAllowed('R3', 'REVIEW')).toBe(false);
        });

        it('allows up to R4 in FREEZE', () => {
            expect(isRiskAllowed('R0', 'FREEZE')).toBe(true);
            expect(isRiskAllowed('R4', 'FREEZE')).toBe(true);
        });
    });

    describe('getAllowedActions', () => {
        it('returns actions for INTAKE/ANALYST', () => {
            const actions = getAllowedActions('INTAKE', 'ANALYST');
            expect(actions).toContain('read context');
            expect(actions).toContain('analyze inputs');
        });

        it('returns empty array for FREEZE/BUILDER', () => {
            const actions = getAllowedActions('FREEZE', 'BUILDER');
            expect(actions).toEqual([]);
        });

        it('returns write code for BUILD/BUILDER', () => {
            const actions = getAllowedActions('BUILD', 'BUILDER');
            expect(actions).toContain('write code');
            expect(actions).toContain('run tests');
        });

        it('returns governor-specific actions', () => {
            expect(getAllowedActions('INTAKE', 'GOVERNOR')).toContain('set constraints');
            expect(getAllowedActions('DESIGN', 'GOVERNOR')).toContain('approve design');
            expect(getAllowedActions('REVIEW', 'GOVERNOR')).toContain('final approval');
        });

        it('returns OBSERVER read-only in BUILD', () => {
            const actions = getAllowedActions('BUILD', 'OBSERVER');
            expect(actions).toEqual(['read code']);
        });
    });

    describe('buildGovernanceSystemPrompt', () => {
        const state: GovernanceState = {
            phase: 'BUILD',
            role: 'BUILDER',
            riskLevel: 'R2',
            toolkitEnabled: true,
        };

        it('generates Vietnamese prompt', () => {
            const prompt = buildGovernanceSystemPrompt(state, 'vi');
            expect(prompt).toContain('CVF GOVERNANCE TOOLKIT');
            expect(prompt).toContain('Phase: BUILD');
            expect(prompt).toContain('Role: BUILDER');
            expect(prompt).toContain('Risk Level: R2');
            expect(prompt).toContain('write code');
            expect(prompt).toContain('QUY TẮC BẮT BUỘC');
        });

        it('generates English prompt', () => {
            const prompt = buildGovernanceSystemPrompt(state, 'en');
            expect(prompt).toContain('CVF GOVERNANCE TOOLKIT');
            expect(prompt).toContain('Phase: BUILD');
            expect(prompt).toContain('MANDATORY RULES');
            expect(prompt).toContain('REFUSAL TEMPLATE');
        });

        it('shows risk warning when risk exceeds max', () => {
            const highRiskState: GovernanceState = { ...state, phase: 'INTAKE', riskLevel: 'R3' };
            const prompt = buildGovernanceSystemPrompt(highRiskState, 'en');
            expect(prompt).toContain('❌ NO — STOP AND WARN');
        });

        it('shows risk valid when within limit', () => {
            const prompt = buildGovernanceSystemPrompt(state, 'en');
            expect(prompt).toContain('✅ YES');
        });

        it('shows no actions message for empty actions', () => {
            const freezeBuilder: GovernanceState = { ...state, phase: 'FREEZE', role: 'BUILDER' };
            const prompt = buildGovernanceSystemPrompt(freezeBuilder, 'en');
            expect(prompt).toContain('NO actions allowed');
        });

        it('shows no actions in Vietnamese for FREEZE/BUILDER', () => {
            const freezeBuilder: GovernanceState = { ...state, phase: 'FREEZE', role: 'BUILDER' };
            const prompt = buildGovernanceSystemPrompt(freezeBuilder, 'vi');
            expect(prompt).toContain('KHÔNG CÓ hành động nào');
        });
    });

    describe('buildSelfUATPrompt', () => {
        const state: GovernanceState = {
            phase: 'REVIEW',
            role: 'REVIEWER',
            riskLevel: 'R2',
            toolkitEnabled: true,
        };

        it('generates Vietnamese UAT prompt', () => {
            const prompt = buildSelfUATPrompt(state, 'vi');
            expect(prompt).toContain('Self-UAT');
            expect(prompt).toContain('Phase=REVIEW');
            expect(prompt).toContain('Role=REVIEWER');
            expect(prompt).toContain('governance_awareness');
            expect(prompt).toContain('phase_discipline');
            expect(prompt).toContain('JSON');
        });

        it('generates English UAT prompt', () => {
            const prompt = buildSelfUATPrompt(state, 'en');
            expect(prompt).toContain('Self-UAT');
            expect(prompt).toContain('Phase=REVIEW');
            expect(prompt).toContain('risk_boundary');
            expect(prompt).toContain('refusal_quality');
        });
    });

    describe('parseSelfUATResponse', () => {
        it('parses valid JSON response with all PASS', () => {
            const response = `\`\`\`json
{
  "results": [
    {"category": "governance_awareness", "status": "PASS", "evidence": "Can declare"},
    {"category": "phase_discipline", "status": "PASS", "evidence": "Refuses correctly"},
    {"category": "role_authority", "status": "PASS", "evidence": "Checked"},
    {"category": "risk_boundary", "status": "PASS", "evidence": "Warns properly"},
    {"category": "skill_governance", "status": "PASS", "evidence": "Uses allowed only"},
    {"category": "refusal_quality", "status": "PASS", "evidence": "Cites rules"}
  ],
  "final_result": "PASS",
  "production_mode": "ENABLED"
}
\`\`\``;
            const summary = parseSelfUATResponse(response, 'en');
            expect(summary.finalResult).toBe('PASS');
            expect(summary.productionMode).toBe('ENABLED');
            expect(summary.score).toBe(100);
            expect(summary.results).toHaveLength(6);
            summary.results.forEach(r => expect(r.status).toBe('PASS'));
        });

        it('parses mixed results', () => {
            const response = `{
  "results": [
    {"category": "governance_awareness", "status": "PASS", "evidence": "ok"},
    {"category": "phase_discipline", "status": "FAIL", "evidence": "missed"},
    {"category": "role_authority", "status": "PASS", "evidence": "ok"},
    {"category": "risk_boundary", "status": "FAIL", "evidence": "missed"},
    {"category": "skill_governance", "status": "PASS", "evidence": "ok"},
    {"category": "refusal_quality", "status": "PASS", "evidence": "ok"}
  ],
  "final_result": "FAIL",
  "production_mode": "BLOCKED"
}`;
            const summary = parseSelfUATResponse(response, 'en');
            expect(summary.finalResult).toBe('FAIL');
            expect(summary.productionMode).toBe('BLOCKED');
            expect(summary.score).toBe(67); // 4/6 pass
        });

        it('returns all FAIL for unparseable text', () => {
            const summary = parseSelfUATResponse('This is not JSON at all', 'en');
            expect(summary.finalResult).toBe('FAIL');
            expect(summary.productionMode).toBe('BLOCKED');
            expect(summary.score).toBe(0);
            expect(summary.results).toHaveLength(6);
            summary.results.forEach(r => expect(r.status).toBe('FAIL'));
        });

        it('returns all FAIL for unparseable text in Vietnamese', () => {
            const summary = parseSelfUATResponse('invalid', 'vi');
            expect(summary.results[0].evidence).toContain('Không thể phân tích');
            expect(summary.results[0].categoryLabel).toBe('Nhận thức Governance');
        });

        it('fills missing categories with FAIL', () => {
            const partial = `{"results": [{"category": "governance_awareness", "status": "PASS", "evidence": "ok"}], "final_result": "FAIL", "production_mode": "BLOCKED"}`;
            const summary = parseSelfUATResponse(partial, 'en');
            expect(summary.results).toHaveLength(6);
            const passCount = summary.results.filter(r => r.status === 'PASS').length;
            expect(passCount).toBe(1);
        });

        it('uses category labels in correct language', () => {
            const response = `{"results": [], "final_result": "FAIL", "production_mode": "BLOCKED"}`;
            const enSummary = parseSelfUATResponse(response, 'en');
            expect(enSummary.results[0].categoryLabel).toBe('Governance Awareness');

            const viSummary = parseSelfUATResponse(response, 'vi');
            expect(viSummary.results[0].categoryLabel).toBe('Nhận thức Governance');
        });

        it('extracts JSON from raw braces without fences', () => {
            const response = `Here is my analysis: {"results": [{"category": "governance_awareness", "status": "PASS", "evidence": "ok"}], "final_result": "PASS", "production_mode": "ENABLED"} end.`;
            const summary = parseSelfUATResponse(response, 'en');
            expect(summary.results[0].status).toBe('PASS');
        });
    });

    describe('autoDetectGovernance', () => {
        it('detects BUILD phase from message keywords', () => {
            const result = autoDetectGovernance({ messageText: 'Please create a new component' });
            expect(result.phase).toBe('BUILD');
        });

        it('detects REVIEW phase', () => {
            const result = autoDetectGovernance({ messageText: 'Review this code for bugs' });
            expect(result.phase).toBe('REVIEW');
        });

        it('detects DESIGN phase', () => {
            const result = autoDetectGovernance({ messageText: 'Design the architecture for this system' });
            expect(result.phase).toBe('DESIGN');
        });

        it('defaults to INTAKE for analysis/research', () => {
            const result = autoDetectGovernance({ messageText: 'Analyze the market trends' });
            expect(result.phase).toBe('INTAKE');
        });

        it('overrides to INTAKE for full export mode', () => {
            const result = autoDetectGovernance({
                messageText: 'Please build something',
                exportMode: 'full',
            });
            expect(result.phase).toBe('INTAKE');
        });

        it('maps template category to role', () => {
            expect(autoDetectGovernance({ templateCategory: 'Technical' }).role).toBe('BUILDER');
            expect(autoDetectGovernance({ templateCategory: 'Business' }).role).toBe('ANALYST');
            expect(autoDetectGovernance({ templateCategory: 'Security & Compliance' }).role).toBe('REVIEWER');
            expect(autoDetectGovernance({ templateCategory: 'Strategy' }).role).toBe('GOVERNOR');
        });

        it('overrides role from message text', () => {
            const result = autoDetectGovernance({ messageText: 'Observe and monitor the process' });
            expect(result.role).toBe('OBSERVER');
        });

        it('detects governor role from keywords', () => {
            const result = autoDetectGovernance({ messageText: 'Approve this policy decision' });
            expect(result.role).toBe('GOVERNOR');
        });

        it('maps template category to risk level', () => {
            expect(autoDetectGovernance({ templateCategory: 'Content' }).riskLevel).toBe('R0');
            expect(autoDetectGovernance({ templateCategory: 'Technical' }).riskLevel).toBe('R2');
        });

        it('elevates risk for security keywords', () => {
            const result = autoDetectGovernance({ messageText: 'Deploy to production server' });
            expect(result.riskLevel).toBe('R3');
        });

        it('elevates risk for database keywords', () => {
            const result = autoDetectGovernance({ messageText: 'Modify the database schema' });
            expect(result.riskLevel).toBe('R2');
        });

        it('detects explicit risk level from text', () => {
            const result = autoDetectGovernance({ messageText: 'This task is R3 risk' });
            expect(result.riskLevel).toBe('R3');
        });

        it('returns low confidence with few signals', () => {
            const result = autoDetectGovernance({});
            expect(result.confidence).toBe('low');
        });

        it('returns medium confidence with 2 signals', () => {
            const result = autoDetectGovernance({
                templateCategory: 'Technical',
                messageText: 'Build a REST API endpoint for user management',
            });
            expect(result.confidence).toBe('medium');
        });

        it('returns high confidence with 3 signals', () => {
            const result = autoDetectGovernance({
                templateCategory: 'Technical',
                messageText: 'Build a REST API endpoint for user management',
                exportMode: 'governance',
            });
            expect(result.confidence).toBe('high');
        });

        it('defaults to ANALYST when no category', () => {
            const result = autoDetectGovernance({ messageText: 'hello' });
            expect(result.role).toBe('ANALYST');
        });

        it('defaults to R1 when no category', () => {
            const result = autoDetectGovernance({ messageText: 'hello' });
            expect(result.riskLevel).toBe('R1');
        });

        it('detects REVIEWER role in REVIEW phase', () => {
            const result = autoDetectGovernance({ messageText: 'Review and evaluate this proposal' });
            expect(result.role).toBe('REVIEWER');
            expect(result.phase).toBe('REVIEW');
        });
    });

    describe('buildGovernanceSpecBlock', () => {
        const state: GovernanceState = {
            phase: 'BUILD',
            role: 'BUILDER',
            riskLevel: 'R2',
            toolkitEnabled: true,
        };

        it('generates Vietnamese spec block', () => {
            const block = buildGovernanceSpecBlock(state, 'vi');
            expect(block).toContain('CVF GOVERNANCE CONTEXT');
            expect(block).toContain('Phase | BUILD');
            expect(block).toContain('Role | BUILDER');
            expect(block).toContain('write code');
            expect(block).toContain('Quy tắc bắt buộc');
        });

        it('generates English spec block', () => {
            const block = buildGovernanceSpecBlock(state, 'en');
            expect(block).toContain('CVF GOVERNANCE CONTEXT');
            expect(block).toContain('Phase | BUILD');
            expect(block).toContain('Mandatory Rules');
        });

        it('shows warning for invalid risk', () => {
            // R2 is now valid in FREEZE (max R4). Use a role with no actions to test.
            const highRisk: GovernanceState = { ...state, phase: 'INTAKE', riskLevel: 'R3' };
            const block = buildGovernanceSpecBlock(highRisk, 'en');
            expect(block).toContain('❌ WARNING');
        });

        it('shows no actions for empty action set', () => {
            const freezeBuilder: GovernanceState = { ...state, phase: 'FREEZE', role: 'BUILDER' };
            const block = buildGovernanceSpecBlock(freezeBuilder, 'en');
            expect(block).toContain('No actions allowed');
        });

        it('shows no actions in Vietnamese', () => {
            const freezeBuilder: GovernanceState = { ...state, phase: 'FREEZE', role: 'BUILDER' };
            const block = buildGovernanceSpecBlock(freezeBuilder, 'vi');
            expect(block).toContain('Không có hành động nào');
        });
    });

    describe('saveGovernanceState / loadGovernanceState', () => {
        it('saves and loads state from localStorage', () => {
            const state: GovernanceState = {
                phase: 'DESIGN',
                role: 'GOVERNOR',
                riskLevel: 'R2',
                toolkitEnabled: true,
            };
            saveGovernanceState(state);
            const loaded = loadGovernanceState();
            expect(loaded.phase).toBe('DESIGN');
            expect(loaded.role).toBe('GOVERNOR');
            expect(loaded.riskLevel).toBe('R2');
        });

        it('returns default state when nothing saved', () => {
            const loaded = loadGovernanceState();
            expect(loaded).toEqual(DEFAULT_GOVERNANCE_STATE);
        });

        it('handles corrupted localStorage gracefully', () => {
            localStorage.setItem('cvf_governance_state', 'not-json');
            const loaded = loadGovernanceState();
            expect(loaded).toEqual(DEFAULT_GOVERNANCE_STATE);
        });

        it('merges partial saved state with defaults', () => {
            localStorage.setItem('cvf_governance_state', JSON.stringify({ phase: 'FREEZE' }));
            const loaded = loadGovernanceState();
            expect(loaded.phase).toBe('FREEZE');
            expect(loaded.role).toBe('ANALYST'); // from default
        });
    });
});
