# Agent Build Loop

Status: ACTIVE_REFERENCE

Memory class: POINTER_RECORD

## Purpose

This directory owns CVF's optional, receipt-backed BUILD micro-loop guidance.

## Scope / Applies To

Use this front door for work orders that explicitly select the optional BUILD
loop profile and for tools that need its receipt schema.

## Start Here

- `CVF_AGENT_BUILD_LOOP_PLAYBOOK.md` defines selection, execution, metrics, and
  stop behavior.
- `CVF_AGENT_BUILD_LOOP_RECEIPT_SCHEMA.json` is the machine-readable receipt
  contract.
- `CVF_AGENT_BUILD_LOOP_RECEIPT_EXAMPLE.json` is a schema-valid example.

## Adoption Boundary

The playbook applies only when a work order or operator explicitly selects it.
It does not add a global checker, hook, runtime interceptor, telemetry service,
or mandatory ceremony to unrelated work.

A receipt records what the agent did. It does not prove final correctness,
review acceptance, runtime safety, or freeze readiness by itself.

## Claim Boundary

This front door provides navigation only. It adds no global enforcement or
runtime claim.
