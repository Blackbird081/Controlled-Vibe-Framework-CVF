import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import {
    AGENTS,
    WORKFLOW_TEMPLATES,
    useMultiAgentWorkflow,
    AgentCard,
    WorkflowSelector,
    WorkflowProgress,
} from './multi-agent';
import type { AgentRole, Workflow, Agent } from './multi-agent';

describe('Multi-Agent Module', () => {
    // ================================================
    // Agent Definitions
    // ================================================
    describe('AGENTS', () => {
        it('should define all 4 agent roles', () => {
            const roles: AgentRole[] = ['orchestrator', 'architect', 'builder', 'reviewer'];
            for (const role of roles) {
                expect(AGENTS[role]).toBeDefined();
                expect(AGENTS[role].id).toBe(role);
                expect(AGENTS[role].role).toBe(role);
            }
        });

        it('each agent should have required properties', () => {
            for (const agent of Object.values(AGENTS)) {
                expect(agent.name).toBeTruthy();
                expect(agent.description).toBeTruthy();
                expect(agent.systemPrompt).toBeTruthy();
                expect(agent.icon).toBeTruthy();
                expect(agent.color).toBeTruthy();
            }
        });

        it('each agent system prompt should contain CVF reference', () => {
            for (const agent of Object.values(AGENTS)) {
                expect(agent.systemPrompt).toContain('CVF');
            }
        });

        it('agents should have unique ids', () => {
            const ids = Object.values(AGENTS).map(a => a.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    // ================================================
    // Workflow Templates
    // ================================================
    describe('WORKFLOW_TEMPLATES', () => {
        it('should define fullCycle with all 4 agents in correct order', () => {
            const { fullCycle } = WORKFLOW_TEMPLATES;
            expect(fullCycle.agents).toHaveLength(4);
            expect(fullCycle.agents[0].role).toBe('orchestrator');
            expect(fullCycle.agents[1].role).toBe('architect');
            expect(fullCycle.agents[2].role).toBe('builder');
            expect(fullCycle.agents[3].role).toBe('reviewer');
        });

        it('should define designOnly with architect only', () => {
            expect(WORKFLOW_TEMPLATES.designOnly.agents).toHaveLength(1);
            expect(WORKFLOW_TEMPLATES.designOnly.agents[0].role).toBe('architect');
        });

        it('should define buildReview with builder → reviewer', () => {
            const { buildReview } = WORKFLOW_TEMPLATES;
            expect(buildReview.agents).toHaveLength(2);
            expect(buildReview.agents[0].role).toBe('builder');
            expect(buildReview.agents[1].role).toBe('reviewer');
        });

        it('should define quickBuild with builder only', () => {
            expect(WORKFLOW_TEMPLATES.quickBuild.agents).toHaveLength(1);
            expect(WORKFLOW_TEMPLATES.quickBuild.agents[0].role).toBe('builder');
        });

        it('all templates should have name and description', () => {
            for (const template of Object.values(WORKFLOW_TEMPLATES)) {
                expect(template.name).toBeTruthy();
                expect(template.description).toBeTruthy();
            }
        });
    });

    // ================================================
    // useMultiAgentWorkflow Hook
    // ================================================
    describe('useMultiAgentWorkflow', () => {
        it('should initialize with null workflow', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());
            expect(result.current.workflow).toBeNull();
            expect(result.current.isRunning).toBe(false);
        });

        it('should create a workflow from template', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle');
            });

            expect(result.current.workflow).not.toBeNull();
            expect(result.current.workflow!.status).toBe('idle');
            expect(result.current.workflow!.agents).toHaveLength(4);
            expect(result.current.workflow!.currentAgentIndex).toBe(0);
            expect(result.current.workflow!.tasks).toHaveLength(0);
        });

        it('should create workflow with custom name', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle', 'My Custom Workflow');
            });

            expect(result.current.workflow!.name).toBe('My Custom Workflow');
        });

        it('should generate unique workflow id', async () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            let workflow1: Workflow;
            act(() => {
                workflow1 = result.current.createWorkflow('fullCycle');
            });

            // Small delay to ensure different Date.now()
            await new Promise(r => setTimeout(r, 5));

            act(() => {
                result.current.reset();
            });

            let workflow2: Workflow;
            act(() => {
                workflow2 = result.current.createWorkflow('fullCycle');
            });

            expect(workflow1!.id).not.toBe(workflow2!.id);
        });

        // --- Task Management ---
        it('should add task to workflow', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle');
            });

            act(() => {
                result.current.addTask('orchestrator', 'Build a landing page');
            });

            expect(result.current.workflow!.tasks).toHaveLength(1);
            expect(result.current.workflow!.tasks[0].agentId).toBe('orchestrator');
            expect(result.current.workflow!.tasks[0].input).toBe('Build a landing page');
            expect(result.current.workflow!.tasks[0].status).toBe('pending');
        });

        it('should not add task when no workflow exists', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());
            act(() => {
                result.current.addTask('builder', 'some task');
            });
            // Should not throw, just no-op
            expect(result.current.workflow).toBeNull();
        });

        // --- Task Status Updates ---
        it('should update task status to running', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('quickBuild');
            });

            let taskId: string;
            act(() => {
                const task = result.current.addTask('builder', 'Write code');
                taskId = task!.id;
            });

            act(() => {
                result.current.updateTaskStatus(taskId, 'running');
            });

            expect(result.current.workflow!.tasks[0].status).toBe('running');
        });

        it('should update task status to completed with output', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('quickBuild');
            });

            let taskId: string;
            act(() => {
                const task = result.current.addTask('builder', 'Write code');
                taskId = task!.id;
            });

            act(() => {
                result.current.updateTaskStatus(taskId, 'completed', 'Result output');
            });

            const task = result.current.workflow!.tasks[0];
            expect(task.status).toBe('completed');
            expect(task.output).toBe('Result output');
            expect(task.endTime).toBeDefined();
        });

        it('should update task status to failed with error', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('quickBuild');
            });

            let taskId: string;
            act(() => {
                const task = result.current.addTask('builder', 'Write code');
                taskId = task!.id;
            });

            act(() => {
                result.current.updateTaskStatus(taskId, 'failed', undefined, 'Something went wrong');
            });

            const task = result.current.workflow!.tasks[0];
            expect(task.status).toBe('failed');
            expect(task.error).toBe('Something went wrong');
            expect(task.endTime).toBeDefined();
        });

        // --- Agent Navigation ---
        it('should move to next agent in pipeline', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle');
            });

            expect(result.current.workflow!.currentAgentIndex).toBe(0);

            act(() => {
                result.current.moveToNextAgent();
            });

            expect(result.current.workflow!.currentAgentIndex).toBe(1);
        });

        it('should mark workflow completed when past last agent', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('quickBuild'); // 1 agent only
            });

            act(() => {
                result.current.moveToNextAgent(); // Past last agent
            });

            expect(result.current.workflow!.status).toBe('completed');
        });

        it('should return current agent correctly', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('buildReview');
            });

            expect(result.current.getCurrentAgent()!.role).toBe('builder');

            act(() => {
                result.current.moveToNextAgent();
            });

            expect(result.current.getCurrentAgent()!.role).toBe('reviewer');
        });

        it('getCurrentAgent should return null when no workflow', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());
            expect(result.current.getCurrentAgent()).toBeNull();
        });

        // --- Reset ---
        it('should reset workflow state completely', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle');
                result.current.setIsRunning(true);
            });

            act(() => {
                result.current.reset();
            });

            expect(result.current.workflow).toBeNull();
            expect(result.current.isRunning).toBe(false);
        });

        // --- setWorkflowStatus when no workflow exists (line 229) ---
        it('setWorkflowStatus is no-op when no workflow exists', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());
            // No workflow created — setWorkflowStatus should not throw
            act(() => {
                result.current.setWorkflowStatus('running');
            });
            expect(result.current.workflow).toBeNull();
        });

        // --- Sequential Pipeline Integrity ---
        it('should maintain sequential pipeline order through full cycle', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            act(() => {
                result.current.createWorkflow('fullCycle');
            });

            const expectedOrder: AgentRole[] = ['orchestrator', 'architect', 'builder', 'reviewer'];

            for (let i = 0; i < expectedOrder.length; i++) {
                expect(result.current.getCurrentAgent()!.role).toBe(expectedOrder[i]);
                if (i < expectedOrder.length - 1) {
                    act(() => {
                        result.current.moveToNextAgent();
                    });
                }
            }

            // Move past last agent → completed
            act(() => {
                result.current.moveToNextAgent();
            });
            expect(result.current.workflow!.status).toBe('completed');
        });
    });

    // ================================================
    // AgentCard Component
    // ================================================
    describe('AgentCard', () => {
        const agent = AGENTS.builder;

        it('renders agent name and description', () => {
            render(<AgentCard agent={agent} />);
            expect(screen.getByText('Builder')).toBeTruthy();
            expect(screen.getByText(agent.description)).toBeTruthy();
        });

        it('renders agent icon', () => {
            render(<AgentCard agent={agent} />);
            expect(screen.getByText('🔨')).toBeTruthy();
        });

        it('renders Vietnamese description when language=vi', () => {
            render(<AgentCard agent={agent} language="vi" />);
            expect(screen.getByText(agent.descriptionVi)).toBeTruthy();
        });

        it('shows active indicator when isActive', () => {
            render(<AgentCard agent={agent} isActive />);
            expect(screen.getByText('⚡')).toBeTruthy();
        });

        it('shows completed indicator when isCompleted', () => {
            render(<AgentCard agent={agent} isCompleted />);
            expect(screen.getByText('✓')).toBeTruthy();
        });

        it('calls onClick when clicked', () => {
            const onClick = vi.fn();
            render(<AgentCard agent={agent} onClick={onClick} />);
            fireEvent.click(screen.getByText('Builder'));
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('renders all agent colors', () => {
            for (const agentRole of Object.values(AGENTS)) {
                const { unmount } = render(<AgentCard agent={agentRole} />);
                expect(screen.getByText(agentRole.name)).toBeTruthy();
                unmount();
            }
        });
    });

    // ================================================
    // WorkflowSelector Component
    // ================================================
    describe('WorkflowSelector', () => {
        it('renders all 4 workflow templates', () => {
            const onSelect = vi.fn();
            render(<WorkflowSelector onSelect={onSelect} />);
            expect(screen.getByText('Full Development Cycle')).toBeTruthy();
            expect(screen.getByText('Architecture Design')).toBeTruthy();
            expect(screen.getByText('Build & Review')).toBeTruthy();
            expect(screen.getByText('Quick Build')).toBeTruthy();
        });

        it('renders Vietnamese labels when language=vi', () => {
            const onSelect = vi.fn();
            render(<WorkflowSelector onSelect={onSelect} language="vi" />);
            expect(screen.getByText('Chu trình phát triển đầy đủ')).toBeTruthy();
            expect(screen.getByText('Thiết kế kiến trúc')).toBeTruthy();
        });

        it('calls onSelect with correct template key', () => {
            const onSelect = vi.fn();
            render(<WorkflowSelector onSelect={onSelect} />);
            fireEvent.click(screen.getByText('Quick Build'));
            expect(onSelect).toHaveBeenCalledWith('quickBuild');
        });

        it('shows agent icons for each template', () => {
            const onSelect = vi.fn();
            render(<WorkflowSelector onSelect={onSelect} />);
            // Full cycle should show all 4 agent icons
            expect(screen.getAllByText('🎯').length).toBeGreaterThanOrEqual(1); // orchestrator
            expect(screen.getAllByText('📐').length).toBeGreaterThanOrEqual(1); // architect
        });
    });

    // ================================================
    // WorkflowProgress Component
    // ================================================
    describe('WorkflowProgress', () => {
        const makeWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
            id: 'wf-1',
            name: 'Test Workflow',
            description: 'Test desc',
            agents: [AGENTS.builder, AGENTS.reviewer],
            tasks: [],
            status: 'idle',
            currentAgentIndex: 0,
            ...overrides,
        });

        it('renders workflow name', () => {
            render(<WorkflowProgress workflow={makeWorkflow()} />);
            expect(screen.getByText('Test Workflow')).toBeTruthy();
        });

        it('renders IDLE status badge', () => {
            render(<WorkflowProgress workflow={makeWorkflow()} />);
            expect(screen.getByText('IDLE')).toBeTruthy();
        });

        it('renders RUNNING status badge', () => {
            render(<WorkflowProgress workflow={makeWorkflow({ status: 'running' })} />);
            expect(screen.getByText('RUNNING')).toBeTruthy();
        });

        it('renders COMPLETED status badge', () => {
            render(<WorkflowProgress workflow={makeWorkflow({ status: 'completed' })} />);
            expect(screen.getByText('COMPLETED')).toBeTruthy();
        });

        it('renders FAILED status badge', () => {
            render(<WorkflowProgress workflow={makeWorkflow({ status: 'failed' })} />);
            expect(screen.getByText('FAILED')).toBeTruthy();
        });

        it('renders Vietnamese status labels', () => {
            render(<WorkflowProgress workflow={makeWorkflow({ status: 'running' })} language="vi" />);
            expect(screen.getByText('ĐANG CHẠY')).toBeTruthy();
        });

        it('renders all agents in pipeline', () => {
            render(<WorkflowProgress workflow={makeWorkflow()} />);
            expect(screen.getByText('Builder')).toBeTruthy();
            expect(screen.getByText('Reviewer')).toBeTruthy();
        });

        it('renders arrows between agents', () => {
            render(<WorkflowProgress workflow={makeWorkflow()} />);
            expect(screen.getByText('→')).toBeTruthy();
        });

        it('renders tasks when present', () => {
            const wf = makeWorkflow({
                tasks: [{
                    id: 't1',
                    agentId: 'builder',
                    input: 'Write code',
                    status: 'completed',
                    output: 'Done! Here is the result of the task...',
                }],
            });
            render(<WorkflowProgress workflow={wf} />);
            expect(screen.getByText(/Tasks/)).toBeTruthy();
            expect(screen.getAllByText('Builder').length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('completed')).toBeTruthy();
        });

        it('renders task output truncated', () => {
            const longOutput = 'A'.repeat(200);
            const wf = makeWorkflow({
                tasks: [{
                    id: 't1',
                    agentId: 'builder',
                    input: 'Write code',
                    status: 'completed',
                    output: longOutput,
                }],
            });
            render(<WorkflowProgress workflow={wf} />);
            // Output should be truncated to 150 chars + "..."
            const outputEl = screen.getByText(/\.\.\.$/);
            expect(outputEl).toBeTruthy();
        });

        it('renders Vietnamese task label', () => {
            const wf = makeWorkflow({
                tasks: [{
                    id: 't1',
                    agentId: 'builder',
                    input: 'Test',
                    status: 'pending',
                }],
            });
            render(<WorkflowProgress workflow={wf} language="vi" />);
            expect(screen.getByText('Tác vụ')).toBeTruthy();
        });
    });
});