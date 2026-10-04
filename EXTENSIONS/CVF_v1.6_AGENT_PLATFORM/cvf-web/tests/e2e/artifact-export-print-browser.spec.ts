import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Frame, type Page, type Request } from '@playwright/test';
import { login, seedStorage } from './utils';

// Synthetic B1 Print proof (one Chromium profile, intercepted export, no real data).
//
// Two questions, answered on the REAL Artifacts Print button:
//   A. Origin safety: can HTML placed in the Print surface use app-origin script, storage,
//      cookie or request authority? The payload below is harmless and local: it reads and
//      writes uniquely named synthetic sentinels, calls an intercepted no-forward endpoint
//      (fetch, <img>, <link>) and records outcomes as booleans only, never values.
//   B. Completeness: does a 120-row document survive printing in full across pages? The
//      popup is rendered to A4 PDF by Chromium and the text is extracted with pdftotext.
//
// Instrumentation is observe-only. It wraps window.open (main page), Document.write and
// window.print (any page) so they record what the NATIVE implementation did and then call
// the original. Nothing fabricates a popup, a window handle or a print result. A native
// window.print() in headless Chromium opens no dialog; the PDF is a separate renderer
// output of the same popup, not paper.
//
// Cases:
//   control          - the same payload in an unsandboxed same-origin frame DOES reach the
//                      sentinels and the endpoint, so a blocked Print payload is a browser
//                      block and not an inert script.
//   direct output    - the long document rendered directly and exported by the same PDF
//                      pipeline is complete, so the pipeline and fixture can show completeness.
//   real Print       - short and long documents: isolation, native print, displayed version
//                      and complete output.
//   mutations        - isolation stripped from the real Print path trips the origin oracle;
//                      a fixed-height frame trips the completeness oracle.
type Observation =
  | { kind: 'init'; openerPresent: boolean }
  | { kind: 'open'; args: unknown[]; returnClass: string }
  | { kind: 'write'; openerNull: boolean; length: number }
  | { kind: 'print'; openerNull: boolean; frames: Array<{ sandbox: string | null; srcdoc: string | null }> };

type Recorded = Observation & { isPopup: boolean };
type Mutation = 'isolation' | 'clipping' | null;
type HitKind = 'fetch' | 'img' | 'css';

const NONCE_ATTR = 'data-print-nonce';
const PROBE_ATTR = 'data-print-probe';
const STORAGE_SEED = 'cvfPrintSentinel';
const STORAGE_MUTATION = 'cvfPrintMutation';
const COOKIE_SEED = 'cvfPrintSentinel';
const COOKIE_MUTATION = 'cvfPrintMutation';
const ENDPOINT_PATH = '/api/cvf-print-probe';
const APP_PROBE = '__cvfPrintAppProbe';
const PREVIEW_POLICY_MARKER = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'`;
const LINK_KEY = 'navlink';
const ROW_COUNT = 120;
const LONG_END_MARKER = 'ENDMARKERR2LONG7Q';
const SHORT_END_MARKER = 'ENDMARKERR2SHORT3K';
const REPRESENTATIVE_ROWS = [1, 40, 80, 120];

type Probe = {
  storageSeen?: boolean;
  storageMutated?: boolean;
  cookieSeen?: boolean;
  cookieMutated?: boolean;
  parentReach?: boolean;
  topOpenerReach?: boolean;
  fetch?: 'ok' | 'err';
  done?: boolean;
};

const rowToken = (n: number) => `ROWTOKEN${String(n).padStart(3, '0')}`;

