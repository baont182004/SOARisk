import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockRawAlert } from '../common/mock-data';
import { RawAlert } from './raw-alert.schema';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(RawAlert.name)
    private readonly rawAlertModel: Model<RawAlert>,
  ) {}

  async findAll() {
    const items = await this.rawAlertModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Raw alerts retrieved. These represent upstream detector output before SOAR normalization.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async createMock() {
    const created = await this.rawAlertModel.create(createMockRawAlert());

    return createSuccessResponse(
      'Mock raw alert created. Real alert ingestion will be implemented in later phases.',
      created.toObject(),
    );
  }
}
