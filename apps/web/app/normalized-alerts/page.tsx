import { NormalizedAlertsTable } from '../../components/normalized-alerts-table';
import { PageIntro } from '../../components/page-intro';

export default function NormalizedAlertsPage() {
  return (
    <>
      <PageIntro title="Normalization" role="SOAR-ready Alert Data" description="Canonical alert records used for recommendation and workflow execution." />
      <NormalizedAlertsTable />
    </>
  );
}
