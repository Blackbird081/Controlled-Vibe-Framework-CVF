import { describe, expect, it } from 'vitest'
import { parseStateMachine } from '../governance/state_enforcement/state.machine.parser.js'
import { validateStateMachine } from '../governance/state_enforcement/state.machine.validator.js'
import { StateTransitionChecker } from '../governance/state_enforcement/state.transition.checker.js'
import { detectDeadlocks } from '../governance/state_enforcement/deadlock.detector.js'
import { generateScenarios, checkInvariants, BUILT_IN_INVARIANTS } from '../governance/scenario_simulator/scenario.generator.js'
import { traceExecution, detectAnomalies, AnomalyType } from '../governance/scenario_simulator/execution.trace.js'
import { simulateFailures } from '../governance/scenario_simulator/failure.simulator.js'
import { ArtifactRegistry } from '../governance/phase_protocol/artifact.registry.js'
import { GateRules, GOVERNANCE_PIPELINE } from '../governance/phase_gate/gate.rules.js'
import { createGateResult } from '../governance/phase_gate/gate.result.js'
import { PhaseGate } from '../governance/phase_gate/phase.gate.js'
import { PhaseProtocol, PHASE_CAPABILITIES, CapabilityViolationError } from '../governance/phase_protocol/phase.protocol.js'

// Helper: register all required artifacts WITH content (v1.1.2 hash requirement)
function registerAllArtifacts(reg: ArtifactRegistry): void {
    for (const artifactType of [
        'feature.spec',
        'state.machine',
        'state.diagram',
        'implementation',
        'unit.tests',
        'scenario.tests',
    ]) {
        reg.registerArtifact(artifactType, `/tmp/${artifactType}`, `content-of-${artifactType}`)
    }
}

describe('v1.1.1 state enforcement', () => {
    it('parseStateMachine validates transition shape', () => {
        const ok = parseStateMachine({
            states: ['A', 'B'],
            transitions: { A: ['B'], B: [] },
        })
        expect(ok.states).toEqual(['A', 'B'])

        expect(() =>
            parseStateMachine({
                states: ['A'],
                transitions: { A: 'B' },
            })
        ).toThrow('string[]')

        expect(() =>
            parseStateMachine({
                states: ['A'],
                transitions: { A: [1] },
            })
        ).toThrow('invalid transition target type')

        expect(() => parseStateMachine({ transitions: { A: ['B'] } })).toThrow('invalid states')
        expect(() => parseStateMachine({ states: ['A'] })).toThrow('transitions missing')
    })

    it('validateStateMachine catches invalid from/to transitions', () => {
        expect(() =>
            validateStateMachine({
                states: ['A'],
                transitions: { X: ['A'] },
            })
        ).toThrow('Invalid state: X')

        expect(() =>
            validateStateMachine({
                states: ['A'],
                transitions: { A: ['B'] },
            })
        ).toThrow('Invalid transition: A -> B')
    })

    it('StateTransitionChecker checks allowed transitions', () => {
        const checker = new StateTransitionChecker({
            states: ['A', 'B'],
            transitions: { A: ['B'], B: [] },
        })
        expect(checker.canTransition('A', 'B')).toBe(true)
        expect(checker.canTransition('B', 'A')).toBe(false)
    })

    it('detectDeadlocks reports cycles and non-terminal dead-end states', () => {
        const issues = detectDeadlocks({
            states: ['A', 'B', 'C', 'DONE'],
            transitions: {
                A: ['B'],
                B: ['A'],
                C: [],
                DONE: [],
            },
        }, { terminalStates: ['DONE'] })

        expect(issues).toContain('A')
        expect(issues).toContain('C')
        expect(issues).not.toContain('DONE')
    })
})

describe('v1.1.1 scenario simulation', () => {
    const machine = {
        states: ['INIT_A', 'INIT_B', 'MIDDLE', 'END'],
        transitions: {
            INIT_A: ['MIDDLE'],
            INIT_B: ['END'],
            MIDDLE: ['END'],
            END: [],
        },
    }

    it('generateScenarios explores all inferred entry states', () => {
        const scenarios = generateScenarios(machine, 20, 10)
        const joined = scenarios.map(s => s.join('>'))
        expect(joined.some(s => s.startsWith('INIT_A>'))).toBe(true)
        expect(joined.some(s => s.startsWith('INIT_B>'))).toBe(true)
    })

    it('generateScenarios respects maxScenarios and maxDepth', () => {
        const scenarios = generateScenarios(machine, 1, 2)
        expect(scenarios.length).toBeLessThanOrEqual(1)
        expect(scenarios[0]!.length).toBeLessThanOrEqual(2)
    })

    it('traceExecution returns failure at blocked transition and success otherwise', () => {
        const ok = traceExecution(['A', 'B'], (from, to) => from === 'A' && to === 'B')
        expect(ok.success).toBe(true)
        expect(ok.anomalies).toBeDefined()

        const blocked = traceExecution(['A', 'X'], () => false)
        expect(blocked.success).toBe(false)
        expect(blocked.error).toContain('A->X blocked')
    })

    it('simulateFailures reports disabled transition keys', () => {
        const result = simulateFailures(machine, ['INIT_A->MIDDLE'])
        expect(result.failedTransitions).toEqual(['INIT_A->MIDDLE'])
    })

    // ── v1.1.2: Self-Debugging Anomaly Detection (De_xuat_04) ─────────────
    it('detectAnomalies catches DEAD_PATH, LOOP_TRAP', () => {
        const anom = detectAnomalies({
            states: ['A', 'B', 'C'],
            transitions: {
                A: ['B'],
                B: ['B'],   // loop trap
                C: [],      // dead path (not terminal)
            },
        })
        const types = anom.map(a => a.type)
        expect(types).toContain('DEAD_PATH' as AnomalyType)
        expect(types).toContain('LOOP_TRAP' as AnomalyType)
    })

    // ── v1.1.2: System Invariants (De_xuat_05) ────────────────────────────
    it('checkInvariants INV-03 fails for empty scenario set', () => {
        const violations = checkInvariants({ states: [], transitions: {} }, [])
        const ids = violations.map(v => v.invariantId)
        expect(ids).toContain('INV-03')
    })

    it('BUILT_IN_INVARIANTS has at least 3 invariant rules', () => {
        expect(BUILT_IN_INVARIANTS.length).toBeGreaterThanOrEqual(3)
    })
})

