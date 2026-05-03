import { SEED_PLAYBOOK_IDS } from '@soc-soar/shared';

import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function PlaybooksPage() {
  return (
    <>
      <PageIntro
        title="Playbooks"
        role="Structured Response Dataset"
        description={`This page will host the curated playbook dataset used for recommendation and analyst-guided orchestration. The foundation currently defines ${SEED_PLAYBOOK_IDS.length} seed playbooks, all intentionally compact and mock-only.`}
      />
      <PlaceholderTable
        title="Playbook Catalog"
        columns={['Playbook ID', 'Name', 'Category', 'Automation Level', 'Approval Required']}
      />
      <EmptyState message="Seeded playbooks exist at the API layer, but frontend fetching and editing workflows have not been implemented yet." />
      <FutureNote note="Later phases can add playbook authoring, versioning, matching metadata, and step-by-step execution previews." />
    </>
  );
}
