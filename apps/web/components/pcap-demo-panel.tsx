'use client';

import {
  RAW_ALERT_MOCK_SCENARIOS,
  type PcapFile,
  type PcapJob,
  type RawAlert,
} from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

type PcapScenarioResult = {
  scenario: string;
  file: PcapFile;
  job: PcapJob;
  rawAlert: RawAlert;
};

export function PcapDemoPanel() {
  const [jobs, setJobs] = useState<PcapJob[]>([]);
  const [lastResult, setLastResult] = useState<PcapScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    const response = await fetchApi<PcapJob[]>('/pcap-demo/jobs', { cache: 'no-store' });
    setJobs(response.data);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchApi<PcapJob[]>('/pcap-demo/jobs', { cache: 'no-store' });

        if (active) {
          setJobs(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được job PCAP demo.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const generateAlert = async (scenario: string) => {
    setSubmitting(scenario);
    setError(null);

    try {
      const response = await fetchApi<PcapScenarioResult>(
        `/pcap-demo/generate-alert/${scenario}`,
        { method: 'POST' },
      );
      setLastResult(response.data);
      await loadJobs();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Không thể tạo cảnh báo demo.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Tạo cảnh báo demo</h3>
            <p className="mt-2 text-sm text-slate-600">
              Các nút kịch bản tạo cảnh báo thô tổng hợp từ metadata PCAP demo, không phân tích packet thật.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RAW_ALERT_MOCK_SCENARIOS.map((scenario) => (
            <button
              className="rounded-xl border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(submitting)}
              key={scenario}
              onClick={() => generateAlert(scenario)}
              type="button"
            >
              {submitting === scenario ? 'Đang tạo...' : scenario}
            </button>
          ))}
        </div>
      </section>

      {lastResult ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-900">
            Đã tạo cảnh báo thô{' '}
            <Link
              className="underline"
              href={`/alerts/${lastResult.rawAlert.alertId}`}
            >
              {lastResult.rawAlert.alertId}
            </Link>{' '}
            từ kịch bản {lastResult.scenario}.
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-800">{error}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Job PCAP demo</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-600">Đang tải job...</p>
        ) : jobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Chưa có job PCAP demo.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Job ID</th>
                  <th className="px-3 py-3 font-semibold">File ID</th>
                  <th className="px-3 py-3 font-semibold">Trạng thái</th>
                  <th className="px-3 py-3 font-semibold">Thông điệp</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr className="border-b border-[var(--border)] last:border-b-0" key={job.jobId}>
                    <td className="px-3 py-3 font-mono text-xs">{job.jobId}</td>
                    <td className="px-3 py-3 font-mono text-xs">{job.fileId}</td>
                    <td className="px-3 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-3 py-3">{job.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
