import { Controller, Get, Post } from '@nestjs/common';

import { WorkflowsService } from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  findAll() {
    return this.workflowsService.findAll();
  }

  @Post('mock-start')
  mockStart() {
    return this.workflowsService.mockStart();
  }
}
