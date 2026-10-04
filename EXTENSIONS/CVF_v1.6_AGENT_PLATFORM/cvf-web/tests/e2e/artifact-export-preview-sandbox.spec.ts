import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type BrowserContext, type FrameLocator, type Locator, type Page, type Request } from '@playwright/test';
import { login, seedStorage } from './utils';

// Synthetic B1 preview sandbox proof (one Chromium profile, intercepted export).
// The inline script is harmless: it only sets an in-memory marker on its own
// document and on the parent window. No network, storage, or external URL.
const SENTINEL = '__cvfB1Sentinel';
const SELF_MARKER = 'data-cvf-b1-ran';
const FIXTURE_SCRIPT =
  `document.documentElement.setAttribute('${SELF_MARKER}','1');` +
  `try{window.parent.${SENTINEL}='executed';}catch(e){}`;
const FIXTURE_HTML =
  '<!doctype html><html lang="en"><body><main><h1>B1 Sandbox Synthetic Heading</h1>' +
  `<script>${FIXTURE_SCRIPT}</script></main></body></html>`;

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('B1 preview iframe blocks inline script in Chromium while an unsandboxed control executes it', async ({ page, browserName }) => {
  const fixtureRequests: string[] = [];
  const unexpectedRequests: string[] = [];
  let routeHits = 0;

  // Positive control: same fixture, unsandboxed same-origin srcdoc iframe.
  await page.setContent('<!doctype html><html><body><iframe id="control"></iframe></body></html>');
  await page.evaluate(({ html, sentinel }) => {
    (window as unknown as Record<string, unknown>)[sentinel] = 'unset';
    (document.getElementById('control') as HTMLIFrameElement).srcdoc = html;
  }, { html: FIXTURE_HTML, sentinel: SENTINEL });
  await expect.poll(() => page.evaluate((s) => (window as unknown as Record<string, unknown>)[s], SENTINEL)).toBe('executed');
  const controlSelfMarker = await page.evaluate((marker) => {
    const doc = (document.getElementById('control') as HTMLIFrameElement).contentDocument;
    return doc ? doc.documentElement.getAttribute(marker) : 'NO_DOCUMENT_ACCESS';
  }, SELF_MARKER);
  expect(controlSelfMarker).toBe('1');
  const controlSandboxAttr = await page.evaluate(() => document.getElementById('control')!.getAttribute('sandbox'));
  expect(controlSandboxAttr).toBeNull();

  // Remove control and reset the sentinel before the real panel run.
  await page.evaluate((sentinel) => {
    document.getElementById('control')?.remove();
    (window as unknown as Record<string, unknown>)[sentinel] = 'unset';
  }, SENTINEL);

  await page.route('**/api/artifacts/export', async route => {
    routeHits += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html: FIXTURE_HTML,
          filename: 'b1-sandbox-synthetic.html',
          receiptAnchor: 'receipt-b1-sandbox',
          generatedAt: '2026-10-01T10:00:00.000Z',
          governanceState: 'DRAFT_UNACCEPTED',
          verification: [{ label: 'Synthetic fixture', passed: true, detail: 'In-memory only.' }],
        },
      }),
    });
  });

  page.on('request', (request: Request) => {
    const url = request.url();
    if (url.includes('b1-sandbox-synthetic') || url.includes('B1 Sandbox')) fixtureRequests.push(url);
    const frame = request.frame();
    const fromSubframe = frame !== page.mainFrame();
    if (fromSubframe && !url.startsWith('about:') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      unexpectedRequests.push(url);
    }
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await page.evaluate((sentinel) => {
    (window as unknown as Record<string, unknown>)[sentinel] = 'unset';
  }, SENTINEL);
  await page.getByLabel('Title').fill('B1 Sandbox Synthetic');
  await page.getByRole('button', { name: /Build HTML/i }).click();

  const iframe = page.locator('iframe[title="Preview"]');
  await expect(iframe).toBeVisible();
  const heading = page.frameLocator('iframe[title="Preview"]').getByRole('heading', { name: 'B1 Sandbox Synthetic Heading' });
  await expect(heading).toBeVisible();

  // Give any (blocked) script ample time to run before asserting absence.
  await page.waitForTimeout(1000);

  const sandboxAttr = await iframe.getAttribute('sandbox');
  const sandboxTokens = await iframe.evaluate((el) => Array.from((el as HTMLIFrameElement).sandbox));
  const parentSentinel = await page.evaluate((s) => (window as unknown as Record<string, unknown>)[s], SENTINEL);
  const panelSelfMarker = await page
    .frameLocator('iframe[title="Preview"]')
    .locator('html')
    .getAttribute(SELF_MARKER);
  // Opaque origin: parent cannot reach the document of a sandboxed (no allow-same-origin) frame.
  const contentDocumentReachable = await iframe.evaluate((el) => (el as HTMLIFrameElement).contentDocument !== null);
  const frameOrigin = await page
    .frameLocator('iframe[title="Preview"]')
    .locator('html')
    .evaluate(() => location.origin);

  console.log('B1_SANDBOX_OBSERVATIONS ' + JSON.stringify({
    browserName,
    browserVersion: page.context().browser()?.version(),
    controlParentSentinel: 'executed',
    controlSelfMarker,
    controlSandboxAttr,
    sandboxAttr,
    sandboxTokens,
    parentSentinel,
    panelSelfMarker,
    contentDocumentReachable,
    frameOrigin,
    routeHits,
    fixtureRequestCount: fixtureRequests.length,
    unexpectedRequestCount: unexpectedRequests.length,
  }));

  expect(routeHits).toBeGreaterThanOrEqual(1);
  expect(sandboxAttr).toBe('');
  expect(sandboxTokens).toEqual([]);
  expect(parentSentinel).toBe('unset');
  expect(panelSelfMarker).toBeNull();
  expect(contentDocumentReachable).toBe(false);
  expect(frameOrigin).toBe('null');
  expect(fixtureRequests).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
});

