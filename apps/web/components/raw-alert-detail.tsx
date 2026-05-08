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

        setError(loadError instanceof Error ? loadError.message : 'Không tải được chi tiết cảnh báo.');
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
        <p className="text-sm text-slate-600">Đang tải chi tiết cảnh báo...</p>
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
    return <EmptyState message="Không tìm thấy cảnh báo thô." />;
  }

  return (
    <div className="space-y-6">
      <DetailCard
        title="Chi tiết cảnh báo thô"
        items={[
          { label: 'Alert ID', value: alert.alertId },
          { label: 'Nguồn', value: alert.source },
          { label: 'Tiêu đề', value: alert.title },
          { label: 'Loại alert', value: alert.alertType ?? 'chưa có' },
          { label: 'Mức độ', value: alert.severity ?? 'chưa có' },
          {
            label: 'Độ tin cậy',
            value: alert.confidence !== undefined ? `${alert.confidence}%` : 'chưa có',
          },
          { label: 'IP nguồn', value: alert.sourceIp ?? 'chưa có' },
          { label: 'IP đích', value: alert.targetIp ?? 'chưa có' },
          { label: 'Giao thức', value: alert.protocol ?? 'chưa có' },
          { label: 'Ghi nhận lúc', value: alert.observedAt ?? 'chưa có' },
        ]}
      />
      <NormalizeAlertButton alertId={alert.alertId} />
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Payload thô</h3>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(alert.rawPayload, null, 2)}
        </pre>
      </section>
    </div>
  );
}
