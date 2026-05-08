import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AlertSource,
  PcapFileStatus,
  PcapJobStatus,
  RAW_ALERT_MOCK_SCENARIOS,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { AlertsService } from '../alerts/alerts.service';
import {
  RAW_ALERT_MOCK_PAYLOADS,
  type RawAlertMockScenario,
} from '../alerts/raw-alert-mock.factory';
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
    private readonly alertsService: AlertsService,
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

  async generateScenarioAlert(scenario: RawAlertMockScenario) {
    const basePayload = RAW_ALERT_MOCK_PAYLOADS[scenario];

    if (!basePayload) {
      throw new BadRequestException(
        `Unsupported PCAP demo scenario '${scenario}'. Supported scenarios: ${RAW_ALERT_MOCK_SCENARIOS.join(', ')}`,
      );
    }

    const file = await this.pcapFileModel.create({
      ...createMockPcapFile(),
      filename: `${scenario}-${Date.now()}.pcap`,
      originalName: `${scenario}.pcap`,
      status: PcapFileStatus.PROCESSED,
    });
    const job = await this.pcapJobModel.create({
      ...createMockPcapJob(file.fileId),
      status: PcapJobStatus.COMPLETED,
      message: `Demo PCAP scenario '${scenario}' generated one raw alert. No packet inspection or IDS detection was executed.`,
      completedAt: new Date(),
    });
    const alert = await this.alertsService.createRawAlertDocument({
      ...basePayload,
      source: AlertSource.PCAP_DEMO,
      sourceAlertId: `PCAP-${scenario}-${Date.now()}`,
      tags: [...(basePayload.tags ?? []), 'pcap-demo'],
      rawPayload: {
        ...(basePayload.rawPayload ?? {}),
        pcapScenario: scenario,
        pcapFileId: file.fileId,
        pcapJobId: job.jobId,
        note: 'Synthetic alert emitted by the PCAP demo module for SOAR workflow evaluation.',
      },
    });

    return createSuccessResponse(
      'PCAP demo scenario converted into a raw alert for the SOAR pipeline.',
      {
        scenario,
        supportedScenarios: RAW_ALERT_MOCK_SCENARIOS,
        file: file.toObject(),
        job: job.toObject(),
        rawAlert: alert.toObject(),
      },
    );
  }
}
