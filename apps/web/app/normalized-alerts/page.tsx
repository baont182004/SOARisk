import { FutureNote } from '../../components/future-note';
import { NormalizedAlertsTable } from '../../components/normalized-alerts-table';
import { PageIntro } from '../../components/page-intro';

export default function NormalizedAlertsPage() {
  return (
    <>
      <PageIntro
        title="Normalized Alerts"
        role="SOAR-Ready Alert Dataset"
        description="This page lists the unified alert records produced by deterministic normalization. These outputs can now generate deterministic playbook recommendations and score breakdowns."
      />
      <NormalizedAlertsTable />
      <FutureNote note="Recommendation scoring is now deterministic in Phase 6A. Workflow execution and analyst approval remain later phases." />
    </>
  );
}
