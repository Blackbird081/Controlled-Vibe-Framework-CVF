"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const product_outcome_runtime_1 = require("../src/product-outcome.runtime");
(0, vitest_1.describe)("product outcome runtime plans", () => {
    (0, vitest_1.it)("creates executable runtime plans for all seven certified packs", () => {
        const plans = (0, product_outcome_runtime_1.listProductOutcomeRuntimePlans)();
        (0, vitest_1.expect)(plans.map((plan) => plan.skillPackId)).toEqual([
            "strategy_analysis",
            "product_brief",
            "sop_generator",
            "proposal_writer",
            "meeting_summarizer",
            "contract_review",
            "landing_page_builder",
        ]);
        for (const plan of plans) {
            (0, vitest_1.expect)(plan.routeOwner).toBe("cvf-web /api/execute");
            (0, vitest_1.expect)(plan.command).toContain(`cvf run ${plan.skillPackId}`);
            (0, vitest_1.expect)(plan.receiptSchemaPath).toContain("receipt.schema.json");
            (0, vitest_1.expect)(plan.failureRecoveryPath).toContain("failure.recovery.md");
            (0, vitest_1.expect)(() => (0, product_outcome_runtime_1.assertProductOutcomeRuntimePlanFiles)(plan)).not.toThrow();
        }
    });
    (0, vitest_1.it)("maps certified packs to existing execute templates", () => {
        (0, vitest_1.expect)((0, product_outcome_runtime_1.resolveProductOutcomeRuntimePlan)("product_brief")).toMatchObject({
            skillPackId: "product_brief",
            templateId: "app_builder_complete",
        });
        (0, vitest_1.expect)((0, product_outcome_runtime_1.resolveProductOutcomeRuntimePlan)("contract_review")).toMatchObject({
            skillPackId: "contract_review",
            templateId: "tos_review",
        });
        (0, vitest_1.expect)((0, product_outcome_runtime_1.resolveProductOutcomeRuntimePlan)("landing_page_builder")).toMatchObject({
            skillPackId: "landing_page_builder",
            templateId: "web_build_handoff",
        });
    });
});
