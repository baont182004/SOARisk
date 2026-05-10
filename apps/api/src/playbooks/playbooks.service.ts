import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Playbook as SharedPlaybook } from '@soc-soar/shared';
import type { Model } from 'mongoose';

import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { getPlaybookSeedIds, loadPlaybookSeedData } from './playbook.seed';
import { QueryPlaybooksDto } from './dto/query-playbooks.dto';
import { Playbook } from './playbook.schema';
import { PlaybookValidationService } from './playbook-validation.service';

type PersistedPlaybook = Omit<SharedPlaybook, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class PlaybooksService {
  constructor(
    @InjectModel(Playbook.name)
    private readonly playbookModel: Model<Playbook>,
    private readonly playbookValidationService: PlaybookValidationService,
  ) {}

  async findAll(query: QueryPlaybooksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter = {
      ...(query.incidentCategory ? { incidentCategory: query.incidentCategory } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.automationLevel ? { automationLevel: query.automationLevel } : {}),
      ...(query.alertType ? { supportedAlertTypes: query.alertType } : {}),
      ...(query.severitySupported ? { severityRange: query.severitySupported } : {}),
      ...(query.approvalRequired !== undefined
        ? { approvalRequired: query.approvalRequired }
        : {}),
      ...(query.search
        ? {
            $or: [
              { playbookId: { $regex: query.search, $options: 'i' } },
              { name: { $regex: query.search, $options: 'i' } },
              { incidentCategory: { $regex: query.search, $options: 'i' } },
              { supportedAlertTypes: { $regex: query.search, $options: 'i' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.playbookModel
        .find(filter)
        .sort({ playbookId: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.playbookModel.countDocuments(filter).exec(),
    ]);

    return createSuccessResponse(
      'Playbooks retrieved.',
      items.map((item) => this.mapPlaybookForResponse(item as PersistedPlaybook)),
      createPaginationMeta({
        count: items.length,
        page,
        limit,
        total,
      }),
    );
  }

  async findOne(playbookId: string) {
    const item = await this.findPlaybookDataByIdOrThrow(playbookId);

    return createSuccessResponse(
      'Playbook retrieved.',
      item,
    );
  }

  async seed() {
    const result = await this.upsertSeedPlaybooks();

    return createSuccessResponse('Seed playbooks synchronized successfully.', result);
  }

  async resetSeed() {
    const seedIds = getPlaybookSeedIds();
    const deleted = await this.playbookModel
      .deleteMany({ playbookId: { $in: seedIds } })
      .exec();
    const result = await this.upsertSeedPlaybooks();

    return createSuccessResponse('Seed playbooks reset successfully.', {
      deletedCount: deleted.deletedCount ?? 0,
      ...result,
    });
  }

  async validate() {
    const playbooks = await this.loadSharedPlaybooks();
    const result = this.playbookValidationService.validateDataset(playbooks);

    return createSuccessResponse('Playbook dataset validation completed.', result);
  }

  async summary() {
    const playbooks = await this.loadSharedPlaybooks();
    const result = this.playbookValidationService.summarizeDataset(playbooks);

    return createSuccessResponse('Playbook dataset summary retrieved.', result);
  }

  async findActivePlaybooksData() {
    const items = await this.loadSharedPlaybooks();

    return items.filter((playbook) => playbook.status === 'active');
  }

  async findPlaybooksDataByIds(playbookIds: string[]) {
    if (playbookIds.length === 0) {
      return [];
    }

    const items = await this.playbookModel
      .find({ playbookId: { $in: [...new Set(playbookIds)] } })
      .sort({ playbookId: 1 })
      .lean()
      .exec();

    return items.map((item) => this.mapPlaybookForResponse(item as PersistedPlaybook));
  }

  async findPlaybookDataByIdOrThrow(playbookId: string) {
    const item = await this.playbookModel.findOne({ playbookId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Playbook '${playbookId}' was not found.`);
    }

    return this.mapPlaybookForResponse(item as PersistedPlaybook);
  }

  private async upsertSeedPlaybooks() {
    const seedData = loadPlaybookSeedData();
    const existing = await this.playbookModel
      .find({ playbookId: { $in: seedData.map((playbook) => playbook.playbookId) } })
      .select({ playbookId: 1, _id: 0 })
      .lean()
      .exec();
    const existingIds = new Set(existing.map((item) => item.playbookId));

    await Promise.all(
      seedData.map((playbook) =>
        this.playbookModel
          .findOneAndUpdate(
            { playbookId: playbook.playbookId },
            {
              $set: {
                ...playbook,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
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

    const createdCount = seedData.filter(
      (playbook) => !existingIds.has(playbook.playbookId),
    ).length;
    const updatedCount = seedData.length - createdCount;

    return {
      createdCount,
      updatedCount,
      total: seedData.length,
    };
  }

  private async loadSharedPlaybooks() {
    const items = await this.playbookModel.find().sort({ playbookId: 1 }).lean().exec();

    return items.map((item) => this.mapPlaybookForResponse(item as PersistedPlaybook));
  }

  private mapPlaybookForResponse(playbook: PersistedPlaybook): SharedPlaybook {
    const { createdAt, updatedAt, ...rest } = playbook;

    return {
      ...rest,
      ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
      ...(updatedAt ? { updatedAt: updatedAt.toISOString() } : {}),
    };
  }
}
