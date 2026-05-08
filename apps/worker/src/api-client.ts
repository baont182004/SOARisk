import { workerConfig } from './config';

export async function postApi<TData>(path: string) {
  const response = await fetch(`${workerConfig.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = (await response.json()) as { data?: TData; message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `API request failed for ${path}.`);
  }

  return payload;
}
