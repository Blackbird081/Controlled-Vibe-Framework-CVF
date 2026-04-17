import type { TeamRole } from './enterprise';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
}

export interface TeamRecord {
  id: string;
  orgId: string;
  name: string;
  slug: string;
}

export interface EnterpriseUserProfile {
  userId: string;
  orgId: string;
  teamId: string;
  role: TeamRole;
}
