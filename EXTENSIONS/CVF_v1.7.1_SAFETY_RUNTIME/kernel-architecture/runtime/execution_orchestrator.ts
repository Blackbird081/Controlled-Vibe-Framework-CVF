import { createHash } from "crypto"
import { DomainGuard } from "../kernel/01_domain_lock/domain_guard"
import { DomainLockEngine } from "../kernel/01_domain_lock/domain_lock_engine"
import { DomainClassifier } from "../kernel/01_domain_lock/domain_classifier"
import { ContractEnforcer } from "../kernel/02_contract_runtime/contract_enforcer"
import { ContractRuntimeEngine } from "../kernel/02_contract_runtime/contract_runtime_engine"
import {
  ContractConsumerRole,
  ContractDefinition,
  IOContract
} from "../kernel/02_contract_runtime/contract.types"
import { RiskDetector } from "../kernel/03_contamination_guard/risk_detector"
import { CVFRiskLevel } from "../kernel/03_contamination_guard/risk.types"
import { RiskScorer } from "../kernel/03_contamination_guard/risk_scorer"
import { AssumptionTracker } from "../kernel/03_contamination_guard/assumption_tracker"
import { DriftDetector } from "../kernel/03_contamination_guard/drift_detector"
import { RiskPropagationEngine } from "../kernel/03_contamination_guard/risk_propagation_engine"
import { RollbackController } from "../kernel/03_contamination_guard/rollback_controller"
import { LineageGraph } from "../kernel/03_contamination_guard/lineage_graph"
import { RefusalRouter } from "../kernel/04_refusal_router/refusal.router"
import { ExecutionGate } from "../kernel/04_refusal_router/refusal.execution"
import { CapabilityRequest } from "../kernel/04_refusal_router/capability.types"
import { CreativeController } from "../kernel/05_creative_control/creative.controller"
import { AuditLogger } from "../kernel/05_creative_control/audit.logger"
import { LineageStore } from "../kernel/05_creative_control/lineage.store"
import { InvariantChecker } from "../kernel/05_creative_control/invariant.checker"
import { TraceReporter } from "../kernel/05_creative_control/trace.reporter"
import { BoundarySnapshot } from "../internal_ledger/boundary_snapshot"
import { LineageTracker } from "../internal_ledger/lineage_tracker"
import { RiskEvolution } from "../internal_ledger/risk_evolution"

import { LLMAdapter, LLMProvider } from "./llm_adapter"
import { SessionState } from "./session_state"

const ORCHESTRATOR_CONSTRUCTOR_GUARD = Symbol("kernel_orchestrator_guard")

export type KernelDecisionCode =
  | "INPUT_ACCEPTED"
  | "RISK_EVALUATED"
  | "ROLLBACK_REQUIRED"
  | "REFUSAL_BLOCK"
  | "REFUSAL_APPROVAL"
  | "REFUSAL_CLARIFY"
  | "ALLOW_RELEASED"
  | "PIPELINE_ERROR"

export interface OrchestratorInput {
  domain: string
  type: string
  message: string
  inputClass?: "text" | "numeric" | "instruction" | "mixed"
  contract?: ContractDefinition
  ioContract?: IOContract
  creativeMode?: boolean
  capabilityRequest?: CapabilityRequest
  consumerRole?: ContractConsumerRole
  transformRequested?: boolean
  [key: string]: unknown
}

export interface ExecutionOrchestratorOptions {
  llmProvider?: LLMProvider
  policyVersion?: string
  llmTimeoutMs?: number
}

export class ExecutionOrchestrator {
  static create(options: ExecutionOrchestratorOptions = {}): ExecutionOrchestrator {
    return new ExecutionOrchestrator(ORCHESTRATOR_CONSTRUCTOR_GUARD, options)
  }

  private readonly policyVersion: string
  private readonly llmTimeoutMs: number
  private readonly llmExecutionToken = Symbol("kernel_runtime_llm_token")

  private domain = new DomainGuard()
  private domainLock = new DomainLockEngine()
  private domainClassifier = new DomainClassifier()
  private contract = new ContractEnforcer()
  private runtimeContract = new ContractRuntimeEngine()
  private detector = new RiskDetector()
  private risk = new RiskScorer()
  private assumptionTracker = new AssumptionTracker()
  private driftDetector = new DriftDetector()
  private riskPropagation = new RiskPropagationEngine()
  private rollback = new RollbackController()
  private riskLineage = new LineageGraph()
  private refusal: RefusalRouter
  private executionGate = new ExecutionGate()
  private creative = new CreativeController()
  private audit = new AuditLogger()
  private lineageStore = new LineageStore()
  private invariants = new InvariantChecker(this.lineageStore)
  private traceReporter = new TraceReporter(this.lineageStore, this.audit)

  private llm: LLMAdapter
  private session = new SessionState()
  private lineage = new LineageTracker()
  private riskHistory = new RiskEvolution()
  private boundaryHistory = new BoundarySnapshot()

