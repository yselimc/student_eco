import { apiFetch } from "@/lib/api";

const TOKEN_KEY = "student_eco.token";
const USER_KEY = "student_eco.user";

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  university: string | null;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateMePayload = {
  display_name?: string;
  university?: string | null;
  department?: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  display_name: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

export function logout(): void {
  clearToken();
  clearStoredUser();
}

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!decoded.startsWith("/")) return "/";
  if (decoded.startsWith("//")) return "/";
  if (decoded.startsWith("/\\")) return "/";
  return decoded;
}

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const result = await apiFetch<TokenResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
  setToken(result.access_token);
  setStoredUser(result.user);
  return result;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const result = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
  setToken(result.access_token);
  setStoredUser(result.user);
  return result;
}

export async function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", {
    method: "GET",
    token: getToken(),
  });
}

export async function updateMe(payload: UpdateMePayload): Promise<AuthUser> {
  const updated = await apiFetch<AuthUser>("/auth/me", {
    method: "PATCH",
    body: payload,
    token: getToken(),
  });
  setStoredUser(updated);
  return updated;
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append("file", file);
  const updated = await apiFetch<AuthUser>("/auth/me/avatar", {
    method: "POST",
    body: form,
    token: getToken(),
  });
  setStoredUser(updated);
  return updated;
}

export async function deleteAvatar(): Promise<AuthUser> {
  const updated = await apiFetch<AuthUser>("/auth/me/avatar", {
    method: "DELETE",
    token: getToken(),
  });
  setStoredUser(updated);
  return updated;
}
