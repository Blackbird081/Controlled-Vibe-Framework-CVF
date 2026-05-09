export interface ExecutionRecord {
  execution_id: string;
  skill_id: string;
  risk_score: number;
  cost_estimate: number;
  approved: boolean;
  timestamp: number;
  result_status: "success" | "failure" | "refused";
}

export class ExecutionLog {
  private records: ExecutionRecord[] = [];

  log(record: ExecutionRecord) {
    this.records.push(record);
  }

  getAll(): ExecutionRecord[] {
    return this.records;
  }

  filterBySkill(skillId: string): ExecutionRecord[] {
    return this.records.filter(r => r.skill_id === skillId);
  }
}