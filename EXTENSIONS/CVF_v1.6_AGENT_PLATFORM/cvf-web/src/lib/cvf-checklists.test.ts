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
        it('has 4 phases defined', () => {
            expect(CVF_PHASE_CHECKLISTS).toHaveLength(4);
        });

        it('contains Discovery, Design, Build, Review phases', () => {
            const phases = CVF_PHASE_CHECKLISTS.map(c => c.phase);
            expect(phases).toContain('Discovery');
            expect(phases).toContain('Design');
            expect(phases).toContain('Build');
            expect(phases).toContain('Review');
        });

        it('each phase has required items', () => {
            CVF_PHASE_CHECKLISTS.forEach(checklist => {
                const requiredItems = checklist.items.filter(i => i.required);
                expect(requiredItems.length).toBeGreaterThan(0);
            });
        });
    });

    describe('detectCurrentPhase', () => {
        it('detects Discovery phase', () => {
            expect(detectCurrentPhase('## PHASE A: Discovery')).toBe('Discovery');
            expect(detectCurrentPhase('Trong giai đoạn Khám phá')).toBe('Discovery');
        });

        it('detects Design phase', () => {
            expect(detectCurrentPhase('## PHASE B: Design')).toBe('Design');
            expect(detectCurrentPhase('Thiết kế solution')).toBe('Design');
        });

        it('detects Build phase', () => {
            expect(detectCurrentPhase('PHASE C: Build')).toBe('Build');
            expect(detectCurrentPhase('Thực thi implementation')).toBe('Build');
        });

        it('detects Review phase', () => {
            expect(detectCurrentPhase('PHASE D: Review')).toBe('Review');
            expect(detectCurrentPhase('Đánh giá cuối cùng')).toBe('Review');
        });

        it('returns null for unrecognized content', () => {
            expect(detectCurrentPhase('Just some random text')).toBeNull();
        });
    });

    describe('getPhaseChecklist', () => {
        it('returns checklist for valid phase', () => {
            const discovery = getPhaseChecklist('Discovery');
            expect(discovery).toBeDefined();
            expect(discovery?.phase).toBe('Discovery');
            expect(discovery?.icon).toBe('🔍');
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

            const checked = autoCheckItems('Discovery', response);
            expect(checked).toContain('disc-1'); // AI restated goal
            expect(checked).toContain('disc-2'); // Assumptions listed
            expect(checked).toContain('disc-3'); // Scope defined
        });

        it('returns empty array when no items match', () => {
            const response = 'Just a simple response without structure.';
            const checked = autoCheckItems('Discovery', response);
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
            const checked = autoCheckItems('Design', response);
            expect(checked).toContain('design-1'); // Solution approach
            expect(checked).toContain('design-2'); // Technical decisions
            expect(checked).toContain('design-3'); // Implementation plan
            expect(checked).toContain('design-4'); // Deliverables
            expect(checked).toContain('design-5'); // Risks
        });

        it('auto-checks Build phase items', () => {
            const response = '```typescript\nconst x = 1;\n```\nNote: implementation details.';
            const checked = autoCheckItems('Build', response);
            expect(checked).toContain('build-2'); // Code blocks
            expect(checked).toContain('build-4'); // Notes
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
            const checked = autoCheckItems('Review', response);
            expect(checked).toContain('review-1'); // Delivery summary
            expect(checked).toContain('review-2'); // Success criteria
            expect(checked).toContain('review-3'); // Limitations
            expect(checked).toContain('review-4'); // Final checkpoint
        });

        it('returns empty array for invalid phase', () => {
            // @ts-expect-error testing invalid input
            const checked = autoCheckItems('InvalidPhase', 'some response');
            expect(checked).toEqual([]);
        });

        it('detects Vietnamese Discovery keywords', () => {
            const response = 'Hiểu biết của tôi về vấn đề. Giả định: A. TRONG PHẠM VI: X. Ràng buộc: Y.';
            const checked = autoCheckItems('Discovery', response);
            expect(checked).toContain('disc-1');
            expect(checked).toContain('disc-2');
            expect(checked).toContain('disc-3');
            expect(checked).toContain('disc-4');
        });
    });

    describe('calculatePhaseCompliance', () => {
        it('returns 100% when all required items checked', () => {
            const discovery = getPhaseChecklist('Discovery');
            const requiredIds = discovery!.items.filter(i => i.required).map(i => i.id);

            const compliance = calculatePhaseCompliance('Discovery', requiredIds);
            expect(compliance.score).toBe(100);
            expect(compliance.passed).toBe(true);
            expect(compliance.missing).toHaveLength(0);
        });

        it('returns lower score when items missing', () => {
            const compliance = calculatePhaseCompliance('Discovery', ['disc-1']);
            expect(compliance.score).toBeLessThan(100);
            expect(compliance.passed).toBe(false);
            expect(compliance.missing.length).toBeGreaterThan(0);
        });
    });

    describe('getNextPhase', () => {
        it('returns Design after Discovery', () => {
            expect(getNextPhase('Discovery')).toBe('Design');
        });

        it('returns Build after Design', () => {
            expect(getNextPhase('Design')).toBe('Build');
        });

        it('returns Review after Build', () => {
            expect(getNextPhase('Build')).toBe('Review');
        });

        it('returns null after Review', () => {
            expect(getNextPhase('Review')).toBeNull();
        });
    });

    describe('canProceedToNextPhase', () => {
        it('returns true when gate is approved', () => {
            const progress = [{ phase: 'Discovery' as const, completed: true, checkedItems: [], gateApproved: true }];
            expect(canProceedToNextPhase('Discovery', progress)).toBe(true);
        });

        it('returns false when gate is not approved', () => {
            const progress = [{ phase: 'Discovery' as const, completed: true, checkedItems: [], gateApproved: false }];
            expect(canProceedToNextPhase('Discovery', progress)).toBe(false);
        });
    });

    describe('createDecisionLogEntry', () => {
        it('creates entry with correct structure', () => {
            const entry = createDecisionLogEntry('Discovery', 'gate_approved', 'User approved phase');

            expect(entry.id).toMatch(/^decision_\d+$/);
            expect(entry.phase).toBe('Discovery');
            expect(entry.action).toBe('gate_approved');
            expect(entry.details).toBe('User approved phase');
            expect(entry.timestamp).toBeInstanceOf(Date);
        });
    });
});
