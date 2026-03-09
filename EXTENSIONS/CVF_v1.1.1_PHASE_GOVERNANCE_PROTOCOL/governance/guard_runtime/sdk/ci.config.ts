/**
 * CI/CD Configuration — Track IV Phase C
 *
 * Generates CI/CD pipeline configurations for CVF-governed projects.
 * Supports GitHub Actions and generic CI providers.
 *
 * The generated config enforces:
 *   - Guard evaluation before build
 *   - Conformance test pass as gate
 *   - Audit trail generation per deploy
 */

export type CIProvider = 'github-actions' | 'generic';

export interface CIStage {
  name: string;
  commands: string[];
  continueOnError?: boolean;
  condition?: string;
}

export interface CIPipelineConfig {
  provider: CIProvider;
  name: string;
  triggers: string[];
  stages: CIStage[];
  env?: Record<string, string>;
}

export function generateCIPipeline(options?: {
  provider?: CIProvider;
  projectName?: string;
  nodeVersion?: string;
  conformanceThreshold?: number;
}): CIPipelineConfig {
  const provider = options?.provider ?? 'github-actions';
  const projectName = options?.projectName ?? 'cvf-project';
  const nodeVersion = options?.nodeVersion ?? '20';
  const threshold = options?.conformanceThreshold ?? 1.0;

  const stages: CIStage[] = [
    {
      name: 'install',
      commands: ['npm ci'],
    },
    {
      name: 'lint',
      commands: ['npm run lint'],
      continueOnError: true,
    },
    {
      name: 'guard-evaluation',
      commands: [
        'npx tsx scripts/cvf-guard-check.ts',
      ],
    },
    {
      name: 'conformance-test',
      commands: [
        `npx vitest run tests/conformance --reporter=verbose`,
        `echo "Conformance threshold: ${threshold}"`,
      ],
    },
    {
      name: 'unit-test',
      commands: ['npx vitest run --reporter=verbose'],
    },
    {
      name: 'audit-report',
      commands: [
        'npx tsx scripts/cvf-audit-report.ts',
      ],
      condition: 'always()',
    },
  ];

  return {
    provider,
    name: `${projectName}-cvf-pipeline`,
    triggers: ['push', 'pull_request'],
    stages,
    env: {
      NODE_VERSION: nodeVersion,
      CVF_CONFORMANCE_THRESHOLD: String(threshold),
      CVF_STRICT_MODE: 'true',
    },
  };
}

export function generateGitHubActionsYaml(config: CIPipelineConfig): string {
  const lines: string[] = [];
  lines.push(`name: ${config.name}`);
  lines.push('');
  lines.push('on:');
  for (const trigger of config.triggers) {
    lines.push(`  ${trigger}:`);
    lines.push('    branches: [main, develop]');
  }
  lines.push('');

  if (config.env) {
    lines.push('env:');
    for (const [key, value] of Object.entries(config.env)) {
      lines.push(`  ${key}: '${value}'`);
    }
    lines.push('');
  }

  lines.push('jobs:');
  lines.push('  cvf-governance:');
  lines.push('    runs-on: ubuntu-latest');
  lines.push('    steps:');
  lines.push('      - uses: actions/checkout@v4');
  lines.push(`      - uses: actions/setup-node@v4`);
  lines.push('        with:');
  lines.push(`          node-version: \${{ env.NODE_VERSION }}`);
  lines.push('');

  for (const stage of config.stages) {
    lines.push(`      - name: ${stage.name}`);
    if (stage.continueOnError) {
      lines.push('        continue-on-error: true');
    }
    if (stage.condition) {
      lines.push(`        if: ${stage.condition}`);
    }
    lines.push('        run: |');
    for (const cmd of stage.commands) {
      lines.push(`          ${cmd}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateProjectTemplate(): Record<string, string> {
  return {
    'scripts/cvf-guard-check.ts': [
      '// CVF Guard Check Script — Auto-generated',
      "import { CvfSdk } from '../governance/guard_runtime/sdk/cvf.sdk.js';",
      '',
      "const cvf = CvfSdk.create({ guards: 'full' });",
      'const report = cvf.runConformance();',
      '',
      'console.log(`CVF Conformance: ${report.passed}/${report.totalScenarios} passed (${(report.passRate * 100).toFixed(1)}%)`);',
      '',
      'if (report.criticalFailures.length > 0) {',
      "  console.error('CRITICAL FAILURES:', report.criticalFailures.map(f => f.scenarioId));",
      '  process.exit(1);',
      '}',
      '',
      `if (report.passRate < Number(process.env.CVF_CONFORMANCE_THRESHOLD ?? '1.0')) {`,
      '  console.error(`Pass rate ${report.passRate} below threshold`);',
      '  process.exit(1);',
      '}',
      '',
      "console.log('✓ CVF Guard Check passed.');",
    ].join('\n'),

    'scripts/cvf-audit-report.ts': [
      '// CVF Audit Report Script — Auto-generated',
      "import { CvfSdk } from '../governance/guard_runtime/sdk/cvf.sdk.js';",
      '',
      "const cvf = CvfSdk.create({ guards: 'full' });",
      'const report = cvf.runConformance();',
      '',
      'const auditReport = {',
      '  timestamp: new Date().toISOString(),',
      "  version: cvf.getVersion(),",
      '  guardCount: cvf.getGuardCount(),',
      '  conformance: {',
      '    total: report.totalScenarios,',
      '    passed: report.passed,',
      '    failed: report.failed,',
      '    passRate: report.passRate,',
      '  },',
      '};',
      '',
      'console.log(JSON.stringify(auditReport, null, 2));',
    ].join('\n'),
  };
}
