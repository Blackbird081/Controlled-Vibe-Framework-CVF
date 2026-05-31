import type { WorkflowComposition } from './WorkflowComposition';

export const WORKFLOW_COMPOSITION_VERSION = 'workflowComposition.v1';

export type OutcomeKey =
    | 'create_prd'
    | 'generate_sop'
    | 'review_contract'
    | 'build_landing_page'
    | 'summarize_meeting'
    | 'create_proposal';

export interface OutcomeWorkflowEntry {
    outcomeKey: OutcomeKey;
    templateId: string;
    title: {
        vi: string;
        en: string;
    };
    description: {
        vi: string;
        en: string;
    };
    cta: {
        vi: string;
        en: string;
    };
    tone: 'emerald' | 'sky' | 'amber' | 'rose' | 'violet' | 'teal';
    composition: WorkflowComposition;
}

export const OUTCOME_WORKFLOW_REGISTRY: readonly OutcomeWorkflowEntry[] = [
    {
        outcomeKey: 'create_prd',
        templateId: 'app_builder_complete',
        title: { vi: 'Tạo PRD', en: 'Create PRD' },
        description: {
            vi: 'Biến ý tưởng sản phẩm thành brief yêu cầu có governance.',
            en: 'Turn product intent into a governed requirements brief.',
        },
        cta: { vi: 'Bắt đầu PRD', en: 'Start PRD' },
        tone: 'emerald',
        composition: {
            outcomeKey: 'create_prd',
            packIds: ['product_brief'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'product_goal, target_user, problem, constraints',
            outputContract: 'Product requirements document',
            deterministicFixturePath: 'tests/fixtures/workflow/create_prd.fixture.json',
        },
    },
    {
        outcomeKey: 'generate_sop',
        templateId: 'documentation',
        title: { vi: 'Tạo SOP', en: 'Generate SOP' },
        description: {
            vi: 'Chuyển ghi chú quy trình thành SOP vận hành có cấu trúc.',
            en: 'Turn process notes into a structured operating procedure.',
        },
        cta: { vi: 'Tạo SOP', en: 'Create SOP' },
        tone: 'sky',
        composition: {
            outcomeKey: 'generate_sop',
            packIds: ['sop_generator'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'process_name, actors, steps, controls',
            outputContract: 'Standard operating procedure',
            deterministicFixturePath: 'tests/fixtures/workflow/generate_sop.fixture.json',
        },
    },
    {
        outcomeKey: 'review_contract',
        templateId: 'tos_review',
        title: { vi: 'Review hợp đồng', en: 'Review Contract' },
        description: {
            vi: 'Gắn cờ rủi ro và câu hỏi cần chuyển cho người duyệt.',
            en: 'Flag risks and escalation-ready questions for review.',
        },
        cta: { vi: 'Review hợp đồng', en: 'Review contract' },
        tone: 'rose',
        composition: {
            outcomeKey: 'review_contract',
            packIds: ['contract_review'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'contract_text, review_goal, jurisdiction_context',
            outputContract: 'Contract review report',
            deterministicFixturePath: 'tests/fixtures/workflow/review_contract.fixture.json',
        },
    },
    {
        outcomeKey: 'build_landing_page',
        templateId: 'web_build_handoff',
        title: { vi: 'Viết landing page', en: 'Build Landing Page' },
        description: {
            vi: 'Tạo cấu trúc và copy landing page chưa xuất bản.',
            en: 'Draft landing-page copy and structure without publishing.',
        },
        cta: { vi: 'Viết landing page', en: 'Draft landing page' },
        tone: 'violet',
        composition: {
            outcomeKey: 'build_landing_page',
            packIds: ['landing_page_builder'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'offer, audience, proof_points, constraints',
            outputContract: 'Landing page copy',
            deterministicFixturePath: 'tests/fixtures/workflow/build_landing_page.fixture.json',
        },
    },
    {
        outcomeKey: 'summarize_meeting',
        templateId: 'meeting_notes',
        title: { vi: 'Tóm tắt meeting', en: 'Summarize Meeting' },
        description: {
            vi: 'Rút ra quyết định, việc cần làm, owner và rủi ro.',
            en: 'Extract decisions, actions, owners, and follow-up risk.',
        },
        cta: { vi: 'Tóm tắt meeting', en: 'Summarize meeting' },
        tone: 'teal',
        composition: {
            outcomeKey: 'summarize_meeting',
            packIds: ['meeting_summarizer'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'meeting_notes, participants, desired_outcome',
            outputContract: 'Meeting summary',
            deterministicFixturePath: 'tests/fixtures/workflow/summarize_meeting.fixture.json',
        },
    },
    {
        outcomeKey: 'create_proposal',
        templateId: 'email_template',
        title: { vi: 'Viết proposal', en: 'Create Proposal' },
        description: {
            vi: 'Soạn proposal theo nhu cầu, phạm vi, timeline và ràng buộc.',
            en: 'Draft a proposal from need, scope, timeline, and constraints.',
        },
        cta: { vi: 'Viết proposal', en: 'Draft proposal' },
        tone: 'amber',
        composition: {
            outcomeKey: 'create_proposal',
            packIds: ['proposal_writer'],
            policyRefs: ['CVF_CAPABILITY_INTAKE_PIPELINE_GUARD'],
            inputContract: 'customer_need, scope, timeline, constraints',
            outputContract: 'Proposal document',
            deterministicFixturePath: 'tests/fixtures/workflow/create_proposal.fixture.json',
        },
    },
] as const;

export const OUTCOME_WORKFLOW_BY_KEY: Record<OutcomeKey, OutcomeWorkflowEntry> =
    OUTCOME_WORKFLOW_REGISTRY.reduce(
        (acc, entry) => ({ ...acc, [entry.outcomeKey]: entry }),
        {} as Record<OutcomeKey, OutcomeWorkflowEntry>,
    );
