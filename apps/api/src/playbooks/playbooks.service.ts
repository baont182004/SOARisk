import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SEED_PLAYBOOK_IDS,
  type Playbook as SharedPlaybook,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import {
  createPaginationMeta,
  createSuccessResponse,
} from '../common/api-response.util';
import { PLAYBOOK_SEED_DATA } from './playbook.seed';
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
    const limit = query.limit ?? 20;
    const filter = {
      ...(query.incidentCategory ? { incidentCategory: query.incidentCategory } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.automationLevel ? { automationLevel: query.automationLevel } : {}),
      ...(query.alertType ? { supportedAlertTypes: query.alertType } : {}),
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
      'Playbooks retrieved. These are structured, mock-only response templates for later recommendation and orchestration phases.',
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
    const item = await this.playbookModel.findOne({ playbookId }).lean().exec();

    if (!item) {
      throw new NotFoundException(`Playbook '${playbookId}' was not found.`);
    }

    return createSuccessResponse(
      'Playbook retrieved.',
      this.mapPlaybookForResponse(item as PersistedPlaybook),
    );
  }

  async seed() {
    const result = await this.upsertSeedPlaybooks();

    return createSuccessResponse('Seed playbooks synchronized successfully.', result);
  }

  async resetSeed() {
    const deleted = await this.playbookModel
      .deleteMany({ playbookId: { $in: [...SEED_PLAYBOOK_IDS] } })
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

  private async upsertSeedPlaybooks() {
    const existing = await this.playbookModel
      .find({ playbookId: { $in: PLAYBOOK_SEED_DATA.map((playbook) => playbook.playbookId) } })
      .select({ playbookId: 1, _id: 0 })
      .lean()
      .exec();
    const existingIds = new Set(existing.map((item) => item.playbookId));

    await Promise.all(
      PLAYBOOK_SEED_DATA.map((playbook) =>
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

    const createdCount = PLAYBOOK_SEED_DATA.filter(
      (playbook) => !existingIds.has(playbook.playbookId),
    ).length;
    const updatedCount = PLAYBOOK_SEED_DATA.length - createdCount;

    return {
      createdCount,
      updatedCount,
      total: PLAYBOOK_SEED_DATA.length,
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
