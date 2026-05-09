export interface CostRecord {
  execution_id: string;
  tokens_used: number;
  runtime_ms: number;
  external_cost_flag: boolean;
  timestamp: number;
}

export class CostLedger {
  private records: CostRecord[] = [];

  record(entry: CostRecord) {
    this.records.push(entry);
  }

  getTotalTokens(): number {
    return this.records.reduce((sum, r) => sum + r.tokens_used, 0);
  }

  getTotalRuntime(): number {
    return this.records.reduce((sum, r) => sum + r.runtime_ms, 0);
  }

  list(): CostRecord[] {
    return this.records;
  }
}