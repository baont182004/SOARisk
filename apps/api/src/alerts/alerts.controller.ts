import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateRawAlertDto } from './dto/create-raw-alert.dto';
import { QueryRawAlertsDto } from './dto/query-raw-alerts.dto';
import type { RawAlertMockScenario } from './raw-alert-mock.factory';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() dto: CreateRawAlertDto) {
    return this.alertsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryRawAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('raw')
  findRaw(@Query() query: QueryRawAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get(':alertId')
  findOne(@Param('alertId') alertId: string) {
    return this.alertsService.findOne(alertId);
  }

  @Post('mock')
  createMock() {
    return this.alertsService.createMock();
  }

  @Post('mock/:scenario')
  createMockScenario(@Param('scenario') scenario: RawAlertMockScenario) {
    return this.alertsService.createMockScenario(scenario);
  }
}
