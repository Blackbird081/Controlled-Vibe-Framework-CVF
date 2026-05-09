import { checkDiagramConsistency } from "./diagram.consistency.check";
import { parseMermaidStateDiagram } from "./mermaid.parser";
import { StateMachine } from "../state_enforcement/state.machine.parser";

export interface DiagramValidationResult {
    passed: boolean;
    missingStates: string[];
    missingTransitions: string[];
    extraStates: string[];
    extraTransitions: string[];
}

function enumerateMachineTransitions(machine: StateMachine): string[] {
    const transitions: string[] = [];

    for (const [from, targets] of Object.entries(machine.transitions)) {
        for (const to of targets) {
            transitions.push(`${from}->${to}`);
        }
    }

    return transitions;
}

export function validateDiagram(
    machine: StateMachine,
    rawDiagramContext: string
): DiagramValidationResult {
    const result: DiagramValidationResult = {
        passed: true,
        missingStates: [],
        missingTransitions: [],
        extraStates: [],
        extraTransitions: []
    };

    if (!rawDiagramContext || rawDiagramContext.trim() === "") {
        return {
            passed: false,
            missingStates: [...machine.states],
            missingTransitions: enumerateMachineTransitions(machine),
            extraStates: [],
            extraTransitions: []
        };
    }

    const diagram = parseMermaidStateDiagram(rawDiagramContext);
    const consistencyIssues = checkDiagramConsistency(machine, diagram);

    for (const issue of consistencyIssues) {
        if (issue.startsWith("Missing state in diagram: ")) {
            result.missingStates.push(issue.replace("Missing state in diagram: ", ""));
            continue;
        }

        if (issue.startsWith("Missing transition in diagram: ")) {
            const edge = issue
                .replace("Missing transition in diagram: ", "")
                .replace(/\s*->\s*/g, "->");
            result.missingTransitions.push(edge);
        }
    }

    const machineStates = new Set(machine.states);
    for (const state of diagram.states) {
        if (!machineStates.has(state)) {
            result.extraStates.push(state);
        }
    }

    for (const [from, targets] of diagram.transitions.entries()) {
        const machineTargets = new Set(machine.transitions[from] ?? []);
        for (const to of targets) {
            if (!machineTargets.has(to)) {
                result.extraTransitions.push(`${from}->${to}`);
            }
        }
    }

    result.passed =
        result.missingStates.length === 0 &&
        result.missingTransitions.length === 0 &&
        result.extraStates.length === 0 &&
        result.extraTransitions.length === 0;

    return result;
}
