import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockReport } from '../common/mock-data';
import { Report } from './report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
  ) {}

  async findAll() {
    const items = await this.reportModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Reports retrieved. These summarize SOAR workflow outcomes for analyst review.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async createMock() {
    const created = await this.reportModel.create(createMockReport());

    return createSuccessResponse(
      'Mock report created. Real report generation will be added in a later phase.',
      created.toObject(),
    );
  }
}
