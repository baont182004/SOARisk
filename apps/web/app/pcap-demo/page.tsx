import { QUEUE_NAMES } from '@soc-soar/shared';

import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function PcapDemoPage() {
  return (
    <>
      <PageIntro
        title="PCAP Demo"
        role="Demo/Test Input"
        description="This section is limited to controlled demo input for generating sample alerts later. It is not a packet analysis console, and it is not an IDS feature surface."
      />
      <PlaceholderTable
        title="PCAP Demo Jobs"
        columns={['Job ID', 'File ID', 'Status', 'Created At', 'Message']}
      />
      <EmptyState
        message={`No PCAP demo uploads or jobs are shown yet. Future work will connect this page to the ${QUEUE_NAMES.PCAP_DEMO} placeholder queue and upload endpoint.`}
      />
      <FutureNote note="PCAP remains test-only for thesis demonstrations. The core platform value is downstream SOAR automation after alerts already exist." />
    </>
  );
}
