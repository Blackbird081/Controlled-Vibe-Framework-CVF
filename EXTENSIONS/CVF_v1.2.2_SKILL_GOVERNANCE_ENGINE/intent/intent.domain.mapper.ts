import { readFileSync } from "fs";
import * as yaml from "js-yaml";

export interface DomainMappingResult {
  domain: string;
  allowed: boolean;
}

export class IntentDomainMapper {

  static map(
    normalizedIntent: string,
    domainPolicyPath: string
  ): DomainMappingResult {

    const policy: any = yaml.load(readFileSync(domainPolicyPath, "utf8"));

    const domainKeywords: Record<string, string[]> =
      policy.domain_keywords || {};

    for (const domain of Object.keys(domainKeywords)) {
      const keywords = domainKeywords[domain];

      for (const keyword of keywords) {
        if (normalizedIntent.includes(keyword.toLowerCase())) {
          return {
            domain,
            allowed: true
          };
        }
      }
    }

    return {
      domain: "unknown",
      allowed: false
    };
  }

}