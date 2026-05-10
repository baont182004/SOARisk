import { PageIntro } from '../../components/page-intro';
import { RawAlertsTable } from '../../components/raw-alerts-table';

export default function AlertsPage() {
  return (
    <>
      <PageIntro title="Raw Alerts" role="Alert Intake" description="Incoming alerts before SOAR normalization." />
      <RawAlertsTable />
    </>
  );
}
