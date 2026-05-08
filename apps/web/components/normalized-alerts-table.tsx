'use client';

import type { NormalizedAlert } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { GenerateRecommendationButton } from './generate-recommendation-button';
import { StatusBadge } from './status-badge';

export function NormalizedAlertsTable() {
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      try {
        const response = await fetchApi<NormalizedAlert[]>(
          '/normalized-alerts?limit=20&page=1',
          {
            cache: 'no-store',
          },
        );

        if (!active) {
          return;
        }

        setAlerts(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : 'Không tải được cảnh báo chuẩn hóa.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAlerts().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải cảnh báo chuẩn hóa từ API...</p>
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

  if (alerts.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Chưa có cảnh báo chuẩn hóa. Hãy chuẩn hóa một cảnh báo thô trước.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cảnh báo chuẩn hóa</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">ID chuẩn hóa</th>
              <th className="px-3 py-3 font-semibold">Raw Alert ID</th>
              <th className="px-3 py-3 font-semibold">Loại alert</th>
              <th className="px-3 py-3 font-semibold">Mức độ</th>
              <th className="px-3 py-3 font-semibold">Độ tin cậy</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Tạo lúc</th>
              <th className="px-3 py-3 font-semibold">Khuyến nghị</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr
                key={alert.normalizedAlertId}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="px-3 py-3 font-mono text-xs">{alert.normalizedAlertId}</td>
                <td className="px-3 py-3">
                  <Link className="text-teal-700 underline" href={`/alerts/${alert.alertId}`}>
                    {alert.alertId}
                  </Link>
                </td>
                <td className="px-3 py-3">{alert.alertType}</td>
                <td className="px-3 py-3">{alert.severity}</td>
                <td className="px-3 py-3">{alert.confidence}%</td>
                <td className="px-3 py-3"><StatusBadge status={alert.normalizationStatus} /></td>
                <td className="px-3 py-3">{new Date(alert.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <GenerateRecommendationButton normalizedAlertId={alert.normalizedAlertId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
