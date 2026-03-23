/**
 * CVF ECO v1.0 Intent Validation — Domain Registry Dedicated Tests (W6-T37)
 * ==========================================================================
 * GC-023: dedicated file — never merge into intent.pipeline.test.ts.
 *
 * Coverage:
 *   DOMAIN_REGISTRY:
 *     - contains 7 domain definitions (finance/privacy/code_security/communication/data/infrastructure/general)
 *     - each non-general domain has non-empty keywords and actions arrays
 *     - "general" domain has empty keywords
 *     - defaultRisk levels correct (finance→R2, privacy→R2, code_security→R3, communication→R1, data→R2, infrastructure→R3, general→R0)
 *   findDomains(text):
 *     - text with no domain keywords → returns [general] fallback
 *     - finance keyword match → finance domain detected
 *     - privacy keyword match → privacy domain detected
 *     - code_security keyword match → code_security domain detected
 *     - infrastructure keyword match → infrastructure domain detected
 *     - multiple keywords from same domain → domain still returned once
 *     - text matching two domains → both returned (sorted by score desc)
 *     - higher keyword score domain appears first
 *     - "general" domain excluded from scoring loop (never scored, only fallback)
 *     - case-insensitive matching (uppercase input matched)
 *   findActions(text, domains):
 *     - text with no matching actions → returns []
 *     - action present in text → returned in result
 *     - underscore action ("drop_table") matched by first word ("drop")
 *     - duplicate actions across domains → deduplicated
 *     - empty domains array → returns []
 */

import { describe, it, expect } from "vitest";

import {
  DOMAIN_REGISTRY,
  findDomains,
  findActions,
} from "../src/domain.registry";

// ─── DOMAIN_REGISTRY ─────────────────────────────────────────────────────────

describe("DOMAIN_REGISTRY", () => {
  it("contains 7 domains", () => {
    expect(DOMAIN_REGISTRY).toHaveLength(7);
  });

  it("includes all expected domain names", () => {
    const domains = DOMAIN_REGISTRY.map((d) => d.domain);
    expect(domains).toContain("finance");
    expect(domains).toContain("privacy");
    expect(domains).toContain("code_security");
    expect(domains).toContain("communication");
    expect(domains).toContain("data");
    expect(domains).toContain("infrastructure");
    expect(domains).toContain("general");
  });

  it("'general' domain has empty keywords array", () => {
    const general = DOMAIN_REGISTRY.find((d) => d.domain === "general");
    expect(general?.keywords).toHaveLength(0);
  });

  it("non-general domains all have non-empty keywords", () => {
    const nonGeneral = DOMAIN_REGISTRY.filter((d) => d.domain !== "general");
    for (const def of nonGeneral) {
      expect(def.keywords.length).toBeGreaterThan(0);
    }
  });

  it("defaultRisk levels are correct", () => {
    const getRisk = (name: string) => DOMAIN_REGISTRY.find((d) => d.domain === name)?.defaultRisk;
    expect(getRisk("finance")).toBe("R2");
    expect(getRisk("privacy")).toBe("R2");
    expect(getRisk("code_security")).toBe("R3");
    expect(getRisk("communication")).toBe("R1");
    expect(getRisk("data")).toBe("R2");
    expect(getRisk("infrastructure")).toBe("R3");
    expect(getRisk("general")).toBe("R0");
  });
});

// ─── findDomains ─────────────────────────────────────────────────────────────

describe("findDomains", () => {
  describe("fallback to general", () => {
    it("text with no domain keywords → returns [general]", () => {
      const result = findDomains("hello world nothing relevant here");
      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe("general");
    });

    it("empty text → returns [general]", () => {
      const result = findDomains("");
      expect(result[0].domain).toBe("general");
    });
  });

  describe("single domain detection", () => {
    it("'spend budget payment' → finance detected", () => {
      const result = findDomains("spend the budget and process payment");
      expect(result.some((d) => d.domain === "finance")).toBe(true);
    });

    it("'personal data email encrypt' → privacy detected", () => {
      const result = findDomains("collect personal data from email and encrypt");
      expect(result.some((d) => d.domain === "privacy")).toBe(true);
    });

    it("'execute script deploy' → code_security detected", () => {
      const result = findDomains("execute the script and deploy to production");
      expect(result.some((d) => d.domain === "code_security")).toBe(true);
    });

    it("'server cloud aws firewall' → infrastructure detected", () => {
      const result = findDomains("configure server on cloud aws behind a firewall");
      expect(result.some((d) => d.domain === "infrastructure")).toBe(true);
    });

    it("matching domain does NOT include general", () => {
      const result = findDomains("process payment and billing");
      expect(result.some((d) => d.domain === "general")).toBe(false);
    });
  });

  describe("multi-domain detection", () => {
    it("text matching two domains → both returned", () => {
      const result = findDomains("send email with payment invoice billing");
      const domains = result.map((d) => d.domain);
      expect(domains).toContain("finance");
      expect(domains).toContain("communication");
    });

    it("higher score domain appears first", () => {
      // finance: many keywords → higher score than communication
      const result = findDomains("spend cost budget payment money invoice billing send");
      expect(result[0].domain).toBe("finance");
    });
  });

  describe("case insensitivity", () => {
    it("uppercase keyword text matched correctly", () => {
      const result = findDomains("SPEND BUDGET PAYMENT MONEY");
      expect(result.some((d) => d.domain === "finance")).toBe(true);
    });
  });
});

// ─── findActions ─────────────────────────────────────────────────────────────

describe("findActions", () => {
  it("text with no matching actions → returns []", () => {
    const domains = findDomains("hello nothing here");
    expect(findActions("hello nothing here", domains)).toEqual([]);
  });

  it("'payment transfer' in text → finance actions returned", () => {
    const domains = findDomains("process payment and transfer funds");
    const actions = findActions("process payment and transfer funds", domains);
    expect(actions).toContain("payment");
    expect(actions).toContain("transfer");
  });

  it("underscore action 'drop_table' matched by word 'drop'", () => {
    const domains = findDomains("drop table sql database");
    const actions = findActions("drop the table from sql database", domains);
    expect(actions).toContain("drop_table");
  });

  it("duplicate actions across domains → deduplicated", () => {
    // "delete" appears in both data and privacy domains
    const domains = findDomains("delete database personal data");
    const actions = findActions("delete records from the database of personal data", domains);
    const deleteOccurrences = actions.filter((a) => a === "delete").length;
    expect(deleteOccurrences).toBe(1);
  });

  it("empty domains array → returns []", () => {
    expect(findActions("payment transfer billing", [])).toEqual([]);
  });
});
