import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type StudyStyle = "quiet" | "group" | "cafe";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ContactInfo = {
  instagram: string | null;
  discord: string | null;
  telefon: string | null;
};

export type BuddyProfileRead = {
  id: string;
  user_id: string;
  display_name: string;
  looking_for: string;
  courses: string[];
  available_days: Weekday[];
  study_style: StudyStyle;
  contact_info: ContactInfo;
  created_at: string;
  updated_at: string;
};

export type BuddyListResponse = {
  items: BuddyProfileRead[];
  total: number;
};

export type BuddyFilters = {
  course?: string;
  day?: Weekday;
  study_style?: StudyStyle;
  limit?: number;
  offset?: number;
};

export type ContactInfoInput = {
  instagram?: string | null;
  discord?: string | null;
  telefon?: string | null;
};

export type BuddyProfileInput = {
  looking_for: string;
  courses: string[];
  available_days: Weekday[];
  study_style: StudyStyle;
  contact_info: ContactInfoInput;
};

function buildQuery(f: BuddyFilters): string {
  const params = new URLSearchParams();
  if (f.course) params.set("course", f.course);
  if (f.day) params.set("day", f.day);
  if (f.study_style) params.set("study_style", f.study_style);
  if (f.limit !== undefined) params.set("limit", String(f.limit));
  if (f.offset !== undefined) params.set("offset", String(f.offset));
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function listBuddies(
  filters: BuddyFilters = {},
): Promise<BuddyListResponse> {
  return apiFetch<BuddyListResponse>(`/buddies${buildQuery(filters)}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function getMyBuddyProfile(): Promise<BuddyProfileRead> {
  return apiFetch<BuddyProfileRead>("/buddies/me", {
    method: "GET",
    token: getToken(),
  });
}

export async function upsertMyBuddyProfile(
  input: BuddyProfileInput,
): Promise<BuddyProfileRead> {
  return apiFetch<BuddyProfileRead>("/buddies/me", {
    method: "PUT",
    body: input,
    token: getToken(),
  });
}

export async function deleteMyBuddyProfile(): Promise<void> {
  await apiFetch<null>("/buddies/me", {
    method: "DELETE",
    token: getToken(),
  });
}

export async function getBuddyProfile(
  userId: string,
): Promise<BuddyProfileRead> {
  return apiFetch<BuddyProfileRead>(`/buddies/${userId}`, {
    method: "GET",
    token: getToken(),
  });
}
