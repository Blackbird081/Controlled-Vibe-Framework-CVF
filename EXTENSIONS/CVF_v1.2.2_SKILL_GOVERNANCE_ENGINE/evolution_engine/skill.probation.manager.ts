import { appendFileSync } from "fs";

export class SkillProbationManager {

  static recordAttempt(path: string, skillId: string, success: boolean): void {
    appendFileSync(
      path,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        skillId,
        success
      }) + "\n"
    );
  }

}