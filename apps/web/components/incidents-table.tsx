'use client';

import type { Incident } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

export function IncidentsTable() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIncidents = async () => {
      try {
        const response = await fetchApi<Incident[]>('/incidents', { cache: 'no-store' });

        if (active) {
          setIncidents(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách incident.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadIncidents().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PanelMessage message="Đang tải incident từ API..." />;
  }

  if (error) {
    return <PanelMessage message={error} tone="error" />;
  }

  if (incidents.length === 0) {
    return <PanelMessage message="Chưa có incident. Hãy chạy Demo Wizard hoặc khởi chạy workflow trước." />;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sổ theo dõi incident</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Incident ID</th>
              <th className="px-3 py-3 font-semibold">Tiêu đề</th>
              <th className="px-3 py-3 font-semibold">Mức độ</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Workflow</th>
              <th className="px-3 py-3 font-semibold">Cập nhật lúc</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr
                className="border-b border-[var(--border)] last:border-b-0"
                key={incident.incidentId}
              >
                <td className="px-3 py-3 font-mono text-xs">
                  <Link className="text-teal-700 underline" href={`/incidents/${incident.incidentId}`}>
                    {incident.incidentId}
                  </Link>
                </td>
                <td className="px-3 py-3">{incident.title}</td>
                <td className="px-3 py-3">{incident.severity}</td>
                <td className="px-3 py-3"><StatusBadge status={incident.status} /></td>
                <td className="px-3 py-3 font-mono text-xs">
                  {incident.executionId ? (
                    <Link className="text-teal-700 underline" href={`/workflows/${incident.executionId}`}>
                      {incident.executionId}
                    </Link>
                  ) : (
                    'chưa có'
                  )}
                </td>
                <td className="px-3 py-3">{new Date(incident.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PanelMessage({ message, tone }: { message: string; tone?: 'error' }) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-[var(--border)] bg-[var(--panel)] text-slate-600'
      }`}
    >
      <p className="text-sm">{message}</p>
    </section>
  );
}
