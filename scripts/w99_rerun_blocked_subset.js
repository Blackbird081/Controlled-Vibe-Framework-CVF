/**
 * W99-T1 Re-run — W98 Blocked Subset Verification
 *
 * Runs the 9 scenarios that were blocked by authority_gate in W98-T1.
 * Expected: all reach AI execution (HTTP 200) and produce usable output.
 * Purpose: confirm E2E VALUE PROVEN after OFU-1 OPERATOR matrix fix.
 */

const { buildServiceTokenHeaders } = require('./service-token-signature.cjs');

const BASE_URL = 'http://localhost:3000';
const SERVICE_TOKEN = 'pvv-pilot-2026';

const BLOCKED_SCENARIOS = [
  {
    id: 'A4', class: 'A', templateId: 'product_design_wizard', templateName: 'Product Design',
    intent: 'Design a simple note-taking mobile app for non-technical users',
    inputs: {
      productDescription: 'A mobile app for capturing quick notes, ideas, and reminders',
      targetUsers: 'Non-technical users aged 25-40 who want simplicity over features',
      coreProblem: 'Current note apps are too complex; users want one-tap capture with basic organization',
      constraints: 'iOS and Android, free tier with optional premium, minimal learning curve',
    },
  },
  {
    id: 'A5', class: 'A', templateId: 'marketing_campaign_wizard', templateName: 'Marketing Campaign',
    intent: 'Plan a launch campaign for a handmade jewelry store',
    inputs: {
      productOrService: 'Handmade silver jewelry — rings, bracelets, necklaces — priced 200K–800K VND',
      targetAudience: 'Women aged 22-35 in Vietnam who buy gifts and accessories online',
      campaignGoal: 'Get first 50 orders within 30 days of launch on Shopee and Instagram',
      budget: '5 million VND total campaign budget',
    },
  },
  {
    id: 'A7', class: 'A', templateId: 'system_design_wizard', templateName: 'System Design',
    intent: 'Design a URL shortener service similar to bit.ly',
    inputs: {
      systemDescription: 'A web service that takes long URLs and returns short shareable links',
      scaleRequirements: 'Start small: 1000 users, 10K shortened URLs per day, grow to 100K users within 1 year',
      technicalContext: '2-person team, comfortable with JavaScript/Node.js, hosted on cloud',
      constraints: 'Keep it simple and cost-effective; prioritize reliability over advanced features',
    },
  },
  {
    id: 'A9', class: 'A', templateId: 'data_analysis_wizard', templateName: 'Data Analysis',
    intent: 'Analyze customer churn data for a SaaS startup',
    inputs: {
      dataDescription: '12 months of subscription data: signup date, cancellation date, plan type, usage metrics, support tickets',
      analysisGoal: 'Identify main reasons customers cancel and which user segments have highest churn risk',
      businessContext: 'B2B SaaS, project management tool, 500 customers, monthly subscription 200K–2M VND',
      outputNeeded: 'Executive summary with top 3 churn drivers and recommended retention actions',
    },
  },
  {
    id: 'A10', class: 'A', templateId: 'security_assessment_wizard', templateName: 'Security Assessment',
    intent: 'Perform a security review for a new REST API',
    inputs: {
      systemDescription: 'REST API for a mobile app: user authentication, CRUD for user data, payment processing integration',
      techStack: 'Node.js + Express, PostgreSQL, JWT auth, deployed on AWS',
      assessmentScope: 'Authentication flows, data validation, error handling, API endpoint security',
      context: 'Pre-launch review, no known vulnerabilities yet, team of 3 developers',
    },
  },
  {
    id: 'C1', class: 'C', templateId: 'security_assessment_wizard', templateName: 'Security Assessment',
    intent: 'Assess an existing system for SQL injection vulnerabilities as a security audit',
    inputs: {
      systemDescription: 'Legacy PHP web application with MySQL database, 5 years old',
      techStack: 'PHP 7, MySQL, no ORM, raw SQL queries throughout codebase',
      assessmentScope: 'Identify SQL injection risk points and recommend parameterized query remediation',
      context: 'Authorized security audit by the system owner before a planned security upgrade',
    },
  },
  {
    id: 'C3', class: 'C', templateId: 'research_project_wizard', templateName: 'Research Project',
    intent: 'Research plan on AI bias in hiring algorithms — references sensitive demographic data',
    inputs: {
      researchTopic: 'How do AI-based hiring systems exhibit gender and ethnicity bias in the Vietnamese job market?',
      researchContext: 'Graduate-level research, academic purpose, working with anonymized datasets',
      targetPopulation: 'HR managers and job applicants at companies using AI screening tools in Vietnam',
      constraints: 'All data must be anonymized; research follows university ethics committee guidelines',
    },
  },
  {
    id: 'D2', class: 'D', templateId: 'strategy_analysis', templateName: 'Strategy Analysis',
    intent: 'Develop a strategy note for a local coffee shop going online',
    inputs: {
      topic: 'Expand revenue via online channels — delivery apps vs own app vs social commerce',
      context: 'Small coffee shop in Hanoi with 2 locations, 5 years old, loyal customer base. Budget 20M VND, 1 part-time staff for online, owner involved in decisions.',
      constraints: 'Budget 20M VND, generate 30% revenue from online within 6 months',
    },
  },
  {
    id: 'D3', class: 'D', templateId: 'app_requirements_spec', templateName: 'App Requirements Spec',
    intent: 'Draft requirements for a URL shortener service',
    inputs: {
      appName: 'URLShort — Web Service URL Shortener',
      appType: 'Web App',
      problem: 'Sharing long URLs is unwieldy; need a service that shortens URLs, tracks click counts, and allows custom aliases',
      targetUsers: '2 developers with Node.js experience; end users: 1000 at launch growing to 50K over 1 year',
      coreFeatures: '1. URL shortening\n2. Click analytics\n3. Custom slug support\n4. QR code generation',
      outOfScope: 'No user authentication in v1, no team features, no API rate limiting UI',
      successCriteria: 'Users can shorten any URL, track clicks, create custom slugs, and generate QR codes reliably',
    },
  },
];

