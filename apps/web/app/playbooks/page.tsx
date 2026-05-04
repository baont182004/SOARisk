import { SEED_PLAYBOOK_IDS } from '@soc-soar/shared';

import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaybooksTable } from '../../components/playbooks-table';

export default function PlaybooksPage() {
  return (
    <>
      <PageIntro
        title="Playbooks"
        role="Structured Response Dataset"
        description={`This page shows the curated response playbook dataset used for later recommendation, explanation, approval, orchestration, and reporting phases. The current Phase 5 seed contains ${SEED_PLAYBOOK_IDS.length} structured, mock-only playbooks.`}
      />
      <PlaybooksTable />
      <FutureNote note="This phase focuses on structured, machine-readable playbook metadata only. Recommendation scoring and workflow execution remain future phases." />
    </>
  );
}
