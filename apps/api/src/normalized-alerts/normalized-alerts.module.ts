import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsModule } from '../alerts/alerts.module';
import { NormalizedAlert, NormalizedAlertSchema } from './normalized-alert.schema';
import { NormalizationService } from './normalization.service';
import { NormalizedAlertsController } from './normalized-alerts.controller';
import { NormalizedAlertsService } from './normalized-alerts.service';

@Module({
  imports: [
    AlertsModule,
    MongooseModule.forFeature([{ name: NormalizedAlert.name, schema: NormalizedAlertSchema }]),
  ],
  controllers: [NormalizedAlertsController],
  providers: [NormalizedAlertsService, NormalizationService],
  exports: [NormalizedAlertsService],
})
export class NormalizedAlertsModule {}
