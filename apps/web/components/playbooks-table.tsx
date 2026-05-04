'use client';

import type {
  Playbook,
  PlaybookDatasetSummary,
  PlaybookValidationResult,
} from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

type PendingAction = 'seed' | 'validate' | null;

export function PlaybooksTable() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [summary, setSummary] = useState<PlaybookDatasetSummary | null>(null);
  const [validationResult, setValidationResult] = useState<PlaybookValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [playbooksResponse, summaryResponse] = await Promise.all([
          fetchApi<Playbook[]>('/playbooks?limit=20&page=1', {
            cache: 'no-store',
          }),
          fetchApi<PlaybookDatasetSummary>('/playbooks/summary', {
            cache: 'no-store',
          }),
        ]);

        if (!active) {
          return;
        }

        setPlaybooks(playbooksResponse.data);
        setSummary(summaryResponse.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load playbooks.');
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

  const refreshPlaybookData = async () => {
    const [playbooksResponse, summaryResponse] = await Promise.all([
      fetchApi<Playbook[]>('/playbooks?limit=20&page=1', {
        cache: 'no-store',
      }),
      fetchApi<PlaybookDatasetSummary>('/playbooks/summary', {
        cache: 'no-store',
      }),
    ]);

    setPlaybooks(playbooksResponse.data);
    setSummary(summaryResponse.data);
  };

  const handleSeedPlaybooks = async () => {
    setPendingAction('seed');
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<{ createdCount: number; updatedCount: number; total: number }>(
        '/playbooks/seed',
        {
          method: 'POST',
        },
      );

      setMessage(
        `${response.message} Created ${response.data.createdCount}, updated ${response.data.updatedCount}, total ${response.data.total}.`,
      );
      await refreshPlaybookData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to seed playbooks.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleValidateDataset = async () => {
    setPendingAction('validate');
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<PlaybookValidationResult>('/playbooks/validate', {
        cache: 'no-store',
      });

      setValidationResult(response.data);
      setMessage(response.message);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'Failed to validate playbook dataset.',
      );
      setValidationResult(null);
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading playbook dataset from the API...</p>
      </section>
    );
  }

  if (error && playbooks.length === 0) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={handleSeedPlaybooks}
            type="button"
          >
            {pendingAction === 'seed' ? 'Seeding...' : 'Seed Playbooks'}
          </button>
          <button
            className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={handleValidateDataset}
            type="button"
          >
            {pendingAction === 'validate' ? 'Validating...' : 'Validate Dataset'}
          </button>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            Live API
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          This dataset defines mock-only response templates that later phases can use for
          recommendation, explanation, approval, orchestration, and reporting.
        </p>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      {summary ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Dataset Summary</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total Playbooks" value={String(summary.totalPlaybooks)} />
            <SummaryCard label="Active Playbooks" value={String(summary.activePlaybooks)} />
            <SummaryCard
              label="Approval Required"
              value={String(summary.approvalRequiredCount)}
            />
            <SummaryCard
              label="Sensitive Actions"
              value={String(summary.sensitiveActionCount)}
            />
          </div>
        </section>
      ) : null}

      {validationResult ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Validation Result</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                validationResult.valid
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}
            >
              {validationResult.valid ? 'valid' : 'invalid'}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ValidationList title="Errors" items={validationResult.errors} />
            <ValidationList title="Warnings" items={validationResult.warnings} />
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--panel-muted)] p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Missing core alert types:</span>{' '}
              {validationResult.summary.missingCoreAlertTypes.length > 0
                ? validationResult.summary.missingCoreAlertTypes.join(', ')
                : 'none'}
            </p>
          </div>
        </section>
      ) : null}

      {playbooks.length === 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            No playbooks are stored yet. Seed the dataset to load PB-001 through PB-010.
          </p>
        </section>
      ) : (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Playbook Catalog</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {playbooks.length} loaded
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Playbook ID</th>
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Incident Category</th>
                  <th className="px-3 py-3 font-semibold">Supported Alert Types</th>
                  <th className="px-3 py-3 font-semibold">Severity Range</th>
                  <th className="px-3 py-3 font-semibold">Automation</th>
                  <th className="px-3 py-3 font-semibold">Approval</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {playbooks.map((playbook) => (
                  <tr
                    key={playbook.playbookId}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="px-3 py-3 font-mono text-xs">
                      <Link className="text-teal-700 underline" href={`/playbooks/${playbook.playbookId}`}>
                        {playbook.playbookId}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{playbook.name}</td>
                    <td className="px-3 py-3">{playbook.incidentCategory}</td>
                    <td className="px-3 py-3">{playbook.supportedAlertTypes.join(', ')}</td>
                    <td className="px-3 py-3">{playbook.severityRange.join(', ')}</td>
                    <td className="px-3 py-3">{playbook.automationLevel}</td>
                    <td className="px-3 py-3">{playbook.approvalRequired ? 'yes' : 'no'}</td>
                    <td className="px-3 py-3">{playbook.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--panel-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ValidationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-[var(--panel-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-700">None.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
