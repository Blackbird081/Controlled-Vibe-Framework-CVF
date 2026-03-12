import type { TeamRole } from 'cvf-guard-contract/enterprise';

// In a real enterprise system, this would be backed by SQLite/PostgreSQL
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
}

export const MOCK_USERS: UserRecord[] = [
  { id: 'usr_1', name: 'John Owner', email: 'owner@cvf.local', role: 'owner', joinedAt: '2026-01-01T00:00:00Z' },
  { id: 'usr_2', name: 'Alice Admin', email: 'admin@cvf.local', role: 'admin', joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'usr_3', name: 'Bob Developer', email: 'dev@cvf.local', role: 'developer', joinedAt: '2026-02-01T00:00:00Z' },
  { id: 'usr_4', name: 'Eve Reviewer', email: 'review@cvf.local', role: 'reviewer', joinedAt: '2026-02-15T00:00:00Z' },
  { id: 'usr_5', name: 'Charlie Temp', email: 'temp@cvf.local', role: 'viewer', joinedAt: '2026-03-01T00:00:00Z' },
];
