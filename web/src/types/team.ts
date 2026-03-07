export interface Team {
  id: number;
  name: string;
  slug: string;
  personal: boolean;
  owner_id: number;
  member_count: number;
  role: "owner" | "admin" | "member";
  created_at: string;
  updated_at: string;
}

export interface MemberUser {
  id: number;
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface Membership {
  id: number;
  user_id: number;
  role: "owner" | "admin" | "member";
  user: MemberUser;
  created_at: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  token: string;
  inviter: { id: number; name: string | null; email: string };
  expires_at: string;
  created_at: string;
}
