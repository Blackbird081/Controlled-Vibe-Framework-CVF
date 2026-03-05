import { readFileSync } from "fs";

export class HistoricalWeight {

  static apply(candidates: any[], usageLogPath: string): any[] {

    const log = readFileSync(usageLogPath, "utf8").split("\n");

    const usageMap = new Map<string, number>();

    for (const line of log) {
      if (!line) continue;
      const parsed = JSON.parse(line);
      const count = usageMap.get(parsed.skillId) || 0;
      usageMap.set(parsed.skillId, count + 1);
    }

    return candidates.map(c => ({
      ...c,
      historicalScore: usageMap.get(c.id) || 0
    }));
  }
}