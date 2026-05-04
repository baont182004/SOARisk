import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { GenerateExplanationQueryDto } from './dto/generate-explanation-query.dto';
import { QueryExplanationsDto } from './dto/query-explanations.dto';
import { ExplanationsService } from './explanations.service';

@Controller('explanations')
export class ExplanationsController {
  constructor(private readonly explanationsService: ExplanationsService) {}

  @Post('from-recommendation/:recommendationId')
  generateFromRecommendation(
    @Param('recommendationId') recommendationId: string,
    @Query() query: GenerateExplanationQueryDto,
  ) {
    return this.explanationsService.generateFromRecommendation(recommendationId, query);
  }

  @Get()
  findAll(@Query() query: QueryExplanationsDto) {
    return this.explanationsService.findAll(query);
  }

  @Get('by-recommendation/:recommendationId')
  findByRecommendation(@Param('recommendationId') recommendationId: string) {
    return this.explanationsService.findByRecommendation(recommendationId);
  }

  @Get(':explanationId')
  findOne(@Param('explanationId') explanationId: string) {
    return this.explanationsService.findOne(explanationId);
  }
}
