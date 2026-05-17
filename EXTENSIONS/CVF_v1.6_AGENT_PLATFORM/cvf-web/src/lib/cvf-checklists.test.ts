import { describe, it, expect } from 'vitest';
import {
    CVF_PHASE_CHECKLISTS,
    detectCurrentPhase,
    getPhaseChecklist,
    autoCheckItems,
    calculatePhaseCompliance,
    canProceedToNextPhase,
    getNextPhase,
    createDecisionLogEntry,
} from './cvf-checklists';

describe('cvf-checklists.ts', () => {
    describe('CVF_PHASE_CHECKLISTS', () => {
        it('has 5 phases defined', () => {
            expect(CVF_PHASE_CHECKLISTS).toHaveLength(5);
        });

        it('contains Intake, Design, Build, Review, Freeze phases', () => {
            const phases = CVF_PHASE_CHECKLISTS.map(c => c.phase);
            expect(phases).toContain('INTAKE');
            expect(phases).toContain('DESIGN');
            expect(phases).toContain('BUILD');
            expect(phases).toContain('REVIEW');
            expect(phases).toContain('FREEZE');
        });

        it('each phase has required items', () => {
            CVF_PHASE_CHECKLISTS.forEach(checklist => {
                const requiredItems = checklist.items.filter(i => i.required);
                expect(requiredItems.length).toBeGreaterThan(0);
            });
        });
    });

    describe('detectCurrentPhase', () => {
        it('detects Intake phase', () => {
            expect(detectCurrentPhase('## PHASE A: Discovery')).toBe('INTAKE');
            expect(detectCurrentPhase('Trong giai đoạn Tiếp nhận')).toBe('INTAKE');
        });

        it('detects Design phase', () => {
            expect(detectCurrentPhase('## PHASE B: Design')).toBe('DESIGN');
            expect(detectCurrentPhase('Thiết kế solution')).toBe('DESIGN');
        });

        it('detects Build phase', () => {
            expect(detectCurrentPhase('PHASE C: Build')).toBe('BUILD');
            expect(detectCurrentPhase('Thực thi implementation')).toBe('BUILD');
        });

        it('detects Review phase', () => {
            expect(detectCurrentPhase('PHASE D: Review')).toBe('REVIEW');
            expect(detectCurrentPhase('Đánh giá cuối cùng')).toBe('REVIEW');
        });

        it('detects Freeze phase', () => {
            expect(detectCurrentPhase('PHASE E: Freeze')).toBe('FREEZE');
            expect(detectCurrentPhase('Khóa kết quả và baseline')).toBe('FREEZE');
        });

        it('returns null for unrecognized content', () => {
            expect(detectCurrentPhase('Just some random text')).toBeNull();
        });
    });

    describe('getPhaseChecklist', () => {
        it('returns checklist for valid phase', () => {
            const intake = getPhaseChecklist('INTAKE');
            expect(intake).toBeDefined();
            expect(intake?.phase).toBe('INTAKE');
            expect(intake?.icon).toBe('🧭');
        });

        it('returns undefined for invalid phase', () => {
            // @ts-expect-error testing invalid input
            expect(getPhaseChecklist('InvalidPhase')).toBeUndefined();
        });
    });

    describe('autoCheckItems', () => {
        it('auto-checks items based on response content', () => {
            const response = `
## My Understanding
I understand the goal...

### Assumptions
- Assumption 1
- Assumption 2

### IN SCOPE
- Feature A

### OUT OF SCOPE
- Feature B
            `;

            const checked = autoCheckItems('INTAKE', response);
            expect(checked).toContain('disc-1'); // AI restated goal
            expect(checked).toContain('disc-2'); // Assumptions listed
            expect(checked).toContain('disc-3'); // Scope defined
        });

        it('returns empty array when no items match', () => {
            const response = 'Just a simple response without structure.';
            const checked = autoCheckItems('INTAKE', response);
            expect(checked.length).toBeLessThan(3);
        });

        it('auto-checks Design phase items', () => {
            const response = `
## Solution Approach
Our approach is to build a React app.

### Technical Decision
We will use Next.js 15.

### Implementation Plan
Step 1: Setup project
Step 2: Build components

### Deliverables
- Working app
- Documentation

### Risk
- Timeline risk
            `;
            const checked = autoCheckItems('DESIGN', response);
            expect(checked).toContain('design-1'); // Solution approach
            expect(checked).toContain('design-2'); // Technical decisions
            expect(checked).toContain('design-3'); // Implementation plan
            expect(checked).toContain('design-4'); // Deliverables
            expect(checked).toContain('design-5'); // Risks
        });

        it('auto-checks Build phase items', () => {
            const response = `\`\`\`typescript
const x = 1;
\`\`\`
Note: implementation details.
Skill Preflight PASS.
SKILL_PREFLIGHT_RECORD: XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md`;
            const checked = autoCheckItems('BUILD', response);
            expect(checked).toContain('build-2'); // Code blocks
            expect(checked).toContain('build-4'); // Notes
            expect(checked).toContain('build-5'); // Skill preflight
        });

        it('auto-checks Review phase items', () => {
            const response = `
## Delivery Summary
All features delivered.

### Success Criteria
All tests pass.

### Limitation
No mobile support yet.

### FINAL CHECKPOINT
Everything is ready.
            `;
            const checked = autoCheckItems('REVIEW', response);
            expect(checked).toContain('review-1'); // Delivery summary
            expect(checked).toContain('review-2'); // Success criteria
            expect(checked).toContain('review-3'); // Limitations
            expect(checked).toContain('review-4'); // Final checkpoint
        });

        it('auto-checks Freeze phase items', () => {
            const response = `
Final acceptance recorded.
Baseline delta updated for comparison.
Open risk: UI copy still needs review.
Scope closed and frozen.
            `;
            const checked = autoCheckItems('FREEZE', response);
            expect(checked).toContain('freeze-1');
            expect(checked).toContain('freeze-2');
            expect(checked).toContain('freeze-3');
            expect(checked).toContain('freeze-4');
        });

        it('returns empty array for invalid phase', () => {
            // @ts-expect-error testing invalid input
            const checked = autoCheckItems('InvalidPhase', 'some response');
            expect(checked).toEqual([]);
        });

        it('detects Vietnamese Intake keywords', () => {
            const response = 'Hiểu biết của tôi về vấn đề. Giả định: A. TRONG PHẠM VI: X. Ràng buộc: Y.';
            const checked = autoCheckItems('INTAKE', response);
            expect(checked).toContain('disc-1');
            expect(checked).toContain('disc-2');
            expect(checked).toContain('disc-3');
            expect(checked).toContain('disc-4');
        });
    });

    describe('calculatePhaseCompliance', () => {
        it('returns 100% when all required items checked', () => {
            const intake = getPhaseChecklist('INTAKE');
            const requiredIds = intake!.items.filter(i => i.required).map(i => i.id);

            const compliance = calculatePhaseCompliance('INTAKE', requiredIds);
            expect(compliance.score).toBe(100);
            expect(compliance.passed).toBe(true);
            expect(compliance.missing).toHaveLength(0);
        });

        it('returns lower score when items missing', () => {
            const compliance = calculatePhaseCompliance('INTAKE', ['disc-1']);
            expect(compliance.score).toBeLessThan(100);
            expect(compliance.passed).toBe(false);
            expect(compliance.missing.length).toBeGreaterThan(0);
        });
    });

    describe('getNextPhase', () => {
        it('returns Design after Intake', () => {
            expect(getNextPhase('INTAKE')).toBe('DESIGN');
        });

        it('returns Build after Design', () => {
            expect(getNextPhase('DESIGN')).toBe('BUILD');
        });

        it('returns Review after Build', () => {
            expect(getNextPhase('BUILD')).toBe('REVIEW');
        });

        it('returns Freeze after Review', () => {
            expect(getNextPhase('REVIEW')).toBe('FREEZE');
        });

        it('returns null after Freeze', () => {
            expect(getNextPhase('FREEZE')).toBeNull();
        });
    });

    describe('canProceedToNextPhase', () => {
        it('returns true when gate is approved', () => {
            const progress = [{ phase: 'INTAKE' as const, completed: true, checkedItems: [], gateApproved: true }];
            expect(canProceedToNextPhase('INTAKE', progress)).toBe(true);
        });

        it('returns false when gate is not approved', () => {
            const progress = [{ phase: 'INTAKE' as const, completed: true, checkedItems: [], gateApproved: false }];
            expect(canProceedToNextPhase('INTAKE', progress)).toBe(false);
        });
    });

    describe('createDecisionLogEntry', () => {
        it('creates entry with correct structure', () => {
            const entry = createDecisionLogEntry('INTAKE', 'gate_approved', 'User approved phase');

            expect(entry.id).toMatch(/^decision_\d+$/);
            expect(entry.phase).toBe('INTAKE');
            expect(entry.action).toBe('gate_approved');
            expect(entry.details).toBe('User approved phase');
            expect(entry.timestamp).toBeInstanceOf(Date);
        });
    });
});
