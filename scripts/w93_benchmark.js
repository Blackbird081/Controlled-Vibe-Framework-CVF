// W93-T1 Knowledge-Native Non-Coder Benefit Validation Benchmark
// Authorization: CVF_GC018_W93_T1_KNOWLEDGE_NATIVE_BENEFIT_VALIDATION_AUTHORIZATION_2026-04-15.md
// Run: node scripts/w93_benchmark.js

require('./load-repo-env.cjs').loadRepoEnv();

const ALIBABA_KEY = process.env.ALIBABA_API_KEY
    || process.env.CVF_BENCHMARK_ALIBABA_KEY
    || process.env.CVF_ALIBABA_API_KEY;
const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_PRIORITY = ['qwen3-max', 'qwen2.5-14b-instruct', 'qwen-plus-2025-07-28', 'qwen2.5-72b-instruct', 'qwen-max'];

// Condition A: Standard CVF system prompt (no knowledge injection)
const SYSTEM_PROMPT_A = `You are a CVF AI assistant helping non-technical users (non-coders) accomplish goals. Your outputs must be:
1. Actionable - clear next steps a non-coder can actually follow
2. Specific - tailored to the user's context, not generic boilerplate
3. Complete - covers the main requested output shape end-to-end
4. Safe - never recommend unsafe practices, flag risks clearly
Respond in the same language as the user's input.`;

// Domain knowledge packets (frozen per GC-018 authorization)
const DOMAIN_KNOWLEDGE = {
    app_builder_wizard: `
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Recommended stack for Windows non-coder desktop apps: Python + customtkinter + SQLite + PyInstaller
- GitHub Desktop (GUI, no CLI) for version control — accessible for non-coders
- Common user pain points: packaging/installation complexity, no-terminal setup
- SQLite: zero-config, file-based, offline-first — ideal for personal expense tracker
- PyInstaller packages Python app into single .exe — no Python install needed by end user
- customtkinter provides modern UI over tkinter with dark/light mode built in`,
    business_strategy_wizard: `
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Vietnam e-commerce 2025: Shopee highest GMV, TikTok Shop growing 40%/yr for fashion
- Typical offline retail setup cost Vietnam: 80–150M VND (rent deposit + fitout + inventory)
- Break-even for offline retail: typically 12–18 months for mid-range fashion
- Online warehouse upgrade: 20–40M VND for shelving, label printer, packing station
- Shopee Express allows same-day dispatch up to 100 orders/day
- TikTok Shop live selling: high conversion rate for fashion (25–35% CR on live)
- Key risk for offline: fixed rent cost during slow months; online has variable COGS`,
    research_project_wizard: `
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Vietnam Gen Z (18–25): 3–4h/day avg social media, TikTok primary platform
- Common survey tools: Google Forms (free), Typeform (freemium)
- Snowball sampling effective for student cohorts; simple random harder without registry access
- Typical survey completion rate for Vietnamese students: 60–70% via class channels
- Common Gen Z purchase decision drivers: peer reviews > influencer > brand content
- SPSS and Google Sheets adequate for 200-respondent analysis (no R/Python needed)`,
    system_design_wizard: `
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Firebase Realtime Database: free tier supports 100 concurrent connections — adequate for 100 drivers
- GeoFire library: open-source, works with Firebase for geospatial queries (find drivers within radius)
- Vietnam tier-2 city context: 60–70% of rides likely cash — defer Stripe to Phase 2
- Firebase Cloud Messaging (FCM): free, reliable push notifications iOS + Android
- React Native with Expo: 1-codebase iOS+Android, manageable for 2-developer team in 3 months
- Supabase as PostgreSQL alternative: managed, generous free tier, real-time subscriptions built in`,
};

// Condition B: CVF system prompt + domain knowledge
function buildSystemPromptB(templateId) {
    const knowledge = DOMAIN_KNOWLEDGE[templateId] || '';
    return `${SYSTEM_PROMPT_A}

---
${knowledge.trim()}`;
}

