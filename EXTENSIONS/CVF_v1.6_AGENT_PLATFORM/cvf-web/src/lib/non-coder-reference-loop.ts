import type { CVFPhase } from '@/lib/cvf-checklists';

export interface NonCoderReferenceLoopInput {
  appName?: string;
  appType?: string;
  problem?: string;
  targetUsers?: string;
  coreFeatures?: string;
  outOfScope?: string;
  techPreference?: string;
  dataStorage?: string;
  archType?: string;
  apiStyle?: string;
  distribution?: string;
  spec: string;
}

export interface NonCoderReferencePhase {
  phase: CVFPhase;
  summary: string;
  outcome: string;
  evidence: string[];
  requiresApproval: boolean;
}

export interface NonCoderReferenceApproval {
  id: string;
  phase: CVFPhase;
  requiredFor: CVFPhase;
  reason: string;
  humanOwner: string;
  evidence: string[];
}

export interface NonCoderFreezeReceipt {
  acceptedOutput: string;
  baselineArtifact: string;
  lockedScope: string[];
  followUps: string[];
  evidence: string[];
}

export interface NonCoderExecutionHandoff {
  mode: 'full';
  templateName: string;
  intent: string;
  cvfPhase: 'BUILD';
  cvfRiskLevel: 'R1' | 'R2';
  fileScope: string[];
  skillPreflightDeclaration: string;
}

export interface NonCoderReferenceLoopArtifact {
  title: string;
  riskLevel: 'R1' | 'R2';
  phases: NonCoderReferencePhase[];
  approvals: NonCoderReferenceApproval[];
  executionHandoff: NonCoderExecutionHandoff;
  freezeReceipt: NonCoderFreezeReceipt;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled-app';
}