// ---------------------------------------------------------------------------------------
// Passive-resource isolation for the Preview (synthetic, one Chromium profile, no forwarding).
//
// The script sandbox above does not stop passive loads: an empty sandbox still fetches
// images, stylesheets, CSS imports/backgrounds, fonts and nested frames. The oracle below is
// answered on the REAL Artifacts Preview:
//   control   - the same markup in a disposable context, empty sandbox and NO resource policy,
//               produces same-origin and off-origin hits for every passive class (no scripts).
//   negative  - the actual product Preview, before any Print click, produces zero hits and
//               still renders benign text and inline style; sandbox/origin/script unchanged.
//   mutation  - only the Preview resource policy is removed from the real product path
//               (sandbox kept): the same negative oracle must fail with passive hits.
// Interception is installed before any payload is inserted and fulfills locally (the off-origin
// host never resolves and nothing is forwarded). Print behavior is covered by the Print spec.
const PROBE_PATH = '/api/cvf-preview-probe';
const OFF_ORIGIN = 'https://offorigin.cvf-preview-probe.test';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.CVF_PLAYWRIGHT_PORT ?? 3001}`;
const APP_ORIGIN = new URL(BASE_URL).origin;
const POLICY_META_PREFIX = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_1X1 = Buffer.from(PNG_B64, 'base64');
const DATA_IMG = `data:image/png;base64,${PNG_B64}`;
const PASSIVE_KINDS = ['img', 'srcset', 'link-css', 'css-import', 'css-bg', 'font', 'frame', 'frame-img', 'object', 'object-img'] as const;
const EXPECTED_HITS = (['same', 'off'] as const).flatMap(where => PASSIVE_KINDS.map(kind => `${where}:${kind}`));
const H1_COLOR = 'rgb(1, 2, 3)';
const P_BACKGROUND = 'rgb(4, 5, 6)';
const POLICY_SCRIPT_MARKER = 'data-cvf-preview-script-ran';

const whereOf = (origin: string) => (origin === APP_ORIGIN ? 'same' : 'off');
const probeUrl = (origin: string, kind: string) => `${origin}${PROBE_PATH}?k=${kind}`;
const hitKey = (url: URL) => `${url.origin === APP_ORIGIN ? 'same' : 'off'}:${url.searchParams.get('k') ?? 'none'}`;

function passiveMarkup(origin: string): string {
  const u = (kind: string) => probeUrl(origin, kind);
  return (
    `<img src="${u('img')}" alt=""><img srcset="${u('srcset')} 1x" alt="">` +
    `<link rel="stylesheet" href="${u('link-css')}">` +
    `<object data="${u('object')}" type="text/html"></object><iframe src="${u('frame')}"></iframe>` +
    `<div class="cvf-bg-${whereOf(origin)}">bg</div><span class="cvf-font-${whereOf(origin)}">font</span>`
  );
}

const benignBody =
  '<main><h1>Preview Passive Heading</h1>' +
  `<p style="background-color:${P_BACKGROUND}">Preview passive benign paragraph.</p>` +
  `<img id="cvf-data-img" src="${DATA_IMG}" alt="">` +
  `<script>document.documentElement.setAttribute('${POLICY_SCRIPT_MARKER}','1');</script></main>`;
const inlineStyle = `<style>h1{color:${H1_COLOR}}</style>`;

// Default-producer shape: plain leading doctype, head with inline style.
const DOCTYPE_FIXTURE =
  `<!doctype html><html lang="en"><head>${inlineStyle}</head><body>${benignBody}${passiveMarkup(APP_ORIGIN)}${passiveMarkup(OFF_ORIGIN)}</body></html>`;
// Adversary shape: passive markup before the doctype and any head, duplicate heads, and a
// payload-supplied permissive policy that tries to reopen network authority.
const EARLY_FIXTURE =
  `${passiveMarkup(APP_ORIGIN)}${passiveMarkup(OFF_ORIGIN)}<!doctype html><html lang="en"><head>` +
  `<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' data: blob:">${inlineStyle}</head><head></head><body>${benignBody}</body></html>`;

function probeResponse(kind: string, origin: string): { contentType: string; body: string | Buffer } {
  const u = (k: string) => probeUrl(origin, k);
  switch (kind) {
    case 'img': case 'srcset': case 'css-bg': case 'frame-img': case 'object-img':
      return { contentType: 'image/png', body: PNG_1X1 };
    case 'link-css':
      return {
        contentType: 'text/css',
        body: `@import url(${u('css-import')});.cvf-bg-${whereOf(origin)}{background-image:url(${u('css-bg')});width:4px;height:4px}` +
          `@font-face{font-family:CvfProbe${whereOf(origin)};src:url(${u('font')})}.cvf-font-${whereOf(origin)}{font-family:CvfProbe${whereOf(origin)}}`,
      };
    case 'css-import': return { contentType: 'text/css', body: 'body{}' };
    case 'font': return { contentType: 'font/woff2', body: Buffer.from('not-a-real-font') };
    case 'frame': return { contentType: 'text/html', body: `<!doctype html><body><img src="${u('frame-img')}" alt=""></body>` };
    case 'object': return { contentType: 'text/html', body: `<!doctype html><body><img src="${u('object-img')}" alt=""></body>` };
    default: return { contentType: 'text/plain', body: 'unknown' };
  }
}

// Fulfills the controlled endpoint locally on both origins and records each hit by class.
async function installProbe(context: BrowserContext, hits: Map<string, number>) {
  await context.route(url => url.pathname === PROBE_PATH && (url.origin === APP_ORIGIN || url.origin === OFF_ORIGIN), async route => {
    const url = new URL(route.request().url());
    hits.set(hitKey(url), (hits.get(hitKey(url)) ?? 0) + 1);
    const { contentType, body } = probeResponse(url.searchParams.get('k') ?? 'none', url.origin);
    await route.fulfill({ status: 200, contentType, body, headers: { 'access-control-allow-origin': '*' } });
  });
}

const hitList = (hits: Map<string, number>) => [...hits.keys()].sort();

// Control: disposable context, the existing empty sandbox, no resource policy, no script reliance.
test('B1 Preview passive-resource control: an empty sandbox without a resource policy loads same-origin and off-origin passive resources', async ({ browser, browserName }) => {
  const context = await browser.newContext();
  try {
    const hits = new Map<string, number>();
    await installProbe(context, hits);
    const page = await context.newPage();
    await page.setContent('<!doctype html><html><body><iframe id="control" sandbox></iframe></body></html>');
    await page.evaluate((html) => { (document.getElementById('control') as HTMLIFrameElement).srcdoc = html; }, EARLY_FIXTURE);
    await expect.poll(() => EXPECTED_HITS.filter(k => !hits.has(k)), { timeout: 15_000 }).toEqual([]);
    const control = page.frameLocator('#control');
    const sandboxAttr = await page.evaluate(() => document.getElementById('control')!.getAttribute('sandbox'));
    const dataImg = await control.locator('#cvf-data-img').evaluate((el) => ({ complete: (el as HTMLImageElement).complete, naturalWidth: (el as HTMLImageElement).naturalWidth }));
    const scriptRan = await control.locator('html').getAttribute(POLICY_SCRIPT_MARKER);
    console.log('B1_PREVIEW_RESOURCE_CONTROL ' + JSON.stringify({ browserName, browserVersion: browser.version(), sandboxAttr, expectedHits: EXPECTED_HITS, observedHits: hitList(hits), dataImg, scriptRan }));
    // Passive hits happened with the script sandbox intact, so the control is not an inert fixture.
    expect(sandboxAttr).toBe('');
    expect(scriptRan).toBeNull();
    // A data image really decodes without a policy, so a blocked data image later is the policy.
    expect(dataImg).toEqual({ complete: true, naturalWidth: 1 });
    expect(hitList(hits)).toEqual([...EXPECTED_HITS].sort());
  } finally {
    await context.close();
  }
});

