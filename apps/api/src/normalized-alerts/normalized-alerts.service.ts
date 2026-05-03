import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { buildFlexibleIdQuery } from '../common/query.util';
import { NormalizedAlert } from './normalized-alert.schema';

@Injectable()
export class NormalizedAlertsService {
  constructor(
    @InjectModel(NormalizedAlert.name)
    private readonly normalizedAlertModel: Model<NormalizedAlert>,
  ) {}

  async findAll() {
    const items = await this.normalizedAlertModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Normalized alerts retrieved. These are the SOAR-ready inputs for recommendation and analyst workflow.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async findOne(id: string) {
    const item = await this.normalizedAlertModel
      .findOne(buildFlexibleIdQuery(id, 'alertId'))
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Normalized alert '${id}' was not found.`);
    }

    return createSuccessResponse('Normalized alert retrieved.', item);
  }
}
