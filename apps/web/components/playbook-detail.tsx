'use client';

import type { Playbook } from '@soc-soar/shared';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';

type PlaybookDetailProps = {
  playbookId: string;
};

export function PlaybookDetail({ playbookId }: PlaybookDetailProps) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPlaybook = async () => {
      try {
        const response = await fetchApi<Playbook>(`/playbooks/${playbookId}`, {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setPlaybook(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load playbook.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPlaybook().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [playbookId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading playbook detail...</p>
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

  if (!playbook) {
    return <EmptyState message="Playbook not found." />;
  }

  const sensitiveActions = playbook.actions.filter((action) => action.risk === 'sensitive');
  const mockOnlyActions = playbook.actions.filter((action) => action.mockOnly).length;

  return (
    <div className="space-y-6">
      <DetailCard
        title="Playbook Metadata"
        items={[
          { label: 'Playbook ID', value: playbook.playbookId },
          { label: 'Name', value: playbook.name },
          { label: 'Incident Category', value: playbook.incidentCategory },
          { label: 'Automation Level', value: playbook.automationLevel },
          { label: 'Approval Required', value: playbook.approvalRequired ? 'yes' : 'no' },
          { label: 'Approval Policy', value: playbook.approvalPolicy },
          { label: 'Status', value: playbook.status },
          { label: 'Version', value: playbook.version },
        ]}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Coverage and Matching</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FieldPanel label="Supported Alert Types" values={playbook.supportedAlertTypes} />
          <FieldPanel label="Severity Range" values={playbook.severityRange} />
          <FieldPanel label="Required Fields" values={playbook.requiredFields} />
          <FieldPanel label="Optional Fields" values={playbook.optionalFields} />
          <FieldPanel label="Asset Context" values={playbook.assetContext} />
          <FieldPanel label="Tags" values={playbook.tags} />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Conditions</h3>
        <div className="mt-4 space-y-4">
          {playbook.conditions.map((condition, index) => (
            <div key={`${condition.field}-${index}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <p className="text-sm font-semibold text-slate-800">
                {condition.field} {condition.operator}
                {condition.value !== undefined ? ` ${Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value)}` : ''}
              </p>
              <p className="mt-2 text-sm text-slate-700">{condition.description}</p>
              {condition.weightHint !== undefined ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Weight Hint {condition.weightHint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Ordered Actions</h3>
        <div className="mt-4 space-y-4">
          {playbook.actions.map((action) => (
            <div key={`${action.step}-${action.action}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Step {action.step}
                </span>
                <span className="font-semibold text-slate-800">{action.action}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {action.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {action.risk}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{action.description}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FieldPanel label="Required Fields" values={action.requiredFields} compact />
                <FieldPanel label="Produces" values={action.produces} compact />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Approval {action.approvalRequired ? 'required' : 'not required'} | Mock only{' '}
                {action.mockOnly ? 'yes' : 'no'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">References</h3>
        <div className="mt-4 space-y-4">
          {playbook.references.map((reference) => (
            <div key={`${reference.name}-${reference.type}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <p className="text-sm font-semibold text-slate-800">{reference.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {reference.type}
              </p>
              <p className="mt-2 text-sm text-slate-700">{reference.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-amber-900">Safety Notes</h3>
        <div className="mt-3 space-y-2 text-sm text-amber-800">
          <p>Approval policy: {playbook.approvalPolicy}</p>
          <p>Sensitive actions: {sensitiveActions.length}</p>
          <p>Mock-only actions: {mockOnlyActions} of {playbook.actions.length}</p>
          <p>Containment-like actions remain request or recommendation steps only. No real blocking, isolation, deletion, quarantine, or account disablement is executed in this phase.</p>
        </div>
      </section>
    </div>
  );
}

function FieldPanel({
  label,
  values,
  compact = false,
}: {
  label: string;
  values: string[];
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-[var(--panel-muted)] ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">
        {values.length > 0 ? values.join(', ') : 'none'}
      </p>
    </div>
  );
}
