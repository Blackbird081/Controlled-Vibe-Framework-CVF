import type {
  OrganizationRecord,
  TeamRecord,
  TeamRole,
} from 'cvf-guard-contract/enterprise';

// In a real enterprise system, this would be backed by SQLite/PostgreSQL
export interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  role: TeamRole;
  orgId: string;
  teamId: string;
  joinedAt: string;
}

export const MOCK_ORGANIZATIONS: OrganizationRecord[] = [
  { id: 'org_cvf', name: 'CVF Enterprise', slug: 'cvf-enterprise' },
];

export const MOCK_TEAMS: TeamRecord[] = [
  { id: 'team_exec', orgId: 'org_cvf', name: 'Executive Control', slug: 'executive-control' },
  { id: 'team_eng', orgId: 'org_cvf', name: 'Engineering', slug: 'engineering' },
  { id: 'team_sec', orgId: 'org_cvf', name: 'Security Review', slug: 'security-review' },
  { id: 'team_ops', orgId: 'org_cvf', name: 'Operations', slug: 'operations' },
];

export const MOCK_USERS: UserRecord[] = [
  {
    id: 'usr_1',
    username: 'owner',
    name: 'John Owner',
    email: 'owner@cvf.local',
    role: 'owner',
    orgId: 'org_cvf',
    teamId: 'team_exec',
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr_2',
    username: 'admin',
    name: 'Alice Admin',
    email: 'admin@cvf.local',
    role: 'admin',
    orgId: 'org_cvf',
    teamId: 'team_exec',
    joinedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'usr_3',
    username: 'dev',
    name: 'Bob Developer',
    email: 'dev@cvf.local',
    role: 'developer',
    orgId: 'org_cvf',
    teamId: 'team_eng',
    joinedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'usr_4',
    username: 'reviewer',
    name: 'Eve Reviewer',
    email: 'review@cvf.local',
    role: 'reviewer',
    orgId: 'org_cvf',
    teamId: 'team_sec',
    joinedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'usr_5',
    username: 'viewer',
    name: 'Charlie Temp',
    email: 'temp@cvf.local',
    role: 'viewer',
    orgId: 'org_cvf',
    teamId: 'team_ops',
    joinedAt: '2026-03-01T00:00:00Z',
  },
];

export function findMockUserByUsername(username: string): UserRecord | undefined {
  return MOCK_USERS.find(user => user.username === username);
}

export function findMockUserByEmail(email: string): UserRecord | undefined {
  return MOCK_USERS.find(user => user.email === email);
}

export function findMockUserById(id: string): UserRecord | undefined {
  return MOCK_USERS.find(user => user.id === id);
}
