import { readFileSync } from "fs";

export interface TraceInsight {
  skillId: string;
  successRate: number;
  averageExecutionTime: number;
}

export class TraceAnalyzer {

  static analyze(tracePath: string): TraceInsight[] {

    const lines = readFileSync(tracePath, "utf8")
      .split("\n")
      .filter(Boolean);

    const stats: Record<string, { success: number; total: number; time: number }> = {};

    for (const line of lines) {
      const parsed = JSON.parse(line);

      if (!stats[parsed.skillId]) {
        stats[parsed.skillId] = { success: 0, total: 0, time: 0 };
      }

      stats[parsed.skillId].total += 1;
      stats[parsed.skillId].time += parsed.executionTimeMs;
      if (parsed.success) stats[parsed.skillId].success += 1;
    }

    return Object.keys(stats).map(skillId => ({
      skillId,
      successRate: stats[skillId].success / stats[skillId].total,
      averageExecutionTime: stats[skillId].time / stats[skillId].total
    }));
  }

}