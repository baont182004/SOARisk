import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  RecommendationStatus,
  scorePlaybooksForNormalizedAlert,
  type Recommendation as SharedRecommendation,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { NormalizedAlertsService } from '../normalized-alerts/normalized-alerts.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { GenerateRecommendationQueryDto } from './dto/generate-recommendation-query.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { Recommendation } from './recommendation.schema';

type PersistedRecommendation = Omit<SharedRecommendation, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<Recommendation>,
    private readonly normalizedAlertsService: NormalizedAlertsService,
    private readonly playbooksService: PlaybooksService,
  ) {}

  async generateFromNormalized(
    normalizedAlertId: string,
    query: GenerateRecommendationQueryDto,
  ) {
    const force = query.force === true;
    const topK = query.topK ?? 3;
    const existing = await this.recommendationModel
      .findOne({ normalizedAlertId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (existing && !force) {
      return createSuccessResponse(
        'Existing recommendation returned. Pass force=true to generate a new comparison result.',
        this.mapRecommendationForResponse(existing as PersistedRecommendation),
      );
    }

    const normalizedAlert =
      await this.normalizedAlertsService.findNormalizedAlertDataByIdOrThrow(normalizedAlertId);
    const activePlaybooks = await this.playbooksService.findActivePlaybooksData();

    if (activePlaybooks.length === 0) {
      throw new NotFoundException('No active playbooks are available for recommendation scoring.');
    }

    const scored = scorePlaybooksForNormalizedAlert(normalizedAlert, activePlaybooks, { topK });

    const created = await this.recommendationModel.create({
      recommendationId: generateIdentifier('REC'),
      normalizedAlertId: normalizedAlert.normalizedAlertId,
      alertId: normalizedAlert.alertId,
      alertType: normalizedAlert.alertType,
      severity: normalizedAlert.severity,
      status: RecommendationStatus.GENERATED,
      topPlaybooks: scored.topPlaybooks,
      evaluatedPlaybookCount: scored.evaluatedPlaybookCount,
    });

    return createSuccessResponse(
      'Recommendation generated from normalized alert successfully.',
      this.mapRecommendationForResponse(created.toObject() as PersistedRecommendation),
    );
  }

  async findAll(query: QueryRecommendationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = {
      ...(query.normalizedAlertId ? { normalizedAlertId: query.normalizedAlertId } : {}),
      ...(query.alertType ? { alertType: query.alertType } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.recommendationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.recommendationModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Recommendations retrieved. These are deterministic playbook rankings derived from normalized alerts and structured playbook metadata.',
      items.map((item) => this.mapRecommendationForResponse(item as PersistedRecommendation)),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(recommendationId: string) {
    const item = await this.recommendationModel.findOne({ recommendationId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Recommendation '${recommendationId}' was not found.`);
    }

    return createSuccessResponse(
      'Recommendation retrieved.',
      this.mapRecommendationForResponse(item as PersistedRecommendation),
    );
  }

  async selectPlaybook(recommendationId: string, playbookId: string) {
    const recommendation = await this.recommendationModel.findOne({ recommendationId }).exec();

    if (!recommendation) {
      throw new NotFoundException(`Recommendation '${recommendationId}' was not found.`);
    }

    const matchedPlaybook = recommendation.topPlaybooks.find(
      (playbook) => playbook.playbookId === playbookId,
    );

    if (!matchedPlaybook) {
      throw new BadRequestException(
        `Playbook '${playbookId}' is not present in recommendation '${recommendationId}'.`,
      );
    }

    recommendation.selectedPlaybookId = playbookId;
    recommendation.status = RecommendationStatus.SELECTED;
    await recommendation.save();

    return createSuccessResponse(
      'Playbook selected for recommendation. No workflow execution was started.',
      this.mapRecommendationForResponse(recommendation.toObject() as PersistedRecommendation),
    );
  }

  private mapRecommendationForResponse(
    recommendation: PersistedRecommendation,
  ): SharedRecommendation {
    const { createdAt, updatedAt, ...rest } = recommendation;

    return {
      ...rest,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  }
}
