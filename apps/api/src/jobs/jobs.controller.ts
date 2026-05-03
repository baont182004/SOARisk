import { Controller, Get, Param, Post } from '@nestjs/common';

import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Post('normalize-alert/:alertId')
  enqueueAlertNormalization(@Param('alertId') alertId: string) {
    return this.jobsService.enqueueAlertNormalization(alertId);
  }
}
