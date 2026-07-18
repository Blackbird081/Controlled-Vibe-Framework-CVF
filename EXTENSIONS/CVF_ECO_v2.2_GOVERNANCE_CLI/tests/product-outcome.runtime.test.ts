import { describe, expect, it } from "vitest";
import {
  assertProductOutcomeRuntimePlanFiles,
  listProductOutcomeRuntimePlans,
  resolveProductOutcomeRuntimePlan,
} from "../src/product-outcome.runtime";

describe("product outcome runtime plans", () => {
  it("creates executable runtime plans for all seven certified packs", () => {
    const plans = listProductOutcomeRuntimePlans();

    expect(plans.map((plan) => plan.skillPackId)).toEqual([
      "strategy_analysis",
      "product_brief",
      "sop_generator",
      "proposal_writer",
      "meeting_summarizer",
      "contract_review",
      "landing_page_builder",
    ]);

    for (const plan of plans) {
      expect(plan.routeOwner).toBe("cvf-web /api/execute");
      expect(plan.command).toContain(`cvf run ${plan.skillPackId}`);
      expect(plan.receiptSchemaPath).toContain("receipt.schema.json");
      expect(plan.failureRecoveryPath).toContain("failure.recovery.md");
      expect(() => assertProductOutcomeRuntimePlanFiles(plan)).not.toThrow();
    }
  });

  it("maps certified packs to existing execute templates", () => {
    expect(resolveProductOutcomeRuntimePlan("product_brief")).toMatchObject({
      skillPackId: "product_brief",
      templateId: "app_builder_complete",
    });
    expect(resolveProductOutcomeRuntimePlan("contract_review")).toMatchObject({
      skillPackId: "contract_review",
      templateId: "tos_review",
    });
    expect(resolveProductOutcomeRuntimePlan("landing_page_builder")).toMatchObject({
      skillPackId: "landing_page_builder",
      templateId: "web_build_handoff",
    });
  });
});
