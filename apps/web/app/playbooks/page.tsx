import { SEED_PLAYBOOK_IDS } from '@soc-soar/shared';

import { PageIntro } from '../../components/page-intro';
import { PlaybooksTable } from '../../components/playbooks-table';

export default function PlaybooksPage() {
  return (
    <>
      <PageIntro title="Playbook Library" role="Response Catalog" description={`Structured response playbooks. Seed catalog: ${SEED_PLAYBOOK_IDS.length} playbooks.`} />
      <PlaybooksTable />
    </>
  );
}