// Harmless adversarial payload. Every step is wrapped so one blocked capability does not
// hide the others; the result is written to the payload's own document element.
function payloadScript(origin: string): string {
  return (
    `(function(){var p={};function put(){document.documentElement.setAttribute('${PROBE_ATTR}',JSON.stringify(p));}` +
    `try{p.storageSeen=localStorage.getItem('${STORAGE_SEED}')!==null;}catch(e){p.storageSeen=false;}` +
    `try{localStorage.setItem('${STORAGE_MUTATION}','mutated');p.storageMutated=true;}catch(e){p.storageMutated=false;}` +
    `try{p.cookieSeen=document.cookie.indexOf('${COOKIE_SEED}=')>=0;}catch(e){p.cookieSeen=false;}` +
    `try{document.cookie='${COOKIE_MUTATION}=mutated; path=/';p.cookieMutated=document.cookie.indexOf('${COOKIE_MUTATION}=')>=0;}catch(e){p.cookieMutated=false;}` +
    `try{p.parentReach=typeof window.parent.document.title==='string';}catch(e){p.parentReach=false;}` +
    `try{p.topOpenerReach=window.top.opener!==null&&typeof window.top.opener==='object';if(p.topOpenerReach){window.top.opener.${APP_PROBE}='reached';}}catch(e){p.topOpenerReach=false;}` +
    `put();` +
    `fetch('${origin}${ENDPOINT_PATH}?k=fetch',{credentials:'include'}).then(function(){p.fetch='ok';},function(){p.fetch='err';}).then(function(){p.done=true;put();});` +
    `})();`
  );
}

type FixtureOptions = { title: string; nonce: string; origin: string; long: boolean; payload: boolean };

function fixtureHtml({ title, nonce, origin, long, payload }: FixtureOptions): string {
  const rows = long
    ? '<table>' + Array.from({ length: ROW_COUNT }, (_, i) => `<tr><td>${rowToken(i + 1)}</td><td>benign synthetic row text ${i + 1}</td></tr>`).join('') + '</table>'
    : '';
  const passive = payload
    ? `<img src="${origin}${ENDPOINT_PATH}?k=img" alt=""><link rel="stylesheet" href="${origin}${ENDPOINT_PATH}?k=css">`
    : '';
  const script = payload ? `<script>${payloadScript(origin)}</script>` : '';
  // Canonical links the Preview drops and Print must keep verbatim (never activated here).
  const links = payload
    ? `<p><a href="${origin}${ENDPOINT_PATH}?k=${LINK_KEY}">print link label</a> <svg width="20" height="20"><a xlink:href="${origin}${ENDPOINT_PATH}?k=${LINK_KEY}svg"><text y="10">s</text></a></svg></p>`
    : '';
  return (
    `<!doctype html><html lang="en" ${NONCE_ATTR}="${nonce}"><head>${passive}</head><body><main>` +
    `<h1>Print Fixture ${title}</h1><p>nonce ${nonce}</p>${links}${rows}` +
    `<p>${long ? LONG_END_MARKER : SHORT_END_MARKER}</p>${script}</main></body></html>`
  );
}

const INIT_SCRIPT = `(() => {
  const report = (o) => { try { window.__cvfObservePrint(o); } catch (e) {} };
  report({ kind: 'init', openerPresent: window.opener !== null });
  const open = window.open;
  window.open = function (...args) {
    const r = open.apply(this, args);
    report({ kind: 'open', args, returnClass: r === null ? 'null' : Object.prototype.toString.call(r) });
    return r;
  };
  const write = Document.prototype.write;
  Document.prototype.write = function (...a) {
    report({ kind: 'write', openerNull: window.opener === null, length: String(a[0] ?? '').length });
    return write.apply(this, a);
  };
  const print = window.print;
  window.print = function (...a) {
    const frames = Array.from(document.querySelectorAll('iframe')).map((f) => ({ sandbox: f.getAttribute('sandbox'), srcdoc: f.getAttribute('srcdoc') }));
    report({ kind: 'print', openerNull: window.opener === null, frames });
    return print.apply(this, a);
  };
})();`;

// Test-only mutation 'isolation': the REAL Print path loses its sandbox attributes and its
// CSP meta, i.e. the isolation under test is removed.
const ISOLATION_MUTATION_SCRIPT = `(() => {
  if (window.opener === null) return;
  const append = Node.prototype.appendChild;
  Node.prototype.appendChild = function (node) {
    if (node && node.tagName === 'IFRAME') {
      node.removeAttribute('sandbox');
      window.__cvfIsolationRemoved = true;
    }
    if (node && node.tagName === 'META' && String(node.httpEquiv).toLowerCase() === 'content-security-policy') {
      window.__cvfIsolationRemoved = true;
      return node;
    }
    return append.call(this, node);
  };
})();`;

