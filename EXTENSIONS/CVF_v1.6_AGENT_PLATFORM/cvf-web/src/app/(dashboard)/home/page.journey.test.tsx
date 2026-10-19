/**
 * @vitest-environment jsdom
 *
 * Offline composition evidence for one actual Home -> form -> processing -> result ->
 * follow-up -> child result journey. The five decisive UI/store modules stay real;
 * provider transport and unrelated browser leaves are bounded test fixtures.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from './page';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
const mockSettings = vi.hoisted(() => ({
    settings: { providers: {}, preferences: { defaultExportMode: 'governance' } },
    isLoaded: true,
}));
const downloadBoundary = vi.hoisted(() => ({
    createObjectURL: vi.fn(() => 'blob:offline-journey'),
    revokeObjectURL: vi.fn(),
    anchorClick: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => navigation.params,
}));
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: vi.fn() }));
vi.mock('@/components/Settings', () => ({ useSettings: () => mockSettings }));
vi.mock('@/lib/hooks/useExecute', () => ({
    useProviders: () => ({ providers: [], anyConfigured: false, fetchProviders: vi.fn() }),
}));
vi.mock('@/components/SpecExport', () => ({ SpecExport: () => null }));
vi.mock('@/lib/skill-template-map', () => ({ getSkillForTemplate: () => null }));

vi.mock('@/components', async () => {
    const { DynamicForm } = await vi.importActual<typeof import('@/components/DynamicForm')>(
        '@/components/DynamicForm',
    );
    const { ProcessingScreen } = await vi.importActual<typeof import('@/components/ProcessingScreen')>(
        '@/components/ProcessingScreen',
    );
    const { ResultViewer } = await vi.importActual<typeof import('@/components/ResultViewer')>(
        '@/components/ResultViewer',
    );
    const emptyLeaf = () => null;
    return {
        DynamicForm,
        ProcessingScreen,
        ResultViewer,
        AppBuilderWizard: emptyLeaf,
        ProductDesignWizard: emptyLeaf,
        MarketingCampaignWizard: emptyLeaf,
        BusinessStrategyWizard: emptyLeaf,
        SecurityAssessmentWizard: emptyLeaf,
        ResearchProjectWizard: emptyLeaf,
        SystemDesignWizard: emptyLeaf,
        ContentStrategyWizard: emptyLeaf,
        DataAnalysisWizard: emptyLeaf,
        TemplatePreviewModal: emptyLeaf,
        OnboardingTour: emptyLeaf,
    };
});

vi.mock('@/components/home/HomeBrowseExperience', () => ({
    HomeBrowseExperience: (props: {
        templates: Array<{ id: string }>;
        handleSelectTemplate: (template: unknown) => void;
    }) => (
        <div data-testid="home-browse-experience">
            <button onClick={() => props.handleSelectTemplate(
                props.templates.find(template => template.id === 'documentation'),
            )}>
                pick-documentation
            </button>
        </div>
    ),
}));

interface ExecutePayload {
    templateId: string;
    templateName: string;
    inputs: Record<string, string>;
    intent: string;
}

interface ExecuteCall {
    url: string;
    payload: ExecutePayload;
    respond: (output: string) => void;
}

const documentation = templates.find(template => template.id === 'documentation')!;
const parentValues = {
    subject: 'Parent journey subject marker',
    currentNotes: 'Synthetic parent notes marker',
    readerGoal: 'Confirm submitted field identity',
};
const parentOutput = 'PARENT_OUTPUT_MARKER: distinct synthetic parent result.';
const childOutput = 'CHILD_OUTPUT_MARKER: distinct synthetic follow-up result.';
const followUpText = 'Refine the parent with a distinct child instruction';
const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const originalAnchorClick = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'click');

let calls: ExecuteCall[];
let requestedUrls: string[];
let fetchSpy: ReturnType<typeof vi.spyOn>;

function restoreProperty(target: object, name: PropertyKey, descriptor?: PropertyDescriptor) {
    if (descriptor) {
        Object.defineProperty(target, name, descriptor);
    } else {
        Reflect.deleteProperty(target, name);
    }
}

function updateField(name: string, value: string) {
    const field = document.querySelector(`[name="${name}"]`);
    if (!field) throw new Error(`Missing actual form field: ${name}`);
    fireEvent.change(field, { target: { value } });
}

function newestExecution(): Execution {
    const execution = useExecutionStore.getState().executions[0];
    if (!execution) throw new Error('Expected the actual Home flow to create an execution');
    return execution;
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigation.params = new URLSearchParams();
    useExecutionStore.setState({ executions: [], currentExecution: null });
    calls = [];
    requestedUrls = [];
    downloadBoundary.createObjectURL.mockClear();
    downloadBoundary.revokeObjectURL.mockClear();
    downloadBoundary.anchorClick.mockClear();
    vi.mocked(navigator.clipboard.writeText).mockClear();
    Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: downloadBoundary.createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: downloadBoundary.revokeObjectURL,
    });
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
        configurable: true,
        value: downloadBoundary.anchorClick,
    });
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = String(input);
        requestedUrls.push(url);
        if (url !== '/api/execute') {
            return Promise.reject(new Error(`UNEXPECTED_TEST_FETCH:${url}`));
        }
        const payload = JSON.parse(String(init?.body)) as ExecutePayload;
        return new Promise<Response>(resolve => {
            calls.push({
                url,
                payload,
                respond: output => resolve(new Response(JSON.stringify({ success: true, output }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })),
            });
        });
    });
});

afterEach(() => {
    expect(requestedUrls.every(url => url === '/api/execute')).toBe(true);
    expect(vi.mocked(navigator.clipboard.writeText)).not.toHaveBeenCalled();
    expect(downloadBoundary.createObjectURL).not.toHaveBeenCalled();
    expect(downloadBoundary.revokeObjectURL).not.toHaveBeenCalled();
    expect(downloadBoundary.anchorClick).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    restoreProperty(URL, 'createObjectURL', originalCreateObjectURL);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
    restoreProperty(HTMLAnchorElement.prototype, 'click', originalAnchorClick);
    vi.restoreAllMocks();
});

describe('offline Home parent-child journey', () => {
    it('submits actual fields, displays a parent result, and carries it into a distinct child result', async () => {
        render(<HomePage />);
        fireEvent.click(screen.getByRole('button', { name: 'pick-documentation' }));

        updateField('subject', parentValues.subject);
        updateField('currentNotes', parentValues.currentNotes);
        updateField('readerGoal', parentValues.readerGoal);
        fireEvent.click(screen.getByRole('button', { name: 'Preview agent instructions' }));
        const expectedIntent = document.querySelector('pre')?.textContent ?? '';
        expect(expectedIntent).not.toBe('');
        expect(expectedIntent).toContain(parentValues.subject);
        expect(expectedIntent).toContain(parentValues.currentNotes);

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Generate result' })); });
        await waitFor(() => expect(calls).toHaveLength(1));
        expect(screen.getByText('AI Processing...')).toBeTruthy();

        const parent = newestExecution();
        expect(parent.templateId).toBe(documentation.id);
        expect(parent.input).toEqual(parentValues);
        expect(parent.intent).toBe(expectedIntent);
        expect(calls[0].url).toBe('/api/execute');
        expect(calls[0].payload).toMatchObject({
            templateId: documentation.id,
            inputs: parentValues,
            intent: expectedIntent,
        });

        await act(async () => { calls[0].respond(parentOutput); });
        await waitFor(() => expect(screen.getAllByText(parentOutput)).toHaveLength(2));
        expect(useExecutionStore.getState().currentExecution?.id).toBe(parent.id);
        expect(useExecutionStore.getState().executions.find(item => item.id === parent.id)?.output).toBe(parentOutput);
        expect(screen.getByTestId('deliverable-pack-preview')).toBeTruthy();
        expect(screen.getByTestId('deliverable-pack-preview').textContent)
            .toContain(`Documentation: ${expectedIntent}`);

        fireEvent.change(screen.getByTestId('followup-input'), { target: { value: followUpText } });
        fireEvent.click(screen.getByTestId('followup-submit-btn'));
        await waitFor(() => expect(calls).toHaveLength(2));

        const child = newestExecution();
        expect(child.id).not.toBe(parent.id);
        expect(child.parentExecutionId).toBe(parent.id);
        expect(child.input).toEqual({ ...parentValues, _previousOutput: parentOutput });
        expect(child.intent).toBe(followUpText);
        expect(calls[1].url).toBe('/api/execute');
        expect(calls[1].payload).toMatchObject({
            templateId: documentation.id,
            inputs: { ...parentValues, _previousOutput: parentOutput },
            intent: followUpText,
        });

        await act(async () => { calls[1].respond(childOutput); });
        await waitFor(() => expect(screen.getAllByText(childOutput)).toHaveLength(2));
        expect(useExecutionStore.getState().currentExecution?.id).toBe(child.id);
        expect(useExecutionStore.getState().executions.find(item => item.id === child.id)?.output).toBe(childOutput);
        expect(useExecutionStore.getState().executions.find(item => item.id === parent.id)?.output).toBe(parentOutput);
        expect(screen.getByTestId('deliverable-pack-preview').textContent)
            .toContain(`Documentation: ${followUpText}`);
        expect(screen.queryByText(parentOutput)).toBeNull();
        expect(requestedUrls).toEqual(['/api/execute', '/api/execute']);
    });
});
