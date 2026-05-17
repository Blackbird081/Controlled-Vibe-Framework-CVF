// uat.runner.ts
// Executes User Acceptance Testing for CVF-governed skills

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"
import { skillRegistry } from "../02_TOOLKIT_CORE/skill.registry"

export interface UATCase {
  id: string
  description: string
  expectedOutcome: string
  execute: () => Promise<string>
}

export interface UATResult {
  skillId: string
  passed: boolean
  details: string[]
}

export class UATRunner {

  async run(skillId: string, cases: UATCase[]): Promise<UATResult> {

    const skill = skillRegistry.get(skillId)

    const results: string[] = []
    let passed = true

    for (const testCase of cases) {
      try {
        const output = await testCase.execute()

        if (output !== testCase.expectedOutcome) {
          passed = false
          results.push(
            `Case ${testCase.id} failed. Expected: ${testCase.expectedOutcome}, got: ${output}`
          )
        } else {
          results.push(`Case ${testCase.id} passed.`)
        }
      } catch (err: any) {
        passed = false
        results.push(`Case ${testCase.id} error: ${err.message}`)
      }
    }

    auditLogger.log({
      eventType: "UAT_EXECUTION",
      skillId,
      details: {
        passed,
        results
      }
    })

    return {
      skillId,
      passed,
      details: results
    }
  }
}

export const uatRunner = new UATRunner()
