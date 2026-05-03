import { Controller, Get, Post } from '@nestjs/common';

import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll() {
    return this.recommendationsService.findAll();
  }

  @Post('mock')
  createMock() {
    return this.recommendationsService.createMock();
  }
}
