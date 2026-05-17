# Architectural Decision Records (ADR)

## ADR-001: Governance-First Architecture
- **Date**: 2026-02-01
- **Status**: Accepted
- **Context**: AI systems need enforceable governance that cannot be bypassed
- **Decision**: All AI operations must pass through governance.guard before execution
- **Consequence**: Adds latency to every AI call but guarantees compliance

## ADR-002: 7-Phase Model (P0–P6)
- **Date**: 2026-02-17
- **Status**: Accepted (unified from 4-phase conflict)
- **Context**: Original toolkit had conflicting 4-phase and 7-phase models
- **Decision**: Adopted 7-phase model from phase.controller.ts as canonical
- **Consequence**: All mapping docs updated; more granular control but more phases to manage

## ADR-003: Risk Naming Convention (R1–R4)
- **Date**: 2026-02-17
- **Status**: Accepted (replaced LOW/MEDIUM/HIGH/CRITICAL)
- **Context**: Dual naming systems caused confusion
- **Decision**: R1/R2/R3/R4 as canonical; descriptive names in documentation only
- **Consequence**: Machine-readable, unambiguous; less intuitive for non-technical readers

## ADR-004: Spec/Code Separation
- **Date**: 2026-02-17
- **Status**: Accepted
- **Context**: 3 core TypeScript files contained embedded markdown, preventing compilation
- **Decision**: Separate into `module.spec.md` (documentation) + `module.ts` (code)
- **Consequence**: All modules compilable; documentation maintained as separate artifacts

## ADR-005: Centralized Error Classes
- **Date**: 2026-02-17
- **Status**: Accepted
- **Context**: Error handling was scattered across modules with generic Error throws
- **Decision**: Create `errors.ts` with typed error classes and CVF_ERR_xxx codes
- **Consequence**: Consistent error tracking; easier debugging; audit integration

## ADR-006: Centralized Configuration
- **Date**: 2026-02-17
- **Status**: Accepted
- **Context**: Constants hardcoded across modules (risk caps, thresholds, etc.)
- **Decision**: Create `cvf.config.ts` — single source for all configurable values
- **Consequence**: Easier environment-specific configuration; no hunting for magic numbers

## ADR-007: Provider Abstraction with Registry
- **Date**: 2026-02-17
- **Status**: Accepted
- **Context**: Need model-agnostic AI operations with runtime model approval
- **Decision**: `provider.registry.ts` with model approval validation, health checks, fallback
- **Consequence**: No direct provider instantiation; all calls validated against approved list

## ADR-008: Extension Isolation
- **Date**: 2026-02-01
- **Status**: Accepted
- **Context**: Domain logic must not contaminate core governance
- **Decision**: Extensions in 04_EXTENSION_LAYER cannot import from or modify 02_TOOLKIT_CORE
- **Consequence**: Safe to add new domains; core remains stable; requires adapter bridge pattern

## ADR-009: Domain Field for Extension Detection
- **Date**: 2026-02-17
- **Status**: Accepted (replaced skillId.includes() pattern)
- **Context**: Dexter bridge used fragile string matching to detect financial skills
- **Decision**: Use `skill.domain` field for domain detection
- **Consequence**: Reliable domain routing; new extensions work without code changes in bridge
