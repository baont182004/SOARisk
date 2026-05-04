'use client';

import type { RecommendationExplanation } from '@soc-soar/shared';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';

type ExplanationDetailProps = {
  explanationId: string;
};

export function ExplanationDetail({ explanationId }: ExplanationDetailProps) {
  const [explanation, setExplanation] = useState<RecommendationExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadExplanation = async () => {
      try {
        const response = await fetchApi<RecommendationExplanation>(
          `/explanations/${explanationId}`,
          {
            cache: 'no-store',
          },
        );

        if (!active) {
          return;
        }

        setExplanation(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load explanation.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadExplanation().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [explanationId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading explanation detail...</p>
      </section>
    );
  }

  if (error && !explanation) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (!explanation) {
    return <EmptyState message="Explanation not found." />;
  }

  return (
    <div className="space-y-6">
      <DetailCard
        title="Explanation Summary"
        items={[
          { label: 'Explanation ID', value: explanation.explanationId },
          { label: 'Recommendation ID', value: explanation.recommendationId },
          { label: 'Normalized Alert ID', value: explanation.normalizedAlertId },
          { label: 'Raw Alert ID', value: explanation.alertId },
          { label: 'Top Playbook', value: explanation.topPlaybookId },
          { label: 'Status', value: explanation.status },
          {
            label: 'Selected Playbook',
            value: explanation.selectedPlaybookId ?? 'not selected',
          },
        ]}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Summary</h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">{explanation.summary}</p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Explanation Sections</h3>
        <div className="mt-4 space-y-4">
          {explanation.sections.map((section) => (
            <div key={`${section.type}-${section.title}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  {section.type}
                </span>
                {section.severity ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {section.severity}
                  </span>
                ) : null}
              </div>
              <h4 className="mt-3 text-base font-semibold text-slate-900">{section.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.content}</p>
              {section.evidenceRefs && section.evidenceRefs.length > 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  Evidence refs: {section.evidenceRefs.join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Per-Playbook Explanations</h3>
        <div className="mt-4 space-y-4">
          {explanation.playbookExplanations.map((playbook) => (
            <div key={playbook.playbookId} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Rank {playbook.rank}
                </span>
                <span className="font-semibold text-slate-900">{playbook.playbookId}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {playbook.decision}
                </span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  Score {playbook.totalScore}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{playbook.summary}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <StringList title="Score Explanation" items={playbook.scoreExplanation} />
                <StringList title="Matched Reasons" items={playbook.matchedReasons} />
                <StringList
                  title="Missing Fields"
                  items={playbook.missingFields}
                  emptyText="No missing required fields."
                />
                <StringList title="Approval Notes" items={playbook.approvalNotes} />
                <StringList title="Limitations" items={playbook.limitations} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <StringPanel title="Limitations" items={explanation.limitations} />
        <StringPanel title="Analyst Guidance" items={explanation.analystGuidance} />
      </div>
    </div>
  );
}

function StringPanel({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function StringList({
  title,
  items,
  emptyText = 'None.',
}: {
  title: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-700">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