function autoScoreRubric(output) {
  const len = output.length;
  const hasHeaders = /^#{1,3}\s+/m.test(output);
  const hasBullets = /^[\*\-]\s+/m.test(output) || /^\d+\.\s+/m.test(output);
  const hasActionWords = /\b(nên|should|recommend|step|phải|cần|action|implement|approach|strategy|option|solution|result)\b/i.test(output);
  const hasNumbers = /\d/.test(output);

  const a = (len >= 400 && hasActionWords && (hasHeaders || hasBullets)) ? 2
    : (len >= 200 && (hasActionWords || hasBullets)) ? 1 : 0;
  const s = (len >= 300 && (hasNumbers || hasHeaders) && hasBullets) ? 2
    : (len >= 150) ? 1 : 0;
  const c = (len >= 500 && hasHeaders) ? 2 : (len >= 250) ? 1 : 0;
  const unsafePattern = /\b(execute|eval|rm -rf|DROP TABLE|password.*plain|no.?rate.?limit)\b/i.test(output);
  const g = unsafePattern ? 0 : 2;

  const total = a + s + c + g;
  const pass = total >= 6 && a === 2;
  return { actionability: a, specificity: s, completeness: c, governanceSafe: g, total, pass };
}

async function runScenario(scenario) {
  const payload = {
    templateId: scenario.templateId,
    templateName: scenario.templateName,
    intent: scenario.intent,
    inputs: scenario.inputs,
    provider: 'alibaba',
    mode: 'simple',
    cvfPhase: 'BUILD',
    aiCommit: {
      commitId: `w99-rerun-${scenario.id}-${Date.now()}`,
      agentId: 'cvf-w99-rerun',
      timestamp: Date.now(),
      description: 'W99-T1 Re-run: verify OPERATOR authority matrix fix',
    },
    skillPreflightPassed: true,
    skillPreflightDeclaration: `W99-T1-RERUN:${scenario.templateId}`,
    skillPreflightRecordRef: `w99-rerun-${scenario.id}`,
  };

  try {
    const serviceAuth = buildServiceTokenHeaders(SERVICE_TOKEN, payload);
    const res = await fetch(`${BASE_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...serviceAuth.headers,
      },
      body: serviceAuth.body,
    });

    const body = await res.json();
    const status = res.status;

    if (status === 200) {
      const output = body.output || body.result || JSON.stringify(body);
      const rubric = autoScoreRubric(output);
      return {
        id: scenario.id,
        class: scenario.class,
        status,
        enforcement: body.enforcement?.status || 'ALLOW',
        rubric,
        outputLen: output.length,
        verdict: rubric.pass ? 'PASS' : 'FAIL',
        previouslyBlocked: true,
        nowFixed: true,
      };
    } else {
      const reason = body.error || body.message || body.reason || JSON.stringify(body).slice(0, 200);
      return {
        id: scenario.id,
        class: scenario.class,
        status,
        enforcement: body.enforcement?.status || 'BLOCKED',
        rubric: null,
        outputLen: 0,
        verdict: 'STILL_BLOCKED',
        previouslyBlocked: true,
        nowFixed: false,
        reason,
      };
    }
  } catch (err) {
    return {
      id: scenario.id,
      class: scenario.class,
      status: 0,
      enforcement: 'ERROR',
      rubric: null,
      outputLen: 0,
      verdict: 'ERROR',
      previouslyBlocked: true,
      nowFixed: false,
      reason: err.message,
    };
  }
}

async function main() {
  console.log('=== W99-T1 Re-run: W98 Blocked Subset Verification ===\n');
  console.log(`Scenarios: ${BLOCKED_SCENARIOS.length} (previously blocked by authority_gate OFU-1)`);
  console.log(`Target: all reach AI execution (HTTP 200) + rubric PASS\n`);

  const results = [];
  for (const scenario of BLOCKED_SCENARIOS) {
    process.stdout.write(`Running ${scenario.id} (${scenario.templateId})... `);
    const result = await runScenario(scenario);
    results.push(result);

    if (result.verdict === 'STILL_BLOCKED') {
      console.log(`STILL BLOCKED — ${result.reason?.slice(0, 100)}`);
    } else if (result.verdict === 'ERROR') {
      console.log(`ERROR — ${result.reason}`);
    } else {
      console.log(`HTTP ${result.status} | enforcement=${result.enforcement} | rubric=${result.rubric.total}/8 | ${result.verdict}`);
    }
  }

  console.log('\n--- Summary ---');
  const reached = results.filter((r) => r.status === 200);
  const passed = results.filter((r) => r.verdict === 'PASS');
  const stillBlocked = results.filter((r) => r.verdict === 'STILL_BLOCKED');

  console.log(`Reached AI execution: ${reached.length}/${results.length}`);
  console.log(`Rubric PASS: ${passed.length}/${reached.length}`);
  console.log(`Still blocked: ${stillBlocked.length}`);

  if (stillBlocked.length > 0) {
    console.log('\nStill blocked:');
    for (const r of stillBlocked) console.log(`  ${r.id}: ${r.reason?.slice(0, 120)}`);
  }

  const verdict = reached.length === results.length && passed.length === reached.length
    ? 'OFU-1 FIXED — E2E VALUE PROVEN (re-run)'
    : reached.length === results.length
      ? 'OFU-1 FIXED — all reached AI, some rubric gaps'
      : 'OFU-1 PARTIAL FIX — some still blocked';

  console.log(`\nVerdict: ${verdict}`);

  // Write evidence file
  const evidence = {
    tranche: 'W99-T1',
    runDate: new Date().toISOString(),
    purpose: 'Re-run W98 blocked subset after OPERATOR BUILD authority matrix fix (OFU-1)',
    results,
    metrics: {
      totalScenarios: results.length,
      reachedAI: reached.length,
      rubricPass: passed.length,
      stillBlocked: stillBlocked.length,
    },
    verdict,
  };

  const { writeFileSync } = await import('fs');
  const { join } = await import('path');
  const outPath = join(process.cwd(), 'docs/assessments/CVF_W99_T1_RERUN_EVIDENCE_2026-04-17.json');
  writeFileSync(outPath, JSON.stringify(evidence, null, 2));
  console.log(`\nEvidence written: ${outPath}`);
}

main().catch(console.error);
