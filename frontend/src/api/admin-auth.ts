export interface AdminUser {
  email: string;
  id: number;
}

export interface AdminAuthResult {
  admin: AdminUser;
}

interface AdminAuthResponse {
  data: AdminAuthResult;
}

interface ErrorResponse {
  error: {
    code: string;
    details: string[];
    message: string;
  };
}

export class AdminLoginError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdminLoginError";
  }
}

export async function loginAdmin(
  input: { email: string; password: string },
  signal?: AbortSignal,
): Promise<AdminAuthResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    credentials: "include",
    signal,
  });

  return parseAdminAuthResponse(response);
}

export async function readAdminSession(
  signal?: AbortSignal,
): Promise<AdminAuthResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/session`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    method: "GET",
    signal,
  });

  return parseAdminAuthResponse(response);
}

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

async function parseAdminAuthResponse(
  response: Response,
): Promise<AdminAuthResult> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    if (isErrorResponse(payload) && payload.error.code === "AUTHENTICATION_FAILED") {
      throw new AdminLoginError("Невірна електронна пошта або пароль.");
    }

    throw new AdminLoginError("Не вдалося увійти. Спробуйте ще раз.");
  }

  if (!isAdminAuthResponse(payload)) {
    throw new AdminLoginError("Не вдалося прочитати відповідь сервера.");
  }

  return payload.data;
}

function isAdminAuthResponse(value: unknown): value is AdminAuthResponse {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return false;
  }

  const { data } = value;

  if (!data || typeof data !== "object" || !("admin" in data)) {
    return false;
  }

  const { admin } = data;

  return (
    !!admin &&
    typeof admin === "object" &&
    "id" in admin &&
    typeof admin.id === "number" &&
    "email" in admin &&
    typeof admin.email === "string"
  );
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }

  const { error } = value;

  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string" &&
    "details" in error &&
    Array.isArray(error.details)
  );
}
