import { ExecutionLog } from "../internal_ledger/execution.log";
import { CostLedger } from "../internal_ledger/cost.ledger";

export interface ExecutionContext {
  execution_id: string;
  skill_id: string;
  risk_score: number;
  cost_estimate: number;
}

export class ExecutionEngine {
  constructor(
    private executionLog: ExecutionLog,
    private costLedger: CostLedger
  ) {}

  async execute(
    context: ExecutionContext,
    handler: () => Promise<any>
  ): Promise<any> {
    const start = Date.now();

    try {
      const result = await handler();

      const runtime = Date.now() - start;

      this.executionLog.log({
        execution_id: context.execution_id,
        skill_id: context.skill_id,
        risk_score: context.risk_score,
        cost_estimate: context.cost_estimate,
        approved: true,
        timestamp: Date.now(),
        result_status: "success"
      });

      this.costLedger.record({
        execution_id: context.execution_id,
        tokens_used: 0,
        runtime_ms: runtime,
        external_cost_flag: false,
        timestamp: Date.now()
      });

      return result;
    } catch (err) {
      this.executionLog.log({
        execution_id: context.execution_id,
        skill_id: context.skill_id,
        risk_score: context.risk_score,
        cost_estimate: context.cost_estimate,
        approved: true,
        timestamp: Date.now(),
        result_status: "failure"
      });

      throw err;
    }
  }
}