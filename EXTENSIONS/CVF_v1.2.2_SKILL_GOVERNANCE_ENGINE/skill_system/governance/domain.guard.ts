import { readFileSync } from "fs";
import * as yaml from "js-yaml";

export class DomainGuard {

  static isAllowed(skillDomain: string, policyPath: string): boolean {
    const policy: any = yaml.load(readFileSync(policyPath, "utf8"));

    const allowedDomains = policy.allowed_domains || [];

    return allowedDomains.includes(skillDomain);
  }
}