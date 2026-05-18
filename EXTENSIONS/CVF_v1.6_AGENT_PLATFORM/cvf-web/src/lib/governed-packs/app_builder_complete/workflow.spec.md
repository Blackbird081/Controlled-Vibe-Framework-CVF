# Workflow Spec - App Builder Complete

Memory class: POINTER_RECORD
Status: SCHEMA-DEFINED

## Purpose

Package the existing `app_builder_complete` template as a governed workflow
capability pack that can later be wired into runtime role, policy, and receipt
enforcement.

## Source

- Template ID: `app_builder_complete`
- Template source: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/development.ts`
- Category: `development`
- Required role: `BUILDER`

## Intake Fields

Required:

- `appName`
- `appType`
- `problem`
- `targetUsers`
- `coreFeatures`
- `successCriteria`
- `platforms`

Optional or advanced:

- `mustPreserve`
- `dataNeeds`
- `lookAndFeel`
- `outOfScope`
- `constraints`

## Workflow

1. Intake: collect business intent, user outcomes, constraints, and protected
   preservation rules from the existing template fields.
2. Scope lock: preserve `mustPreserve`, `outOfScope`, and `constraints` as
   non-negotiable handoff boundaries.
3. Governance precheck: classify the request, apply DLP policy, and verify
   quota eligibility before provider execution.
4. Builder execution: translate non-coder intent into a build-ready governed
   packet without asking the user to choose hidden technical patterns.
5. Receipt emission: emit a receipt compatible with `receipt.schema.json`,
   including role, policy, provider lane, DLP, quota, and step traces.

## Expected Output

- Product Brief
- Core Workflows
- Protected Constraints
- Builder Plan
- Acceptance Criteria
- Handoff Checklist

## Claim Boundary

This pack is schema-defined. It does not prove runtime route binding, provider
enforcement, or live governance behavior until Lane C or a later runtime tranche
wires and verifies it.

