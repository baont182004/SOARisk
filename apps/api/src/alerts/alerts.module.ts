import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { RawAlert, RawAlertSchema } from './raw-alert.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RawAlert.name, schema: RawAlertSchema }])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
