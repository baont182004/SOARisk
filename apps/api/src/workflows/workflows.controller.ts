import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateWorkflowQueryDto } from './dto/create-workflow-query.dto';
import { QueryWorkflowsDto } from './dto/query-workflows.dto';
import { WorkflowsService } from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  findAll(@Query() query: QueryWorkflowsDto) {
    return this.workflowsService.findAll(query);
  }

  @Get(':executionId')
  findOne(@Param('executionId') executionId: string) {
    return this.workflowsService.findOne(executionId);
  }

  @Get(':executionId/logs')
  findLogs(@Param('executionId') executionId: string) {
    return this.workflowsService.findLogs(executionId);
  }

  @Post('from-recommendation/:recommendationId')
  createFromRecommendation(
    @Param('recommendationId') recommendationId: string,
    @Query() query: CreateWorkflowQueryDto,
  ) {
    return this.workflowsService.createFromRecommendation(recommendationId, query);
  }

  @Post(':executionId/start')
  start(@Param('executionId') executionId: string) {
    return this.workflowsService.start(executionId);
  }

  @Post(':executionId/cancel')
  cancel(@Param('executionId') executionId: string) {
    return this.workflowsService.cancel(executionId);
  }

  @Post('mock-start')
  mockStart() {
    return this.workflowsService.mockStart();
  }
}
