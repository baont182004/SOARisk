'use client';

import type { RawAlert } from '@soc-soar/shared';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { NormalizeAlertButton } from './normalize-alert-button';

type RawAlertDetailProps = {
  alertId: string;
};

export function RawAlertDetail({ alertId }: RawAlertDetailProps) {
  const [alert, setAlert] = useState<RawAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAlert = async () => {
      try {
        const response = await fetchApi<RawAlert>(`/alerts/${alertId}`, {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setAlert(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load raw alert.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAlert().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [alertId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading raw alert detail...</p>
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

  if (!alert) {
    return <EmptyState message="Raw alert not found." />;
  }

  return (
    <div className="space-y-6">
      <DetailCard
        title="Raw Alert Detail"
        items={[
          { label: 'Alert ID', value: alert.alertId },
          { label: 'Source', value: alert.source },
          { label: 'Title', value: alert.title },
          { label: 'Alert Type', value: alert.alertType ?? 'not provided' },
          { label: 'Severity', value: alert.severity ?? 'not provided' },
          {
            label: 'Confidence',
            value: alert.confidence !== undefined ? `${alert.confidence}%` : 'not provided',
          },
          { label: 'Source IP', value: alert.sourceIp ?? 'not provided' },
          { label: 'Target IP', value: alert.targetIp ?? 'not provided' },
          { label: 'Protocol', value: alert.protocol ?? 'not provided' },
          { label: 'Observed At', value: alert.observedAt ?? 'not provided' },
        ]}
      />
      <NormalizeAlertButton alertId={alert.alertId} />
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Raw Payload</h3>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(alert.rawPayload, null, 2)}
        </pre>
      </section>
    </div>
  );
}
