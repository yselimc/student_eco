import { apiFetch } from "@/lib/api";

const TOKEN_KEY = "student_eco.token";
const USER_KEY = "student_eco.user";

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
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
