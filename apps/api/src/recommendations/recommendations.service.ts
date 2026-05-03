import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockRecommendation } from '../common/mock-data';
import { Recommendation } from './recommendation.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<Recommendation>,
  ) {}

  async findAll() {
    const items = await this.recommendationModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Recommendations retrieved. Ranking and explanation logic remains placeholder-only in this phase.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async createMock() {
    const created = await this.recommendationModel.create(createMockRecommendation());

    return createSuccessResponse(
      'Mock recommendation created for pipeline testing.',
      created.toObject(),
    );
  }
}