// Test-only mutation 'clipping': the printed frame gets the rejected fixed height instead of
// its content height, whatever the product computed.
const CLIPPING_MUTATION_SCRIPT = `(() => {
  if (window.opener === null) return;
  const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
  Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', {
    ...d,
    set(value) {
      if (this.getAttribute('sandbox') === '') {
        this.style.setProperty('height', '100vh', 'important');
        window.__cvfClippingApplied = true;
      }
      return d.set.call(this, value);
    },
  });
})();`;

async function readProbe(frame: Frame | undefined): Promise<Probe | null> {
  if (!frame) return null;
  const raw = await frame.evaluate((a) => document.documentElement.getAttribute(a), PROBE_ATTR).catch(() => null);
  return raw ? (JSON.parse(raw) as Probe) : null;
}

async function build(page: Page, title: string) {
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /Build HTML/i }).click();
  await expect(page.locator('iframe[title="Preview"]')).toBeVisible();
}

type PdfText = { pages: number; text: string };

// Renders a page with Chromium print media (A4) and extracts text with pdftotext (poppler).
async function pdfText(target: Page): Promise<PdfText> {
  const dir = mkdtempSync(join(tmpdir(), 'cvf-print-r2-'));
  try {
    const path = join(dir, 'out.pdf');
    await target.pdf({ path, format: 'A4', printBackground: true });
    const text = execFileSync(process.env.CVF_PDFTOTEXT_PATH || 'pdftotext', ['-layout', path, '-'], { encoding: 'utf8' });
    return { pages: text.split('\f').length - 1, text };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function completenessViolations(pdf: PdfText | null, long: boolean): string[] {
  const v: string[] = [];
  if (!pdf) return ['no PDF output was produced'];
  if (long) {
    if (pdf.pages < 2) v.push('long document must print on at least two pages');
    for (const n of REPRESENTATIVE_ROWS) if (!pdf.text.includes(rowToken(n))) v.push(`row ${n} missing from output`);
    if (!pdf.text.includes(LONG_END_MARKER)) v.push('end marker missing from output');
  } else {
    if (pdf.pages < 1) v.push('short document must print');
    if (!pdf.text.includes('Print Fixture')) v.push('heading missing from output');
    if (!pdf.text.includes(SHORT_END_MARKER)) v.push('end marker missing from output');
  }
  return v;
}

async function scenario(page: Page, context: BrowserContext, browserName: string, opts: { mutation: Mutation; long: boolean }) {
  const { mutation, long } = opts;
  const recorded: Recorded[] = [];
  const bodies: string[] = [];
  // Canonical result.html exactly as the (intercepted) export response delivered it.
  const served: string[] = [];
  const hits: Record<HitKind, number> = { fetch: 0, img: 0, css: 0 };
  let exportHits = 0;

  await context.exposeBinding('__cvfObservePrint', (source, observation: Observation) => {
    recorded.push({ ...observation, isPopup: source.page !== page });
  });
  await context.addInitScript(INIT_SCRIPT);
  if (mutation === 'isolation') await context.addInitScript(ISOLATION_MUTATION_SCRIPT);
  if (mutation === 'clipping') await context.addInitScript(CLIPPING_MUTATION_SCRIPT);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.CVF_PLAYWRIGHT_PORT ?? 3001}`;
  const origin = new URL(baseUrl).origin;
  const baseHost = new URL(baseUrl).host;

  await context.route(`**${ENDPOINT_PATH}*`, async route => {
    const kind = new URL(route.request().url()).searchParams.get('k') as HitKind | null;
    if (kind && kind in hits) hits[kind] += 1;
    await route.fulfill({ status: 204, body: '' });
  });
  const total = () => hits.fetch + hits.img + hits.css;
  await page.route('**/api/artifacts/export', async route => {
    exportHits += 1;
    const body = JSON.parse(route.request().postData() ?? '{}') as { title?: string };
    bodies.push(String(body.title));
    const html = fixtureHtml({ title: String(body.title), nonce: `N${exportHits}`, origin, long, payload: true });
    served.push(html);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html,
          filename: 'print-synthetic.html',
          receiptAnchor: `receipt-print-${exportHits}`,
          generatedAt: '2026-10-01T10:00:00.000Z',
          governanceState: 'DRAFT_UNACCEPTED',
          verification: [{ label: 'Synthetic fixture', passed: true, detail: 'In-memory only.' }],
        },
      }),
    });
  });

  const afterClickRequests: Request[] = [];
  let collecting = false;
  context.on('request', request => {
    if (collecting) afterClickRequests.push(request);
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await page.evaluate((probe) => { (window as unknown as Record<string, unknown>)[probe] = 'unset'; }, APP_PROBE);

  // Seed synthetic app-origin capabilities.
  const seed = () => page.evaluate(([ls, ck, lsm, ckm]) => {
    localStorage.setItem(ls, 'seed');
    localStorage.removeItem(lsm);
    document.cookie = `${ck}=seed; path=/`;
    document.cookie = `${ckm}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }, [STORAGE_SEED, COOKIE_SEED, STORAGE_MUTATION, COOKIE_MUTATION]);
  const readState = () => page.evaluate(([lsm, ckm]) => ({
    storageMutated: localStorage.getItem(lsm) !== null,
    cookieMutated: document.cookie.indexOf(`${ckm}=`) >= 0,
  }), [STORAGE_MUTATION, COOKIE_MUTATION]);
  await seed();

  // 1. Positive control: same payload bytes in an unsandboxed same-origin frame.
  await page.evaluate((html) => {
    const f = document.createElement('iframe');
    f.id = 'cvf-print-control';
    f.srcdoc = html;
    document.body.appendChild(f);
  }, fixtureHtml({ title: 'Control', nonce: 'NC', origin, long: false, payload: true }));
  const controlFrame = (): Frame | undefined => page.frames().find(f => f !== page.mainFrame() && f.parentFrame() === page.mainFrame() && f.url() === 'about:srcdoc');
  await expect.poll(async () => (await readProbe(controlFrame()))?.done ?? false).toBe(true);
  await expect.poll(() => total()).toBeGreaterThanOrEqual(3);
  const controlProbe = await readProbe(controlFrame());
  const controlState = await readState();
  const controlHits = { ...hits };
  const controlSandbox = await page.evaluate(() => document.getElementById('cvf-print-control')!.getAttribute('sandbox'));
  await page.evaluate(() => document.getElementById('cvf-print-control')?.remove());
  await seed();
  hits.fetch = 0; hits.img = 0; hits.css = 0;

  // 2. Real Print on the displayed build, after an unsaved form edit.
  const titleA = long ? 'Long A' : 'Version A';
  const titleB = long ? 'Long B unsaved edit' : 'Version B unsaved edit';
  await build(page, titleA);
  const displayedHtml = await page.locator('iframe[title="Preview"]').getAttribute('srcdoc');
  expect(displayedHtml).toContain('nonce N1');
  await page.getByLabel('Title').fill(titleB);
  await expect(page.getByTestId('artifact-version-notice')).toHaveAttribute('data-version-state', 'stale');
  expect(exportHits).toBe(1);
  // The Preview shows a derived document with a resource policy, so it must make no passive
  // request itself; record its hits separately so the Print oracle counts only what Print causes.
  await page.waitForTimeout(1_000);
  const previewHits = { ...hits };
  hits.fetch = 0; hits.img = 0; hits.css = 0;

  collecting = true;
  const popupPromise = page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null);
  await page.getByRole('button', { name: 'Print preview' }).click();
  const popup = await popupPromise;
  // A popup alone is not print proof; wait for the native print call (or time out).
  await expect.poll(() => recorded.some(o => o.kind === 'print'), { timeout: 10_000 }).toBe(true).catch(() => undefined);
  // Let any payload that is allowed to run finish its requests before reading outcomes.
  await page.waitForTimeout(1_000);
  collecting = false;

  const popupEvents = recorded.filter(o => o.isPopup);
  const opens = recorded.filter(o => o.kind === 'open');
  const prints = popupEvents.filter(o => o.kind === 'print') as Array<Extract<Observation, { kind: 'print' }> & { isPopup: boolean }>;
  const popupInit = popupEvents.find(o => o.kind === 'init');
  const popupAlive = popup !== null && !popup.isClosed();
  const printFrame = popupAlive ? popup.frames().find(f => f !== popup.mainFrame()) : undefined;
  const printProbe = await readProbe(printFrame);
  const printFrameOrigin = printFrame ? await printFrame.evaluate(() => window.origin).catch(() => null) : null;
  const printFrameHeading = printFrame ? await printFrame.locator('h1').textContent().catch(() => null) : null;
  const printedSrcdoc = prints[0]?.frames[0]?.srcdoc ?? null;
  const printedSandbox = prints[0]?.frames[0]?.sandbox ?? null;
  const popupOpenerNull = popupAlive ? await popup.evaluate(() => window.opener === null).catch(() => null) : null;
  const flag = (name: string) => popupAlive ? popup.evaluate((n) => (window as unknown as Record<string, unknown>)[n] === true, name).catch(() => false) : Promise.resolve(false);
  const isolationRemoved = await flag('__cvfIsolationRemoved');
  const clippingApplied = await flag('__cvfClippingApplied');
  const pdf = popupAlive ? await pdfText(popup).catch((error: unknown) => {
    const diagnostic = error instanceof Error ? error.message.slice(0, 400) : 'unknown PDF extraction error';
    console.log('B1_PRINT_PDF_DIAGNOSTIC ' + JSON.stringify({ diagnostic }));
    return null;
  }) : null;
  const printState = await readState();
  const appProbe = await page.evaluate((probe) => (window as unknown as Record<string, unknown>)[probe], APP_PROBE);
  const unexpected = afterClickRequests
    .map(r => r.url())
    .filter(url => {
      if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return false;
      const parsed = new URL(url);
      // The controlled endpoint is counted by the isolation oracle. Permit only the
      // harness's known Next dev assets; an unrelated app-origin endpoint is unexpected too.
      if (parsed.host === baseHost && parsed.pathname === ENDPOINT_PATH) return false;
      if (parsed.host === baseHost && parsed.pathname.startsWith('/_next/')) return false;
      return true;
    });

  const observations = {
    browserName,
    browserVersion: page.context().browser()?.version(),
    mutation,
    documentKind: long ? 'long-120-rows' : 'short',
    isolationRemovedByMutation: isolationRemoved,
    clippingAppliedByMutation: clippingApplied,
    control: {
      sandboxAttribute: controlSandbox,
      payloadRan: controlProbe !== null,
      ...controlProbe,
      storageMutatedInOrigin: controlState.storageMutated,
      cookieMutatedInOrigin: controlState.cookieMutated,
      endpointHits: controlHits,
    },
    print: {
      popupEventCount: popup ? 1 : 0,
      windowOpenReturnClass: opens.map(o => (o as { returnClass: string }).returnClass),
      windowOpenArgs: opens.map(o => (o as { args: unknown[] }).args),
      popupOpenerPresentAtCreation: popupInit ? (popupInit as { openerPresent: boolean }).openerPresent : null,
      popupOpenerNullAfterwards: popupOpenerNull,
      untrustedDocumentWriteCount: popupEvents.filter(o => o.kind === 'write').length,
      printCallCount: prints.length,
      printFrameCount: prints[0]?.frames.length ?? 0,
      printFrameSandboxAttribute: printedSandbox,
      printFrameOrigin,
      printFrameHeading,
      printedPayloadEqualsCanonical: printedSrcdoc !== null && served.length >= 1 && printedSrcdoc === served[0],
      previewIsDerivedNotCanonical: displayedHtml !== null && served.length >= 1 && displayedHtml !== served[0] && displayedHtml.includes(PREVIEW_POLICY_MARKER),
      previewDropsCanonicalLinks: displayedHtml !== null && !displayedHtml.includes(`k=${LINK_KEY}`),
      printedKeepsCanonicalLinks: printedSrcdoc !== null && served.length >= 1 && [`?k=${LINK_KEY}"`, `?k=${LINK_KEY}svg"`].every(target => printedSrcdoc.includes(target) && served[0].includes(target)),
      displayedNonce: 'N1',
      formTitleAtPrint: titleB,
      payloadRan: printProbe !== null,
      payloadProbe: printProbe,
      storageMutatedInOrigin: printState.storageMutated,
      cookieMutatedInOrigin: printState.cookieMutated,
      previewEndpointHits: previewHits,
      endpointHits: { ...hits },
      appProbeAfterPrint: appProbe,
    },
    output: pdf ? {
      method: 'popup.pdf(format A4, print media) then pdftotext -layout',
      pages: pdf.pages,
      markers: Object.fromEntries([...REPRESENTATIVE_ROWS.map(n => [rowToken(n), pdf.text.includes(rowToken(n))]), ['endMarker', pdf.text.includes(long ? LONG_END_MARKER : SHORT_END_MARKER)]]),
      rowTokensFound: long ? Array.from({ length: ROW_COUNT }, (_, i) => pdf.text.includes(rowToken(i + 1))).filter(Boolean).length : null,
    } : null,
    exportRouteHits: exportHits,
    exportBuildTitles: bodies,
    unexpectedRequestCount: unexpected.length,
  };
  console.log('B1_PRINT_OBSERVATIONS ' + JSON.stringify(observations));
  return { observations, unexpected, pdf, total: total() };
}

