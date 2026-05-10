import { IncidentsTable } from '../../components/incidents-table';
import { PageIntro } from '../../components/page-intro';

export default function IncidentsPage() {
  return (
    <>
      <PageIntro title="Incident Tracking" role="Case Status" description="Incident records linked to alerts, recommendations and workflow runs." />
      <IncidentsTable />
    </>
  );
}
