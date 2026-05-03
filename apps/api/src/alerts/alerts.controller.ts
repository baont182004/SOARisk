import { Controller, Get, Post } from '@nestjs/common';

import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }

  @Post('mock')
  createMock() {
    return this.alertsService.createMock();
  }
}
