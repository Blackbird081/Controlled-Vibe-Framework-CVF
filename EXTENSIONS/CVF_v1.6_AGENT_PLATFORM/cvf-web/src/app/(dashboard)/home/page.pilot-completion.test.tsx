// Text Encoding Exception: Vietnamese pilot copy and invented Vietnamese fixture text are intentional.
/**
 * @vitest-environment jsdom
 *
 * Pure/UI fixture checks of the Home HTML pilot entry in EN and VI. The real Home, form and processing screen run;
 * the network is a local recorder, so passing proves serialization, consent order and locked-send wiring only.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from './page';
import { useExecutionStore } from '@/lib/store';
import { pilotCopy } from '@/components/html-pilot-copy';
import { PILOT_LIMITS, assertFixtureGoals, assertSerializedGoal, sha256Utf8 } from '../../../../tests/helpers/ncr-html-pilot-proof-assertions';

const nav = vi.hoisted(() => ({ params: new URLSearchParams(), language: 'en' }));
const settings = vi.hoisted(() => ({ value: { settings: { providers: {}, preferences: { defaultExportMode: 'governance' } }, isLoaded: true } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => nav.params }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: nav.language, t: (key: string) => key }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: vi.fn() }));
vi.mock('@/components/Settings', () => ({ useSettings: () => settings.value }));
vi.mock('@/lib/hooks/useExecute', () => ({ useProviders: () => ({ providers: [], anyConfigured: false, fetchProviders: vi.fn() }) }));
vi.mock('@/components/SpecExport', () => ({ SpecExport: () => null }));
vi.mock('@/lib/skill-template-map', () => ({ getSkillForTemplate: () => null }));
vi.mock('@/components', async () => {
  const { ProcessingScreen } = await vi.importActual<typeof import('@/components/ProcessingScreen')>('@/components/ProcessingScreen');
  const { ResultViewer } = await vi.importActual<typeof import('@/components/ResultViewer')>('@/components/ResultViewer');
  const empty = () => null;
  return { DynamicForm: empty, ProcessingScreen, ResultViewer, AppBuilderWizard: empty, ProductDesignWizard: empty,
    MarketingCampaignWizard: empty, BusinessStrategyWizard: empty, SecurityAssessmentWizard: empty, ResearchProjectWizard: empty,
    SystemDesignWizard: empty, ContentStrategyWizard: empty, DataAnalysisWizard: empty, TemplatePreviewModal: empty, OnboardingTour: empty };
});
vi.mock('@/components/home/HomeBrowseExperience', () => ({ HomeBrowseExperience: () => null }));

// Ends with a non-space character so the form's trim cannot change the exact length.
const pad = (seed: string, length: number) => `${seed.repeat(Math.ceil(length / seed.length)).slice(0, length - 1)}.`;
const goal = pad('Trang giới thiệu không gian đọc sách hư cấu Ánh Sao. ', PILOT_LIMITS.initialGoalLength);
const revision = pad('Đổi tên thành Ngày hội đọc Ánh Sao và giữ ba mục. ', PILOT_LIMITS.revisionGoalLength);
const disclosure = { kind: 'REAL_PROVIDER_FICTIONAL_CONTENT', provider: 'alibaba', model: 'qwen-flash', endpoint: 'fixture.invalid', maxPaidStarts: 2,
  maxTokens: 1000, maxUsd: 0.1, maxSeconds: 120 };

interface Recorded { method: string; url: string; body?: Record<string, unknown> }
let recorded: Recorded[];
const executePosts = () => recorded.filter(call => call.method === 'POST' && call.url === '/api/execute');

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  nav.params = new URLSearchParams('template=web_build_handoff&htmlPilot=1');
  useExecutionStore.setState({ executions: [], currentExecution: null });
  recorded = [];
  HTMLElement.prototype.scrollIntoView = () => undefined;
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addListener: () => undefined,
    removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false })) as typeof window.matchMedia;
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    recorded.push({ method, url, ...(typeof init?.body === 'string' ? { body: JSON.parse(init.body) as Record<string, unknown> } : {}) });
    if (method === 'GET' && url === '/api/execute') return Promise.resolve(new Response(JSON.stringify({ success: true, disclosure }), { status: 200 }));
    if (method === 'POST' && url === '/api/execute') return new Promise<Response>(() => undefined);
    return Promise.reject(new Error(`UNEXPECTED_TEST_FETCH:${method}:${url}`));
  }));
});
afterEach(() => { cleanup(); });

const field = () => document.querySelector<HTMLInputElement>('input[name="websiteGoal"]')!;
const setLanguage = (language: 'en' | 'vi') => { nav.language = language; };
async function enterGoal(copy: ReturnType<typeof pilotCopy>, value: string) {
  render(<HomePage />);
  await waitFor(() => expect(field()).not.toBeNull());
  fireEvent.change(field(), { target: { value } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: copy.home.continueLabel })); });
}

describe('fixture goals', () => {
  it('uses the exact 547 and 442 character inputs and keeps both form limits above them', () => {
    assertFixtureGoals(goal, revision);
    expect(goal).toHaveLength(547);
    expect(revision).toHaveLength(442);
    const source = readFileSync(path.join(__dirname, '../../../components/ResultViewer.tsx'), 'utf8');
    const followup = source.slice(source.indexOf('data-testid="followup-input"'));
    expect(followup.slice(0, 400)).toContain('maxLength={500}');
    expect(revision.length).toBeLessThanOrEqual(500);
  });
});

describe.each(['en', 'vi'] as const)('Home pilot entry (%s)', language => {
  const copy = pilotCopy(language);
  beforeEach(() => setLanguage(language));

  it('shows the localized goal form with a labelled, keyboard-reachable field and submit', async () => {
    render(<HomePage />);
    await waitFor(() => expect(field()).not.toBeNull());
    const form = screen.getByTestId('html-pilot-goal-form');
    expect(screen.getByRole('heading', { name: copy.home.heading })).toBeTruthy();
    expect(form.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { name: copy.home.heading }).id);
    expect(screen.getByLabelText(copy.home.goalLabel)).toBe(field());
    expect(field().maxLength).toBe(PILOT_LIMITS.goalMaxLength);
    expect(field().required).toBe(true);
    expect(document.getElementById(field().getAttribute('aria-describedby')!)?.textContent).toBe(copy.home.intro);
    const submit = screen.getByRole('button', { name: copy.home.continueLabel }) as HTMLButtonElement;
    expect(submit.type).toBe('submit');
    expect(submit.className).toContain('min-h-11');
    expect([field(), submit].every(element => element.tabIndex === 0)).toBe(true);
    if (language === 'vi') expect(submit.textContent).toBe('Tiếp tục tới phần công bố tác động');
    expect(executePosts()).toHaveLength(0);
  });

  it('serializes all 547 characters intact only after the effect is confirmed', async () => {
    await enterGoal(copy, goal);
    await waitFor(() => expect(screen.getByTestId('html-pilot-effect-disclosure')).toBeTruthy());
    expect(executePosts()).toHaveLength(0);
    expect(useExecutionStore.getState().executions[0].intent).toBe(goal);
    await act(async () => { fireEvent.click(screen.getByTestId('html-pilot-confirm-effect')); });
    await waitFor(() => expect(executePosts()).toHaveLength(1));
    const body = executePosts()[0].body!;
    expect(body.intent).toHaveLength(547);
    assertSerializedGoal(body, goal);
    expect(sha256Utf8(body.intent as string)).toBe(sha256Utf8(goal));
    expect(body.inputs).toEqual({ websiteGoal: goal });
    expect(body.templateId).toBe('web_build_handoff');
    expect(typeof (body.htmlPilotIntent as { operationKey?: unknown }).operationKey).toBe('string');
    for (const key of ['knowledgeContext', 'knowledgeCollectionId', 'aifMemoryReinjection', 'durableMemory', 'provider', 'model']) {
      expect(Object.hasOwn(body, key), key).toBe(false);
    }
    expect(executePosts()).toHaveLength(1);
  });

  it('declines before consent with zero execute requests and keeps sending locked with a visible reason', async () => {
    await enterGoal(copy, goal);
    await waitFor(() => expect(screen.getByTestId('html-pilot-confirm-effect')).toBeTruthy());
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: language === 'vi' ? 'Hủy' : 'Cancel' })); });
    await waitFor(() => expect(screen.getByTestId('html-pilot-goal-form')).toBeTruthy());
    expect(executePosts()).toHaveLength(0);
    expect(screen.getByTestId('draft-stop-notice').textContent).toContain(copy.home.stoppedNotice);
    expect(field().value).toBe(goal);
    const submit = screen.getByRole('button', { name: copy.home.continueLabel }) as HTMLButtonElement;
    const hint = screen.getByTestId('html-pilot-goal-blocked');
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.textContent).toBe(copy.home.blockedHint);
    const executionsBefore = useExecutionStore.getState().executions.length;
    await act(async () => { fireEvent.submit(screen.getByTestId('html-pilot-goal-form')); });
    expect(useExecutionStore.getState().executions).toHaveLength(executionsBefore);
    expect(screen.queryByTestId('html-pilot-effect-disclosure')).toBeNull();
    expect(executePosts()).toHaveLength(0);
  });
});
