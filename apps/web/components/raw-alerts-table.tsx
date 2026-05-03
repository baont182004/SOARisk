'use client';

import type { RawAlert } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

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

        setError(loadError instanceof Error ? loadError.message : 'Failed to load alerts.');
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
        <p className="text-sm text-slate-600">Loading raw alerts from the API...</p>
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
        <p className="text-sm text-slate-600">No raw alerts have been ingested yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Raw Alert Feed</h3>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          Live API
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Alert ID</th>
              <th className="px-3 py-3 font-semibold">Title</th>
              <th className="px-3 py-3 font-semibold">Source</th>
              <th className="px-3 py-3 font-semibold">Alert Type</th>
              <th className="px-3 py-3 font-semibold">Severity</th>
              <th className="px-3 py-3 font-semibold">Confidence</th>
              <th className="px-3 py-3 font-semibold">Created At</th>
              <th className="px-3 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.alertId} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-3 font-mono text-xs">{alert.alertId}</td>
                <td className="px-3 py-3">{alert.title}</td>
                <td className="px-3 py-3 capitalize">{alert.source.replaceAll('_', ' ')}</td>
                <td className="px-3 py-3">{alert.alertType ?? 'pending inference'}</td>
                <td className="px-3 py-3">{alert.severity ?? 'not set'}</td>
                <td className="px-3 py-3">
                  {alert.confidence !== undefined ? `${alert.confidence}%` : 'not set'}
                </td>
                <td className="px-3 py-3">{new Date(alert.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">
                  <Link className="text-teal-700 underline" href={`/alerts/${alert.alertId}`}>
                    View detail
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
