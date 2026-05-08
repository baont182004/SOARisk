import { BadRequestException, Controller, Get, Param, Post } from '@nestjs/common';

import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':reportId')
  findOne(@Param('reportId') reportId: string) {
    return this.reportsService.findOne(reportId);
  }

  @Get(':reportId/export/:format')
  exportReport(
    @Param('reportId') reportId: string,
    @Param('format') format: string,
  ) {
    if (format !== 'markdown' && format !== 'html') {
      throw new BadRequestException('Supported report export formats: markdown, html.');
    }

    return this.reportsService.exportReport(reportId, format);
  }

  @Post('from-workflow/:executionId')
  generateFromWorkflow(@Param('executionId') executionId: string) {
    return this.reportsService.generateFromWorkflowExecutionId(executionId);
  }

  @Post('mock')
  createMock() {
    return this.reportsService.createMock();
  }
}
