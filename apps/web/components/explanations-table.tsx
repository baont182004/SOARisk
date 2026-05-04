'use client';

import type { RecommendationExplanation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

export function ExplanationsTable() {
  const [explanations, setExplanations] = useState<RecommendationExplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadExplanations = async () => {
      try {
        const response = await fetchApi<RecommendationExplanation[]>(
          '/explanations?limit=20&page=1',
          {
            cache: 'no-store',
          },
        );

        if (!active) {
          return;
        }

        setExplanations(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load explanations.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadExplanations().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading explanations from the API...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (explanations.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No explanations exist yet. Generate one from a recommendation first.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Explanations</h3>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Live API
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Explanation ID</th>
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Normalized Alert</th>
              <th className="px-3 py-3 font-semibold">Top Playbook</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Created At</th>
            </tr>
          </thead>
          <tbody>
            {explanations.map((explanation) => (
              <tr
                key={explanation.explanationId}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="px-3 py-3 font-mono text-xs">
                  <Link
                    className="text-teal-700 underline"
                    href={`/explanations/${explanation.explanationId}`}
                  >
                    {explanation.explanationId}
                  </Link>
                </td>
                <td className="px-3 py-3">{explanation.recommendationId}</td>
                <td className="px-3 py-3">{explanation.normalizedAlertId}</td>
                <td className="px-3 py-3">{explanation.topPlaybookId}</td>
                <td className="px-3 py-3">{explanation.status}</td>
                <td className="px-3 py-3">
                  {explanation.createdAt
                    ? new Date(explanation.createdAt).toLocaleString()
                    : 'n/a'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
