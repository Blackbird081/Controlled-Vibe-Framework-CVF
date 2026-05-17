import { TaskPriority, TaskResult } from "./types";
import { TaskRegistry, resetTaskCounter } from "./task.registry";
import { BidManager, resetBidCounter } from "./bid.manager";

export { resetTaskCounter, resetBidCounter };

export class Marketplace {
  private tasks: TaskRegistry;
  private bids: BidManager;
  private results: TaskResult[] = [];

  constructor() {
    this.tasks = new TaskRegistry();
    this.bids = new BidManager();
  }

  postTask(opts: {
    title: string;
    description: string;
    domain: string;
    priority: TaskPriority;
    createdBy: string;
    requiredCapabilities?: string[];
    deadline?: number;
    reward?: number;
  }) {
    const task = this.tasks.create(opts);
    return task;
  }

  placeBid(taskId: string, agentId: string, amount: number, message?: string) {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;
    if (task.status !== "open" && task.status !== "bidding") return undefined;

    if (task.status === "open") {
      this.tasks.updateStatus(taskId, "bidding");
    }

    return this.bids.submit(taskId, agentId, amount, message);
  }

  acceptBid(bidId: string): boolean {
    const bid = this.bids.get(bidId);
    if (!bid) return false;

    const accepted = this.bids.accept(bidId);
    if (!accepted) return false;

    this.tasks.assign(bid.taskId, bid.agentId);
    return true;
  }

  autoAssign(taskId: string): boolean {
    const lowest = this.bids.getLowestBid(taskId);
    if (!lowest) return false;
    return this.acceptBid(lowest.id);
  }

  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "assigned") return false;
    return this.tasks.updateStatus(taskId, "in_progress");
  }

  completeTask(taskId: string, output: string, success: boolean = true, rating?: number): TaskResult | undefined {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "in_progress") return undefined;
    if (!task.assignedTo) return undefined;

    this.tasks.updateStatus(taskId, "completed");

    const result: TaskResult = {
      taskId,
      agentId: task.assignedTo,
      success,
      output,
      completedAt: Date.now(),
      rating,
    };
    this.results.push(result);
    return result;
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === "completed" || task.status === "cancelled") return false;
    return this.tasks.updateStatus(taskId, "cancelled");
  }

  getResults(taskId?: string): TaskResult[] {
    if (taskId) return this.results.filter((r) => r.taskId === taskId);
    return [...this.results];
  }

  getAgentResults(agentId: string): TaskResult[] {
    return this.results.filter((r) => r.agentId === agentId);
  }

  getTaskRegistry(): TaskRegistry {
    return this.tasks;
  }

  getBidManager(): BidManager {
    return this.bids;
  }
}
