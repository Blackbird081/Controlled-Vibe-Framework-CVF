import { describe, expect, it } from 'vitest'
import { parseStateMachine } from '../governance/state_enforcement/state.machine.parser.js'
import { validateStateMachine } from '../governance/state_enforcement/state.machine.validator.js'
import { StateTransitionChecker } from '../governance/state_enforcement/state.transition.checker.js'
import { detectDeadlocks } from '../governance/state_enforcement/deadlock.detector.js'
import { generateScenarios } from '../governance/scenario_simulator/scenario.generator.js'
import { traceExecution } from '../governance/scenario_simulator/execution.trace.js'
import { simulateFailures } from '../governance/scenario_simulator/failure.simulator.js'
import { ArtifactRegistry } from '../governance/phase_protocol/artifact.registry.js'
import { GateRules } from '../governance/phase_gate/gate.rules.js'
import { createGateResult } from '../governance/phase_gate/gate.result.js'
import { PhaseGate } from '../governance/phase_gate/phase.gate.js'

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

        const blocked = traceExecution(['A', 'X'], () => false)
        expect(blocked.success).toBe(false)
        expect(blocked.error).toContain('A->X blocked')
    })

    it('simulateFailures reports disabled transition keys', () => {
        const result = simulateFailures(machine, ['INIT_A->MIDDLE'])
        expect(result.failedTransitions).toEqual(['INIT_A->MIDDLE'])
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
        reg.registerArtifact('state.machine', '/tmp/machine')
        const checks = GateRules.validateArtifacts(reg)
        const featureSpec = checks.find(c => c.rule === 'feature_spec_exists')
        expect(featureSpec?.critical).toBe(true)

        const result = createGateResult('comp', checks)
        expect(result.status).toBe('REJECTED')
        expect(result.riskLevel).toBe('R3')
    })

    it('PhaseGate evaluate/enforce passes when all required artifacts exist', () => {
        const reg = new ArtifactRegistry('comp')
        for (const artifactType of [
            'feature.spec',
            'state.machine',
            'state.diagram',
            'implementation',
            'unit.tests',
            'scenario.tests',
        ]) {
            reg.registerArtifact(artifactType, `/tmp/${artifactType}`)
        }

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
})