type Observations = Awaited<ReturnType<typeof scenario>>['observations'];

// Everything the real Print path must satisfy, whether or not it is isolated.
function printBehaviorViolations(o: Observations, expectedHeading: string): string[] {
  const v: string[] = [];
  if (o.print.popupEventCount !== 1) v.push('Print button must open one popup');
  if (JSON.stringify(o.print.windowOpenReturnClass) !== '["[object Window]"]') v.push('window.open must return a native Window, not null');
  if (o.print.popupOpenerPresentAtCreation !== true) v.push('control: popup starts with an opener, so detach is observable');
  if (o.print.popupOpenerNullAfterwards !== true) v.push('opener must be detached');
  if (o.print.untrustedDocumentWriteCount !== 0) v.push('result HTML must not be document.write-n into the app-origin popup');
  if (o.print.printCallCount !== 1) v.push('native print() must be invoked once');
  if (!o.print.printedPayloadEqualsCanonical) v.push('printed payload must equal the canonical result.html exactly');
  if (!o.print.previewIsDerivedNotCanonical) v.push('preview must be a derived document carrying the resource policy, distinct from canonical result.html');
  if (!o.print.previewDropsCanonicalLinks) v.push('preview must not carry the canonical link targets');
  if (!o.print.printedKeepsCanonicalLinks) v.push('printed payload must keep the canonical link targets');
  if (o.print.previewEndpointHits.fetch + o.print.previewEndpointHits.img + o.print.previewEndpointHits.css !== 0) v.push('preview must not hit the controlled endpoint');
  if (o.print.printFrameHeading !== expectedHeading) v.push('printed content must be the displayed build, not the unsaved form edit');
  if (o.exportRouteHits !== 1) v.push('Print must not rebuild');
  if (o.unexpectedRequestCount !== 0) v.push('no unexpected outbound request');
  return v;
}

