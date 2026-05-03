import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { buildFlexibleIdQuery } from '../common/query.util';
import { PLAYBOOK_SEED_DATA } from './playbook.seed';
import { Playbook } from './playbook.schema';

@Injectable()
export class PlaybooksService {
  constructor(
    @InjectModel(Playbook.name)
    private readonly playbookModel: Model<Playbook>,
  ) {}

  async findAll() {
    const items = await this.playbookModel.find().sort({ playbookId: 1 }).lean().exec();

    return createSuccessResponse(
      'Playbooks retrieved. Seed data remains intentionally compact and mock-only for this foundation phase.',
      items,
      createCollectionMeta(items.length),
    );
  }

  async findOne(id: string) {
    const item = await this.playbookModel
      .findOne(buildFlexibleIdQuery(id, 'playbookId'))
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Playbook '${id}' was not found.`);
    }

    return createSuccessResponse('Playbook retrieved.', item);
  }

  async seed() {
    await Promise.all(
      PLAYBOOK_SEED_DATA.map((playbook) =>
        this.playbookModel
          .findOneAndUpdate(
            { playbookId: playbook.playbookId },
            {
              ...playbook,
              updatedAt: new Date(),
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            },
          )
          .exec(),
      ),
    );

    const items = await this.playbookModel.find().sort({ playbookId: 1 }).lean().exec();

    return createSuccessResponse(
      'Seed playbooks synchronized successfully.',
      items,
      createCollectionMeta(items.length),
    );
  }
}
