import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    AGENTS,
    WORKFLOW_TEMPLATES,
    useMultiAgentWorkflow,
} from './multi-agent';
import type { AgentRole, Workflow } from './multi-agent';

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

        it('should generate unique workflow id', () => {
            const { result } = renderHook(() => useMultiAgentWorkflow());

            let workflow1: Workflow;
            act(() => {
                workflow1 = result.current.createWorkflow('fullCycle');
            });

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
});