// The origin-isolation oracle: any entry means the Print payload got app-origin authority.
function isolationViolations(o: Observations, hitsTotal: number): string[] {
  const v: string[] = [];
  const p = o.print;
  if (p.printFrameCount !== 1) v.push('exactly one frame must hold the untrusted payload');
  if (p.printFrameSandboxAttribute !== '') v.push('print frame must carry an empty sandbox attribute');
  // window.origin is the document origin; location.origin of about:srcdoc is "null" even when unsandboxed.
  if (p.printFrameOrigin !== 'null') v.push('print frame origin must be opaque');
  if (p.payloadRan) v.push('payload script must not execute');
  if (p.payloadProbe?.storageSeen || p.payloadProbe?.cookieSeen) v.push('payload read seeded storage or cookie');
  if (p.storageMutatedInOrigin) v.push('payload mutated origin localStorage');
  if (p.cookieMutatedInOrigin) v.push('payload mutated origin cookie');
  if (p.endpointHits.fetch !== 0) v.push('payload fetched the controlled same-origin endpoint');
  if (p.endpointHits.img !== 0 || p.endpointHits.css !== 0) v.push('payload loaded a passive resource from the controlled same-origin endpoint');
  if (hitsTotal !== 0) v.push('controlled endpoint was hit');
  if (p.appProbeAfterPrint !== 'unset') v.push('payload reached the app through the opener chain');
  return v;
}

