'use client';

import type {
  NormalizeAlertJobStatusSnapshot,
  NormalizeAlertQueuedResponse,
  NormalizedAlert,
} from '@soc-soar/shared';
import { useState } from 'react';

import { fetchApi } from '../lib/api';

type NormalizeAlertButtonProps = {
  alertId: string;
};

type PendingAction = 'sync' | 'queue' | 'status' | null;

export function NormalizeAlertButton({ alertId }: NormalizeAlertButtonProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [normalizedAlertId, setNormalizedAlertId] = useState<string | null>(null);
  const [queuedJob, setQueuedJob] = useState<NormalizeAlertQueuedResponse | null>(null);
  const [jobStatus, setJobStatus] = useState<NormalizeAlertJobStatusSnapshot | null>(null);

  const handleNormalizeNow = async () => {
    setPendingAction('sync');
    setMessage(null);

    try {
      const response = await fetchApi<NormalizedAlert>(`/normalized-alerts/from-raw/${alertId}`, {
        method: 'POST',
      });

      setMessage(response.message);
      setNormalizedAlertId(response.data.normalizedAlertId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể chuẩn hóa cảnh báo.');
      setNormalizedAlertId(null);
    } finally {
      setPendingAction(null);
    }
  };

  const handleQueueNormalization = async () => {
    setPendingAction('queue');
    setMessage(null);

    try {
      const response = await fetchApi<NormalizeAlertQueuedResponse>(
        `/jobs/normalize-alert/${alertId}`,
        {
          method: 'POST',
        },
      );

      setMessage(response.message);
      setQueuedJob(response.data);
      setJobStatus(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể đưa job chuẩn hóa vào queue.');
      setQueuedJob(null);
      setJobStatus(null);
    } finally {
      setPendingAction(null);
    }
  };

  const handleCheckJobStatus = async () => {
    if (!queuedJob) {
      return;
    }

    setPendingAction('status');
    setMessage(null);

    try {
      const response = await fetchApi<NormalizeAlertJobStatusSnapshot>(
        `/jobs/normalize-alert/${queuedJob.jobId}`,
        {
          cache: 'no-store',
        },
      );

      setMessage(response.message);
      setJobStatus(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể kiểm tra trạng thái job.');
      setJobStatus(null);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pendingAction !== null}
          onClick={handleNormalizeNow}
          type="button"
        >
          {pendingAction === 'sync' ? 'Đang chuẩn hóa...' : 'Chuẩn hóa ngay'}
        </button>
        <button
          className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pendingAction !== null}
          onClick={handleQueueNormalization}
          type="button"
        >
          {pendingAction === 'queue' ? 'Đang xếp hàng...' : 'Đưa vào queue'}
        </button>
        {queuedJob ? (
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={handleCheckJobStatus}
            type="button"
          >
            {pendingAction === 'status' ? 'Đang kiểm tra...' : 'Kiểm tra job'}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Dùng <span className="font-semibold">Chuẩn hóa ngay</span> để kiểm thử đồng bộ, hoặc{' '}
        <span className="font-semibold">Đưa vào queue</span> để gửi cảnh báo sang worker BullMQ.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {normalizedAlertId ? (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            Kết quả đồng bộ {normalizedAlertId}
          </span>
        ) : null}
        {queuedJob ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Job {queuedJob.jobId}: {queuedJob.status}
          </span>
        ) : null}
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {jobStatus ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Job ID:</span> {jobStatus.jobId}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Trạng thái:</span> {jobStatus.state}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Queue:</span> {jobStatus.queueName}
          </p>
          {jobStatus.failedReason ? (
            <p className="mt-1 text-rose-700">
              <span className="font-semibold">Lỗi:</span> {jobStatus.failedReason}
            </p>
          ) : null}
          {jobStatus.returnvalue ? (
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(jobStatus.returnvalue, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
