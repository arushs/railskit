import { api } from "./api";
import type { Team, Membership, TeamInvitation } from "@/types/team";

export const teamsApi = {
  // Teams
  list: () => api.get<Team[]>("/api/teams"),

  get: (id: number | string) => api.get<Team>(`/api/teams/${id}`),

  create: (name: string) =>
    api.post<{ id: number; name: string; slug: string }>("/api/teams", {
      name,
    }),

  update: (id: number | string, name: string) =>
    api.patch<{ id: number; name: string; slug: string }>(
      `/api/teams/${id}`,
      { name }
    ),

  delete: (id: number | string) => api.delete<void>(`/api/teams/${id}`),

  // Memberships
  memberships: (teamId: number | string) =>
    api.get<Membership[]>(`/api/teams/${teamId}/memberships`),

  updateMembership: (
    teamId: number | string,
    membershipId: number,
    role: string
  ) =>
    api.patch<{ id: number; role: string }>(
      `/api/teams/${teamId}/memberships/${membershipId}`,
      { role }
    ),

  removeMember: (teamId: number | string, membershipId: number) =>
    api.delete<void>(`/api/teams/${teamId}/memberships/${membershipId}`),

  // Invitations
  invitations: (teamId: number | string) =>
    api.get<TeamInvitation[]>(`/api/teams/${teamId}/invitations`),

  invite: (teamId: number | string, email: string, role: string = "member") =>
    api.post<TeamInvitation>(`/api/teams/${teamId}/invitations`, {
      email,
      role,
    }),

  cancelInvitation: (teamId: number | string, invitationId: number) =>
    api.delete<void>(`/api/teams/${teamId}/invitations/${invitationId}`),

  acceptInvitation: (token: string) =>
    api.post<{ team: { id: number; name: string; slug: string }; message: string }>(
      `/api/invitations/${token}/accept`
    ),
};
