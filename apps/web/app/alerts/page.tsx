import { AlertType } from '@soc-soar/shared';

import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function AlertsPage() {
  return (
    <>
      <PageIntro
        title="Alerts"
        role="Alert Intake"
        description={`This area will display upstream security alerts before and after normalization. The initial focus is alert-driven SOAR processing, not SIEM correlation. Example supported type: ${AlertType.PORT_SCAN}.`}
      />
      <PlaceholderTable
        title="Alert Stream"
        columns={['Alert ID', 'Source', 'Type', 'Severity', 'Created At']}
      />
      <EmptyState message="No alert rows are loaded yet. Future phases will fetch raw and normalized alert records from the backend API." />
      <FutureNote note="Later work should distinguish raw upstream alerts from normalized SOAR-ready alert records and support analyst drill-down." />
    </>
  );
}
