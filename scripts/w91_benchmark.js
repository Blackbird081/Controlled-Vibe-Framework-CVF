// W91-T1 Template Output Quality Benchmark
// Authorization: CVF_GC018_W91_T1_TEMPLATE_OUTPUT_QUALITY_BENCHMARK_AUTHORIZATION_2026-04-15.md
// Run: node scripts/w91_benchmark.js

const ALIBABA_KEY = 'sk-2073fe59cd4e47d5b59f5e1438eaaf21';
const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_PRIORITY = ['qwen3-max', 'qwen2.5-14b-instruct', 'qwen-plus-2025-07-28', 'qwen2.5-72b-instruct', 'qwen-max'];

const SYSTEM_PROMPT = `You are a CVF AI assistant helping non-technical users (non-coders) accomplish goals. Your outputs must be:
1. Actionable - clear next steps a non-coder can actually follow
2. Specific - tailored to the user's context, not generic boilerplate
3. Complete - covers the main requested output shape end-to-end
4. Safe - never recommend unsafe practices, flag risks clearly
Respond in the same language as the user's input.`;

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
        id: 'T3', name: 'content_strategy_wizard',
        input: `I need a content strategy for my clean food brand.

BRAND: GreenBox - sells clean vegetables and fruits with home delivery
TARGET AUDIENCE: Mothers aged 25-40, health-conscious, care about family food safety
CURRENT STATUS: Facebook Page with 2,000 followers, no Instagram yet
MONTHLY BUDGET: 5 million VND for content creation
STRENGTHS: Trusted farm source, 2-hour delivery guarantee, competitive prices

GOAL: Increase orders by 30% in 3 months through organic content

Please provide:
1. Content Strategy (3 content pillars with examples)
2. 1-month content calendar (specific post topics for each week)
3. Best content formats for this audience (what types of posts work)
4. How to turn followers into buyers (conversion tactics)
5. KPIs to measure success each month`
    },
    {
        id: 'T4', name: 'data_analysis_wizard',
        input: `I need to analyze 6 months of sales data from my online store.

DATASET:
- 1,200 orders from Oct 2025 to Mar 2026
- Columns: order_id, date, product_name, category, quantity, unit_price, total_amount, province
- Format: Excel file (.xlsx)

MY QUESTIONS:
1. Which products sell best (by revenue and by quantity)?
2. Which months/weeks had the highest sales?
3. Which provinces/regions generate the most revenue?
4. Which product categories contribute most to total revenue?

Please provide:
1. Step-by-step analysis plan (using Excel for a non-coder)
2. Key Insights for each of my 4 questions
3. Which charts/graphs to create and why
4. Top 3 actionable recommendations based on the data
5. Specific actions I should take next month`
    },
    {
        id: 'T5', name: 'marketing_campaign_wizard',
        input: `I need a marketing campaign plan for my English learning app.

PRODUCT: "EnglishGo" - mobile app focused on practical conversation skills
TARGET: High school students (15-18) and university students (18-24) in Vietnam
BUDGET: 50 million VND per month
CHANNELS: Facebook Ads and TikTok Ads
GOAL: 5,000 downloads in 30 days, target CPI under 10,000 VND
UNIQUE VALUE: Learn through AI conversation, only 15 minutes/day

Please provide:
1. Campaign Brief (overall strategy and messaging)
2. Budget allocation between Facebook and TikTok (with rationale)
3. 3 creative ad concepts (headline + visual description + CTA)
4. Targeting recommendations for each platform
5. KPIs and how to track them weekly`
    },
    {
        id: 'T6', name: 'product_design_wizard',
        input: `I need to design a food ordering app for a university canteen.

CONTEXT:
- App for ordering food from university canteen (ABC University)
- Users: ~5,000 students and staff
- Core features needed:
  1. View daily menu (breakfast/lunch/dinner)
  2. Pre-order food 30 minutes before meal time
  3. Pay via e-wallet or cash pickup
  4. Track order status in real-time
  5. Rate food after receiving
- Platform: Mobile (iOS + Android)
- Timeline: Need to launch in 4 months

Please provide:
1. User Personas (2-3 key user types with their goals and pain points)
2. Core User Journey (step-by-step flow for ordering a meal)
3. Key screens to design (list the 5 most important screens)
4. Technical requirements summary
5. Risks and open questions to resolve before building`
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
        id: 'T8', name: 'security_assessment_wizard',
        input: `I need a security assessment for my small e-commerce website.

SYSTEM:
- WordPress + WooCommerce online store
- ~500 registered users, 50-100 orders/day
- Payment: Momo e-wallet and bank transfer (no stored card data)
- Data stored: customer name, email, phone, delivery address, order history
- Hosting: shared hosting
- Admin: just me, 1 person managing everything
- I have no technical/security background

MY CONCERNS:
- Not sure if the site has been compromised
- Worried about customer data security
- Don't know what security basics I'm missing

Please provide:
1. List of security risks specific to my setup (with severity: Critical/High/Medium/Low)
2. Plain-language explanation of each risk (no technical jargon)
3. Step-by-step fix instructions for each risk (things I can do myself)
4. Monthly security checklist I can follow
5. Warning signs to watch for (how to know if I've been hacked)`
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

async function callAlibaba(templateId, prompt) {
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
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: prompt },
                    ],
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });
            const ms = Date.now() - start;
            if (response.status === 429) {
                console.log(`  [${templateId}] ${model} quota exhausted, trying next...`);
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
    const results = [];
    for (const t of templates) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${t.id} | ${t.name}`);
        console.log('='.repeat(60));
        const start = Date.now();
        try {
            const { output, model, ms } = await callAlibaba(t.id, t.input);
            const totalMs = Date.now() - start;
            console.log(`Model: ${model} | ${totalMs}ms | ${output.length} chars`);
            console.log('');
            // Print full output for scoring
            console.log(output);
            results.push({ id: t.id, name: t.name, success: true, model, ms: totalMs, length: output.length, output });
        } catch (e) {
            console.log(`ERROR: ${e.message}`);
            results.push({ id: t.id, name: t.name, success: false, error: e.message });
        }
    }
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    for (const r of results) {
        if (r.success) {
            console.log(`${r.id} | ${r.name} | OK | ${r.model} | ${r.ms}ms | ${r.length} chars`);
        } else {
            console.log(`${r.id} | ${r.name} | FAIL | ${r.error}`);
        }
    }
}

run().catch(console.error);
