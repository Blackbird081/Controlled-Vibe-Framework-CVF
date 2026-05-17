export type TaskStatus = "open" | "bidding" | "assigned" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Task {
  id: string;
  title: string;
  description: string;
  domain: string;
  priority: TaskPriority;
  status: TaskStatus;
  requiredCapabilities: string[];
  createdBy: string;
  assignedTo?: string;
  createdAt: number;
  deadline?: number;
  reward: number;
  metadata: Record<string, unknown>;
}

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  amount: number;
  status: BidStatus;
  message: string;
  submittedAt: number;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  success: boolean;
  output: string;
  completedAt: number;
  rating?: number;
}
