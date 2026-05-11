import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type EventCategory = "academic" | "social" | "sports" | "culture" | "other";

export type EventRead = {
  id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_avatar_url: string | null;
  title: string;
  description: string | null;
  category: EventCategory;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  attendee_count: number;
  created_at: string;
  updated_at: string;
};

export type EventListResponse = {
  items: EventRead[];
  total: number;
};

export type EventFilters = {
  category?: string;
  from?: string;
  to?: string;
  q?: string;
  mine?: boolean;
  limit?: number;
  offset?: number;
};

export type EventCreateInput = {
  title: string;
  description?: string | null;
  category: EventCategory;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  max_attendees?: number | null;
};

export type Attendee = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  rsvp_at: string;
};

export type AttendeeListResponse = {
  items: Attendee[];
  total: number;
};

export type RsvpRead = {
  event_id: string;
  user_id: string;
  created_at: string;
};

function buildQuery(f: EventFilters): string {
  const params = new URLSearchParams();
  if (f.category) params.set("category", f.category);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.q) params.set("q", f.q);
  if (f.mine) params.set("mine", "1");
  if (f.limit !== undefined) params.set("limit", String(f.limit));
  if (f.offset !== undefined) params.set("offset", String(f.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listEvents(filters: EventFilters = {}): Promise<EventListResponse> {
  return apiFetch<EventListResponse>(`/events${buildQuery(filters)}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function getEvent(id: string): Promise<EventRead> {
  return apiFetch<EventRead>(`/events/${id}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function createEvent(input: EventCreateInput): Promise<EventRead> {
  return apiFetch<EventRead>("/events", {
    method: "POST",
    body: input,
    token: getToken(),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiFetch<null>(`/events/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function rsvpEvent(id: string): Promise<RsvpRead> {
  return apiFetch<RsvpRead>(`/events/${id}/attendees`, {
    method: "POST",
    token: getToken(),
  });
}

export async function cancelRsvp(id: string): Promise<void> {
  await apiFetch<null>(`/events/${id}/attendees/me`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function listAttendees(id: string): Promise<AttendeeListResponse> {
  return apiFetch<AttendeeListResponse>(`/events/${id}/attendees`, {
    method: "GET",
    token: getToken(),
  });
}
