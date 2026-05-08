'use client';

import type { RecommendationExplanation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

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

        setError(loadError instanceof Error ? loadError.message : 'Không tải được giải thích.');
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
        <p className="text-sm text-slate-600">Đang tải giải thích từ API...</p>
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
          Chưa có giải thích. Hãy tạo giải thích từ một khuyến nghị.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Giải thích khuyến nghị</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Explanation ID</th>
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Alert chuẩn hóa</th>
              <th className="px-3 py-3 font-semibold">Playbook Top-1</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Tạo lúc</th>
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
                <td className="px-3 py-3"><StatusBadge status={explanation.status} /></td>
                <td className="px-3 py-3">
                  {explanation.createdAt
                    ? new Date(explanation.createdAt).toLocaleString()
                    : 'chưa có'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
