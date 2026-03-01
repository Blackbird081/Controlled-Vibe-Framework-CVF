'use client';

/**
 * CVF Phase Checklists and Phase Gate Logic
 * Based on CVF v1.0/v1.1 documentation
 */

// ==================== TYPES ====================

export type CVFPhase = 'Discovery' | 'Design' | 'Build' | 'Review';

export interface ChecklistItem {
    id: string;
    label: string;
    labelVi: string;
    required: boolean;
    autoCheck?: (response: string) => boolean;
}

export interface PhaseChecklist {
    phase: CVFPhase;
    icon: string;
    color: string;
    title: string;
    titleVi: string;
    description: string;
    descriptionVi: string;
    items: ChecklistItem[];
    gateQuestion: string;
    gateQuestionVi: string;
}

export interface PhaseProgress {
    phase: CVFPhase;
    completed: boolean;
    checkedItems: string[]; // IDs of checked items
    gateApproved: boolean;
    timestamp?: Date;
}

// ==================== PHASE CHECKLISTS ====================

export const CVF_PHASE_CHECKLISTS: PhaseChecklist[] = [
    {
        phase: 'Discovery',
        icon: '🔍',
        color: 'blue',
        title: 'Phase A: Discovery',
        titleVi: 'Phase A: Khám phá',
        description: 'Understand the problem deeply',
        descriptionVi: 'Hiểu sâu vấn đề',
        items: [
            {
                id: 'disc-1',
                label: 'AI restated user goal in own words',
                labelVi: 'AI đã diễn đạt lại mục tiêu bằng lời của mình',
                required: true,
                autoCheck: (r) => /My Understanding|Hiểu biết của tôi/i.test(r),
            },
            {
                id: 'disc-2',
                label: 'All assumptions listed',
                labelVi: 'Liệt kê tất cả giả định',
                required: true,
                autoCheck: (r) => /Assumption|Giả định/i.test(r),
            },
            {
                id: 'disc-3',
                label: 'Scope defined (in/out)',
                labelVi: 'Định nghĩa scope (trong/ngoài)',
                required: true,
                autoCheck: (r) => /IN SCOPE|OUT OF SCOPE|TRONG PHẠM VI|NGOÀI PHẠM VI/i.test(r),
            },
            {
                id: 'disc-4',
                label: 'Constraints identified',
                labelVi: 'Xác định ràng buộc',
                required: false,
                autoCheck: (r) => /Constraint|Ràng buộc/i.test(r),
            },
            {
                id: 'disc-5',
                label: 'Clarification questions (if any)',
                labelVi: 'Câu hỏi làm rõ (nếu có)',
                required: false,
            },
        ],
        gateQuestion: 'Do you confirm the AI understood correctly?',
        gateQuestionVi: 'Bạn xác nhận AI đã hiểu đúng chưa?',
    },
    {
        phase: 'Design',
        icon: '✏️',
        color: 'purple',
        title: 'Phase B: Design',
        titleVi: 'Phase B: Thiết kế',
        description: 'Design the solution approach',
        descriptionVi: 'Thiết kế hướng giải pháp',
        items: [
            {
                id: 'design-1',
                label: 'Solution approach proposed',
                labelVi: 'Đề xuất hướng giải pháp',
                required: true,
                autoCheck: (r) => /Solution Approach|Hướng Giải pháp/i.test(r),
            },
            {
                id: 'design-2',
                label: 'Technical decisions made (not asked)',
                labelVi: 'Quyết định kỹ thuật (không hỏi user)',
                required: true,
                autoCheck: (r) => /Technical Decision|Quyết định Kỹ thuật/i.test(r),
            },
            {
                id: 'design-3',
                label: 'Implementation plan outlined',
                labelVi: 'Kế hoạch thực hiện',
                required: true,
                autoCheck: (r) => /Implementation Plan|Kế hoạch Thực hiện|Step \d/i.test(r),
            },
            {
                id: 'design-4',
                label: 'Expected deliverables listed',
                labelVi: 'Liệt kê deliverables dự kiến',
                required: true,
                autoCheck: (r) => /Deliverable|Expected Output/i.test(r),
            },
            {
                id: 'design-5',
                label: 'Risks identified',
                labelVi: 'Xác định rủi ro',
                required: false,
                autoCheck: (r) => /Risk|Rủi ro/i.test(r),
            },
        ],
        gateQuestion: 'Approve this design to proceed to Build?',
        gateQuestionVi: 'Duyệt thiết kế này để tiến hành Build?',
    },
    {
        phase: 'Build',
        icon: '🔨',
        color: 'green',
        title: 'Phase C: Build',
        titleVi: 'Phase C: Thực thi',
        description: 'Execute and build deliverables',
        descriptionVi: 'Thực thi và xây dựng',
        items: [
            {
                id: 'build-1',
                label: 'Deliverables are complete and usable',
                labelVi: 'Deliverables hoàn chỉnh và sử dụng được',
                required: true,
            },
            {
                id: 'build-2',
                label: 'Code/output is properly formatted',
                labelVi: 'Code/output được format đúng',
                required: true,
                autoCheck: (r) => /```/.test(r),
            },
            {
                id: 'build-3',
                label: 'Follows approved design',
                labelVi: 'Theo đúng thiết kế đã duyệt',
                required: true,
            },
            {
                id: 'build-4',
                label: 'Implementation notes provided',
                labelVi: 'Có ghi chú implementation',
                required: false,
                autoCheck: (r) => /Note|Ghi chú/i.test(r),
            },
            {
                id: 'build-5',
                label: 'Skill Preflight declared before coding',
                labelVi: 'Đã khai báo Skill Preflight trước khi code',
                required: true,
                autoCheck: (r) => /SKILL_PREFLIGHT_RECORD|Skill Preflight PASS|Preflight PASS/i.test(r),
            },
        ],
        gateQuestion: 'Build complete. Ready for Review?',
        gateQuestionVi: 'Build hoàn thành. Sẵn sàng Review?',
    },
    {
        phase: 'Review',
        icon: '✅',
        color: 'orange',
        title: 'Phase D: Review',
        titleVi: 'Phase D: Đánh giá',
        description: 'Quality check and delivery',
        descriptionVi: 'Kiểm tra chất lượng và bàn giao',
        items: [
            {
                id: 'review-1',
                label: 'Delivery summary provided',
                labelVi: 'Có tóm tắt delivery',
                required: true,
                autoCheck: (r) => /Delivery Summary|Tóm tắt Delivery/i.test(r),
            },
            {
                id: 'review-2',
                label: 'Success criteria checked',
                labelVi: 'Kiểm tra success criteria',
                required: true,
                autoCheck: (r) => /Success Criteria|Tiêu chí/i.test(r),
            },
            {
                id: 'review-3',
                label: 'Known limitations documented',
                labelVi: 'Ghi nhận các hạn chế',
                required: false,
                autoCheck: (r) => /Limitation|Hạn chế/i.test(r),
            },
            {
                id: 'review-4',
                label: 'Final checkpoint presented',
                labelVi: 'Trình bày checkpoint cuối',
                required: true,
                autoCheck: (r) => /FINAL CHECKPOINT|CHECKPOINT CUỐI/i.test(r),
            },
        ],
        gateQuestion: 'Accept this delivery?',
        gateQuestionVi: 'Chấp nhận delivery này?',
    },
];

// ==================== PHASE DETECTION ====================

export function detectCurrentPhase(response: string): CVFPhase | null {
    if (/PHASE A|Phase A|Discovery|Khám phá/i.test(response)) return 'Discovery';
    if (/PHASE B|Phase B|Design|Thiết kế/i.test(response)) return 'Design';
    if (/PHASE C|Phase C|Build|Thực thi/i.test(response)) return 'Build';
    if (/PHASE D|Phase D|Review|Đánh giá/i.test(response)) return 'Review';
    return null;
}

export function getPhaseChecklist(phase: CVFPhase): PhaseChecklist | undefined {
    return CVF_PHASE_CHECKLISTS.find(c => c.phase === phase);
}

// ==================== AUTO-CHECK LOGIC ====================

export function autoCheckItems(phase: CVFPhase, response: string): string[] {
    const checklist = getPhaseChecklist(phase);
    if (!checklist) return [];

    return checklist.items
        .filter(item => item.autoCheck?.(response))
        .map(item => item.id);
}

export function calculatePhaseCompliance(
    phase: CVFPhase,
    checkedItems: string[]
): { score: number; passed: boolean; missing: string[] } {
    const checklist = getPhaseChecklist(phase);
    if (!checklist) return { score: 0, passed: false, missing: [] };

    const requiredItems = checklist.items.filter(i => i.required);
    const checkedRequired = requiredItems.filter(i => checkedItems.includes(i.id));

    const score = Math.round((checkedRequired.length / requiredItems.length) * 100);
    const passed = checkedRequired.length === requiredItems.length;
    const missing = requiredItems
        .filter(i => !checkedItems.includes(i.id))
        .map(i => i.id);

    return { score, passed, missing };
}

// ==================== PHASE GATE LOGIC ====================

export function canProceedToNextPhase(
    currentPhase: CVFPhase,
    progress: PhaseProgress[]
): boolean {
    const current = progress.find(p => p.phase === currentPhase);
    return current?.gateApproved ?? false;
}

export function getNextPhase(currentPhase: CVFPhase): CVFPhase | null {
    const phases: CVFPhase[] = ['Discovery', 'Design', 'Build', 'Review'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === phases.length - 1) return null;
    return phases[currentIndex + 1];
}

// ==================== DECISION LOG ====================

export interface DecisionLogEntry {
    id: string;
    timestamp: Date;
    phase: CVFPhase;
    action: 'gate_approved' | 'gate_rejected' | 'checklist_updated' | 'retry_requested';
    details?: string;
}

export function createDecisionLogEntry(
    phase: CVFPhase,
    action: DecisionLogEntry['action'],
    details?: string
): DecisionLogEntry {
    return {
        id: `decision_${Date.now()}`,
        timestamp: new Date(),
        phase,
        action,
        details,
    };
}
