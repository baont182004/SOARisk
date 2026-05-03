import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { RawAlert as SharedRawAlert } from '@soc-soar/shared';

import { AlertsService } from '../alerts/alerts.service';
import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { NormalizeAlertQueryDto } from './dto/normalize-alert-query.dto';
import { QueryNormalizedAlertsDto } from './dto/query-normalized-alerts.dto';
import { NormalizedAlert } from './normalized-alert.schema';
import { NormalizationService } from './normalization.service';

@Injectable()
export class NormalizedAlertsService {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly normalizationService: NormalizationService,
    @InjectModel(NormalizedAlert.name)
    private readonly normalizedAlertModel: Model<NormalizedAlert>,
  ) {}

  async findAll(query: QueryNormalizedAlertsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = {
      ...(query.alertType ? { alertType: query.alertType } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.normalizationStatus
        ? { normalizationStatus: query.normalizationStatus }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.normalizedAlertModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.normalizedAlertModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Normalized alerts retrieved. These are the SOAR-ready inputs for recommendation and analyst workflow.',
      items,
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(normalizedAlertId: string) {
    const item = await this.normalizedAlertModel
      .findOne({ normalizedAlertId })
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Normalized alert '${normalizedAlertId}' was not found.`);
    }

    return createSuccessResponse('Normalized alert retrieved.', item);
  }

  async normalizeFromRaw(alertId: string, query: NormalizeAlertQueryDto) {
    const existing = await this.normalizedAlertModel
      .findOne({ alertId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (existing && !query.force) {
      return createSuccessResponse(
        'Existing normalized alert returned. Pass force=true to create a new normalized record for the same raw alert.',
        existing,
      );
    }

    const rawAlertDocument = await this.alertsService.findRawAlertDocumentByAlertIdOrThrow(alertId);
    const rawAlert = rawAlertDocument.toObject();
    const normalizationResult = this.normalizationService.normalize(
      this.mapRawAlertForNormalization(rawAlert),
    );

    const created = await this.normalizedAlertModel.create({
      normalizedAlertId: generateIdentifier('NAL'),
      ...this.mapNormalizedAlertForPersistence(normalizationResult.normalizedAlert),
    });

    return createSuccessResponse('Raw alert normalized successfully.', created.toObject());
  }

  async createMock() {
    const rawAlertResponse = await this.alertsService.createMockScenario('port-scan');
    return this.normalizeFromRaw(rawAlertResponse.data.alertId, { force: false });
  }

  private mapNormalizedAlertForPersistence(
    normalizedAlert: ReturnType<NormalizationService['normalize']>['normalizedAlert'],
  ) {
    return {
      ...normalizedAlert,
      ...(normalizedAlert.observedAt
        ? { observedAt: new Date(normalizedAlert.observedAt) }
        : {}),
    };
  }

  private mapRawAlertForNormalization(rawAlert: {
    alertId: string;
    source: SharedRawAlert['source'];
    sourceAlertId?: string;
    title: string;
    description?: string;
    alertType?: SharedRawAlert['alertType'];
    severity?: SharedRawAlert['severity'];
    confidence?: number;
    observedAt?: Date;
    sourceIp?: string;
    targetIp?: string;
    sourcePort?: number;
    targetPort?: number;
    protocol?: string;
    dnsQuery?: string;
    httpUri?: string;
    username?: string;
    hostname?: string;
    assetId?: string;
    rawPayload?: Record<string, unknown>;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  }): SharedRawAlert {
    return {
      alertId: rawAlert.alertId,
      source: rawAlert.source,
      title: rawAlert.title,
      tags: rawAlert.tags ?? [],
      createdAt: rawAlert.createdAt.toISOString(),
      updatedAt: rawAlert.updatedAt.toISOString(),
      ...(rawAlert.sourceAlertId ? { sourceAlertId: rawAlert.sourceAlertId } : {}),
      ...(rawAlert.description ? { description: rawAlert.description } : {}),
      ...(rawAlert.alertType ? { alertType: rawAlert.alertType } : {}),
      ...(rawAlert.severity ? { severity: rawAlert.severity } : {}),
      ...(rawAlert.confidence !== undefined ? { confidence: rawAlert.confidence } : {}),
      ...(rawAlert.observedAt ? { observedAt: rawAlert.observedAt.toISOString() } : {}),
      ...(rawAlert.sourceIp ? { sourceIp: rawAlert.sourceIp } : {}),
      ...(rawAlert.targetIp ? { targetIp: rawAlert.targetIp } : {}),
      ...(rawAlert.sourcePort !== undefined ? { sourcePort: rawAlert.sourcePort } : {}),
      ...(rawAlert.targetPort !== undefined ? { targetPort: rawAlert.targetPort } : {}),
      ...(rawAlert.protocol ? { protocol: rawAlert.protocol } : {}),
      ...(rawAlert.dnsQuery ? { dnsQuery: rawAlert.dnsQuery } : {}),
      ...(rawAlert.httpUri ? { httpUri: rawAlert.httpUri } : {}),
      ...(rawAlert.username ? { username: rawAlert.username } : {}),
      ...(rawAlert.hostname ? { hostname: rawAlert.hostname } : {}),
      ...(rawAlert.assetId ? { assetId: rawAlert.assetId } : {}),
      ...(rawAlert.rawPayload ? { rawPayload: rawAlert.rawPayload } : {}),
    };
  }
}
