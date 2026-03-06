import { api } from "./api";

export interface TeamMember {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  role: string;
  joined_at: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  invited_by: { id: number; name: string };
  expires_at: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  personal: boolean;
  owner: { id: number; name: string; email: string };
  members_count: number;
  created_at: string;
  current_user_role: string;
  members?: TeamMember[];
  invitations?: TeamInvitation[];
}

export const teamsApi = {
  list: () => api.get<Team[]>("/api/teams"),

  get: (id: number) => api.get<Team>(`/api/teams/${id}`),

  create: (name: string) => api.post<Team>("/api/teams", { team: { name } }),

  update: (id: number, name: string) =>
    api.put<Team>(`/api/teams/${id}`, { team: { name } }),

  delete: (id: number) => api.delete(`/api/teams/${id}`),

  // Members
  listMembers: (teamId: number) =>
    api.get<TeamMember[]>(`/api/teams/${teamId}/memberships`),

  updateMemberRole: (teamId: number, membershipId: number, role: string) =>
    api.put<TeamMember>(`/api/teams/${teamId}/memberships/${membershipId}`, { role }),

  removeMember: (teamId: number, membershipId: number) =>
    api.delete(`/api/teams/${teamId}/memberships/${membershipId}`),

  // Invitations
  listInvitations: (teamId: number) =>
    api.get<TeamInvitation[]>(`/api/teams/${teamId}/invitations`),

  invite: (teamId: number, email: string, role: string = "member") =>
    api.post<TeamInvitation>(`/api/teams/${teamId}/invitations`, { email, role }),

  cancelInvitation: (teamId: number, invitationId: number) =>
    api.delete(`/api/teams/${teamId}/invitations/${invitationId}`),

  acceptInvitation: (token: string) =>
    api.post<{ message: string; team: { id: number; slug: string } }>(
      `/api/invitations/${token}/accept`
    ),
};
