import { readFileSync } from "fs";
import * as yaml from "js-yaml";

export class PolicyBinding {

  static bind(skill: any, globalPolicyPath: string): any {
    const policy: any = yaml.load(readFileSync(globalPolicyPath, "utf8"));

    return {
      ...skill,
      policy_constraints: policy.constraints || {}
    };
  }
}