import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NormalizedAlertsModule } from '../normalized-alerts/normalized-alerts.module';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ExplanationsController } from './explanations.controller';
import { ExplanationsService } from './explanations.service';
import {
  RecommendationExplanation,
  RecommendationExplanationSchema,
} from './explanation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RecommendationExplanation.name,
        schema: RecommendationExplanationSchema,
      },
    ]),
    RecommendationsModule,
    NormalizedAlertsModule,
    PlaybooksModule,
  ],
  controllers: [ExplanationsController],
  providers: [ExplanationsService],
  exports: [ExplanationsService],
})
export class ExplanationsModule {}
