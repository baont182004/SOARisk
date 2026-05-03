import { Module } from '@nestjs/common';

import { AlertsModule } from '../alerts/alerts.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AlertsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
