import { Injectable } from '@nestjs/common';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockExplanation } from '../common/mock-data';

@Injectable()
export class ExplanationsService {
  findAll() {
    const items = [createMockExplanation()];

    return createSuccessResponse(
      'Recommendation explanations retrieved. The explanation engine remains placeholder-only in this phase.',
      items,
      createCollectionMeta(items.length),
    );
  }
}
