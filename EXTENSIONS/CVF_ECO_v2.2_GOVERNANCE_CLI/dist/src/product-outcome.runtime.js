"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CERTIFIED_SKILL_PACK_REGISTRY_PATH = void 0;
exports.loadCertifiedSkillPackRegistry = loadCertifiedSkillPackRegistry;
exports.listProductOutcomeRuntimePlans = listProductOutcomeRuntimePlans;
exports.resolveProductOutcomeRuntimePlan = resolveProductOutcomeRuntimePlan;
exports.buildProductOutcomeRuntimePlan = buildProductOutcomeRuntimePlan;
exports.assertProductOutcomeRuntimePlanFiles = assertProductOutcomeRuntimePlanFiles;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
exports.CERTIFIED_SKILL_PACK_REGISTRY_PATH = "governance/registries/cvf-certified-skill-pack-registry.json";
const RUNTIME_BINDINGS = {
    strategy_analysis: {
        templateId: "strategy_analysis",
        inputContract: "business_context, options, constraints, success_criteria",
        outputContract: "Strategy analysis with recommendation and risks",
    },
    product_brief: {
        templateId: "app_builder_complete",
        inputContract: "product_goal, target_user, problem, constraints",
        outputContract: "Product requirements document",
    },
    sop_generator: {
        templateId: "documentation",
        inputContract: "process_name, actors, steps, controls",
        outputContract: "Standard operating procedure",
    },
    proposal_writer: {
        templateId: "email_template",
        inputContract: "customer_need, scope, timeline, constraints",
        outputContract: "Proposal document",
    },
    meeting_summarizer: {
        templateId: "meeting_notes",
        inputContract: "meeting_notes, participants, desired_outcome",
        outputContract: "Meeting summary with decisions and actions",
    },
    contract_review: {
        templateId: "tos_review",
        inputContract: "contract_text, review_goal, jurisdiction_context",
        outputContract: "Contract review report",
    },
    landing_page_builder: {
        templateId: "web_build_handoff",
        inputContract: "offer, audience, proof_points, constraints",
        outputContract: "Landing page copy and build handoff",
    },
};
function loadCertifiedSkillPackRegistry(path = exports.CERTIFIED_SKILL_PACK_REGISTRY_PATH) {
    const resolvedPath = resolveWorkspacePath(path);
    if (!resolvedPath) {
        throw new Error(`Certified skill pack registry not found: ${path}`);
    }
    const payload = JSON.parse((0, node_fs_1.readFileSync)(resolvedPath, "utf8"));
    if (!Array.isArray(payload.entries)) {
        throw new Error(`Certified skill pack registry has no entries: ${path}`);
    }
    return payload;
}
function listProductOutcomeRuntimePlans(registryPath = exports.CERTIFIED_SKILL_PACK_REGISTRY_PATH) {
    return loadCertifiedSkillPackRegistry(registryPath).entries.map(buildProductOutcomeRuntimePlan);
}
function resolveProductOutcomeRuntimePlan(idOrOutcomeKey, registryPath = exports.CERTIFIED_SKILL_PACK_REGISTRY_PATH) {
    const normalized = idOrOutcomeKey.trim();
    return listProductOutcomeRuntimePlans(registryPath).find((plan) => {
        return plan.skillPackId === normalized || plan.outcomeKey === normalized;
    });
}
function buildProductOutcomeRuntimePlan(entry) {
    const binding = RUNTIME_BINDINGS[entry.id] ?? RUNTIME_BINDINGS[entry.outcomeKey];
    if (!binding) {
        throw new Error(`No product outcome runtime binding for certified pack: ${entry.id}`);
    }
    return {
        planVersion: "cvf.productOutcomeRuntime.v1",
        skillPackId: entry.id,
        outcomeKey: entry.outcomeKey,
        name: entry.name,
        domain: entry.domain,
        riskLevel: entry.riskLevel,
        status: entry.status,
        templateId: binding.templateId,
        routeOwner: "cvf-web /api/execute",
        command: `cvf run ${entry.id} --role BUILDER --receipt`,
        inputContract: binding.inputContract,
        outputContract: binding.outputContract,
        receiptSchemaPath: `${entry.path}/receipt.schema.json`,
        failureRecoveryPath: `${entry.path}/failure.recovery.md`,
        executionBoundaryPath: `${entry.path}/execution.boundary.json`,
        authorityScopePath: `${entry.path}/authority.scope.json`,
        workflowSpecPath: `${entry.path}/workflow.spec.md`,
        policyRefs: ["CVF_CAPABILITY_INTAKE_PIPELINE_GUARD", "cvf-web /api/execute"],
    };
}
function assertProductOutcomeRuntimePlanFiles(plan) {
    const requiredPaths = [
        plan.receiptSchemaPath,
        plan.failureRecoveryPath,
        plan.executionBoundaryPath,
        plan.authorityScopePath,
        plan.workflowSpecPath,
    ];
    const missing = requiredPaths.filter((path) => !resolveWorkspacePath(path));
    if (missing.length) {
        throw new Error(`Product outcome runtime plan has missing files for ${plan.skillPackId}: ${missing.join(", ")}`);
    }
}
function resolveWorkspacePath(path) {
    if ((0, node_fs_1.existsSync)(path))
        return path;
    const fromPackage = (0, node_path_1.join)(process.cwd(), "..", "..", path);
    if ((0, node_fs_1.existsSync)(fromPackage))
        return fromPackage;
    return undefined;
}
