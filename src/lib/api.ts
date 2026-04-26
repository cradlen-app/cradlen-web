import { useAuthStore } from "@/features/auth/store/authStore";

const BASE_URL = "https://api.cradlen.com/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function apiAuthFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().tokens?.access_token;
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
}