function controlIsExecutable(o: Observations): string[] {
  const c = o.control;
  const v: string[] = [];
  if (c.sandboxAttribute !== null) v.push('control frame must be unsandboxed');
  if (!c.payloadRan) v.push('control payload must execute');
  if (!c.storageSeen) v.push('control must read the seeded localStorage');
  if (!c.cookieSeen) v.push('control must read the seeded cookie');
  if (!c.storageMutatedInOrigin) v.push('control must mutate localStorage');
  if (!c.cookieMutatedInOrigin) v.push('control must mutate the cookie');
  if (!c.parentReach) v.push('control must reach its parent document');
  if (c.fetch !== 'ok') v.push('control must complete the endpoint request');
  if (c.endpointHits.fetch < 1) v.push('control must fetch the controlled endpoint');
  if (c.endpointHits.img < 1) v.push('control must load the passive image from the controlled endpoint');
  if (c.endpointHits.css < 1) v.push('control must load the passive stylesheet from the controlled endpoint');
  return v;
}

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('B1 Print short document: no app-origin authority, native print, displayed version, complete output', async ({ page, context, browserName }) => {
  const { observations, unexpected, pdf, total } = await scenario(page, context, browserName, { mutation: null, long: false });
  const violations = [
    ...controlIsExecutable(observations),
    ...printBehaviorViolations(observations, 'Print Fixture Version A'),
    ...isolationViolations(observations, total),
    ...completenessViolations(pdf, false),
  ];
  expect(violations, `${violations.join('; ')} :: ${JSON.stringify(observations)}`).toEqual([]);
  expect(unexpected).toEqual([]);
});

