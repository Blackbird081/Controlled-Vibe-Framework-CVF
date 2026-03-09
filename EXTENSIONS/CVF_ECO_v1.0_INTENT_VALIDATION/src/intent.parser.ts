import { IntentResult, Domain, DomainDefinition } from "./types";
import { findDomains, findActions } from "./domain.registry";

const AMOUNT_PATTERN = /\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\/\s*(day|hour|minute|month|week|year))?/gi;
const APPROVAL_KEYWORDS = ["ask me", "approval", "confirm", "permission", "authorize", "check with me", "my consent", "without asking"];
const NEGATION_KEYWORDS = ["never", "don't", "do not", "must not", "cannot", "can't", "shouldn't", "forbidden", "prohibit", "block", "prevent", "disallow"];
const OBJECT_PATTERNS = [
  /(?:on|for|to|from|with|about|regarding)\s+([a-z][a-z\s]{1,30}?)(?:\s+(?:without|if|when|that|which|and|or|$))/gi,
  /(?:let\s+\w+\s+)(\w+(?:\s+\w+){0,3}?)(?:\s+(?:over|more|less|above|below|without))/gi,
];

export class IntentParser {
  parse(vibe: string): IntentResult {
    const domains = findDomains(vibe);
    const primaryDomain = this.selectPrimaryDomain(domains);
    const actions = findActions(vibe, domains);
    const limits = this.extractLimits(vibe);
    const requireApproval = this.detectApprovalRequirement(vibe);
    const object = this.extractObject(vibe);
    const confidence = this.computeConfidence(domains, actions, limits);

    return {
      domain: primaryDomain.domain,
      action: actions[0] ?? "unknown",
      object,
      limits,
      requireApproval,
      confidence,
      rawVibe: vibe,
    };
  }

  private selectPrimaryDomain(domains: DomainDefinition[]): DomainDefinition {
    return domains[0];
  }

  private extractLimits(vibe: string): Record<string, unknown> {
    const limits: Record<string, unknown> = {};
    const hasNegation = NEGATION_KEYWORDS.some((kw) => vibe.toLowerCase().includes(kw));

    let match: RegExpExecArray | null;
    const amountRegex = new RegExp(AMOUNT_PATTERN.source, AMOUNT_PATTERN.flags);

    while ((match = amountRegex.exec(vibe)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      const period = match[2]?.toLowerCase() ?? "total";

      if (period !== "total") {
        limits[`max_per_${period}`] = value;
      } else {
        limits["max_amount"] = value;
      }

      if (hasNegation) {
        limits["hard_limit"] = true;
      }
    }

    const countMatch = vibe.match(/(\d+)\s*(times?|requests?|calls?|attempts?)/i);
    if (countMatch) {
      limits["max_count"] = parseInt(countMatch[1], 10);
    }

    return limits;
  }

  private detectApprovalRequirement(vibe: string): boolean {
    const lower = vibe.toLowerCase();
    return APPROVAL_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private extractObject(vibe: string): string {
    for (const pattern of OBJECT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(vibe);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    const simpleMatch = vibe.match(/(?:on|for|to)\s+(\w+(?:\s+\w+)?)/i);
    return simpleMatch?.[1]?.trim() ?? "unspecified";
  }

  private computeConfidence(
    domains: DomainDefinition[],
    actions: string[],
    limits: Record<string, unknown>
  ): number {
    let score = 0.3;

    if (domains.length > 0 && domains[0].domain !== "general") score += 0.25;
    if (actions.length > 0) score += 0.25;
    if (Object.keys(limits).length > 0) score += 0.2;

    return Math.min(score, 1.0);
  }
}
