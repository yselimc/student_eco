export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors: FieldErrors;

  constructor(status: number, code: string, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

function buildHeaders(headers: HeadersInit | undefined, token: string | null | undefined, isFormData: boolean, hasJsonBody: boolean): Headers {
  const finalHeaders = new Headers(headers);
  if (hasJsonBody && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  return finalHeaders;
}

function parseFieldErrors(payload: Record<string, unknown>): FieldErrors {
  const errors = payload.errors;
  if (!Array.isArray(errors)) return {};
  const result: FieldErrors = {};
  for (const item of errors) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.field !== "string" || typeof obj.message !== "string") continue;
    // First occurrence wins so a form's primary error per field stays stable.
    if (!(obj.field in result)) {
      result[obj.field] = obj.message;
    }
  }
  return result;
}

async function throwFromResponse(response: Response, payload: unknown): Promise<never> {
  const fallbackMessage = response.statusText || "İstek başarısız";
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const detail = typeof obj.detail === "string" ? obj.detail : fallbackMessage;
    const code = typeof obj.code === "string" ? obj.code : "ERROR";
    const fieldErrors = response.status === 422 ? parseFieldErrors(obj) : {};
    throw new ApiError(response.status, code, detail, fieldErrors);
  }
  throw new ApiError(response.status, "ERROR", fallbackMessage);
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const isFormData = body instanceof FormData;
  const finalHeaders = buildHeaders(headers, token, isFormData, body !== undefined);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    await throwFromResponse(response, payload);
  }

  return payload as T;
}

export async function apiFetchBlob(path: string, token: string | null | undefined): Promise<Blob> {
  const finalHeaders = buildHeaders(undefined, token, false, false);
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: finalHeaders });
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    await throwFromResponse(response, payload);
  }
  return response.blob();
}