// Frozen input packets (same as W91-T1)
const templates = [
    {
        id: 'T1', name: 'app_builder_wizard',
        input: `I am a non-technical user who wants to build a personal expense tracker app for Windows.

WHAT I WANT:
- Desktop app for tracking personal expenses
- Add transactions: name, amount, category (food/transport/shopping/bills), date
- View monthly summary report by category
- Export data to file
- Works offline, no login needed, personal use only

Please provide:
1. Complete App Specification (what to build, exact features for v1)
2. Recommended tech approach for a non-coder using AI assistance
3. Step-by-step build plan (3-5 phases)
4. Setup and installation instructions for non-technical users`
    },
    {
        id: 'T2', name: 'business_strategy_wizard',
        input: `I need a business expansion strategy analysis.

MY BUSINESS:
- Online women's clothing store on Shopee + TikTok Shop
- Monthly revenue: ~40 million VND, growing 10%/month
- Team: 3 employees, home warehouse
- Available investment: 100 million VND
- Target customers: women 20-35, mid-range pricing

DECISION NEEDED: Should I open a physical retail store, or continue investing in online channels + better warehouse?

CONSTRAINTS: Max investment 100M VND, must reach positive cash flow within 6 months

Please provide:
1. Executive Summary with recommendation
2. Side-by-side comparison: Online expansion vs Offline store (pros/cons/costs/risks)
3. Recommended path with specific 6-month roadmap
4. Top 3 risks and how to mitigate them`
    },
    {
        id: 'T7', name: 'research_project_wizard',
        input: `I need a research project plan on social media and Gen Z shopping behavior.

RESEARCH TOPIC: Impact of social media on Gen Z purchasing decisions in Vietnam

BACKGROUND: Many brands are increasing TikTok/Instagram budgets, but the actual impact on purchase decisions is unclear.

RESEARCH QUESTIONS:
1. What type of social media content does Gen Z trust most when deciding to buy?
2. Does influencer marketing actually drive purchase decisions vs just awareness?
3. What factors explain the gap between content browsing and actual purchase conversion?

METHODOLOGY PLAN: Online survey (200 respondents) + in-depth interviews (20 people)
TARGET: Gen Z aged 18-25 in Vietnam

Please provide:
1. Complete Research Proposal (background, objectives, significance)
2. Survey questionnaire draft (10-15 key questions)
3. Interview guide (5-7 questions for in-depth sessions)
4. 3-month project timeline with milestones
5. Expected outputs and how to present findings`
    },
    {
        id: 'T9', name: 'system_design_wizard',
        input: `I need a system design for a ride-hailing app backend.

CONTEXT:
- App similar to Grab Bike, for one small city
- Scale: 100 drivers, 1,000 customers/day, peak 200 ride requests/hour
- Core features:
  1. Customer books a ride, system matches nearest available driver
  2. Real-time location tracking of driver
  3. Fare calculation and payment processing
  4. Post-ride rating and review
  5. Push notifications for both driver and customer

CONSTRAINTS:
- Low budget: prefer serverless / managed cloud services to minimize ops cost
- Small team: 2 developers
- Need to launch in 3 months

Please provide:
1. System Architecture Overview (main components and how they connect)
2. Tech Stack Recommendations (with plain-language reasoning for each choice)
3. Database Design (main tables/collections and key relationships)
4. Rough monthly cost estimate using managed services
5. What to build first (MVP scope for 3-month launch)`
    },
];

async function callAlibaba(label, templateId, systemPrompt, userPrompt) {
    for (const model of MODEL_PRIORITY) {
        const start = Date.now();
        try {
            const response = await fetch(DASHSCOPE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ALIBABA_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });
            const ms = Date.now() - start;
            if (response.status === 429) {
                console.log(`  [${label}] ${model} quota exhausted, trying next...`);
                continue;
            }
            if (!response.ok) {
                const err = await response.text();
                throw new Error(`HTTP ${response.status}: ${err.slice(0, 150)}`);
            }
            const data = await response.json();
            if (data.error) throw new Error(`API error: ${data.error.message}`);
            const output = data.choices?.[0]?.message?.content ?? '';
            return { output, model, ms };
        } catch (e) {
            if (e.message && (e.message.includes('429') || e.message.includes('quota'))) continue;
            throw e;
        }
    }
    throw new Error('All models exhausted or failed');
}

async function run() {
    if (!ALIBABA_KEY) {
        throw new Error('ALIBABA_API_KEY is not set. Compatibility aliases: CVF_BENCHMARK_ALIBABA_KEY, CVF_ALIBABA_API_KEY.');
    }

    const results = [];
    for (const t of templates) {
        for (const condition of ['A', 'B']) {
            const label = `${t.id}-${condition}`;
            const systemPrompt = condition === 'A' ? SYSTEM_PROMPT_A : buildSystemPromptB(t.name);
            const condLabel = condition === 'A' ? 'WITHOUT knowledge-native' : 'WITH knowledge-native';

            console.log(`\n${'='.repeat(70)}`);
            console.log(`${label} | ${t.name} | ${condLabel}`);
            console.log('='.repeat(70));
            try {
                const { output, model, ms } = await callAlibaba(label, t.name, systemPrompt, t.input);
                console.log(`Model: ${model} | ${ms}ms | ${output.length} chars`);
                console.log('');
                console.log(output);
                results.push({ id: t.id, name: t.name, condition, success: true, model, ms, length: output.length, output });
            } catch (e) {
                console.log(`ERROR: ${e.message}`);
                results.push({ id: t.id, name: t.name, condition, success: false, error: e.message });
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    for (const r of results) {
        if (r.success) {
            console.log(`${r.id}-${r.condition} | ${r.name} | OK | ${r.model} | ${r.ms}ms | ${r.length} chars`);
        } else {
            console.log(`${r.id}-${r.condition} | ${r.name} | FAIL | ${r.error}`);
        }
    }
}

run().catch(console.error);
