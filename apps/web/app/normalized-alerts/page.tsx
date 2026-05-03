import { FutureNote } from '../../components/future-note';
import { NormalizedAlertsTable } from '../../components/normalized-alerts-table';
import { PageIntro } from '../../components/page-intro';

export default function NormalizedAlertsPage() {
  return (
    <>
      <PageIntro
        title="Normalized Alerts"
        role="SOAR-Ready Alert Dataset"
        description="This page lists the unified alert records produced by deterministic normalization. These outputs are intended to feed later playbook recommendation and explanation phases."
      />
      <NormalizedAlertsTable />
      <FutureNote note="Normalization is deterministic and explainable in Phase 2A. Recommendation scoring and workflow execution remain future phases." />
    </>
  );
}
