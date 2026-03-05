import { appendFileSync } from "fs";

export interface ExperienceRecord {
  timestamp: string;
  intent: string;
  skillId: string;
  success: boolean;
  executionTimeMs: number;
}

export class ExperienceCollector {

  static collect(path: string, record: ExperienceRecord): void {
    appendFileSync(path, JSON.stringify(record) + "\n");
  }

}