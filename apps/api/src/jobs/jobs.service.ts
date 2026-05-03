import { Injectable } from '@nestjs/common';
import { QUEUE_NAMES } from '@soc-soar/shared';

import { createSuccessResponse } from '../common/api-response.util';
import { createMockJobCatalog } from '../common/mock-data';

@Injectable()
export class JobsService {
  findAll() {
    return createSuccessResponse('Registered placeholder job queues retrieved.', {
      queues: [
        {
          name: QUEUE_NAMES.PCAP_DEMO,
          purpose: 'Demo PCAP intake for sample alert generation.',
        },
        {
          name: QUEUE_NAMES.ALERT_NORMALIZATION,
          purpose: 'Future normalized alert transformation pipeline.',
        },
        {
          name: QUEUE_NAMES.RECOMMENDATION,
          purpose: 'Future playbook recommendation pipeline.',
        },
        {
          name: QUEUE_NAMES.WORKFLOW_EXECUTION,
          purpose: 'Future workflow orchestration pipeline.',
        },
        {
          name: QUEUE_NAMES.REPORT_GENERATION,
          purpose: 'Future report generation pipeline.',
        },
      ],
      catalog: createMockJobCatalog(),
    });
  }
}
