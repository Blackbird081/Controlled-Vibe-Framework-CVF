# OpenClaw Integration Layer for CVF

## Purpose

This module integrates OpenClaw as an interaction layer while keeping CVF as the deterministic core.

OpenClaw is responsible for:
- Conversational interface
- Intent extraction
- Tool invocation routing

CVF remains responsible for:
- Validation
- Policy enforcement
- Execution
- Governance
- Audit

## Architectural Principle

AI can propose.
Only CVF can execute.

## Flow

User → OpenClaw → Intent → Proposal → CVF → Decision → Response → OpenClaw

## Feature Toggle

This layer can be enabled or disabled via config.

When disabled:
- Requests bypass OpenClaw
- CVF works in structured mode only

## Safety Model

- AI never mutates state directly
- All proposals must go through CVF validator
- Telemetry enabled for all AI interactions