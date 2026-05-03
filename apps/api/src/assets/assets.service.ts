import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { Asset } from './asset.schema';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<Asset>,
  ) {}

  async findAll() {
    const items = await this.assetModel.find().sort({ updatedAt: -1 }).lean().exec();

    return createSuccessResponse(
      'Assets retrieved. Asset context will later support playbook matching and prioritization.',
      items,
      createCollectionMeta(items.length),
    );
  }
}
