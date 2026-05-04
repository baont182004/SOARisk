'use client';

import type { Recommendation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

export function RecommendationsTable() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      try {
        const response = await fetchApi<Recommendation[]>('/recommendations?limit=20&page=1', {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setRecommendations(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load recommendations.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRecommendations().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading recommendations from the API...</p>
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

  if (recommendations.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No recommendations exist yet. Generate one from a normalized alert first.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recommendations</h3>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          Live API
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Normalized Alert</th>
              <th className="px-3 py-3 font-semibold">Alert Type</th>
              <th className="px-3 py-3 font-semibold">Severity</th>
              <th className="px-3 py-3 font-semibold">Top Playbook</th>
              <th className="px-3 py-3 font-semibold">Top Score</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Created At</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((recommendation) => {
              const topPlaybook = recommendation.topPlaybooks[0];

              return (
                <tr
                  key={recommendation.recommendationId}
                  className="border-b border-[var(--border)] last:border-b-0"
                >
                  <td className="px-3 py-3 font-mono text-xs">
                    <Link
                      className="text-teal-700 underline"
                      href={`/recommendations/${recommendation.recommendationId}`}
                    >
                      {recommendation.recommendationId}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{recommendation.normalizedAlertId}</td>
                  <td className="px-3 py-3">{recommendation.alertType}</td>
                  <td className="px-3 py-3">{recommendation.severity}</td>
                  <td className="px-3 py-3">{topPlaybook?.playbookId ?? 'none'}</td>
                  <td className="px-3 py-3">
                    {topPlaybook ? `${topPlaybook.totalScore}` : 'n/a'}
                  </td>
                  <td className="px-3 py-3">{recommendation.status}</td>
                  <td className="px-3 py-3">
                    {recommendation.createdAt
                      ? new Date(recommendation.createdAt).toLocaleString()
                      : 'n/a'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
