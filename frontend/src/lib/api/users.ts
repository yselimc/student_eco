import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type PublicProfile = {
  id: string;
  display_name: string;
  university: string | null;
  department: string | null;
  created_at: string;
  notes_count: number;
  listings_count: number;
  events_organized_count: number;
  buddy_profile_id: string | null;
};

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  return apiFetch<PublicProfile>(`/users/${userId}/profile`, {
    method: "GET",
    token: getToken(),
  });
}
