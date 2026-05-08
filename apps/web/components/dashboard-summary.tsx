'use client';

import type { DashboardSummary } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { formatStatusVi } from './status-badge';

const metricLinks: Record<keyof DashboardSummary['counts'], string> = {
  rawAlerts: '/alerts',
  normalizedAlerts: '/normalized-alerts',
  playbooks: '/playbooks',
  recommendations: '/recommendations',
  pendingApprovals: '/approvals',
  workflows: '/workflows',
  incidents: '/incidents',
  reports: '/reports',
};

const metricLabels: Record<keyof DashboardSummary['counts'], string> = {
  rawAlerts: 'Cảnh báo thô',
  normalizedAlerts: 'Cảnh báo chuẩn hóa',
  playbooks: 'Playbook',
  recommendations: 'Khuyến nghị',
  pendingApprovals: 'Chờ phê duyệt',
  workflows: 'Workflow',
  incidents: 'Incident',
  reports: 'Báo cáo',
};

export function DashboardSummaryPanel() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        const response = await fetchApi<DashboardSummary>('/dashboard/summary', {
          cache: 'no-store',
        });

        if (active) {
          setSummary(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được dashboard.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PanelMessage message="Đang tải tổng quan SOAR..." />;
  }

  if (error) {
    return <PanelMessage message={error} tone="error" />;
  }

  if (!summary) {
    return <PanelMessage message="Chưa có dữ liệu tổng quan dashboard." />;
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(summary.counts).map(([key, value]) => (
          <Link
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm"
            href={metricLinks[key as keyof DashboardSummary['counts']]}
            key={key}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">
              {metricLabels[key as keyof DashboardSummary['counts']]}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusPanel title="Trạng thái workflow" values={summary.workflowStatus} />
        <StatusPanel title="Trạng thái incident" values={summary.incidentStatus} />
      </div>
    </section>
  );
}

function StatusPanel({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Chưa có bản ghi.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map(([status, count]) => (
            <div className="flex items-center justify-between text-sm" key={status}>
              <span className="text-slate-600">{formatStatusVi(status)}</span>
              <span className="font-semibold text-slate-950">{count}</span>
            </div>
          ))}
        </div>
      )}
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
