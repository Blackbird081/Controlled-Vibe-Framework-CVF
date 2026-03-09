import { Task, TaskStatus, TaskPriority } from "./types";

let taskCounter = 0;

function nextTaskId(): string {
  taskCounter++;
  return `TASK-${String(taskCounter).padStart(4, "0")}`;
}

export function resetTaskCounter(): void {
  taskCounter = 0;
}

export class TaskRegistry {
  private tasks: Map<string, Task> = new Map();

  create(opts: {
    title: string;
    description: string;
    domain: string;
    priority: TaskPriority;
    createdBy: string;
    requiredCapabilities?: string[];
    deadline?: number;
    reward?: number;
    metadata?: Record<string, unknown>;
  }): Task {
    const task: Task = {
      id: nextTaskId(),
      title: opts.title,
      description: opts.description,
      domain: opts.domain,
      priority: opts.priority,
      status: "open",
      requiredCapabilities: opts.requiredCapabilities ?? [],
      createdBy: opts.createdBy,
      createdAt: Date.now(),
      deadline: opts.deadline,
      reward: opts.reward ?? 0,
      metadata: opts.metadata ?? {},
    };
    this.tasks.set(task.id, task);
    return task;
  }

  get(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  updateStatus(taskId: string, status: TaskStatus): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.status = status;
    return true;
  }

  assign(taskId: string, agentId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.assignedTo = agentId;
    task.status = "assigned";
    return true;
  }

  findByStatus(status: TaskStatus): Task[] {
    return [...this.tasks.values()].filter((t) => t.status === status);
  }

  findByDomain(domain: string): Task[] {
    return [...this.tasks.values()].filter((t) => t.domain === domain);
  }

  findByAgent(agentId: string): Task[] {
    return [...this.tasks.values()].filter((t) => t.assignedTo === agentId);
  }

  findOpen(): Task[] {
    return this.findByStatus("open");
  }

  findByCapability(capability: string): Task[] {
    return [...this.tasks.values()].filter(
      (t) => t.status === "open" && t.requiredCapabilities.includes(capability)
    );
  }

  listAll(): Task[] {
    return [...this.tasks.values()];
  }

  count(): number {
    return this.tasks.size;
  }

  clear(): void {
    this.tasks.clear();
  }
}
