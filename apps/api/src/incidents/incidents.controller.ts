import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PaginationQueryDto } from '../common/pagination-query.dto';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post('mock')
  createMock() {
    return this.incidentsService.createMock();
  }
}
