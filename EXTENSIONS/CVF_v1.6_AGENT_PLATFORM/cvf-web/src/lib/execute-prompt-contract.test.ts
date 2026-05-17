import { describe, expect, it } from 'vitest';
import { buildExecutionPrompt } from './execute-prompt-contract';
import type { ExecutionRequest } from '@/lib/ai';

const baseRequest: ExecutionRequest = {
  templateId: 'web_build_handoff',
  templateName: 'Bàn giao Web cho Agent',
  inputs: {
    websiteGoal: 'Build an internal operations portal',
    audience: 'Non-technical supervisors',
  },
  intent: 'Tôi là non-coder và muốn dựng web mới',
};

describe('buildExecutionPrompt', () => {
  it('attaches CVF Web Redesign DNA for non-coder web handoff requests', () => {
    const prompt = buildExecutionPrompt(baseRequest);

    expect(prompt).toContain('Bound UX Skill Context');
    expect(prompt).toContain('Template Output Contract');
    expect(prompt).toContain('Do not return the raw skeleton');
    expect(prompt).toContain('Acceptance Checklist');
    expect(prompt).toContain('CVF Web Redesign DNA');
    expect(prompt).toContain('professional command workspace');
    expect(prompt).toContain('preserve existing routes, auth, API payloads');
  });

  it('injects exact template headings into the live prompt for guarded UX packets', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'web_ux_redesign_system',
      templateName: 'CVF Web UX Redesign System',
      intent: 'Create a governed UX redesign packet',
    });

    expect(prompt).toContain('Use these headings and labels exactly where applicable');
    expect(prompt).toContain('## 7. Review Gate & Acceptance Checklist');
    expect(prompt).toContain('What requires explicit builder approval');
  });

  it('treats trusted form output templates as minimum outlines, not compression targets', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'strategy_analysis',
      templateName: 'Strategy Analysis',
      intent: 'Compare launch options with assumptions, concrete next steps, and acceptance checks.',
      inputs: {
        topic: 'Launch options',
        context: 'Compare three go-to-market options for a simple booking app.',
        options: 'SaaS marketplace, direct sales, local partnership',
        constraints: 'Small salon buyers, limited budget',
        priority: 'Growth',
      },
    });

    expect(prompt).toContain('minimum outline, not a compression target');
    expect(prompt).toContain('assumptions, rationale, concrete next actions, and acceptance checks');
    expect(prompt).toContain('aim for 700-1100 output tokens');
    expect(prompt).toContain('compare each named or reasonably inferred option');
    expect(prompt).toContain('Task-shape requirements override generic template headings when they conflict');
    expect(prompt).toContain('Do not let SWOT, risk, overview, or documentation-wrapper sections replace the requested plan, comparison, FAQ, prioritization, pricing, persona, or criteria deliverable');
    expect(prompt).toContain('Decision Activation Memo');
    expect(prompt).toContain('First 24-72 hour activation step');
    expect(prompt).toContain('switch/rollback trigger');
    expect(prompt).toContain('It replaces generic template headings when they conflict');
    expect(prompt).not.toContain('Operational Documentation Packet');
  });

  it('uses a plan-first contract for operations and retention plan tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'strategy_analysis',
      templateName: 'Strategy Analysis',
      intent: 'Create a 30-day operations plan for launching a neighborhood tutoring marketplace.',
      inputs: {
        topic: 'Ops plan',
        context: 'Create a 30-day operations plan for launch.',
        options: 'Tutor onboarding, parent signup, matching workflow',
        constraints: 'Small team, limited budget',
        priority: 'Growth',
      },
    });

    expect(prompt).toContain('Task-shape requirements');
    expect(prompt).toContain('Operator Action Plan');
    expect(prompt).toContain('Timeline And Owners');
    expect(prompt).toContain('First 24-72 Hour Start Procedure');
    expect(prompt).toContain('Operating Cadence And Decision Branches');
    expect(prompt).toContain('QA Checks And Review Checkpoints');
    expect(prompt).toContain('Plan shape');
    expect(prompt).toContain('first 24-72 hour start procedure, phased timeline, recurring operating cadence, QA checkpoints');
    expect(prompt).not.toContain('SWOT Analysis');
  });

  it('uses an FAQ-first contract for FAQ outline tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'documentation',
      templateName: 'Documentation',
      intent: 'Create an FAQ outline for a small online course checkout flow.',
      inputs: {
        subject: 'FAQ plan',
        currentNotes: 'Small online course checkout flow.',
        readerGoal: 'Operators can publish a useful FAQ.',
        audience: 'Customers and support operators',
        mustPreserve: 'Payment and enrollment terms',
      },
    });

    expect(prompt).toContain('FAQ shape');
    expect(prompt).toContain('FAQ Outline');
    expect(prompt).toContain('FAQ Entries');
    expect(prompt).toContain('Publish Readiness Checks');
    expect(prompt).toContain('8-12 concrete questions with direct answers');
    expect(prompt).toContain('payment/access/troubleshooting');
    expect(prompt).not.toContain('Operational Documentation Packet');
  });

  it('uses an acceptance-criteria contract for dashboard criteria tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'documentation',
      templateName: 'Documentation',
      intent: 'Write acceptance criteria for a dashboard that shows weekly sales, conversion, and open tasks.',
      inputs: {
        subject: 'Acceptance criteria',
        currentNotes: 'Dashboard shows weekly sales, conversion, and open tasks.',
        readerGoal: 'Operator can verify the dashboard before handoff.',
        audience: 'Non-technical operator',
        mustPreserve: 'Weekly sales, conversion, open tasks',
      },
    });

    expect(prompt).toContain('Acceptance-criteria shape');
    expect(prompt).toContain('Acceptance Criteria Packet');
    expect(prompt).toContain('Criteria By Workflow');
    expect(prompt).not.toContain('Operational Documentation Packet');
    expect(prompt).toContain('observable and testable');
    expect(prompt).toContain('data source, refresh/state expectations, error/empty states, and pass/fail checks');
  });

  it('uses a checklist-first contract for onboarding checklist tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'documentation',
      templateName: 'Documentation',
      intent: 'Create a practical onboarding checklist for a new support teammate joining a local-first SaaS product team.',
      inputs: {
        subject: 'Onboarding checklist',
        currentNotes: 'New support teammate joining a local-first SaaS product team.',
        readerGoal: 'Support lead can onboard the teammate without extra interpretation.',
        audience: 'Non-technical operator',
        mustPreserve: 'Local-first SaaS',
      },
    });

    expect(prompt).toContain('Checklist/documentation shape');
    expect(prompt).toContain('Operator Checklist And Handoff Runbook');
    expect(prompt).toContain('Required Inputs, Artifacts, And Fields');
    expect(prompt).toContain('Step-By-Step Procedure');
    expect(prompt).toContain('Decision Branches');
    expect(prompt).toContain('QA Checks');
    expect(prompt).toContain('Common Failure Modes And Recovery');
    expect(prompt).toContain('Final Handoff Acceptance Checklist');
    expect(prompt).toContain('escalation rules');
    expect(prompt).toContain('keep the overview and assumptions short');
    expect(prompt).toContain('spend most of the answer on executable tables/checks');
    expect(prompt).not.toContain('Operational Documentation Packet');
  });

  it('uses a scope-first contract for feature-prioritization backlog triage tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'feature_prioritization',
      templateName: 'Feature Prioritization',
      intent: 'Triage a backlog for a volunteer event signup app with limited engineering time.',
      inputs: {
        features: 'Check-in QR codes, waitlist, volunteer roles, reminder emails',
        goal: 'Choose MVP scope',
        constraints: 'Limited engineering time',
        framework: 'RICE',
      },
    });

    expect(prompt).toContain('Prioritization shape');
    expect(prompt).toContain('MVP Scope And Prioritization Decision');
    expect(prompt).toContain('Recommended Scope First');
    expect(prompt).toContain('Do now / MVP');
    expect(prompt).toContain('First validation or build step');
    expect(prompt).toContain('Owner/role');
    expect(prompt).toContain('Acceptance check');
    expect(prompt).toContain('Supporting Scoring Matrix');
    expect(prompt).toContain('scoring only to support the decision');
    expect(prompt).not.toContain('Feature Prioritization Output');
  });

  it('uses a concrete pricing recommendation contract for pricing strategy tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'pricing_strategy',
      templateName: 'Pricing Strategy Review',
      intent: 'Recommend pilot pricing and compare freemium vs paid-only for a small appointment booking app.',
      inputs: {
        product: 'Appointment booking app for small salons',
        currentPrice: 'No current price. Considering freemium vs paid-only.',
        model: 'Freemium',
        target: 'B2B SMB',
        competitors: 'Calendly-style tools have free tiers and paid upgrades.',
      },
    });

    expect(prompt).toContain('Pricing shape');
    expect(prompt).toContain('Pricing Recommendation');
    expect(prompt).toContain('Pricing Tiers Or Options');
    expect(prompt).toContain('Target User');
    expect(prompt).toContain('Included Features Or Limits');
    expect(prompt).toContain('Price Anchor Or Relative Band');
    expect(prompt).toContain('First Experiment');
    expect(prompt).toContain('Risk And Validation Checks');
    expect(prompt).toContain('labeled assumptions');
    expect(prompt).toContain('do not invent unsupported exact prices');
    expect(prompt).not.toContain('Pricing Strategy Output');
  });

  it('uses an action-first contract for persona synthesis tasks', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'user_persona',
      templateName: 'User Persona',
      intent: 'Create buyer and end-user personas for a simple internal approval tracker.',
      inputs: {
        product: 'Internal approval tracker',
        data: 'Managers need faster approvals; employees lose track of request status.',
        segments: 'Managers, employees',
        goals: 'Increase adoption and reduce support questions.',
      },
    });

    expect(prompt).toContain('Persona shape');
    expect(prompt).toContain('Persona-To-Action Packet');
    expect(prompt).toContain('Persona Profiles And Decision Signals');
    expect(prompt).toContain('Trigger');
    expect(prompt).toContain('Objection');
    expect(prompt).toContain('Decision Criteria');
    expect(prompt).toContain('Success Signal');
    expect(prompt).toContain('Persona-Linked Actions');
    expect(prompt).toContain('Product Action');
    expect(prompt).toContain('Marketing/Support Action');
    expect(prompt).toContain('Onboarding Or Activation Action');
    expect(prompt).toContain('First Experiments');
    expect(prompt).toContain('Persona Usability Checks');
    expect(prompt).not.toContain('User Persona Output');
  });

  it('keeps generic template skeletons when no shape-specific contract matches', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'strategy_analysis',
      templateName: 'Strategy Analysis',
      intent: 'Review business strategy and summarize the major considerations.',
      inputs: {
        topic: 'Market entry',
        context: 'A small business is considering a new service line.',
        options: '',
        constraints: 'Limited budget',
        priority: 'Stability',
      },
    });

    expect(prompt).toContain('Strategy Analysis Output');
    expect(prompt).toContain('SWOT Analysis');
    expect(prompt).not.toContain('shape-specific deliverable contract');
  });

  it('renders the operator-plan template family without falling back to SWOT sections', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'operator_plan',
      templateName: 'Operator Plan',
      intent: 'Create a 30-day operations plan for launching a tutoring marketplace.',
      inputs: {
        goal: 'Launch tutoring marketplace',
        context: 'Need tutor onboarding, parent signup, and matching workflow.',
        timeline: '30 days',
        owners: 'Founder, ops lead',
        constraints: 'Small team, limited budget',
      },
    });

    expect(prompt).toContain('Operator Action Plan');
    expect(prompt).toContain('Use these headings and labels exactly where applicable');
    expect(prompt).toContain('First 24-72 Hour Start Procedure');
    expect(prompt).toContain('Detailed Timeline');
    expect(prompt).toContain('Operating Cadence And Decision Branches');
    expect(prompt).toContain('QA Checks And Review Checkpoints');
    expect(prompt).toContain('Failure Modes, And Escalation');
    expect(prompt).not.toContain('SWOT Analysis');
    expect(prompt).not.toContain('shape-specific deliverable contract');
  });

  it('renders the acceptance-criteria template family as the primary skeleton', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'acceptance_criteria',
      templateName: 'Acceptance Criteria',
      intent: 'Write acceptance criteria for a sales dashboard.',
      inputs: {
        feature: 'Weekly sales dashboard',
        context: 'Shows weekly sales, conversion, and open tasks.',
        users: 'Operator and manager',
        states: 'Empty, stale data, permission denied',
      },
    });

    expect(prompt).toContain('Acceptance Criteria Packet');
    expect(prompt).toContain('Criteria By Workflow');
    expect(prompt).toContain('Data/State Requirement');
    expect(prompt).not.toContain('Operational Documentation Packet');
    expect(prompt).toContain('shape-specific deliverable contract');
  });

  it('adds language preservation and anti-fabrication constraints', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'decision_memo',
      templateName: 'Decision Memo',
      intent: 'Compare three go-to-market options for a simple appointment booking app for small salons.',
      inputs: {
        decision: 'Launch options memo',
        context: 'Small salons need simple booking.',
        options: 'Direct outreach, self-serve trial, channel partnership',
        constraints: 'Low budget, non-technical operator',
        criteria: 'Cost, speed, effort, risk, confidence',
      },
    });

    expect(prompt).toContain('### Response Language');
    expect(prompt).toContain('Use English for the final answer');
    expect(prompt).toContain('matching the primary language of the user intent and supplied inputs');
    expect(prompt).toContain('Do not invent precise budgets, prices, company sizes, locale-specific currency, dates, quotas, or guarantees');
    expect(prompt).toContain('Decision Activation Memo');
    expect(prompt).toContain('Every named option was compared');
    expect(prompt).toContain('First 24-72 hour activation step');
    expect(prompt).toContain('Switch trigger');
    expect(prompt).toContain('Rollback or pause trigger');
    expect(prompt).toContain('shape-specific deliverable contract');
  });

  it('selects Vietnamese as the explicit response language for Vietnamese requests', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'documentation',
      templateName: 'Tài liệu vận hành',
      intent: 'Tôi muốn tạo checklist onboarding cho nhân viên hỗ trợ mới.',
      inputs: {
        subject: 'Checklist onboarding',
        currentNotes: 'Nhân viên mới cần học quy trình ticket, escalation, và kiến thức sản phẩm.',
        readerGoal: 'Người vận hành có thể làm theo ngay.',
        audience: 'Người mới tiếp nhận',
      },
    });

    expect(prompt).toContain('Use Vietnamese for the final answer');
  });

  it('does not attach CVF Web Redesign DNA for unrelated templates', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'strategy_analysis',
      templateName: 'Strategy Analysis',
      intent: 'Review business strategy',
    });

    expect(prompt).not.toContain('CVF Web Redesign DNA');
  });
});
