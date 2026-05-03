import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockIncident } from '../common/mock-data';
import { buildFlexibleIdQuery } from '../common/query.util';
import { Incident } from './incident.schema';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<Incident>,
  ) {}

  async findAll() {
    const items = await this.incidentModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Incidents retrieved. These records track analyst-driven SOAR response activity.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async findOne(id: string) {
    const item = await this.incidentModel
      .findOne(buildFlexibleIdQuery(id, 'incidentId'))
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Incident '${id}' was not found.`);
    }

    return createSuccessResponse('Incident retrieved.', item);
  }

  async createMock() {
    const created = await this.incidentModel.create(createMockIncident());

    return createSuccessResponse(
      'Mock incident created for analyst workflow testing.',
      created.toObject(),
    );
  }
}
