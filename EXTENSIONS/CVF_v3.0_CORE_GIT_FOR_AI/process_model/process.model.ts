/**
 * Process Model (CVF v3.0 — Layer 0)
 *
 * Formalizes phase transitions as a first-class CVF primitive.
 * Every state transition in a CVF process must be:
 *   1. Deterministic (same inputs → same next state)
 *   2. Governance-validated (gate checks pass before advance)
 *   3. Traceable (transition recorded in commit lineage)
 *
 * Mapping to Git:
 *   Git branch     → CVFProcess (independent development line)
 *   git checkout   → switchProcess()
 *   git merge      → mergeProcess() (future — v3.x)
 *
 * Design (De_xuat_09 — Process Model):
 *   - A Process is a named sequence of PhaseStages.
 *   - Each process tracks current stage, history, and the commits that drove transitions.
 *   - Multiple processes can run in parallel (multi-agent scenarios).
 */

export type ProcessStatus =
    | "ACTIVE"      // Process is currently running
    | "PAUSED"      // Process is temporarily suspended
    | "COMPLETED"   // Process reached COMPLETE stage
    | "ABORTED";    // Process was terminated before completion

export interface ProcessTransition {
    /** Stage transitioned FROM */
    from_stage: string;
    /** Stage transitioned TO */
    to_stage: string;
    /** AICommit that triggered this transition */
    triggered_by_commit: string;
    /** ISO 8601 timestamp of transition */
    timestamp: string;
    /** Governance gate result for this transition */
    gate_passed: boolean;
}

export interface CVFProcess {
    /** Unique process identifier */
    process_id: string;
    /** Human-readable process name */
    name: string;
    /** Component being developed in this process */
    component: string;
    /** Current phase stage */
    current_stage: string;
    /** Ordered stage sequence this process follows */
    stage_sequence: string[];
    /** Status of this process */
    status: ProcessStatus;
    /** Full transition history — append-only */
    transitions: ProcessTransition[];
    /** ISO 8601 timestamp of process creation */
    created_at: string;
    /** ISO 8601 timestamp of last update */
    updated_at: string;
}

// ─── ProcessModel ─────────────────────────────────────────────────────────────

export class ProcessModel {
    private processes = new Map<string, CVFProcess>();

    /** Default CVF stage sequence (matches PhaseProtocol in v1.1.x) */
    static readonly DEFAULT_STAGE_SEQUENCE = [
        "SPEC",
        "STATE_MACHINE",
        "STATE_DIAGRAM",
        "IMPLEMENTATION",
        "STATE_VALIDATION",
        "UNIT_TESTING",
        "SCENARIO_SIMULATION",
        "PHASE_GATE",
        "COMPLETE",
    ];

    /**
     * createProcess()
     * Initializes a new CVF Process at the first stage.
     */
    public createProcess(
        process_id: string,
        name: string,
        component: string,
        stage_sequence: string[] = ProcessModel.DEFAULT_STAGE_SEQUENCE
    ): CVFProcess {
        if (stage_sequence.length === 0) {
            throw new Error("ProcessModel: stage_sequence must not be empty");
        }

        const now = new Date().toISOString();
        const process: CVFProcess = {
            process_id,
            name,
            component,
            current_stage: stage_sequence[0],
            stage_sequence,
            status: "ACTIVE",
            transitions: [],
            created_at: now,
            updated_at: now,
        };

        this.processes.set(process_id, process);
        return process;
    }

    /**
     * advanceStage()
     *
     * Advances the process to the next stage.
     * Requires gate_passed = true to proceed (governance enforcement).
     * Records the transition with the triggering commit.
     *
     * @throws Error if gate did not pass, or if already at final stage
     */
    public advanceStage(
        process_id: string,
        triggered_by_commit: string,
        gate_passed: boolean
    ): CVFProcess {
        const process = this.getOrThrow(process_id);

        if (process.status !== "ACTIVE") {
            throw new Error(`Process "${process_id}" is ${process.status} — cannot advance stage`);
        }

        if (!gate_passed) {
            throw new Error(
                `Process "${process_id}": stage transition blocked — governance gate did not pass`
            );
        }

        const currentIndex = process.stage_sequence.indexOf(process.current_stage);
        if (currentIndex === -1 || currentIndex === process.stage_sequence.length - 1) {
            throw new Error(
                `Process "${process_id}": already at final stage "${process.current_stage}"`
            );
        }

        const next_stage = process.stage_sequence[currentIndex + 1];
        const now = new Date().toISOString();

        const transition: ProcessTransition = {
            from_stage: process.current_stage,
            to_stage: next_stage,
            triggered_by_commit,
            timestamp: now,
            gate_passed,
        };

        process.transitions.push(transition);
        process.current_stage = next_stage;
        process.updated_at = now;

        // Auto-complete when reaching final stage
        if (currentIndex + 1 === process.stage_sequence.length - 1) {
            process.status = "COMPLETED";
        }

        return process;
    }

    public getProcess(process_id: string): CVFProcess | undefined {
        return this.processes.get(process_id);
    }

    public getAllActive(): CVFProcess[] {
        return [...this.processes.values()].filter((p) => p.status === "ACTIVE");
    }

    public getAll(): CVFProcess[] {
        return [...this.processes.values()];
    }

    private getOrThrow(process_id: string): CVFProcess {
        const process = this.processes.get(process_id);
        if (!process) throw new Error(`Process "${process_id}" not found`);
        return process;
    }
}