  private constructor(
    guard: symbol,
    options: ExecutionOrchestratorOptions = {}
  ) {
    if (guard !== ORCHESTRATOR_CONSTRUCTOR_GUARD) {
      throw new Error(
        "Direct orchestrator construction blocked: use KernelRuntimeEntrypoint."
      )
    }

    this.policyVersion = options.policyVersion || "v1"
    this.llmTimeoutMs = options.llmTimeoutMs && options.llmTimeoutMs > 0
      ? options.llmTimeoutMs
      : 5000
    this.llm = new LLMAdapter(options.llmProvider, this.llmExecutionToken)
    this.refusal = new RefusalRouter(this.policyVersion)
  }

  private parseRiskLevel(value?: string): CVFRiskLevel | undefined {
    if (
      value === "R0" ||
      value === "R1" ||
      value === "R2" ||
      value === "R3" ||
      value === "R4"
    ) {
      return value
    }
    return undefined
  }

  private computeTraceHash(parts: string[]): string {
    return createHash("sha256").update(parts.join("|")).digest("hex")
  }

  private async generateWithTimeout(input: OrchestratorInput): Promise<string> {
    const timeoutMessage = `LLM timeout after ${this.llmTimeoutMs}ms`

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, this.llmTimeoutMs)

      this.llm.generate(input, this.llmExecutionToken)
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  async execute(input: OrchestratorInput) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    if (!input.message || input.message.trim().length === 0) {
      throw new Error("Orchestrator violation: message is required.")
    }

    if (input.capabilityRequest) {
      this.executionGate.authorize(input.capabilityRequest)
      this.audit.log("capability", `Authorized capability '${input.capabilityRequest.capability}'`)
    }

    this.domain.enforce(input)

    const domainContext = this.domainLock.lock({
      message: input.message,
      declaredDomain: input.domain,
      inputClass: input.inputClass || "text"
    })
    this.audit.log("domain_preflight", `Domain '${domainContext.domain_type}' locked`)

    const inputTraceHash = this.computeTraceHash([
      requestId,
      this.policyVersion,
      input.domain,
      input.message
    ])

    this.lineage.record({
      id: `${requestId}-input`,
      parentIds: [],
      domain: input.domain,
      requestId,
      policyVersion: this.policyVersion,
      decisionCode: "INPUT_ACCEPTED",
      traceHash: inputTraceHash,
      timestamp: Date.now()
    })
    this.lineageStore.add({
      id: `${requestId}-input`,
      type: "input",
      parentIds: [],
      domain: input.domain,
      timestamp: Date.now()
    })
    this.riskLineage.addNode({
      id: `${requestId}-input`,
      domain: input.domain,
      risk: this.session.getRisk() || "R0",
      timestamp: Date.now()
    })

