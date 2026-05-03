import { Controller, Get, Post } from '@nestjs/common';

import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Post('mock')
  createMock() {
    return this.reportsService.createMock();
  }
}