type PreviewMutation = 'policy' | null;

// Test-only mutation: removes ONLY the Preview resource policy meta from the real product's
// iframe srcdoc. The empty sandbox and everything else stay as the product produced them.
const policyMutationScript = (metaPrefix: string) => `(() => {
  const PREFIX = ${JSON.stringify(metaPrefix)};
  const strip = (value) => {
    const text = String(value);
    const start = text.indexOf(PREFIX);
    if (start < 0) return text;
    const end = text.indexOf('>', start);
    window.__cvfPolicyStripped = true;
    return text.slice(0, start) + text.slice(end + 1);
  };
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this.tagName === 'IFRAME' && String(name).toLowerCase() === 'srcdoc') return setAttribute.call(this, name, strip(value));
    return setAttribute.call(this, name, value);
  };
  const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
  Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', { ...d, set(value) { return d.set.call(this, strip(value)); } });
})();`;

async function previewScenario(page: Page, context: BrowserContext, browserName: string, opts: { fixture: string; mutation: PreviewMutation }) {
  const hits = new Map<string, number>();
  const unexpected: string[] = [];
  let exportHits = 0;
  await installProbe(context, hits);
  if (opts.mutation === 'policy') await page.addInitScript(policyMutationScript(POLICY_META_PREFIX));
  await page.route('**/api/artifacts/export', async route => {
    exportHits += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html: opts.fixture,
          filename: 'b1-preview-passive.html',
          receiptAnchor: 'receipt-b1-preview-passive',
          generatedAt: '2026-10-01T10:00:00.000Z',
          governanceState: 'DRAFT_UNACCEPTED',
          verification: [{ label: 'Synthetic fixture', passed: true, detail: 'In-memory only.' }],
        },
      }),
    });
  });
  // Every page and frame of the context is observed; sub-frame requests that are not local
  // schemes or the controlled endpoint are unexpected. Same-origin is never exempted.
  context.on('request', (request: Request) => {
    const url = request.url();
    const owner = request.frame();
    if (owner === owner.page().mainFrame()) return;
    if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return;
    const parsed = new URL(url);
    if (parsed.pathname === PROBE_PATH && (parsed.origin === APP_ORIGIN || parsed.origin === OFF_ORIGIN)) return;
    unexpected.push(url);
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await page.evaluate(() => { (window as unknown as Record<string, unknown>).__cvfPreviewSentinel = 'unset'; });
  // Interception is live and counters are reset before the actual Preview exists; no Print click happens.
  hits.clear();
  await page.getByLabel('Title').fill('B1 Preview Passive');
  await page.getByRole('button', { name: /Build HTML/i }).click();
  const iframe = page.locator('iframe[title="Preview"]');
  await expect(iframe).toBeVisible();
  const frame = page.frameLocator('iframe[title="Preview"]');
  await expect(frame.getByRole('heading', { name: 'Preview Passive Heading' })).toBeVisible();
  // Give any permitted passive load (and its downstream dependencies) time to arrive.
  await page.waitForTimeout(2_000);

  const srcdoc = await iframe.getAttribute('srcdoc');
  const sandboxAttr = await iframe.getAttribute('sandbox');
  const frameOrigin = await frame.locator('html').evaluate(() => location.origin).catch(() => null);
  const scriptRan = await frame.locator('html').getAttribute(POLICY_SCRIPT_MARKER);
  const h1Color = await frame.locator('h1').evaluate(el => getComputedStyle(el).color);
  const paragraphBackground = await frame.locator('p').evaluate(el => getComputedStyle(el).backgroundColor);
  const paragraphText = await frame.locator('p').textContent();
  const dataImg = await frame.locator('#cvf-data-img').evaluate((el) => ({ complete: (el as HTMLImageElement).complete, naturalWidth: (el as HTMLImageElement).naturalWidth }));
  const parentSentinel = await page.evaluate(() => (window as unknown as Record<string, unknown>).__cvfPreviewSentinel);
  const policyStripped = await page.evaluate(() => (window as unknown as Record<string, unknown>).__cvfPolicyStripped === true);
  const policyIndex = srcdoc ? srcdoc.indexOf(POLICY_META_PREFIX) : -1;
  const resourceIndexes = srcdoc ? ['<img', '<link', '<object', '<iframe'].map(t => srcdoc.indexOf(t)).filter(i => i >= 0) : [];
  const firstResourceIndex = resourceIndexes.length > 0 ? Math.min(...resourceIndexes) : Number.MAX_SAFE_INTEGER;
  const observations = {
    browserName,
    browserVersion: page.context().browser()?.version(),
    mutation: opts.mutation,
    policyStrippedByMutation: policyStripped,
    interceptionInstalledBeforeBuild: true,
    exportRouteHits: exportHits,
    pageCount: context.pages().length,
    sandboxAttr,
    frameOrigin,
    scriptRan,
    parentSentinel,
    srcdocDiffersFromCanonical: srcdoc !== opts.fixture,
    policyBeforeFirstResource: policyIndex >= 0 && policyIndex < firstResourceIndex,
    policyPresentInSrcdoc: policyIndex >= 0,
    h1Color,
    paragraphBackground,
    paragraphText,
    dataImg,
    observedHits: hitList(hits),
    unexpectedRequests: unexpected,
  };
  console.log('B1_PREVIEW_RESOURCE_OBSERVATIONS ' + JSON.stringify(observations));
  return observations;
}

type PreviewObservations = Awaited<ReturnType<typeof previewScenario>>;

// The negative oracle: any entry means the actual Preview broke resource isolation or lost
// the benign inline rendering / script sandbox it must keep.
function previewViolations(o: PreviewObservations): string[] {
  const v: string[] = [];
  if (o.observedHits.length > 0) v.push(`passive resource request reached the controlled endpoint: ${o.observedHits.join(',')}`);
  if (o.unexpectedRequests.length > 0) v.push('unexpected sub-frame request');
  if (o.dataImg.naturalWidth !== 0) v.push('data image must be blocked in Preview');
  if (o.sandboxAttr !== '') v.push('preview frame must carry an empty sandbox attribute');
  if (o.frameOrigin !== 'null') v.push('preview frame origin must be opaque');
  if (o.scriptRan !== null || o.parentSentinel !== 'unset') v.push('payload script must not execute');
  if (o.h1Color !== H1_COLOR) v.push('inline stylesheet must still style the heading');
  if (o.paragraphBackground !== P_BACKGROUND) v.push('inline style attribute must still apply');
  if (o.paragraphText !== 'Preview passive benign paragraph.') v.push('benign text must stay visible');
  return v;
}

const previewCases = [
  ['early passive markup before any head, duplicate heads and permissive payload policy', EARLY_FIXTURE],
  ['plain doctype fixture with head inline style', DOCTYPE_FIXTURE],
] as const;

for (const [name, fixture] of previewCases) {
  test(`B1 Preview passive-resource negative: actual Preview before Print has zero hits and keeps benign inline render (${name})`, async ({ page, context, browserName }) => {
    const o = await previewScenario(page, context, browserName, { fixture, mutation: null });
    expect(o.exportRouteHits).toBe(1);
    expect(o.pageCount).toBe(1);
    expect(o.policyPresentInSrcdoc).toBe(true);
    expect(o.policyBeforeFirstResource).toBe(true);
    expect(o.srcdocDiffersFromCanonical).toBe(true);
    expect(previewViolations(o), JSON.stringify(o)).toEqual([]);
  });
}

test('B1 Preview passive-resource mutation: removing only the resource policy restores passive hits and fails the same oracle', async ({ page, context, browserName }) => {
  const o = await previewScenario(page, context, browserName, { fixture: EARLY_FIXTURE, mutation: 'policy' });
  const violations = previewViolations(o);

  // The mutation applied to the real product path and nothing else changed.
  expect(o.policyStrippedByMutation, JSON.stringify(o)).toBe(true);
  expect(o.policyPresentInSrcdoc, JSON.stringify(o)).toBe(false);
  expect(o.sandboxAttr).toBe('');
  expect(o.frameOrigin).toBe('null');
  expect(o.scriptRan).toBeNull();
  expect(o.parentSentinel).toBe('unset');
  expect(o.paragraphText).toBe('Preview passive benign paragraph.');
  // Same oracle, same fixture: it now fails, and only through passive resources.
  expect(violations.length, JSON.stringify(o)).toBeGreaterThan(0);
  expect(violations.every(entry => entry.startsWith('passive resource request') || entry.startsWith('data image'))).toBe(true);
  expect(violations.some(entry => entry.startsWith('passive resource request')), JSON.stringify(o)).toBe(true);
  expect(o.observedHits, JSON.stringify(o)).toEqual([...EXPECTED_HITS].sort());
});

// ---------------------------------------------------------------------------------------
// Navigation containment for the Preview (synthetic, one Chromium profile, no forwarding).
//
// The empty sandbox and the resource policy do not stop a user-activated self-navigation: a link
// replaces the policy-bearing Preview document and the destination loads its own resources. The
// oracle is answered on the REAL Artifacts Preview with real mouse and keyboard input:
//   control   - the same fixture in a disposable context with the empty sandbox and the resource
//               policy but WITHOUT the navigation layer: each layer class must show an effect
//               (attempted destination, secondary resource, extra page or replaced document).
//   negative  - the actual product: zero attempted destinations, zero secondary hits, zero
//               unexpected requests, no extra page, parent unchanged, the original policy-bearing
//               document and benign content retained. A restored heading after a request would not
//               pass: the marker set in the frame before the trigger must survive.
//   mutation  - only the layer's element walk is blinded on the real product path (sandbox and
//               policy kept, applied counter recorded, srcdoc equals the pre-layer construction):
//               the same oracle must fail with the declared effects. Classes the control shows no
//               effect for are sandbox regressions, observed as one group and not credited to the layer.
// Interception is installed on the browser context before login, navigation, Build and payload
// insertion and fulfills locally (the off-origin host never resolves and nothing is forwarded).
const NAV_PATH = '/api/cvf-preview-nav-probe';
const NAV_CONTROL_PATH = '/cvf-nav-control';
const PREVIEW_POLICY = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
const POLICY_META = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_POLICY}">`;
const NAV_HEADING = 'Nav Heading';
const NAV_PARAGRAPH = 'Nav benign paragraph.';
const NAV_MARKER = '__cvfNavMarker';
const NAV_BLOB_TOKEN = '__BLOB__';
const NAV_PREVIEW = 'iframe[title="Preview"]';
const CONTROL_HOST = '<!doctype html><html><body><iframe id="control" sandbox style="width:700px;height:500px"></iframe></body></html>';
// Any construct that can still start a navigation in a derived document.
const NAV_VECTOR = /<(?:a|area)\b[^>]*\s(?:xlink:)?href\s*=|<(?:set|animate|base)\b|http-equiv="?refresh/i;

