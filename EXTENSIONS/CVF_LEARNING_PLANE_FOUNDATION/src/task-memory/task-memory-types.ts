export interface TaskMemoryEntry {
  taskId: string;
  createdAt: number;
  expiresAt: number;
  payload: Record<string, unknown>;
}

export interface TaskMemoryStore {
  set(entry: TaskMemoryEntry): void;
  get(taskId: string): TaskMemoryEntry | undefined;
  delete(taskId: string): void;
  list(): TaskMemoryEntry[];
  clear(): void;
}

export type TaskMemoryInspectionState = "present" | "expired" | "missing";

export interface TaskMemoryInspection {
  state: TaskMemoryInspectionState;
  reason: string;
  entry?: TaskMemoryEntry;
}