    try {
      this.contract.validateInput(input, input.contract)
      const rawOutput = await this.generateWithTimeout(input)

      const flags = this.detector.detect(rawOutput)
      const baseAssessment = this.risk.score(flags)
      const assumptions = this.assumptionTracker.track(rawOutput)
      const classifiedOutputDomain = this.domainClassifier.classify(rawOutput)
      const drift = this.driftDetector.detect({
        declaredDomain: input.domain,
        classifiedDomain: classifiedOutputDomain,
        previousRisk: this.parseRiskLevel(this.session.getRisk()),
        currentRisk: baseAssessment.cvfRiskLevel
      })
      const riskAssessment = this.riskPropagation.propagate(
        baseAssessment,
        assumptions,
        drift.detected
      )

      const riskTraceHash = this.computeTraceHash([
        requestId,
        this.policyVersion,
        input.domain,
        riskAssessment.cvfRiskLevel,
        String(riskAssessment.score)
      ])

      this.session.setDomain(input.domain)
      this.session.setRisk(riskAssessment.cvfRiskLevel)
      this.riskHistory.record({
        requestId,
        policyVersion: this.policyVersion,
        decisionCode: "RISK_EVALUATED",
        traceHash: riskTraceHash,
        level: riskAssessment.cvfRiskLevel,
        score: riskAssessment.score,
        reasons: riskAssessment.reasons,
        timestamp: Date.now()
      })
      this.riskLineage.addNode({
        id: `${requestId}-risk`,
        domain: input.domain,
        risk: riskAssessment.cvfRiskLevel,
        timestamp: Date.now()
      })
      this.riskLineage.addEdge(`${requestId}-input`, `${requestId}-risk`)
      this.audit.log("risk", `Risk assessed at ${riskAssessment.cvfRiskLevel}`)

      const rollback = this.rollback.plan(riskAssessment)
      if (rollback.required) {
        this.boundaryHistory.capture({
          requestId,
          policyVersion: this.policyVersion,
          decisionCode: "ROLLBACK_REQUIRED",
          traceHash: riskTraceHash,
          domain: input.domain,
          contractValid: true,
          refusalTriggered: true,
          timestamp: Date.now()
        })
        this.audit.log("rollback", rollback.reason || "rollback_required")
        return {
          message: rollback.safeMessage || "Output withheld by rollback policy.",
          risk: riskAssessment.cvfRiskLevel,
          policyVersion: this.policyVersion,
          requestId,
          traceHash: riskTraceHash
        }
      }

      const refusalDecision = this.refusal.evaluate(riskAssessment)
      if (refusalDecision.blocked) {
        const refusalCode: KernelDecisionCode =
          refusalDecision.action === "block"
            ? "REFUSAL_BLOCK"
            : refusalDecision.action === "needs_approval"
              ? "REFUSAL_APPROVAL"
              : "REFUSAL_CLARIFY"

        this.boundaryHistory.capture({
          requestId,
          policyVersion: refusalDecision.policyVersion,
          decisionCode: refusalCode,
          traceHash: riskTraceHash,
          domain: input.domain,
          contractValid: true,
          refusalTriggered: true,
          timestamp: Date.now()
        })
        this.audit.log("refusal", `Refusal action: ${refusalDecision.action}`)
        return {
          ...refusalDecision.response,
          policyVersion: refusalDecision.policyVersion,
          requestId,
          traceHash: riskTraceHash
        }
      }

      if (input.creativeMode) {
        this.creative.enable()
      } else {
        this.creative.disable()
      }
      let finalOutput = this.creative.adjust(
        rawOutput,
        domainContext,
        riskAssessment.cvfRiskLevel
      )

      this.contract.validateOutput({ type: "text" }, input.contract)
      if (input.ioContract) {
        finalOutput = this.runtimeContract.execute(finalOutput, {
          ioContract: input.ioContract,
          consumerRole: input.consumerRole || "assistant",
          transformRequested: input.transformRequested || false,
          declaredDomain: input.domain
        })
      }

      const outputTraceHash = this.computeTraceHash([
        requestId,
        this.policyVersion,
        input.domain,
        riskAssessment.cvfRiskLevel,
        finalOutput
      ])

      this.lineage.record({
        id: `${requestId}-output`,
        parentIds: [`${requestId}-input`],
        domain: input.domain,
        requestId,
        policyVersion: this.policyVersion,
        decisionCode: "ALLOW_RELEASED",
        traceHash: outputTraceHash,
        timestamp: Date.now()
      })
      this.lineageStore.add({
        id: `${requestId}-output`,
        type: "output",
        parentIds: [`${requestId}-input`],
        domain: input.domain,
        timestamp: Date.now()
      })
      this.riskLineage.addNode({
        id: `${requestId}-output`,
        domain: input.domain,
        risk: riskAssessment.cvfRiskLevel,
        timestamp: Date.now()
      })
      this.riskLineage.addEdge(`${requestId}-risk`, `${requestId}-output`)
      this.invariants.validateNoCrossDomainReuse()
      this.audit.log("output", "Output released")

      this.boundaryHistory.capture({
        requestId,
        policyVersion: this.policyVersion,
        decisionCode: "ALLOW_RELEASED",
        traceHash: outputTraceHash,
        domain: input.domain,
        contractValid: true,
        refusalTriggered: false,
        timestamp: Date.now()
      })

      return finalOutput
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown pipeline error"
      const traceHash = this.computeTraceHash([
        requestId,
        this.policyVersion,
        input.domain,
        "PIPELINE_ERROR",
        message
      ])
      const inferredRisk = message.toLowerCase().includes("timeout") ? "R3" : "R4"

      this.riskHistory.record({
        requestId,
        policyVersion: this.policyVersion,
        decisionCode: "PIPELINE_ERROR",
        traceHash,
        level: inferredRisk,
        score: 100,
        reasons: [message],
        timestamp: Date.now()
      })
      this.boundaryHistory.capture({
        requestId,
        policyVersion: this.policyVersion,
        decisionCode: "PIPELINE_ERROR",
        traceHash,
        domain: input.domain,
        contractValid: false,
        refusalTriggered: true,
        timestamp: Date.now()
      })
      this.audit.log("error", message)
      this.session.setRisk(inferredRisk)

      return {
        message: "Output withheld due to runtime safety failure.",
        risk: inferredRisk,
        policyVersion: this.policyVersion,
        requestId,
        traceHash,
        errorCode: message.toLowerCase().includes("timeout")
          ? "LLM_TIMEOUT"
          : "PIPELINE_ERROR"
      }
    }
  }

  getPolicyVersion(): string {
    return this.policyVersion
  }

  getTelemetry() {
    return {
      session: {
        domain: this.session.getDomain(),
        risk: this.session.getRisk()
      },
      policyVersion: this.policyVersion,
      lineage: this.lineage.getAll(),
      contaminationLineage: this.riskLineage.getSnapshot(),
      riskEvolution: this.riskHistory.getHistory(),
      boundarySnapshots: this.boundaryHistory.getAll(),
      trace: this.traceReporter.generateReport()
    }
  }
}
