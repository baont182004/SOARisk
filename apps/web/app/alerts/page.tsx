import { AlertType } from '@soc-soar/shared';

import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { RawAlertsTable } from '../../components/raw-alerts-table';

export default function AlertsPage() {
  return (
    <>
      <PageIntro
        title="Alerts"
        role="Alert Intake"
        description={`This area will display upstream security alerts before and after normalization. The initial focus is alert-driven SOAR processing, not SIEM correlation. Example supported type: ${AlertType.PORT_SCAN}.`}
      />
      <RawAlertsTable />
      <FutureNote note="Later work should distinguish raw upstream alerts from normalized SOAR-ready alert records and support analyst drill-down." />
    </>
  );
}
