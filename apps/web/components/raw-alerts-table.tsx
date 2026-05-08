'use client';

import type { RawAlert } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

export function RawAlertsTable() {
  const [alerts, setAlerts] = useState<RawAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      try {
        const response = await fetchApi<RawAlert[]>('/alerts?limit=20&page=1', {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setAlerts(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách cảnh báo.');
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
        <p className="text-sm text-slate-600">Đang tải cảnh báo thô từ API...</p>
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
        <p className="text-sm text-slate-600">Chưa có cảnh báo thô. Hãy chạy Demo Wizard hoặc PCAP demo để tạo dữ liệu.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Luồng cảnh báo thô</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Alert ID</th>
              <th className="px-3 py-3 font-semibold">Tiêu đề</th>
              <th className="px-3 py-3 font-semibold">Nguồn</th>
              <th className="px-3 py-3 font-semibold">Loại alert</th>
              <th className="px-3 py-3 font-semibold">Mức độ</th>
              <th className="px-3 py-3 font-semibold">Độ tin cậy</th>
              <th className="px-3 py-3 font-semibold">Tạo lúc</th>
              <th className="px-3 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.alertId} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-3 font-mono text-xs">{alert.alertId}</td>
                <td className="px-3 py-3">{alert.title}</td>
                <td className="px-3 py-3 capitalize">{alert.source.replaceAll('_', ' ')}</td>
                <td className="px-3 py-3">{alert.alertType ?? 'chờ suy luận'}</td>
                <td className="px-3 py-3">{alert.severity ?? 'chưa đặt'}</td>
                <td className="px-3 py-3">
                  {alert.confidence !== undefined ? `${alert.confidence}%` : 'chưa đặt'}
                </td>
                <td className="px-3 py-3">{new Date(alert.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <Link className="text-teal-700 underline" href={`/alerts/${alert.alertId}`}>
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
