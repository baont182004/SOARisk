import { Controller, Get, Param } from '@nestjs/common';

import { NormalizedAlertsService } from './normalized-alerts.service';

@Controller('normalized-alerts')
export class NormalizedAlertsController {
  constructor(private readonly normalizedAlertsService: NormalizedAlertsService) {}

  @Get()
  findAll() {
    return this.normalizedAlertsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.normalizedAlertsService.findOne(id);
  }
}
