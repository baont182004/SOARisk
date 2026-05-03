'use client';

import type { NormalizedAlert } from '@soc-soar/shared';
import { useState } from 'react';

import { fetchApi } from '../lib/api';

type NormalizeAlertButtonProps = {
  alertId: string;
};

export function NormalizeAlertButton({ alertId }: NormalizeAlertButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [normalizedAlertId, setNormalizedAlertId] = useState<string | null>(null);

  const handleNormalize = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetchApi<NormalizedAlert>(`/normalized-alerts/from-raw/${alertId}`, {
        method: 'POST',
      });

      setMessage(response.message);
      setNormalizedAlertId(response.data.normalizedAlertId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to normalize alert.');
      setNormalizedAlertId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={handleNormalize}
          type="button"
        >
          {loading ? 'Normalizing...' : 'Normalize Alert'}
        </button>
        {normalizedAlertId ? (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            Created {normalizedAlertId}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        This action runs deterministic normalization only. Recommendation and workflow execution are
        still future phases.
      </p>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
