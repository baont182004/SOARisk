'use client';

import type {
  ApiCollectionMeta,
  Playbook,
  PlaybookDatasetSummary,
  PlaybookValidationResult,
} from '@soc-soar/shared';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge, SeverityBadge } from './status-badge';
import { FilterBar, SelectFilter, TextFilter, alertTypeOptions, severityOptions } from './table-filters';

type PendingAction = 'seed' | 'validate' | null;

export function PlaybooksTable() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [summary, setSummary] = useState<PlaybookDatasetSummary | null>(null);
  const [validationResult, setValidationResult] = useState<PlaybookValidationResult | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [incidentCategory, setIncidentCategory] = useState('');
  const [alertType, setAlertType] = useState('');
  const [severitySupported, setSeveritySupported] = useState('');
  const [automationLevel, setAutomationLevel] = useState('');
  const [approvalRequired, setApprovalRequired] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlaybookData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: String(limit), page: String(page) });
    if (search) params.set('search', search);
    if (incidentCategory) params.set('incidentCategory', incidentCategory);
    if (alertType) params.set('alertType', alertType);
    if (severitySupported) params.set('severitySupported', severitySupported);
    if (automationLevel) params.set('automationLevel', automationLevel);
    if (approvalRequired) params.set('approvalRequired', approvalRequired);
    if (status) params.set('status', status);

    const [playbooksResponse, summaryResponse] = await Promise.all([
      fetchApi<Playbook[], ApiCollectionMeta>(`/playbooks?${params}`, { cache: 'no-store' }),
      fetchApi<PlaybookDatasetSummary>('/playbooks/summary', { cache: 'no-store' }),
    ]);

    setPlaybooks(playbooksResponse.data);
    setTotal(playbooksResponse.meta?.total ?? playbooksResponse.data.length);
    setSummary(summaryResponse.data);
  }, [alertType, approvalRequired, automationLevel, incidentCategory, limit, page, search, severitySupported, status]);

  useEffect(() => {
    let active = true;

    loadPlaybookData()
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được playbook.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadPlaybookData]);

  const handleSeedPlaybooks = async () => {
    setPendingAction('seed');
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<{ createdCount: number; updatedCount: number; total: number }>('/playbooks/seed', {
        method: 'POST',
      });

      setMessage(`Seed synchronized. Created ${response.data.createdCount}, updated ${response.data.updatedCount}, total ${response.data.total}.`);
      setPage(1);
      await loadPlaybookData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Không thể seed playbook.');
    } finally {
      setPendingAction(null);
      setLoading(false);
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
      setError(actionError instanceof Error ? actionError.message : 'Không thể kiểm tra dataset playbook.');
      setValidationResult(null);
    } finally {
      setPendingAction(null);
    }
  };

  const columns = useMemo<Array<DataTableColumn<Playbook>>>(
    () => [
      {
        key: 'playbookId',
        header: 'Playbook ID',
        render: (playbook) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/playbooks/${playbook.playbookId}`}>
            {playbook.playbookId}
          </Link>
        ),
      },
      { key: 'name', header: 'Name', className: 'min-w-64', render: (playbook) => playbook.name },
      { key: 'incidentCategory', header: 'Incident group', render: (playbook) => playbook.incidentCategory },
      { key: 'supportedAlertTypes', header: 'Alert types', className: 'min-w-56', render: (playbook) => playbook.supportedAlertTypes.join(', ') },
      { key: 'severityRange', header: 'Severity', render: (playbook) => <div className="flex flex-wrap gap-1">{playbook.severityRange.map((severity) => <SeverityBadge key={severity} severity={severity} />)}</div> },
      { key: 'automationLevel', header: 'Automation', render: (playbook) => playbook.automationLevel },
      { key: 'approvalRequired', header: 'Approval', render: (playbook) => <StatusBadge status={playbook.approvalRequired ? 'pending' : 'not_required'} /> },
      { key: 'status', header: 'Status', render: (playbook) => <StatusBadge status={playbook.status} /> },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={handleSeedPlaybooks}
            type="button"
          >
            {pendingAction === 'seed' ? 'Syncing...' : 'Sync seed'}
          </button>
          <button
            className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={handleValidateDataset}
            type="button"
          >
            {pendingAction === 'validate' ? 'Validating...' : 'Validate'}
          </button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
          {error ? <span className="text-sm text-rose-700">{error}</span> : null}
        </div>
      </section>

      {summary ? (
        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Total" value={String(summary.totalPlaybooks)} />
          <SummaryCard label="Active" value={String(summary.activePlaybooks)} />
          <SummaryCard label="Approval required" value={String(summary.approvalRequiredCount)} />
          <SummaryCard label="Sensitive actions" value={String(summary.sensitiveActionCount)} />
        </section>
      ) : null}

      {validationResult ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold">Dataset validation</h3>
            <StatusBadge status={validationResult.valid ? 'valid' : 'invalid'} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Errors: {validationResult.errors.length}. Warnings: {validationResult.warnings.length}.
          </p>
        </section>
      ) : null}

      <DataTable
        actions={<StatusBadge status={`${total} total`} />}
        columns={columns}
        data={playbooks}
        emptyMessage="No playbooks match the current filters."
        error={error && playbooks.length === 0 ? error : null}
        filters={
          <FilterBar>
            <TextFilter label="Search" onChange={(value) => { setPage(1); setSearch(value); }} placeholder="PB-001, name, group..." value={search} />
            <SelectFilter label="Incident group" onChange={(value) => { setPage(1); setIncidentCategory(value); }} options={incidentCategoryOptions(summary)} value={incidentCategory} />
            <SelectFilter label="Alert type" onChange={(value) => { setPage(1); setAlertType(value); }} options={alertTypeOptions} value={alertType} />
            <SelectFilter label="Severity supported" onChange={(value) => { setPage(1); setSeveritySupported(value); }} options={severityOptions} value={severitySupported} />
            <SelectFilter label="Automation mode" onChange={(value) => { setPage(1); setAutomationLevel(value); }} options={[{ value: 'manual', label: 'manual' }, { value: 'semi_automated', label: 'semi_automated' }, { value: 'automated', label: 'automated' }]} value={automationLevel} />
            <SelectFilter label="Approval required" onChange={(value) => { setPage(1); setApprovalRequired(value); }} options={[{ value: 'true', label: 'required' }, { value: 'false', label: 'not required' }]} value={approvalRequired} />
            <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'active', label: 'active' }, { value: 'draft', label: 'draft' }, { value: 'deprecated', label: 'deprecated' }]} value={status} />
          </FilterBar>
        }
        getRowKey={(playbook) => playbook.playbookId}
        limit={limit}
        loading={loading}
        onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
        onPageChange={setPage}
        page={page}
        title="Playbook Library"
        total={total}
      />
    </div>
  );
}

function incidentCategoryOptions(summary: PlaybookDatasetSummary | null) {
  return Object.keys(summary?.byIncidentCategory ?? {}).map((value) => ({ value, label: value }));
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