type Effect = 'destination' | 'secondary' | 'page' | 'transition' | 'attempt';
type ActContext = { frame: FrameLocator; page: Page };
type NavCase = {
  id: string;
  label: string;
  body: string;
  head?: string;
  effects: Effect[];
  act: (ctx: ActContext) => Promise<void>;
  waitMs?: number;
  needsBlob?: boolean;
};

const nav = (origin: string, key: string) => `${origin}${NAV_PATH}?k=${key}`;
const navDoc = (body: string, head = '') =>
  `<!doctype html><html lang="en"><head>${head}<style>h1{color:${H1_COLOR}}</style></head><body><main><h1>${NAV_HEADING}</h1>` +
  `<p id="nav-benign" style="background-color:${P_BACKGROUND}">${NAV_PARAGRAPH}</p>${body}</main></body></html>`;
const withBlob = (html: string, blobUrl: string) => html.split(NAV_BLOB_TOKEN).join(blobUrl);

type ClickOptions = Parameters<Locator['click']>[0];
const clickAt = (selector: string, options?: ClickOptions) => async ({ frame }: ActContext) => { await frame.locator(selector).click(options); };
// Focus is moved into the frame first so a key press never reaches the app page around it.
const pressIn = (selector: string, key: string) => async ({ frame }: ActContext) => {
  await frame.locator('h1').click();
  await frame.locator(selector).press(key);
};
const areaMap = (href: string) =>
  `<img id="m" usemap="#mm" src="${DATA_IMG}" width="80" height="40" alt="x" style="display:block"><map name="mm"><area id="l" shape="default" href="${href}"></map>`;
const svgBox = '<rect width="200" height="50" fill="red"/><text y="20">svg</text>';
const XLINK = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

