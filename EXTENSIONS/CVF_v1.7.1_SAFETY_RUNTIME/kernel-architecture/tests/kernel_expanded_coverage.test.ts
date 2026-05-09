import { describe, expect, it } from "vitest"

import { DomainRegistry } from "../kernel/01_domain_lock/domain.registry"
import { DomainLockEngine } from "../kernel/01_domain_lock/domain_lock_engine"
import { ContractValidator } from "../kernel/02_contract_runtime/contract_validator"
import { OutputValidator } from "../kernel/02_contract_runtime/output_validator"
import { IOContractRegistry } from "../kernel/02_contract_runtime/io_contract_registry"
import { ContractEnforcer } from "../kernel/02_contract_runtime/contract_enforcer"
import { RollbackController } from "../kernel/03_contamination_guard/rollback_controller"
import { RefusalPolicyRegistry } from "../kernel/04_refusal_router/refusal_policy_registry"
import { RiskGate } from "../kernel/04_refusal_router/refusal.risk"
import { CreativePermissionPolicy } from "../kernel/05_creative_control/creative_permission.policy"
import { InvariantChecker } from "../kernel/05_creative_control/invariant.checker"
import { LineageStore } from "../kernel/05_creative_control/lineage.store"
import { AuditLogger } from "../kernel/05_creative_control/audit.logger"
import { TraceReporter } from "../kernel/05_creative_control/trace.reporter"
import { SessionState } from "../runtime/session_state"

describe("Domain layer extended coverage", () => {
  it("bootstraps default domains and rejects duplicate register", () => {
    const registry = new DomainRegistry()
    expect(registry.exists("informational")).toBe(true)
    expect(registry.list().length).toBeGreaterThanOrEqual(6)

    expect(() =>
      registry.register({
        name: "informational",
        description: "dup",
        allowedInputTypes: ["question"],
        allowedOutputTypes: ["text"],
        riskTolerance: "low",
      })
    ).toThrow("Domain already exists")
  })

  it("enforces lock errors and resolves context attributes", () => {
    const engine = new DomainLockEngine()

    expect(() =>
      engine.lock({
        message: "anything",
        declaredDomain: "unknown",
      })
    ).toThrow("Unknown declared domain")

    const mismatchEngine = new DomainLockEngine()
    ;(mismatchEngine as any).classifier = { classify: () => "creative" }
    expect(() =>
      mismatchEngine.lock({
        message: "write a short story",
        declaredDomain: "informational",
      })
    ).toThrow("mismatches classified domain")

    const invalidClassEngine = new DomainLockEngine()
    expect(() =>
      invalidClassEngine.lock({
        message: "what is cvf",
        declaredDomain: "informational",
        inputClass: "numeric",
      })
    ).toThrow("Input class 'numeric' not allowed")

    const invalidBoundaryEngine = new DomainLockEngine()
    expect(() =>
      invalidBoundaryEngine.lock({
        message: " ",
        declaredDomain: "informational",
        inputClass: "text",
      })
    ).toThrow("Invalid or restricted input")

    const creativeEngine = new DomainLockEngine()
    const creative = creativeEngine.lock({
      message: "viết truyện ngắn an toàn",
      declaredDomain: "creative",
      inputClass: "text",
    })
    expect(creative.risk_ceiling).toBe("medium")
    expect(creative.creative_allowed).toBe(true)
  })
})

describe("Contract layer extended coverage", () => {
  it("validates definition and io contract constraints", () => {
    const validator = new ContractValidator()
    expect(() => validator.validateDefinition({ requiredFields: [] })).toThrow(
      "requiredFields cannot be empty"
    )
    expect(() =>
      validator.validateIOContract(
        {
          contract_id: "",
          domain_id: "",
          expected_output_format: "text",
          max_tokens: 32,
          allow_external_links: true,
          allow_code_blocks: true,
        },
        "informational"
      )
    ).toThrow("missing identifiers")
    expect(() =>
      validator.validateIOContract(
        {
          contract_id: "io-1",
          domain_id: "analytical",
          expected_output_format: "text",
          max_tokens: 32,
          allow_external_links: true,
          allow_code_blocks: true,
        },
        "informational"
      )
    ).toThrow("mismatches 'informational'")
  })

  it("validates output formats and registry lifecycle", () => {
    const outputValidator = new OutputValidator()
    const registry = new IOContractRegistry()

    const ioContract = {
      contract_id: "io-json",
      domain_id: "informational",
      expected_output_format: "json" as const,
      max_tokens: 16,
      allow_external_links: false,
      allow_code_blocks: false,
    }

    expect(outputValidator.validate("", ioContract)).toBe(false)
    expect(outputValidator.validate("```code```", ioContract)).toBe(false)
    expect(outputValidator.validate("http://example.com", ioContract)).toBe(false)
    expect(outputValidator.validate('{"ok":true}', ioContract)).toBe(true)
    expect(outputValidator.validate("not-json", ioContract)).toBe(false)
    expect(outputValidator.validate("x".repeat(100), ioContract)).toBe(false)

    registry.register(ioContract)
    expect(registry.get("io-json")?.domain_id).toBe("informational")
    expect(() => registry.register(ioContract)).toThrow("already exists")
    registry.upsert({ ...ioContract, max_tokens: 32 })
    expect(registry.get("io-json")?.max_tokens).toBe(32)
  })

  it("covers enforcer domain and output mismatch branches", () => {
    const enforcer = new ContractEnforcer()

    expect(() =>
      enforcer.validateInput(
        {
          domain: "informational",
          type: "question",
          ioContract: { domain_id: "analytical" },
        },
        { requireDomainMatch: true }
      )
    ).toThrow("mismatches input domain")

    expect(() =>
      enforcer.validateOutput({ type: "json" }, { outputType: "text" })
    ).toThrow("output type 'json' invalid")
  })
})

