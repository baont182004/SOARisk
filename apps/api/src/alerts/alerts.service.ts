import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { generateIdentifier } from '../common/query.util';
import { CreateRawAlertDto } from './dto/create-raw-alert.dto';
import { QueryRawAlertsDto } from './dto/query-raw-alerts.dto';
import {
  RAW_ALERT_MOCK_PAYLOADS,
  type RawAlertMockScenario,
} from './raw-alert-mock.factory';
import { RawAlert } from './raw-alert.schema';

type CreateRawAlertInput = CreateRawAlertDto & { alertId?: string };

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(RawAlert.name)
    private readonly rawAlertModel: Model<RawAlert>,
  ) {}

  async create(dto: CreateRawAlertDto) {
    const created = await this.createRawAlertDocument(dto);

    return createSuccessResponse(
      'Raw alert created successfully.',
      created.toObject(),
    );
  }

  async findAll(query: QueryRawAlertsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = {
      ...(query.source ? { source: query.source } : {}),
      ...(query.alertType ? { alertType: query.alertType } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
    };

    const [items, total] = await Promise.all([
      this.rawAlertModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.rawAlertModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Raw alerts retrieved. These represent upstream detector output before SOAR normalization.',
      items,
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(alertId: string) {
    const item = await this.rawAlertModel.findOne({ alertId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Raw alert '${alertId}' was not found.`);
    }

    return createSuccessResponse('Raw alert retrieved.', item);
  }

  async createMockScenario(scenario: RawAlertMockScenario) {
    const payload = RAW_ALERT_MOCK_PAYLOADS[scenario];

    if (!payload) {
      throw new BadRequestException(
        `Unsupported mock scenario '${scenario}'. Supported scenarios: ${Object.keys(
          RAW_ALERT_MOCK_PAYLOADS,
        ).join(', ')}`,
      );
    }

    const created = await this.createRawAlertDocument(payload);

    return createSuccessResponse(
      `Mock raw alert created for scenario '${scenario}'.`,
      created.toObject(),
    );
  }

  async createMock() {
    return this.createMockScenario('port-scan');
  }

  async createRawAlertDocument(input: CreateRawAlertInput) {
    const payload = {
      alertId: input.alertId ?? generateIdentifier('ALERT'),
      source: input.source,
      title: input.title,
      rawPayload: input.rawPayload ?? {},
      tags: input.tags ?? [],
      ...(input.sourceAlertId ? { sourceAlertId: input.sourceAlertId } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.alertType ? { alertType: input.alertType } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
      ...(input.observedAt ? { observedAt: new Date(input.observedAt) } : {}),
      ...(input.sourceIp ? { sourceIp: input.sourceIp } : {}),
      ...(input.targetIp ? { targetIp: input.targetIp } : {}),
      ...(input.sourcePort !== undefined ? { sourcePort: input.sourcePort } : {}),
      ...(input.targetPort !== undefined ? { targetPort: input.targetPort } : {}),
      ...(input.protocol ? { protocol: input.protocol } : {}),
      ...(input.dnsQuery ? { dnsQuery: input.dnsQuery } : {}),
      ...(input.httpUri ? { httpUri: input.httpUri } : {}),
      ...(input.username ? { username: input.username } : {}),
      ...(input.hostname ? { hostname: input.hostname } : {}),
      ...(input.assetId ? { assetId: input.assetId } : {}),
    };

    return this.rawAlertModel.create(payload);
  }

  async findRawAlertDocumentByAlertIdOrThrow(alertId: string) {
    const rawAlert = await this.rawAlertModel.findOne({ alertId }).exec();

    if (!rawAlert) {
      throw new NotFoundException(`Raw alert '${alertId}' was not found.`);
    }

    return rawAlert;
  }
}
