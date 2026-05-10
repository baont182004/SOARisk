import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ExplanationStatus,
  buildRecommendationExplanation,
  type RecommendationExplanation as SharedRecommendationExplanation,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { GenerateExplanationQueryDto } from './dto/generate-explanation-query.dto';
import { QueryExplanationsDto } from './dto/query-explanations.dto';
import {
  RecommendationExplanation,
} from './explanation.schema';

type PersistedRecommendationExplanation = Omit<
  SharedRecommendationExplanation,
  'createdAt' | 'updatedAt'
> & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ExplanationsService {
  constructor(
    @InjectModel(RecommendationExplanation.name)
    private readonly explanationModel: Model<RecommendationExplanation>,
    private readonly recommendationsService: RecommendationsService,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly playbooksService: PlaybooksService,
  ) {}

  async generateFromRecommendation(
    recommendationId: string,
    query: GenerateExplanationQueryDto,
  ) {
    const force = query.force === true;
    const existing = await this.explanationModel
      .findOne({ recommendationId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (existing && !force) {
      return createSuccessResponse(
        'Existing explanation returned. Pass force=true to regenerate the explanation snapshot.',
        this.mapExplanationForResponse(existing as PersistedRecommendationExplanation),
      );
    }

    const recommendation =
      await this.recommendationsService.findRecommendationDataByIdOrThrow(recommendationId);
    const normalizedAlert =
      await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(
        recommendation.normalizedAlertId,
      );
    const candidatePlaybooks = await this.playbooksService.findPlaybooksDataByIds(
      recommendation.topPlaybooks.map((playbook) => playbook.playbookId),
    );
    const selectedPlaybook = recommendation.selectedPlaybookId
      ? candidatePlaybooks.find(
          (playbook) => playbook.playbookId === recommendation.selectedPlaybookId,
        )
      : undefined;
    const explanationDraft = buildRecommendationExplanation({
      recommendation,
      normalizedAlert,
      ...(selectedPlaybook ? { selectedPlaybook } : {}),
      candidatePlaybooks,
    });

    await this.explanationModel
      .updateMany(
        { recommendationId, status: ExplanationStatus.GENERATED },
        { $set: { status: ExplanationStatus.STALE } },
      )
      .exec();

    const created = await this.explanationModel.create({
      explanationId: generateIdentifier('EXP'),
      ...explanationDraft,
    });

    return createSuccessResponse(
      'Recommendation explanation generated successfully.',
      this.mapExplanationForResponse(
        created.toObject() as PersistedRecommendationExplanation,
      ),
    );
  }

  async findAll(query: QueryExplanationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter = {
      ...(query.recommendationId ? { recommendationId: query.recommendationId } : {}),
      ...(query.normalizedAlertId ? { normalizedAlertId: query.normalizedAlertId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.explanationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.explanationModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Recommendation explanations retrieved.',
      items.map((item) =>
        this.mapExplanationForResponse(item as PersistedRecommendationExplanation),
      ),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(explanationId: string) {
    const item = await this.explanationModel.findOne({ explanationId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Explanation '${explanationId}' was not found.`);
    }

    return createSuccessResponse(
      'Recommendation explanation retrieved.',
      this.mapExplanationForResponse(item as PersistedRecommendationExplanation),
    );
  }

  async findByRecommendation(recommendationId: string) {
    const item = await this.explanationModel
      .findOne({ recommendationId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(
        `No explanation exists yet for recommendation '${recommendationId}'.`,
      );
    }

    return createSuccessResponse(
      'Recommendation explanation retrieved by recommendation identifier.',
      this.mapExplanationForResponse(item as PersistedRecommendationExplanation),
    );
  }

  private mapExplanationForResponse(
    explanation: PersistedRecommendationExplanation,
  ): SharedRecommendationExplanation {
    const { createdAt, updatedAt, ...rest } = explanation;

    return {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }
}
