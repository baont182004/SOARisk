import { Module } from '@nestjs/common';

import { AlertsModule } from '../alerts/alerts.module';
import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AlertsModule, NormalizedAlertsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
