'use client';

import type { Incident } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { formatStatusVi } from './status-badge';

export function IncidentDetail({ incidentId }: { incidentId: string }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIncident = async () => {
      try {
        const response = await fetchApi<Incident>(`/incidents/${incidentId}`, {
          cache: 'no-store',
        });

        if (active) {
          setIncident(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được chi tiết incident.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadIncident().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [incidentId]);

  if (loading) {
    return <PanelMessage message="Đang tải chi tiết incident..." />;
  }

  if (error) {
    return <PanelMessage message={error} tone="error" />;
  }

  if (!incident) {
    return <EmptyState message="Không tìm thấy incident." />;
  }

  return (
    <div className="space-y-5">
      <DetailCard
        title="Tóm tắt incident"
        items={[
          { label: 'Incident ID', value: incident.incidentId },
          { label: 'Tiêu đề', value: incident.title },
          { label: 'Trạng thái', value: formatStatusVi(incident.status) },
          { label: 'Mức độ', value: incident.severity },
          { label: 'Alert chuẩn hóa', value: incident.normalizedAlertId },
          { label: 'Playbook đã chọn', value: incident.selectedPlaybookId ?? 'chưa có' },
          { label: 'Khuyến nghị', value: incident.recommendationId ?? 'chưa có' },
        ]}
      />

      {incident.executionId ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <Link className="text-sm font-semibold text-teal-700 underline" href={`/workflows/${incident.executionId}`}>
            Xem workflow liên kết {incident.executionId}
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Timeline xử lý</h3>
        <div className="mt-4 space-y-3">
          {incident.timeline.map((entry, index) => (
            <div className="border-l-2 border-teal-700 pl-3" key={`${entry.timestamp}-${index}`}>
              <p className="text-sm font-medium text-slate-900">{entry.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatStatusVi(entry.status)} lúc {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
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