test('B1 Print long document: all 120 rows and the end marker print across pages with isolation intact', async ({ page, context, browserName }) => {
  const { observations, unexpected, pdf, total } = await scenario(page, context, browserName, { mutation: null, long: true });
  const violations = [
    ...controlIsExecutable(observations),
    ...printBehaviorViolations(observations, 'Print Fixture Long A'),
    ...isolationViolations(observations, total),
    ...completenessViolations(pdf, true),
  ];
  expect(violations, `${violations.join('; ')} :: ${JSON.stringify(observations)}`).toEqual([]);
  expect(observations.output?.rowTokensFound, JSON.stringify(observations)).toBe(ROW_COUNT);
  expect(unexpected).toEqual([]);
});

test('B1 Print output pipeline: the same long document rendered directly is complete (positive output control)', async ({ page }) => {
  await page.setContent(fixtureHtml({ title: 'Direct', nonce: 'ND', origin: 'http://127.0.0.1', long: true, payload: false }));
  const pdf = await pdfText(page);
  expect(completenessViolations(pdf, true), JSON.stringify({ pages: pdf.pages })).toEqual([]);
});

test('B1 Print oracle detects lost isolation: stripping sandbox and CSP gives the payload origin authority', async ({ page, context, browserName }) => {
  const { observations, total } = await scenario(page, context, browserName, { mutation: 'isolation', long: false });
  const violations = isolationViolations(observations, total);

  // The mutation applied to the real Print path and print still ran, so only isolation changed.
  expect(observations.isolationRemovedByMutation, JSON.stringify(observations)).toBe(true);
  expect(observations.print.printCallCount, JSON.stringify(observations)).toBe(1);
  expect(controlIsExecutable(observations), JSON.stringify(observations)).toEqual([]);
  expect(violations, JSON.stringify(observations)).toEqual(expect.arrayContaining([
    'print frame must carry an empty sandbox attribute',
    'print frame origin must be opaque',
    'payload script must not execute',
    'payload mutated origin localStorage',
    'payload mutated origin cookie',
    'payload fetched the controlled same-origin endpoint',
    'payload loaded a passive resource from the controlled same-origin endpoint',
  ]));
});

test('B1 Print oracle detects clipping: a fixed-height print frame loses rows and the end marker', async ({ page, context, browserName }) => {
  const { observations, pdf, total } = await scenario(page, context, browserName, { mutation: 'clipping', long: true });
  const violations = completenessViolations(pdf, true);

  expect(observations.clippingAppliedByMutation, JSON.stringify(observations)).toBe(true);
  expect(observations.print.printCallCount, JSON.stringify(observations)).toBe(1);
  // Isolation is untouched by the clipping mutation, so the failure is purely completeness.
  expect(isolationViolations(observations, total), JSON.stringify(observations)).toEqual([]);
  expect(violations, JSON.stringify(observations)).toEqual(expect.arrayContaining([
    'long document must print on at least two pages',
    'row 120 missing from output',
    'end marker missing from output',
  ]));
});