const SELF_NAV: Effect[] = ['destination', 'secondary', 'transition'];
const NEW_PAGE: Effect[] = ['destination', 'secondary', 'page'];
const NAV_CLASSES: NavCase[] = [
  { id: 'L01', label: 'absolute same-origin anchor', body: `<a id="l" href="${nav(APP_ORIGIN, 'L01')}">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L02', label: 'absolute off-origin anchor', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L02')}">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L03', label: 'relative anchor', body: `<a id="l" href="${NAV_PATH}?k=L03">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L04', label: 'anchor keyboard Enter', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L04')}">go</a>`, effects: SELF_NAV, act: pressIn('#l', 'Enter') },
  { id: 'L05', label: 'target self anchor', body: `<a id="l" target="_self" href="${nav(OFF_ORIGIN, 'L05')}">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L06', label: 'middle click anchor', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L06')}">go</a>`, effects: NEW_PAGE, act: clickAt('#l', { button: 'middle' }) },
  { id: 'L07', label: 'Ctrl click anchor', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L07')}">go</a>`, effects: NEW_PAGE, act: clickAt('#l', { modifiers: ['Control'] }) },
  { id: 'L08', label: 'Shift click anchor', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L08')}">go</a>`, effects: NEW_PAGE, act: clickAt('#l', { modifiers: ['Shift'] }) },
  { id: 'L09', label: 'download attribute anchor', body: `<a id="l" download="x.html" href="${nav(OFF_ORIGIN, 'L09')}">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L10', label: 'image-map area click', body: areaMap(nav(OFF_ORIGIN, 'L10')), effects: SELF_NAV, act: clickAt('#m') },
  { id: 'L11', label: 'image-map area keyboard', body: areaMap(nav(OFF_ORIGIN, 'L11')), effects: SELF_NAV, act: pressIn('#l', 'Enter') },
  { id: 'L12', label: 'SVG a href', body: `<svg width="200" height="50"><a id="l" href="${nav(OFF_ORIGIN, 'L12')}">${svgBox}</a></svg>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L13', label: 'SVG a xlink href', body: `<svg ${XLINK} width="200" height="50"><a id="l" xlink:href="${nav(OFF_ORIGIN, 'L13')}">${svgBox}</a></svg>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L14', label: 'base plus relative anchor', body: `<base href="${OFF_ORIGIN}/"><a id="l" href="${NAV_PATH}?k=L14">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L15', label: 'redirecting anchor', body: `<a id="l" href="${nav(APP_ORIGIN, 'L15-redirect')}">go</a>`, effects: ['destination'], act: clickAt('#l') },
  { id: 'L16', label: 'data url anchor', body: '<a id="l" href="data:text/html,%3Ch1%3EDATADEST%3C/h1%3E">go</a>', effects: ['transition'], act: clickAt('#l') },
  { id: 'L17', label: 'about blank anchor', body: '<a id="l" href="about:blank">go</a>', effects: ['transition'], act: clickAt('#l') },
  { id: 'L18', label: 'fragment anchor', body: '<a id="l" href="#nav-frag">go</a><div id="nav-frag">fragment target</div>', effects: ['destination', 'transition'], act: clickAt('#l') },
  { id: 'L19', label: 'SVG set gives an anchor a target', body: `<svg width="200" height="50"><a id="l"><set attributeName="href" to="${nav(OFF_ORIGIN, 'L19')}" begin="0s"/>${svgBox}</a></svg>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L20', label: 'SVG animate gives an anchor a target', body: `<svg ${XLINK} width="200" height="50"><a id="l"><animate attributeName="xlink:href" values="${nav(OFF_ORIGIN, 'L20')}" begin="0s" dur="1s" fill="freeze"/>${svgBox}</a></svg>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L21', label: 'declarative shadow root anchor', body: `<div id="host"><template shadowrootmode="open"><a id="l" href="${nav(OFF_ORIGIN, 'L21')}">shadow link</a></template></div>`, effects: SELF_NAV, act: clickAt('#host a') },
  { id: 'L22', label: 'noscript anchor', body: `<noscript><a id="l" href="${nav(OFF_ORIGIN, 'L22')}">ns link</a></noscript>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L23', label: 'uppercase tag and attribute with padded href', body: `<A id="l" HREF="  &#9;${nav(OFF_ORIGIN, 'L23')}">go</A>`, effects: SELF_NAV, act: clickAt('#l') },
  { id: 'L25', label: 'mailto anchor (external protocol attempt)', body: '<a id="l" href="mailto:a@b.test">mail</a>', effects: ['attempt'], act: clickAt('#l') },
  { id: 'L24', label: 'duplicate href attributes', body: `<a id="l" href="${nav(OFF_ORIGIN, 'L24')}" href="#second">go</a>`, effects: SELF_NAV, act: clickAt('#l') },
];

// Sandbox or policy regression classes: the control shows no effect in this browser.
type Step = { body: string; act: (ctx: ActContext) => Promise<void> };
const nestedLink = `&lt;a id=l href=&quot;${nav(OFF_ORIGIN, 'S14')}&quot;&gt;nested go&lt;/a&gt;`;
const targetLink = (n: number, target: string) => ({ body: `<a id="s0${n}" target="${target}" href="${nav(OFF_ORIGIN, `S0${n}`)}">t${n}</a>`, act: clickAt(`#s0${n}`) });
const SANDBOX_STEPS: Step[] = [
  targetLink(1, '_top'),
  targetLink(2, '_parent'),
  targetLink(3, '_blank'),
  targetLink(4, 'cvfnamed'),
  { body: `<form action="${nav(OFF_ORIGIN, 'S05')}"><button id="s05" type="submit">send</button></form>`, act: clickAt('#s05') },
  { body: `<form action="${nav(OFF_ORIGIN, 'S06')}"><button id="s06" type="submit">send</button></form>`, act: clickAt('#s06', { modifiers: ['Control'] }) },
  { body: `<form action="${nav(OFF_ORIGIN, 'S07')}"><input id="s07" name="q"></form>`, act: pressIn('#s07', 'Enter') },
  { body: `<form><button id="s08" formaction="${nav(OFF_ORIGIN, 'S08')}" type="submit">send</button></form>`, act: clickAt('#s08') },
  { body: `<form action="${nav(OFF_ORIGIN, 'S09')}"><input id="s09" type="image" width="50" height="20" alt="go"></form>`, act: clickAt('#s09') },
  { body: '<a id="s10" href="javascript:void(0)">js</a>', act: clickAt('#s10') },
  { body: `<a id="s16" href="${NAV_BLOB_TOKEN}">blob</a>`, act: clickAt('#s16') },
  { body: `<iframe id="s14" srcdoc="${nestedLink}" style="width:300px;height:60px"></iframe>`, act: async ({ frame }) => { await frame.frameLocator('#s14').locator('#l').click({ timeout: 5_000 }); } },
  { body: `<object id="s15" data="data:text/html,%3Cp%3Eobject%3C/p%3E" type="text/html" style="width:200px;height:40px"></object>`, act: async () => undefined },
];
const REFRESH_HEAD =
  `<meta http-equiv="refresh" content="0;url=${nav(OFF_ORIGIN, 'S11')}"><meta http-equiv="refresh" content="0;url=${NAV_PATH}?k=S12"><meta http-equiv="refresh" content="1">`;
const SANDBOX_GROUP: NavCase = {
  id: 'S01-S16',
  label: 'sandbox regression group',
  body: SANDBOX_STEPS.map(step => step.body).join(''),
  head: REFRESH_HEAD,
  effects: [],
  needsBlob: true,
  act: async ctx => {
    for (const step of SANDBOX_STEPS) {
      await step.act(ctx);
      await ctx.page.waitForTimeout(400);
    }
    await ctx.page.waitForTimeout(2_500);
  },
};

type NavState = { destinations: Map<string, number>; secondary: Map<string, number>; others: string[]; unexpected: string[] };
const newNavState = (): NavState => ({ destinations: new Map(), secondary: new Map(), others: [], unexpected: [] });
const resetNavState = (state: NavState) => { state.destinations.clear(); state.secondary.clear(); state.others.length = 0; state.unexpected.length = 0; };
const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

// Fulfills every controlled destination, secondary resource, redirect hop and unknown sub-frame or
// new-page navigation locally and records it; the observed page's own traffic falls through.
// A request issued before its new page's frame exists has no frame: it is never the observed main frame.
const inMainFrame = (request: Request, mainFrame: () => ReturnType<Page['mainFrame']>) => { try { return request.frame() === mainFrame(); } catch { return false; } };

async function installNavigation(context: BrowserContext, state: NavState, mainFrame: () => ReturnType<Page['mainFrame']>, controlHost?: string) {
  await context.route(() => true, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const isMain = inMainFrame(request, mainFrame);
    if (controlHost && isMain && request.isNavigationRequest() && url.origin === APP_ORIGIN && url.pathname === NAV_CONTROL_PATH) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: controlHost });
      return;
    }
    if (url.pathname === NAV_PATH && (url.origin === APP_ORIGIN || url.origin === OFF_ORIGIN)) {
      const key = url.searchParams.get('k') ?? 'none';
      const recorded = `${url.origin === APP_ORIGIN ? 'same' : 'off'}:${key}`;
      if (key.endsWith('-secondary')) {
        bump(state.secondary, recorded);
        await route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1, headers: { 'access-control-allow-origin': '*' } });
        return;
      }
      bump(state.destinations, recorded);
      if (key.endsWith('-redirect')) {
        await route.fulfill({ status: 302, headers: { location: nav(OFF_ORIGIN, key.replace('-redirect', '-final')) }, body: '' });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body><h1>NAV DESTINATION ${key}</h1><img src="${nav(url.origin, `${key}-secondary`)}" alt=""></body></html>` });
      return;
    }
    if (!isMain && request.isNavigationRequest()) {
      state.others.push(`${url.origin}${url.pathname}`);
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><h1>NAV UNKNOWN DESTINATION</h1></body></html>' });
      return;
    }
    await route.fallback();
  });
  context.on('request', (request: Request) => {
    const url = request.url();
    if (inMainFrame(request, mainFrame)) return;
    if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return;
    const parsed = new URL(url);
    if (parsed.pathname === NAV_PATH && (parsed.origin === APP_ORIGIN || parsed.origin === OFF_ORIGIN)) return;
    state.unexpected.push(url);
  });
}

type NavObservations = {
  destinations: string[];
  secondary: string[];
  others: string[];
  unexpected: string[];
  pageCount: number;
  parentUrlChanged: boolean;
  markerRetained: boolean | null;
  policyRetained: boolean | null;
  headingText: string | null;
  paragraphText: string | null;
  sandboxAttr: string | null;
  frameOrigin: string | null;
  srcdocHasVector: boolean | null;
  srcdocPolicyFirst: boolean | null;
  srcdocEqualsPreLayer: boolean | null;
  blinded: number;
};

const effectsOf = (o: NavObservations): Effect[] => [
  ...(o.destinations.length > 0 || o.others.length > 0 ? ['destination' as const] : []),
  ...(o.secondary.length > 0 ? ['secondary' as const] : []),
  ...(o.pageCount > 1 ? ['page' as const] : []),
  ...(o.markerRetained !== true ? ['transition' as const] : []),
  ...(o.unexpected.length > 0 ? ['attempt' as const] : []),
];

// The negative oracle: any entry means navigation escaped the Preview, the policy-bearing document
// was replaced, or the benign presentation or isolation was lost.
function navViolations(o: NavObservations): string[] {
  const v: string[] = [];
  if (o.destinations.length > 0) v.push(`attempted destination request: ${o.destinations.join(',')}`);
  if (o.secondary.length > 0) v.push(`secondary resource hit: ${o.secondary.join(',')}`);
  if (o.others.length > 0) v.push(`attempted other-document navigation: ${o.others.join(',')}`);
  if (o.unexpected.length > 0) v.push(`unexpected request: ${o.unexpected.join(',')}`);
  if (o.pageCount !== 1) v.push(`extra page opened: ${o.pageCount}`);
  if (o.parentUrlChanged) v.push('parent page navigated');
  if (o.markerRetained !== true) v.push('Preview document was replaced');
  if (o.policyRetained !== true) v.push('policy-bearing document not retained');
  if (o.headingText !== NAV_HEADING || o.paragraphText !== NAV_PARAGRAPH) v.push('benign content not retained');
  if (o.sandboxAttr !== '') v.push('frame must keep an empty sandbox attribute');
  if (o.frameOrigin !== 'null') v.push('frame origin must stay opaque');
  return v;
}

type ObserveExtra = { baseUrl: string; srcdoc: string | null; preLayer?: string; blinded: number };
async function observeNavigation(page: Page, context: BrowserContext, state: NavState, selector: string, extra: ObserveExtra): Promise<NavObservations> {
  const frame = page.frameLocator(selector);
  const html = frame.locator('html');
  const read = <T>(fn: () => Promise<T>) => fn().catch(() => null);
  const { srcdoc } = extra;
  return {
    destinations: [...state.destinations.keys()].sort(),
    secondary: [...state.secondary.keys()].sort(),
    others: [...state.others],
    unexpected: [...state.unexpected],
    pageCount: context.pages().length,
    parentUrlChanged: page.url() !== extra.baseUrl,
    markerRetained: await read(() => html.evaluate((_el, marker) => (window as unknown as Record<string, unknown>)[marker] === 'set', NAV_MARKER, { timeout: 3_000 })),
    policyRetained: await read(() => html.evaluate((_el, policy) => {
      const meta = Array.from(document.querySelectorAll('meta[http-equiv]')).find(m => (m.getAttribute('http-equiv') ?? '').toLowerCase() === 'content-security-policy');
      return meta?.getAttribute('content') === policy;
    }, PREVIEW_POLICY, { timeout: 3_000 })),
    headingText: await read(() => frame.locator('h1').first().textContent({ timeout: 3_000 })),
    paragraphText: await read(() => frame.locator('#nav-benign').textContent({ timeout: 3_000 })),
    sandboxAttr: await page.locator(selector).getAttribute('sandbox'),
    frameOrigin: await read(() => html.evaluate(() => window.origin, undefined, { timeout: 3_000 })),
    srcdocHasVector: srcdoc === null ? null : NAV_VECTOR.test(srcdoc),
    srcdocPolicyFirst: srcdoc === null ? null : srcdoc.replace(/^\s*<!doctype html>/i, '').startsWith(POLICY_META),
    srcdocEqualsPreLayer: srcdoc === null || extra.preLayer === undefined ? null : srcdoc === extra.preLayer,
    blinded: extra.blinded,
  };
}

const createBlobUrl = (page: Page) => page.evaluate(() => URL.createObjectURL(new Blob(['<h1>BLOBDEST</h1>'], { type: 'text/html' })));
const setMarker = (page: Page, selector: string) => page.frameLocator(selector).locator('html').evaluate((_el, marker) => { (window as unknown as Record<string, unknown>)[marker] = 'set'; }, NAV_MARKER);
const preLayerConstruction = (fixture: string) => fixture.replace('<!doctype html>', `<!doctype html>${POLICY_META}`);

// Test-only mutation: only the navigation layer's element walk is blinded on the real product path
// (documents created by DOMParser report no elements); sandbox, policy and everything else stay.
const NAV_LAYER_MUTATION_SCRIPT = `(() => {
  const qsa = Document.prototype.querySelectorAll;
  Document.prototype.querySelectorAll = function (selector) {
    if (this !== document) {
      window.__cvfNavLayerBlinded = (window.__cvfNavLayerBlinded || 0) + 1;
      return document.createDocumentFragment().querySelectorAll('*');
    }
    return qsa.call(this, selector);
  };
})();`;

async function navControl(browser: Browser, kase: NavCase): Promise<NavObservations> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const state = newNavState();
    await installNavigation(context, state, () => page.mainFrame(), CONTROL_HOST);
    await page.goto(`${APP_ORIGIN}${NAV_CONTROL_PATH}`);
    const blobUrl = kase.needsBlob ? await createBlobUrl(page) : '';
    const fixture = withBlob(navDoc(kase.body, kase.head), blobUrl);
    // The product construction before this layer: resource policy first, empty sandbox, nothing else.
    await page.evaluate((html) => { (document.getElementById('control') as HTMLIFrameElement).srcdoc = html; }, preLayerConstruction(fixture));
    await expect(page.frameLocator('#control').getByRole('heading', { name: NAV_HEADING })).toBeVisible();
    await setMarker(page, '#control');
    resetNavState(state);
    await kase.act({ frame: page.frameLocator('#control'), page });
    await page.waitForTimeout(kase.waitMs ?? 1_500);
    const observed = await observeNavigation(page, context, state, '#control', { baseUrl: `${APP_ORIGIN}${NAV_CONTROL_PATH}`, srcdoc: null, blinded: 0 });
    console.log('B1_PREVIEW_NAV_CONTROL ' + JSON.stringify({ id: kase.id, effects: effectsOf(observed), observed }));
    return observed;
  } finally {
    await context.close();
  }
}

async function navProduct(page: Page, context: BrowserContext, kase: NavCase, mutation: boolean): Promise<NavObservations> {
  const state = newNavState();
  let blobUrl = '';
  let exportHits = 0;
  await installNavigation(context, state, () => page.mainFrame());
  if (mutation) await page.addInitScript(NAV_LAYER_MUTATION_SCRIPT);
  await page.route('**/api/artifacts/export', async route => {
    exportHits += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html: withBlob(navDoc(kase.body, kase.head), blobUrl),
          filename: 'b1-preview-navigation.html',
          receiptAnchor: 'receipt-b1-preview-navigation',
          generatedAt: '2026-10-02T10:00:00.000Z',
          governanceState: 'DRAFT_UNACCEPTED',
          verification: [{ label: 'Synthetic fixture', passed: true, detail: 'In-memory only.' }],
        },
      }),
    });
  });
  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  if (kase.needsBlob) blobUrl = await createBlobUrl(page);
  // Interception is live and counters are reset before the actual Preview exists.
  resetNavState(state);
  const baseUrl = page.url();
  await page.getByLabel('Title').fill('B1 Preview Navigation');
  await page.getByRole('button', { name: /Build HTML/i }).click();
  await expect(page.locator(NAV_PREVIEW)).toBeVisible();
  await expect(page.frameLocator(NAV_PREVIEW).getByRole('heading', { name: NAV_HEADING })).toBeVisible();
  await setMarker(page, NAV_PREVIEW);
  const srcdoc = await page.locator(NAV_PREVIEW).getAttribute('srcdoc');
  await kase.act({ frame: page.frameLocator(NAV_PREVIEW), page });
  await page.waitForTimeout(kase.waitMs ?? 1_500);
  const blinded = await page.evaluate(() => Number((window as unknown as Record<string, unknown>).__cvfNavLayerBlinded ?? 0));
  const preLayer = preLayerConstruction(withBlob(navDoc(kase.body, kase.head), blobUrl));
  const observed = await observeNavigation(page, context, state, NAV_PREVIEW, { baseUrl, srcdoc, preLayer, blinded });
  console.log('B1_PREVIEW_NAV_PRODUCT ' + JSON.stringify({ id: kase.id, mutation, exportHits, effects: effectsOf(observed), observed }));
  expect(exportHits).toBe(1);
  return observed;
}

for (const kase of NAV_CLASSES) {
  test(`B1 Preview navigation control ${kase.id}: ${kase.label} has an effect without the navigation layer`, async ({ browser }) => {
    const o = await navControl(browser, kase);
    expect(effectsOf(o), JSON.stringify(o)).toEqual(expect.arrayContaining(kase.effects));
    expect(o.sandboxAttr).toBe('');
  });

  test(`B1 Preview navigation negative ${kase.id}: ${kase.label} has no effect in the actual Preview`, async ({ page, context }) => {
    const o = await navProduct(page, context, kase, false);
    expect(navViolations(o), JSON.stringify(o)).toEqual([]);
    expect(o.srcdocHasVector, JSON.stringify(o)).toBe(false);
    expect(o.srcdocPolicyFirst, JSON.stringify(o)).toBe(true);
    expect(o.srcdocEqualsPreLayer, JSON.stringify(o)).toBe(false);
    expect(o.blinded).toBe(0);
  });

  test(`B1 Preview navigation mutation ${kase.id}: disabling only the navigation layer restores the effect for ${kase.label}`, async ({ page, context }) => {
    const o = await navProduct(page, context, kase, true);
    // The mutation applied to the real product path and nothing else changed.
    expect(o.blinded, JSON.stringify(o)).toBeGreaterThanOrEqual(1);
    expect(o.srcdocEqualsPreLayer, JSON.stringify(o)).toBe(true);
    expect(o.srcdocPolicyFirst, JSON.stringify(o)).toBe(true);
    expect(o.sandboxAttr).toBe('');
    expect(o.frameOrigin).toBe('null');
    // Same oracle, same fixture: it now fails with the declared effects.
    expect(navViolations(o).length, JSON.stringify(o)).toBeGreaterThan(0);
    expect(effectsOf(o), JSON.stringify(o)).toEqual(expect.arrayContaining(kase.effects));
  });
}

test('B1 Preview navigation sandbox-regression group: the control shows no effect, so these classes are not credited to the layer', async ({ browser }) => {
  const o = await navControl(browser, SANDBOX_GROUP);
  expect(effectsOf(o), JSON.stringify(o)).toEqual([]);
  expect(navViolations(o), JSON.stringify(o)).toEqual([]);
});

test('B1 Preview navigation sandbox-regression group: the actual Preview keeps the document, zero requests and no extra page', async ({ page, context }) => {
  const o = await navProduct(page, context, SANDBOX_GROUP, false);
  expect(navViolations(o), JSON.stringify(o)).toEqual([]);
  expect(o.srcdocHasVector, JSON.stringify(o)).toBe(false);
});

// Usability while contained: real selection, scrolling, computed inline style, readable inactive labels,
// canonical bytes through the real Download button, and no request from any of it.
const USE_END = 'USABILITY_END_MARKER';
const USE_FIXTURE = navDoc(
  '<h2>Usability Section</h2><p id="use-select">Select this readable sentence for copying.</p>' +
  '<p id="use-style">Styled <span id="u-span" style="color:rgb(7,8,9);font-weight:700">inline span</span> text.</p>' +
  `<p>External: <a id="u-ext" href="${nav(OFF_ORIGIN, 'U-ext')}">external link label</a> Fragment: <a id="u-frag" href="#u-target">fragment link label</a></p>` +
  Array.from({ length: 80 }, (_, i) => `<p>Filler paragraph ${i + 1} with benign text.</p>`).join('') +
  `<div id="u-target">Fragment target</div><p id="u-end">${USE_END}</p>`,
);

test('B1 Preview usability: the contained Preview stays visible, inline styled, selectable and scrollable with readable inactive links and canonical Download bytes', async ({ page, context }) => {
  const state = newNavState();
  await installNavigation(context, state, () => page.mainFrame());
  await page.route('**/api/artifacts/export', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { html: USE_FIXTURE, filename: 'b1-preview-usability.html', receiptAnchor: 'receipt-b1-usability', generatedAt: '2026-10-02T10:00:00.000Z', governanceState: 'DRAFT_UNACCEPTED', verification: [{ label: 'Synthetic fixture', passed: true, detail: 'In-memory only.' }] } }),
    });
  });
  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  resetNavState(state);
  const baseUrl = page.url();
  await page.getByLabel('Title').fill('B1 Preview Usability');
  await page.getByRole('button', { name: /Build HTML/i }).click();
  const frame = page.frameLocator(NAV_PREVIEW);
  await expect(frame.getByRole('heading', { name: NAV_HEADING })).toBeVisible();
  await setMarker(page, NAV_PREVIEW);
  const scrollTop = () => frame.locator('html').evaluate(() => document.scrollingElement?.scrollTop ?? -1);
  const selection = () => frame.locator('html').evaluate(() => window.getSelection()?.toString() ?? '');

  // Visible inline style: stylesheet, style attribute and a nested span.
  expect(await frame.locator('h1').evaluate(el => getComputedStyle(el).color)).toBe(H1_COLOR);
  expect(await frame.locator('#nav-benign').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(P_BACKGROUND);
  expect(await frame.locator('#u-span').evaluate(el => ({ color: getComputedStyle(el).color, weight: getComputedStyle(el).fontWeight }))).toEqual({ color: 'rgb(7, 8, 9)', weight: '700' });

  // Real mouse selection: a triple click and a double click.
  await frame.locator('#use-select').click({ clickCount: 3 });
  expect(await selection()).toContain('Select this readable sentence');
  await frame.locator('#u-span').dblclick({ position: { x: 4, y: 6 } });
  expect(await selection()).toMatch(/inline|span/);

  // Inactive labels stay readable and are not links; clicking them changes nothing (inspected semantics, not the layer oracle).
  for (const [id, text] of [['#u-ext', 'external link label'], ['#u-frag', 'fragment link label']] as const) {
    await expect(frame.locator(id)).toBeVisible();
    await expect(frame.locator(id)).toHaveText(text);
    expect(await frame.locator(id).evaluate(el => ({ href: el.getAttribute('href'), anyLink: el.matches(':any-link') }))).toEqual({ href: null, anyLink: false });
  }
  const topBefore = await scrollTop();
  await frame.locator('#u-ext').click();
  await frame.locator('#u-frag').click();
  await page.waitForTimeout(1_000);
  expect(await scrollTop()).toBe(topBefore);

  // Scrolling by wheel and by keyboard while contained.
  const frameBox = (await page.locator(NAV_PREVIEW).boundingBox())!;
  await page.mouse.move(frameBox.x + frameBox.width / 2, frameBox.y + frameBox.height / 2);
  await page.mouse.wheel(0, 800);
  await expect.poll(scrollTop).toBeGreaterThan(topBefore);
  await frame.locator('#use-select').click();
  await page.keyboard.press('End');
  await expect(frame.locator('#u-end')).toBeInViewport();
  await expect(frame.locator('#u-end')).toHaveText(USE_END);

  // Contained: same document, zero requests, one page; the Preview is derived, canonical Download is unchanged.
  const srcdoc = (await page.locator(NAV_PREVIEW).getAttribute('srcdoc'))!;
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download HTML' }).click()]);
  const downloaded = readFileSync((await download.path())!, 'utf8');
  const observed = await observeNavigation(page, context, state, NAV_PREVIEW, { baseUrl, srcdoc, preLayer: preLayerConstruction(USE_FIXTURE), blinded: 0 });
  console.log('B1_PREVIEW_USABILITY ' + JSON.stringify({ observed, downloadedEqualsCanonical: downloaded === USE_FIXTURE, previewDerived: srcdoc !== USE_FIXTURE }));
  expect(navViolations(observed), JSON.stringify(observed)).toEqual([]);
  expect(observed.srcdocHasVector).toBe(false);
  expect(downloaded).toBe(USE_FIXTURE);
  expect(USE_FIXTURE).toContain('href="#u-target"');
});
