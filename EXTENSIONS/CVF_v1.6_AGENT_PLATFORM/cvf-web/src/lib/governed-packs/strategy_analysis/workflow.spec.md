# Workflow Spec - Strategy Analysis

Memory class: POINTER_RECORD
Status: SCHEMA-DEFINED

## Purpose

Package the existing `strategy_analysis` template as a governed workflow
capability pack for bounded business strategy analysis.

## Source

- Template ID: `strategy_analysis`
- Template source: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/business.ts`
- Category: `business`
- Required role: `BUILDER`

## Intake Fields

Required:

- `topic`
- `context`

Optional or advanced:

- `options`
- `constraints`
- `priority`

## Workflow

1. Intake: collect the strategy topic, operating context, candidate options,
   constraints, and priority.
2. Assumption capture: separate supplied facts from missing data and generated
   assumptions.
3. Governance precheck: classify the request, apply DLP policy, and verify
   quota eligibility before provider execution.
4. Strategy execution: produce SWOT, option comparison, risk assessment,
   recommendations, and next actions.
5. Receipt emission: emit a receipt compatible with `receipt.schema.json`,
   including role, policy, provider lane, DLP, quota, and step traces.

## Expected Output

- Executive Summary
- Assumptions And Missing Data
- SWOT Analysis
- Options Comparison
- Risk Assessment
- Recommendations
- Success Criteria Check
- Next Actions

## Claim Boundary

This pack is schema-defined. It does not prove runtime route binding, provider
enforcement, or live governance behavior until Lane C or a later runtime tranche
wires and verifies it.

