import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { GenerateRecommendationQueryDto } from './dto/generate-recommendation-query.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('from-normalized/:normalizedAlertId')
  generateFromNormalized(
    @Param('normalizedAlertId') normalizedAlertId: string,
    @Query() query: GenerateRecommendationQueryDto,
  ) {
    return this.recommendationsService.generateFromNormalized(normalizedAlertId, query);
  }

  @Get()
  findAll(@Query() query: QueryRecommendationsDto) {
    return this.recommendationsService.findAll(query);
  }

  @Get(':recommendationId')
  findOne(@Param('recommendationId') recommendationId: string) {
    return this.recommendationsService.findOne(recommendationId);
  }

  @Post(':recommendationId/select/:playbookId')
  selectPlaybook(
    @Param('recommendationId') recommendationId: string,
    @Param('playbookId') playbookId: string,
  ) {
    return this.recommendationsService.selectPlaybook(recommendationId, playbookId);
  }
}
