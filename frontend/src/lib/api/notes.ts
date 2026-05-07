import { API_BASE_URL, apiFetch, apiFetchBlob } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type Note = {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  description: string | null;
  course_code: string;
  semester: string;
  file_size_bytes: number;
  created_at: string;
};

export type NoteListResponse = {
  items: Note[];
  total: number;
};

export type NoteFilters = {
  course_code?: string;
  semester?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(filters: NoteFilters): string {
  const params = new URLSearchParams();
  if (filters.course_code) params.set("course_code", filters.course_code);
  if (filters.semester) params.set("semester", filters.semester);
  if (filters.q) params.set("q", filters.q);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listNotes(filters: NoteFilters = {}): Promise<NoteListResponse> {
  return apiFetch<NoteListResponse>(`/notes${buildQuery(filters)}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function getNote(id: string): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`, {
    method: "GET",
    token: getToken(),
  });
}

export async function uploadNote(form: FormData): Promise<Note> {
  return apiFetch<Note>("/notes", {
    method: "POST",
    body: form,
    token: getToken(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await apiFetch<null>(`/notes/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function downloadNote(note: Note): Promise<void> {
  const blob = await apiFetchBlob(`/notes/${note.id}/download`, getToken());
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = note.title.replace(/[\\/:*?"<>|]/g, "").trim() || "note";
    a.download = `${safeTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export const noteDownloadUrl = (id: string) => `${API_BASE_URL}/notes/${id}/download`;
