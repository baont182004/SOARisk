import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { NormalizeAlertQueryDto } from './dto/normalize-alert-query.dto';
import { QueryNormalizedAlertsDto } from './dto/query-normalized-alerts.dto';
import { NormalizedAlertsService } from './normalized-alerts.service';

@Controller('normalized-alerts')
export class NormalizedAlertsController {
  constructor(private readonly normalizedAlertsService: NormalizedAlertsService) {}

  @Get()
  findAll(@Query() query: QueryNormalizedAlertsDto) {
    return this.normalizedAlertsService.findAll(query);
  }

  @Get(':normalizedAlertId')
  findOne(@Param('normalizedAlertId') normalizedAlertId: string) {
    return this.normalizedAlertsService.findOne(normalizedAlertId);
  }

  @Post('from-raw/:alertId')
  normalizeFromRaw(
    @Param('alertId') alertId: string,
    @Query() query: NormalizeAlertQueryDto,
  ) {
    return this.normalizedAlertsService.normalizeFromRaw(alertId, query);
  }

  @Post('mock')
  createMock() {
    return this.normalizedAlertsService.createMock();
  }
}
