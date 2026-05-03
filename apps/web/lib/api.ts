import type { ApiResponse } from '@soc-soar/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function fetchApi<TData>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<TData>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as
    | ApiResponse<TData>
    | { message?: string; error?: string };

  if (!response.ok) {
    const errorMessage =
      'error' in payload
        ? payload.message ?? payload.error ?? 'API request failed.'
        : payload.message ?? 'API request failed.';

    throw new Error(errorMessage);
  }

  return payload as ApiResponse<TData>;
}
