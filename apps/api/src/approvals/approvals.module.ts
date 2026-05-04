import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WorkflowsModule } from '../workflows/workflows.module';
import { ApprovalRequest, ApprovalRequestSchema } from './approval-request.schema';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
    ]),
    WorkflowsModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
