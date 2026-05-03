import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NormalizedAlert, NormalizedAlertSchema } from './normalized-alert.schema';
import { NormalizedAlertsController } from './normalized-alerts.controller';
import { NormalizedAlertsService } from './normalized-alerts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NormalizedAlert.name, schema: NormalizedAlertSchema }]),
  ],
  controllers: [NormalizedAlertsController],
  providers: [NormalizedAlertsService],
  exports: [NormalizedAlertsService],
})
export class NormalizedAlertsModule {}
