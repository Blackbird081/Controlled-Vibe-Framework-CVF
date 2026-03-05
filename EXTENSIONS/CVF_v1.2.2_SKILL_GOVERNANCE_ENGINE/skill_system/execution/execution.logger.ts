import { appendFileSync } from "fs";

export class ExecutionLogger {

  static logUsage(logPath: string, skillId: string, success: boolean): void {
    const record = {
      timestamp: new Date().toISOString(),
      skillId,
      success
    };

    appendFileSync(logPath, JSON.stringify(record) + "\n");
  }

  static logTrace(tracePath: string, trace: any): void {
    appendFileSync(tracePath, JSON.stringify(trace) + "\n");
  }
}