describe('v1.1.1 phase gate and artifact governance', () => {
    it('ArtifactRegistry register/find/clear lifecycle', () => {
        const reg = new ArtifactRegistry('comp')
        reg.registerArtifact('feature.spec', '/tmp/spec')
        expect(reg.hasArtifact('feature.spec')).toBe(true)
        expect(reg.findArtifact('feature.spec')?.path).toBe('/tmp/spec')
        reg.clear()
        expect(reg.getArtifacts()).toHaveLength(0)
    })

    it('GateRules mark critical checks and createGateResult reaches R3 on single critical failure', () => {
        const reg = new ArtifactRegistry('comp')
        reg.registerArtifact('state.machine', '/tmp/machine', 'content')
        const checks = GateRules.validateArtifacts(reg)
        const featureSpec = checks.find(c => c.rule === 'feature_spec_exists')
        expect(featureSpec?.critical).toBe(true)

        const result = createGateResult('comp', checks)
        expect(result.status).toBe('REJECTED')
        expect(result.riskLevel).toBe('R3')
    })

    // ── v1.1.2: GOVERNANCE_PIPELINE (De_xuat_02) ─────────────────────────
    it('GOVERNANCE_PIPELINE has 6 modules in fixed order', () => {
        expect(GOVERNANCE_PIPELINE).toHaveLength(6)
        expect(GOVERNANCE_PIPELINE[0]).toBe('state_enforcement')
        expect(GOVERNANCE_PIPELINE[4]).toBe('artifact_integrity')
        expect(GOVERNANCE_PIPELINE[5]).toBe('reports')
    })

    // ── v1.1.2: Trust Boundary + Hash Ledger (De_xuat_06) ─────────────────
    it('verifyAllHashes returns false without content, true with content', () => {
        const reg = new ArtifactRegistry('comp')
        reg.registerArtifact('feature.spec', '/tmp/spec')    // no content → no hash
        expect(reg.verifyAllHashes()).toBe(false)

        const reg2 = new ArtifactRegistry('comp')
        reg2.registerArtifact('feature.spec', '/tmp/spec', 'actual-content')
        expect(reg2.verifyAllHashes()).toBe(true)
    })

    it('detectTampering returns true for matching content, false for tampered', () => {
        const reg = new ArtifactRegistry('comp')
        reg.registerArtifact('feature.spec', '/tmp/spec', 'original-content')
        expect(reg.detectTampering('feature.spec', 'original-content')).toBe(true)
        expect(reg.detectTampering('feature.spec', 'tampered-content')).toBe(false)
    })

    it('getHashLedger returns only hashed artifacts', () => {
        const reg = new ArtifactRegistry('comp')
        reg.registerArtifact('feature.spec', '/tmp/spec', 'content')
        reg.registerArtifact('state.machine', '/tmp/sm')     // no hash
        const ledger = reg.getHashLedger()
        expect(ledger).toHaveLength(1)
        expect(ledger[0].type).toBe('feature.spec')
    })

    it('PhaseGate evaluate/enforce passes when all required artifacts exist WITH hashes', () => {
        const reg = new ArtifactRegistry('comp')
        registerAllArtifacts(reg)

        const gate = new PhaseGate({ componentName: 'comp' }, reg)
        const result = gate.evaluate()
        expect(result.status).toBe('APPROVED')
        expect(result.riskLevel).toBe('R0')
        expect(() => gate.enforce()).not.toThrow()
    })

    it('PhaseGate enforce throws with failed check names on rejection', () => {
        const reg = new ArtifactRegistry('comp')
        const gate = new PhaseGate({ componentName: 'comp' }, reg)
        expect(() => gate.enforce()).toThrow('Failed checks')
    })

    // ── v1.1.2: Capability Isolation (De_xuat_07) ─────────────────────────
    it('PHASE_CAPABILITIES maps stages to allowed artifact types', () => {
        expect(PHASE_CAPABILITIES['SPEC']).toContain('feature.spec')
        expect(PHASE_CAPABILITIES['STATE_MACHINE']).toContain('state.machine')
        expect(PHASE_CAPABILITIES['PHASE_GATE']).toHaveLength(0)
    })

    it('PhaseProtocol.registerArtifact throws CapabilityViolationError for wrong stage', () => {
        const protocol = new PhaseProtocol({ componentName: 'comp' })
        protocol.startPhase() // stage = SPEC
        // Allowed in SPEC: feature.spec only
        expect(() =>
            protocol.registerArtifact('state.machine', '/tmp/sm', 'content')
        ).toThrow(CapabilityViolationError)
    })

    it('PhaseProtocol.registerArtifact succeeds for allowed artifact type in current stage', () => {
        const protocol = new PhaseProtocol({ componentName: 'comp' })
        protocol.startPhase() // stage = SPEC
        expect(() =>
            protocol.registerArtifact('feature.spec', '/tmp/spec', 'content')
        ).not.toThrow()
    })
})
