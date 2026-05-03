import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Recommendation, RecommendationSchema } from './recommendation.schema';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recommendation.name, schema: RecommendationSchema }]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