function compactLines(value?: string, fallback?: string): string[] {
  if (!value) return fallback ? [fallback] : [];
  return value
    .split(/\r?\n|,/)
    .map(line => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
    .filter(Boolean);
}

function inferRiskLevel(input: NonCoderReferenceLoopInput): 'R1' | 'R2' {
  const storage = (input.dataStorage || '').toLowerCase();
  const apiStyle = (input.apiStyle || '').toLowerCase();
  const appType = (input.appType || '').toLowerCase();

  if (
    storage.includes('cloud') ||
    apiStyle.includes('rest') ||
    apiStyle.includes('graphql') ||
    appType.includes('api') ||
    appType.includes('web') ||
    appType.includes('mobile')
  ) {
    return 'R2';
  }

  return 'R1';
}

function inferFileScope(appType?: string, slug?: string): string[] {
  const safeSlug = slug || 'untitled-app';
  const normalized = (appType || '').toLowerCase();

  if (normalized.includes('web')) {
    return [
      `apps/${safeSlug}/README.md`,
      `apps/${safeSlug}/src/app/page.tsx`,
      `apps/${safeSlug}/src/components/app-shell.tsx`,
    ];
  }

  if (normalized.includes('api')) {
    return [
      `services/${safeSlug}/README.md`,
      `services/${safeSlug}/src/server.ts`,
      `services/${safeSlug}/src/routes/index.ts`,
    ];
  }

  if (normalized.includes('mobile')) {
    return [
      `apps/${safeSlug}/README.md`,
      `apps/${safeSlug}/src/screens/home.tsx`,
      `apps/${safeSlug}/src/app.tsx`,
    ];
  }

  if (normalized.includes('cli')) {
    return [
      `tools/${safeSlug}/README.md`,
      `tools/${safeSlug}/src/index.ts`,
      `tools/${safeSlug}/src/commands/main.ts`,
    ];
  }

  return [
    `apps/${safeSlug}/README.md`,
    `apps/${safeSlug}/src/main.ts`,
    `apps/${safeSlug}/src/app-shell.ts`,
  ];
}

export function buildNonCoderReferenceLoop(input: NonCoderReferenceLoopInput): NonCoderReferenceLoopArtifact {
  const appName = input.appName?.trim() || 'Untitled App';
  const appType = input.appType?.trim() || 'App';
  const targetUsers = input.targetUsers?.trim() || 'general users';
  const problem = input.problem?.trim() || 'solve the stated business problem';
  const slug = slugify(appName);
  const riskLevel = inferRiskLevel(input);
  const features = compactLines(input.coreFeatures, 'Core feature set to be finalized during design review');
  const outOfScope = compactLines(input.outOfScope, 'Any behavior outside the defined v1 scope');
  const fileScope = inferFileScope(appType, slug);
  const baselineArtifact = `docs/baselines/${slug.toUpperCase().replace(/-/g, '_')}_FREEZE_RECEIPT.md`;

  return {
    title: `${appName} Governed Non-Coder Reference Packet`,
    riskLevel,
    phases: [
      {
        phase: 'INTAKE',
        summary: `Clarify the goal for ${appName}, restate the business problem, and lock the v1 boundary for ${targetUsers}.`,
        outcome: `Goal, scope, and constraints are ready for design review.`,
        evidence: [
          `Problem: ${problem}`,
          `Target users: ${targetUsers}`,
          `Out of scope: ${outOfScope[0]}`,
        ],
        requiresApproval: false,
      },
      {
        phase: 'DESIGN',
        summary: `Turn the request into one execution plan using ${input.archType || 'a pragmatic architecture'} and ${input.techPreference || 'AI-selected implementation choices'}.`,
        outcome: `One approved plan exists before any build work starts.`,
        evidence: [
          `Architecture: ${input.archType || 'To be chosen during design'}`,
          `Tech preference: ${input.techPreference || 'AI decides with justification'}`,
          `Primary features: ${features.slice(0, 2).join('; ')}`,
        ],
        requiresApproval: true,
      },
      {
        phase: 'BUILD',
        summary: `Execute the approved plan inside a bounded file scope and generate the requested ${appType.toLowerCase()}.`,
        outcome: `Implementation artifacts are produced inside governed boundaries.`,
        evidence: [
          `Risk level: ${riskLevel}`,
          `File scope: ${fileScope.join(', ')}`,
          `Spec ready for handoff: ${input.spec.length} characters`,
        ],
        requiresApproval: false,
      },
      {
        phase: 'REVIEW',
        summary: `Check the delivered result against the requested features, scope, and packaging expectations.`,
        outcome: `One delivery summary and acceptance readout are prepared for freeze.`,
        evidence: [
          `Feature checklist size: ${features.length}`,
          `Distribution target: ${input.distribution || 'To be finalized in review'}`,
          `Data storage: ${input.dataStorage || 'Not specified'}`,
        ],
        requiresApproval: false,
      },
      {
        phase: 'FREEZE',
        summary: `Lock the accepted result, store the comparison anchor, and note open follow-ups without silently expanding scope.`,
        outcome: `A freeze receipt is ready for audit and handoff.`,
        evidence: [
          `Baseline artifact: ${baselineArtifact}`,
          `Locked scope: ${fileScope[0]}`,
          `Follow-up count: 2`,
        ],
        requiresApproval: true,
      },
    ],
    approvals: [
      {
        id: 'design-gate',
        phase: 'DESIGN',
        requiredFor: 'BUILD',
        reason: 'Human confirms the plan before the agent starts implementation work.',
        humanOwner: 'HUMAN',
        evidence: [
          'Approved design summary',
          'Scope boundary still matches intake',
        ],
      },
      {
        id: 'freeze-gate',
        phase: 'FREEZE',
        requiredFor: 'FREEZE',
        reason: 'Human accepts the reviewed output as the frozen baseline for this run.',
        humanOwner: 'HUMAN',
        evidence: [
          'Review summary',
          'Freeze receipt',
        ],
      },
    ],
    executionHandoff: {
      mode: 'full',
      templateName: 'App Builder Wizard',
      intent: `Build ${appName} for ${targetUsers}. Core problem: ${problem}`,
      cvfPhase: 'BUILD',
      cvfRiskLevel: riskLevel,
      fileScope,
      skillPreflightDeclaration: `NONCODER_REFERENCE_PACKET:${slug}`,
    },
    freezeReceipt: {
      acceptedOutput: `${appName} v1 governed handoff packet`,
      baselineArtifact,
      lockedScope: fileScope,
      followUps: [
        `Validate ${features[0] || 'the highest-priority feature'} with a live user scenario`,
        `Open a follow-up batch for anything outside the agreed v1 scope`,
      ],
      evidence: [
        'Wizard specification',
        'Governed demo packet',
        'Human approval checkpoints',
      ],
    },
  };
}

export function formatNonCoderReferenceLoopMarkdown(artifact: NonCoderReferenceLoopArtifact): string {
  const phaseLines = artifact.phases.map(phase => {
    const approvalLine = phase.requiresApproval ? 'Approval required before next step.' : 'No extra approval required at this step.';
    return [
      `## ${phase.phase}`,
      phase.summary,
      '',
      `Outcome: ${phase.outcome}`,
      approvalLine,
      'Evidence:',
      ...phase.evidence.map(item => `- ${item}`),
      '',
    ].join('\n');
  }).join('\n');

  const approvalLines = artifact.approvals.map(approval => [
    `- ${approval.id}: ${approval.phase} -> ${approval.requiredFor}`,
    `  Reason: ${approval.reason}`,
    `  Owner: ${approval.humanOwner}`,
    `  Evidence: ${approval.evidence.join('; ')}`,
  ].join('\n')).join('\n');

  return [
    `# ${artifact.title}`,
    '',
    `Risk level: ${artifact.riskLevel}`,
    '',
    phaseLines,
    '## Approval Checkpoints',
    approvalLines,
    '',
    '## Execution Handoff',
    `- Mode: ${artifact.executionHandoff.mode}`,
    `- Template: ${artifact.executionHandoff.templateName}`,
    `- Intent: ${artifact.executionHandoff.intent}`,
    `- Build phase target: ${artifact.executionHandoff.cvfPhase}`,
    `- Risk: ${artifact.executionHandoff.cvfRiskLevel}`,
    `- File scope: ${artifact.executionHandoff.fileScope.join(', ')}`,
    `- Skill preflight: ${artifact.executionHandoff.skillPreflightDeclaration}`,
    '',
    '## Freeze Receipt',
    `- Accepted output: ${artifact.freezeReceipt.acceptedOutput}`,
    `- Baseline artifact: ${artifact.freezeReceipt.baselineArtifact}`,
    `- Locked scope: ${artifact.freezeReceipt.lockedScope.join(', ')}`,
    `- Follow-ups: ${artifact.freezeReceipt.followUps.join('; ')}`,
    `- Evidence: ${artifact.freezeReceipt.evidence.join('; ')}`,
  ].join('\n');
}
