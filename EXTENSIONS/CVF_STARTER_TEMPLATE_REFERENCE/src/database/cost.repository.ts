// src/database/cost.repository.ts

export interface CostRecord {
  projectId: string;
  tokens: number;
  costUsd: number;
  timestamp: number;
}

export interface CostRepository {
  save(record: CostRecord): Promise<void>;
  getDailyCost(projectId: string): Promise<number>;
  record(data: { projectId: string; tokens: number; costUsd: number }): Promise<void>;
}

export class InMemoryCostRepository implements CostRepository {
  private records: CostRecord[] = [];

  async save(record: CostRecord): Promise<void> {
    this.records.push(record);
  }

  async getDailyCost(projectId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    return this.records
      .filter(
        (r) => r.projectId === projectId && r.timestamp >= startOfDay
      )
      .reduce((sum, r) => sum + r.costUsd, 0);
  }

  async record(data: {
    projectId: string;
    tokens: number;
    costUsd: number;
  }): Promise<void> {
    this.records.push({
      projectId: data.projectId,
      tokens: data.tokens,
      costUsd: data.costUsd,
      timestamp: Date.now(),
    });
  }

  getAll(): CostRecord[] {
    return this.records;
  }
}
