import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { createCollectionMeta, createSuccessResponse } from '../common/api-response.util';
import { createMockPcapFile, createMockPcapJob } from '../common/mock-data';
import { PcapFile } from './pcap-file.schema';
import { PcapJob } from './pcap-job.schema';

@Injectable()
export class PcapDemoService {
  constructor(
    @InjectModel(PcapFile.name)
    private readonly pcapFileModel: Model<PcapFile>,
    @InjectModel(PcapJob.name)
    private readonly pcapJobModel: Model<PcapJob>,
  ) {}

  // PCAP is intentionally limited to demo/test intake for generating sample alerts later.
  async uploadPlaceholder() {
    const filePayload = createMockPcapFile();
    const file = await this.pcapFileModel.create(filePayload);
    const job = await this.pcapJobModel.create(createMockPcapJob(file.fileId));

    return createSuccessResponse(
      'Placeholder PCAP demo upload accepted. PCAP remains demo-only and does not implement IDS or packet analysis logic.',
      {
        file: file.toObject(),
        job: job.toObject(),
      },
    );
  }

  async findJobs() {
    const items = await this.pcapJobModel.find().sort({ createdAt: -1 }).lean().exec();

    return createSuccessResponse(
      'PCAP demo jobs retrieved. These jobs exist only for controlled test/demo alert generation.',
      items,
      createCollectionMeta(items.length),
    );
  }
}
