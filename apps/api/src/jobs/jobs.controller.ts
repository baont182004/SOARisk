import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { GenerateExplanationQueryDto } from '../explanations/dto/generate-explanation-query.dto';
import { NormalizeAlertQueryDto } from '../normalized-alerts/dto/normalize-alert-query.dto';
import { GenerateRecommendationQueryDto } from '../recommendations/dto/generate-recommendation-query.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get('normalize-alert/by-alert/:alertId')
  findAlertNormalizationJobByAlertId(@Param('alertId') alertId: string) {
    return this.jobsService.findAlertNormalizationJobByAlertId(alertId);
  }

  @Get('normalize-alert/:jobId')
  findAlertNormalizationJob(@Param('jobId') jobId: string) {
    return this.jobsService.findAlertNormalizationJob(jobId);
  }

  @Get(':queueName/:jobId')
  findQueueJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    return this.jobsService.findQueueJob(queueName, jobId);
  }

  @Post('normalize-alert/:alertId')
  enqueueAlertNormalization(
    @Param('alertId') alertId: string,
    @Query() query: NormalizeAlertQueryDto,
  ) {
    return this.jobsService.enqueueAlertNormalization(alertId, query);
  }

  @Post('recommend-playbooks/:normalizedAlertId')
  enqueuePlaybookRecommendation(
    @Param('normalizedAlertId') normalizedAlertId: string,
    @Query() query: GenerateRecommendationQueryDto,
  ) {
    return this.jobsService.enqueuePlaybookRecommendation(normalizedAlertId, query);
  }

  @Post('generate-explanation/:recommendationId')
  enqueueRecommendationExplanation(
    @Param('recommendationId') recommendationId: string,
    @Query() query: GenerateExplanationQueryDto,
  ) {
    return this.jobsService.enqueueRecommendationExplanation(recommendationId, query);
  }

  @Post('start-workflow/:executionId')
  enqueueWorkflowStart(@Param('executionId') executionId: string) {
    return this.jobsService.enqueueWorkflowStart(executionId);
  }

  @Post('generate-report/:executionId')
  enqueueReportGeneration(@Param('executionId') executionId: string) {
    return this.jobsService.enqueueReportGeneration(executionId);
  }
}