describe("Contamination and creative controls extended coverage", () => {
  it("handles rollback plans and policy profile lookups", () => {
    const rollback = new RollbackController()
    expect(
      rollback.plan({
        level: "critical",
        cvfRiskLevel: "R4",
        score: 99,
        reasons: ["self_harm"],
      }).required
    ).toBe(true)
    expect(
      rollback.plan({
        level: "medium",
        cvfRiskLevel: "R2",
        score: 60,
        reasons: ["drift_detected"],
        driftDetected: true,
      }).reason
    ).toBe("drift_detected")
    expect(
      rollback.plan({
        level: "low",
        cvfRiskLevel: "R0",
        score: 0,
        reasons: [],
      }).required
    ).toBe(false)

    const policyRegistry = new RefusalPolicyRegistry()
    expect(policyRegistry.latestVersion()).toBe("v1")
    expect(() => policyRegistry.get("v999")).toThrow("Unknown refusal policy version")
  })

  it("checks creative permission and lineage invariants", () => {
    const permission = new CreativePermissionPolicy()
    const allowAtR1 = permission.allow(
      {
        creative_allowed: true,
      } as any,
      "R1"
    )
    const denyAtR2 = permission.allow(
      {
        creative_allowed: true,
      } as any,
      "R2"
    )
    const denyWhenOff = permission.allow(
      {
        creative_allowed: false,
      } as any,
      "R0"
    )
    expect(allowAtR1).toBe(true)
    expect(denyAtR2).toBe(false)
    expect(denyWhenOff).toBe(false)

    const store = new LineageStore()
    store.add({
      id: "a",
      type: "input",
      domain: "informational",
      parentIds: [],
      timestamp: Date.now(),
    })
    store.add({
      id: "b",
      type: "output",
      domain: "informational",
      parentIds: ["a"],
      timestamp: Date.now(),
    })
    expect(() => new InvariantChecker(store).validateNoCrossDomainReuse()).not.toThrow()

    store.add({
      id: "c",
      type: "output",
      domain: "creative",
      parentIds: ["a"],
      timestamp: Date.now(),
    })
    expect(() => new InvariantChecker(store).validateNoCrossDomainReuse()).toThrow(
      "Cross-domain reuse detected"
    )
  })
})

describe("Risk gate and runtime utility extended coverage", () => {
  it("evaluates risk gate decisions and returns safe pass-through", () => {
    const gate = new RiskGate()

    const blocked = JSON.parse(gate.evaluate("I want to kill myself"))
    expect(blocked.answer).toMatch(/blocked/i)
    expect(blocked.risk_level).toBe("R4")

    const approval = JSON.parse(gate.evaluate("Need legal advice on this case"))
    expect(approval.answer).toMatch(/requires human approval/i)
    expect(approval.risk_level).toBe("R3")

    const safe = gate.evaluate("General informational response")
    expect(safe).toBe("General informational response")
  })

  it("covers clarify branch in risk gate and runtime session getters", () => {
    const gate = new RiskGate()
    ;(gate as any).policy = {
      decide: () => "clarify",
    }
    const clarify = JSON.parse(gate.evaluate("any"))
    expect(clarify.answer).toMatch(/clarify/i)

    const session = new SessionState()
    expect(session.getDomain()).toBeUndefined()
    expect(session.getRisk()).toBeUndefined()
    session.setDomain("informational")
    session.setRisk("R1")
    expect(session.getDomain()).toBe("informational")
    expect(session.getRisk()).toBe("R1")
  })

  it("returns combined trace report", () => {
    const store = new LineageStore()
    const audit = new AuditLogger()
    store.add({
      id: "n1",
      type: "input",
      domain: "informational",
      parentIds: [],
      timestamp: Date.now(),
    })
    audit.log("risk", "Risk assessed")

    const report = new TraceReporter(store, audit).generateReport()
    expect(report.lineage.length).toBe(1)
    expect(report.events.length).toBe(1)
  })
})
