/** Hermetic ACEL G6 T1 runner. No provider, network, subagent, or production wiring. */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildVerificationExperimentReceipt } from "../src/impact.verification.experiment.contract";

const repoRoot = join(__dirname, "..", "..", "..");
const receiptPath = join(
  repoRoot,
  "docs/audits/CVF_ACEL_G6_T1_IMPACT_DERIVED_VERIFICATION_EXPERIMENT_32_RUN_RECEIPT_2026-09-16.json",
);
const receipt = buildVerificationExperimentReceipt();
const fixed = receipt.aggregate.find((row) => row.policy === "FIXED_BUNDLE")!;
const impact = receipt.aggregate.find((row) => row.policy === "IMPACT_DERIVED")!;
if (
  receipt.totalRuns !== 32 ||
  receipt.uniqueRunKeys !== 32 ||
  fixed.missedRegressionCount !== 0 ||
  impact.missedRegressionCount !== 0 ||
  impact.totalCostUnits >= fixed.totalCostUnits
) {
  throw new Error("ACEL G6 T1 experiment failed closed");
}
const payload = `${JSON.stringify(receipt, null, 2)}\n`;
mkdirSync(dirname(receiptPath), { recursive: true });
writeFileSync(receiptPath, payload, "utf8");
console.log(`receipt=${receiptPath}`);
console.log(`sha256=${createHash("sha256").update(payload).digest("hex")}`);
console.log(`runs=${receipt.totalRuns} fixedCost=${fixed.totalCostUnits} impactCost=${impact.totalCostUnits} missed=0`);
