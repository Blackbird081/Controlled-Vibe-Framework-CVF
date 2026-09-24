/**
 * CVF ACEL G2 - Runtime Topology Experiment Runner (T1, hermetic)
 *
 * Loads the eight-fixture corpus, executes the closed 8 x 2 x 2 matrix
 * through the experiment contract, and writes a deterministic 32-run receipt
 * to the governed audit path. Local-process only: no provider, network,
 * subagent or production consumer is invoked. Exits nonzero on any oracle
 * mismatch, authority-envelope change, missing/duplicate run, invalid
 * transition, unadmitted comparative row or unstable regeneration.
 *
 * Usage: npm run experiment:g2-topology
 */

import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  buildExperimentReceipt,
  type ExperimentFixture,
} from "../src/runtime.topology.experiment.contract";

const REPO_ROOT = join(__dirname, "..", "..", "..");
const FIXTURE_PATH = join(
  __dirname,
  "..",
  "tests",
  "fixtures",
  "runtime.topology.experiment.tasks.v1.json",
);
const RECEIPT_PATH = join(
  REPO_ROOT,
  "docs",
  "audits",
  "CVF_ACEL_G2_TOPOLOGY_EXPERIMENT_T1_32_RUN_RECEIPT_2026-09-16.json",
);
const BATCH_ID = "ACEL-G2-TOPOLOGY-EXPERIMENT-T1";
const RUNNER_COMMAND = "npm run experiment:g2-topology";
/**
 * Fixed generation timestamp for the receipt payload: keeps two runner
 * invocations byte-identical (excluding this file's own console log) without
 * depending on wall-clock time, which the work order forbids as stable
 * performance evidence in this hermetic tranche.
 */
const FIXED_GENERATED_AT = "2026-09-16T00:00:00.000Z";

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex");
}

function resolveExecutionBaseHead(): string {
  const fromEnv = process.env.ACEL_G2_EXECUTION_BASE_HEAD;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  } catch {
    return "UNKNOWN_EXECUTION_BASE_HEAD";
  }
}

function main(): void {
  const fixtureRaw = readFileSync(FIXTURE_PATH, "utf-8");
  const fixtureManifestHash = sha256(fixtureRaw);
  const parsed = JSON.parse(fixtureRaw) as { fixtures: ExperimentFixture[] };
  const fixtures = parsed.fixtures;

  const executionBaseHead = resolveExecutionBaseHead();

  const receipt = buildExperimentReceipt({
    batchId: BATCH_ID,
    executionBaseHead,
    runnerCommand: RUNNER_COMMAND,
    fixtureManifestHash,
    fixtures,
    generatedAt: FIXED_GENERATED_AT,
  });

  if (receipt.totalRuns !== 32 || receipt.uniqueRunKeys !== 32) {
    throw new Error(
      `duplicate/missing run: expected 32/32, got totalRuns=${receipt.totalRuns} uniqueRunKeys=${receipt.uniqueRunKeys}`,
    );
  }

  const unadmittedInAggregate = receipt.aggregate.some(
    (row) => row.admittedRunCount > row.totalRunCount,
  );
  if (unadmittedInAggregate) {
    throw new Error("unadmitted comparative row: aggregate admittedRunCount exceeds totalRunCount");
  }

  const payload = JSON.stringify(receipt, null, 2);

  mkdirSync(dirname(RECEIPT_PATH), { recursive: true });
  writeFileSync(RECEIPT_PATH, `${payload}\n`, "utf-8");

  const receiptHash = sha256(`${payload}\n`);

  console.log(`executionBaseHead: ${executionBaseHead}`);
  console.log(`fixtureManifestHash (sha256): ${fixtureManifestHash}`);
  console.log(`receipt path: ${RECEIPT_PATH}`);
  console.log(`receipt sha256: ${receiptHash}`);
  console.log(`totalRuns: ${receipt.totalRuns}`);
  console.log(`uniqueRunKeys: ${receipt.uniqueRunKeys}`);
  console.log(`actionsRepresented: ${receipt.actionsRepresented.join(", ")}`);
  console.log(`evidenceClass: ${receipt.evidenceClass}`);
}

main();
