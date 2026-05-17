1. Registry Purpose

Registry quản lý capability có tác động hệ thống cao, yêu cầu governance chặt.

2. Registry Scope

DOMAIN: deployment

CVF_VERSION: 1.2

GOVERNANCE_LEVEL: Maximum

3. Registered Capabilities
3.1 DEPLOYMENT_RELEASE

CAPABILITY_ID: DEPLOYMENT_RELEASE

CONTRACT_FILE:
examples/canonical_skill_contracts/deployment_release.contract.md

Governance Summary

Risk Level: Critical

Allowed Archetypes: Executor

Allowed Phases: Deployment

Human Approval Required: Mandatory

Registry Rules

Không resolve nếu thiếu ROLLBACK_PLAN_READY

Không resolve nếu target_environment = production mà thiếu APPROVED_RELEASE

Execution phải Full Trace

4. Resolution Rules

Deployment capability không được chain

Mỗi execution = 1 registry resolution

Rollback capability phải được resolve riêng

5. Canonical Status

Registry này đại diện cho highest-risk pattern trong CVF v1.2