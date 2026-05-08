'use client';

import type { Recommendation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

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
          loadError instanceof Error ? loadError.message : 'Không tải được danh sách khuyến nghị.',
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
        <p className="text-sm text-slate-600">Đang tải khuyến nghị từ API...</p>
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
          Chưa có khuyến nghị. Hãy tạo khuyến nghị từ một cảnh báo chuẩn hóa.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Khuyến nghị playbook</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Alert chuẩn hóa</th>
              <th className="px-3 py-3 font-semibold">Loại alert</th>
              <th className="px-3 py-3 font-semibold">Mức độ</th>
              <th className="px-3 py-3 font-semibold">Playbook Top-1</th>
              <th className="px-3 py-3 font-semibold">Điểm</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Tạo lúc</th>
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
                  <td className="px-3 py-3">{topPlaybook?.playbookId ?? 'chưa có'}</td>
                  <td className="px-3 py-3">
                    {topPlaybook ? `${topPlaybook.finalScore ?? topPlaybook.totalScore}` : 'chưa có'}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={recommendation.status} /></td>
                  <td className="px-3 py-3">
                    {recommendation.createdAt
                      ? new Date(recommendation.createdAt).toLocaleString()
                      : 'chưa có'}
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
