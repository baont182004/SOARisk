import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ApprovalRequest,
  ApprovalRequestSchema,
} from '../approvals/approval-request.schema';
import { ExplanationsModule } from '../explanations/explanations.module';
import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { PcapDemoModule } from '../pcap-demo/pcap-demo.module';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
    PcapDemoModule,
    PlaybooksModule,
    NormalizedAlertsModule,
    RecommendationsModule,
    ExplanationsModule,
    WorkflowsModule,
  ],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
